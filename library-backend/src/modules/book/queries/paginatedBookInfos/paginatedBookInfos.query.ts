import { PinoLogger } from "nestjs-pino";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Paginated } from "@shared/ddd";
import {
  PaginatedQueryPagination,
  PaginatedQueryValidator,
} from "@shared/ddd/query.base";
import { executeTask } from "@shared/utils/executeTask";
import { performRTE } from "@shared/utils/perform";
import { FPF, RTE } from "@shared/functional/monads";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { BookInfo } from "../../domain/bookInfo.entity";
import { BookInfoRepository } from "../../database/bookInfo.repository.port";

export class PaginatedBookInfosQuery implements IQuery {
  constructor(public readonly params: PaginatedQueryPagination) {}
}

@QueryHandler(PaginatedBookInfosQuery)
export class PaginatedBookInfosQueryHandler
  implements IQueryHandler<PaginatedBookInfosQuery, Paginated<BookInfo>>
{
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
