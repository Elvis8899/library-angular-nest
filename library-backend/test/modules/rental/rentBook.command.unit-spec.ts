import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { BookItemStatusEnum } from "@book/domain/bookItem.entity";
import {
  RentBookCommand,
  RentBookCommandHandler,
} from "@rental/commands/rentBook/rentBook.command";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { BookRentalNotAvailableException } from "@rental/domain/bookRental.errors";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/dataBuilders/bookRentalBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";
import { UserRepository } from "@user/database/user.repository.port";

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
    { providers: [RentBookCommandHandler] },
    (get) => ({
      bookInfoRepository: get(BookInfoRepository),
      userRepository: get(UserRepository),
      bookRentalRepository: get(BookRentalRepository),
      rentBookCommandHandler: get(RentBookCommandHandler),
      eventBookInfo: get(DomainEventPublisher),
    }),
  );

  beforeEach(async () => {
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    await executeTask(ctx.userRepository.save(user));
    bookRentalBuilder.reset();
  });

  it("Should rent book if data is valid", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.buildCreateDTO();
    //When we update it
    const resultPromise = ctx.rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: bookRental.bookItemId,
        userId: bookRental.userId,
      }),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookRentals = await executeTask(ctx.bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });

  it("Should not rent book if data is valid but book is not available", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder.buildCreateDTO();
    // and book is not available
    await executeTask(
      ctx.bookInfoRepository.save(
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
    const resultPromise = ctx.rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: bookRental.bookItemId,
        userId: bookRental.userId,
      }),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalNotAvailableException,
    );

    const bookRentals = await executeTask(ctx.bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(0);
  });

  it("Should emit domain event when bookInfo is updated", async () => {
    //Given a potentially valid bookInfo
    const bookRental = bookRentalBuilder.buildCreateDTO();

    const spy = jest.spyOn(ctx.eventBookInfo, "publishEvent");

    //When we update the bookInfo
    await ctx.rentBookCommandHandler.execute(
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
      ctx.bookRentalRepository.save(new BookRentalBuilder(1).build()),
    );

    //When we try renting it
    const resultPromise = ctx.rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: bookRental.bookItemId,
        userId: bookRental.userId,
      }),
    );

    //Then it should be rejected
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookRentalNotAvailableException,
    );
    const bookRentals = await executeTask(ctx.bookRentalRepository.findAll());
    expect(bookRentals.length).toEqual(1);
  });
});
