import { FastifyRequest } from "fastify";

export type ParsedFile = {
  buffer: Buffer;
  mimetype: string;
  filename: string;
  fieldname: string;
};

export type ParsedMultipart = {
  fields: Record<string, any>;
  file: ParsedFile | undefined; // single
  files: Record<string, ParsedFile[]>; // multiple keyed by fieldname
};

export async function parseMultipart(
  req: FastifyRequest,
): Promise<ParsedMultipart> {
  const fields: Record<string, any> = {};
  const files: Record<string, ParsedFile[]> = {};

  const parts = req.parts();

  for await (const part of parts) {
    if (part.type === "file") {
      const buffer = await part.toBuffer();
      const parsed: ParsedFile = {
        buffer,
        mimetype: part.mimetype,
        filename: part.filename,
        fieldname: part.fieldname,
      };
      if (!files[part.fieldname]) files[part.fieldname] = [];
      files[part.fieldname].push(parsed);
    } else if (part.type === "field") {
      try {
        fields[part.fieldname] = JSON.parse(part.value as string);
      } catch {
        fields[part.fieldname] = part.value;
      }
    }
  }

  // Convenience: first file across all fields as single
  const firstFile = Object.values(files)[0]?.[0];

  return { fields, file: firstFile, files };
}
