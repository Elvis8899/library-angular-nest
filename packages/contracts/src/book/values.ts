// The books' values and rules, without Zod (the frontend's bundle takes
// them as they are)

/** Where a copy is: on the shelf or rented. */
export const BookItemStatus = {
  Rented: "rented",
  Available: "available",
} as const;
export type BookItemStatus =
  (typeof BookItemStatus)[keyof typeof BookItemStatus];

export const centavosPerReal = 100;

/** An amount in reais to the centavo: 12.5, not 12.345. */
export const inWholeCentavos = (amount: number) =>
  Math.abs(amount * centavosPerReal - Math.round(amount * centavosPerReal)) <
  1e-6;
