import { UnprocessableEntityException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { PinoLogger } from "nestjs-pino";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoRepository } from "@src/modules/book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@src/modules/book/database/fakeBookInfo.repository";
import { BookInfoNotFoundException } from "@src/modules/book/domain/bookInfo.errors";
import {
  ChangeBookItemStatus,
  ChangeBookItemStatusHandler,
} from "@src/modules/book/commands/changeBookItemStatus/changeBookItemStatus.command";
import { BookItemStatusEnum } from "@src/modules/book/domain/value-object/bookItem.entity";
import { unsafeCoerce } from "fp-ts/lib/function";

//Adapters
let bookInfoRepository: BookInfoRepository;
let eventBookInfo: DomainEventPublisher;

describe("[Unit] Update BookInfo", () => {
  let changeBookItemStatusHandler: ChangeBookItemStatusHandler;

  const bookInfoBuilder = new BookInfoBuilder(1);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventPublisherModule],
      providers: [
        {
          provide: DomainEventPublisherModule,
          useClass: DomainEventPublisher,
        },
        ChangeBookItemStatusHandler,
        RealUUIDGeneratorService,
        { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    changeBookItemStatusHandler = moduleRef.get<ChangeBookItemStatusHandler>(
      ChangeBookItemStatusHandler,
    );
    eventBookInfo = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);

    bookInfoBuilder.reset();
    const originalBookInfo = bookInfoBuilder.build();
    await bookInfoRepository.save(originalBookInfo);
  });

  it("Should update bookInfo if bookInfo is valid", async () => {
    // Given a potentially valid bookInfo
    const { bookItems } = bookInfoBuilder.build();

    //When we update it
    const result = await changeBookItemStatusHandler.execute(
      new ChangeBookItemStatus(
        bookItems[0]?.id || "",
        BookItemStatusEnum.Rented,
      ),
    );

    //Then it should have suscessfully updated
    expect(result).toEqual(undefined);

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should update bookInfo without optional keys", async () => {
    //Given a potentially valid bookInfo

    const { bookItems } = bookInfoBuilder.build();

    //When we update it without optional keys
    // bookInfoDTO.cpf = "";
    const result = await changeBookItemStatusHandler.execute(
      new ChangeBookItemStatus(
        bookItems[0]?.id || "",
        BookItemStatusEnum.Rented,
      ),
    );

    //Then it should have updated the bookInfo
    expect(result).toEqual(undefined);

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is updated", async () => {
    //Given a potentially valid bookInfo

    const { bookItems } = bookInfoBuilder.build();

    const spy = jest.spyOn(eventBookInfo, "publishEvent");

    //When we update the bookInfo
    await changeBookItemStatusHandler.execute(
      new ChangeBookItemStatus(
        bookItems[0]?.id || "",
        BookItemStatusEnum.Rented,
      ),
    );

    //Then it should have updated the bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should not update an bookInfo if it doesn't exist", async () => {
    // Given a potentially valid bookInfo

    // And an invalid id
    const invalidBookInfoId = "c017f4a9-c458-4ea7-829c-021c6a608503";

    //When we update the bookInfo with an id that doesn't exist
    const resultPromise = changeBookItemStatusHandler.execute(
      new ChangeBookItemStatus(invalidBookInfoId, BookItemStatusEnum.Rented),
    );

    //Then it should have thrown an error and not have updated the bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
  });

  it("Should not update an bookInfo if status is invalid", async () => {
    // Given a bookInfo with an invalid name
    const { bookItems } = bookInfoBuilder.build();

    //When we update the bookInfo
    const resultPromise = changeBookItemStatusHandler.execute(
      new ChangeBookItemStatus(bookItems[0]?.id || "", unsafeCoerce("")),
    );

    //Then it should have thrown an error and not have updated the bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });
});
