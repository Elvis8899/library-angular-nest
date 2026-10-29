import { RentBookRequest, Resource } from "@library/contracts";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import {
  newRental,
  RentalInput,
  startRental,
} from "@modules/rental/domain/bookRental.entity";
import { bookRentalNotAvailableException } from "@modules/rental/domain/bookRental.errors";
import { bookRented } from "@modules/rental/domain/events/bookRented.event";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { bindAll, orFail, perform } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCaseHandler,
} from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class RentBookCommand extends Command {
  constructor(public readonly props: RentBookRequest) {
    super();
  }
}

@CommandHandler(RentBookCommand)
export class RentBookCommandHandler extends UseCaseHandler<RentBookCommand> {
  constructor(
    private readonly clock: Clock,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly bookRentalRepository: BookRentalRepository,
    private readonly bookInfoRepository: BookInfoRepository,
    private readonly userRepository: UserRepository,
  ) {
    super();
  }

  protected logged(command: RentBookCommand): unknown {
    return command.props;
  }

  protected pipeline(command: RentBookCommand) {
    return FPF.pipe(
      inputsRTE({
        id: [UUID, "uuid", this.uuidGeneratorService.generateUUID()],
        input: [RentalInput, "BookRental", command.props],
      }),
      RTE.map(({ id, input }) => newRental(id, input, this.clock.now())),

      RTE.bindTo("rental"),

      //The user must exist, and the book item be available
      bindAll(({ rental }) => ({
        user: orFail(
          perform(this.userRepository).findById(rental.userId),
          userNotFoundException,
        ),
        bookItem: orFail(
          perform(this.bookInfoRepository).findBookItemById(rental.bookItemId),
          bookRentalNotAvailableException,
        ),
      })),

      //Start the rental of the book item
      RTE.chainEitherK(({ rental, bookItem }) => startRental(rental)(bookItem)),

      //Mark book item as rented and store rental atomically
      RTE.tap(perform(this.bookRentalRepository).rent),

      RTE.tap(publishRTE(bookRented)),
      RTE.tap(() =>
        changedRTE(
          { resource: Resource.Rentals },
          // A copy is no longer available
          { resource: Resource.Books },
        ),
      ),
      RTE.asUnit,
    );
  }
}
