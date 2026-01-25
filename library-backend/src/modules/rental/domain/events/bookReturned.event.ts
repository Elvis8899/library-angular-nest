import { z } from "zod";

export const BOOK_RENTAL_RETURNED = "bookRental.returned";

export const BookRentalReturnedEvent = z.object({
  eventKey: z.literal(BOOK_RENTAL_RETURNED),
  payload: z.object({
    id: z.string(),
    bookItemId: z.string(),
  }),
});

export type BookRentalReturnedEvent = z.infer<typeof BookRentalReturnedEvent>;
