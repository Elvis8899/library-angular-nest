import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import { BookInfoNotFoundException } from "@book/domain/bookInfo.errors";
import {
  GetBookInfoByIdQuery,
  GetBookInfoByIdQueryHandler,
} from "@book/queries/getBookById/getBookInfoById.query";
import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { PinoLogger } from "nestjs-pino";

//Adapters
let bookInfoRepository: BookInfoRepository;

describe("[Unit] List BookInfos", () => {
  let getBookInfoByIdQueryHandler: GetBookInfoByIdQueryHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetBookInfoByIdQueryHandler,
        RealUUIDGeneratorService,
        { provide: BookInfoRepository, useClass: FakeBookInfoRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    getBookInfoByIdQueryHandler = moduleRef.get<GetBookInfoByIdQueryHandler>(
      GetBookInfoByIdQueryHandler,
    );
  });

  it("Should get bookInfo if he exists", async () => {
    //Given a valid query
    const bookInfo = new BookInfoBuilder().build();

    const query = new GetBookInfoByIdQuery(bookInfo.id);

    //With bookInfos in database
    await executeTask(bookInfoRepository.save(bookInfo));

    //When we get bookInfo id
    const result = await getBookInfoByIdQueryHandler.execute(query);
    //Then it should show his data
    expect(result.id).toBe(bookInfo.id);
  });

  it("Shouldnt get bookInfo if id is invalid", async () => {
    //Given a valid query
    const query = new GetBookInfoByIdQuery(
      "00000000-0000-0000-0001-000000000000",
    );

    //With bookInfos in database
    const bookInfo = new BookInfoBuilder(1).build();
    await executeTask(bookInfoRepository.save(bookInfo));

    //When get bookInfo
    const resultPromise = getBookInfoByIdQueryHandler.execute(query);
    //Then it should show a list of bookInfos

    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
  });

  it("Shouldnt get bookInfo if there isnt bookInfos", async () => {
    //Given a valid query and no bookInfos in database

    const bookInfo = new BookInfoBuilder(1).build();
    const query = new GetBookInfoByIdQuery(bookInfo.id);

    //When we list bookInfos
    const resultPromise = getBookInfoByIdQueryHandler.execute(query);
    //Then it should throw an BookInfoNotFoundException
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
  });
});
