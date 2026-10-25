import { Prisma } from "@db/generated/client";
import { bookItemPriceFromCents } from "@modules/book/database/priceColumn";
import { BookItemStatus } from "@modules/book/domain/bookItem.entity";
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
import { FPF, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { prismaTasks } from "@shared/utils/database/prismaTasks";
import { Paginated } from "@shared/utils/database/repository.port";
import { rowReads } from "@shared/utils/database/rowReads";
import {
  ensureWritten,
  transactionTask,
} from "@shared/utils/database/transaction";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";
import { z } from "zod";

@Injectable()
export class RealBookRentalRepository implements BookRentalRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(
    z.preprocess(bookItemPriceFromCents, BookRental),
    "BookRental",
  );

  private rentals = prismaTasks(() => this.prisma.bookRentalDetails);
  private reads = rowReads(
    () => this.prisma.bookRentalDetails,
    this.baseValidator,
    {
      include: {
        bookItem: { include: { book: true } },
        user: true,
      } satisfies Prisma.BookRentalDetailsInclude,
      orderBy: { createdAt: "desc" },
    },
  );

  findAll = this.reads.findAll;
  findById = this.reads.findById;

  findAllPaginated = (
    params: PaginatedQueryParams<BookRentalFindAllQuery>,
  ): TE.TaskEither<Error, Paginated<BookRental>> => {
    const where: Prisma.BookRentalDetailsWhereInput = {
      rentalStatus: params.query.status,
      userId: params.query.userId,
    };
    return this.reads.findPage(params, where);
  };

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
    return transactionTask(this.prisma, async (tx) => {
      // Conditional update locks the row, so concurrent rents of the same
      // item cannot both succeed
      ensureWritten(
        await tx.bookItem.updateMany({
          where: {
            id: bookRental.bookItemId,
            status: BookItemStatus.Available,
          },
          data: { status: BookItemStatus.Rented },
        }),
        bookRentalNotAvailableException,
      );
      await tx.bookRentalDetails.create({ data: bookRental });
    });
  };

  finish = (bookRental: BookRental): TE.TaskEither<Error, void> =>
    transactionTask(this.prisma, async (tx) => {
      ensureWritten(
        await tx.bookRentalDetails.updateMany({
          where: {
            id: bookRental.id,
            rentalStatus: RentalStatusEnum.Rented,
          },
          data: {
            rentalStatus: RentalStatusEnum.Finished,
            deliveryDate: bookRental.deliveryDate,
          },
        }),
        bookRentalFinishedException,
      );
      await tx.bookItem.update({
        where: { id: bookRental.bookItemId },
        data: { status: BookItemStatus.Available },
      });
    });
}
