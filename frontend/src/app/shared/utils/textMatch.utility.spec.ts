import { matching, textKey } from "@app/shared/utils/textMatch.utility";

describe("textMatch.utility", () => {
  it("Should match texts without accents, case or extra spaces", () => {
    expect(textKey("  JOÃO   silva ")).toBe("joao silva");
  });

  it("Should suggest the values containing what was typed, but not itself", () => {
    const values = ["Ajudante", "Operador", "Operador de serra", "Pião"];
    expect(matching(values, "")).toEqual(values);
    expect(matching(values, "OPERA")).toEqual([
      "Operador",
      "Operador de serra",
    ]);
    expect(matching(values, "operador")).toEqual(["Operador de serra"]);
    expect(matching(values, "pia")).toEqual(["Pião"]);
  });
});
