import { BaseDateEntity } from "@shared/db/dateEntity.base";
import { UUID } from "@shared/uuid/entities/uuid";
import { DocumentType } from "@user/domain/value-object/document";
import { z } from "zod";

export enum UserRoleEnum {
  Admin = "admin",
  Client = "client",
}

export const User = z
  .object({
    id: UUID,
    name: z.string().min(1),
    email: z.email(),
    password: z.string(),
    cpf: DocumentType.optional().default("").or(z.literal("")),
    role: z.enum(UserRoleEnum),
  })
  .and(BaseDateEntity)
  .refine((user) => {
    return user.role === UserRoleEnum.Admin || user.cpf;
  }, "CPF ou CNPJ inválido");

export type User = z.infer<typeof User>;
