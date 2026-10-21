import { Prisma } from "@db/generated/client";
import { bookItemPriceFromCents } from "@modules/book/database/priceColumn";
import { BookItemStatusEnum } from "@modules/book/domain/bookItem.entity";
import {
  BookRentalFindAllQuery,
  BookRentalRepository,
} from "@modules/rental/database/bookRental.repository.port";
import {
  BookRental,
  RentalStatusEnum,
} from "@modules/rental/domain/bookRental.entity";
import {
  bookRentalFinishedException,
  bookRentalNotAvailableException,
} from "@modules/rental/domain/bookRental.errors";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma/prisma.service";
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
import {
  DomainError,
  unknownException,
} from "@shared/utils/domain/shared.errors";
import { z } from "zod";

@Injectable()
export class RealBookRentalRepository implements BookRentalRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(
    z.preprocess(bookItemPriceFromCents, BookRental),
    "BookRental",
  );

  private rentals = prismaTasks(() => this.prisma.bookRentalDetails);

  // Domain errors thrown inside a transaction are passed through as-is
  private transactionErrorException = (error: unknown): Error =>
    error instanceof DomainError ? error : unknownException(error);

  private includeAll: Prisma.BookRentalDetailsInclude = {
    bookItem: { include: { book: true } },
    user: true,
  };

  findAll = (): TE.TaskEither<Error, BookRental[]> =>
    FPF.pipe(
      this.rentals.findMany({ include: this.includeAll }),
      TE.chainEitherK(validateRows(this.baseValidator)),
    );

  findAllPaginated = (
    params: PaginatedQueryParams<BookRentalFindAllQuery>,
  ): TE.TaskEither<Error, Paginated<BookRental>> => {
    const where: Prisma.BookRentalDetailsWhereInput = {
      rentalStatus: params.query.status,
      userId: params.query.userId,
    };
    return loadPage(
      {
        rows: ({ skip, take }) =>
          this.rentals.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: this.includeAll,
          }),
        total: () => this.rentals.count({ where }),
      },
      this.baseValidator,
    )(params);
  };

  findById = (
    bookRentalId: string,
  ): TE.TaskEither<Error, O.Option<BookRental>> =>
    FPF.pipe(
      this.rentals.findUnique({
        where: { id: bookRentalId },
        include: this.includeAll,
      }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
    );

  deleteById = (bookRentalId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(this.rentals.delete({ where: { id: bookRentalId } }), TE.asUnit);

  save = (bookRentalRaw: BookRental): TE.TaskEither<Error, void> => {
    const { bookItem: _, user: __, ...bookRental } = bookRentalRaw;
    return FPF.pipe(
      this.rentals.upsert({
        where: { id: bookRental.id },
        update: {
          rentalStatus: bookRental.rentalStatus,
          overdueDate: bookRental.overdueDate,
          deliveryDate: bookRental.deliveryDate,
        },
        create: bookRental,
      }),
      TE.asUnit,
    );
  };

  rent = (bookRentalRaw: BookRental): TE.TaskEither<Error, void> => {
    const { bookItem: _, user: __, ...bookRental } = bookRentalRaw;
    return TE.tryCatch(
      () =>
        this.prisma.$transaction(async (tx) => {
          // Conditional update locks the row, so concurrent rents of the
          // same item cannot both succeed
          const { count } = await tx.bookItem.updateMany({
            where: {
              id: bookRental.bookItemId,
              status: BookItemStatusEnum.Available,
            },
            data: { status: BookItemStatusEnum.Rented },
          });
          if (count === 0) throw bookRentalNotAvailableException();
          await tx.bookRentalDetails.create({ data: bookRental });
        }),
      this.transactionErrorException,
    );
  };

  finish = (bookRental: BookRental): TE.TaskEither<Error, void> =>
    TE.tryCatch(
      () =>
        this.prisma.$transaction(async (tx) => {
          const { count } = await tx.bookRentalDetails.updateMany({
            where: {
              id: bookRental.id,
              rentalStatus: RentalStatusEnum.Rented,
            },
            data: {
              rentalStatus: RentalStatusEnum.Finished,
              deliveryDate: bookRental.deliveryDate,
            },
          });
          if (count === 0) throw bookRentalFinishedException();
          await tx.bookItem.update({
            where: { id: bookRental.bookItemId },
            data: { status: BookItemStatusEnum.Available },
          });
        }),
      this.transactionErrorException,
    );
}
