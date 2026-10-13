import { BookInfo } from "@book/domain/bookInfo.entity";
import { BookItem } from "@book/domain/valueObject/bookItem.entity";
import { O, TE } from "@shared/utils/application/monads";
import {
  Paginated,
  RepositoryDefaultPort,
} from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

export type BookInfoSort = {
  by: "name" | "createdAt";
  order: "asc" | "desc";
};

export type BookInfoFindAllQuery = {
  // Case-insensitive part of the book name
  name?: string;
  // Creation time range: from is inclusive, before is exclusive
  createdFrom?: Date;
  createdBefore?: Date;
  sort: BookInfoSort;
};

export abstract class BookInfoRepository implements RepositoryDefaultPort<BookInfo> {
  findById!: (id: string) => TE.TaskEither<Error, O.Option<BookInfo>>;
  findAll!: () => TE.TaskEither<Error, BookInfo[]>;
  findAllPaginated!: (
    params: PaginatedQueryParams<BookInfoFindAllQuery>,
  ) => TE.TaskEither<Error, Paginated<BookInfo>>;
  deleteById!: (id: string) => TE.TaskEither<Error, void>;
  save!: (bookInfo: BookInfo) => TE.TaskEither<Error, void>;
  findBookItemById!: (
    bookItemId: string,
  ) => TE.TaskEither<Error, O.Option<BookItem>>;
  createBookItem!: (bookItem: BookItem) => TE.TaskEither<Error, void>;
  deleteBookItem!: (bookItemId: string) => TE.TaskEither<Error, void>;
}
