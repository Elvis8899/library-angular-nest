import { BookInfoRequest, Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  BookDetails,
  changeBookDetails,
} from "@modules/book/domain/bookInfo.entity";
import { bookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { bookInfoUpdated } from "@modules/book/domain/events/bookInfoUpdated.event";
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
import { UUID } from "@shared/uuid/uuid";

export class UpdateBookInfo extends Command {
  constructor(
    public readonly props: BookInfoRequest,
    public readonly id: string,
  ) {
    super();
  }
}

@CommandHandler(UpdateBookInfo)
export class UpdateBookInfoHandler extends UseCaseHandler<UpdateBookInfo> {
  constructor(
    private readonly clock: Clock,
    private readonly bookInfoRepository: BookInfoRepository,
  ) {
    super();
  }

  protected logged(command: UpdateBookInfo): unknown {
    return { id: command.id, ...command.props };
  }

  protected pipeline(command: UpdateBookInfo) {
    return FPF.pipe(
      inputsRTE({
        id: [UUID, "uuid", command.id],
        changes: [BookDetails, "BookInfo", command.props],
      }),

      //Validate BookInfo exists, then apply the changes
      RTE.bind("before", ({ id }) =>
        orFail(
          perform(this.bookInfoRepository).findById(id),
          bookInfoNotFoundException,
        ),
      ),
      RTE.map(({ before, changes }) =>
        changeBookDetails(changes, this.clock.now())(before),
      ),

      //Store entity
      RTE.tap(perform(this.bookInfoRepository).save),

      RTE.tap(publishRTE(bookInfoUpdated)),
      RTE.tap((bookInfo) =>
        changedRTE({ resource: Resource.Books, key: bookInfo.id }),
      ),
      RTE.asUnit,
    );
  }
}
