import { AddBookItemHandler } from "@book/commands/addBookItem/addBookItem.command";
import { CreateBookInfoHandler } from "@book/commands/createBookInfo/createBookInfo.command";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import {
  BOOK_INFO_CREATED,
  BookInfoCreatedEvent,
} from "@book/domain/events/bookInfoCreated.event";
import { CreateBookInfoSubscriber } from "@book/subscriber/createBookInfo.subscriber";
import { CqrsModule } from "@nestjs/cqrs";
import { Test } from "@nestjs/testing";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { PinoLogger } from "nestjs-pino";

describe("[Unit] Endpoint Response - Subscriber", () => {
  let createBookInfoSubscriber: CreateBookInfoSubscriber;
  let bookInfoRepository: BookInfoRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule, DomainEventPublisherModule],
      providers: [
        { provide: DomainEventPublisherModule, useClass: DomainEventPublisher },
        CreateBookInfoHandler,
        AddBookItemHandler,
        CreateBookInfoSubscriber,
        RealUUIDGeneratorService,
        {
          provide: BookInfoRepository,
          useClass: FakeBookInfoRepository,
        },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();
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
