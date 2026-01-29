import { BookItem } from "@book/domain/value-object/bookItem.entity";
import { BaseDateEntity } from "@shared/db/dateEntity.base";
import { UUID } from "@shared/uuid/entities/uuid";
import { z } from "zod";

export const BookInfo = z
  .object({
    id: UUID,
    name: z.string().min(1),
    image: z.string().optional().default(""),
    price: z.number(),
    bookItems: z.array(BookItem).optional().default([]),
  })
  .and(BaseDateEntity);

export type BookInfo = z.infer<typeof BookInfo>;
