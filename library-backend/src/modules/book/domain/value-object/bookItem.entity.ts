import { BaseDateEntity } from "@src/shared/db/dateEntity.base";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { z } from "zod";

export enum BookItemStatusEnum {
  Rented = "rented",
  Available = "available",
}
export const BookItem = z
  .object({
    id: UUID,
    status: z
      .nativeEnum(BookItemStatusEnum)
      .default(BookItemStatusEnum.Available),
    bookId: UUID,
  })
  .merge(BaseDateEntity);

export type BookItem = z.infer<typeof BookItem>;
