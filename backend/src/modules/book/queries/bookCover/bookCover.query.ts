import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { coverKey } from "@modules/book/domain/bookCover";
import {
  bookCoverNotFoundException,
  bookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { FileStorage, StoredFile } from "@shared/storage/fileStorage";
import { Query, QueryHandler } from "@shared/utils/application/cqrs";
import { inputRTE } from "@shared/utils/application/fromInput";
import { FPF, O, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class BookCoverQuery extends Query<StoredFile> {
  constructor(public readonly id: string) {
    super();
  }
}

/** A book's cover, for anyone who sees the books. */
@QueryHandler(BookCoverQuery)
export class BookCoverQueryHandler extends UseCaseHandler<BookCoverQuery> {
  constructor(
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly storage: FileStorage,
  ) {
    super();
  }

  protected logged({ id }: BookCoverQuery) {
    return id;
  }

  protected pipeline({ id }: BookCoverQuery) {
    return FPF.pipe(
      inputRTE(UUID, "id", id),
      RTE.chain((id) =>
        orFail(
          perform(this.bookInfoRepository).findById(id),
          bookInfoNotFoundException,
        ),
      ),
      RTE.chain((book) =>
        FPF.pipe(
          O.fromNullable(book.cover),
          RTE.fromOption(bookCoverNotFoundException),
          // A cover whose file is gone is none either
          RTE.chain((cover) =>
            orFail(
              perform(this.storage).get(coverKey(book.id, cover)),
              bookCoverNotFoundException,
            ),
          ),
        ),
      ),
    );
  }
}
