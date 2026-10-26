// Business days, without Zod (the frontend's bundle takes them as they are)

/** The time zone the business counts its days in. */
export const businessTimeZone = "America/Sao_Paulo";

// en-CA formats dates as yyyy-MM-dd
const businessDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: businessTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The business day (America/Sao_Paulo) an instant falls on, yyyy-MM-dd. */
export const businessDateOf = (instant: Date): string =>
  businessDay.format(instant);

/** Whether a text is a real day, yyyy-MM-dd ("2026-02-30" isn't). */
export const isBusinessDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  addDays(value, 0) === value;

/** The day `days` after (before, when negative) a yyyy-MM-dd day. */
export const addDays = (date: string, days: number): string => {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
};
