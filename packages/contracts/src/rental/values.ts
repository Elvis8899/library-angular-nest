// The rentals' values, without Zod (the frontend's bundle takes them as they
// are)

/** Where a rental is: the copy still out, or returned. */
export const RentalStatus = {
  Rented: "rented",
  Finished: "finished",
} as const;
export type RentalStatus = (typeof RentalStatus)[keyof typeof RentalStatus];
