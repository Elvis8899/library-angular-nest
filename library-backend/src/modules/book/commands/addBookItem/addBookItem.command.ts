import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { FPF, RE, RTE } from "@shared/functional/monads";
import { performRTE } from "@shared/utils/perform";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { noop } from "@shared/utils/noop";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { PinoLogger } from "nestjs-pino";
import { BookInfoRepository } from "../../database/bookInfo.repository.port";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { CreateBookItemDto } from "../../dtos/bookInfo.dto";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { BookItem } from "../../domain/value-object/bookItem.entity";
import { bookInfoNotFoundException } from "../../domain/bookInfo.errors";
import { BOOK_ITEM_CREATED } from "../../domain/events/bookItemCreated.event";

export class AddBookItem implements ICommand {
  constructor(public readonly props: CreateBookItemDto) {}
}

@CommandHandler(AddBookItem)
export class AddBookItemHandler implements ICommandHandler<AddBookItem, void> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("AddBookItem");
  }

  execute(command: AddBookItem): Promise<void> {
    this.logger.info(command.props, "AddBookItem command received");
    const task = FPF.pipe(
      //Data validation
      RE.of(command.props),
      RE.bind("id", () =>
        fromInputRE(UUID, "uuid")(this.uuidGeneratorService.generateUUID()),
      ),
      RE.chain(fromInputRE(BookItem, "BookItem")),
      RTE.fromReaderEither,

      //Validate BookInfo exists
      RTE.tap(
        FPF.flow(
          (data) => data.bookId,
          performRTE(this.bookInfoRepository.findById, "get bookInfo by id"),
          RTE.chainW(RTE.fromOption<Error>(bookInfoNotFoundException)),
        ),
      ),

      //Store entity
      RTE.tap(
        performRTE(
          this.bookInfoRepository.createBookItem,
          "save bookInfo in storage system.",
        ),
      ),

      // //Emit domain event
      RTE.chain((bookInfo) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookInfo created event.",
        )({
          eventKey: BOOK_ITEM_CREATED,
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
