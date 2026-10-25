import { z } from "zod";

/** A record's id. */
export const Id = z.guid();

/** A business day, yyyy-MM-dd. */
export const BusinessDate = z.iso.date();
export type BusinessDate = z.infer<typeof BusinessDate>;

/**
 * A moment: an ISO string on the wire, a `Date` in the backend. A contract's
 * exported type is the wire's (`z.input`, what the frontend receives); the
 * backend's controllers return `z.output` of it.
 */
export const Timestamp = z.codec(z.iso.datetime(), z.date(), {
  decode: (text) => new Date(text),
  encode: (date) => date.toISOString(),
});

const maxPageValue = 1000;

// Missing, out-of-range or malformed values fall back instead of failing
const pageNumber = (fallback: number) =>
  z.coerce
    .number()
    .int()
    .min(0)
    .max(maxPageValue)
    .catch(fallback)
    .default(fallback);

/** Which page of a list, from the query string. */
export const PageQuery = z.object({
  page: pageNumber(0).describe("Página, a partir de 0"),
  limit: pageNumber(20).describe("Itens por página"),
});
// What a client sends (z.coerce reads anything, so the input type is unknown)
export type PageQuery = { page?: number; limit?: number };

/** A query string as a route receives it, before its contract reads it:
 * each parameter text, missing where the contract allows it. */
export type QueryString<Schema extends z.ZodObject> = {
  [Key in keyof z.input<Schema>]-?: undefined extends z.input<Schema>[Key]
    ? string | undefined
    : string;
};

/** A query-string filter: left blank, it's none. */
export const optionalParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );

/** A page of a list: its items, the page's number from 0, its size and the
 * whole list's count. */
export const page = <Item extends z.ZodType>(item: Item) =>
  z.object({
    data: z.array(item),
    count: z.number().int().describe("Itens na lista inteira"),
    limit: z.number().int().describe("Itens por página"),
    page: z.number().int().describe("Página, a partir de 0"),
  });

/** What the backend sends for a contract, before JSON writes its dates. */
export type Sent<Schema extends z.ZodType> = z.output<Schema>;
