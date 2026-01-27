import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { PinoLogger } from "nestjs-pino";
import { CqrsModule } from "@nestjs/cqrs";
import { CreateBookInfoSubscriber } from "@src/modules/book/subscriber/createBookInfo.subscriber";
import { CreateBookInfoHandler } from "@src/modules/book/commands/createBookInfo/createBookInfo.command";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoRepository } from "@src/modules/book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@src/modules/book/database/fakeBookInfo.repository";
import {
  BOOK_INFO_CREATED,
  BookInfoCreatedEvent,
} from "@src/modules/book/domain/events/bookInfoCreated.event";
import { AddBookItemHandler } from "@src/modules/book/commands/addBookItem/addBookItem.command";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { executeTask } from "@src/shared/utils/executeTask";

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
      responseWatcherEvent["payload"],
    );

    //Then it should resolve to undefined
    await expect(resultPromise).resolves.toBe(undefined);
    // and  should have created a bookItem
    const bookItems = await executeTask(bookInfoRepository.findAll());
    expect(bookItems[0]?.bookItems.length).toEqual(2);
  });
});
