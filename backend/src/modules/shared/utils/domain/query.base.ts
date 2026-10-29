import { PageQuery } from "@library/contracts";

/** Raw paging input, as it arrives from the query string. */
export type PageRequest = {
  page?: number;
  limit?: number;
};

/** A resolved page window: page number, page size and rows to skip. */
export type PageWindow = {
  page: number;
  limit: number;
  offset: number;
};

/** Paging parameters handed to repositories, plus filters when there are any. */
export type PaginatedQueryParams<Q = undefined> = [Q] extends [undefined]
  ? PageWindow
  : PageWindow & { query: Q };

export const PageRequestSchema = PageQuery.transform(
  ({ page, limit }): PageWindow => ({
    page,
    limit,
    offset: page * limit,
  }),
);
