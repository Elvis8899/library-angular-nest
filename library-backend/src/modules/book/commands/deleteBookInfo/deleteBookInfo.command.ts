import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { FPF, RTE } from "@shared/functional/monads";
import { performRTE } from "@shared/utils/perform";
import { executeTask } from "@shared/utils/executeTask";
import { noop } from "@shared/utils/noop";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { PinoLogger } from "nestjs-pino";
import { BookInfoRepository } from "../../database/bookInfo.repository.port";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { bookInfoNotFoundException } from "../../domain/bookInfo.errors";
import { BOOK_INFO_DELETED } from "../../domain/events/bookInfoDeleted.event";

export class DeleteBookInfo implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(DeleteBookInfo)
export class DeleteBookInfoHandler
  implements ICommandHandler<DeleteBookInfo, void>
{
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
