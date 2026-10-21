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
