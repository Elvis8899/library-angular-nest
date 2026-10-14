import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { InMemoryBookInfoRepository } from "@book/database/inMemoryBookInfo.repository";
import { BookItemStatusEnum } from "@book/domain/valueObject/bookItem.entity";
import { Test } from "@nestjs/testing";
import {
  RentBookCommand,
  RentBookCommandHandler,
} from "@rental/commands/rentBook/rentBook.command";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { InMemoryBookRentalRepository } from "@rental/database/inMemoryBookRental.repository";
import { BookRentalNotAvailableException } from "@rental/domain/bookRental.errors";
import { DomainEventPublisher } from "@shared/domainEventPublisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domainEventPublisher/domainEventPublisher.module";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/dataBuilders/bookRentalBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { InMemoryUserRepository } from "@user/database/inMemoryUser.repository";
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
        { provide: BookInfoRepository, useClass: InMemoryBookInfoRepository },
        { provide: UserRepository, useClass: InMemoryUserRepository },
        {
          provide: BookRentalRepository,
          useClass: InMemoryBookRentalRepository,
        },
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

  it("Should not rent book item that already has an active rental", async () => {
    // Given a book item that was rented concurrently, before its status changed
    const bookRental = bookRentalBuilder.buildCreateDTO();
    await executeTask(
      bookRentalRepository.save(new BookRentalBuilder(1).build()),
    );

    //When we try renting it
    const resultPromise = rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: bookRental.bookItemId,
        userId: bookRental.userId,
      }),
    );

    //Then it should be rejected
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalNotAvailableException,
    );
    const bookRentals = await executeTask(bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });
});
