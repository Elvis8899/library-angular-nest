import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE } from "@shared/utils/application/perform";
import { UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class GetBookInfoByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetBookInfoByIdQuery)
export class GetBookInfoByIdQueryHandler implements IQueryHandler<
  GetBookInfoByIdQuery,
  BookInfo
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
  execute(query: GetBookInfoByIdQuery): Promise<BookInfo> {
    return this.useCase.run(
      "GetBookInfoById",
      query,
      FPF.pipe(
        query.id,
        fromInputRE(UUID, "UUID"),
        RTE.fromReaderEither,
        RTE.chain(
          findOrFailRTE(
            this.bookInfoRepository.findById,
            "get bookInfo in storage system.",
            bookInfoNotFoundException,
          ),
        ),
      ),
    );
  }
}
