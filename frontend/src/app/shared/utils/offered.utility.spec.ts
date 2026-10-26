import { offered } from "@app/shared/utils/offered.utility";

describe("offered", () => {
  const entries = [
    { id: "a", code: "kg", active: true },
    { id: "b", code: "un", active: false },
    { id: "c", code: "cx", active: false },
  ];

  it("Should offer the active entries plus the one already chosen", () => {
    expect(offered(entries, null)).toEqual([entries[0]]);
    expect(offered(entries, "b")).toEqual([entries[0], entries[1]]);
  });

  it("Should keep several chosen ones, by the field named", () => {
    expect(offered(entries, ["un", "cx", null], "code")).toEqual(entries);
    expect(offered(entries, ["b"], "code")).toEqual([entries[0]]);
  });
});
