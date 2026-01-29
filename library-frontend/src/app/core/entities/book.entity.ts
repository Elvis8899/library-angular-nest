import { BaseEntity } from "@app/core/entities/utils";

export enum BookItemStatusEnum {
  Rented = "rented",
  Available = "available",
}

export class BookItemEntity extends BaseEntity {
  status = BookItemStatusEnum.Available;
  bookId = "";
}

export class BookEntity extends BaseEntity {
  name = "";
  image = "";
  price = "";
  bookItems: BookItemEntity[] = [];
}
