// The users' values and rules, without Zod (the frontend's bundle takes
// them as they are)

/** What a user may do: an admin runs the library, a client rents. */
export const UserRole = {
  Admin: "admin",
  Client: "client",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** The shortest password an account takes, checked on both sides. */
export const MIN_PASSWORD_LENGTH = 4;

// CNPJs may be alphanumeric since July 2026, so letters are kept
export const normalizeDocument = (v: string) =>
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

/** A CPF or CNPJ with valid check digits, masked or not. */
export const isValidDocument = (v: string) => {
  const doc = normalizeDocument(v);
  return isValidCPF(doc) || isValidCNPJ(doc);
};

/** A CPF or CNPJ with its mask (000.000.000-00, 00.000.000/0000-00). */
export const formatDocument = (v: string) => {
  const doc = normalizeDocument(v);
  return doc.length === 14 ? cnpjMask(doc) : cpfMask(doc);
};
