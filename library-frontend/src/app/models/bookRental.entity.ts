import { BaseEntity } from "@app/models/utils/base.entity";

export interface BookRentEntity {
  bookItemId: string;
  userId: string;
}

export enum BookRentalStatusEnum {
  Rented = "rented",
  Finished = "finished",
}

export interface BookRentalEntity extends BaseEntity {
  userName: string;
  bookName: string;
  rentalStatus: BookRentalStatusEnum;
  overdueDate: Date;
  deliveryDate: Date | null;
  fines: {
    overdue: boolean;
    fixed: number;
    days: number;
    perDayValue: number;
    total: number;
  };
}
