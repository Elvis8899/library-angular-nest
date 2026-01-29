import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import {
  availableBookItemNotFoundException,
  bookInfoNotFoundException,
} from "@book/domain/bookInfo.errors";
import { BOOK_ITEM_REMOVED } from "@book/domain/events/bookItemRemoved.event";
import { BookItemStatusEnum } from "@book/domain/value-object/bookItem.entity";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { FPF, O, RTE } from "@shared/functional/monads";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@shared/utils/fromInput";
import { noop } from "@shared/utils/noop";
import { performRTE } from "@shared/utils/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/entities/uuid";
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
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
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
      RTE.chainW(
        FPF.flow(
          O.of,
          O.filter((item) => item.status === BookItemStatusEnum.Available),
          RTE.fromOption<Error>(availableBookItemNotFoundException),
        ),
      ),

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
          "emit bookInfo deleted event.",
        )({
          eventKey: BOOK_ITEM_REMOVED,
          payload: {
            id: bookInfo.id,
            bookId: bookInfo.bookId,
          },
        }),
      ),
      RTE.map(noop),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
