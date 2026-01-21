import { z } from "zod";
import { DateType } from "../utils/DateType";

export const BaseDateEntity = z.object({
  createdAt: DateType.default(() => new Date()),
  updatedAt: DateType.default(() => new Date()),
});

export type BaseDateEntity = z.infer<typeof BaseDateEntity>;
