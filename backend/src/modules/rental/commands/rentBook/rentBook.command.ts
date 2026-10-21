import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import {
  BookRental,
  startRental,
} from "@modules/rental/domain/bookRental.entity";
import { bookRentalNotAvailableException } from "@modules/rental/domain/bookRental.errors";
import { BOOK_RENTAL_RENTED } from "@modules/rental/domain/events/bookRented.event";
import { CreateBookRentalDto } from "@modules/rental/dtos/bookRental.dto";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { Apply, FPF, RE, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";
import { PinoLogger } from "nestjs-pino";

export class RentBookCommand implements ICommand {
  constructor(public readonly props: CreateBookRentalDto) {}
}

@CommandHandler(RentBookCommand)
export class RentBookCommandHandler implements ICommandHandler<
  RentBookCommand,
  void
> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookRentalRepository: BookRentalRepository,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly userRepository: UserRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("RentBookCommand");
  }

  execute(command: RentBookCommand): Promise<void> {
    this.logger.info(command.props, "RentBookCommand command received");
    const task = FPF.pipe(
      //Data validation
      Apply.sequenceS(RE.Applicative)({
        bookItemId: fromInputRE(UUID, "bookItemId")(command.props.bookItemId),
        userId: fromInputRE(UUID, "userId")(command.props.userId),
        id: fromInputRE(UUID, "uuid")(this.uuidGeneratorService.generateUUID()),
      }),

      RE.chain(fromInputRE(BookRental, "BookRental")),
      RTE.fromReaderEither,

      //Validate User exists
      RTE.tap(
        FPF.flow(
          (data) => data.userId,
          performRTE(this.userRepository.findById, "get user by id"),
          RTE.chainW(RTE.fromOption<Error>(userNotFoundException)),
        ),
      ),

      //Start the rental of the book item, which must be available
      RTE.chain((rental) =>
        FPF.pipe(
          rental.bookItemId,
          performRTE(
            this.bookInfoRepository.findBookItemById,
            "get book item by id",
          ),
          RTE.chainW(RTE.fromOption<Error>(bookRentalNotAvailableException)),
          RTE.chainEitherK(startRental(rental)),
        ),
      ),

      //Mark book item as rented and store rental atomically
      RTE.tap(performRTE(this.bookRentalRepository.rent, "rent book item.")),

      //Emit domain event
      RTE.chain((bookRental) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit book rented event.",
        )({
          eventKey: BOOK_RENTAL_RENTED,
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
