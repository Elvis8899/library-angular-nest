import { describe, expect, it } from "vitest";
import * as contracts from "./index.js";

// The enums: exported objects whose values are all strings
const enums = Object.entries(contracts).filter(
  ([, value]) =>
    typeof value === "object" &&
    value !== null &&
    !("_zod" in value) &&
    Object.values(value).length > 0 &&
    Object.values(value).every((member) => typeof member === "string"),
);

describe("contracts", () => {
  it("Should export enums whose values are each used once", () => {
    expect(enums.length).toBeGreaterThan(0);
    for (const [name, members] of enums) {
      const values = Object.values(members as Record<string, string>);
      expect(new Set(values).size, name).toBe(values.length);
    }
  });
});
