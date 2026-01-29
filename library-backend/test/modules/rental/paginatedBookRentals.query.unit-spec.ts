import { Test } from "@nestjs/testing";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { FakeBookRentalRepository } from "@rental/database/fakeBookRental.repository";
import {
  PaginatedBookRentalsQuery,
  PaginatedBookRentalsQueryHandler,
} from "@rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { RentalStatusEnum } from "@src/modules/rental/domain/bookRental.entity";
import { BookRentalBuilder } from "@test/data-builders/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { PinoLogger } from "nestjs-pino";

//Adapters
let bookRentalRepository: BookRentalRepository;

describe("[Unit] List Users", () => {
  let paginatedBookRentalsQueryHandler: PaginatedBookRentalsQueryHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaginatedBookRentalsQueryHandler,
        RealUUIDGeneratorService,
        { provide: BookRentalRepository, useClass: FakeBookRentalRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    bookRentalRepository =
      moduleRef.get<BookRentalRepository>(BookRentalRepository);
    paginatedBookRentalsQueryHandler =
      moduleRef.get<PaginatedBookRentalsQueryHandler>(
        PaginatedBookRentalsQueryHandler,
      );
  });

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
    await executeTask(bookRentalRepository.save(bookRental));
    builder
      .withCreatedAt(bookRental.createdAt)
      .withUpdatedAt(bookRental.updatedAt)
      .withOverdueDate(bookRental.overdueDate);

    //When we list bookItems
    const result = await paginatedBookRentalsQueryHandler.execute(query);
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
    await executeTask(bookRentalRepository.save(bookRental));
    builder
      .withCreatedAt(bookRental.createdAt)
      .withUpdatedAt(bookRental.updatedAt)
      .withOverdueDate(bookRental.overdueDate);

    //When we list bookItems
    const result = await paginatedBookRentalsQueryHandler.execute(query);
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
    await executeTask(bookRentalRepository.save(bookRental));

    //When we list bookItems
    const result = await paginatedBookRentalsQueryHandler.execute(query);
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
    const result = await paginatedBookRentalsQueryHandler.execute(query);
    //Then it should show an empty list
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(0);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });
});
