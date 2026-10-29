import { Resource } from "@library/contracts";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import {
  ensureOwnedBy,
  finishRental,
} from "@modules/rental/domain/bookRental.entity";
import { bookRentalNotFoundException } from "@modules/rental/domain/bookRental.errors";
import { bookReturned } from "@modules/rental/domain/events/bookReturned.event";
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

export class ReturnBookCommand extends Command {
  /**
   * @param ownerId when set, the rental must belong to this user
   * (used for clients, who may only return their own rentals)
   */
  constructor(
    public readonly bookRentalId: string,
    public readonly ownerId?: string,
  ) {
    super();
  }
}

@CommandHandler(ReturnBookCommand)
export class ReturnBookCommandHandler extends UseCaseHandler<ReturnBookCommand> {
  constructor(
    private readonly clock: Clock,
    private readonly bookRentalRepository: BookRentalRepository,
  ) {
    super();
  }

  protected logged(command: ReturnBookCommand): unknown {
    return command.bookRentalId;
  }

  protected pipeline(command: ReturnBookCommand) {
    return FPF.pipe(
      inputsRTE({ id: [UUID, "id", command.bookRentalId] }),

      //Validate BookRental exists and belongs to the requester
      RTE.chain(({ id }) =>
        orFail(
          perform(this.bookRentalRepository).findById(id),
          bookRentalNotFoundException,
        ),
      ),
      RTE.chainEitherK(ensureOwnedBy(command.ownerId)),

      //Finish the rental, which must be active
      RTE.chainEitherK(finishRental(this.clock.now())),

      //Store it and make book item available atomically
      RTE.tap(perform(this.bookRentalRepository).finish),

      RTE.tap(publishRTE(bookReturned)),
      RTE.tap(() =>
        changedRTE(
          { resource: Resource.Rentals },
          // The copy is available again
          { resource: Resource.Books },
        ),
      ),
      RTE.asUnit,
    );
  }
}
