import { PlainPassword } from "@library/contracts";
import { z } from "zod";

export { PlainPassword } from "@library/contracts";

export type PlainPassword = z.infer<typeof PlainPassword>;

/**
 * What a user stores in place of the password. Only a PasswordHasher and rows
 * read from the database make one, so a plain password can't be stored.
 */
export const PasswordHash = z.string().min(1).brand<"PasswordHash">();

export type PasswordHash = z.infer<typeof PasswordHash>;
