import { Injectable } from "@nestjs/common";
import { FakeRepositoryBase } from "@shared/db/fakeRepository.base";
import { validateFromUnknown } from "@shared/utils/validateWith";
import { BookInfo } from "../domain/bookInfo.entity";
import { BookInfoRepository } from "./bookInfo.repository.port";
import { BookItem } from "../domain/value-object/bookItem.entity";
import { A, E, FPF, O, TE } from "@src/shared/functional/monads";

@Injectable()
export class FakeBookInfoRepository
  extends FakeRepositoryBase<BookInfo>
  implements BookInfoRepository
{
  baseValidator = validateFromUnknown(BookInfo, "BookInfo");

  createBookItem: (bookItem: BookItem) => TE.TaskEither<Error, void> = (
    bookItem,
  ) =>
    FPF.pipe(
      this.dbItems,
      A.findFirst((item) => item.id === bookItem.bookId),
      O.map((book) => {
        book.bookItems = A.append(bookItem)(book.bookItems);
      }),
      TE.of,
      TE.asUnit,
    );

  findBookItemById: (
    bookItemId: string,
  ) => TE.TaskEither<Error, O.Option<BookItem>> = (bookItemId) =>
    FPF.pipe(
      this.dbItems,
      A.findFirst(
        (item) => item.bookItems.findIndex((i) => bookItemId === i.id) >= 0,
      ),
      O.chain((book) =>
        FPF.pipe(
          book.bookItems || [],
          A.findFirst((item) => item.id === bookItemId),
          O.map(validateFromUnknown(BookItem, "BookItem")),
        ),
      ),
      O.sequence(E.Applicative),
      TE.fromEither,
    );

  deleteBookItem: (bookItemId: string) => TE.TaskEither<Error, void> = (
    bookItemId,
  ) =>
    FPF.pipe(
      this.dbItems,
      A.findFirst(
        (item) => item.bookItems.findIndex((i) => bookItemId === i.id) >= 0,
      ),
      O.chain((book) =>
        FPF.pipe(
          book.bookItems || [],
          A.findIndex((item) => item.id === bookItemId),
          O.chain((index) => A.deleteAt(index)(book.bookItems)),
          O.map((items) => (book.bookItems = items)),
        ),
      ),
      TE.of,
      TE.asUnit,
    );

  updateBookItem: (bookItem: Partial<BookItem>) => TE.TaskEither<Error, void> =
    (bookItem) =>
      FPF.pipe(
        this.dbItems,
        A.findFirst(
          (item) => item.bookItems.findIndex((i) => bookItem === i.id) >= 0,
        ),
        O.chain((book) =>
          FPF.pipe(
            book.bookItems || [],
            A.findIndex((item) => item.id === bookItem.id),

            O.chain((index) =>
              A.updateAt(index, {
                ...book.bookItems[index],
                ...bookItem,
              } as BookItem)(book.bookItems),
            ),
            O.map((bookItems) => {
              book.bookItems = bookItems;
            }),
          ),
        ),
        TE.of,
        TE.asUnit,
      );
}
