import { BookRental } from "@library/contracts";
import { BookRentalDetails } from "@modules/rental/domain/bookRental.entity";
import { toBookRentalResponse } from "@modules/rental/domain/bookRentalViews";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";

describe("[Unit] toBookRentalResponse", () => {
  const details = (deliveryDate?: Date) =>
    BookRentalDetails.parse({
      ...new BookRentalBuilder()
        .withUser({ name: "Ana" })
        .withBookItem({ book: { name: "Dom Casmurro", price: 30 } })
        .build(),
      deliveryDate,
    });

  it("Should send the names and no delivery date while the book is out", () => {
    const sent = toBookRentalResponse(details());

    expect(sent).toMatchObject({
      userName: "Ana",
      bookName: "Dom Casmurro",
      deliveryDate: null,
    });
    // Only what the contract has
    expect(Object.keys(sent).sort()).toEqual(
      Object.keys(BookRental.shape).sort(),
    );
  });

  it("Should send when a returned book came back", () => {
    const deliveredAt = new Date("2026-10-21T12:00:00.000Z");

    expect(toBookRentalResponse(details(deliveredAt)).deliveryDate).toEqual(
      deliveredAt,
    );
  });
});
