import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookItemStatusEnum } from "@modules/book/domain/bookItem.entity";
import {
  ReturnBookCommand,
  ReturnBookCommandHandler,
} from "@modules/rental/commands/returnBook/returnBook.command";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import {
  BookRentalFinishedException,
  BookRentalNotFoundException,
} from "@modules/rental/domain/bookRental.errors";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] Update BookInfo", () => {
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

  const ctx = useHandlerModule(
    { providers: [ReturnBookCommandHandler] },
    (get) => ({
      bookInfoRepository: get(BookInfoRepository),
      userRepository: get(UserRepository),
      bookRentalRepository: get(BookRentalRepository),
      returnBookCommandHandler: get(ReturnBookCommandHandler),
      eventBookInfo: get(DomainEventPublisher),
    }),
  );

  beforeEach(async () => {
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    await executeTask(ctx.userRepository.save(user));
    bookRentalBuilder.reset();
  });

  it("Should return book if data is valid", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));
    //When we update it
    const resultPromise = ctx.returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRentalBuilder.build().id),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookRentals = await executeTask(ctx.bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should not return book if data is valid but book is already returned", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder
      .withStatus(RentalStatusEnum.Finished)
      .build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));
    //When we update it
    const resultPromise = ctx.returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRentalBuilder.build().id),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalFinishedException,
    );

    const bookRentals = await executeTask(ctx.bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should not return book if data is valid but rental does not exists", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder
      .withStatus(RentalStatusEnum.Rented)
      .build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));
    //When we update it
    const resultPromise = ctx.returnBookCommandHandler.execute(
      new ReturnBookCommand(createTestId(TableNameEnum.None, 0)),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalNotFoundException,
    );

    const bookRentals = await executeTask(ctx.bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should emit domain event when book is returned", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));
    //When we update it

    const spy = jest.spyOn(ctx.eventBookInfo, "publishEvent");

    const resultPromise = ctx.returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRentalBuilder.build().id),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    //And it should have emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should return book if it belongs to the given owner", async () => {
    const bookRental = bookRentalBuilder.build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));

    const resultPromise = ctx.returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRental.id, bookRental.userId),
    );

    await expect(resultPromise).resolves.toEqual(undefined);
  });

  it("Should not return book that belongs to another user", async () => {
    const bookRental = bookRentalBuilder.build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));

    const resultPromise = ctx.returnBookCommandHandler.execute(
      new ReturnBookCommand(bookRental.id, createTestId(TableNameEnum.User, 5)),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalNotFoundException,
    );
    const [stored] = await executeTask(ctx.bookRentalRepository.findAll());
    expect(stored?.rentalStatus).toBe(RentalStatusEnum.Rented);
  });
});
