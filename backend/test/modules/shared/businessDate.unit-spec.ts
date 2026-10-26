import { SystemClock } from "@shared/clock/clock";
import { DbDateColumn } from "@shared/utils/database/dbDateColumn";
import {
  businessDateOf,
  businessDayStart,
  fromDbDate,
  monthDays,
  toDbDate,
} from "@shared/utils/domain/businessDate";
import { FakeClock } from "@test/util/fakeClock";

describe("[Unit] Business dates", () => {
  it("Should start a day at midnight in America/Sao_Paulo (UTC-3)", () => {
    expect(businessDayStart("2026-01-15")).toEqual(
      new Date("2026-01-15T03:00:00Z"),
    );
    expect(businessDateOf(businessDayStart("2026-01-15"))).toBe("2026-01-15");
  });

  it("Should store a day as midnight UTC and read it back", () => {
    expect(toDbDate("2026-01-15")).toEqual(new Date("2026-01-15T00:00:00Z"));
    expect(fromDbDate(toDbDate("2026-01-15"))).toBe("2026-01-15");
    expect(DbDateColumn.parse(toDbDate("2026-01-15"))).toBe("2026-01-15");
  });

  it("Should give a month's first and last day", () => {
    expect(monthDays("2026-02")).toEqual({
      first: "2026-02-01",
      last: "2026-02-28",
    });
    expect(monthDays("2028-02").last).toBe("2028-02-29");
    expect(monthDays("2026-12").last).toBe("2026-12-31");
  });
});

describe("[Unit] Clocks", () => {
  it("Should give the current instant and its business day", () => {
    const clock = new SystemClock();
    const before = Date.now();

    const now = clock.now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(clock.today()).toBe(businessDateOf(new Date()));
  });

  it("Should stop the fake clock on 2026-10-21, a day it can move", () => {
    const clock = new FakeClock();

    expect(clock.today()).toBe("2026-10-21");
    // 01:00 UTC is still the day before in São Paulo
    expect(clock.set("2026-10-22T01:00:00Z").today()).toBe("2026-10-21");
  });
});
