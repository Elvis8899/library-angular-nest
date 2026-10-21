import { AddBookItemHandler } from "@modules/book/commands/addBookItem/addBookItem.command";
import { AddBookItemController } from "@modules/book/commands/addBookItem/addBookItem.controller";
import { CreateBookInfoHandler } from "@modules/book/commands/createBookInfo/createBookInfo.command";
import { CreateBookInfoController } from "@modules/book/commands/createBookInfo/createBookInfo.controller";
import { DeleteBookInfoHandler } from "@modules/book/commands/deleteBookInfo/deleteBookInfo.command";
import { DeleteBookInfoController } from "@modules/book/commands/deleteBookInfo/deleteBookInfo.controller";
import { RemoveBookItemHandler } from "@modules/book/commands/removeBookItem/removeBookItem.command";
import { RemoveBookItemController } from "@modules/book/commands/removeBookItem/removeBookItem.controller";
import { UpdateBookInfoHandler } from "@modules/book/commands/updateBookInfo/updateBookInfo.command";
import { UpdateBookInfoController } from "@modules/book/commands/updateBookInfo/updateBookInfo.controller";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { RealBookInfoRepository } from "@modules/book/database/realBookInfo.repository";
import { GetBookInfoByIdController } from "@modules/book/queries/getBookInfoById/getBookInfoById.controller";
import { GetBookInfoByIdQueryHandler } from "@modules/book/queries/getBookInfoById/getBookInfoById.query";
import { PaginatedBookInfoController } from "@modules/book/queries/paginatedBookInfos/paginatedBookInfos.controller";
import { PaginatedBookInfosQueryHandler } from "@modules/book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { CreateBookInfoSubscriber } from "@modules/book/subscribers/createBookInfo.subscriber";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";

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
];
const queryHandlers = [
  PaginatedBookInfosQueryHandler,
  GetBookInfoByIdQueryHandler,
];
const subscribers = [CreateBookInfoSubscriber];
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
    ...commandHandlers,
    ...queryHandlers,
    ...services,
    ...repositories,
    ...subscribers,
  ],
})
export class BookModule {}
