import { DocumentType } from "@modules/user/domain/document";
import { Email } from "@modules/user/domain/email";
import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export enum UserRoleEnum {
  Admin = "admin",
  Client = "client",
}

export const User = z
  .object({
    id: UUID,
    name: z.string().min(1),
    email: Email,
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
