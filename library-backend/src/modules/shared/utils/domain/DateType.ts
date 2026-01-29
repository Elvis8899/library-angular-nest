import { z } from "zod";

export const DateType = z
  .union([
    z.string(),
    z.number(),
    z.date(),
    z.null().transform(() => new Date()),
  ])
  .pipe(z.coerce.date());
//.brand("Date");
export type DateType = z.infer<typeof DateType>;
