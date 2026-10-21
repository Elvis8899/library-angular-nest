import {
  bookItemPriceFromCents,
  priceFromCents,
  priceToCents,
} from "@modules/book/database/priceColumn";

describe("[Unit] Price column", () => {
  it("Should read a price in centavos as reais", () => {
    expect(priceFromCents({ name: "Book", priceCents: 1250 })).toEqual({
      name: "Book",
      priceCents: 1250,
      price: 12.5,
    });
  });

  it("Should leave a row without a price in centavos as it is", () => {
    const row = { name: "Book" };
    expect(priceFromCents(row)).toBe(row);
  });

  it("Should read the price of a rental's book in reais", () => {
    expect(
      bookItemPriceFromCents({
        id: "rental",
        bookItem: { book: { priceCents: 1250 } },
      }),
    ).toEqual({
      id: "rental",
      bookItem: { book: { priceCents: 1250, price: 12.5 } },
    });
  });

  it("Should leave a rental without its book item as it is", () => {
    const row = { id: "rental" };
    expect(bookItemPriceFromCents(row)).toBe(row);
  });

  it("Should write a price in reais as centavos", () => {
    expect(priceToCents(12.5)).toEqual({ priceCents: 1250 });
    expect(priceToCents(0.29)).toEqual({ priceCents: 29 });
  });
});
