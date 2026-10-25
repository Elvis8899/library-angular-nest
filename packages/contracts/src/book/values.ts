// The books' values and rules, without Zod (the frontend's bundle takes
// them as they are)

import { FileType } from "../files.js";

/** Where a copy is: on the shelf or rented. */
export const BookItemStatus = {
  Rented: "rented",
  Available: "available",
} as const;
export type BookItemStatus =
  (typeof BookItemStatus)[keyof typeof BookItemStatus];

export const centavosPerReal = 100;

/** An amount in reais to the centavo: 12.5, not 12.345. */
export const inWholeCentavos = (amount: number) =>
  Math.abs(amount * centavosPerReal - Math.round(amount * centavosPerReal)) <
  1e-6;

/** The cover's types: photos and drawings, no PDF. */
export const coverTypes: readonly FileType[] = [
  FileType.Jpeg,
  FileType.Png,
  FileType.Webp,
  FileType.Gif,
];

/** The largest cover the API takes: 5 MB. */
export const maxCoverBytes = 5 * 1024 * 1024;

/** Where a book's cover is read from; none without one. The version in the
 * query lets the browser keep each one for good. */
export const coverPath = (book: {
  id: string;
  cover: string | null;
}): string | null =>
  book.cover === null
    ? null
    : `/v1/bookInfos/${book.id}/cover?v=${encodeURIComponent(book.cover)}`;
