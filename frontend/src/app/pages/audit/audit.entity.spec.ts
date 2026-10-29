import {
  auditParams,
  inputText,
  noAuditFilters,
} from "@app/pages/audit/audit.entity";

describe("audit.entity", () => {
  it("Should show the input as indented JSON, nothing without one", () => {
    expect(inputText({ id: "u1" })).toBe('{\n  "id": "u1"\n}');
    expect(inputText("u1")).toBe('"u1"');
    expect(inputText(null)).toBe("");
    expect(inputText(undefined)).toBe("");
  });

  it("Should send the filled filters, the days as the instants they cover here", () => {
    expect(auditParams(noAuditFilters)).toEqual({});
    expect(
      auditParams({
        ...noAuditFilters,
        useCase: "User",
        from: "2026-10-01",
        to: "2026-10-31",
      }),
    ).toEqual({
      useCase: "User",
      from: new Date(2026, 9, 1).toISOString(),
      // The day after the last, excluded
      before: new Date(2026, 10, 1).toISOString(),
    });
  });
});
