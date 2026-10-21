import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  availableBookItemNotFoundException,
  bookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { ensureAvailable } from "@modules/book/domain/bookItem.entity";
import { BOOK_ITEM_REMOVED } from "@modules/book/domain/events/bookItemRemoved.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { UUID } from "@shared/uuid/uuid";
import { PinoLogger } from "nestjs-pino";

export class RemoveBookItem implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(RemoveBookItem)
export class RemoveBookItemHandler implements ICommandHandler<
  RemoveBookItem,
  void
> {
  constructor(
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("RemoveBookItem");
  }

  execute(command: RemoveBookItem): Promise<void> {
    this.logger.info(command.props, "RemoveBookItem command received");
    const task = FPF.pipe(
      //Data validation
      command.props,
      fromInputRE(UUID, "id"),
      RTE.fromReaderEither,

      // Validate BookItem exists
      RTE.chain(
        FPF.flow(
          performRTE(
            this.bookInfoRepository.findBookItemById,
            "get bookItem by id",
          ),
          RTE.chain((_) => RTE.fromOption<Error>(bookInfoNotFoundException)(_)),
        ),
      ),

      // Validate it is available
      RTE.chainEitherK(ensureAvailable(availableBookItemNotFoundException)),

      // Delete entity
      RTE.tap((existingBookItem) =>
        performRTE(
          this.bookInfoRepository.deleteBookItem,
          "delete bookInfo in storage system.",
        )(existingBookItem.id),
      ),

      // Emit domain event
      RTE.chain((bookInfo) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookItem removed event.",
        )({
          eventKey: BOOK_ITEM_REMOVED,
          payload: {
            id: bookInfo.id,
            bookId: bookInfo.bookId,
          },
        }),
      ),
      RTE.asUnit,
    )({ logger: this.logger });
    return executeTask(task);
  }
}
