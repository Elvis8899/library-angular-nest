import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoRepository } from "./database/bookInfo.repository.port";
import { CreateBookInfoHandler } from "./commands/createBookInfo/createBookInfo.command";
import { RealBookInfoRepository } from "./database/realBookInfo.repository";
import { CreateBookInfoController } from "./commands/createBookInfo/createBookInfo.controller";
import { UpdateBookInfoController } from "./commands/updateBookInfo/updateBookInfo.controller";
import { DeleteBookInfoController } from "./commands/deleteBookInfo/deleteBookInfo.controller";
import { UpdateBookInfoHandler } from "./commands/updateBookInfo/updateBookInfo.command";
import { DeleteBookInfoHandler } from "./commands/deleteBookInfo/deleteBookInfo.command";
import { PaginatedBookInfosQueryHandler } from "./queries/paginatedBookInfos/paginatedBookInfos.query";
import { PaginatedBookInfoController } from "./queries/paginatedBookInfos/paginatedBookInfos.controller";
import { GetBookInfoByIdController } from "./queries/getBookById/getBookInfoById.controller";
import { GetBookInfoByIdQueryHandler } from "./queries/getBookById/getBookInfoById.query";
import { CreateBookInfoSubscriber } from "./subscriber/createBookInfo.subscriber";
import { AddBookItemHandler } from "./commands/addBookItem/addBookItem.command";
import { AddBookItemController } from "./commands/addBookItem/addBookItem.controller";
import { RemoveBookItemController } from "./commands/removeBookItem/removeBookItem.controller";
import { RemoveBookItemHandler } from "./commands/removeBookItem/removeBookItem.command";
import { BookRentSubscriber } from "./subscriber/bookRent.subscriber";
import { BookReturnSubscriber } from "./subscriber/bookReturn.subscriber";
import { ChangeBookItemStatusHandler } from "./commands/changeBookItemStatus/changeBookItemStatus.command";

const controllers = [
  CreateBookInfoController,
  UpdateBookInfoController,
  DeleteBookInfoController,
  PaginatedBookInfoController,
  GetBookInfoByIdController,
  AddBookItemController,
  RemoveBookItemController,
];
const commandHandlers = [
  CreateBookInfoHandler,
  UpdateBookInfoHandler,
  DeleteBookInfoHandler,
  AddBookItemHandler,
  RemoveBookItemHandler,
  ChangeBookItemStatusHandler,
];
const queryHandlers = [
  PaginatedBookInfosQueryHandler,
  GetBookInfoByIdQueryHandler,
];
const subscribers = [
  CreateBookInfoSubscriber,
  BookRentSubscriber,
  BookReturnSubscriber,
];
const services = [RealUUIDGeneratorService];
const repositories = [
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
export class BookInfoModule {}
