import { z } from "zod";

export const UUID = z.string().uuid();
export type UUID = z.infer<typeof UUID>;
