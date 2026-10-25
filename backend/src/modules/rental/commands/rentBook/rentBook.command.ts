import { RentBookRequest } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import {
  BookRental,
  startRental,
} from "@modules/rental/domain/bookRental.entity";
import { bookRentalNotAvailableException } from "@modules/rental/domain/bookRental.errors";
import { bookRented } from "@modules/rental/domain/events/bookRented.event";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { Apply, FPF, RE, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class RentBookCommand implements ICommand {
  constructor(public readonly props: RentBookRequest) {}
}

@CommandHandler(RentBookCommand)
export class RentBookCommandHandler implements ICommandHandler<
  RentBookCommand,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookRentalRepository: BookRentalRepository,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly userRepository: UserRepository,
  ) {}

  execute(command: RentBookCommand): Promise<void> {
    return this.useCase.run(
      "RentBookCommand",
      command.props,
      FPF.pipe(
        //Data validation
        Apply.sequenceS(RE.Applicative)({
          bookItemId: fromInputRE(UUID, "bookItemId")(command.props.bookItemId),
          userId: fromInputRE(UUID, "userId")(command.props.userId),
          id: fromInputRE(
            UUID,
            "uuid",
          )(this.uuidGeneratorService.generateUUID()),
        }),
        RE.chain(fromInputRE(BookRental, "BookRental")),
        RTE.fromReaderEither,

        //Validate User exists
        RTE.tap((rental) =>
          findOrFailRTE(
            this.userRepository.findById,
            "get user by id",
            userNotFoundException,
          )(rental.userId),
        ),

        //Start the rental of the book item, which must be available
        RTE.chain((rental) =>
          FPF.pipe(
            rental.bookItemId,
            findOrFailRTE(
              this.bookInfoRepository.findBookItemById,
              "get book item by id",
              bookRentalNotAvailableException,
            ),
            RTE.chainEitherK(startRental(rental)),
          ),
        ),

        //Mark book item as rented and store rental atomically
        RTE.tap(performRTE(this.bookRentalRepository.rent, "rent book item.")),

        RTE.tap(publishRTE(bookRented)),
        RTE.asUnit,
      ),
    );
  }
}
