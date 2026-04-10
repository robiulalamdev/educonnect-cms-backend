import { FastifyRequest, FastifyReply } from "fastify";
import { uploadToR2 } from "../utils/cloudinary-upload.js";
import { CFFolder, CF_ACCEPTED_TYPES } from "../config/cloudflare.js";

export type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  filename: string;
  fieldname: string;
  size: number;
  url: string;
  key: string;
};

export type MultipartField =
  | { single: string }
  | { array: string; maxCount?: number };

declare module "fastify" {
  interface FastifyRequest {
    uploadedFile?: UploadedFile;
    uploadedFiles?: Record<string, UploadedFile[]>;
  }
}

export function upload(field: MultipartField, folder: CFFolder) {
  return async function multipartMiddleware(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const contentType = req.headers["content-type"] ?? "";
    if (!contentType.includes("multipart/form-data")) return;

    const acceptedTypes = CF_ACCEPTED_TYPES[folder];
    const targetField = "single" in field ? field.single : field.array;
    const maxCount = "array" in field ? (field.maxCount ?? 10) : 1;

    const fields: Record<string, any> = {};
    const rawFiles: Array<{
      fieldname: string;
      buffer: Buffer;
      mimetype: string;
      filename: string;
    }> = [];

    try {
      for await (const part of req.parts()) {
        if (part.type === "file") {
          const buffer = await part.toBuffer();

          if (buffer.length === 0) continue;

          if (part.fieldname !== targetField) continue;

          if (!acceptedTypes.includes(part.mimetype)) {
            return reply.status(400).send({
              success: false,
              message: `Invalid file type "${part.mimetype}". Accepted: ${acceptedTypes.join(", ")}`,
            });
          }

          const alreadyCollected = rawFiles.filter(
            (f) => f.fieldname === targetField,
          ).length;
          if (alreadyCollected >= maxCount) continue;

          rawFiles.push({
            fieldname: part.fieldname,
            buffer,
            mimetype: part.mimetype,
            filename: part.filename || `file-${Date.now()}`,
          });
        } else if (part.type === "field") {
          try {
            fields[part.fieldname] = JSON.parse(part.value as string);
          } catch {
            fields[part.fieldname] = part.value;
          }
        }
      }
    } catch {
      return reply
        .status(500)
        .send({ success: false, message: "Failed to parse request" });
    }

    // ── Upload all files to R2 in parallel ─────────────
    let uploadedList: UploadedFile[] = [];

    if (rawFiles.length > 0) {
      try {
        uploadedList = await Promise.all(
          rawFiles.map(async (raw) => {
            const { url, key } = await uploadToR2(
              raw.buffer,
              raw.mimetype,
              folder,
              raw.filename,
            );
            return {
              buffer: raw.buffer,
              mimetype: raw.mimetype,
              filename: raw.filename,
              fieldname: raw.fieldname,
              size: raw.buffer.length,
              url,
              key,
            };
          }),
        );
      } catch {
        return reply
          .status(500)
          .send({ success: false, message: "File upload failed" });
      }
    }

    // ── Attach to request ──────────────────────────────
    req.body = fields;

    if ("single" in field) {
      req.uploadedFile = uploadedList[0];
    }

    if ("array" in field) {
      const filesMap: Record<string, UploadedFile[]> = {};
      for (const f of uploadedList) {
        if (!filesMap[f.fieldname]) filesMap[f.fieldname] = [];
        filesMap[f.fieldname].push(f);
      }
      req.uploadedFiles = filesMap;
    }
  };
}
