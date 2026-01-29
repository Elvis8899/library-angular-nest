import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { bookInfoNotFoundException } from "@book/domain/bookInfo.errors";
import { BOOK_INFO_DELETED } from "@book/domain/events/bookInfoDeleted.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";
import { performRTE } from "@shared/utils/application/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/entities/uuid";
import { PinoLogger } from "nestjs-pino";

export class DeleteBookInfo implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(DeleteBookInfo)
export class DeleteBookInfoHandler implements ICommandHandler<
  DeleteBookInfo,
  void
> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("DeleteBookInfo");
  }

  execute(command: DeleteBookInfo): Promise<void> {
    this.logger.info(command.props, "DeleteBookInfo command received");
    const task = FPF.pipe(
      //Data validation
      command.props,
      fromInputRE(UUID, "id"),
      RTE.fromReaderEither,

      // Validate BookInfo exists
      RTE.chain(
        FPF.flow(
          performRTE(this.bookInfoRepository.findById, "get bookInfo by id"),
          RTE.chain((_) => RTE.fromOption<Error>(bookInfoNotFoundException)(_)),
        ),
      ),

      // Delete entity
      RTE.tap((existingBookInfo) =>
        performRTE(
          this.bookInfoRepository.deleteById,
          "delete bookInfo in storage system.",
        )(existingBookInfo.id),
      ),

      // Emit domain event
      RTE.chain((bookInfo) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookInfo deleted event.",
        )({
          eventKey: BOOK_INFO_DELETED,
          payload: {
            id: bookInfo.id,
            name: bookInfo.name,
          },
        }),
      ),
      RTE.map(noop),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
