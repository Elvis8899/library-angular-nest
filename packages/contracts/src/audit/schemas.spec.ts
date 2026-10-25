import { describe, expect, it } from "vitest";
import { AuditQuery } from "./schemas.js";

describe("audit contracts", () => {
  it("Should take blank filters as none, trim the texts and read the instants", () => {
    expect(
      AuditQuery.parse({
        userId: "",
        useCase: " User ",
        from: "2026-10-21T03:00:00.000Z",
      }),
    ).toEqual({ useCase: "User", from: new Date("2026-10-21T03:00:00Z") });
  });

  it("Should refuse a period that doesn't end after it starts", () => {
    const period = (from: string, before: string) =>
      AuditQuery.safeParse({ from, before });

    expect(
      period("2026-10-21T03:00:00Z", "2026-10-21T03:00:00Z").error?.issues[0]
        ?.path,
    ).toEqual(["from"]);
    expect(period("2026-10-21T03:00:00Z", "2026-10-22T03:00:00Z").success).toBe(
      true,
    );
  });
});
