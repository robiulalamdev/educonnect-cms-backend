import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { r2Client, CFFolder } from "../config/cloudflare.js";
import { env } from "../config/env.js";

export type UploadResult = {
  url: string;
  key: string;
};

export async function uploadToR2(
  buffer: Buffer,
  mimetype: string,
  folder: CFFolder,
  originalFilename?: string,
): Promise<UploadResult> {
  const ext =
    originalFilename?.split(".").pop() ?? mimetype.split("/")[1] ?? "bin";

  const safeName = originalFilename
    ? originalFilename
        .replace(/\.[^/.]+$/, "") // strip extension
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") // slugify
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) // max 60 chars
    : "file";

  // devicehub-{uuid}-{original-name}.{ext}
  // e.g. devicehub-a1b2c3-apple-logo.png
  const key = `${folder}/devicehub-${randomUUID()}-${safeName}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.CF_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    }),
  );

  return {
    key,
    url: `${env.CF_PUBLIC_URL}/${key}`,
  };
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env.CF_BUCKET_NAME,
      Key: key,
    }),
  );
}

export function extractKeyFromUrl(url: string): string {
  return url.replace(`${env.CF_PUBLIC_URL}/`, "");
}
