import {
  RemoveBookItem,
  RemoveBookItemHandler,
} from "@modules/book/commands/removeBookItem/removeBookItem.command";
import { FakeBookInfoRepository } from "@modules/book/database/fakeBookInfo.repository";
import {
  AvailableBookItemNotFoundException,
  BookItemNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { BookItemStatus } from "@modules/book/domain/bookItem.entity";
import { BOOK_ITEM_REMOVED } from "@modules/book/domain/events/bookItemRemoved.event";
import { UnprocessableEntityException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  Resource,
  RESOURCE_CHANGED,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { seedBook } from "@test/modules/book/createBook";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

describe("[Unit] Remove BookItem", () => {
  const ctx = useHandlerModule(
    { providers: [RemoveBookItemHandler] },
    (get) => ({
      books: get(FakeBookInfoRepository),
      handler: get(RemoveBookItemHandler),
      events: get(DomainEventPublisher),
    }),
  );
  const copyId = createTestId(TableNameEnum.BookItem, 0);
  const copies = async () =>
    (await executeTask(ctx.books.findAll())).flatMap(({ bookItems }) =>
      bookItems.map(({ id }) => id),
    );

  it("Should remove a copy on the shelf, then publish its event and the books' reload", async () => {
    await seedBook(ctx.books, new BookInfoBuilder().build());
    const spy = vi.spyOn(ctx.events, "publishEvent");

    await ctx.handler.execute(new RemoveBookItem(copyId));

    expect(await copies()).toEqual([]);
    expect(
      spy.mock.calls.map(([event]) =>
        event.eventKey === RESOURCE_CHANGED
          ? event.payload.resource
          : event.eventKey,
      ),
    ).toEqual([BOOK_ITEM_REMOVED, Resource.Books]);
  });

  it("Should refuse with 404 book.noAvailableCopy a rented copy, keeping it", async () => {
    await seedBook(
      ctx.books,
      new BookInfoBuilder()
        .withBookItems([
          {
            id: copyId,
            status: BookItemStatus.Rented,
            bookId: createTestId(TableNameEnum.BookInfo, 0),
          },
        ])
        .build(),
    );

    await expect(
      ctx.handler.execute(new RemoveBookItem(copyId)),
    ).rejects.toBeInstanceOf(AvailableBookItemNotFoundException);
    expect(await copies()).toEqual([copyId]);
  });

  it("Should refuse with 404 book.copyNotFound a copy that isn't there, and 422 an invalid id, publishing nothing", async () => {
    await seedBook(ctx.books, new BookInfoBuilder().build());
    const spy = vi.spyOn(ctx.events, "publishEvent");

    await expect(
      ctx.handler.execute(
        new RemoveBookItem(createTestId(TableNameEnum.BookItem, 9)),
      ),
    ).rejects.toBeInstanceOf(BookItemNotFoundException);
    await expect(
      ctx.handler.execute(new RemoveBookItem("x")),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(await copies()).toEqual([copyId]);
    expect(spy).not.toHaveBeenCalled();
  });
});
