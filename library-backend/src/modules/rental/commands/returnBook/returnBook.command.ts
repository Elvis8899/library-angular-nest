import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@rental/domain/bookRental.entity";
import {
  bookRentalFinishedException,
  bookRentalNotFoundException,
} from "@rental/domain/bookRental.errors";
import { BOOK_RENTAL_RETURNED } from "@rental/domain/events/bookReturned.event";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";
import { performRTE } from "@shared/utils/application/perform";
import { DateType } from "@shared/utils/domain/DateType";
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

      //Validate BookRental exists and is not finished
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
              bookRental.rentalStatus !== RentalStatusEnum.Finished,
            bookRentalFinishedException,
          ),
          RTE.map((bookRental) => ({
            ...bookRental,
            ...data,
          })),
        ),
      ),
      //Store entity
      RTE.tap(
        performRTE(
          this.bookRentalRepository.save,
          "save bookInfo in storage system.",
        ),
      ),

      //Emit domain event
      RTE.chain((bookInfo) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookInfo Updated event.",
        )({
          eventKey: BOOK_RENTAL_RETURNED,
          payload: {
            id: bookInfo.id,
            bookItemId: bookInfo.bookItemId,
          },
        }),
      ),
      RTE.map(noop),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
