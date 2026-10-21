import { BookRental } from "@modules/rental/domain/bookRental.entity";
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

export const bookRented = (
  bookRental: Pick<BookRental, "id" | "bookItemId">,
): BookRentalRentedEvent => ({
  eventKey: BOOK_RENTAL_RENTED,
  payload: { id: bookRental.id, bookItemId: bookRental.bookItemId },
});
