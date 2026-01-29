import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  BookRentalFindAllQuery,
  BookRentalRepository,
} from "@rental/database/bookRental.repository.port";
import { BookRental } from "@rental/domain/bookRental.entity";
import { Paginated } from "@shared/ddd";
import { PaginatedQueryParams } from "@shared/ddd/query.base";
import { A, E, FPF, O, TE } from "@shared/functional/monads";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { noop } from "@shared/utils/noop";
import { unknownException } from "@shared/utils/unknownException";
import { validateFromUnknown } from "@shared/utils/validateWith";

@Injectable()
export class RealBookRentalRepository implements BookRentalRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(BookRental, "BookRental");

  private defaultErrorException = unknownException;

  private findMany = TE.tryCatchK(
    this.prisma.bookRentalDetails.findMany.bind(this.prisma.bookRentalDetails),
    this.defaultErrorException,
  );

  private findFirst = TE.tryCatchK(
    this.prisma.bookRentalDetails.findFirst.bind(this.prisma.bookRentalDetails),
    this.defaultErrorException,
  );
  private findUnique = TE.tryCatchK(
    this.prisma.bookRentalDetails.findUnique.bind(
      this.prisma.bookRentalDetails,
    ),
    this.defaultErrorException,
  );

  private count = TE.tryCatchK(
    this.prisma.bookRentalDetails.count.bind(this.prisma.bookRentalDetails),
    this.defaultErrorException,
  );

  private delete = TE.tryCatchK(
    this.prisma.bookRentalDetails.delete.bind(this.prisma.bookRentalDetails),
    this.defaultErrorException,
  );

  private upsert = TE.tryCatchK(
    this.prisma.bookRentalDetails.upsert.bind(this.prisma.bookRentalDetails),
    this.defaultErrorException,
  );

  private update = TE.tryCatchK(
    this.prisma.bookRentalDetails.update.bind(this.prisma.bookRentalDetails),
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

  private includeAll: Prisma.BookRentalDetailsInclude = {
    bookItem: { include: { book: true } },
    user: true,
  };
  private paginatedFindMany =
    <S extends BookRental>(validator: (value: unknown) => E.Either<Error, S>) =>
    (where: Prisma.BookRentalDetailsWhereInput) =>
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

  findAll = (): TE.TaskEither<Error, BookRental[]> => {
    return FPF.pipe(
      this.findMany({
        include: this.includeAll,
      }),
      TE.chainEitherK(A.traverse(E.Applicative)(this.baseValidator)),
    );
  };

  findAllPaginated = (
    params: PaginatedQueryParams<BookRentalFindAllQuery>,
  ): TE.TaskEither<Error, Paginated<BookRental>> => {
    const where: Prisma.BookRentalDetailsWhereInput = {
      rentalStatus: params.query.status,
      userId: params.query.userId,
    };
    return this.paginatedFindMany(this.baseValidator)(where)(params);
  };

  findById = (
    bookRentalId: string,
  ): TE.TaskEither<Error, O.Option<BookRental>> => {
    return FPF.pipe(
      this.findUnique({
        where: {
          id: bookRentalId,
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

  deleteById = (bookRentalId: string): TE.TaskEither<Error, void> => {
    return FPF.pipe(
      this.delete({
        where: {
          id: bookRentalId,
        },
      }),
      TE.map(noop),
    );
  };

  save = (bookRentalRaw: Partial<BookRental>): TE.TaskEither<Error, void> => {
    const { bookItem: _, user: __, ...bookRental } = bookRentalRaw;
    return FPF.pipe(
      this.upsert({
        where: {
          id: bookRental.id,
        },
        update: {
          rentalStatus: bookRental.rentalStatus,
          overdueDate: bookRental.overdueDate,
          deliveryDate: bookRental.deliveryDate,
        },
        create: {
          ...(bookRental as Omit<BookRental, "bookItem" | "user">),
        },
      }),

      TE.map(noop),
    );
  };
}
