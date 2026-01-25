import { BaseEntity } from "./utils";

export enum BookItemStatusEnum {
  Rented = "rented",
  Available = "available",
}

export class BookItemEntity extends BaseEntity {
  status = BookItemStatusEnum.Available;
}

export class BookEntity extends BaseEntity {
  name = "";
  image = "";
  price = "";
  bookItems: BookItemEntity[] = [];
}
