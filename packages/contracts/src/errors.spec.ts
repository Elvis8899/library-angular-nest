import { describe, expect, it } from "vitest";
import { errorCodes } from "./errors.js";

describe("error codes", () => {
  it("Should list each code once, named <module>.<what>", () => {
    expect(new Set(errorCodes).size).toBe(errorCodes.length);
    expect(
      errorCodes.filter(
        (code) =>
          code !== "unknown" && !/^[a-z][a-zA-Z]*\.[a-z][a-zA-Z]*$/.test(code),
      ),
    ).toEqual([]);
  });
});
