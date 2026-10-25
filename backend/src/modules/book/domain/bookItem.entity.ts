import { BookItemRequest, BookItemStatus } from "@library/contracts";
import { E } from "@shared/utils/application/monads";
import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

// The values the API shares with the frontend
export { BookItemStatus } from "@library/contracts";
export const BookItem = z
  .object({
    id: UUID,
    status: z.enum(BookItemStatus).default(BookItemStatus.Available),
    bookId: UUID,
  })
  .and(BaseDateEntity);

export type BookItem = z.infer<typeof BookItem>;

// A copy can be rented or removed only while it's on the shelf
export const ensureAvailable =
  (onUnavailable: () => Error) =>
  (bookItem: BookItem): E.Either<Error, BookItem> =>
    bookItem.status === BookItemStatus.Available
      ? E.right(bookItem)
      : E.left(onUnavailable());

/** A new copy as a request asks for it: which book, and its status. */
export const BookItemInput = BookItemRequest;
export type BookItemInput = z.output<typeof BookItemRequest>;

/** A new copy of a book, on the shelf unless the request says otherwise. */
export const newBookItem = (
  id: UUID,
  { bookId, status }: BookItemInput,
  now: Date,
): BookItem => ({
  id,
  bookId,
  status: status ?? BookItemStatus.Available,
  createdAt: now,
  updatedAt: now,
});
