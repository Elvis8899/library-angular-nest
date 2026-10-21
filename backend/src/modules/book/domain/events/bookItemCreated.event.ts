import { BookItem } from "@modules/book/domain/bookItem.entity";
import { z } from "zod";

export const BOOK_ITEM_CREATED = "bookItem.created";

export const BookItemCreatedEvent = z.object({
  eventKey: z.literal(BOOK_ITEM_CREATED),
  payload: z.object({
    id: z.string(),
    bookId: z.string(),
  }),
});

export type BookItemCreatedEvent = z.infer<typeof BookItemCreatedEvent>;

export const bookItemCreated = (
  bookItem: Pick<BookItem, "id" | "bookId">,
): BookItemCreatedEvent => ({
  eventKey: BOOK_ITEM_CREATED,
  payload: { id: bookItem.id, bookId: bookItem.bookId },
});
