import { FakeBookInfoRepository } from "@modules/book/database/fakeBookInfo.repository";
import { BookItemStatus } from "@modules/book/domain/bookItem.entity";
import {
  BookRentalFindAllQuery,
  BookRentalRepository,
} from "@modules/rental/database/bookRental.repository.port";
import {
  BookRental,
  RentalStatusEnum,
} from "@modules/rental/domain/bookRental.entity";
import {
  bookRentalFinishedException,
  bookRentalNotAvailableException,
} from "@modules/rental/domain/bookRental.errors";
import { FakeUserRepository } from "@modules/user/database/fakeUser.repository";
import { Injectable } from "@nestjs/common";
import { A, D, FPF, O, Ord, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepository } from "@shared/utils/database/fakeRepository.base";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  loadPage,
  validateMaybeRow,
  validateRows,
} from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";
import { unknownException } from "@shared/utils/domain/shared.errors";

// Newest first, as the Prisma repository lists them
const newestFirst: Ord.Ord<BookRental> = Ord.reverse(
  FPF.pipe(
    D.Ord,
    Ord.contramap((rental: BookRental) => rental.createdAt),
  ),
);

/**
 * The rentals in memory, over the book and user fakes, as the Prisma
 * repository is over their tables: a rental reads its book's and user's
 * names, reads leave it out once its copy, book or user is deleted (where
 * the foreign keys cascade), and `rent` and `finish` change the copy's
 * status as their transactions do.
 */
@Injectable()
export class FakeBookRentalRepository
  extends FakeRepository<BookRental, BookRentalFindAllQuery>
  implements BookRentalRepository
{
  protected readonly validate = validateFromUnknown(BookRental, "BookRental");

  constructor(
    private readonly books: FakeBookInfoRepository,
    private readonly users: FakeUserRepository,
  ) {
    super();
  }

  // A stored rental with what Prisma's include reads, or none once its copy
  // or user is gone
  private joined = (rental: BookRental) =>
    FPF.pipe(
      TE.Do,
      TE.apS("user", this.users.findById(rental.userId)),
      TE.apS("book", this.bookOfCopy(rental.bookItemId)),
      TE.map(({ user, book }) =>
        FPF.pipe(
          O.Do,
          O.apS("user", user),
          O.apS("book", book),
          O.map((found): BookRental => ({
            ...rental,
            bookItem: {
              book: { name: found.book.name, price: found.book.price },
            },
            user: { name: found.user.name },
          })),
        ),
      ),
    );

  private bookOfCopy = (bookItemId: string) =>
    FPF.pipe(
      this.books.findBookItemById(bookItemId),
      TE.chain(
        O.match(
          () => TE.of(O.none),
          (item) => this.books.findById(item.bookId),
        ),
      ),
    );

  // The rentals that match, as the database has them, newest first
  private visible = (matches: (rental: BookRental) => boolean) =>
    FPF.pipe(
      this.list(matches),
      TE.traverseSeqArray(this.joined),
      TE.map((rentals) => A.compact([...rentals]).sort(newestFirst.compare)),
    );

  override findAll = (): TE.TaskEither<Error, BookRental[]> =>
    FPF.pipe(
      this.visible(() => true),
      TE.chainEitherK(validateRows(this.validate)),
    );

  override findById = (
    id: string,
  ): TE.TaskEither<Error, O.Option<BookRental>> =>
    FPF.pipe(
      this.visible((rental) => rental.id === id),
      TE.chainEitherK((found) =>
        validateMaybeRow(this.validate)(O.toUndefined(A.head(found))),
      ),
    );

  override findAllPaginated = (
    params: PaginatedQueryParams<BookRentalFindAllQuery>,
  ): TE.TaskEither<Error, Paginated<BookRental>> => {
    const { status, userId } = params.query;
    const selected = this.visible(
      (rental) =>
        (!status || rental.rentalStatus === status) &&
        (!userId || rental.userId === userId),
    );
    return loadPage(
      {
        rows: ({ skip, take }) =>
          TE.map((rentals: BookRental[]) => rentals.slice(skip, skip + take))(
            selected,
          ),
        total: () =>
          TE.map((rentals: BookRental[]) => rentals.length)(selected),
      },
      this.validate,
    )(params);
  };

  // A rental's own columns: Prisma reads the copy and the user through it
  private stored = ({
    bookItem: _,
    user: __,
    ...rental
  }: BookRental): BookRental => rental;

  /** As the Prisma upsert: a new rental needs its copy and user (the
   * foreign keys); a saved one changes only its status and dates. */
  override save = (
    row: Partial<BookRental> & Pick<BookRental, "id">,
  ): TE.TaskEither<Error, void> => {
    const before = this.rows.get(row.id);
    // A partial merged into the stored row; reads validate it
    const rental: BookRental = FPF.unsafeCoerce({ ...before, ...row });
    if (before) {
      this.rows.set(rental.id, {
        ...before,
        rentalStatus: rental.rentalStatus,
        overdueDate: rental.overdueDate,
        deliveryDate: rental.deliveryDate,
      });
      return TE.of(undefined);
    }
    return FPF.pipe(
      this.joined(rental),
      TE.chain(
        O.match(
          () => TE.left<Error>(unknownException(new Error("No copy or user"))),
          () => {
            this.rows.set(rental.id, this.stored(rental));
            return TE.of(undefined);
          },
        ),
      ),
    );
  };

  /** As Prisma's delete, which fails on a row that isn't there. */
  override deleteById = (id: string): TE.TaskEither<Error, void> =>
    this.rows.delete(id)
      ? TE.of(undefined)
      : TE.left(unknownException(new Error(`No BookRental ${id}`)));

  /** The copy goes from available to rented, then the rental is stored; a
   * rental that can't be stored puts the copy back, as the transaction rolls
   * back. Taking the copy is one step, so of two rents at once only one
   * gets it. */
  rent = (rental: BookRental): TE.TaskEither<Error, void> =>
    FPF.pipe(
      TE.Do,
      TE.chain(() =>
        this.books.changeBookItemStatus(
          rental.bookItemId,
          BookItemStatus.Available,
          BookItemStatus.Rented,
        )
          ? TE.of(undefined)
          : TE.left(bookRentalNotAvailableException()),
      ),
      TE.chain(() =>
        FPF.pipe(
          this.save(rental),
          TE.orElse((error) => {
            this.books.changeBookItemStatus(
              rental.bookItemId,
              BookItemStatus.Rented,
              BookItemStatus.Available,
            );
            return TE.left(error);
          }),
        ),
      ),
    );

  /** The rental, still rented, is finished with its delivery date, and its
   * copy is available again. */
  finish = (rental: BookRental): TE.TaskEither<Error, void> =>
    FPF.pipe(
      TE.Do,
      TE.chain(() => {
        const before = this.rows.get(rental.id);
        if (before?.rentalStatus !== RentalStatusEnum.Rented)
          return TE.left(bookRentalFinishedException());
        this.rows.set(rental.id, {
          ...before,
          rentalStatus: RentalStatusEnum.Finished,
          deliveryDate: rental.deliveryDate,
        });
        this.books.changeBookItemStatus(
          before.bookItemId,
          BookItemStatus.Rented,
          BookItemStatus.Available,
        );
        return TE.of(undefined);
      }),
    );
}
