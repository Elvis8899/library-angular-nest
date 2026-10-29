import { AddBookItemHandler } from "@modules/book/commands/addBookItem/addBookItem.command";
import { CreateBookInfoHandler } from "@modules/book/commands/createBookInfo/createBookInfo.command";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  BOOK_INFO_CREATED,
  BookInfoCreatedEvent,
} from "@modules/book/domain/events/bookInfoCreated.event";
import { AddFirstBookItemSubscriber } from "@modules/book/subscribers/addFirstBookItem.subscriber";
import { CqrsModule } from "@shared/utils/application/cqrs";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { seedBook } from "@test/modules/book/createBook";
import { useHandlerModule } from "@test/util/handlerModule";

describe("[Unit] Add first book item", () => {
  const ctx = useHandlerModule(
    {
      providers: [
        CreateBookInfoHandler,
        AddBookItemHandler,
        AddFirstBookItemSubscriber,
      ],
      imports: [CqrsModule],
      init: true,
    },
    (get) => ({
      bookInfoRepository: get(BookInfoRepository),
      addFirstBookItemSubscriber: get(AddFirstBookItemSubscriber),
    }),
  );

  it("Should add a copy to a new book", async () => {
    // Given a valid saved book
    const book = new BookInfoBuilder().build();
    await seedBook(ctx.bookInfoRepository, book);

    // And a valid event
    const responseWatcherEvent = BookInfoCreatedEvent.parse({
      eventKey: BOOK_INFO_CREATED,
      payload: {
        id: book.id,
        name: book.name,
      },
    });
    //When the function is called
    const resultPromise = ctx.addFirstBookItemSubscriber.addFirstBookItem(
      responseWatcherEvent.payload,
    );

    //Then it should resolve to undefined
    await expect(resultPromise).resolves.toBe(undefined);
    // and  should have created a bookItem
    const bookItems = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookItems[0]?.bookItems.length).toEqual(2);
  });
});
