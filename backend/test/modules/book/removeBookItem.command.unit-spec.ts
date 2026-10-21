import {
  RemoveBookItem,
  RemoveBookItemHandler,
} from "@modules/book/commands/removeBookItem/removeBookItem.command";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import {
  AvailableBookItemNotFoundException,
  BookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { BookItemStatusEnum } from "@modules/book/domain/bookItem.entity";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] Delete BookInfo", () => {
  const ctx = useHandlerModule(
    { providers: [RemoveBookItemHandler] },
    (get) => ({
      bookInfoRepository: get(BookInfoRepository),
      removeBookItemHandler: get(RemoveBookItemHandler),
      eventModule: get(DomainEventPublisher),
    }),
  );

  it("Should delete bookInfo if id is valid", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    const id = createTestId(TableNameEnum.BookItem, 0);

    //When we delete a bookInfo
    const resultPromise = ctx.removeBookItemHandler.execute(
      new RemoveBookItem(id),
    );
    //Then it should have deleted a bookInfo
    await expect(resultPromise).resolves.toBe(undefined);
    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
    expect(bookInfos[0]?.bookItems.length).toEqual(0);
  });

  it("Should not delete bookInfo if it is not available", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder()
      .withBookItems([
        {
          id: createTestId(TableNameEnum.BookItem, 0),
          status: BookItemStatusEnum.Rented,
          bookId: createTestId(TableNameEnum.BookInfo, 0),
        },
      ])
      .build();
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    const id = createTestId(TableNameEnum.BookItem, 0);

    //When we delete a bookInfo
    const resultPromise = ctx.removeBookItemHandler.execute(
      new RemoveBookItem(id),
    );
    //Then it should have deleted a bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      AvailableBookItemNotFoundException,
    );
    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
    expect(bookInfos[0]?.bookItems.length).toEqual(1);
  });

  it("Should not delete bookInfo if id doesnt exists", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    const newId = createTestId(TableNameEnum.None, 0);

    //When we delete a bookInfo
    const resultPromise = ctx.removeBookItemHandler.execute(
      new RemoveBookItem(newId),
    );
    //Then it should not have deleted a bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is deleted", async () => {
    //Given a bookInfo

    const spy = jest.spyOn(ctx.eventModule, "publishEvent");

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    const id = createTestId(TableNameEnum.BookItem, 0);

    //When we delete a bookInfo
    await ctx.removeBookItemHandler.execute(new RemoveBookItem(id));

    //Then it should have deleted a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should not emit domain event when bookInfo is not deleted", async () => {
    //Given a bookInfo

    const spy = jest.spyOn(ctx.eventModule, "publishEvent");

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(ctx.bookInfoRepository.save(bookInfo));

    const newId = createTestId(TableNameEnum.None, 0);
    //When we delete a bookInfo
    const resultPromise = ctx.removeBookItemHandler.execute(
      new RemoveBookItem(newId),
    );
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
    //Then it should have deleted a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(0);
  });
});
