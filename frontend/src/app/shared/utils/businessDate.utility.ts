import { addDays, businessDateOf, isBusinessDate } from "@library/contracts";

/** A day as the API takes it: yyyy-MM-dd. */
export type BusinessDate = string;

/** Today in São Paulo, wherever the browser is, as the backend's Clock sees
 * it. */
export const businessToday = (now: Date = new Date()): BusinessDate =>
  businessDateOf(now);

/** The day `days` after (or before, when negative) `date`. */
export { addDays };

/** Whether `value` is a real day in the API's format. */
export { isBusinessDate };
