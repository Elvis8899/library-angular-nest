import { BaseDateEntity } from "@src/shared/db/dateEntity.base";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { z } from "zod";
import { BookItem } from "./value-object/bookItem.entity";

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
