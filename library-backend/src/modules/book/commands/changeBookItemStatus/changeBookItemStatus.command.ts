import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { Apply, FPF, RE, RTE } from "@shared/functional/monads";
import { performRTE } from "@shared/utils/perform";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { noop } from "@shared/utils/noop";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { PinoLogger } from "nestjs-pino";
import { BookInfoRepository } from "../../database/bookInfo.repository.port";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { bookInfoNotFoundException } from "../../domain/bookInfo.errors";
import { BookItemStatusEnum } from "../../domain/value-object/bookItem.entity";
import { z } from "zod";
import { BOOK_ITEM_STATUS_CHANGE } from "../../domain/events/bookItemStatusChange.event";

export class ChangeBookItemStatus implements ICommand {
  constructor(
    public readonly id: string,
    public readonly status: BookItemStatusEnum,
  ) {}
}

@CommandHandler(ChangeBookItemStatus)
export class ChangeBookItemStatusHandler implements ICommandHandler<
  ChangeBookItemStatus,
  void
> {
  constructor(
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("ChangeBookItemStatus");
  }

  execute(command: ChangeBookItemStatus): Promise<void> {
    this.logger.info(command.id, "ChangeBookItemStatus command received");
    const task = FPF.pipe(
      //Data validation
      Apply.sequenceS(RE.Applicative)({
        status: fromInputRE(
          z.enum(BookItemStatusEnum),
          "status",
        )(command.status),
        id: fromInputRE(UUID, "uuid")(command.id),
      }),
      RTE.fromReaderEither,

      //Validate BookItem exists
      RTE.tap(
        FPF.flow(
          (data) => data.id,
          performRTE(
            this.bookInfoRepository.findBookItemById,
            "get bookItem by id",
          ),
          RTE.chainW(RTE.fromOption<Error>(bookInfoNotFoundException)),
        ),
      ),

      //Store entity
      RTE.tap(
        performRTE(
          this.bookInfoRepository.updateBookItem,
          "save bookInfo in storage system.",
        ),
      ),

      //Emit domain event
      RTE.chain((bookItem) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookItem Updated event.",
        )({
          eventKey: BOOK_ITEM_STATUS_CHANGE,
          payload: {
            id: bookItem.id,
            status: bookItem.status,
          },
        }),
      ),
      RTE.map(noop),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
