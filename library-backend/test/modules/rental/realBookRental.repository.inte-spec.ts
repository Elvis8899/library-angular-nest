import { RealBookInfoRepository } from "@book/database/realBookInfo.repository";
import { BookItem } from "@book/domain/value-object/bookItem.entity";
import { InternalServerErrorException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { RealBookRentalRepository } from "@rental/database/realBookRental.repository";
import { BookRental } from "@rental/domain/bookRental.entity";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/data-builders/bookRentalBuilder";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { RealUserRepository } from "@user/database/realUser.repository";

let prismaService: PrismaService;
let bookRentalRepository: RealBookRentalRepository;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [
      RealUserRepository,
      RealBookInfoRepository,
      RealBookRentalRepository,
      PrismaService,
    ],
  }).compile();

  bookRentalRepository = module.get<RealBookRentalRepository>(
    RealBookRentalRepository,
  );
  prismaService = module.get<PrismaService>(PrismaService);

  await prismaService.user.deleteMany();
  await prismaService.bookInfo.deleteMany();
  await prismaService.bookRentalDetails.deleteMany();
  const { bookItems, ...bookInfo } = new BookInfoBuilder().build();
  const [bookItem] = bookItems as [BookItem];
  await prismaService.bookInfo.create({
    data: { ...bookInfo, bookItems: { create: { id: bookItem.id } } },
  });

  await prismaService.user.create({
    data: new UserBuilder().build(),
  });
});

afterAll(async () => {
  await prismaService.$disconnect();
});

describe("[Integration] BookRental repository", () => {
  const bookRentalBuilder = new BookRentalBuilder();
  const allBuilders = [bookRentalBuilder];

  const saveBookRental = (p: BookRental) =>
    executeTask(bookRentalRepository.save(p));

  beforeEach(async () => {
    await prismaService.bookRentalDetails.deleteMany();
  });

  afterEach(async () => {
    await prismaService.bookRentalDetails.deleteMany();
    allBuilders.map((builder) => builder.reset());
  });

  it.each([["rental", bookRentalBuilder.build()]])(
    "Successfully save %s",
    async (_: string, bookRental: BookRental) => {
      //Given an inexisting bookRental in database

      //When we save him
      await saveBookRental(bookRental);

      //Then we should have saved him
      const savedBookRental = await prismaService.bookRentalDetails.findUnique({
        where: {
          id: bookRental.id,
        },
      });

      expect(savedBookRental).toMatchObject({
        id: bookRental.id,
      });
    },
  );

  it.each([["bookRental", bookRentalBuilder.build()]])(
    "Successfully get %s after save",
    async (_: string, bookRental: BookRental) => {
      //Given an inexisting bookRental in database

      //When we save him
      await saveBookRental(bookRental);

      // Should be able to retrieve it
      const [resultById, resultPaginatedQuery, resultAll] = await Promise.all([
        executeTask(bookRentalRepository.findById(bookRental.id)),
        executeTask(
          bookRentalRepository.findAllPaginated({
            page: 0,
            limit: 10,
            offset: 0,
            query: { status: bookRental.rentalStatus },
          }),
        ),
        executeTask(bookRentalRepository.findAll()),
      ]);

      const {
        createdAt: ___,
        updatedAt: __,
        ...bookRentalToCompare
      } = bookRental;

      const { name: bookName, price } = new BookInfoBuilder().build();
      const { name: userName } = new UserBuilder().build();
      expect(resultById).toMatchObject(
        O.some({
          ...bookRentalToCompare,
          bookItem: { book: { name: bookName, price } },
          user: { name: userName },
        }),
      );
      expect(resultPaginatedQuery.count).toBe(1);
      expect(resultPaginatedQuery.data.length).toBe(1);
      expect(resultAll.length).toBe(1);
    },
  );

  it("Successfully delete bookRental after save", async () => {
    //Given an inexisting bookRental in database
    const bookRental = bookRentalBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    await executeTask(bookRentalRepository.save(bookRental));

    //When we delete him

    await executeTask(bookRentalRepository.deleteById(bookRental.id));
    //Then we should have deleted him
    const savedBookRentals = await prismaService.bookRentalDetails.findMany({});

    expect(savedBookRentals.length).toBe(0);

    // const countRelatedTables = await Promise.all([
    //   prismaService.bookRentalDetails.count(),
    // ]);
    // return expect(countRelatedTables).toEqual([0, 0, 0, 0]);
  });

  it("Should not delete bookRental with wrong id", async () => {
    //Given an inexisting bookRental in database
    const bookRental = bookRentalBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    await executeTask(bookRentalRepository.save(bookRental));

    const unsavedBookRental = bookRentalBuilder.reset().build();

    //When we try deleting an unsaved bookRental

    const resultPromise = executeTask(
      bookRentalRepository.deleteById(unsavedBookRental.id),
    );
    //Then we should not have deleted him
    await expect(resultPromise).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    const savedBookRentals = await prismaService.bookRentalDetails.findMany({});

    expect(savedBookRentals.length).toBe(1);
  });

  it("Successfully save admin without cpf", async () => {
    //Given an inexisting bookRental in database
    const bookRental = bookRentalBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    await executeTask(bookRentalRepository.save(bookRental));

    const savedBookRental = await prismaService.bookRentalDetails.findUnique({
      where: {
        id: createTestId(TableNameEnum.None, 0),
      },
    });

    expect(savedBookRental?.id).toBe(bookRental.id);
  });

  it("Return null when there is no bookRental", async () => {
    //Given no existing bookRentals in database
    const unsaveBookRental = bookRentalBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    //When we try to retrieve
    const [resultById, resultPaginated, resultAll] = await Promise.all([
      executeTask(bookRentalRepository.findById(unsaveBookRental.id)),
      executeTask(
        bookRentalRepository.findAllPaginated({
          page: 0,
          limit: 10,
          offset: 0,
          query: { status: unsaveBookRental.rentalStatus },
        }),
      ),
      executeTask(bookRentalRepository.findAll()),
    ]);

    expect(resultById).toMatchObject(O.none);
    expect(resultPaginated.count).toBe(0);
    expect(resultPaginated.data.length).toBe(0);
    expect(resultAll.length).toBe(0);
  });
});
