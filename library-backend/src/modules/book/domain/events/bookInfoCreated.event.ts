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
