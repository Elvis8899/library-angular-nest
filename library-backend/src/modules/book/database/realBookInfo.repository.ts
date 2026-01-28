import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { A, E, FPF, O, TE } from "@shared/functional/monads";
import { Paginated } from "@shared/ddd";
import { noop } from "@shared/utils/noop";
import { validateFromUnknown } from "@shared/utils/validateWith";
import { PaginatedQueryParams } from "@shared/ddd/query.base";
import { unknownException } from "@src/shared/utils/unknownException";
import { BookInfoRepository } from "./bookInfo.repository.port";
import { BookInfo } from "../domain/bookInfo.entity";
import { BookItem } from "../domain/value-object/bookItem.entity";

@Injectable()
export class RealBookInfoRepository implements BookInfoRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(BookInfo, "BookInfo");

  private defaultErrorException = unknownException;

  private findMany = TE.tryCatchK(
    this.prisma.bookInfo.findMany.bind(this.prisma.bookInfo),
    this.defaultErrorException,
  );

  private findFirst = TE.tryCatchK(
    this.prisma.bookInfo.findFirst.bind(this.prisma.bookInfo),
    this.defaultErrorException,
  );
  private findUnique = TE.tryCatchK(
    this.prisma.bookInfo.findUnique.bind(this.prisma.bookInfo),
    this.defaultErrorException,
  );

  private count = TE.tryCatchK(
    this.prisma.bookInfo.count.bind(this.prisma.bookInfo),
    this.defaultErrorException,
  );

  private delete = TE.tryCatchK(
    this.prisma.bookInfo.delete.bind(this.prisma.bookInfo),
    this.defaultErrorException,
  );

  private upsert = TE.tryCatchK(
    this.prisma.bookInfo.upsert.bind(this.prisma.bookInfo),
    this.defaultErrorException,
  );

  private update = TE.tryCatchK(
    this.prisma.bookInfo.update.bind(this.prisma.bookInfo),
    this.defaultErrorException,
  );

  private findUniqueItem = TE.tryCatchK(
    this.prisma.bookItem.findUnique.bind(this.prisma.bookItem),
    this.defaultErrorException,
  );

  private addItem = TE.tryCatchK(
    this.prisma.bookItem.create.bind(this.prisma.bookItem),
    this.defaultErrorException,
  );

  private removeItem = TE.tryCatchK(
    this.prisma.bookItem.delete.bind(this.prisma.bookItem),
    this.defaultErrorException,
  );

  private updateItem = TE.tryCatchK(
    this.prisma.bookItem.update.bind(this.prisma.bookItem),
    this.defaultErrorException,
  );

  private includeAll: Prisma.BookInfoInclude = {
    bookItems: true,
  };
  private paginatedFindMany =
    <S extends BookInfo>(validator: (value: unknown) => E.Either<Error, S>) =>
    (where: Prisma.BookInfoWhereInput) =>
    (query: PaginatedQueryParams): TE.TaskEither<Error, Paginated<S>> => {
      return FPF.pipe(
        TE.of(query),
        TE.let("skip", ({ page, limit, offset }) => limit * page + offset),
        TE.chain((parsedQuery) =>
          FPF.pipe(
            TE.of({ page: parsedQuery.page, limit: parsedQuery.limit }),
            TE.apS(
              "data",
              FPF.pipe(
                this.findMany({
                  where,
                  skip: parsedQuery.offset,
                  take: parsedQuery.limit,
                  orderBy: { createdAt: "desc" },
                  include: this.includeAll,
                }),
                TE.chainEitherK(A.traverse(E.Applicative)(validator)),
              ),
            ),
            TE.apS(
              "count",
              this.count({
                where,
              }),
            ),
          ),
        ),
      );
    };

  findAll = (): TE.TaskEither<Error, BookInfo[]> => {
    return FPF.pipe(
      this.findMany({
        include: this.includeAll,
      }),
      TE.chainEitherK(A.traverse(E.Applicative)(this.baseValidator)),
    );
  };

  findAllPaginated = (
    params: PaginatedQueryParams,
  ): TE.TaskEither<Error, Paginated<BookInfo>> => {
    const where: Prisma.BookInfoWhereInput = {};
    return this.paginatedFindMany(this.baseValidator)(where)(params);
  };

  findById = (bookInfoId: string): TE.TaskEither<Error, O.Option<BookInfo>> => {
    return FPF.pipe(
      this.findUnique({
        where: {
          id: bookInfoId,
        },
        include: this.includeAll,
      }),
      TE.chainEitherK(
        FPF.flow(
          O.fromNullable,
          O.map(this.baseValidator),
          O.sequence(E.Applicative),
        ),
      ),
    );
  };

  deleteById = (bookInfoId: string): TE.TaskEither<Error, void> => {
    return FPF.pipe(
      this.delete({
        where: {
          id: bookInfoId,
        },
      }),
      TE.map(noop),
    );
  };

  save = (bookInfoRaw: BookInfo): TE.TaskEither<Error, void> => {
    const { bookItems: _, ...bookInfo } = bookInfoRaw;
    return FPF.pipe(
      this.upsert({
        where: {
          id: bookInfo.id,
        },
        update: {
          name: bookInfo.name,
        },
        create: {
          ...bookInfo,
        },
      }),

      TE.map(noop),
    );
  };

  findBookItemById = (
    bookItemId: string,
  ): TE.TaskEither<Error, O.Option<BookItem>> => {
    return FPF.pipe(
      this.findUniqueItem({
        where: {
          id: bookItemId,
        },
      }),
      TE.chainEitherK(
        FPF.flow(
          O.fromNullable,
          O.map(validateFromUnknown(BookItem, "BookItem")),
          O.sequence(E.Applicative),
        ),
      ),
    );
  };

  createBookItem = (bookItem: BookItem): TE.TaskEither<Error, void> => {
    return FPF.pipe(
      this.addItem({
        data: { ...bookItem },
      }),
      TE.map(noop),
    );
  };
  deleteBookItem = (bookItemId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.removeItem({
        where: {
          id: bookItemId,
        },
      }),
      TE.map(noop),
    );

  updateBookItem = (bookItem: Partial<BookItem>): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.updateItem({
        where: {
          id: bookItem.id,
        },
        data: {
          ...bookItem,
        },
      }),
      TE.map(noop),
    );
}
