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
import { UserRepository } from "@src/modules/user/database/user.repository.port";
import { FakeUserRepository } from "@src/modules/user/database/fakeUser.repository";
import { BookRentalRepository } from "@src/modules/rental/database/bookRental.repository.port";
import { FakeBookRentalRepository } from "@src/modules/rental/database/fakeBookRental.repository";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { BookRentalBuilder } from "@test/data-builders/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { BookItemStatusEnum } from "@src/modules/book/domain/value-object/bookItem.entity";
import {
  BookRentalFinishedException,
  BookRentalNotFoundException,
} from "@src/modules/rental/domain/bookRental.errors";
import {
  ReturnBookCommand,
  ReturnBookCommandHandler,
} from "@src/modules/rental/commands/returnBook/returnBook.command";
import { RentalStatusEnum } from "@src/modules/rental/domain/bookRental.entity";

//Adapters

describe("[Unit] Update BookInfo", () => {
  let returnBookCommandHandler: ReturnBookCommandHandler;
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
        ReturnBookCommandHandler,
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
    returnBookCommandHandler = moduleRef.get<ReturnBookCommandHandler>(
      ReturnBookCommandHandler,
    );
    eventBookInfo = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);

    await executeTask(bookInfoRepository.save(bookInfo));
    await executeTask(userRepository.save(user));
    bookRentalBuilder.reset();
    //.withStatus(RentalStatusEnum);
    //const originalBookInfo = bookRentalBuilder.build();
    // await bookRentalRepository.save(originalBookInfo);
  });

  it("Should return book if data is valid", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.build();
    await executeTask(bookRentalRepository.save(bookRental));
    //When we update it
    const result = await returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRentalBuilder.build().id),
    );

    //Then it should have suscessfully updated
    expect(result).toEqual(undefined);

    const bookRentals = await executeTask(bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should not return book if data is valid but book is already returned", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder
      .withStatus(RentalStatusEnum.Finished)
      .build();
    await executeTask(bookRentalRepository.save(bookRental));
    //When we update it
    const resultPromise = returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRentalBuilder.build().id),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalFinishedException,
    );

    const bookRentals = await executeTask(bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should not return book if data is valid but rental does not exists", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder
      .withStatus(RentalStatusEnum.Rented)
      .build();
    await executeTask(bookRentalRepository.save(bookRental));
    //When we update it
    const resultPromise = returnBookCommandHandler.execute(
      new ReturnBookCommand(createTestId(TableNameEnum.None, 0)),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalNotFoundException,
    );

    const bookRentals = await executeTask(bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should emit domain event when book is returned", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.build();
    await executeTask(bookRentalRepository.save(bookRental));
    //When we update it

    const spy = jest.spyOn(eventBookInfo, "publishEvent");

    const result = await returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRentalBuilder.build().id),
    );

    //Then it should have suscessfully updated
    expect(result).toEqual(undefined);

    //And it should have emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
