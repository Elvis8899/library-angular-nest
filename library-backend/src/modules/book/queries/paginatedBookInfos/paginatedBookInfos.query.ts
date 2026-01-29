import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { BookInfo } from "@book/domain/bookInfo.entity";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  PaginatedQueryPagination,
  PaginatedQueryValidator,
} from "@shared/utils/domain/query.base";
import { PinoLogger } from "nestjs-pino";

export class PaginatedBookInfosQuery implements IQuery {
  constructor(public readonly params: PaginatedQueryPagination) {}
}

@QueryHandler(PaginatedBookInfosQuery)
export class PaginatedBookInfosQueryHandler implements IQueryHandler<
  PaginatedBookInfosQuery,
  Paginated<BookInfo>
> {
  constructor(
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("PaginatedBookInfos");
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  async execute(query: PaginatedBookInfosQuery): Promise<Paginated<BookInfo>> {
    const task = FPF.pipe(
      query.params,
      fromInputRE(PaginatedQueryValidator, "PaginatedBookInfosQuery"),
      RTE.fromReaderEither,
      RTE.chain(
        performRTE(
          this.bookInfoRepository.findAllPaginated,
          "get bookInfo list in storage system.",
        ),
      ),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
