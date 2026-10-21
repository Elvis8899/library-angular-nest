import { BookItem } from "@modules/book/domain/bookItem.entity";
import { Money } from "@modules/book/domain/money";
import { BaseDateEntity } from "@shared/utils/domain/dateEntity.base";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export const BookInfo = z
  .object({
    id: UUID,
    name: z.string().min(1),
    image: z.string().optional().default(""),
    price: Money,
    bookItems: z.array(BookItem).optional().default([]),
  })
  .and(BaseDateEntity);

export type BookInfo = z.infer<typeof BookInfo>;
