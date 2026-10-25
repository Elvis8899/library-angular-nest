import {
  dueDateOf,
  rentalDetailsOf,
} from "@modules/rental/domain/bookRental.entity";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-21T12:00:00Z");
const details = rentalDetailsOf(now);

describe("[Unit] Rental fines", () => {
  const bookRentalBuilder = new BookRentalBuilder();

  it("Should be due at the end of the day, a week after the rent", () => {
    const due = dueDateOf(now);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 0);

    expect(due.getTime() - endOfToday.getTime()).toBe(7 * DAY_MS);
  });

  it("Should return fines if book is not overdue", () => {
    const bookRentalDetails = details(
      bookRentalBuilder.withOverdueDate(dueDateOf(now)).build(),
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
    const bookRentalDetails = details(
      bookRentalBuilder
        .withOverdueDate(new Date(now.getTime() - 7 * DAY_MS))
        .withUser({ name: "Test User" })
        .withBookItem({ book: { name: "Test Book", price: 100 } })
        .build(),
    );
    expect(bookRentalDetails).toMatchObject({
      userName: "Test User",
      bookName: "Test Book",
    });
    expect(bookRentalDetails.fines).toMatchObject({
      days: 7,
      fixed: 20,
      overdue: true,
      perDayValue: 5,
      total: 55,
    });
  });

  it("Should round fines to the centavo", () => {
    const bookRentalDetails = details(
      bookRentalBuilder
        .withOverdueDate(new Date(now.getTime() - 7 * DAY_MS))
        .withBookItem({ book: { name: "Test Book", price: 33.33 } })
        .build(),
    );
    expect(bookRentalDetails.fines).toMatchObject({
      days: 7,
      perDayValue: 1.67,
      total: 31.69,
    });
  });
});
