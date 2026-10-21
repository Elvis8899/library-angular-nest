import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { z } from "zod";

export const BOOK_INFO_DELETED = "bookInfo.deleted";

export const BookInfoDeletedEvent = z.object({
  eventKey: z.literal(BOOK_INFO_DELETED),
  payload: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type BookInfoDeletedEvent = z.infer<typeof BookInfoDeletedEvent>;

export const bookInfoDeleted = (
  bookInfo: Pick<BookInfo, "id" | "name">,
): BookInfoDeletedEvent => ({
  eventKey: BOOK_INFO_DELETED,
  payload: { id: bookInfo.id, name: bookInfo.name },
});
