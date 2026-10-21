import {
  DeleteBookInfo,
  DeleteBookInfoHandler,
} from "@modules/book/commands/deleteBookInfo/deleteBookInfo.command";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] Delete BookInfo", () => {
  const ctx = useHandlerModule(
    { providers: [DeleteBookInfoHandler] },
    (get) => ({
      bookInfoRepository: get(BookInfoRepository),
      deleteBookInfoHandler: get(DeleteBookInfoHandler),
      eventModule: get(DomainEventPublisher),
    }),
  );

  it("Should delete bookInfo if id is valid", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    const id = bookInfo.id;

    //When we delete a bookInfo
    const resultPromise = ctx.deleteBookInfoHandler.execute(
      new DeleteBookInfo(id),
    );
    //Then it should have deleted a bookInfo
    await expect(resultPromise).resolves.toBe(undefined);
    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(0);
  });

  it("Should not delete bookInfo if id doesnt exists", async () => {
    //Given a valid id

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    const newId = "00000000-0000-0000-0000-000000000000";

    //When we delete a bookInfo
    const resultPromise = ctx.deleteBookInfoHandler.execute(
      new DeleteBookInfo(newId),
    );
    //Then it should not have deleted a bookInfo
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
    const bookInfos = await executeTask(ctx.bookInfoRepository.findAll());
    expect(bookInfos.length).toEqual(1);
  });

  it("Should emit domain event when bookInfo is deleted", async () => {
    //Given a bookInfo

    const spy = vi.spyOn(ctx.eventModule, "publishEvent");

    const bookInfo = new BookInfoBuilder().build();
    await executeTask(ctx.bookInfoRepository.save(bookInfo));
    const id = bookInfo.id;

    //When we delete a bookInfo
    await ctx.deleteBookInfoHandler.execute(new DeleteBookInfo(id));

    //Then it should have deleted a bookInfo and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
