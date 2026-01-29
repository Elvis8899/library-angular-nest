import { BookRental, RentalStatusEnum } from "@rental/domain/bookRental.entity";
import { O, TE } from "@shared/utils/application/monads";
import {
  Paginated,
  RepositoryDefaultPort,
} from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

export type BookRentalFindAllQuery = {
  userId?: string;
  status?: RentalStatusEnum;
};

export abstract class BookRentalRepository implements RepositoryDefaultPort<BookRental> {
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
