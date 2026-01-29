import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { RealBookInfoRepository } from "@book/database/realBookInfo.repository";
import { Module, ModuleMetadata, Provider } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RentBookCommandHandler } from "@rental/commands/rentBook/rentBook.command";
import { RentBookController } from "@rental/commands/rentBook/rentBook.controller";
import { ReturnBookCommandHandler } from "@rental/commands/returnBook/returnBook.command";
import { ReturnBookController } from "@rental/commands/returnBook/returnBook.controller";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { RealBookRentalRepository } from "@rental/database/realBookRental.repository";
import { PaginatedBookRentalsController } from "@rental/queries/paginatedBookRentals/paginatedBookRentals.controller";
import { PaginatedBookRentalsQueryHandler } from "@rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { RealUserRepository } from "@user/database/realUser.repository";
import { UserRepository } from "@user/database/user.repository.port";
const controllers: ModuleMetadata["controllers"] = [
  PaginatedBookRentalsController,
  RentBookController,
  ReturnBookController,
];
const commandHandlers: Provider[] = [
  RentBookCommandHandler,
  ReturnBookCommandHandler,
];
const queryHandlers: Provider[] = [PaginatedBookRentalsQueryHandler];
const subscribers: Provider[] = [];
const services = [RealUUIDGeneratorService];
const repositories = [
  {
    provide: BookRentalRepository,
    useClass: RealBookRentalRepository,
  },
  {
    provide: UserRepository,
    useClass: RealUserRepository,
  },
  {
    provide: BookInfoRepository,
    useClass: RealBookInfoRepository,
  },
];

@Module({
  imports: [CqrsModule],
  controllers: [...controllers],
  providers: [
    //...controllers,
    ...commandHandlers,
    ...queryHandlers,
    ...services,
    ...repositories,
    ...subscribers,
  ],
})
export class BookRentalModule {}
