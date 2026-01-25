import { Injectable } from "@nestjs/common";
import { FakeRepositoryBase } from "@shared/db/fakeRepository.base";
import { validateFromUnknown } from "@shared/utils/validateWith";
import { TE } from "@src/shared/functional/monads";
import {
  BookRentalFindAllQuery,
  BookRentalRepository,
} from "./bookRental.repository.port";
import { BookRental } from "../domain/bookRental.entity";
import { PaginatedQueryParams } from "@src/shared/ddd/query.base";
import { Paginated } from "@src/shared/ddd";

@Injectable()
export class FakeBookRentalRepository
  extends FakeRepositoryBase<BookRental, BookRentalFindAllQuery>
  implements BookRentalRepository
{
  constructor(private bookRepository: FakeBookRentalRepository) {
    super();
  }
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
