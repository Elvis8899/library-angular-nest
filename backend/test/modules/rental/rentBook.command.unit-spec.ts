import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookItemStatus } from "@modules/book/domain/bookItem.entity";
import {
  RentBookCommand,
  RentBookCommandHandler,
} from "@modules/rental/commands/rentBook/rentBook.command";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { BookRentalNotAvailableException } from "@modules/rental/domain/bookRental.errors";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { seedBook } from "@test/modules/book/createBook";
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
        status: BookItemStatus.Available,
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
    await seedBook(ctx.bookInfoRepository, bookInfo);
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
    const rentedCopy = createTestId(TableNameEnum.BookItem, 1);
    await seedBook(
      ctx.bookInfoRepository,
      new BookInfoBuilder(1)
        .withBookItems([
          {
            id: rentedCopy,
            status: BookItemStatus.Rented,
            bookId: createTestId(TableNameEnum.BookInfo, 1),
          },
        ])
        .build(),
    );
    //When we try renting it
    const resultPromise = ctx.rentBookCommandHandler.execute(
      new RentBookCommand({
        bookItemId: rentedCopy,
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

    const spy = vi.spyOn(ctx.eventBookInfo, "publishEvent");

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

  it("Should not rent a copy another rent took first", async () => {
    // Given a copy someone else rented (the race itself is the repository
    // contract's: of two rents at once, one gets the copy)
    const bookRental = bookRentalBuilder.buildCreateDTO();
    await executeTask(
      ctx.bookRentalRepository.rent(new BookRentalBuilder(1).build()),
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
