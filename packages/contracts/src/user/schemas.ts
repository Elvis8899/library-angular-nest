import { z } from "zod";
import { Id, page, Timestamp } from "../common.js";
import { contract } from "../registry.js";
import {
  formatDocument,
  isValidDocument,
  MIN_PASSWORD_LENGTH,
  UserRole,
} from "./values.js";

// Lowercase, so the case used at sign-up or login doesn't matter
export const Email = z.email().transform((email) => email.toLowerCase());

/** A password as a user chooses it, before it is hashed. */
export const PlainPassword = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH.toString()} caracteres`,
  );

// A new document must have valid check digits; none is ""
const CheckedDocument = z
  .string()
  .refine((v) => v === "" || isValidDocument(v), "CPF ou CNPJ inválido")
  .nullish()
  .transform((cpf) => (cpf ? formatDocument(cpf) : ""));

const userDetails = {
  name: z.string().min(1).describe("Nome do usuário"),
  email: Email.describe("Email do usuário"),
  cpf: CheckedDocument.describe(
    "CPF ou CNPJ do usuário, com ou sem máscara. Necessário caso seja cliente",
  ),
  role: z.enum(UserRole).describe("Papel do usuário"),
};

// Requests

export const UserRequest = contract(
  z.object({
    ...userDetails,
    password: PlainPassword.describe("Senha do usuário"),
  }),
  { id: "UserRequest", description: "Um usuário novo" },
);
export type UserRequest = z.input<typeof UserRequest>;

/** An edit: the password changes only when one is given. */
export const UserChangesRequest = contract(
  z.object({
    ...userDetails,
    password: PlainPassword.optional().describe(
      "Nova senha; sem ela, fica a atual",
    ),
  }),
  { id: "UserChangesRequest" },
);
export type UserChangesRequest = z.input<typeof UserChangesRequest>;

// Responses

export const UserResponse = contract(
  z.object({
    id: Id,
    name: z.string(),
    email: z.string(),
    cpf: z.string().describe("Com máscara; vazio para um admin sem um"),
    role: z.enum(UserRole),
    lastAccessAt: Timestamp.nullable().describe(
      "O último login ou renovação da sessão; null se nunca entrou",
    ),
    createdAt: Timestamp,
    updatedAt: Timestamp,
  }),
  { id: "UserResponse", description: "Um usuário, sem a senha" },
);
export type UserResponse = z.input<typeof UserResponse>;

export const UserPage = contract(page(UserResponse), { id: "UserPage" });
export type UserPage = z.input<typeof UserPage>;
