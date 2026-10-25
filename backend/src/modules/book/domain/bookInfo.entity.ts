import { BookInfoRequest } from "@library/contracts";
import { BookItem } from "@modules/book/domain/bookItem.entity";
import { Money } from "@modules/book/domain/money";
import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export const BookInfo = z
  .object({
    id: UUID,
    name: z.string().min(1),
    // The uploaded cover's version; none until one is uploaded
    cover: UUID.nullable().default(null),
    price: Money,
    bookItems: z.array(BookItem).optional().default([]),
  })
  .and(BaseDateEntity);

export type BookInfo = z.infer<typeof BookInfo>;

/** A book's details as a request gives them: its name and price. */
export const BookDetails = BookInfoRequest;
export type BookDetails = z.output<typeof BookInfoRequest>;

/** A new book: no copies (AddFirstBookItemSubscriber adds one) and no
 * cover until one is uploaded. */
export const registerBook = (
  id: UUID,
  { name, price }: BookDetails,
  now: Date,
): BookInfo => ({
  id,
  name,
  price,
  cover: null,
  bookItems: [],
  createdAt: now,
  updatedAt: now,
});

/** A book with new details; its copies and cover stay as they were. */
export const changeBookDetails =
  ({ name, price }: BookDetails, now: Date) =>
  (book: BookInfo): BookInfo => ({ ...book, name, price, updatedAt: now });
