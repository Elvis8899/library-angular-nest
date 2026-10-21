import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { UseCase } from "@shared/utils/application/useCase";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  PageRequest,
  PageRequestSchema,
} from "@shared/utils/domain/query.base";
import { z } from "zod";

// Raw query string values, validated by BookInfoListFilters
export type BookInfoListFilterParams = {
  name?: string;
  createdFrom?: string;
  createdBefore?: string;
  sortBy?: string;
  order?: string;
};

export class PaginatedBookInfosQuery implements IQuery {
  constructor(
    public readonly params: PageRequest,
    public readonly filters: BookInfoListFilterParams = {},
  ) {}
}

export const BookInfoListFilters = z
  .object({
    // A blank search means no filter
    name: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((name) => name || undefined),
    createdFrom: z.coerce.date().optional(),
    createdBefore: z.coerce.date().optional(),
    sortBy: z
      .string()
      .pipe(z.enum(["name", "createdAt"]))
      .default("createdAt"),
    order: z
      .string()
      .pipe(z.enum(["asc", "desc"]))
      .default("desc"),
  })
  .refine(
    ({ createdFrom, createdBefore }) =>
      !createdFrom || !createdBefore || createdFrom < createdBefore,
    "createdFrom deve ser anterior a createdBefore",
  )
  .transform(({ sortBy, order, ...filters }) => ({
    ...filters,
    sort: { by: sortBy, order },
  }));

@QueryHandler(PaginatedBookInfosQuery)
export class PaginatedBookInfosQueryHandler implements IQueryHandler<
  PaginatedBookInfosQuery,
  Paginated<BookInfo>
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {}

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  execute(query: PaginatedBookInfosQuery): Promise<Paginated<BookInfo>> {
    return this.useCase.run(
      "PaginatedBookInfos",
      query,
      FPF.pipe(
        query.params,
        fromInputRE(PageRequestSchema, "PaginatedBookInfosQuery"),
        RE.bind("query", () =>
          fromInputRE(BookInfoListFilters, "filters")(query.filters),
        ),
        RTE.fromReaderEither,
        RTE.chain(
          performRTE(
            this.bookInfoRepository.findAllPaginated,
            "get bookInfo list in storage system.",
          ),
        ),
      ),
    );
  }
}
