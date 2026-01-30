import { BaseEntity } from "@app/models/utils/base.entity";

export interface BookRentEntity {
  bookItemId: string;
  userId: string;
}

export enum BookRentalStatusEnum {
  Rented = "rented",
  Finished = "finished",
}

export class BookRentalEntity extends BaseEntity {
  userName = "";
  bookName = "";
  rentalStatus: BookRentalStatusEnum = BookRentalStatusEnum.Rented;
  overdueDate: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  deliveryDate: Date | null = null;
  fines: {
    overdue: boolean;
    fixed: number;
    days: number;
    perDayValue: number;
    total: number;
  } = {
    overdue: false,
    fixed: 0,
    days: 0,
    perDayValue: 0,
    total: 0,
  };
}
