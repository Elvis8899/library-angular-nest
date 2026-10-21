import { E } from "@shared/utils/application/monads";
import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export enum BookItemStatusEnum {
  Rented = "rented",
  Available = "available",
}
export const BookItem = z
  .object({
    id: UUID,
    status: z.enum(BookItemStatusEnum).default(BookItemStatusEnum.Available),
    bookId: UUID,
  })
  .and(BaseDateEntity);

export type BookItem = z.infer<typeof BookItem>;

// A copy can be rented or removed only while it's on the shelf
export const ensureAvailable =
  (onUnavailable: () => Error) =>
  (bookItem: BookItem): E.Either<Error, BookItem> =>
    bookItem.status === BookItemStatusEnum.Available
      ? E.right(bookItem)
      : E.left(onUnavailable());
