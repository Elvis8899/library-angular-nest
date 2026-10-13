import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import {
  PaginatedBookInfosQuery,
  PaginatedBookInfosQueryHandler,
} from "@book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { UnprocessableEntityException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { PinoLogger } from "nestjs-pino";

//Adapters
let bookInfoRepository: BookInfoRepository;

describe("[Unit] List BookInfos", () => {
  let paginatedBookInfosQueryHandler: PaginatedBookInfosQueryHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaginatedBookInfosQueryHandler,
        RealUUIDGeneratorService,
        { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    paginatedBookInfosQueryHandler =
      moduleRef.get<PaginatedBookInfosQueryHandler>(
        PaginatedBookInfosQueryHandler,
      );
  });

  it("Should list bookInfos if query is valid", async () => {
    //Given a valid query
    const limit = 10;
    const page = 0;
    const query = new PaginatedBookInfosQuery({
      limit,
      page,
    });

    //With bookInfos in database
    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));

    //When we list bookInfos
    const result = await paginatedBookInfosQueryHandler.execute(query);
    //Then it should show a list of bookInfos
    expect(result.data.length).toBe(1);
    expect(result.data[0]).toStrictEqual(bookInfo);
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  it("Shouldnt list bookInfos if page is invalid", async () => {
    //Given a valid query
    const limit = 10;
    const page = 1;
    const query = new PaginatedBookInfosQuery({
      limit,
      page,
    });

    //With bookInfos in database
    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));

    //When we list bookInfos
    const result = await paginatedBookInfosQueryHandler.execute(query);
    //Then it should show a list of bookInfos
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  describe("Searching by name", () => {
    const saveBooks = async () => {
      const book = (index: number, name: string) =>
        new BookInfoBuilder(index).withName(name).build();
      const domCasmurro = book(1, "Dom Casmurro");
      const cortico = book(2, "O Cortiço");
      await executeTask(bookInfoRepository.save(domCasmurro));
      await executeTask(bookInfoRepository.save(cortico));
      return { domCasmurro, cortico };
    };

    it("Should list only books whose name contains the search, ignoring case", async () => {
      //Given two books in database
      const { domCasmurro } = await saveBooks();

      //When we search for part of one name, in another case
      const result = await paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery({ limit: 10, page: 0 }, "  CASMURRO "),
      );

      //Then only that book is listed and counted
      expect(result.data).toStrictEqual([domCasmurro]);
      expect(result.count).toBe(1);
    });

    it("Should list every book when the search is blank", async () => {
      //Given two books in database
      await saveBooks();

      //When we search for spaces only
      const result = await paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery({ limit: 10, page: 0 }, "   "),
      );

      //Then no filter is applied
      expect(result.count).toBe(2);
    });

    it("Should reject a search longer than 200 characters", async () => {
      //When we search with a very long text
      const resultPromise = paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery({ limit: 10, page: 0 }, "a".repeat(201)),
      );

      //Then the query is rejected as invalid
      await expect(resultPromise).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  it("Shouldnt list bookInfos if there isnt bookInfos", async () => {
    //Given a valid query and no bookInfos in database
    const limit = 10;
    const page = 0;
    const query = new PaginatedBookInfosQuery({
      limit,
      page,
    });

    //When we list bookInfos
    const result = await paginatedBookInfosQueryHandler.execute(query);
    //Then it should show an empty list
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(0);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });
});
