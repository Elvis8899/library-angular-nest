import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { FPF, O, RTE } from "@shared/functional/monads";
import { performRTE } from "@shared/utils/perform";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { noop } from "@shared/utils/noop";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { PinoLogger } from "nestjs-pino";
import { BookInfoRepository } from "../../database/bookInfo.repository.port";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { BookItemStatusEnum } from "../../domain/value-object/bookItem.entity";
import {
  availableBookItemNotFoundException,
  bookInfoNotFoundException,
} from "../../domain/bookInfo.errors";
import { BOOK_ITEM_REMOVED } from "../../domain/events/bookItemRemoved.event";

export class RemoveBookItem implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(RemoveBookItem)
export class RemoveBookItemHandler
  implements ICommandHandler<RemoveBookItem, void>
{
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
