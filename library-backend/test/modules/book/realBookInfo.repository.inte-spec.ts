import { RealBookInfoRepository } from "@book/database/realBookInfo.repository";
import { BookInfo } from "@book/domain/bookInfo.entity";
import {
  BookItem,
  BookItemStatusEnum,
} from "@book/domain/value-object/bookItem.entity";
import { InternalServerErrorException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { O } from "@shared/functional/monads";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/executeTask";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

let prismaService: PrismaService;
let bookInfoRepository: RealBookInfoRepository;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [RealBookInfoRepository, PrismaService],
  }).compile();

  bookInfoRepository = module.get<RealBookInfoRepository>(
    RealBookInfoRepository,
  );
  prismaService = module.get<PrismaService>(PrismaService);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

describe("[Integration] BookInfo repository", () => {
  const bookInfoBuilder = new BookInfoBuilder();
  const allBuilders = [bookInfoBuilder];

  const saveBookInfo = (p: BookInfo) => executeTask(bookInfoRepository.save(p));

  beforeEach(async () => {
    await prismaService.bookInfo.deleteMany();
  });

  afterEach(async () => {
    await prismaService.bookInfo.deleteMany();
    allBuilders.map((builder) => builder.reset());
  });

  it.each([["book", bookInfoBuilder.build()]])(
    "Successfully save %s",
    async (_: string, bookInfo: BookInfo) => {
      //Given an inexisting bookInfo in database

      //When we save him
      await saveBookInfo(bookInfo);

      //Then we should have saved him
      const savedBookInfo = await prismaService.bookInfo.findUnique({
        where: {
          id: bookInfo.id,
        },
      });

      expect(savedBookInfo).toMatchObject({
        id: bookInfo.id,
        name: bookInfo.name,
      });
    },
  );

  it.each([["book", bookInfoBuilder.withBookItems([]).build()]])(
    "Successfully get %s after save",
    async (_: string, bookInfo: BookInfo) => {
      //Given an inexisting bookInfo in database

      //When we save him
      await saveBookInfo(bookInfo);

      // Should be able to retrieve it
      const [resultById, resultPaginated, resultAll] = await Promise.all([
        executeTask(bookInfoRepository.findById(bookInfo.id)),

        executeTask(
          bookInfoRepository.findAllPaginated({
            page: 0,
            limit: 10,
            offset: 0,
          }),
        ),
        executeTask(bookInfoRepository.findAll()),
      ]);

      const { createdAt: __, updatedAt: ___, ...bookInfoToCompare } = bookInfo;

      expect(resultById).toMatchObject(O.some(bookInfoToCompare));
      expect(resultPaginated.count).toBe(1);
      expect(resultPaginated.data.length).toBe(1);
      expect(resultAll.length).toBe(1);
    },
  );

  it("Successfully delete bookInfo after save", async () => {
    //Given an inexisting bookInfo in database
    const bookInfo = bookInfoBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    await executeTask(bookInfoRepository.save(bookInfo));

    //When we delete him

    await executeTask(bookInfoRepository.deleteById(bookInfo.id));
    //Then we should have deleted him
    const savedBookInfos = await prismaService.bookInfo.findMany({});

    expect(savedBookInfos.length).toBe(0);

    // const countRelatedTables = await Promise.all([
    //   prismaService.bookRental.count(),
    // ]);
    // return expect(countRelatedTables).toEqual([0, 0, 0, 0]);
  });

  it("Should not delete bookInfo with wrong id", async () => {
    //Given an inexisting bookInfo in database
    const bookInfo = bookInfoBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    await executeTask(bookInfoRepository.save(bookInfo));

    const unsavedBookInfo = bookInfoBuilder.reset().build();

    //When we try deleting an unsaved bookInfo

    const resultPromise = executeTask(
      bookInfoRepository.deleteById(unsavedBookInfo.id),
    );
    //Then we should not have deleted him
    await expect(resultPromise).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    const savedBookInfos = await prismaService.bookInfo.findMany({});

    expect(savedBookInfos.length).toBe(1);
  });

  it("Return null when there is no bookInfo", async () => {
    //Given no existing bookInfos in database
    const unsaveBookInfo = bookInfoBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    //When we try to retrieve
    const [resultById, resultPaginated, resultAll] = await Promise.all([
      executeTask(bookInfoRepository.findById(unsaveBookInfo.id)),
      executeTask(
        bookInfoRepository.findAllPaginated({
          page: 0,
          limit: 10,
          offset: 0,
        }),
      ),
      executeTask(bookInfoRepository.findAll()),
    ]);

    expect(resultById).toMatchObject(O.none);
    expect(resultPaginated.count).toBe(0);
    expect(resultPaginated.data.length).toBe(0);
    expect(resultAll.length).toBe(0);
  });

  it("Successfully save bookItem", async () => {
    const bookInfo = bookInfoBuilder.build();
    await saveBookInfo(bookInfo);
    //Given an inexisting bookItem in database
    const bookItem = BookItem.parse({
      id: createTestId(TableNameEnum.BookItem, 0),
      status: BookItemStatusEnum.Available,
      bookId: createTestId(TableNameEnum.BookInfo, 0),
    });
    //When we save him
    await executeTask(bookInfoRepository.createBookItem(bookItem));

    //Then we should have saved him
    const savedBookItem = await prismaService.bookItem.findUnique({
      where: {
        id: bookItem.id,
      },
    });
    expect(savedBookItem).toMatchObject({
      id: bookItem.id,
      status: bookItem.status,
      bookId: bookItem.bookId,
    });
  });

  it("Successfully delete bookItem", async () => {
    const bookInfo = bookInfoBuilder.build();
    await saveBookInfo(bookInfo);
    //Given an existing bookItem in database
    const bookItem = BookItem.parse({
      id: createTestId(TableNameEnum.BookItem, 0),
      status: BookItemStatusEnum.Available,
      bookId: createTestId(TableNameEnum.BookInfo, 0),
    });

    await executeTask(bookInfoRepository.createBookItem(bookItem));

    //When we delete him

    await executeTask(bookInfoRepository.deleteBookItem(bookItem.id));
    //Then we should have deleted him
    const savedBookItem = await prismaService.bookItem.findUnique({
      where: {
        id: bookItem.id,
      },
    });
    expect(savedBookItem).toBe(null);
  });

  it("Successfully find bookItem by id", async () => {
    const bookInfo = bookInfoBuilder.build();
    await saveBookInfo(bookInfo);
    //Given an existing bookItem in database
    const bookItem = BookItem.parse({
      id: createTestId(TableNameEnum.BookItem, 0),
      status: BookItemStatusEnum.Available,
      bookId: createTestId(TableNameEnum.BookInfo, 0),
    });

    await executeTask(bookInfoRepository.createBookItem(bookItem));

    //When we find him by id

    const result = await executeTask(
      bookInfoRepository.findBookItemById(bookItem.id),
    );
    //Then we should have deleted him

    expect(result).toMatchObject(
      O.some({
        id: bookItem.id,
        status: bookItem.status,
        bookId: bookItem.bookId,
      }),
    );
  });

  it("Successfully update bookItem", async () => {
    const bookInfo = bookInfoBuilder.build();
    await saveBookInfo(bookInfo);
    //Given an existing bookItem in database
    const bookItem = BookItem.parse({
      id: createTestId(TableNameEnum.BookItem, 0),
      status: BookItemStatusEnum.Available,
      bookId: createTestId(TableNameEnum.BookInfo, 0),
    });

    await executeTask(bookInfoRepository.createBookItem(bookItem));

    //When we find update him
    const newBookItem = BookItem.parse({
      ...bookItem,
      status: BookItemStatusEnum.Rented,
    });
    await executeTask(bookInfoRepository.updateBookItem(newBookItem));
    //Then we should have updated him
    const savedBookItem = await prismaService.bookItem.findUnique({
      where: {
        id: bookItem.id,
      },
    });
    expect(savedBookItem).toMatchObject({
      id: bookItem.id,
      status: newBookItem.status,
      bookId: bookItem.bookId,
    });
  });
});
