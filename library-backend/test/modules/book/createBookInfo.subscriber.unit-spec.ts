import { AddBookItemHandler } from "@book/commands/addBookItem/addBookItem.command";
import { CreateBookInfoHandler } from "@book/commands/createBookInfo/createBookInfo.command";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import {
  BOOK_INFO_CREATED,
  BookInfoCreatedEvent,
} from "@book/domain/events/bookInfoCreated.event";
import { CreateBookInfoSubscriber } from "@book/subscriber/createBookInfo.subscriber";
import { CqrsModule } from "@nestjs/cqrs";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { createHandlerModule } from "@test/util/handlerModule";

describe("[Unit] Endpoint Response - Subscriber", () => {
  let createBookInfoSubscriber: CreateBookInfoSubscriber;
  let bookInfoRepository: BookInfoRepository;

  beforeEach(async () => {
    const moduleRef = await createHandlerModule(
      [CreateBookInfoHandler, AddBookItemHandler, CreateBookInfoSubscriber],
      [CqrsModule],
    );
    await moduleRef.init();
    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    createBookInfoSubscriber = moduleRef.get<CreateBookInfoSubscriber>(
      CreateBookInfoSubscriber,
    );
  });

  it("Should not return error", async () => {
    // Given a valid saved book
    const book = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(book));

    // And a valid event
    const responseWatcherEvent = BookInfoCreatedEvent.parse({
      eventKey: BOOK_INFO_CREATED,
      payload: {
        id: book.id,
        name: book.name,
      },
    });
    //When the function is called
    const resultPromise = createBookInfoSubscriber.afterBookInfoCreatedEvent(
      responseWatcherEvent.payload,
    );

    //Then it should resolve to undefined
    await expect(resultPromise).resolves.toBe(undefined);
    // and  should have created a bookItem
    const bookItems = await executeTask(bookInfoRepository.findAll());
    expect(bookItems[0]?.bookItems.length).toEqual(2);
  });
});
