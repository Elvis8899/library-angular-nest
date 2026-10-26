import {
  readPreference,
  writePreference,
} from "@app/shared/utils/preference.utility";
import { blockStorage } from "@app/shared/utils/test/storage";

describe("preference.utility", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("Should read back a choice remembered, or the fallback", () => {
    expect(readPreference("sort", ["a", "b"], "a")).toBe("a");
    writePreference("sort", "b");
    expect(readPreference("sort", ["a", "b"], "a")).toBe("b");
    // A value no longer offered
    writePreference("sort", "c");
    expect(readPreference("sort", ["a", "b"], "a")).toBe("a");
  });

  it("Should forget the choice when storage is blocked", () => {
    blockStorage();
    expect(() => writePreference("sort", "b")).not.toThrow();
    expect(readPreference("sort", ["a", "b"], "a")).toBe("a");
  });
});
