import { fromDbDate } from "@shared/utils/domain/businessDate";
import { z } from "zod";

/** A `@db.Date` column, which Prisma reads as midnight UTC, as the
 * `BusinessDate` it stores. */
export const DbDateColumn = z.date().transform(fromDbDate);
