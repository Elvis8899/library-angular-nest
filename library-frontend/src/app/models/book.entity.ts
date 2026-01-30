import { BaseEntity } from "@app/models/utils/base.entity";

export enum BookItemStatusEnum {
  Rented = "rented",
  Available = "available",
}

export interface BookItemEntity extends BaseEntity {
  status: BookItemStatusEnum;
  bookId: string;
}

export interface BookEntity extends BaseEntity {
  name: string;
  image: string;
  price: string;
  bookItems: BookItemEntity[];
}
