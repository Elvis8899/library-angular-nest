import { z } from "zod";

export const BOOK_RENTAL_RENTED = "bookRental.rented";

export const BookRentalRentedEvent = z.object({
  eventKey: z.literal(BOOK_RENTAL_RENTED),
  payload: z.object({
    id: z.string(),
    bookItemId: z.string(),
  }),
});

export type BookRentalRentedEvent = z.infer<typeof BookRentalRentedEvent>;
