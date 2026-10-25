import { Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { coverKey } from "@modules/book/domain/bookCover";
import {
  bookCoverNotFoundException,
  bookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { FileStorage } from "@shared/storage/fileStorage";
import { removeUnusedRTE } from "@shared/storage/storedFiles";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, O, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import { changedRTE, UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class RemoveBookCover implements ICommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(RemoveBookCover)
export class RemoveBookCoverHandler implements ICommandHandler<
  RemoveBookCover,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly storage: FileStorage,
  ) {}

  execute({ id }: RemoveBookCover): Promise<void> {
    return this.useCase.run(
      "RemoveBookCover",
      id,
      FPF.pipe(
        //Data validation
        inputsRTE({ id: [UUID, "id", id] }),
        RTE.chain(({ id }) =>
          findOrFailRTE(
            this.bookInfoRepository.findById,
            "get bookInfo by id",
            bookInfoNotFoundException,
          )(id),
        ),
        RTE.bindTo("book"),
        RTE.bindW("cover", ({ book }) =>
          RTE.fromOption(bookCoverNotFoundException)(
            O.fromNullable(book.cover),
          ),
        ),

        //Take it off the book, then remove the file
        RTE.tap(({ book, cover }) =>
          performRTE(
            () => this.bookInfoRepository.changeCover(book.id, cover, null),
            "remove the book's cover",
          )(undefined),
        ),
        RTE.tap(({ book, cover }) =>
          removeUnusedRTE(this.storage, coverKey(book.id, cover)),
        ),

        RTE.tap(({ book }) =>
          changedRTE({ resource: Resource.Books, key: book.id }),
        ),
        RTE.asUnit,
      ),
    );
  }
}
