import { AddBookItemHandler } from "@book/commands/addBookItem/addBookItem.command";
import { AddBookItemController } from "@book/commands/addBookItem/addBookItem.controller";
import { ChangeBookItemStatusHandler } from "@book/commands/changeBookItemStatus/changeBookItemStatus.command";
import { CreateBookInfoHandler } from "@book/commands/createBookInfo/createBookInfo.command";
import { CreateBookInfoController } from "@book/commands/createBookInfo/createBookInfo.controller";
import { DeleteBookInfoHandler } from "@book/commands/deleteBookInfo/deleteBookInfo.command";
import { DeleteBookInfoController } from "@book/commands/deleteBookInfo/deleteBookInfo.controller";
import { RemoveBookItemHandler } from "@book/commands/removeBookItem/removeBookItem.command";
import { RemoveBookItemController } from "@book/commands/removeBookItem/removeBookItem.controller";
import { UpdateBookInfoHandler } from "@book/commands/updateBookInfo/updateBookInfo.command";
import { UpdateBookInfoController } from "@book/commands/updateBookInfo/updateBookInfo.controller";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { RealBookInfoRepository } from "@book/database/realBookInfo.repository";
import { GetBookInfoByIdController } from "@book/queries/getBookById/getBookInfoById.controller";
import { GetBookInfoByIdQueryHandler } from "@book/queries/getBookById/getBookInfoById.query";
import { PaginatedBookInfoController } from "@book/queries/paginatedBookInfos/paginatedBookInfos.controller";
import { PaginatedBookInfosQueryHandler } from "@book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { BookRentSubscriber } from "@book/subscriber/bookRent.subscriber";
import { BookReturnSubscriber } from "@book/subscriber/bookReturn.subscriber";
import { CreateBookInfoSubscriber } from "@book/subscriber/createBookInfo.subscriber";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";

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
