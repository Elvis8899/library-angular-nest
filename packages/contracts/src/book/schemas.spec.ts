import { describe, expect, it } from "vitest";
import { BookInfoQuery, BookInfoRequest, BookItemRequest } from "./schemas.js";
import { coverPath, inWholeCentavos } from "./values.js";

describe("book contracts", () => {
  it("Should take amounts to the centavo only", () => {
    expect(inWholeCentavos(12.5)).toBe(true);
    expect(inWholeCentavos(0.1 + 0.2)).toBe(true);
    expect(inWholeCentavos(12.345)).toBe(false);
  });

  it("Should take a book's name and price, and refuse a price in fractions of a centavo", () => {
    expect(BookInfoRequest.parse({ name: "Dom Casmurro", price: 30 })).toEqual({
      name: "Dom Casmurro",
      price: 30,
    });
    expect(
      BookInfoRequest.safeParse({ name: "Dom Casmurro", price: 30.001 })
        .success,
    ).toBe(false);
  });

  it("Should read a cover at its version, none without one", () => {
    const id = "00000000-0000-0000-0000-000000000001";
    expect(coverPath({ id, cover: "v 1" })).toBe(
      `/v1/bookInfos/${id}/cover?v=v%201`,
    );
    expect(coverPath({ id, cover: null })).toBeNull();
  });

  it("Should take a copy's status or leave it out", () => {
    const bookId = "00000000-0000-0000-0000-000000000001";
    expect(BookItemRequest.parse({ bookId })).toEqual({ bookId });
    expect(BookItemRequest.safeParse({ bookId, status: "lost" }).success).toBe(
      false,
    );
  });

  it("Should read the list's filters, blank ones as none, and order by the newest", () => {
    expect(BookInfoQuery.parse({ name: " dom ", createdFrom: "" })).toEqual({
      name: "dom",
      sortBy: "createdAt",
      order: "desc",
    });
    expect(
      BookInfoQuery.parse({
        createdFrom: "2026-10-13T03:00:00.000Z",
        sortBy: "name",
        order: "asc",
      }),
    ).toEqual({
      createdFrom: new Date("2026-10-13T03:00:00.000Z"),
      sortBy: "name",
      order: "asc",
    });
  });

  it("Should refuse a period that ends before it starts, or an unknown order", () => {
    expect(
      BookInfoQuery.safeParse({
        createdFrom: "2026-10-14T03:00:00.000Z",
        createdBefore: "2026-10-13T03:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(BookInfoQuery.safeParse({ sortBy: "price" }).success).toBe(false);
  });
});
