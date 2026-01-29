import { Injectable } from "@nestjs/common";
import {
  BookRentalFindAllQuery,
  BookRentalRepository,
} from "@rental/database/bookRental.repository.port";
import { BookRental } from "@rental/domain/bookRental.entity";
import { TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepositoryBase } from "@shared/utils/database/fakeRepository.base";
import { Paginated } from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

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
