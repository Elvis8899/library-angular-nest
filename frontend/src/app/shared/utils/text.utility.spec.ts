import { textOf } from "@app/shared/utils/text.utility";

describe("text.utility", () => {
  it("Should write a value as String() does, and none as empty", () => {
    expect([textOf("a"), textOf(1.5), textOf(true)]).toEqual([
      "a",
      "1.5",
      "true",
    ]);
    expect([textOf(null), textOf(undefined)]).toEqual(["", ""]);
  });
});
