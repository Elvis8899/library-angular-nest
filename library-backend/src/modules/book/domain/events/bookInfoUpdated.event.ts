import { z } from "zod";

export const BOOK_INFO_UPDATED = "bookInfo.updated";

export const BookInfoUpdatedEvent = z.object({
  eventKey: z.literal(BOOK_INFO_UPDATED),
  payload: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type BookInfoUpdatedEvent = z.infer<typeof BookInfoUpdatedEvent>;
