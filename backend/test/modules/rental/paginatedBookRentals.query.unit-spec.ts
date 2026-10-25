import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import {
  PaginatedBookRentalsQuery,
  PaginatedBookRentalsQueryHandler,
} from "@modules/rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { seedBook } from "@test/modules/book/createBook";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

describe("[Unit] List BookRentals", () => {
  const ctx = useHandlerModule(
    { providers: [PaginatedBookRentalsQueryHandler] },
    (get) => ({
      bookRentalRepository: get(BookRentalRepository),
      books: get(BookInfoRepository),
      users: get(UserRepository),
      handler: get(PaginatedBookRentalsQueryHandler),
    }),
  );
  const user = new UserBuilder().build();
  const book = new BookInfoBuilder().build();
  const list = (page: number, status?: RentalStatusEnum, userId?: string) =>
    ctx.handler.execute(
      new PaginatedBookRentalsQuery({ limit: 10, page }, status, userId),
    );

  beforeEach(async () => {
    // The builders' defaults: user 0 renting book 0's one copy
    await executeTask(ctx.users.save(user));
    await seedBook(ctx.books, book);
  });

  it.each([
    ["any rental", undefined, undefined],
    ["a user's active rentals", RentalStatusEnum.Rented, user.id],
  ])(
    "Should list %s with the names and the fines at the clock's now",
    async (_, status, userId) => {
      const builder = new BookRentalBuilder()
        .withUser({ name: user.name })
        .withBookItem({ book: { name: book.name, price: book.price } });
      const rental = builder.build();
      await executeTask(ctx.bookRentalRepository.rent(rental));

      const result = await list(0, status, userId);

      expect(result).toMatchObject({ count: 1, page: 0, limit: 10 });
      expect(result.data).toEqual([
        {
          ...builder.buildRentalDetails(),
          createdAt: rental.createdAt,
          updatedAt: rental.updatedAt,
        },
      ]);
    },
  );

  it("Should list nothing on a page past the rentals, still counting them", async () => {
    await executeTask(
      ctx.bookRentalRepository.rent(new BookRentalBuilder().build()),
    );

    expect(await list(1)).toMatchObject({ data: [], count: 1, page: 1 });
  });

  it("Should list nothing when there is no rental", async () => {
    expect(
      await list(0, undefined, createTestId(TableNameEnum.User, 0)),
    ).toMatchObject({ data: [], count: 0 });
  });
});
