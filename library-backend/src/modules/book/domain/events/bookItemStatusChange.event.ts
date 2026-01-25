import { z } from "zod";

export const BOOK_ITEM_STATUS_CHANGE = "bookItem.statusChange";

export const BookItemStatusChangeEvent = z.object({
  eventKey: z.literal(BOOK_ITEM_STATUS_CHANGE),
  payload: z.object({
    id: z.string(),
    status: z.string(),
  }),
});

export type BookItemStatusChangeEvent = z.infer<
  typeof BookItemStatusChangeEvent
>;
