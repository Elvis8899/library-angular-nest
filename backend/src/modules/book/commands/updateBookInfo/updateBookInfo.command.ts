import { BookInfoRequest, Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { bookInfoUpdated } from "@modules/book/domain/events/bookInfoUpdated.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCase,
} from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class UpdateBookInfo implements ICommand {
  constructor(
    public readonly props: BookInfoRequest,
    public readonly id: string,
  ) {}
}

@CommandHandler(UpdateBookInfo)
export class UpdateBookInfoHandler implements ICommandHandler<
  UpdateBookInfo,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {}

  execute(command: UpdateBookInfo): Promise<void> {
    return this.useCase.run(
      "UpdateBookInfo",
      // The id names the record in the audit
      { id: command.id, ...command.props },
      FPF.pipe(
        //Data validation
        RE.of(command.props),
        RE.bind("id", () => fromInputRE(UUID, "uuid")(command.id)),
        RE.chain(fromInputRE(BookInfo, "bookInfo")),
        RTE.fromReaderEither,

        //Validate BookInfo exists
        RTE.tap((bookInfo) =>
          findOrFailRTE(
            this.bookInfoRepository.findById,
            "get bookInfo by id",
            bookInfoNotFoundException,
          )(bookInfo.id),
        ),

        //Store entity
        RTE.tap(
          performRTE(
            this.bookInfoRepository.save,
            "save bookInfo in storage system.",
          ),
        ),

        RTE.tap(publishRTE(bookInfoUpdated)),
        RTE.tap((bookInfo) =>
          changedRTE({ resource: Resource.Books, key: bookInfo.id }),
        ),
        RTE.asUnit,
      ),
    );
  }
}
