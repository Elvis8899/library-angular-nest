import { Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { storedCoverKey } from "@modules/book/domain/bookCover";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { bookInfoDeleted } from "@modules/book/domain/events/bookInfoDeleted.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { FileStorage } from "@shared/storage/fileStorage";
import { removeUnusedRTE } from "@shared/storage/storedFiles";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCase,
} from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class DeleteBookInfo implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(DeleteBookInfo)
export class DeleteBookInfoHandler implements ICommandHandler<
  DeleteBookInfo,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly storage: FileStorage,
  ) {}

  execute(command: DeleteBookInfo): Promise<void> {
    return this.useCase.run(
      "DeleteBookInfo",
      command.props,
      FPF.pipe(
        //Data validation
        inputsRTE({ id: [UUID, "id", command.props] }),

        //Validate BookInfo exists
        RTE.chain(({ id }) =>
          findOrFailRTE(
            this.bookInfoRepository.findById,
            "get bookInfo by id",
            bookInfoNotFoundException,
          )(id),
        ),

        //Delete entity
        RTE.tap((bookInfo) =>
          performRTE(
            this.bookInfoRepository.deleteById,
            "delete bookInfo in storage system.",
          )(bookInfo.id),
        ),

        // Its cover, which nothing reads any more
        RTE.tap((bookInfo) =>
          removeUnusedRTE(this.storage, storedCoverKey(bookInfo)),
        ),

        RTE.tap(publishRTE(bookInfoDeleted)),
        RTE.tap(() => changedRTE({ resource: Resource.Books })),
        RTE.asUnit,
      ),
    );
  }
}
