import { z } from "zod";
import { Id } from "../common.js";
import { contract } from "../registry.js";
import { Email } from "../user/schemas.js";
import { UserRole } from "../user/values.js";

// Requests

export const LoginRequest = contract(
  z.object({
    email: Email.describe("Email do usuário"),
    password: z.string().min(1).describe("Senha do usuário"),
  }),
  { id: "LoginRequest" },
);
export type LoginRequest = z.input<typeof LoginRequest>;

export const RefreshTokenRequest = contract(
  z.object({
    refreshToken: z
      .string()
      .min(1)
      .describe("Token de atualização recebido no login"),
  }),
  { id: "RefreshTokenRequest" },
);
export type RefreshTokenRequest = z.input<typeof RefreshTokenRequest>;

// Responses

export const AuthResponse = contract(
  z.object({
    accessToken: z.string().describe("Token de acesso"),
    refreshToken: z.string().describe("Token de atualização"),
    user: z.object({
      id: Id,
      name: z.string(),
      email: z.string(),
      role: z.enum(UserRole),
    }),
  }),
  { id: "AuthResponse", description: "Os tokens e o usuário que entrou" },
);
export type AuthResponse = z.input<typeof AuthResponse>;
