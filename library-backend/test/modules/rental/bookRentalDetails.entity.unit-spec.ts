import { BookRentalDetails } from "@rental/domain/bookRental.entity";
import { BookRentalBuilder } from "@test/data-builders/bookRentalBuilder";

describe("[Unit] Update BookInfo", () => {
  const bookRentalBuilder = new BookRentalBuilder();

  it("Should return fines if book is not overdue", () => {
    const bookRentalDetails = BookRentalDetails.parse(
      bookRentalBuilder.build(),
    );
    expect(bookRentalDetails.fines).toMatchObject({
      days: -7,
      fixed: 0,
      overdue: false,
      perDayValue: 0,
      total: 0,
    });
  });

  it("Should return fines if book is overdue", () => {
    const bookRentalDetails = BookRentalDetails.parse(
      bookRentalBuilder
        .withOverdueDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .withUser({ name: "Test User" })
        .withBookItem({ book: { name: "Test Book", price: 100 } })
        .build(),
    );
    expect(bookRentalDetails.fines).toMatchObject({
      days: 7,
      fixed: 20,
      overdue: true,
      perDayValue: 5,
      total: 55,
    });
  });
});
