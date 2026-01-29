import { BookInfo } from "@book/domain/bookInfo.entity";
import { BookItem } from "@book/domain/value-object/bookItem.entity";
import { O, TE } from "@shared/utils/application/monads";
import {
  Paginated,
  RepositoryDefaultPort,
} from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

export abstract class BookInfoRepository implements RepositoryDefaultPort<BookInfo> {
  findById!: (id: string) => TE.TaskEither<Error, O.Option<BookInfo>>;
  findAll!: () => TE.TaskEither<Error, BookInfo[]>;
  findAllPaginated!: (
    params: PaginatedQueryParams,
  ) => TE.TaskEither<Error, Paginated<BookInfo>>;
  deleteById!: (id: string) => TE.TaskEither<Error, void>;
  save!: (bookInfo: BookInfo) => TE.TaskEither<Error, void>;
  findBookItemById!: (
    bookItemId: string,
  ) => TE.TaskEither<Error, O.Option<BookItem>>;
  createBookItem!: (bookItem: BookItem) => TE.TaskEither<Error, void>;
  deleteBookItem!: (bookItemId: string) => TE.TaskEither<Error, void>;

  updateBookItem!: (bookItem: Partial<BookItem>) => TE.TaskEither<Error, void>;
}
