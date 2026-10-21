import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { BookItemStatusEnum } from "@book/domain/valueObject/bookItem.entity";
import {
  ReturnBookCommand,
  ReturnBookCommandHandler,
} from "@rental/commands/returnBook/returnBook.command";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@rental/domain/bookRental.entity";
import {
  BookRentalFinishedException,
  BookRentalNotFoundException,
} from "@rental/domain/bookRental.errors";
import { DomainEventPublisher } from "@shared/domainEventPublisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/dataBuilders/bookRentalBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { createHandlerModule } from "@test/util/handlerModule";
import { UserRepository } from "@user/database/user.repository.port";

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
    const moduleRef = await createHandlerModule([ReturnBookCommandHandler]);

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
  });

  it("Should return book if data is valid", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.build();
    await executeTask(bookRentalRepository.save(bookRental));
    //When we update it
    const resultPromise = returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRentalBuilder.build().id),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

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

    const resultPromise = returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRentalBuilder.build().id),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    //And it should have emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should return book if it belongs to the given owner", async () => {
    const bookRental = bookRentalBuilder.build();
    await executeTask(bookRentalRepository.save(bookRental));

    const resultPromise = returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRental.id, bookRental.userId),
    );

    await expect(resultPromise).resolves.toEqual(undefined);
  });

  it("Should not return book that belongs to another user", async () => {
    const bookRental = bookRentalBuilder.build();
    await executeTask(bookRentalRepository.save(bookRental));

    const resultPromise = returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRental.id, createTestId(TableNameEnum.User, 5)),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalNotFoundException,
    );
    const [stored] = await executeTask(bookRentalRepository.findAll());
    expect(stored?.rentalStatus).toBe(RentalStatusEnum.Rented);
  });
});
