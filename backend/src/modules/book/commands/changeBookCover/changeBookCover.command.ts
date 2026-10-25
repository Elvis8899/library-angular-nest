import { Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  coverKey,
  coverTypeOf,
  storedCoverKey,
} from "@modules/book/domain/bookCover";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { FileStorage } from "@shared/storage/fileStorage";
import { removeUnsavedRTE, removeUnusedRTE } from "@shared/storage/storedFiles";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import { changedRTE, UseCase } from "@shared/utils/application/useCase";
import { Upload } from "@shared/utils/http/upload";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class ChangeBookCover implements ICommand {
  constructor(
    public readonly id: string,
    public readonly upload: Upload,
  ) {}
}

@CommandHandler(ChangeBookCover)
export class ChangeBookCoverHandler implements ICommandHandler<
  ChangeBookCover,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly storage: FileStorage,
  ) {}

  execute({ id, upload }: ChangeBookCover): Promise<void> {
    return this.useCase.run(
      "ChangeBookCover",
      // Not the bytes
      { id, name: upload.name, size: upload.body.length },
      FPF.pipe(
        //Data validation
        inputsRTE({
          id: [UUID, "id", id],
          cover: [UUID, "uuid", this.uuidGeneratorService.generateUUID()],
        }),
        RTE.bind("book", ({ id }) =>
          findOrFailRTE(
            this.bookInfoRepository.findById,
            "get bookInfo by id",
            bookInfoNotFoundException,
          )(id),
        ),
        RTE.bind("type", () => RTE.fromEither(coverTypeOf(upload))),

        //Store the file, then point the book to it; a file the book didn't
        //take is removed
        RTE.tap(({ book, cover, type }) =>
          performRTE(
            () => this.storage.put(coverKey(book.id, cover), upload.body, type),
            "store the cover",
          )(undefined),
        ),
        RTE.tap(({ book, cover }) =>
          FPF.pipe(
            performRTE(
              () =>
                this.bookInfoRepository.changeCover(book.id, book.cover, cover),
              "change the book's cover",
            )(undefined),
            RTE.orElseW(
              removeUnsavedRTE(this.storage, coverKey(book.id, cover)),
            ),
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
      ),
    );
  }
}
