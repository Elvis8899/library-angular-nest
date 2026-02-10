import { HumanizeSlugUtility } from "@app/shared/utils/humanize-slug.utility";

describe("humanize", () => {
  it("Should humanize a string", () => {
    const res = HumanizeSlugUtility.humanize("helloWorld", true);
    expect(res).toBe("Hello World");
  });

  it("Should humanize a string", () => {
    const res = HumanizeSlugUtility.humanize("hello_world");
    expect(res).toBe("Hello World");
  });

  it("Should humanize a string", () => {
    const res = HumanizeSlugUtility.humanize("hello-world");
    expect(res).toBe("Hello World");
  });

  it("Should return empty string", () => {
    const res = HumanizeSlugUtility.humanize("");
    expect(res).toBe("");
  });
});
describe("dehumanize", () => {
  it("Should dehumanize a string", () => {
    const res = HumanizeSlugUtility.deHumanize("Hello World");
    expect(res).toBe("hello_world");
  });
});
