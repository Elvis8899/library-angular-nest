import { BookItemRequest, Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { BookItem } from "@modules/book/domain/bookItem.entity";
import { bookItemCreated } from "@modules/book/domain/events/bookItemCreated.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCase,
} from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class AddBookItem implements ICommand {
  constructor(public readonly props: BookItemRequest) {}
}

@CommandHandler(AddBookItem)
export class AddBookItemHandler implements ICommandHandler<AddBookItem, void> {
  constructor(
    private readonly useCase: UseCase,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {}

  execute(command: AddBookItem): Promise<void> {
    return this.useCase.run(
      "AddBookItem",
      command.props,
      FPF.pipe(
        //Data validation
        RE.of(command.props),
        RE.bind("id", () =>
          fromInputRE(UUID, "uuid")(this.uuidGeneratorService.generateUUID()),
        ),
        RE.chain(fromInputRE(BookItem, "BookItem")),
        RTE.fromReaderEither,

        //Validate BookInfo exists
        RTE.tap((bookItem) =>
          findOrFailRTE(
            this.bookInfoRepository.findById,
            "get bookInfo by id",
            bookInfoNotFoundException,
          )(bookItem.bookId),
        ),

        //Store entity
        RTE.tap(
          performRTE(
            this.bookInfoRepository.createBookItem,
            "save bookItem in storage system.",
          ),
        ),

        RTE.tap(publishRTE(bookItemCreated)),
        RTE.tap((bookItem) =>
          changedRTE({ resource: Resource.Books, key: bookItem.bookId }),
        ),
        RTE.asUnit,
      ),
    );
  }
}
