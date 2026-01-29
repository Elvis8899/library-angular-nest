import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import {
  PaginatedBookInfosQuery,
  PaginatedBookInfosQueryHandler,
} from "@book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
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
