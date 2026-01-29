import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { BookInfo } from "@book/domain/bookInfo.entity";
import { bookInfoNotFoundException } from "@book/domain/bookInfo.errors";
import { BOOK_INFO_UPDATED } from "@book/domain/events/bookInfoUpdated.event";
import { CreateBookInfoDto } from "@book/dtos/bookInfo.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { FPF, RE, RTE } from "@shared/functional/monads";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@shared/utils/fromInput";
import { noop } from "@shared/utils/noop";
import { performRTE } from "@shared/utils/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/entities/uuid";
import { PinoLogger } from "nestjs-pino";

export class UpdateBookInfo implements ICommand {
  constructor(
    public readonly props: CreateBookInfoDto,
    public readonly id: string,
  ) {}
}

@CommandHandler(UpdateBookInfo)
export class UpdateBookInfoHandler implements ICommandHandler<
  UpdateBookInfo,
  void
> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("UpdateBookInfo");
  }

  execute(command: UpdateBookInfo): Promise<void> {
    this.logger.info(command.props, "UpdateBookInfo command received");
    const task = FPF.pipe(
      //Data validation
      RE.of(command.props),
      RE.bind("id", () => fromInputRE(UUID, "uuid")(command.id)),
      RE.chain(fromInputRE(BookInfo, "bookInfo")),
      RTE.fromReaderEither,

      //Validate BookInfo exists
      RTE.tap(
        FPF.flow(
          (data) => data.id,
          performRTE(this.bookInfoRepository.findById, "get bookInfo by id"),
          RTE.chainW(RTE.fromOption<Error>(bookInfoNotFoundException)),
        ),
      ),

      //Store entity
      RTE.tap(
        performRTE(
          this.bookInfoRepository.save,
          "save bookInfo in storage system.",
        ),
      ),

      //Emit domain event
      RTE.chain((bookInfo) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookInfo Updated event.",
        )({
          eventKey: BOOK_INFO_UPDATED,
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
