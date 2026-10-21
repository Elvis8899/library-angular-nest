import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { bookInfoCreated } from "@modules/book/domain/events/bookInfoCreated.event";
import { CreateBookInfoDto } from "@modules/book/dtos/bookInfo.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class CreateBookInfo implements ICommand {
  constructor(public readonly props: CreateBookInfoDto) {}
}

@CommandHandler(CreateBookInfo)
export class CreateBookInfoHandler implements ICommandHandler<
  CreateBookInfo,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {}

  execute(command: CreateBookInfo): Promise<void> {
    return this.useCase.run(
      "CreateBookInfo",
      command.props,
      FPF.pipe(
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

        RTE.tap(publishRTE(bookInfoCreated)),
        RTE.asUnit,
      ),
    );
  }
}
