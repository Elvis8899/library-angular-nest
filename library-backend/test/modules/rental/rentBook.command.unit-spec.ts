// import { UnprocessableEntityException } from "@nestjs/common";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import { BookItemStatusEnum } from "@book/domain/value-object/bookItem.entity";
import { Test } from "@nestjs/testing";
import {
  RentBookCommand,
  RentBookCommandHandler,
} from "@rental/commands/rentBook/rentBook.command";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { FakeBookRentalRepository } from "@rental/database/fakeBookRental.repository";
import { BookRentalNotAvailableException } from "@rental/domain/bookRental.errors";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/data-builders/bookRentalBuilder";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { FakeUserRepository } from "@user/database/fakeUser.repository";
import { UserRepository } from "@user/database/user.repository.port";
import { PinoLogger } from "nestjs-pino";

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
    const resultPromise = rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: bookRental.bookItemId,
        userId: bookRental.userId,
      }),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookRentals = await executeTask(bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should not rent book if data is valid but book is not available", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.buildCreateDTO();
    // and book is not available
    await executeTask(
      bookInfoRepository.save(
        new BookInfoBuilder()
          .withBookItems([
            {
              id: createTestId(TableNameEnum.BookItem, 0),
              status: BookItemStatusEnum.Rented,
              bookId: createTestId(TableNameEnum.BookInfo, 0),
            },
          ])
          .build(),
      ),
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
