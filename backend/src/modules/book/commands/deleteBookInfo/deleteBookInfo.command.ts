import { Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { storedCoverKey } from "@modules/book/domain/bookCover";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { bookInfoDeleted } from "@modules/book/domain/events/bookInfoDeleted.event";
import { FileStorage } from "@shared/storage/fileStorage";
import { removeUnusedRTE } from "@shared/storage/storedFiles";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCaseHandler,
} from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class DeleteBookInfo extends Command {
  constructor(public readonly props: string) {
    super();
  }
}

@CommandHandler(DeleteBookInfo)
export class DeleteBookInfoHandler extends UseCaseHandler<DeleteBookInfo> {
  constructor(
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly storage: FileStorage,
  ) {
    super();
  }

  protected logged(command: DeleteBookInfo): unknown {
    return command.props;
  }

  protected pipeline(command: DeleteBookInfo) {
    return FPF.pipe(
      //Data validation
      inputsRTE({ id: [UUID, "id", command.props] }),

      //Validate BookInfo exists
      RTE.chain(({ id }) =>
        orFail(
          perform(this.bookInfoRepository).findById(id),
          bookInfoNotFoundException,
        ),
      ),

      //Delete entity
      RTE.tap((bookInfo) =>
        perform(this.bookInfoRepository).deleteById(bookInfo.id),
      ),

      // Its cover, which nothing reads any more
      RTE.tap((bookInfo) =>
        removeUnusedRTE(this.storage, storedCoverKey(bookInfo)),
      ),

      RTE.tap(publishRTE(bookInfoDeleted)),
      RTE.tap(() => changedRTE({ resource: Resource.Books })),
      RTE.asUnit,
    );
  }
}
