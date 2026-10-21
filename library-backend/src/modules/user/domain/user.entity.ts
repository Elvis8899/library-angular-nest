import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/entities/uuid";
import { DocumentType } from "@user/domain/valueObject/document";
import { z } from "zod";

export enum UserRoleEnum {
  Admin = "admin",
  Client = "client",
}

export const User = z
  .object({
    id: UUID,
    name: z.string().min(1),
    // Lowercase, so the case used at sign-up doesn't matter
    email: z.email().transform((email) => email.toLowerCase()),
    password: z.string(),
    // "" for an admin without one, stored as NULL (see RealUserRepository)
    cpf: DocumentType.or(z.literal(""))
      .nullish()
      .transform((cpf) => cpf ?? ""),
    role: z.enum(UserRoleEnum),
    tokenVersion: z.number().int().min(0).default(0),
  })
  .and(BaseDateEntity)
  .refine((user) => {
    return user.role === UserRoleEnum.Admin || user.cpf;
  }, "CPF ou CNPJ inválido");

export type User = z.infer<typeof User>;
