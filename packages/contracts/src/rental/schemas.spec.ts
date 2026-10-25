import { describe, expect, it } from "vitest";
import { BookRental, RentBookRequest } from "./schemas.js";

const bookItemId = "00000000-0000-0000-0000-000000000001";
const userId = "00000000-0000-0000-0000-000000000002";

describe("rental contracts", () => {
  it("Should take a copy and a user, by id", () => {
    expect(RentBookRequest.parse({ bookItemId, userId })).toEqual({
      bookItemId,
      userId,
    });
    expect(RentBookRequest.safeParse({ bookItemId }).success).toBe(false);
  });

  it("Should send a rental's dates as ISO strings, none before it's returned", () => {
    const at = new Date("2026-10-21T12:00:00.000Z");
    const sent = BookRental.encode({
      id: bookItemId,
      bookItemId,
      userId,
      userName: "Ana",
      bookName: "Dom Casmurro",
      rentalStatus: "rented",
      overdueDate: at,
      deliveryDate: null,
      fines: { overdue: false, fixed: 0, days: -7, perDayValue: 1.5, total: 0 },
      createdAt: at,
      updatedAt: at,
    });
    expect(sent.overdueDate).toBe("2026-10-21T12:00:00.000Z");
    expect(sent.deliveryDate).toBeNull();
  });
});
