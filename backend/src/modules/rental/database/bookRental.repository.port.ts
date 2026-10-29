import {
  BookRental,
  RentalStatusEnum,
} from "@modules/rental/domain/bookRental.entity";
import { O, TE } from "@shared/utils/application/monads";
import {
  Paginated,
  RepositoryDefaultPort,
} from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

export interface BookRentalFindAllQuery {
  userId?: string;
  status?: RentalStatusEnum;
}

export abstract class BookRentalRepository implements RepositoryDefaultPort<BookRental> {
  findById!: (id: string) => TE.TaskEither<Error, O.Option<BookRental>>;
  findAll!: () => TE.TaskEither<Error, BookRental[]>;
  findAllPaginated!: (
    params: PaginatedQueryParams<BookRentalFindAllQuery>,
  ) => TE.TaskEither<Error, Paginated<BookRental>>;
  deleteById!: (id: string) => TE.TaskEither<Error, void>;
  save!: (bookRental: BookRental) => TE.TaskEither<Error, void>;
  /** Atomically marks the book item as rented and stores the rental.
   * Fails with BookRentalNotAvailableException if the item is not available. */
  rent!: (bookRental: BookRental) => TE.TaskEither<Error, void>;
  /** Atomically finishes an active rental and makes the book item available.
   * Fails with BookRentalFinishedException if the rental is not active. */
  finish!: (bookRental: BookRental) => TE.TaskEither<Error, void>;
}
