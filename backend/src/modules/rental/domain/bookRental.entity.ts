import { RentalStatus, RentBookRequest } from "@library/contracts";
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

// The contracts' RentalStatus, under the backend's name
export const RentalStatusEnum = RentalStatus;
export type RentalStatusEnum = RentalStatus;

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long a loan lasts, and what a late return costs. */
export const rentalPolicy = {
  loanDays: 7,
  // Charged once, when the book is late
  fixedFine: 20,
  // Of the book's price, per day late
  dailyFineRate: 0.05,
} as const;

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
    overdueDate: DateType,
    deliveryDate: DateType.optional(),
  })
  .and(BaseDateEntity);

export type BookRental = z.infer<typeof BookRental>;

// Due at the end of the day, the loan's days after it was rented
export const dueDateOf = (rentedAt: Date): Date =>
  new Date(endOfDay(rentedAt).getTime() + rentalPolicy.loanDays * DAY_MS);

/** A rental as a request asks for it: which copy, for whom. */
export const RentalInput = RentBookRequest;
export type RentalInput = z.output<typeof RentBookRequest>;

/** A new rental of a copy, due the loan's days after `now`. */
export const newRental = (
  id: UUID,
  { bookItemId, userId }: RentalInput,
  now: Date,
): BookRental => ({
  id,
  bookItemId,
  userId,
  rentalStatus: RentalStatusEnum.Rented,
  overdueDate: dueDateOf(now),
  createdAt: now,
  updatedAt: now,
});

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

// What a rental owes at `now`: days late are counted from the start of
// today
export const getRentalFines = (now: Date) => (rental: BookRental) => {
  const days = Math.ceil(
    (new Date(now).setHours(0, 0, 0, 0) - rental.overdueDate.getTime()) /
      DAY_MS,
  );
  const overdue = days > 0;
  const fixed = overdue ? rentalPolicy.fixedFine : 0;
  const perDayValue = roundToCentavo(
    (rental.bookItem?.book?.price || 0) * rentalPolicy.dailyFineRate,
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

// A rental with the names of its user and book, and its fines at `now`
export const rentalDetailsOf = (now: Date) => (rental: BookRental) => ({
  ...rental,
  userName: rental.user?.name || "",
  bookName: rental.bookItem?.book?.name || "",
  fines: getRentalFines(now)(rental),
});

export type BookRentalDetails = ReturnType<ReturnType<typeof rentalDetailsOf>>;
