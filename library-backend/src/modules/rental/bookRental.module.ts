import { Module, ModuleMetadata, Provider } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookRentalRepository } from "./database/bookRental.repository.port";
import { RealBookRentalRepository } from "./database/realBookRental.repository";
import { PaginatedBookRentalsQueryHandler } from "./queries/paginatedBookRentals/paginatedBookRentals.query";
import { PaginatedBookRentalsController } from "./queries/paginatedBookRentals/paginatedBookRentals.controller";
import { RentBookCommandHandler } from "./commands/rentBook/rentBook.command";
import { ReturnBookCommandHandler } from "./commands/returnBook/returnBook.command";
import { UserRepository } from "../user/database/user.repository.port";
import { RealUserRepository } from "../user/database/realUser.repository";
import { ReturnBookController } from "./commands/returnBook/returnBook.controller";
import { RentBookController } from "./commands/rentBook/rentBook.controller";
import { RealBookInfoRepository } from "../book/database/realBookInfo.repository";
import { BookInfoRepository } from "../book/database/bookInfo.repository.port";
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
