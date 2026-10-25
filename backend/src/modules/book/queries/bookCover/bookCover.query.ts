import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { coverKey } from "@modules/book/domain/bookCover";
import {
  bookCoverNotFoundException,
  bookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { FileStorage, StoredFile } from "@shared/storage/fileStorage";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, O, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE } from "@shared/utils/application/perform";
import { UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class BookCoverQuery implements IQuery {
  constructor(public readonly id: string) {}
}

/** A book's cover, for anyone who sees the books. */
@QueryHandler(BookCoverQuery)
export class BookCoverQueryHandler implements IQueryHandler<
  BookCoverQuery,
  StoredFile
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly storage: FileStorage,
  ) {}

  execute({ id }: BookCoverQuery): Promise<StoredFile> {
    return this.useCase.run(
      "BookCover",
      id,
      FPF.pipe(
        inputsRTE({ id: [UUID, "id", id] }),
        RTE.chain(({ id }) =>
          findOrFailRTE(
            this.bookInfoRepository.findById,
            "get bookInfo by id",
            bookInfoNotFoundException,
          )(id),
        ),
        RTE.chain((book) =>
          FPF.pipe(
            O.fromNullable(book.cover),
            RTE.fromOption(bookCoverNotFoundException),
            // A cover whose file is gone is none either
            RTE.chain((cover) =>
              findOrFailRTE(
                this.storage.get,
                "get the cover",
                bookCoverNotFoundException,
              )(coverKey(book.id, cover)),
            ),
          ),
        ),
      ),
    );
  }
}
