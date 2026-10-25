import { describe, expect, it } from "vitest";
import { z } from "zod";
import { BusinessDate, page, Timestamp } from "./common.js";

describe("common", () => {
  it("Should take a yyyy-MM-dd day and refuse anything else", () => {
    expect(BusinessDate.parse("2026-10-21")).toBe("2026-10-21");
    expect(BusinessDate.safeParse("21/10/2026").success).toBe(false);
  });

  it("Should read a moment from its ISO string and write it back", () => {
    const text = "2026-10-21T12:00:00.000Z";
    const moment = Timestamp.decode(text);
    expect(moment).toEqual(new Date(text));
    expect(Timestamp.encode(moment)).toBe(text);
  });

  it("Should read a page of items with its count", () => {
    const names = page(z.string());
    expect(names.parse({ data: ["a"], count: 3, limit: 1, page: 0 })).toEqual({
      data: ["a"],
      count: 3,
      limit: 1,
      page: 0,
    });
    expect(
      names.safeParse({ data: [1], count: 1, limit: 1, page: 0 }).success,
    ).toBe(false);
  });
});
