import { z } from "zod";

// The frontend asks for the same
export const MIN_PASSWORD_LENGTH = 4;

/** A password as a user chooses it, before it is hashed. */
export const PlainPassword = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH.toString()} caracteres`,
  );

export type PlainPassword = z.infer<typeof PlainPassword>;

/**
 * What a user stores in place of the password. Only a PasswordHasher and rows
 * read from the database make one, so a plain password can't be stored.
 */
export const PasswordHash = z.string().min(1).brand<"PasswordHash">();

export type PasswordHash = z.infer<typeof PasswordHash>;
