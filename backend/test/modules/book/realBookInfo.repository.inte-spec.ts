import { BookInfoSort } from "@modules/book/database/bookInfo.repository.port";
import { RealBookInfoRepository } from "@modules/book/database/realBookInfo.repository";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import {
  BookItem,
  BookItemStatusEnum,
} from "@modules/book/domain/bookItem.entity";
import { Test } from "@nestjs/testing";
import { PrismaService } from "@shared/prisma/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UnknownException } from "@shared/utils/domain/shared.errors";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { resetDatabase } from "@test/util/resetDatabase";

let prismaService: PrismaService;
let bookInfoRepository: RealBookInfoRepository;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [RealBookInfoRepository, PrismaService],
  }).compile();

  bookInfoRepository = module.get(RealBookInfoRepository);
  prismaService = module.get(PrismaService);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

describe("[Integration] BookInfo repository", () => {
  const newestFirst: BookInfoSort = { by: "createdAt", order: "desc" };
  const bookInfoBuilder = new BookInfoBuilder();
  const allBuilders = [bookInfoBuilder];

  const saveBookInfo = (p: BookInfo) => executeTask(bookInfoRepository.save(p));

  beforeEach(async () => {
    await resetDatabase(prismaService);
  });

  afterEach(() => {
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

  it("Should find books by part of their name, ignoring case", async () => {
    //Given three books in database
    const book = (index: number, name: string) =>
      new BookInfoBuilder(index).withName(name).withBookItems([]).build();
    const domCasmurro = book(1, "Dom Casmurro");
    await saveBookInfo(domCasmurro);
    await saveBookInfo(book(2, "Memórias Póstumas"));
    await saveBookInfo(book(3, "O Cortiço"));

    //When we search for part of a name in another case
    const result = await executeTask(
      bookInfoRepository.findAllPaginated({
        page: 0,
        limit: 10,
        offset: 0,
        query: { name: "CASM", sort: newestFirst },
      }),
    );

    //Then only that book is found and counted
    expect(result.count).toBe(1);
    expect(result.data.map((book) => book.id)).toEqual([domCasmurro.id]);
  });

  it("Should find books created in a time range, end exclusive", async () => {
    //Given books created just before, at the start, at the end and after one day
    const book = (index: number, createdAt: string) =>
      new BookInfoBuilder(index)
        .withCreatedAt(new Date(createdAt))
        .withBookItems([])
        .build();
    const start = book(2, "2026-10-13T03:00:00.000Z");
    const end = book(3, "2026-10-14T02:59:59.999Z");
    await saveBookInfo(book(1, "2026-10-13T02:59:59.999Z"));
    await saveBookInfo(start);
    await saveBookInfo(end);
    await saveBookInfo(book(4, "2026-10-14T03:00:00.000Z"));

    //When we list that day
    const result = await executeTask(
      bookInfoRepository.findAllPaginated({
        page: 0,
        limit: 10,
        offset: 0,
        query: {
          createdFrom: new Date("2026-10-13T03:00:00.000Z"),
          createdBefore: new Date("2026-10-14T03:00:00.000Z"),
          sort: { by: "createdAt", order: "asc" },
        },
      }),
    );

    //Then only the books of that day are found, oldest first
    expect(result.count).toBe(2);
    expect(result.data.map((b) => b.id)).toEqual([start.id, end.id]);
  });

  it("Should sort books by name, breaking ties by id", async () => {
    //Given books with names out of order and one repeated
    const book = (index: number, name: string) =>
      new BookInfoBuilder(index).withName(name).withBookItems([]).build();
    const cortico = book(1, "O Cortiço");
    const domCasmurro = book(2, "Dom Casmurro");
    const iracema = book(3, "Iracema");
    const domCasmurro2 = book(4, "Dom Casmurro");
    for (const b of [cortico, domCasmurro, iracema, domCasmurro2]) {
      await saveBookInfo(b);
    }

    //When we list them by name in each direction
    const list = (order: BookInfoSort["order"]) =>
      executeTask(
        bookInfoRepository.findAllPaginated({
          page: 0,
          limit: 10,
          offset: 0,
          query: { sort: { by: "name", order } },
        }),
      ).then((result) => result.data.map((b) => b.id));

    //Then they are in name order, and equal names keep the same order
    expect(await list("asc")).toEqual([
      domCasmurro.id,
      domCasmurro2.id,
      iracema.id,
      cortico.id,
    ]);
    expect(await list("desc")).toEqual([
      cortico.id,
      iracema.id,
      domCasmurro.id,
      domCasmurro2.id,
    ]);
  });

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
            query: { sort: newestFirst },
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
    await expect(resultPromise).rejects.toBeInstanceOf(UnknownException);
    const savedBookInfos = await prismaService.bookInfo.findMany({});

    expect(savedBookInfos.length).toBe(1);
  });

  it("Should store a price with centavos as cents", async () => {
    //Given a book that costs R$ 12,50
    const bookInfo = bookInfoBuilder.withPrice(12.5).build();

    //When we save and retrieve it
    await saveBookInfo(bookInfo);
    const result = await executeTask(bookInfoRepository.findById(bookInfo.id));

    //Then the price comes back in reais, and is stored in centavos
    expect(result).toMatchObject(O.some({ price: 12.5 }));
    const row = await prismaService.bookInfo.findUnique({
      where: { id: bookInfo.id },
    });
    expect(row?.priceCents).toBe(1250);
  });

  it("Should update a stored book's name, image and price", async () => {
    //Given a stored book
    const bookInfo = bookInfoBuilder.build();
    await saveBookInfo(bookInfo);

    //When we save it with new values
    const changed = {
      ...bookInfo,
      name: "Novo nome",
      image: "https://example.com/capa.jpg",
      price: 49.9,
    };
    await saveBookInfo(changed);

    //Then all of them are stored
    const result = await executeTask(bookInfoRepository.findById(bookInfo.id));
    expect(result).toMatchObject(
      O.some({ name: changed.name, image: changed.image, price: 49.9 }),
    );
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
          query: { sort: newestFirst },
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
});
