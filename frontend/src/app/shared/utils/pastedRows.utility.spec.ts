import { pastedRows } from "@app/shared/utils/pastedRows.utility";

describe("pastedRows", () => {
  it("Should split lines and tabs, trimming cells and leaving blank lines out", () => {
    expect(pastedRows(" Dom Casmurro \t2\r\n\n  \nIracema\t\t1865")).toEqual([
      ["Dom Casmurro", "2"],
      ["Iracema", "", "1865"],
    ]);
  });
});
