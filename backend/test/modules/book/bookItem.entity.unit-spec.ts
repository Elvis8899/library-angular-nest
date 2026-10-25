import {
  BookItem,
  BookItemStatus,
  ensureAvailable,
} from "@modules/book/domain/bookItem.entity";
import { E } from "@shared/utils/application/monads";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

describe("[Unit] BookItem rules", () => {
  const bookItem = (status: BookItemStatus) =>
    BookItem.parse({
      id: createTestId(TableNameEnum.BookItem, 0),
      bookId: createTestId(TableNameEnum.BookInfo, 0),
      status,
    });
  const unavailable = new Error("unavailable");

  it("Should accept an available book item", () => {
    const item = bookItem(BookItemStatus.Available);
    expect(ensureAvailable(() => unavailable)(item)).toEqual(E.right(item));
  });

  it("Should refuse a rented book item with the given error", () => {
    const item = bookItem(BookItemStatus.Rented);
    expect(ensureAvailable(() => unavailable)(item)).toEqual(
      E.left(unavailable),
    );
  });
});
