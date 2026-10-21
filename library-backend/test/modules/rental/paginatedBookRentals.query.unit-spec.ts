import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import {
  PaginatedBookRentalsQuery,
  PaginatedBookRentalsQueryHandler,
} from "@modules/rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookRentalBuilder } from "@test/dataBuilders/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] List Users", () => {
  const ctx = useHandlerModule(
    { providers: [PaginatedBookRentalsQueryHandler] },
    (get) => ({
      bookRentalRepository: get(BookRentalRepository),
      paginatedBookRentalsQueryHandler: get(PaginatedBookRentalsQueryHandler),
    }),
  );

  it("Should list bookItems if query is valid -no status-no user", async () => {
    //Given a valid query
    const limit = 10;
    const page = 0;
    const query = new PaginatedBookRentalsQuery(
      {
        limit,
        page,
      },
      undefined,
      undefined,
    );

    const builder = new BookRentalBuilder();
    //With bookItems in database
    const bookRental = builder.build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));
    builder
      .withCreatedAt(bookRental.createdAt)
      .withUpdatedAt(bookRental.updatedAt)
      .withOverdueDate(bookRental.overdueDate);

    //When we list bookItems
    const result = await ctx.paginatedBookRentalsQueryHandler.execute(query);
    //Then it should show a list of bookItems
    expect(result.data.length).toBe(1);
    expect(result.data[0]).toEqual(builder.buildRentalDetails());
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  it("Should list bookItems if query is valid - status and user", async () => {
    //Given a valid query
    const limit = 10;
    const page = 0;
    const query = new PaginatedBookRentalsQuery(
      {
        limit,
        page,
      },
      RentalStatusEnum.Rented,
      createTestId(TableNameEnum.User, 0),
    );

    const builder = new BookRentalBuilder();
    //With bookItems in database
    const bookRental = builder.build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));
    builder
      .withCreatedAt(bookRental.createdAt)
      .withUpdatedAt(bookRental.updatedAt)
      .withOverdueDate(bookRental.overdueDate);

    //When we list bookItems
    const result = await ctx.paginatedBookRentalsQueryHandler.execute(query);
    //Then it should show a list of bookItems
    expect(result.data.length).toBe(1);
    expect(result.data[0]).toEqual(builder.buildRentalDetails());
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  it("Shouldnt list bookItems if page is invalid", async () => {
    //Given a valid query
    const limit = 10;
    const page = 1;
    const query = new PaginatedBookRentalsQuery(
      {
        limit,
        page,
      },
      undefined,
      undefined,
    );

    //With bookItems in database
    const bookRental = new BookRentalBuilder().build();
    await executeTask(ctx.bookRentalRepository.save(bookRental));

    //When we list bookItems
    const result = await ctx.paginatedBookRentalsQueryHandler.execute(query);
    //Then it should show a list of bookItems
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  it("Shouldnt list bookItems if there isnt bookItems", async () => {
    //Given a valid query and no bookItems in database
    const limit = 10;
    const page = 0;
    const query = new PaginatedBookRentalsQuery(
      {
        limit,
        page,
      },
      undefined,
      undefined,
    );

    //When we list bookItems
    const result = await ctx.paginatedBookRentalsQueryHandler.execute(query);
    //Then it should show an empty list
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(0);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });
});
