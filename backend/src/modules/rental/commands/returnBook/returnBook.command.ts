import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import {
  ensureOwnedBy,
  finishRental,
} from "@modules/rental/domain/bookRental.entity";
import { bookRentalNotFoundException } from "@modules/rental/domain/bookRental.errors";
import { BOOK_RENTAL_RETURNED } from "@modules/rental/domain/events/bookReturned.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { UUID } from "@shared/uuid/uuid";
import { PinoLogger } from "nestjs-pino";

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
    private readonly bookRentalRepository: BookRentalRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("ReturnBookCommand");
  }

  execute(command: ReturnBookCommand): Promise<void> {
    this.logger.info(
      command.bookRentalId,
      "ReturnBookCommand command received",
    );
    const task = FPF.pipe(
      //Data validation
      command.bookRentalId,
      fromInputRE(UUID, "uuid"),
      RTE.fromReaderEither,

      //Validate BookRental exists and belongs to the requester
      RTE.chain(
        FPF.flow(
          performRTE(
            this.bookRentalRepository.findById,
            "get book rental by id",
          ),
          RTE.chainW(RTE.fromOption<Error>(bookRentalNotFoundException)),
        ),
      ),
      RTE.chainEitherK(ensureOwnedBy(command.ownerId)),

      //Finish the rental, which must be active
      RTE.chainEitherK(finishRental(new Date())),

      //Store it and make book item available atomically
      RTE.tap(
        performRTE(this.bookRentalRepository.finish, "finish book rental."),
      ),

      //Emit domain event
      RTE.chain((bookRental) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit book returned event.",
        )({
          eventKey: BOOK_RENTAL_RETURNED,
          payload: {
            id: bookRental.id,
            bookItemId: bookRental.bookItemId,
          },
        }),
      ),
      RTE.asUnit,
    )({ logger: this.logger });
    return executeTask(task);
  }
}
