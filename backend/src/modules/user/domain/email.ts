import { z } from "zod";

// Lowercase, so the case used at sign-up or login doesn't matter
export const Email = z.email().transform((email) => email.toLowerCase());

export type Email = z.infer<typeof Email>;
