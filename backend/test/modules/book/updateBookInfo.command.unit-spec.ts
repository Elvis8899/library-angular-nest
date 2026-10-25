import {
  UpdateBookInfo,
  UpdateBookInfoHandler,
} from "@modules/book/commands/updateBookInfo/updateBookInfo.command";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { UnprocessableEntityException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  Resource,
  RESOURCE_CHANGED,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { seedBook } from "@test/modules/book/createBook";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] Update BookInfo", () => {
  const bookInfoBuilder = new BookInfoBuilder(1);
  let originalBookInfoId: string;

  const ctx = useHandlerModule(
    { providers: [UpdateBookInfoHandler] },
    (get) => ({
      bookInfoRepository: get(BookInfoRepository),
      updateBookInfoHandler: get(UpdateBookInfoHandler),
      eventBookInfo: get(DomainEventPublisher),
    }),
  );

  beforeEach(async () => {
    bookInfoBuilder.reset();
    const originalBookInfo = bookInfoBuilder.build();
    originalBookInfoId = originalBookInfo.id;
    await seedBook(ctx.bookInfoRepository, originalBookInfo);
  });

  it("Should update bookInfo if bookInfo is valid", async () => {
    // Given a potentially valid bookInfo
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();

    //When we update it
    const resultPromise = ctx.updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, originalBookInfoId),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should update bookInfo without optional keys", async () => {
    //Given a potentially valid bookInfo
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();

    //When we update it without optional keys
    const resultPromise = ctx.updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, originalBookInfoId),
    );

    //Then it should have updated the bookInfo
    await expect(resultPromise).resolves.toEqual(undefined);

    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is updated", async () => {
    //Given a potentially valid bookInfo
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();

    const spy = vi.spyOn(ctx.eventBookInfo, "publishEvent");

    //When we update the bookInfo
    await ctx.updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, originalBookInfoId),
    );

    //Then it should have updated the bookInfo and emitted an event
    // Its event, then the screens' reload
    expect(spy).toHaveBeenCalledTimes(2);
    expect(
      spy.mock.calls.slice(1).map(([event]) => ({
        resource: event.eventKey === RESOURCE_CHANGED && event.payload.resource,
      })),
    ).toEqual([{ resource: Resource.Books }]);
  });

  it("Should not update an bookInfo if it doesn't exist", async () => {
    // Given a potentially valid bookInfo
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();

    // And an invalid id
    const invalidBookInfoId = "c017f4a9-c458-4ea7-829c-021c6a608503";

    //When we update the bookInfo with an id that doesn't exist
    const resultPromise = ctx.updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, invalidBookInfoId),
    );

    //Then it should have thrown an error and not have updated the bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
  });

  it("Should not update an bookInfo if name is invalid", async () => {
    // Given a bookInfo with an invalid name
    const bookInfoDTO = bookInfoBuilder.withName("").buildCreateDTO();

    //When we update the bookInfo
    const resultPromise = ctx.updateBookInfoHandler.execute(
      new UpdateBookInfo(bookInfoDTO, originalBookInfoId),
    );

    //Then it should have thrown an error and not have updated the bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });
});
