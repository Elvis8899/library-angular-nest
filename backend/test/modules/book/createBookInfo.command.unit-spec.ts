import {
  CreateBookInfo,
  CreateBookInfoHandler,
} from "@modules/book/commands/createBookInfo/createBookInfo.command";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] Create BookInfo", () => {
  const ctx = useHandlerModule(
    { providers: [CreateBookInfoHandler] },
    (get) => ({
      bookInfoRepository: get(BookInfoRepository),
      createBookInfoHandler: get(CreateBookInfoHandler),
      eventBookInfo: get(DomainEventPublisher),
    }),
  );

  it("Should create bookInfo if bookInfo is valid", async () => {
    //Given a potentially valid bookInfo
    const bookInfo = new BookInfoBuilder().buildCreateDTO();

    //When we create a bookInfo
    const resultPromise = ctx.createBookInfoHandler.execute(
      new CreateBookInfo(bookInfo),
    );

    //Then it should have created a bookInfo
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should create bookInfo without optional keys", async () => {
    //Given a potentially valid name

    const bookInfo = new BookInfoBuilder().buildCreateDTO();
    //When we create a bookInfo
    const resultPromise = ctx.createBookInfoHandler.execute(
      new CreateBookInfo(bookInfo),
    );

    //Then it should have created a bookInfo
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is created", async () => {
    //Given a potentially valid name

    const spy = vi.spyOn(ctx.eventBookInfo, "publishEvent");

    const bookInfo = new BookInfoBuilder().buildCreateDTO();
    //When we create a bookInfo
    await ctx.createBookInfoHandler.execute(new CreateBookInfo(bookInfo));

    //Then it should have created a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
