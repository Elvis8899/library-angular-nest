import {
  coverTypes,
  maxCoverBytes,
  type BookInfo,
  type BookItem,
} from "@library/contracts";

// The API's shapes and values, under the names the screens use
export { BookItemStatus, coverPath, coverTypes } from "@library/contracts";
export type BookEntity = BookInfo;

export interface BookQuery {
  name?: string;
  // The day picked in the date filter, at local midnight
  createdAt?: Date | null;
}

/** Shown for a book without a cover, or while it loads. */
export const noCoverImage = "images/no-image.png";

/** What the API would refuse in a picked cover (its type as the browser
 * names it, which the API checks again from the bytes), or none. */
export const coverProblem = (file: File): "type" | "size" | null => {
  if (!coverTypes.some((type) => type === file.type)) return "type";
  return file.size > maxCoverBytes ? "size" : null;
};
