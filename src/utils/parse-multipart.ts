import { FastifyRequest } from "fastify";
import {
  CLD_ACCEPTED_TYPES,
  CLD_MAX_SIZE,
  CldFolder,
} from "../config/cloudinary.js";

// ── Types ──────────────────────────────────────────────────

export type ParsedFile = {
  buffer: Buffer;
  mimetype: string;
  filename: string;
  fieldname: string;
  size: number;
};

export type ParsedMultipart = {
  fields: Record<string, any>;
  file: ParsedFile | undefined; // convenience: first file
  files: Record<string, ParsedFile[]>; // all files keyed by fieldname
};

// ── Field rule — defines what a named file field expects ──

export type FileFieldRule = {
  folder: CldFolder; // used to resolve accepted types + max size
  maxCount: number; // max number of files for this fieldname
  required?: boolean; // throw if field is missing entirely
};

export type MultipartOptions = {
  // only these fieldnames are accepted for files
  // any file with a fieldname not listed here will be rejected
  allowedFileFields: Record<string, FileFieldRule>;
};

// ── Errors ─────────────────────────────────────────────────

export class MultipartValidationError extends Error {
  public readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "MultipartValidationError";
    this.field = field;
  }
}

// ── Helpers ────────────────────────────────────────────────

function validateFilename(filename: string, fieldname: string): void {
  if (!filename?.trim()) {
    throw new MultipartValidationError(
      fieldname,
      `File in field "${fieldname}" must have a filename.`,
    );
  }

  const hasExtension = /\.[a-zA-Z0-9]+$/.test(filename.trim());
  if (!hasExtension) {
    throw new MultipartValidationError(
      fieldname,
      `File "${filename}" in field "${fieldname}" has no file extension.`,
    );
  }
}

function validateMimetype(
  mimetype: string,
  filename: string,
  fieldname: string,
  folder: CldFolder,
): void {
  const accepted = CLD_ACCEPTED_TYPES[folder];
  if (!accepted.includes(mimetype)) {
    throw new MultipartValidationError(
      fieldname,
      `File "${filename}" in field "${fieldname}" has unsupported type "${mimetype}". ` +
        `Accepted: ${accepted.join(", ")}`,
    );
  }
}

function validateSize(
  size: number,
  filename: string,
  fieldname: string,
  folder: CldFolder,
): void {
  const maxSize = CLD_MAX_SIZE[folder];
  if (size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    const fileMB = (size / (1024 * 1024)).toFixed(2);
    throw new MultipartValidationError(
      fieldname,
      `File "${filename}" in field "${fieldname}" is ${fileMB}MB. ` +
        `Max allowed is ${maxMB}MB.`,
    );
  }
}

function validateMaxCount(
  current: number,
  max: number,
  fieldname: string,
): void {
  if (current > max) {
    throw new MultipartValidationError(
      fieldname,
      `Field "${fieldname}" allows max ${max} file(s). Got ${current}.`,
    );
  }
}

// ── Main parser ────────────────────────────────────────────

export async function parseMultipart(
  req: FastifyRequest,
  options: MultipartOptions,
): Promise<ParsedMultipart> {
  const fields: Record<string, any> = {};
  const files: Record<string, ParsedFile[]> = {};

  const isMultipart = (req as any).isMultipart?.() ?? false;

  // Not a multipart request (e.g. JSON body) — use the parsed body directly.
  if (!isMultipart) {
    const body = (req.body ?? {}) as Record<string, any>;
    return { fields: body, file: undefined, files };
  }

  const parts = req.parts();

  for await (const part of parts) {
    if (part.type === "file") {
      const { fieldname, mimetype, filename } = part;

      // ── 1. Reject unknown file fields immediately ──────
      const rule = options.allowedFileFields[fieldname];
      if (!rule) {
        // drain the stream to avoid hanging connection
        await part.toBuffer();
        throw new MultipartValidationError(
          fieldname,
          `Unknown file field "${fieldname}". Not accepted.`,
        );
      }

      // ── 2. Validate filename ───────────────────────────
      validateFilename(filename, fieldname);

      // ── 3. Read buffer ─────────────────────────────────
      const buffer = await part.toBuffer();
      const size = buffer.length;

      // ── 4. Validate mimetype ───────────────────────────
      validateMimetype(mimetype, filename, fieldname, rule.folder);

      // ── 5. Validate size ───────────────────────────────
      validateSize(size, filename, fieldname, rule.folder);

      // ── 6. Build parsed file ───────────────────────────
      const parsed: ParsedFile = {
        buffer,
        mimetype,
        filename,
        fieldname,
        size,
      };

      if (!files[fieldname]) files[fieldname] = [];
      files[fieldname].push(parsed);

      // ── 7. Validate max count per field ───────────────
      validateMaxCount(files[fieldname].length, rule.maxCount, fieldname);
    } else if (part.type === "field") {
      // parse JSON fields gracefully
      try {
        fields[part.fieldname] = JSON.parse(part.value as string);
      } catch {
        fields[part.fieldname] = part.value;
      }
    }
  }

  // ── 8. Check required file fields ─────────────────────
  for (const [fieldname, rule] of Object.entries(options.allowedFileFields)) {
    if (rule.required && !files[fieldname]?.length) {
      throw new MultipartValidationError(
        fieldname,
        `File field "${fieldname}" is required.`,
      );
    }
  }

  // convenience: first file across all fields
  const firstFile = Object.values(files)[0]?.[0];

  return { fields, file: firstFile, files };
}
