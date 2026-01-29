import { z } from "zod";

// export type OrderBy = { field: string | true; param: "asc" | "desc" };

export type PaginatedQueryPagination = {
  limit?: number;
  page?: number;
  // orderBy: OrderBy;
};

export type PaginatedQueryParams<Q = undefined> = Q extends undefined
  ? {
      limit: number;
      page: number;
      offset: number;
      // orderBy: OrderBy;
    }
  : {
      query: Q;
      limit: number;
      page: number;
      offset: number;
      // orderBy: OrderBy;
    };

/**
 * Base validator for paginated queries
 */

export const PaginatedQueryValidator = z
  .object({
    limit: z.coerce.number().int().min(0).max(1000).default(20).catch(20),
    page: z.coerce.number().int().min(0).max(1000).default(0).catch(0),
  })
  .transform((props) => ({
    limit: props.limit,
    page: props.page,
    offset: props.page * props.limit,
  }));

export type PaginatedQueryValidator = z.infer<typeof PaginatedQueryValidator>;

/**
 * Base validator for paginated return
 */

export const PaginatedReturnValidator = <Validator extends z.ZodType>(
  dataType: Validator,
) =>
  z.object({
    count: z.number(),
    limit: z.number(),
    page: z.number(),
    data: z.array(dataType),
  });
