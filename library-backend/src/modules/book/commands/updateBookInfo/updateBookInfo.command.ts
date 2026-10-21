import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { BOOK_INFO_UPDATED } from "@modules/book/domain/events/bookInfoUpdated.event";
import { CreateBookInfoDto } from "@modules/book/dtos/bookInfo.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";
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
      RTE.asUnit,
    )({ logger: this.logger });
    return executeTask(task);
  }
}
