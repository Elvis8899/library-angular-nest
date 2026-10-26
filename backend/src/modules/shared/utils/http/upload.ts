import "@fastify/multipart";
import { Multipart } from "@fastify/multipart";
import { UnprocessableEntityException } from "@nestjs/common";
import { FastifyRequest } from "fastify";

/** A multipart request's file, read up to the limit. */
export type Upload = {
  // The text fields sent before the file
  fields: Record<string, string>;
  name: string;
  body: Buffer;
  // It went past the limit; `body` holds only the start
  truncated: boolean;
};

const isPart = (part: Multipart | undefined): part is Multipart =>
  part !== undefined;

/**
 * Reads the request's one file (multipart/form-data, any field name), up
 * to `maxBytes`. The rules refuse a truncated one with their own error; a
 * request without a file is a 422, like an input that fails its schema.
 */
export const readUpload = async (
  request: FastifyRequest,
  maxBytes: number,
): Promise<Upload> => {
  const file = await request
    .file({
      limits: { fileSize: maxBytes, files: 1, fields: 10 },
      throwFileSizeLimit: false,
    })
    // Not multipart
    .catch(() => undefined);
  if (file === undefined)
    throw new UnprocessableEntityException(
      "Envie um arquivo (multipart/form-data).",
    );
  const body = await file.toBuffer();
  return {
    fields: Object.fromEntries(
      Object.values(file.fields)
        .flat()
        .filter(isPart)
        .flatMap((part) =>
          part.type === "field"
            ? [[part.fieldname, String(part.value)] as const]
            : [],
        ),
    ),
    name: file.filename,
    body,
    truncated: file.file.truncated,
  };
};
