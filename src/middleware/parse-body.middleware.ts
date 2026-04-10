import { FastifyRequest, FastifyReply } from "fastify";

export function parseBody() {
  return async function parseBodyMiddleware(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const contentType = req.headers["content-type"] ?? "";
    if (!contentType.includes("multipart/form-data")) return;

    const fields: Record<string, any> = {};

    for await (const part of req.parts()) {
      if (part.type === "field") {
        try {
          fields[part.fieldname] = JSON.parse(part.value as string);
        } catch {
          fields[part.fieldname] = part.value;
        }
      } else if (part.type === "file") {
        // drain stream — no file handling here
        await part.toBuffer();
      }
    }

    req.body = fields;
  };
}
