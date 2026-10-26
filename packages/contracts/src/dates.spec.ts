import { describe, expect, it } from "vitest";
import { addDays, businessDateOf, isBusinessDate } from "./dates.js";

describe("business days", () => {
  it("Should take São Paulo's day, whatever the clock's zone", () => {
    // 02:30 UTC is still the day before in São Paulo (UTC-3)
    expect(businessDateOf(new Date("2026-10-22T02:30:00Z"))).toBe("2026-10-21");
    expect(businessDateOf(new Date("2026-10-22T03:00:00Z"))).toBe("2026-10-22");
  });

  it("Should count days across months and years, both ways", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("Should tell a real day from a day-shaped text", () => {
    expect(isBusinessDate("2026-02-28")).toBe(true);
    expect(isBusinessDate("2026-02-30")).toBe(false);
    expect(isBusinessDate("2026-13-40")).toBe(false);
    expect(isBusinessDate("26-2-28")).toBe(false);
  });
});
