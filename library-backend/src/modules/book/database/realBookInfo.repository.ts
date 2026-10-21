import {
  BookInfoFindAllQuery,
  BookInfoRepository,
} from "@book/database/bookInfo.repository.port";
import { BookInfo } from "@book/domain/bookInfo.entity";
import { BookItem } from "@book/domain/valueObject/bookItem.entity";
import { Prisma } from "@db/generated/client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { FPF, O, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { prismaTasks } from "@shared/utils/database/prismaTasks";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  loadPage,
  validateMaybeRow,
  validateRows,
} from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

@Injectable()
export class RealBookInfoRepository implements BookInfoRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(BookInfo, "BookInfo");
  private bookItemValidator = validateFromUnknown(BookItem, "BookItem");

  private bookInfos = prismaTasks(() => this.prisma.bookInfo);
  private bookItems = prismaTasks(() => this.prisma.bookItem);

  private includeAll: Prisma.BookInfoInclude = {
    bookItems: true,
  };

  findAll = (): TE.TaskEither<Error, BookInfo[]> =>
    FPF.pipe(
      this.bookInfos.findMany({ include: this.includeAll }),
      TE.chainEitherK(validateRows(this.baseValidator)),
    );

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
          this.bookInfos.findMany({
            where,
            skip,
            take,
            orderBy,
            include: this.includeAll,
          }),
        total: () => this.bookInfos.count({ where }),
      },
      this.baseValidator,
    )(params);
  };

  findById = (bookInfoId: string): TE.TaskEither<Error, O.Option<BookInfo>> =>
    FPF.pipe(
      this.bookInfos.findUnique({
        where: { id: bookInfoId },
        include: this.includeAll,
      }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
    );

  deleteById = (bookInfoId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(this.bookInfos.delete({ where: { id: bookInfoId } }), TE.asUnit);

  save = (bookInfoRaw: BookInfo): TE.TaskEither<Error, void> => {
    const { bookItems: _, ...bookInfo } = bookInfoRaw;
    return FPF.pipe(
      this.bookInfos.upsert({
        where: { id: bookInfo.id },
        update: { name: bookInfo.name },
        create: bookInfo,
      }),
      TE.asUnit,
    );
  };

  findBookItemById = (
    bookItemId: string,
  ): TE.TaskEither<Error, O.Option<BookItem>> =>
    FPF.pipe(
      this.bookItems.findUnique({ where: { id: bookItemId } }),
      TE.chainEitherK(validateMaybeRow(this.bookItemValidator)),
    );

  createBookItem = (bookItem: BookItem): TE.TaskEither<Error, void> =>
    FPF.pipe(this.bookItems.create({ data: bookItem }), TE.asUnit);

  deleteBookItem = (bookItemId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(this.bookItems.delete({ where: { id: bookItemId } }), TE.asUnit);
}
