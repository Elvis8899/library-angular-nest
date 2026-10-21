import { z } from "zod";

const CENTS_PER_REAL = 100;

export const toCents = (amount: number) => Math.round(amount * CENTS_PER_REAL);
export const fromCents = (cents: number) => cents / CENTS_PER_REAL;

// Rounds a computed amount, like a fine, to the centavo
export const roundToCentavo = (amount: number) => fromCents(toCents(amount));

// An amount in reais, to the centavo: 12.5, not 12.345
export const Money = z
  .number()
  .min(0)
  .refine(
    (amount) => Math.abs(amount * CENTS_PER_REAL - toCents(amount)) < 1e-6,
    "Valor com mais de duas casas decimais",
  );

export type Money = z.infer<typeof Money>;
