import {
  addDays,
  businessToday,
  isBusinessDate,
} from "@app/shared/utils/businessDate.utility";

describe("businessDate utility", () => {
  it("Should give São Paulo's day, three hours behind UTC", () => {
    expect(businessToday(new Date("2026-10-22T02:59:00Z"))).toBe("2026-10-21");
    expect(businessToday(new Date("2026-10-22T03:00:00Z"))).toBe("2026-10-22");
  });

  it("Should default to now", () => {
    expect(isBusinessDate(businessToday())).toBe(true);
  });

  it("Should add and subtract days across months and years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("Should accept only real days in yyyy-MM-dd", () => {
    expect(isBusinessDate("2026-10-21")).toBe(true);
    expect(isBusinessDate("2026-02-30")).toBe(false);
    expect(isBusinessDate("21/10/2026")).toBe(false);
  });
});
