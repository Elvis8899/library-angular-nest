import {
  BookInfoFindAllQuery,
  BookInfoRepository,
} from "@book/database/bookInfo.repository.port";
import { BookInfo } from "@book/domain/bookInfo.entity";
import { BookItem } from "@book/domain/valueObject/bookItem.entity";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { E, FPF, O, TE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  loadPage,
  validateMaybeRow,
  validateRows,
} from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";
import { unknownException } from "@shared/utils/domain/shared.erros";

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

  private includeAll: Prisma.BookInfoInclude = {
    bookItems: true,
  };

  findAll = (): TE.TaskEither<Error, BookInfo[]> => {
    return FPF.pipe(
      this.findMany({
        include: this.includeAll,
      }),
      TE.chainEitherK(validateRows(this.baseValidator)),
    );
  };

  findAllPaginated = (
    params: PaginatedQueryParams<BookInfoFindAllQuery>,
  ): TE.TaskEither<Error, Paginated<BookInfo>> => {
    const { name, createdFrom, createdBefore, sort } = params.query;
    const where: Prisma.BookInfoWhereInput = {
      name: name ? { contains: name, mode: "insensitive" } : undefined,
      createdAt: { gte: createdFrom, lt: createdBefore },
    };
    // id breaks ties, so books with the same name keep their page
    const orderBy: Prisma.BookInfoOrderByWithRelationInput[] = [
      { [sort.by]: sort.order },
      { id: "asc" },
    ];
    return loadPage(
      {
        rows: ({ skip, take }) =>
          this.findMany({
            where,
            skip,
            take,
            orderBy,
            include: this.includeAll,
          }),
        total: () => this.count({ where }),
      },
      this.baseValidator,
    )(params);
  };

  findById = (bookInfoId: string): TE.TaskEither<Error, O.Option<BookInfo>> => {
    return FPF.pipe(
      this.findUnique({
        where: {
          id: bookInfoId,
        },
        include: this.includeAll,
      }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
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
}
