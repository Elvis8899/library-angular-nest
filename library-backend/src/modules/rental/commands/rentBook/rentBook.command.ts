import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { BookItemStatusEnum } from "@book/domain/value-object/bookItem.entity";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { BookRental } from "@rental/domain/bookRental.entity";
import { bookRentalNotAvailableException } from "@rental/domain/bookRental.errors";
import { BOOK_RENTAL_RENTED } from "@rental/domain/events/bookRented.event";
import { CreateBookRentalDto } from "@rental/dtos/bookRental.dto";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { Apply, FPF, RE, RTE } from "@shared/functional/monads";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@shared/utils/fromInput";
import { noop } from "@shared/utils/noop";
import { performRTE } from "@shared/utils/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/entities/uuid";
import { UserRepository } from "@user/database/user.repository.port";
import { userNotFoundException } from "@user/domain/user.errors";
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

      //Validate Book exists and is available
      RTE.tap(
        FPF.flow(
          (data) => data.bookItemId,
          performRTE(
            this.bookInfoRepository.findBookItemById,
            "get user by id",
          ),

          RTE.chainW(RTE.fromOption<Error>(bookRentalNotAvailableException)),
          RTE.filterOrElseW(
            (bookItem) => bookItem.status === BookItemStatusEnum.Available,
            bookRentalNotAvailableException,
          ),
        ),
      ),

      //Store entity
      RTE.tap(
        performRTE(
          this.bookRentalRepository.save,
          "save bookInfo in storage system.",
        ),
      ),

      // //Emit domain event
      RTE.chain((bookInfo) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit bookInfo created event.",
        )({
          eventKey: BOOK_RENTAL_RENTED,
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
