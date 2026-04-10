import { randomUUID } from "crypto";
import {
  cloudinary,
  CldFolder,
  CLD_ACCEPTED_TYPES,
  CLD_MAX_SIZE,
  MIME_TO_RESOURCE_TYPE,
  MIME_TO_EXT,
} from "../config/cloudinary.js";

// ── Types ──────────────────────────────────────────────────

export type UploadResult = {
  url: string; // secure Cloudinary URL
  public_id: string; // used to delete / replace
  filename: string; // slugified name stored
  mimetype: string;
  size: number;
  width?: number; // only for images
  height?: number; // only for images
};

export type UploadInput = {
  buffer: Buffer;
  mimetype: string;
  originalFilename: string; // required — no unknown files
  folder: CldFolder;
  size: number;
};

// ── Errors ─────────────────────────────────────────────────

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

// ── Helpers ────────────────────────────────────────────────

function slugifyFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "") // strip extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // slugify
    .replace(/^-+|-+$/g, "") // trim dashes
    .slice(0, 60); // max 60 chars
}

function getExtension(mimetype: string, originalFilename: string): string {
  const fromFilename = originalFilename.split(".").pop()?.toLowerCase();
  const allowedExts = Object.values(MIME_TO_EXT);

  if (fromFilename && allowedExts.includes(fromFilename)) {
    return fromFilename;
  }

  const fromMime = MIME_TO_EXT[mimetype];
  if (fromMime) return fromMime;

  throw new UploadValidationError(
    `Cannot determine file extension for mimetype: ${mimetype}`,
  );
}

// ── Validation ─────────────────────────────────────────────

function validateUpload(input: UploadInput): void {
  const { mimetype, originalFilename, folder, size } = input;

  // 1. filename must exist
  if (!originalFilename?.trim()) {
    throw new UploadValidationError("File must have a valid filename.");
  }

  // 2. filename must have an extension
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(originalFilename.trim());
  if (!hasExtension) {
    throw new UploadValidationError(
      `Filename "${originalFilename}" has no file extension.`,
    );
  }

  // 3. mimetype must be accepted for this folder
  const accepted = CLD_ACCEPTED_TYPES[folder];
  if (!accepted.includes(mimetype)) {
    throw new UploadValidationError(
      `File type "${mimetype}" is not allowed in "${folder}". ` +
        `Accepted: ${accepted.join(", ")}`,
    );
  }

  // 4. size must be within limit
  const maxSize = CLD_MAX_SIZE[folder];
  if (size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    const fileMB = (size / (1024 * 1024)).toFixed(2);
    throw new UploadValidationError(
      `File size ${fileMB}MB exceeds the ${maxMB}MB limit for "${folder}".`,
    );
  }
}

// ── Upload buffer via stream ───────────────────────────────

function uploadBufferToCloudinary(
  buffer: Buffer,
  options: Parameters<typeof cloudinary.uploader.upload_stream>[0],
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result)
          return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

// ── Upload ─────────────────────────────────────────────────

export async function uploadToCloudinary(
  input: UploadInput,
): Promise<UploadResult> {
  validateUpload(input);

  const { buffer, mimetype, originalFilename, folder, size } = input;

  const safeName = slugifyFilename(originalFilename);
  const ext = getExtension(mimetype, originalFilename);
  const resourceType = MIME_TO_RESOURCE_TYPE[mimetype] ?? "raw";

  // public_id = folder/coachly-{uuid}-{safe-name}
  // extension is handled by Cloudinary automatically
  const public_id = `${folder}/coachly-${randomUUID()}-${safeName}`;

  const result = await uploadBufferToCloudinary(buffer, {
    public_id: public_id,
    resource_type: resourceType as any,
    overwrite: false,
    context: {
      original_filename: originalFilename, // stored as metadata
    },
  } as any);

  return {
    url: result.secure_url,
    public_id: result.public_id,
    filename: `coachly-${safeName}.${ext}`,
    mimetype,
    size,
    ...(resourceType === "image" && {
      width: result.width,
      height: result.height,
    }),
  };
}

// ── Delete ─────────────────────────────────────────────────

export async function deleteFromCloudinary(
  public_id: string,
  mimetype: string,
): Promise<void> {
  if (!public_id?.trim()) {
    throw new UploadValidationError("A valid public_id is required to delete.");
  }

  const resourceType = MIME_TO_RESOURCE_TYPE[mimetype] ?? "raw";

  await cloudinary.uploader.destroy(public_id, {
    resource_type: resourceType,
  });
}

// ── Replace (upload new → delete old) ─────────────────────

export async function replaceInCloudinary(
  oldPublicId: string,
  oldMimetype: string,
  input: UploadInput,
): Promise<UploadResult> {
  // upload first — old file stays safe if upload fails
  const result = await uploadToCloudinary(input);

  // delete old after successful upload
  if (oldPublicId?.trim()) {
    await deleteFromCloudinary(oldPublicId, oldMimetype).catch(() => {
      // non-fatal — log and continue
      console.warn(`[Cloudinary] Failed to delete old asset: ${oldPublicId}`);
    });
  }

  return result;
}
