import {
  injectListLimit,
  provideListLimit,
} from "@app/shared/utils/listLimit.utility";
import { createInjectionContextFactory } from "@openng/spectator/vitest";

describe("injectListLimit", () => {
  const createInjectionContext = createInjectionContextFactory({
    providers: [],
  });

  it("Should keep the list's own limit", () => {
    expect(
      createInjectionContext().runInInjectionContext(() =>
        injectListLimit(200),
      ),
    ).toBe(200);
  });
});

describe("provideListLimit", () => {
  const createInjectionContext = createInjectionContextFactory({
    providers: [provideListLimit(3)],
  });

  it("Should lower every list's limit", () => {
    expect(
      createInjectionContext().runInInjectionContext(() =>
        injectListLimit(200),
      ),
    ).toBe(3);
  });
});
