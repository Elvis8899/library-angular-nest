import {
  DeleteBookInfo,
  DeleteBookInfoHandler,
} from "@book/commands/deleteBookInfo/deleteBookInfo.command";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import { BookInfoNotFoundException } from "@book/domain/bookInfo.errors";
import { Test } from "@nestjs/testing";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { PinoLogger } from "nestjs-pino";

//Adapters
let bookInfoRepository: BookInfoRepository;
let eventModule: DomainEventPublisher;

describe("[Unit] Delete BookInfo", () => {
  let deleteBookInfoHandler: DeleteBookInfoHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventPublisherModule],
      providers: [
        { provide: DomainEventPublisherModule, useClass: DomainEventPublisher },
        DeleteBookInfoHandler,
        RealUUIDGeneratorService,
        { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    deleteBookInfoHandler = moduleRef.get<DeleteBookInfoHandler>(
      DeleteBookInfoHandler,
    );
    eventModule = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);
  });

  it("Should delete bookInfo if id is valid", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));
    const id = bookInfo.id;

    //When we delete a bookInfo
    const resultPromise = deleteBookInfoHandler.execute(new DeleteBookInfo(id));
    //Then it should have deleted a bookInfo
    await expect(resultPromise).resolves.toBe(undefined);
    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(0);
  });

  it("Should not delete bookInfo if id doesnt exists", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));
    const newId = "00000000-0000-0000-0000-000000000000";

    //When we delete a bookInfo
    const resultPromise = deleteBookInfoHandler.execute(
      new DeleteBookInfo(newId),
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
    await deleteBookInfoHandler.execute(new DeleteBookInfo(id));

    //Then it should have deleted a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
