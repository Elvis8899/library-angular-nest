import { Prisma } from "@db/generated/client";
import {
  BookInfoFindAllQuery,
  BookInfoRepository,
} from "@modules/book/database/bookInfo.repository.port";
import {
  priceFromCents,
  priceToCents,
} from "@modules/book/database/priceColumn";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { bookCoverChangedException } from "@modules/book/domain/bookInfo.errors";
import { BookItem } from "@modules/book/domain/bookItem.entity";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma/prisma.service";
import { E, FPF, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { prismaTasks } from "@shared/utils/database/prismaTasks";
import { Paginated } from "@shared/utils/database/repository.port";
import { rowReads } from "@shared/utils/database/rowReads";
import { loadPage } from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";
import { z } from "zod";

@Injectable()
export class RealBookInfoRepository implements BookInfoRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(
    z.preprocess(priceFromCents, BookInfo),
    "BookInfo",
  );
  private bookItemValidator = validateFromUnknown(BookItem, "BookItem");

  private bookInfos = prismaTasks(() => this.prisma.bookInfo);
  private bookItems = prismaTasks(() => this.prisma.bookItem);

  private includeAll: Prisma.BookInfoInclude = {
    bookItems: true,
  };
  private reads = rowReads(() => this.prisma.bookInfo, this.baseValidator, {
    include: this.includeAll,
  });
  private itemReads = rowReads(
    () => this.prisma.bookItem,
    this.bookItemValidator,
  );

  findAll = this.reads.findAll;
  findById = this.reads.findById;
  findBookItemById = this.itemReads.findById;

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

  deleteById = (bookInfoId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(this.bookInfos.delete({ where: { id: bookInfoId } }), TE.asUnit);

  save = (bookInfoRaw: BookInfo): TE.TaskEither<Error, void> => {
    const { bookItems: _, price, ...bookInfo } = bookInfoRaw;
    return FPF.pipe(
      this.bookInfos.upsert({
        where: { id: bookInfo.id },
        update: {
          name: bookInfo.name,
          ...priceToCents(price),
        },
        create: { ...bookInfo, ...priceToCents(price) },
      }),
      TE.asUnit,
    );
  };

  changeCover = (
    bookId: string,
    from: string | null,
    to: string | null,
  ): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.bookInfos.updateMany({
        where: { id: bookId, cover: from },
        data: { cover: to },
      }),
      TE.chainEitherK(({ count }) =>
        count === 0 ? E.left(bookCoverChangedException()) : E.right(undefined),
      ),
    );

  createBookItem = (bookItem: BookItem): TE.TaskEither<Error, void> =>
    FPF.pipe(this.bookItems.create({ data: bookItem }), TE.asUnit);

  deleteBookItem = (bookItemId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(this.bookItems.delete({ where: { id: bookItemId } }), TE.asUnit);
}
