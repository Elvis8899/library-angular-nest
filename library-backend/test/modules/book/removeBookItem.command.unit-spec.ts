import {
  RemoveBookItem,
  RemoveBookItemHandler,
} from "@book/commands/removeBookItem/removeBookItem.command";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import {
  AvailableBookItemNotFoundException,
  BookInfoNotFoundException,
} from "@book/domain/bookInfo.errors";
import { BookItemStatusEnum } from "@book/domain/valueObject/bookItem.entity";
import { DomainEventPublisher } from "@shared/domainEventPublisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { createHandlerModule } from "@test/util/handlerModule";

//Adapters
let bookInfoRepository: BookInfoRepository;
let eventModule: DomainEventPublisher;

describe("[Unit] Delete BookInfo", () => {
  let removeBookItemHandler: RemoveBookItemHandler;

  beforeEach(async () => {
    const moduleRef = await createHandlerModule([RemoveBookItemHandler]);

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    removeBookItemHandler = moduleRef.get<RemoveBookItemHandler>(
      RemoveBookItemHandler,
    );
    eventModule = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);
  });

  it("Should delete bookInfo if id is valid", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));
    const id = createTestId(TableNameEnum.BookItem, 0);

    //When we delete a bookInfo
    const resultPromise = removeBookItemHandler.execute(new RemoveBookItem(id));
    //Then it should have deleted a bookInfo
    await expect(resultPromise).resolves.toBe(undefined);
    const bookInfos = await executeTask(bookInfoRepository.findAll());
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
    await executeTask(bookInfoRepository.save(bookInfo));
    const id = createTestId(TableNameEnum.BookItem, 0);

    //When we delete a bookInfo
    const resultPromise = removeBookItemHandler.execute(new RemoveBookItem(id));
    //Then it should have deleted a bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      AvailableBookItemNotFoundException,
    );
    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
    expect(bookInfos[0]?.bookItems.length).toEqual(1);
  });

  it("Should not delete bookInfo if id doesnt exists", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));
    const newId = createTestId(TableNameEnum.None, 0);

    //When we delete a bookInfo
    const resultPromise = removeBookItemHandler.execute(
      new RemoveBookItem(newId),
    );
    //Then it should not have deleted a bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is deleted", async () => {
    //Given a bookInfo

    const spy = jest.spyOn(eventModule, "publishEvent");

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));
    const id = createTestId(TableNameEnum.BookItem, 0);

    //When we delete a bookInfo
    await removeBookItemHandler.execute(new RemoveBookItem(id));

    //Then it should have deleted a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should not emit domain event when bookInfo is not deleted", async () => {
    //Given a bookInfo

    const spy = jest.spyOn(eventModule, "publishEvent");

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));

    const newId = createTestId(TableNameEnum.None, 0);
    //When we delete a bookInfo
    const resultPromise = removeBookItemHandler.execute(
      new RemoveBookItem(newId),
    );
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
    //Then it should have deleted a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(0);
  });
});
