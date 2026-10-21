import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { RealBookInfoRepository } from "@modules/book/database/realBookInfo.repository";
import { RentBookCommandHandler } from "@modules/rental/commands/rentBook/rentBook.command";
import { RentBookController } from "@modules/rental/commands/rentBook/rentBook.controller";
import { ReturnBookCommandHandler } from "@modules/rental/commands/returnBook/returnBook.command";
import { ReturnBookController } from "@modules/rental/commands/returnBook/returnBook.controller";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { RealBookRentalRepository } from "@modules/rental/database/realBookRental.repository";
import { PaginatedBookRentalsController } from "@modules/rental/queries/paginatedBookRentals/paginatedBookRentals.controller";
import { PaginatedBookRentalsQueryHandler } from "@modules/rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { RealUserRepository } from "@modules/user/database/realUser.repository";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { Module, ModuleMetadata, Provider } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
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
    ...commandHandlers,
    ...queryHandlers,
    ...services,
    ...repositories,
    ...subscribers,
  ],
})
export class RentalModule {}
