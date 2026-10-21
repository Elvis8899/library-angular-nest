import {
  CheckedDocumentType,
  DocumentType,
  formatDocument,
} from "@modules/user/domain/document";
import { Email } from "@modules/user/domain/email";
import { PasswordHash, PlainPassword } from "@modules/user/domain/password";
import { O } from "@shared/utils/application/monads";
import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export enum UserRoleEnum {
  Admin = "admin",
  Client = "client",
}

// Clients must have a CPF or CNPJ; admins may leave it empty
const hasRequiredDocument = (user: { role: UserRoleEnum; cpf: string }) =>
  user.role === UserRoleEnum.Admin || user.cpf !== "";

export const User = z
  .object({
    id: UUID,
    name: z.string().min(1),
    email: Email,
    password: PasswordHash,
    // "" for an admin without one, stored as NULL (see RealUserRepository)
    cpf: DocumentType.or(z.literal(""))
      .nullish()
      .transform((cpf) => cpf ?? ""),
    role: z.enum(UserRoleEnum),
    tokenVersion: z.number().int().min(0).default(0),
  })
  .and(BaseDateEntity)
  .refine(hasRequiredDocument, "CPF ou CNPJ inválido");

export type User = z.infer<typeof User>;

// What an admin gives for a user. Unlike User, which also validates stored
// rows, a new document must have valid check digits
const userDetails = z.object({
  name: z.string().min(1),
  email: Email,
  cpf: CheckedDocumentType.nullish().transform((cpf) =>
    cpf ? formatDocument(cpf) : "",
  ),
  role: z.enum(UserRoleEnum),
});

export const NewUserInput = userDetails
  .extend({ password: PlainPassword })
  .refine(hasRequiredDocument, "CPF ou CNPJ inválido");

export type NewUserInput = z.infer<typeof NewUserInput>;

/** An update: the password changes only when one is given. */
export const UserChangesInput = userDetails
  .extend({ password: PlainPassword.optional() })
  .refine(hasRequiredDocument, "CPF ou CNPJ inválido");

export type UserChangesInput = z.infer<typeof UserChangesInput>;

type UserDetails = z.infer<typeof userDetails>;

export const registerUser = (
  id: UUID,
  { name, email, cpf, role }: UserDetails,
  password: PasswordHash,
  now: Date,
): User => ({
  id,
  name,
  email,
  cpf,
  role,
  password,
  tokenVersion: 0,
  createdAt: now,
  updatedAt: now,
});

/** Applies an update. The id, token version and creation date stay. */
export const changeUserDetails =
  (
    { name, email, cpf, role }: UserDetails,
    password: O.Option<PasswordHash>,
    now: Date,
  ) =>
  (user: User): User => ({
    ...user,
    name,
    email,
    cpf,
    role,
    password: O.getOrElse(() => user.password)(password),
    updatedAt: now,
  });

/**
 * Whether a change must end the user's sessions: tokens carry the email and
 * role, and a new password must log everyone else out.
 */
export const endsSessions = (before: User, after: User): boolean =>
  before.password !== after.password ||
  before.email !== after.email ||
  before.role !== after.role;
