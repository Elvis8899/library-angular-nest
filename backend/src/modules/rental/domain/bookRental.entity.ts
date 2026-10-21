import {
  BookItem,
  ensureAvailable,
} from "@modules/book/domain/bookItem.entity";
import { Money, roundToCentavo } from "@modules/book/domain/money";
import {
  bookRentalFinishedException,
  bookRentalNotAvailableException,
  bookRentalNotFoundException,
} from "@modules/rental/domain/bookRental.errors";
import { E, FPF } from "@shared/utils/application/monads";
import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { DateType } from "@shared/utils/domain/dateType";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export enum RentalStatusEnum {
  Rented = "rented",
  Finished = "finished",
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Returns a copy of date set to the last second of that day
const endOfDay = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 0);
  return end;
};

export const BookRental = z
  .object({
    id: UUID,
    rentalStatus: z.enum(RentalStatusEnum).default(RentalStatusEnum.Rented),
    bookItemId: z.string(),
    bookItem: z
      .object({
        book: z.object({ name: z.string(), price: Money }).optional(),
      })
      .optional(),
    user: z.object({ name: z.string() }).optional(),
    userId: z.string(),
    overdueDate: DateType.default(
      () => new Date(endOfDay(new Date()).getTime() + 7 * DAY_MS),
    ),
    deliveryDate: DateType.optional(),
  })
  .and(BaseDateEntity);

export type BookRental = z.infer<typeof BookRental>;

// The rules below decide from what was read. The repository's `rent` and
// `finish` check again in one conditional write, for changes made meanwhile.

// Starts the rental of a copy that's on the shelf
export const startRental =
  (rental: BookRental) =>
  (bookItem: BookItem): E.Either<Error, BookRental> =>
    FPF.pipe(
      bookItem,
      ensureAvailable(bookRentalNotAvailableException),
      E.map((item) => ({
        ...rental,
        bookItemId: item.id,
        rentalStatus: RentalStatusEnum.Rented,
      })),
    );

// Finishes an active rental, with the copy delivered at `now`
export const finishRental =
  (now: Date) =>
  (rental: BookRental): E.Either<Error, BookRental> =>
    rental.rentalStatus === RentalStatusEnum.Rented
      ? E.right({
          ...rental,
          rentalStatus: RentalStatusEnum.Finished,
          deliveryDate: now,
        })
      : E.left(bookRentalFinishedException());

// Clients may only handle their own rentals, and someone else's is reported
// as not found; no owner (an admin) may handle any
export const ensureOwnedBy =
  (ownerId: string | undefined) =>
  (rental: BookRental): E.Either<Error, BookRental> =>
    ownerId === undefined || rental.userId === ownerId
      ? E.right(rental)
      : E.left(bookRentalNotFoundException());

export const getRentalFines = (rental: BookRental) => {
  const days = Math.ceil(
    (new Date().setHours(0, 0, 0, 0) - rental.overdueDate.getTime()) / DAY_MS,
  );
  const overdue = days > 0;
  const fixed = overdue ? 20 : 0;
  // 5% book value per day
  const perDayValue = roundToCentavo(
    (rental.bookItem?.book?.price || 0) * 0.05,
  );
  const total = roundToCentavo(fixed + perDayValue * days);
  return {
    overdue,
    fixed,
    days,
    perDayValue,
    total,
  };
};

export const BookRentalDetails = BookRental.transform((rental) => ({
  ...rental,
  userName: rental.user?.name || "",
  bookName: rental.bookItem?.book?.name || "",
  fines: getRentalFines(rental),
}));

export type BookRentalDetails = z.infer<typeof BookRentalDetails>;
