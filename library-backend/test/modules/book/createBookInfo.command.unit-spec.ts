import {
  CreateBookInfo,
  CreateBookInfoHandler,
} from "@book/commands/createBookInfo/createBookInfo.command";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { DomainEventPublisher } from "@shared/domainEventPublisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { createHandlerModule } from "@test/util/handlerModule";

//Adapters
let bookInfoRepository: BookInfoRepository;
let eventBookInfo: DomainEventPublisher;

describe("[Unit] Create BookInfo", () => {
  let createBookInfoHandler: CreateBookInfoHandler;

  beforeEach(async () => {
    const moduleRef = await createHandlerModule([CreateBookInfoHandler]);

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    createBookInfoHandler = moduleRef.get<CreateBookInfoHandler>(
      CreateBookInfoHandler,
    );
    eventBookInfo = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);
  });

  it("Should create bookInfo if bookInfo is valid", async () => {
    //Given a potentially valid bookInfo
    const bookInfo = new BookInfoBuilder().buildCreateDTO();

    //When we create a bookInfo
    const resultPromise = createBookInfoHandler.execute(
      new CreateBookInfo(bookInfo),
    );

    //Then it should have created a bookInfo
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should create bookInfo without optional keys", async () => {
    //Given a potentially valid name

    const bookInfo = new BookInfoBuilder().buildCreateDTO();
    //When we create a bookInfo
    const resultPromise = createBookInfoHandler.execute(
      new CreateBookInfo(bookInfo),
    );

    //Then it should have created a bookInfo
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookInfos = await executeTask(bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is created", async () => {
    //Given a potentially valid name

    const spy = jest.spyOn(eventBookInfo, "publishEvent");

    const bookInfo = new BookInfoBuilder().buildCreateDTO();
    //When we create a bookInfo
    await createBookInfoHandler.execute(new CreateBookInfo(bookInfo));

    //Then it should have created a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
