import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import {
  GetBookInfoByIdQuery,
  GetBookInfoByIdQueryHandler,
} from "@modules/book/queries/getBookInfoById/getBookInfoById.query";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] List BookInfos", () => {
  const ctx = useHandlerModule(
    { providers: [GetBookInfoByIdQueryHandler] },
    (get) => ({
      bookInfoRepository: get(BookInfoRepository),
      getBookInfoByIdQueryHandler: get(GetBookInfoByIdQueryHandler),
    }),
  );

  it("Should get bookInfo if he exists", async () => {
    //Given a valid query
    const bookInfo = new BookInfoBuilder().build();

    const query = new GetBookInfoByIdQuery(bookInfo.id);

    //With bookInfos in database
    await executeTask(ctx.bookInfoRepository.save(bookInfo));

    //When we get bookInfo id
    const result = await ctx.getBookInfoByIdQueryHandler.execute(query);
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
    await executeTask(ctx.bookInfoRepository.save(bookInfo));

    //When get bookInfo
    const resultPromise = ctx.getBookInfoByIdQueryHandler.execute(query);
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
    const resultPromise = ctx.getBookInfoByIdQueryHandler.execute(query);
    //Then it should throw an BookInfoNotFoundException
    await expect(resultPromise).rejects.toBeInstanceOf(
      BookInfoNotFoundException,
    );
  });
});
