import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  BusinessDate,
  optionalParam,
  page,
  PageQuery,
  Timestamp,
} from "./common.js";

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

  it("Should fall back to the first page of 20 on a missing or odd page", () => {
    expect(PageQuery.parse({})).toEqual({ page: 0, limit: 20 });
    expect(PageQuery.parse({ page: "2", limit: "x" })).toEqual({
      page: 2,
      limit: 20,
    });
  });

  it("Should take a blank parameter as none", () => {
    const text = optionalParam(z.string());
    expect(text.parse("")).toBeUndefined();
    expect(text.parse("a")).toBe("a");
  });
});
