/**
 * A spreadsheet cell's or a printed value's text, as String() writes it, and
 * "" for none. Cells hold strings, numbers, booleans or dates.
 */
export const textOf = (value: unknown): string =>
  value === null || value === undefined
    ? ""
    : // eslint-disable-next-line @typescript-eslint/no-base-to-string -- never an object but a Date
      String(value);
