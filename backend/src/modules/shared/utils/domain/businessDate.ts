import { BusinessDate, YearMonth } from "@library/contracts";

export { BusinessDate, businessDateOf, YearMonth } from "@library/contracts";

/** The instant a business day starts. America/Sao_Paulo keeps UTC-3 all
 * year (no daylight saving since 2019). */
export const businessDayStart = (date: BusinessDate): Date =>
  new Date(`${date}T00:00:00.000-03:00`);

// Postgres DATE columns reach Prisma as midnight UTC
export const toDbDate = (date: BusinessDate): Date =>
  new Date(`${date}T00:00:00.000Z`);

export const fromDbDate = (date: Date): BusinessDate =>
  date.toISOString().slice(0, 10);

/** The first and last day of a month. */
export const monthDays = (
  month: YearMonth,
): { first: BusinessDate; last: BusinessDate } => {
  const [year = 0, monthNumber = 0] = month.split("-").map(Number);
  // Day 0 of the next month is this month's last day
  const last = new Date(Date.UTC(year, monthNumber, 0));
  return { first: `${month}-01`, last: fromDbDate(last) };
};
