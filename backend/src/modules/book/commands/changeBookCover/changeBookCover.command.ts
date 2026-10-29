import { Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  coverKey,
  coverTypeOf,
  storedCoverKey,
} from "@modules/book/domain/bookCover";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { FileStorage } from "@shared/storage/fileStorage";
import { removeUnsavedRTE, removeUnusedRTE } from "@shared/storage/storedFiles";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import { changedRTE, UseCaseHandler } from "@shared/utils/application/useCase";
import { Upload } from "@shared/utils/http/upload";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class ChangeBookCover extends Command {
  constructor(
    public readonly id: string,
    public readonly upload: Upload,
  ) {
    super();
  }
}

@CommandHandler(ChangeBookCover)
export class ChangeBookCoverHandler extends UseCaseHandler<ChangeBookCover> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly storage: FileStorage,
  ) {
    super();
  }

  // Not the bytes
  protected logged({ id, upload }: ChangeBookCover) {
    return { id, name: upload.name, size: upload.body.length };
  }

  protected pipeline({ id, upload }: ChangeBookCover) {
    return FPF.pipe(
      //Data validation
      inputsRTE({
        id: [UUID, "id", id],
        cover: [UUID, "uuid", this.uuidGeneratorService.generateUUID()],
      }),
      RTE.bind("book", ({ id }) =>
        orFail(
          perform(this.bookInfoRepository).findById(id),
          bookInfoNotFoundException,
        ),
      ),
      RTE.bind("type", () => RTE.fromEither(coverTypeOf(upload))),

      //Store the file, then point the book to it; a file the book didn't
      //take is removed
      RTE.tap(({ book, cover, type }) =>
        perform(this.storage).put(coverKey(book.id, cover), upload.body, type),
      ),
      RTE.tap(({ book, cover }) =>
        FPF.pipe(
          perform(this.bookInfoRepository).changeCover(
            book.id,
            book.cover,
            cover,
          ),
          RTE.orElseW(removeUnsavedRTE(this.storage, coverKey(book.id, cover))),
        ),
      ),
      // The version it replaced, which nothing reads any more
      RTE.tap(({ book }) =>
        removeUnusedRTE(this.storage, storedCoverKey(book)),
      ),

      RTE.tap(({ book }) =>
        changedRTE({ resource: Resource.Books, key: book.id }),
      ),
      RTE.asUnit,
    );
  }
}
