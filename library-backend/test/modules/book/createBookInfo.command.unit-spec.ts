import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { PinoLogger } from "nestjs-pino";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoRepository } from "@src/modules/book/database/bookInfo.repository.port";
import {
  CreateBookInfo,
  CreateBookInfoHandler,
} from "@src/modules/book/commands/createBookInfo/createBookInfo.command";
import { FakeBookInfoRepository } from "@src/modules/book/database/fakeBookInfo.repository";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";

//Adapters
let bookInfoRepository: BookInfoRepository;
let eventBookInfo: DomainEventPublisher;

describe("[Unit] Create BookInfo", () => {
  let createBookInfoHandler: CreateBookInfoHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventPublisherModule],
      providers: [
        {
          provide: DomainEventPublisherModule,
          useClass: DomainEventPublisher,
        },
        CreateBookInfoHandler,
        RealUUIDGeneratorService,
        { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    createBookInfoHandler = moduleRef.get<CreateBookInfoHandler>(
      CreateBookInfoHandler,
    );
    eventBookInfo = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);
  });

  it("Should create bookInfo if bookInfo is valid", async () => {
    //Given a potentially valid bookInfo
    const bookInfo = new BookInfoBuilder().buildCreateDTO();

    //When we create a bookInfo
    const result = await createBookInfoHandler.execute(
      new CreateBookInfo(bookInfo),
    );

    //Then it should have created a bookInfo
    expect(result).toEqual(undefined);

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should create bookInfo without optional keys", async () => {
    //Given a potentially valid name

    const bookInfo = new BookInfoBuilder().buildCreateDTO();
    //When we create a bookInfo
    const result = await createBookInfoHandler.execute(
      new CreateBookInfo(bookInfo),
    );

    //Then it should have created a bookInfo
    expect(result).toEqual(undefined);

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is created", async () => {
    //Given a potentially valid name

    const spy = jest.spyOn(eventBookInfo, "publishEvent");

    const bookInfo = new BookInfoBuilder().buildCreateDTO();
    //When we create a bookInfo
    await createBookInfoHandler.execute(new CreateBookInfo(bookInfo));

    //Then it should have created a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
