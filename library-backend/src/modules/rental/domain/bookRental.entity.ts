import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { DateType } from "@shared/utils/domain/dateType";
import { UUID } from "@shared/uuid/entities/uuid";
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
        book: z.object({ name: z.string(), price: z.number() }).optional(),
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

export const getRentalFines = (rental: BookRental) => {
  const days = Math.ceil(
    (new Date().setHours(0, 0, 0, 0) - rental.overdueDate.getTime()) / DAY_MS,
  );
  const overdue = days > 0;
  const fixed = overdue ? 20 : 0;
  // 5% book value per day
  const perDayValue = (rental.bookItem?.book?.price || 0) * 0.05;
  const total = fixed + perDayValue * days;
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
