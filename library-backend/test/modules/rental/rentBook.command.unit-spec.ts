// import { UnprocessableEntityException } from "@nestjs/common";
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
import {
  RentBookCommand,
  RentBookCommandHandler,
} from "@src/modules/rental/commands/rentBook/rentBook.command";
import { UserRepository } from "@src/modules/user/database/user.repository.port";
import { FakeUserRepository } from "@src/modules/user/database/fakeUser.repository";
import { BookRentalRepository } from "@src/modules/rental/database/bookRental.repository.port";
import { FakeBookRentalRepository } from "@src/modules/rental/database/fakeBookRental.repository";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { BookRentalBuilder } from "@test/data-builders/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { BookItemStatusEnum } from "@src/modules/book/domain/value-object/bookItem.entity";
import { BookRentalNotAvailableException } from "@src/modules/rental/domain/bookRental.errors";

//Adapters

describe("[Unit] Update BookInfo", () => {
  let rentBookCommandHandler: RentBookCommandHandler;
  let bookRentalRepository: BookRentalRepository;
  let bookInfoRepository: BookInfoRepository;
  let eventBookInfo: DomainEventPublisher;
  const user = new UserBuilder().build();
  const bookInfo = new BookInfoBuilder()
    .withBookItems([
      {
        id: createTestId(TableNameEnum.BookItem, 0),
        status: BookItemStatusEnum.Available,
        bookId: createTestId(TableNameEnum.BookInfo, 0),
      },
    ])
    .build();
  const bookRentalBuilder = new BookRentalBuilder(0);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventPublisherModule],
      providers: [
        {
          provide: DomainEventPublisherModule,
          useClass: DomainEventPublisher,
        },
        RentBookCommandHandler,
        RealUUIDGeneratorService,
        { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
        { provide: UserRepository, useClass: FakeUserRepository },
        { provide: BookRentalRepository, useClass: FakeBookRentalRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    const userRepository = moduleRef.get<UserRepository>(UserRepository);
    bookRentalRepository =
      moduleRef.get<BookRentalRepository>(BookRentalRepository);
    rentBookCommandHandler = moduleRef.get<RentBookCommandHandler>(
      RentBookCommandHandler,
    );
    eventBookInfo = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);

    await executeTask(bookInfoRepository.save(bookInfo));
    await executeTask(userRepository.save(user));
    bookRentalBuilder.reset();
    //.withStatus(RentalStatusEnum);
    //const originalBookInfo = bookRentalBuilder.build();
    // await bookRentalRepository.save(originalBookInfo);
  });

  it("Should rent book if data is valid", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.buildCreateDTO();
    //When we update it
    const result = await rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: bookRental.bookItemId,
        userId: bookRental.userId,
      }),
    );

    //Then it should have suscessfully updated
    expect(result).toEqual(undefined);

    const bookRentals = await executeTask(bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should not rent book if data is valid but book is not available", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.buildCreateDTO();
    // and book is not available
    await bookInfoRepository.save(
      new BookInfoBuilder()
        .withBookItems([
          {
            id: createTestId(TableNameEnum.BookItem, 0),
            status: BookItemStatusEnum.Rented,
            bookId: createTestId(TableNameEnum.BookInfo, 0),
          },
        ])
        .build(),
    );
    //When we try renting it
    const resultPromise = rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: bookRental.bookItemId,
        userId: bookRental.userId,
      }),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalNotAvailableException,
    );

    const bookRentals = await executeTask(bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(0);
  });

  it("Should emit domain event when bookInfo is updated", async () => {
    //Given a potentially valid bookInfo
    const bookRental = bookRentalBuilder.buildCreateDTO();

    const spy = jest.spyOn(eventBookInfo, "publishEvent");

    //When we update the bookInfo
    await rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: bookRental.bookItemId,
        userId: bookRental.userId,
      }),
    );

    //Then it should have updated the bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
