import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import {
  injectIsSmallScreen,
  smallScreenQuery,
} from "@app/shared/utils/smallScreen.utility";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@openng/spectator/vitest";
import { Subject } from "rxjs";

describe("injectIsSmallScreen", () => {
  let spectator: SpectatorInjectionContext;
  const states = new Subject<BreakpointState>();
  const breakpointObserverMock = { observe: vi.fn(() => states) };
  const createInjectionContext = createInjectionContextFactory({
    providers: [
      { provide: BreakpointObserver, useValue: breakpointObserverMock },
    ],
  });

  beforeEach(() => (spectator = createInjectionContext()));

  it("Should follow the small screen query", () => {
    // Arrange
    const isSmall = spectator.runInInjectionContext(injectIsSmallScreen);
    // Assert
    expect(breakpointObserverMock.observe).toHaveBeenCalledWith(
      smallScreenQuery,
    );
    expect(isSmall()).toBe(false);
    // Act
    states.next({ matches: true, breakpoints: {} });
    // Assert
    expect(isSmall()).toBe(true);
  });
});
