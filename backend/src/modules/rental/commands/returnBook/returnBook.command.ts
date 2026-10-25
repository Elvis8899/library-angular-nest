import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import {
  ensureOwnedBy,
  finishRental,
} from "@modules/rental/domain/bookRental.entity";
import { bookRentalNotFoundException } from "@modules/rental/domain/bookRental.errors";
import { bookReturned } from "@modules/rental/domain/events/bookReturned.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { Clock } from "@shared/clock/clock";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class ReturnBookCommand implements ICommand {
  /**
   * @param ownerId when set, the rental must belong to this user
   * (used for clients, who may only return their own rentals)
   */
  constructor(
    public readonly bookRentalId: string,
    public readonly ownerId?: string,
  ) {}
}

@CommandHandler(ReturnBookCommand)
export class ReturnBookCommandHandler implements ICommandHandler<
  ReturnBookCommand,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly clock: Clock,
    private readonly bookRentalRepository: BookRentalRepository,
  ) {}

  execute(command: ReturnBookCommand): Promise<void> {
    return this.useCase.run(
      "ReturnBookCommand",
      command.bookRentalId,
      FPF.pipe(
        //Data validation
        command.bookRentalId,
        fromInputRE(UUID, "uuid"),
        RTE.fromReaderEither,

        //Validate BookRental exists and belongs to the requester
        RTE.chain(
          findOrFailRTE(
            this.bookRentalRepository.findById,
            "get book rental by id",
            bookRentalNotFoundException,
          ),
        ),
        RTE.chainEitherK(ensureOwnedBy(command.ownerId)),

        //Finish the rental, which must be active
        RTE.chainEitherK(finishRental(this.clock.now())),

        //Store it and make book item available atomically
        RTE.tap(
          performRTE(this.bookRentalRepository.finish, "finish book rental."),
        ),

        RTE.tap(publishRTE(bookReturned)),
        RTE.asUnit,
      ),
    );
  }
}
