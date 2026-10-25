import { formatDocument, normalizeDocument } from "@library/contracts";
import { z } from "zod";

// The check digits and the mask are the contracts'
export { formatDocument } from "@library/contracts";

// Lenient on purpose: also used when reading stored users, which may
// predate check digit validation. Requests check the digits (the contracts' UserRequest).
export const DocumentType = z
  .string()
  .refine((v) => {
    return [11, 14].includes(normalizeDocument(v).length);
  }, "CPF ou CNPJ inválido")
  .transform((v) => formatDocument(v));
export type DocumentType = z.infer<typeof DocumentType>;
