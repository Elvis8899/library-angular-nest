import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@rental/domain/bookRental.entity";
import { bookRentalNotFoundException } from "@rental/domain/bookRental.errors";
import { BOOK_RENTAL_RETURNED } from "@rental/domain/events/bookReturned.event";
import { DomainEventPublisher } from "@shared/domainEventPublisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";
import { performRTE } from "@shared/utils/application/perform";
import { DateType } from "@shared/utils/domain/dateType";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/entities/uuid";
import { PinoLogger } from "nestjs-pino";

export class ReturnBookCommand implements ICommand {
  constructor(public readonly bookRentalId: string) {}
}

@CommandHandler(ReturnBookCommand)
export class ReturnBookCommandHandler implements ICommandHandler<
  ReturnBookCommand,
  void
> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
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
      RE.of({
        rentalStatus: RentalStatusEnum.Finished,
      }),
      RE.bind("id", () => fromInputRE(UUID, "uuid")(command.bookRentalId)),
      RE.bind("deliveryDate", () => fromInputRE(DateType, "date")(new Date())),

      RTE.fromReaderEither,

      //Validate BookRental exists
      RTE.chain((data) =>
        FPF.pipe(
          data.id,
          performRTE(
            this.bookRentalRepository.findById,
            "get book rental by id",
          ),
          RTE.chainW(RTE.fromOption<Error>(bookRentalNotFoundException)),
          RTE.map((bookRental) => ({
            ...bookRental,
            ...data,
          })),
        ),
      ),
      //Finish rental and make book item available atomically;
      //fails if the rental was already finished
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
      RTE.map(noop),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
