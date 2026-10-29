import { BookInfoQuery, PageQuery, QueryString } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { Query, QueryHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { perform } from "@shared/utils/application/perform";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  PageRequest,
  PageRequestSchema,
} from "@shared/utils/domain/query.base";

export class PaginatedBookInfosQuery extends Query<Paginated<BookInfo>> {
  constructor(
    // The query string's, or numbers from a caller in the code
    public readonly params: PageRequest | QueryString<typeof PageQuery>,
    public readonly filters: Partial<QueryString<typeof BookInfoQuery>> = {},
  ) {
    super();
  }
}

/** The list's filters as the repository reads them: the order as one sort. */
export const BookInfoListFilters = BookInfoQuery.transform(
  ({ sortBy, order, ...filters }) => ({
    ...filters,
    sort: { by: sortBy, order },
  }),
);

@QueryHandler(PaginatedBookInfosQuery)
export class PaginatedBookInfosQueryHandler extends UseCaseHandler<PaginatedBookInfosQuery> {
  constructor(private readonly bookInfoRepository: BookInfoRepository) {
    super();
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  protected pipeline(query: PaginatedBookInfosQuery) {
    return FPF.pipe(
      inputsRTE({
        window: [PageRequestSchema, "PaginatedBookInfosQuery", query.params],
        filters: [BookInfoListFilters, "filters", query.filters],
      }),
      RTE.map(({ window, filters }) => ({ ...window, query: filters })),
      RTE.chain(perform(this.bookInfoRepository).findAllPaginated),
    );
  }
}
