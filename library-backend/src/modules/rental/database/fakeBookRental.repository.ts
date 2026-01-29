import { Injectable } from "@nestjs/common";
import {
  BookRentalFindAllQuery,
  BookRentalRepository,
} from "@rental/database/bookRental.repository.port";
import { BookRental } from "@rental/domain/bookRental.entity";
import { FakeRepositoryBase } from "@shared/db/fakeRepository.base";
import { Paginated } from "@shared/ddd";
import { PaginatedQueryParams } from "@shared/ddd/query.base";
import { TE } from "@shared/functional/monads";
import { validateFromUnknown } from "@shared/utils/validateWith";

@Injectable()
export class FakeBookRentalRepository
  extends FakeRepositoryBase<BookRental, BookRentalFindAllQuery>
  implements BookRentalRepository
{
  baseValidator = validateFromUnknown(BookRental, "baseValidator");

  findAllPaginated = (
    params: PaginatedQueryParams<BookRentalFindAllQuery>,
  ): TE.TaskEither<Error, Paginated<BookRental>> => {
    const filter = (item: BookRental) =>
      (params.query.status ? item.rentalStatus == params.query.status : true) &&
      (params.query.userId ? item.userId == params.query.userId : true);
    return this.paginatedFindMany(filter)(this.baseValidator)(params);
  };
}
