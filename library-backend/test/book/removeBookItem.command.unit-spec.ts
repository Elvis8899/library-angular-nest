import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { PinoLogger } from "nestjs-pino";
import { BookInfoRepository } from "@src/modules/book/database/bookInfo.repository.port";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { FakeBookInfoRepository } from "@src/modules/book/database/fakeBookInfo.repository";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import {
  AvailableBookItemNotFoundException,
  BookInfoNotFoundException,
} from "@src/modules/book/domain/bookInfo.errors";
import {
  RemoveBookItem,
  RemoveBookItemHandler,
} from "@src/modules/book/commands/removeBookItem/removeBookItem.command";
import { BookItemStatusEnum } from "@src/modules/book/domain/value-object/bookItem.entity";

//Adapters
let bookInfoRepository: BookInfoRepository;
let eventModule: DomainEventPublisher;

describe("[Unit] Delete BookInfo", () => {
  let removeBookItemHandler: RemoveBookItemHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventPublisherModule],
      providers: [
        { provide: DomainEventPublisherModule, useClass: DomainEventPublisher },
        RemoveBookItemHandler,
        RealUUIDGeneratorService,
        { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

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
    const id = bookInfo.bookItems[0]?.id || "";

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
          id: "b8a11695-3c71-45b4-9dd8-14900412f4e1",
          status: BookItemStatusEnum.Rented,
          bookId: "b8a11695-3c71-45b4-9dd8-14900412f4e1",
        },
      ])
      .build();
    await executeTask(bookInfoRepository.save(bookInfo));
    const id = bookInfo.bookItems[0]?.id || "";

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
    const newId = "00000000-0000-0000-0000-000000000000";

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
    const id = bookInfo.id;

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

    const newId = "00000000-0000-0000-0000-000000000010";
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
