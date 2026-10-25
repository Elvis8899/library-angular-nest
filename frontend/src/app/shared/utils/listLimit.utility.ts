import { inject, InjectionToken, Provider } from "@angular/core";

// Specs lower it, so checking a long list's limit doesn't draw hundreds of
// rows
const LIST_LIMIT = new InjectionToken<number>("LIST_LIMIT");

/** How many rows a long list draws before its "showing N of M" note: `max`,
 * unless a spec provided a lower one. */
export const injectListLimit = (max: number): number =>
  inject(LIST_LIMIT, { optional: true }) ?? max;

/** In a spec: every long list draws at most `max` rows. */
export const provideListLimit = (max: number): Provider => ({
  provide: LIST_LIMIT,
  useValue: max,
});
