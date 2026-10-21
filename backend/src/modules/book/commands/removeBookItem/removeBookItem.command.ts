import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  availableBookItemNotFoundException,
  bookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { ensureAvailable } from "@modules/book/domain/bookItem.entity";
import { bookItemRemoved } from "@modules/book/domain/events/bookItemRemoved.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class RemoveBookItem implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(RemoveBookItem)
export class RemoveBookItemHandler implements ICommandHandler<
  RemoveBookItem,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {}

  execute(command: RemoveBookItem): Promise<void> {
    return this.useCase.run(
      "RemoveBookItem",
      command.props,
      FPF.pipe(
        //Data validation
        command.props,
        fromInputRE(UUID, "id"),
        RTE.fromReaderEither,

        //Validate BookItem exists and is available
        RTE.chain(
          findOrFailRTE(
            this.bookInfoRepository.findBookItemById,
            "get bookItem by id",
            bookInfoNotFoundException,
          ),
        ),
        RTE.chainEitherK(ensureAvailable(availableBookItemNotFoundException)),

        //Delete entity
        RTE.tap((bookItem) =>
          performRTE(
            this.bookInfoRepository.deleteBookItem,
            "delete bookItem in storage system.",
          )(bookItem.id),
        ),

        RTE.tap(publishRTE(bookItemRemoved)),
        RTE.asUnit,
      ),
    );
  }
}
