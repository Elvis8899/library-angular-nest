import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { BookItem } from "@modules/book/domain/bookItem.entity";
import { O, TE } from "@shared/utils/application/monads";
import {
  Paginated,
  RepositoryDefaultPort,
} from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

export interface BookInfoSort {
  by: "name" | "createdAt";
  order: "asc" | "desc";
}

export interface BookInfoFindAllQuery {
  // Case-insensitive part of the book name
  name?: string;
  // Creation time range: from is inclusive, before is exclusive
  createdFrom?: Date;
  createdBefore?: Date;
  sort: BookInfoSort;
}

export abstract class BookInfoRepository implements RepositoryDefaultPort<BookInfo> {
  findById!: (id: string) => TE.TaskEither<Error, O.Option<BookInfo>>;
  findAll!: () => TE.TaskEither<Error, BookInfo[]>;
  findAllPaginated!: (
    params: PaginatedQueryParams<BookInfoFindAllQuery>,
  ) => TE.TaskEither<Error, Paginated<BookInfo>>;
  deleteById!: (id: string) => TE.TaskEither<Error, void>;
  /** Saves the book's details; a book already saved keeps its cover. */
  save!: (bookInfo: BookInfo) => TE.TaskEither<Error, void>;
  /** Moves the book's cover from one version to another (null: none),
   * refused with 409 book.coverChanged when the book isn't holding `from`
   * (another upload came first, or the book is gone). */
  changeCover!: (
    bookId: string,
    from: string | null,
    to: string | null,
  ) => TE.TaskEither<Error, void>;
  findBookItemById!: (
    bookItemId: string,
  ) => TE.TaskEither<Error, O.Option<BookItem>>;
  createBookItem!: (bookItem: BookItem) => TE.TaskEither<Error, void>;
  /** Removes a copy that's on the shelf, refused with 404
   * book.noAvailableCopy when it isn't (rented meanwhile, or gone). */
  deleteBookItem!: (bookItemId: string) => TE.TaskEither<Error, void>;
}
