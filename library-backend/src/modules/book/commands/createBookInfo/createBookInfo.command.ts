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
import { CreateBookInfoDto } from "../../dtos/bookInfo.dto";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { BookInfo } from "../../domain/bookInfo.entity";
import { BOOK_INFO_CREATED } from "../../domain/events/bookInfoCreated.event";

export class CreateBookInfo implements ICommand {
  constructor(public readonly props: CreateBookInfoDto) {}
}

@CommandHandler(CreateBookInfo)
export class CreateBookInfoHandler
  implements ICommandHandler<CreateBookInfo, void>
{
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
