import { BookItemStatusEnum } from "@book/domain/valueObject/bookItem.entity";
import { Prisma } from "@db/generated/client";
import { HttpException, Injectable } from "@nestjs/common";
import {
  BookRentalFindAllQuery,
  BookRentalRepository,
} from "@rental/database/bookRental.repository.port";
import { BookRental, RentalStatusEnum } from "@rental/domain/bookRental.entity";
import {
  bookRentalFinishedException,
  bookRentalNotAvailableException,
} from "@rental/domain/bookRental.errors";
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
import { unknownException } from "@shared/utils/domain/shared.erros";

@Injectable()
export class RealBookRentalRepository implements BookRentalRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(BookRental, "BookRental");

  private rentals = prismaTasks(() => this.prisma.bookRentalDetails);

  // Domain errors thrown inside a transaction are passed through as-is
  private transactionErrorException = (error: unknown): Error =>
    error instanceof HttpException ? error : unknownException(error);

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

  save = (bookRentalRaw: Partial<BookRental>): TE.TaskEither<Error, void> => {
    const { bookItem: _, user: __, ...bookRental } = bookRentalRaw;
    return FPF.pipe(
      this.rentals.upsert({
        where: { id: bookRental.id },
        update: {
          rentalStatus: bookRental.rentalStatus,
          overdueDate: bookRental.overdueDate,
          deliveryDate: bookRental.deliveryDate,
        },
        create: {
          ...(bookRental as Omit<BookRental, "bookItem" | "user">),
        },
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
