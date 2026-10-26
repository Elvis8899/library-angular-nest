import { UserChangesRequest, UserRequest, UserRole } from "@library/contracts";
import { DocumentType } from "@modules/user/domain/document";
import { Email } from "@modules/user/domain/email";
import { PasswordHash } from "@modules/user/domain/password";
import { userDeactivatesSelfException } from "@modules/user/domain/user.errors";
import { E, O } from "@shared/utils/application/monads";
import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

// The contracts' UserRole, under the backend's name
export const UserRoleEnum = UserRole;
export type UserRoleEnum = UserRole;

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
    active: z.boolean().default(true),
    // Auth's refresh tokens carry it, but it stays on the user: an update
    // that changes the password, email or role (endsSessions) must revoke
    // them in the same request, not later through an event
    tokenVersion: z.number().int().min(0).default(0),
    // The last login or session refresh, which auth records; null for who
    // never logged in. Saving the user leaves it as stored
    lastAccessAt: z.date().nullable().default(null),
  })
  .and(BaseDateEntity)
  .refine(hasRequiredDocument, "CPF ou CNPJ inválido");

export type User = z.infer<typeof User>;

// What an admin gives for a user. Unlike User, which also validates stored
// rows, a new document must have valid check digits (the request checks them)
export const NewUserInput = UserRequest.refine(
  hasRequiredDocument,
  "CPF ou CNPJ inválido",
);

export type NewUserInput = z.infer<typeof NewUserInput>;

/** An update: the password changes only when one is given. */
export const UserChangesInput = UserChangesRequest.refine(
  hasRequiredDocument,
  "CPF ou CNPJ inválido",
);

export type UserChangesInput = z.infer<typeof UserChangesInput>;

type UserDetails = Omit<NewUserInput, "password">;

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
  active: true,
  password,
  tokenVersion: 0,
  lastAccessAt: null,
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

/**
 * Deactivates an account instead of deleting it, so what it recorded still
 * points at it. An admin can't deactivate their own, which could leave no
 * admin to undo it.
 */
export const deactivateUser =
  (requesterId: string, now: Date) =>
  (user: User): E.Either<Error, User> =>
    user.id === requesterId
      ? E.left(userDeactivatesSelfException())
      : E.right({ ...user, active: false, updatedAt: now });

export const reactivateUser =
  (now: Date) =>
  (user: User): User => ({ ...user, active: true, updatedAt: now });
