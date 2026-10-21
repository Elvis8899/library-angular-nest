import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { bookInfoDeleted } from "@modules/book/domain/events/bookInfoDeleted.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class DeleteBookInfo implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(DeleteBookInfo)
export class DeleteBookInfoHandler implements ICommandHandler<
  DeleteBookInfo,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {}

  execute(command: DeleteBookInfo): Promise<void> {
    return this.useCase.run(
      "DeleteBookInfo",
      command.props,
      FPF.pipe(
        //Data validation
        command.props,
        fromInputRE(UUID, "id"),
        RTE.fromReaderEither,

        //Validate BookInfo exists
        RTE.chain(
          findOrFailRTE(
            this.bookInfoRepository.findById,
            "get bookInfo by id",
            bookInfoNotFoundException,
          ),
        ),

        //Delete entity
        RTE.tap((bookInfo) =>
          performRTE(
            this.bookInfoRepository.deleteById,
            "delete bookInfo in storage system.",
          )(bookInfo.id),
        ),

        RTE.tap(publishRTE(bookInfoDeleted)),
        RTE.asUnit,
      ),
    );
  }
}
