import { BookInfo } from "@book/domain/bookInfo.entity";
import { BookItem } from "@book/domain/value-object/bookItem.entity";
import { Paginated, RepositoryDefaultPort } from "@shared/ddd";
import { PaginatedQueryParams } from "@shared/ddd/query.base";
import { O, TE } from "@shared/functional/monads";

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
