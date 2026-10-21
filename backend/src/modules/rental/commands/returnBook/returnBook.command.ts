import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import { bookRentalNotFoundException } from "@modules/rental/domain/bookRental.errors";
import { BOOK_RENTAL_RETURNED } from "@modules/rental/domain/events/bookReturned.event";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { DateType } from "@shared/utils/domain/dateType";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
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

      //Validate BookRental exists and belongs to the requester;
      //someone else's rental is reported as not found
      RTE.chain((data) =>
        FPF.pipe(
          data.id,
          performRTE(
            this.bookRentalRepository.findById,
            "get book rental by id",
          ),
          RTE.chainW(RTE.fromOption<Error>(bookRentalNotFoundException)),
          RTE.filterOrElseW(
            (bookRental) =>
              command.ownerId === undefined ||
              bookRental.userId === command.ownerId,
            bookRentalNotFoundException,
          ),
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
      RTE.asUnit,
    )({ logger: this.logger });
    return executeTask(task);
  }
}
