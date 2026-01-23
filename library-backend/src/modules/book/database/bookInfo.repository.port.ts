import { O, TE } from "@shared/functional/monads";
import { Paginated, RepositoryPort } from "@shared/ddd";
import { PaginatedQueryParams } from "@src/shared/ddd/query.base";
import { BookInfo } from "../domain/bookInfo.entity";

export abstract class BookInfoRepository implements RepositoryPort<BookInfo> {
  findById!: (id: string) => TE.TaskEither<Error, O.Option<BookInfo>>;
  findAll!: () => TE.TaskEither<Error, BookInfo[]>;
  findAllPaginated!: (
    params: PaginatedQueryParams,
  ) => TE.TaskEither<Error, Paginated<BookInfo>>;
  deleteById!: (id: string) => TE.TaskEither<Error, void>;
  save!: <U extends BookInfo>(bookInfo: U) => TE.TaskEither<Error, void>;
}
