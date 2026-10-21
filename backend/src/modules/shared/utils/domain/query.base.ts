import { z } from "zod";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_VALUE = 1000;

/** Raw paging input, as it arrives from the query string. */
export type PageRequest = {
  page?: number;
  limit?: number;
};

/** A resolved page window: page number, page size and rows to skip. */
type PageWindow = {
  page: number;
  limit: number;
  offset: number;
};

/** Paging parameters handed to repositories, plus filters when there are any. */
export type PaginatedQueryParams<Q = undefined> = [Q] extends [undefined]
  ? PageWindow
  : PageWindow & { query: Q };

/** Missing, out-of-range or malformed values fall back instead of failing. */
const pageNumber = (fallback: number) =>
  z.coerce
    .number()
    .int()
    .min(0)
    .max(MAX_PAGE_VALUE)
    .catch(fallback)
    .default(fallback);

export const PageRequestSchema = z
  .object({
    page: pageNumber(0),
    limit: pageNumber(DEFAULT_PAGE_SIZE),
  })
  .transform(({ page, limit }): PageWindow => ({
    page,
    limit,
    offset: page * limit,
  }));

/** Schema for a page of results whose rows match `row`. */
export const paginatedSchema = <Row extends z.ZodType>(row: Row) =>
  z.object({
    data: z.array(row),
    count: z.number(),
    page: z.number(),
    limit: z.number(),
  });
