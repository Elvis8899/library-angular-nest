import { BookInfoRequest, Created, Resource, Sent } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  BookDetails,
  registerBook,
} from "@modules/book/domain/bookInfo.entity";
import { bookInfoCreated } from "@modules/book/domain/events/bookInfoCreated.event";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { perform } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCaseHandler,
} from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class CreateBookInfo extends Command<Sent<typeof Created>> {
  constructor(public readonly props: BookInfoRequest) {
    super();
  }
}

@CommandHandler(CreateBookInfo)
export class CreateBookInfoHandler extends UseCaseHandler<CreateBookInfo> {
  constructor(
    private readonly clock: Clock,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {
    super();
  }

  protected logged(command: CreateBookInfo): unknown {
    return command.props;
  }

  protected pipeline(command: CreateBookInfo) {
    return FPF.pipe(
      //Data validation
      inputsRTE({
        id: [UUID, "uuid", this.uuidGeneratorService.generateUUID()],
        input: [BookDetails, "BookInfo", command.props],
      }),

      //Build the book
      RTE.map(({ id, input }) => registerBook(id, input, this.clock.now())),

      //Store entity
      RTE.tap(perform(this.bookInfoRepository).save),

      RTE.tap(publishRTE(bookInfoCreated)),
      RTE.tap((bookInfo) =>
        changedRTE({ resource: Resource.Books, key: bookInfo.id }),
      ),
      // The id, for its cover (PUT bookInfos/:id/cover)
      RTE.map(({ id }) => ({ id })),
    );
  }
}
