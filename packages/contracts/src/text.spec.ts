import { describe, expect, it } from "vitest";
import { collapseSpaces, textKey } from "./text.js";

describe("text", () => {
  it("Should collapse and trim spaces", () => {
    expect(collapseSpaces("  Dom \t Casmurro  ")).toBe("Dom Casmurro");
  });

  it("Should match texts without accents, case or extra spaces", () => {
    expect(textKey("  JOÃO   silva ")).toBe("joao silva");
    expect(textKey("Memórias Póstumas")).toBe(textKey("memorias postumas"));
  });
});
