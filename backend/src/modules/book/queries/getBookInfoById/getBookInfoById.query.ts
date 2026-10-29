import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { Query, QueryHandler } from "@shared/utils/application/cqrs";
import { inputRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class GetBookInfoByIdQuery extends Query<BookInfo> {
  constructor(public readonly id: string) {
    super();
  }
}

@QueryHandler(GetBookInfoByIdQuery)
export class GetBookInfoByIdQueryHandler extends UseCaseHandler<GetBookInfoByIdQuery> {
  constructor(private readonly bookInfoRepository: BookInfoRepository) {
    super();
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  protected pipeline(query: GetBookInfoByIdQuery) {
    return FPF.pipe(
      inputRTE(UUID, "id", query.id),
      RTE.chain((id) =>
        orFail(
          perform(this.bookInfoRepository).findById(id),
          bookInfoNotFoundException,
        ),
      ),
    );
  }
}
