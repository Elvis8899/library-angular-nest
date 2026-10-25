import { describe, expect, it } from "vitest";
import { BookInfoRequest, BookItemRequest } from "./schemas.js";
import { inWholeCentavos } from "./values.js";

describe("book contracts", () => {
  it("Should take amounts to the centavo only", () => {
    expect(inWholeCentavos(12.5)).toBe(true);
    expect(inWholeCentavos(0.1 + 0.2)).toBe(true);
    expect(inWholeCentavos(12.345)).toBe(false);
  });

  it("Should take a book without an image, and refuse a price in fractions of a centavo", () => {
    expect(BookInfoRequest.parse({ name: "Dom Casmurro", price: 30 })).toEqual({
      name: "Dom Casmurro",
      image: "",
      price: 30,
    });
    expect(
      BookInfoRequest.safeParse({ name: "Dom Casmurro", price: 30.001 })
        .success,
    ).toBe(false);
  });

  it("Should take a copy's status or leave it out", () => {
    const bookId = "00000000-0000-0000-0000-000000000001";
    expect(BookItemRequest.parse({ bookId })).toEqual({ bookId });
    expect(BookItemRequest.safeParse({ bookId, status: "lost" }).success).toBe(
      false,
    );
  });
});
