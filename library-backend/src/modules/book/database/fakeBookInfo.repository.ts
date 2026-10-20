import {
  BookInfoFindAllQuery,
  BookInfoRepository,
} from "@book/database/bookInfo.repository.port";
import { BookInfo } from "@book/domain/bookInfo.entity";
import { BookItem } from "@book/domain/valueObject/bookItem.entity";
import { Injectable } from "@nestjs/common";
import { O, Ord, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepository } from "@shared/utils/database/fakeRepository.base";
import { Paginated } from "@shared/utils/database/repository.port";
import { validateMaybeRow } from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

const compareBy =
  (key: (book: BookInfo) => string | number) =>
  (a: BookInfo, b: BookInfo): number =>
    key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;

@Injectable()
export class FakeBookInfoRepository
  extends FakeRepository<BookInfo, BookInfoFindAllQuery>
  implements BookInfoRepository
{
  protected readonly validate = validateFromUnknown(BookInfo, "BookInfo");

  private validateItem = validateFromUnknown(BookItem, "BookItem");

  findAllPaginated = (
    params: PaginatedQueryParams<BookInfoFindAllQuery>,
  ): TE.TaskEither<Error, Paginated<BookInfo>> => {
    const { createdFrom, createdBefore, sort } = params.query;
    const name = params.query.name?.toLowerCase();
    const byField = compareBy((book) =>
      sort.by === "name" ? book.name : book.createdAt.getTime(),
    );
    const direction = sort.order === "asc" ? 1 : -1;
    // id breaks ties in both directions, like the real repository
    const order = Ord.fromCompare<BookInfo>(
      (a, b) =>
        (direction * byField(a, b) || compareBy((book) => book.id)(a, b)) as
          -1 | 0 | 1,
    );
    return this.pageOf(
      (book) =>
        (!name || book.name.toLowerCase().includes(name)) &&
        (!createdFrom || book.createdAt >= createdFrom) &&
        (!createdBefore || book.createdAt < createdBefore),
      order,
    )(params);
  };

  private bookHoldingItem = (bookItemId: string) =>
    this.first((book) => book.bookItems.some((i) => i.id === bookItemId));

  createBookItem = (bookItem: BookItem): TE.TaskEither<Error, void> => {
    const book = this.rows.get(bookItem.bookId);
    if (book) book.bookItems = [...book.bookItems, bookItem];
    return TE.of(undefined);
  };

  findBookItemById = (
    bookItemId: string,
  ): TE.TaskEither<Error, O.Option<BookItem>> => {
    const item = O.toUndefined(
      this.bookHoldingItem(bookItemId),
    )?.bookItems.find((i) => i.id === bookItemId);
    return TE.fromEither(validateMaybeRow(this.validateItem)(item));
  };

  deleteBookItem = (bookItemId: string): TE.TaskEither<Error, void> => {
    const book = O.toUndefined(this.bookHoldingItem(bookItemId));
    if (book)
      book.bookItems = book.bookItems.filter((i) => i.id !== bookItemId);
    return TE.of(undefined);
  };
}
