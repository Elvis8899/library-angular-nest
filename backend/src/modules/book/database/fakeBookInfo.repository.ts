import {
  BookInfoFindAllQuery,
  BookInfoRepository,
} from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { bookCoverChangedException } from "@modules/book/domain/bookInfo.errors";
import { BookItem, BookItemStatus } from "@modules/book/domain/bookItem.entity";
import { Injectable } from "@nestjs/common";
import { D, FPF, M, O, Ord, S, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepository } from "@shared/utils/database/fakeRepository.base";
import { Paginated } from "@shared/utils/database/repository.port";
import { validateMaybeRow } from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";
import { unknownException } from "@shared/utils/domain/shared.errors";

// What Prisma answers for a row a write needs and doesn't find
const missing = (model: string, id: string) =>
  unknownException(new Error(`No ${model} ${id}`));

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
    const byField: Ord.Ord<BookInfo> =
      sort.by === "name"
        ? FPF.pipe(
            S.Ord,
            Ord.contramap((book: BookInfo) => book.name),
          )
        : FPF.pipe(
            D.Ord,
            Ord.contramap((book: BookInfo) => book.createdAt),
          );
    const byId = FPF.pipe(
      S.Ord,
      Ord.contramap((book: BookInfo) => book.id),
    );
    // id breaks ties in both directions, like the real repository
    const order = M.concatAll(Ord.getMonoid<BookInfo>())([
      sort.order === "asc" ? byField : Ord.reverse(byField),
      byId,
    ]);
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

  /** As the Prisma upsert: the book's copies are its own rows, which a save
   * keeps (a new book starts with none), and so is its cover
   * (changeCover). */
  override save = (
    row: Partial<BookInfo> & Pick<BookInfo, "id">,
  ): TE.TaskEither<Error, void> => {
    const stored = this.rows.get(row.id);
    // A partial merged into the stored row; reads validate it
    const book: BookInfo = FPF.unsafeCoerce({ ...stored, ...row });
    this.rows.set(book.id, {
      ...book,
      cover: stored ? stored.cover : book.cover,
      bookItems: stored?.bookItems ?? [],
    });
    return TE.of(undefined);
  };

  /** As the Prisma conditional update. */
  changeCover = (
    bookId: string,
    from: string | null,
    to: string | null,
  ): TE.TaskEither<Error, void> => {
    const book = this.rows.get(bookId);
    if (book?.cover !== from) return TE.left(bookCoverChangedException());
    this.rows.set(bookId, { ...book, cover: to });
    return TE.of(undefined);
  };

  /** As Prisma's delete, which fails on a row that isn't there. */
  override deleteById = (id: string): TE.TaskEither<Error, void> =>
    this.rows.delete(id) ? TE.of(undefined) : TE.left(missing("BookInfo", id));

  /** A copy of a book that isn't there breaks the foreign key, and a copy
   * id already taken the primary key. */
  createBookItem = (bookItem: BookItem): TE.TaskEither<Error, void> => {
    const book = this.rows.get(bookItem.bookId);
    if (!book) return TE.left(missing("BookInfo", bookItem.bookId));
    if (O.isSome(this.bookHoldingItem(bookItem.id)))
      return TE.left(
        unknownException(new Error(`BookItem ${bookItem.id} exists`)),
      );
    book.bookItems = [...book.bookItems, bookItem];
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

  /** What the rental fake writes in its "transaction", as the Prisma rental
   * repository updates the copy's row: the copy's status, when it still is
   * `from` (false when it isn't, or the copy isn't there). */
  changeBookItemStatus = (
    bookItemId: string,
    from: BookItemStatus,
    to: BookItemStatus,
  ): boolean => {
    const item = O.toUndefined(
      this.bookHoldingItem(bookItemId),
    )?.bookItems.find(({ id }) => id === bookItemId);
    if (item?.status !== from) return false;
    item.status = to;
    return true;
  };

  deleteBookItem = (bookItemId: string): TE.TaskEither<Error, void> => {
    const book = O.toUndefined(this.bookHoldingItem(bookItemId));
    if (!book) return TE.left(missing("BookItem", bookItemId));
    book.bookItems = book.bookItems.filter((i) => i.id !== bookItemId);
    return TE.of(undefined);
  };
}
