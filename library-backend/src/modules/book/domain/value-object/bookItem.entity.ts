import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/entities/uuid";
import { z } from "zod";

export enum BookItemStatusEnum {
  Rented = "rented",
  Available = "available",
}
export const BookItem = z
  .object({
    id: UUID,
    status: z.enum(BookItemStatusEnum).default(BookItemStatusEnum.Available),
    bookId: UUID,
  })
  .and(BaseDateEntity);

export type BookItem = z.infer<typeof BookItem>;
