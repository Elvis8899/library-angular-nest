import { z } from "zod";

// CNPJs may be alphanumeric since July 2026, so letters are kept
const normalizeDocument = (v: string) =>
  v.toUpperCase().replace(/[^0-9A-Z]/g, "");
const cpfMask = (v: string) =>
  v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
const cnpjMask = (v: string) =>
  v.replace(
    /^([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );

// Modulo 11 check digit; characters are valued as their ASCII code - 48
const checkDigit = (base: string, weights: number[]) => {
  const sum = weights.reduce(
    (acc, weight, i) => acc + (base.charCodeAt(i) - 48) * weight,
    0,
  );
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
};

const hasValidCheckDigits = (
  doc: string,
  firstWeights: number[],
  secondWeights: number[],
) =>
  checkDigit(doc, firstWeights) === Number(doc.at(-2)) &&
  checkDigit(doc, secondWeights) === Number(doc.at(-1));

const CPF_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

const isValidCPF = (doc: string) =>
  /^\d{11}$/.test(doc) &&
  !/^(\d)\1*$/.test(doc) &&
  hasValidCheckDigits(doc, CPF_WEIGHTS, [11, ...CPF_WEIGHTS]);

const isValidCNPJ = (doc: string) =>
  /^[0-9A-Z]{12}\d{2}$/.test(doc) &&
  !/^(\d)\1*$/.test(doc) &&
  hasValidCheckDigits(doc, CNPJ_WEIGHTS, [6, ...CNPJ_WEIGHTS]);

export const isValidDocument = (v: string) => {
  const doc = normalizeDocument(v);
  return isValidCPF(doc) || isValidCNPJ(doc);
};

export const formatDocument = (v: string) => {
  const doc = normalizeDocument(v);
  return doc.length === 14 ? cnpjMask(doc) : cpfMask(doc);
};

// Lenient on purpose: also used when reading stored users, which may
// predate check digit validation. Use CheckedDocumentType for input.
export const DocumentType = z
  .string()
  .refine((v) => {
    return [11, 14].includes(normalizeDocument(v).length);
  }, "CPF ou CNPJ inválido")
  .transform((v) => formatDocument(v));
export type DocumentType = z.infer<typeof DocumentType>;

export const CheckedDocumentType = z
  .string()
  .refine((v) => v === "" || isValidDocument(v), "CPF ou CNPJ inválido");
