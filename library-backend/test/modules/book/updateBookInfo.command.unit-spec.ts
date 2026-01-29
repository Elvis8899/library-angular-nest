import {
  UpdateBookInfo,
  UpdateBookInfoHandler,
} from "@book/commands/updateBookInfo/updateBookInfo.command";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import { BookInfoNotFoundException } from "@book/domain/bookInfo.errors";
import { UnprocessableEntityException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { PinoLogger } from "nestjs-pino";

//Adapters
let bookInfoRepository: BookInfoRepository;
let eventBookInfo: DomainEventPublisher;

describe("[Unit] Update BookInfo", () => {
  let updateBookInfoHandler: UpdateBookInfoHandler;

  const bookInfoBuilder = new BookInfoBuilder(1);
  let originalBookInfoId: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventPublisherModule],
      providers: [
        {
          provide: DomainEventPublisherModule,
          useClass: DomainEventPublisher,
        },
        UpdateBookInfoHandler,
        RealUUIDGeneratorService,
        { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    updateBookInfoHandler = moduleRef.get<UpdateBookInfoHandler>(
      UpdateBookInfoHandler,
    );
    eventBookInfo = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);

    bookInfoBuilder.reset();
    const originalBookInfo = bookInfoBuilder.build();
    originalBookInfoId = originalBookInfo.id;
    await executeTask(bookInfoRepository.save(originalBookInfo));
  });

  it("Should update bookInfo if bookInfo is valid", async () => {
    // Given a potentially valid bookInfo
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();

    //When we update it
    const resultPromise = updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, originalBookInfoId),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should update bookInfo without optional keys", async () => {
    //Given a potentially valid bookInfo
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();

    //When we update it without optional keys
    // bookInfoDTO.cpf = "";
    const resultPromise = updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, originalBookInfoId),
    );

    //Then it should have updated the bookInfo
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is updated", async () => {
    //Given a potentially valid bookInfo
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();

    const spy = jest.spyOn(eventBookInfo, "publishEvent");

    //When we update the bookInfo
    await updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, originalBookInfoId),
    );

    //Then it should have updated the bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should not update an bookInfo if it doesn't exist", async () => {
    // Given a potentially valid bookInfo
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();

    // And an invalid id
    const invalidBookInfoId = "c017f4a9-c458-4ea7-829c-021c6a608503";

    //When we update the bookInfo with an id that doesn't exist
    const resultPromise = updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, invalidBookInfoId),
    );

    //Then it should have thrown an error and not have updated the bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
  });

  it("Should not update an bookInfo if name is invalid", async () => {
    // Given a bookInfo with an invalid name
    const bookInfoDTO = bookInfoBuilder.withName("").buildCreateDTO();

    //When we update the bookInfo
    const resultPromise = updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, originalBookInfoId),
    );

    //Then it should have thrown an error and not have updated the bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  // it("Should not update an bookInfo if cpf already exists", async () => {
  //   // Given a potentially valid name
  //   // When an bookInfo with the same name exists
  //   const bookInfo = new BookInfoBuilder(2).build();

  //   const repeatCPF = bookInfo.cpf;
  //   await bookInfoRepository.save(bookInfo);

  //   //When we update the bookInfo to have same name
  //   const bookInfoDTO = bookInfoBuilder.buildCreateDTO();
  //   const resultPromise = updateBookInfoHandler.execute(
  //     new UpdateBookInfo(bookInfoDTO, bookInfo.id),
  //   );

  //   //Then it should have thrown an error and not have updated the bookInfo
  //   await expect(resultPromise).rejects.toBeInstanceOf(
  //     BookInfoCPFAlreadyExistsException,
  //   );
  // });
});
