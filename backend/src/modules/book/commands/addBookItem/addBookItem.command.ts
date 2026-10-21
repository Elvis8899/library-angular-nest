import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { BookItem } from "@modules/book/domain/bookItem.entity";
import { BOOK_ITEM_CREATED } from "@modules/book/domain/events/bookItemCreated.event";
import { CreateBookItemDto } from "@modules/book/dtos/bookInfo.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";
import { PinoLogger } from "nestjs-pino";

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
          "save bookItem in storage system.",
        ),
      ),

      // //Emit domain event
      RTE.chain((bookInfo) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookItem created event.",
        )({
          eventKey: BOOK_ITEM_CREATED,
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
