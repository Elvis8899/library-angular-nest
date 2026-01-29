import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { BookInfo } from "@book/domain/bookInfo.entity";
import { BOOK_INFO_CREATED } from "@book/domain/events/bookInfoCreated.event";
import { CreateBookInfoDto } from "@book/dtos/bookInfo.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";
import { performRTE } from "@shared/utils/application/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/entities/uuid";
import { PinoLogger } from "nestjs-pino";

export class CreateBookInfo implements ICommand {
  constructor(public readonly props: CreateBookInfoDto) {}
}

@CommandHandler(CreateBookInfo)
export class CreateBookInfoHandler implements ICommandHandler<
  CreateBookInfo,
  void
> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("CreateBookInfo");
  }

  execute(command: CreateBookInfo): Promise<void> {
    this.logger.info(command.props, "CreateBookInfo command received");
    const task = FPF.pipe(
      //Data validation
      RE.of(command.props),
      RE.bind("id", () =>
        fromInputRE(UUID, "uuid")(this.uuidGeneratorService.generateUUID()),
      ),
      RE.chain(fromInputRE(BookInfo, "BookInfo")),
      RTE.fromReaderEither,

      //Store entity
      RTE.tap(
        performRTE(
          this.bookInfoRepository.save,
          "save bookInfo in storage system.",
        ),
      ),

      // //Emit domain event
      RTE.chain((bookInfo) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookInfo created event.",
        )({
          eventKey: BOOK_INFO_CREATED,
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
