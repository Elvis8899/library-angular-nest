import { RealBookInfoRepository } from "@modules/book/database/realBookInfo.repository";
import { BookItemStatus } from "@modules/book/domain/bookItem.entity";
import { RealBookRentalRepository } from "@modules/rental/database/realBookRental.repository";
import {
  BookRental,
  RentalStatusEnum,
} from "@modules/rental/domain/bookRental.entity";
import {
  BookRentalFinishedException,
  BookRentalNotAvailableException,
} from "@modules/rental/domain/bookRental.errors";
import { RealUserRepository } from "@modules/user/database/realUser.repository";
import { Test } from "@nestjs/testing";
import { PrismaService } from "@shared/prisma/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UnknownException } from "@shared/utils/domain/shared.errors";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { createBook } from "@test/modules/book/createBook";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { resetDatabase } from "@test/util/resetDatabase";

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

  bookRentalRepository = module.get(RealBookRentalRepository);
  prismaService = module.get(PrismaService);

  await resetDatabase(prismaService);
  await createBook(prismaService);

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

  afterEach(() => {
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
    await expect(resultPromise).rejects.toBeInstanceOf(UnknownException);
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

describe("[Integration] BookRental repository rent/finish", () => {
  const bookItemId = createTestId(TableNameEnum.BookItem, 0);

  const getBookItemStatus = async () =>
    (await prismaService.bookItem.findUnique({ where: { id: bookItemId } }))
      ?.status;

  beforeEach(async () => {
    await prismaService.bookRentalDetails.deleteMany();
    await prismaService.bookItem.update({
      where: { id: bookItemId },
      data: { status: BookItemStatus.Available },
    });
  });

  afterAll(async () => {
    await prismaService.bookRentalDetails.deleteMany();
  });

  it("Should store rental and mark book item as rented", async () => {
    const bookRental = new BookRentalBuilder(0).build();

    await executeTask(bookRentalRepository.rent(bookRental));

    expect(await getBookItemStatus()).toBe(BookItemStatus.Rented);
    expect(await prismaService.bookRentalDetails.count()).toBe(1);
  });

  it("Should not rent a book item that is already rented", async () => {
    await executeTask(
      bookRentalRepository.rent(new BookRentalBuilder(0).build()),
    );

    const result = executeTask(
      bookRentalRepository.rent(new BookRentalBuilder(1).build()),
    );

    await expect(result).rejects.toBeInstanceOf(
      BookRentalNotAvailableException,
    );
    expect(await prismaService.bookRentalDetails.count()).toBe(1);
  });

  it("Should allow only one of two concurrent rents of the same book item", async () => {
    const results = await Promise.allSettled([
      executeTask(bookRentalRepository.rent(new BookRentalBuilder(0).build())),
      executeTask(bookRentalRepository.rent(new BookRentalBuilder(1).build())),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0]?.reason).toBeInstanceOf(BookRentalNotAvailableException);
    expect(await prismaService.bookRentalDetails.count()).toBe(1);
  });

  it("Should roll back book item status when storing rental fails", async () => {
    // Rental references a user that does not exist
    const bookRental = new BookRentalBuilder(0)
      .withUserId(createTestId(TableNameEnum.User, 99))
      .build();

    const result = executeTask(bookRentalRepository.rent(bookRental));

    await expect(result).rejects.toBeInstanceOf(UnknownException);
    expect(await getBookItemStatus()).toBe(BookItemStatus.Available);
  });

  it("Should finish rental and make book item available", async () => {
    const bookRental = new BookRentalBuilder(0).build();
    await executeTask(bookRentalRepository.rent(bookRental));

    await executeTask(
      bookRentalRepository.finish({ ...bookRental, deliveryDate: new Date() }),
    );

    expect(await getBookItemStatus()).toBe(BookItemStatus.Available);
    const saved = await prismaService.bookRentalDetails.findUnique({
      where: { id: bookRental.id },
    });
    expect(saved?.rentalStatus).toBe(RentalStatusEnum.Finished);
    expect(saved?.deliveryDate).toBeInstanceOf(Date);
  });

  it("Should not finish a rental twice", async () => {
    const bookRental = new BookRentalBuilder(0).build();
    await executeTask(bookRentalRepository.rent(bookRental));
    await executeTask(bookRentalRepository.finish(bookRental));

    const result = executeTask(bookRentalRepository.finish(bookRental));

    await expect(result).rejects.toBeInstanceOf(BookRentalFinishedException);
  });
});
