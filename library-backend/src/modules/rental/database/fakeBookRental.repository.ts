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
import { Injectable } from "@nestjs/common";
import { O, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepository } from "@shared/utils/database/fakeRepository.base";
import { Paginated } from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

@Injectable()
export class FakeBookRentalRepository
  extends FakeRepository<BookRental, BookRentalFindAllQuery>
  implements BookRentalRepository
{
  protected readonly validate = validateFromUnknown(BookRental, "BookRental");

  findAllPaginated = (
    params: PaginatedQueryParams<BookRentalFindAllQuery>,
  ): TE.TaskEither<Error, Paginated<BookRental>> => {
    const { status, userId } = params.query;
    return this.pageOf(
      (rental) =>
        (!status || rental.rentalStatus === status) &&
        (!userId || rental.userId === userId),
    )(params);
  };

  private isOpen = (rental: BookRental) =>
    rental.rentalStatus === RentalStatusEnum.Rented;

  rent = (bookRental: BookRental): TE.TaskEither<Error, void> =>
    O.isSome(
      this.first(
        (r) => r.bookItemId === bookRental.bookItemId && this.isOpen(r),
      ),
    )
      ? TE.left(bookRentalNotAvailableException())
      : this.save(bookRental);

  finish = (bookRental: BookRental): TE.TaskEither<Error, void> =>
    O.isSome(this.first((r) => r.id === bookRental.id && this.isOpen(r)))
      ? this.save({ ...bookRental, rentalStatus: RentalStatusEnum.Finished })
      : TE.left(bookRentalFinishedException());
}
