import { coverTypes } from "@library/contracts";
import {
  bookCoverTooLargeException,
  bookCoverTypeException,
} from "@modules/book/domain/bookInfo.errors";
import { FileType, fileTypeOf } from "@shared/storage/fileType";
import { E, FPF, O } from "@shared/utils/application/monads";

/** Where a version of a book's cover is kept (FileStorage). */
export const coverKey = (bookId: string, cover: string): string =>
  `bookCovers/${bookId}/${cover}`;

/** Where the cover a book holds is kept; none without one. */
export const storedCoverKey = (book: {
  id: string;
  cover: string | null;
}): string | null =>
  book.cover === null ? null : coverKey(book.id, book.cover);

/**
 * The type of an uploaded cover, told from its bytes: refused when the
 * upload went past the limit (`maxCoverBytes`) or isn't one of the
 * `coverTypes` images.
 */
export const coverTypeOf = (upload: {
  body: Buffer;
  truncated: boolean;
}): E.Either<Error, FileType> =>
  upload.truncated
    ? E.left(bookCoverTooLargeException())
    : FPF.pipe(
        fileTypeOf(upload.body),
        O.filter((type) => coverTypes.includes(type)),
        E.fromOption(bookCoverTypeException),
      );
