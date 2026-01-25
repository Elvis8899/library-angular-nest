import { O, TE } from "@shared/functional/monads";
import { Paginated, RepositoryDefaultPort } from "@shared/ddd";
import { PaginatedQueryParams } from "@src/shared/ddd/query.base";
import { BookRental, RentalStatusEnum } from "../domain/bookRental.entity";

export type BookRentalFindAllQuery = {
  userId?: string;
  status?: RentalStatusEnum;
};

export abstract class BookRentalRepository
  implements RepositoryDefaultPort<BookRental>
{
  findById!: (id: string) => TE.TaskEither<Error, O.Option<BookRental>>;
  findAll!: () => TE.TaskEither<Error, BookRental[]>;
  findAllPaginated!: (
    params: PaginatedQueryParams<BookRentalFindAllQuery>,
  ) => TE.TaskEither<Error, Paginated<BookRental>>;
  deleteById!: (id: string) => TE.TaskEither<Error, void>;
  save!: <U extends BookRental>(
    bookRental: Partial<U>,
  ) => TE.TaskEither<Error, void>;
}
