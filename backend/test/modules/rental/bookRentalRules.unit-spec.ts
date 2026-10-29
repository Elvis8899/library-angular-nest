import { BookItem, BookItemStatus } from "@modules/book/domain/bookItem.entity";
import {
  ensureOwnedBy,
  finishRental,
  RentalStatusEnum,
  startRental,
} from "@modules/rental/domain/bookRental.entity";
import {
  BookRentalFinishedException,
  BookRentalNotAvailableException,
  BookRentalNotFoundException,
} from "@modules/rental/domain/bookRental.errors";
import { E } from "@shared/utils/application/monads";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { leftOf } from "@test/util/either";

describe("[Unit] BookRental rules", () => {
  const bookRentalBuilder = new BookRentalBuilder();
  const now = new Date("2026-10-21T12:00:00Z");

  beforeEach(() => {
    bookRentalBuilder.reset();
  });

  describe("startRental", () => {
    const bookItem = (status: BookItemStatus) =>
      BookItem.parse({
        id: createTestId(TableNameEnum.BookItem, 1),
        bookId: createTestId(TableNameEnum.BookInfo, 0),
        status,
      });

    it("Should start a rental of an available book item", () => {
      const rental = bookRentalBuilder.build();
      const result = startRental(rental)(bookItem(BookItemStatus.Available));
      expect(result).toEqual(
        E.right({
          ...rental,
          bookItemId: createTestId(TableNameEnum.BookItem, 1),
          rentalStatus: RentalStatusEnum.Rented,
        }),
      );
    });

    it("Should not start a rental of a rented book item", () => {
      const result = startRental(bookRentalBuilder.build())(
        bookItem(BookItemStatus.Rented),
      );
      expect(leftOf(result)).toBeInstanceOf(BookRentalNotAvailableException);
    });
  });

  describe("finishRental", () => {
    it("Should finish an active rental, delivered now", () => {
      const rental = bookRentalBuilder.build();
      expect(finishRental(now)(rental)).toEqual(
        E.right({
          ...rental,
          rentalStatus: RentalStatusEnum.Finished,
          deliveryDate: now,
        }),
      );
    });

    it("Should not finish a finished rental", () => {
      const result = finishRental(now)(
        bookRentalBuilder.withStatus(RentalStatusEnum.Finished).build(),
      );
      expect(leftOf(result)).toBeInstanceOf(BookRentalFinishedException);
    });
  });

  describe("ensureOwnedBy", () => {
    it.each([
      ["no owner (an admin)", undefined],
      ["its owner", createTestId(TableNameEnum.User, 0)],
    ])("Should accept a rental for %s", (_, ownerId) => {
      const rental = bookRentalBuilder.build();
      expect(ensureOwnedBy(ownerId)(rental)).toEqual(E.right(rental));
    });

    it("Should report someone else's rental as not found", () => {
      const result = ensureOwnedBy(createTestId(TableNameEnum.User, 5))(
        bookRentalBuilder.build(),
      );
      expect(leftOf(result)).toBeInstanceOf(BookRentalNotFoundException);
    });
  });
});
