import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { z } from "zod";

export const BOOK_INFO_CREATED = "bookInfo.created";

export const BookInfoCreatedEvent = z.object({
  eventKey: z.literal(BOOK_INFO_CREATED),
  payload: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type BookInfoCreatedEvent = z.infer<typeof BookInfoCreatedEvent>;

export const bookInfoCreated = (
  bookInfo: Pick<BookInfo, "id" | "name">,
): BookInfoCreatedEvent => ({
  eventKey: BOOK_INFO_CREATED,
  payload: { id: bookInfo.id, name: bookInfo.name },
});
