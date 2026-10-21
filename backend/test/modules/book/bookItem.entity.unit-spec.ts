import {
  BookItem,
  BookItemStatusEnum,
  ensureAvailable,
} from "@modules/book/domain/bookItem.entity";
import { E } from "@shared/utils/application/monads";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

describe("[Unit] BookItem rules", () => {
  const bookItem = (status: BookItemStatusEnum) =>
    BookItem.parse({
      id: createTestId(TableNameEnum.BookItem, 0),
      bookId: createTestId(TableNameEnum.BookInfo, 0),
      status,
    });
  const unavailable = new Error("unavailable");

  it("Should accept an available book item", () => {
    const item = bookItem(BookItemStatusEnum.Available);
    expect(ensureAvailable(() => unavailable)(item)).toEqual(E.right(item));
  });

  it("Should refuse a rented book item with the given error", () => {
    const item = bookItem(BookItemStatusEnum.Rented);
    expect(ensureAvailable(() => unavailable)(item)).toEqual(
      E.left(unavailable),
    );
  });
});
