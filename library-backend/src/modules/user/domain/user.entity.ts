import { BaseDateEntity } from "@src/shared/db/dateEntity.base";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { z } from "zod";
import { DocumentType } from "./value-object/document";

export enum UserRoleEnum {
  Admin = "admin",
  Client = "client",
}

export const User = z
  .object({
    id: UUID,
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string(),
    cpf: DocumentType.optional().default("").or(z.literal("")),
    role: z.nativeEnum(UserRoleEnum),
  })
  .merge(BaseDateEntity)
  .refine((user) => {
    return (
      user.role === UserRoleEnum.Admin ||
      (user.role === UserRoleEnum.Client && user.cpf)
    );
  }, "CPF ou CNPJ inválido");

export type User = z.infer<typeof User>;
