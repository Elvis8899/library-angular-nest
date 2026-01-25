import { BaseDateEntity } from "@src/shared/db/dateEntity.base";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { z } from "zod";
import { DateType } from "@src/shared/utils/DateType";

export enum RentalStatusEnum {
  Rented = "rented",
  Finished = "finished",
}

export const BookRental = z
  .object({
    id: UUID,
    rentalStatus: z
      .nativeEnum(RentalStatusEnum)
      .default(RentalStatusEnum.Rented),
    bookItemId: z.string(),
    bookItem: z
      .object({
        book: z.object({ name: z.string(), price: z.number() }),
      })
      .optional(),
    user: z.object({ name: z.string() }).optional(),
    userId: z.string(),
    overdueDate: DateType.default(
      () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ),
    deliveryDate: DateType.nullable().default(null),
  })
  .merge(BaseDateEntity);

export type BookRental = z.infer<typeof BookRental>;

export const getRentalFines = (rental: BookRental) => {
  const days = Math.ceil(
    (Date.now() - rental.overdueDate.getTime()) / (1000 * 60 * 60 * 24),
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
