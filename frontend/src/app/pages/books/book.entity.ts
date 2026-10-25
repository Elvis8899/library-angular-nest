import type { BookInfo, BookItem } from "@library/contracts";

// The API's shapes and values, under the names the screens use
export { BookItemStatus } from "@library/contracts";
export type BookEntity = BookInfo;
export type BookItemEntity = BookItem;

export interface BookQuery {
  name?: string;
  // The day picked in the date filter, at local midnight
  createdAt?: Date | null;
}
