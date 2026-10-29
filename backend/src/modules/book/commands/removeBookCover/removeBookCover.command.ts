import { Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { coverKey } from "@modules/book/domain/bookCover";
import {
  bookCoverNotFoundException,
  bookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { FileStorage } from "@shared/storage/fileStorage";
import { removeUnusedRTE } from "@shared/storage/storedFiles";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, O, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import { changedRTE, UseCaseHandler } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class RemoveBookCover extends Command {
  constructor(public readonly id: string) {
    super();
  }
}

@CommandHandler(RemoveBookCover)
export class RemoveBookCoverHandler extends UseCaseHandler<RemoveBookCover> {
  constructor(
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly storage: FileStorage,
  ) {
    super();
  }

  protected logged({ id }: RemoveBookCover) {
    return id;
  }

  protected pipeline({ id }: RemoveBookCover) {
    return FPF.pipe(
      //Data validation
      inputsRTE({ id: [UUID, "id", id] }),
      RTE.chain(({ id }) =>
        orFail(
          perform(this.bookInfoRepository).findById(id),
          bookInfoNotFoundException,
        ),
      ),
      RTE.bindTo("book"),
      RTE.bindW("cover", ({ book }) =>
        RTE.fromOption(bookCoverNotFoundException)(O.fromNullable(book.cover)),
      ),

      //Take it off the book, then remove the file
      RTE.tap(({ book, cover }) =>
        perform(this.bookInfoRepository).changeCover(book.id, cover, null),
      ),
      RTE.tap(({ book, cover }) =>
        removeUnusedRTE(this.storage, coverKey(book.id, cover)),
      ),

      RTE.tap(({ book }) =>
        changedRTE({ resource: Resource.Books, key: book.id }),
      ),
      RTE.asUnit,
    );
  }
}
