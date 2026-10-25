import {
  CreateBookInfo,
  CreateBookInfoHandler,
} from "@modules/book/commands/createBookInfo/createBookInfo.command";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { UnprocessableEntityException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  Resource,
  RESOURCE_CHANGED,
} from "@shared/domainEventPublisher/resourceChanged.event";
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
    // Its event, then the screens' reload
    expect(spy).toHaveBeenCalledTimes(2);
    expect(
      spy.mock.calls.slice(1).map(([event]) => ({
        resource: event.eventKey === RESOURCE_CHANGED && event.payload.resource,
      })),
    ).toEqual([{ resource: Resource.Books }]);
  });

  it.each([-1, 12.345])(
    "Should not create bookInfo with price %s",
    async (price) => {
      const bookInfo = new BookInfoBuilder().withPrice(price).buildCreateDTO();

      const resultPromise = ctx.createBookInfoHandler.execute(
        new CreateBookInfo(bookInfo),
      );

      await expect(resultPromise).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
      expect(bookInfos).toEqual([]);
    },
  );
});
