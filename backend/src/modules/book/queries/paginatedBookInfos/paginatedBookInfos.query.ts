import { BookInfoQuery, PageQuery, QueryString } from "@library/contracts";
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

export class PaginatedBookInfosQuery implements IQuery {
  constructor(
    // The query string's, or numbers from a caller in the code
    public readonly params: PageRequest | QueryString<typeof PageQuery>,
    public readonly filters: Partial<QueryString<typeof BookInfoQuery>> = {},
  ) {}
}

/** The list's filters as the repository reads them: the order as one sort. */
export const BookInfoListFilters = BookInfoQuery.transform(
  ({ sortBy, order, ...filters }) => ({
    ...filters,
    sort: { by: sortBy, order },
  }),
);

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
