import { Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  availableBookItemNotFoundException,
  bookItemNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { ensureAvailable } from "@modules/book/domain/bookItem.entity";
import { bookItemRemoved } from "@modules/book/domain/events/bookItemRemoved.event";
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

export class RemoveBookItem extends Command {
  constructor(public readonly props: string) {
    super();
  }
}

@CommandHandler(RemoveBookItem)
export class RemoveBookItemHandler extends UseCaseHandler<RemoveBookItem> {
  constructor(private readonly bookInfoRepository: BookInfoRepository) {
    super();
  }

  protected logged(command: RemoveBookItem): unknown {
    return command.props;
  }

  protected pipeline(command: RemoveBookItem) {
    return FPF.pipe(
      inputsRTE({ id: [UUID, "id", command.props] }),

      //Validate BookItem exists and is available
      RTE.chain(({ id }) =>
        orFail(
          perform(this.bookInfoRepository).findBookItemById(id),
          bookItemNotFoundException,
        ),
      ),
      RTE.chainEitherK(ensureAvailable(availableBookItemNotFoundException)),

      //Delete entity, refused if it was rented meanwhile
      RTE.tap((bookItem) =>
        perform(this.bookInfoRepository).deleteBookItem(bookItem.id),
      ),

      RTE.tap(publishRTE(bookItemRemoved)),
      RTE.tap(() => changedRTE({ resource: Resource.Books })),
      RTE.asUnit,
    );
  }
}
