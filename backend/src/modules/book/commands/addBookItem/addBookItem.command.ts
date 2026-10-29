import { BookItemRequest, Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import {
  BookItemInput,
  newBookItem,
} from "@modules/book/domain/bookItem.entity";
import { bookItemCreated } from "@modules/book/domain/events/bookItemCreated.event";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCaseHandler,
} from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class AddBookItem extends Command {
  constructor(public readonly props: BookItemRequest) {
    super();
  }
}

@CommandHandler(AddBookItem)
export class AddBookItemHandler extends UseCaseHandler<AddBookItem> {
  constructor(
    private readonly clock: Clock,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {
    super();
  }

  protected logged(command: AddBookItem): unknown {
    return command.props;
  }

  protected pipeline(command: AddBookItem) {
    return FPF.pipe(
      //Data validation
      inputsRTE({
        id: [UUID, "uuid", this.uuidGeneratorService.generateUUID()],
        input: [BookItemInput, "BookItem", command.props],
      }),

      //Validate BookInfo exists, then build the copy
      RTE.tap(({ input }) =>
        orFail(
          perform(this.bookInfoRepository).findById(input.bookId),
          bookInfoNotFoundException,
        ),
      ),
      RTE.map(({ id, input }) => newBookItem(id, input, this.clock.now())),

      //Store entity
      RTE.tap(perform(this.bookInfoRepository).createBookItem),

      RTE.tap(publishRTE(bookItemCreated)),
      RTE.tap((bookItem) =>
        changedRTE({ resource: Resource.Books, key: bookItem.bookId }),
      ),
      RTE.asUnit,
    );
  }
}
