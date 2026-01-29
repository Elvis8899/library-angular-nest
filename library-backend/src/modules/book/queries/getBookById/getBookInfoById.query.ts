import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { BookInfo } from "@book/domain/bookInfo.entity";
import { bookInfoNotFoundException } from "@book/domain/bookInfo.errors";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { FPF, RTE } from "@shared/functional/monads";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@shared/utils/fromInput";
import { performRTE } from "@shared/utils/perform";
import { UUID } from "@shared/uuid/entities/uuid";
import { PinoLogger } from "nestjs-pino";

export class GetBookInfoByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetBookInfoByIdQuery)
export class GetBookInfoByIdQueryHandler implements IQueryHandler<
  GetBookInfoByIdQuery,
  BookInfo
> {
  constructor(
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("GetBookInfoById");
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  async execute(query: GetBookInfoByIdQuery): Promise<BookInfo> {
    const task = FPF.pipe(
      query.id,
      fromInputRE(UUID, "UUID"),
      RTE.fromReaderEither,
      RTE.chain(
        performRTE(
          this.bookInfoRepository.findById,
          "get bookInfo in storage system.",
        ),
      ),
      RTE.chainW(RTE.fromOption<Error>(bookInfoNotFoundException)),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
