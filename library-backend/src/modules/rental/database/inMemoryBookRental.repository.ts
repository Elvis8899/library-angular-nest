import { Injectable } from "@nestjs/common";
import {
  BookRentalFindAllQuery,
  BookRentalRepository,
} from "@rental/database/bookRental.repository.port";
import { BookRental, RentalStatusEnum } from "@rental/domain/bookRental.entity";
import {
  bookRentalFinishedException,
  bookRentalNotAvailableException,
} from "@rental/domain/bookRental.errors";
import { O, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { InMemoryRepository } from "@shared/utils/database/inMemoryRepository.base";
import { Paginated } from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

@Injectable()
export class InMemoryBookRentalRepository
  extends InMemoryRepository<BookRental, BookRentalFindAllQuery>
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
