import { z } from "zod";

export const BOOK_ITEM_REMOVED = "bookItem.removed";

export const BookItemRemovedEvent = z.object({
  eventKey: z.literal(BOOK_ITEM_REMOVED),
  payload: z.object({
    id: z.string(),
    bookId: z.string(),
  }),
});

export type BookItemRemovedEvent = z.infer<typeof BookItemRemovedEvent>;
