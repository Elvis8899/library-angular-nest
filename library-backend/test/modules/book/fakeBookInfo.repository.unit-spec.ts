import { FakeBookInfoRepository } from "@book/database/fakeBookInfo.repository";
import { BookItemStatusEnum } from "@book/domain/bookItem.entity";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

describe("[Unit] Fake BookInfo repository", () => {
  let repository: FakeBookInfoRepository;

  beforeEach(() => {
    repository = new FakeBookInfoRepository();
  });

  it("Should ignore a new item whose book doesn't exist", async () => {
    await executeTask(
      repository.createBookItem({
        id: createTestId(TableNameEnum.BookItem, 1),
        status: BookItemStatusEnum.Available,
        bookId: createTestId(TableNameEnum.BookInfo, 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const books = await executeTask(repository.findAll());
    expect(books).toEqual([]);
  });

  it("Should do nothing when deleting an item that doesn't exist", async () => {
    const itemId = createTestId(TableNameEnum.BookItem, 1);

    await executeTask(repository.deleteBookItem(itemId));

    const item = await executeTask(repository.findBookItemById(itemId));
    expect(item).toEqual(O.none);
  });
});
