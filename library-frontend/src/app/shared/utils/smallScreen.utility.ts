import { BreakpointObserver } from "@angular/cdk/layout";
import { inject, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";

// Phones and narrow windows. The stylesheets use the same width:
// `@media (width < 768px)`.
export const smallScreenQuery = "(width < 768px)";

/** Whether the window is narrower than 768px, following resizes. */
export function injectIsSmallScreen(): Signal<boolean> {
  return toSignal(
    inject(BreakpointObserver)
      .observe(smallScreenQuery)
      .pipe(map((state) => state.matches)),
    { initialValue: false }
  );
}
