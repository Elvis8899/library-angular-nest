import { DOCUMENT } from "@angular/common";
import {
  APP_ID,
  CSP_NONCE,
  DebugElement,
  getDebugNode,
  inject,
  PLATFORM_ID,
  ɵSHARED_STYLES_HOST as SHARED_STYLES_HOST,
} from "@angular/core";
import { ɵSharedStylesHost as SharedStylesHost } from "@angular/platform-browser";
import { defineGlobalsInjections, Spectator } from "@openng/spectator";

// The spec files of a worker share one DOM (Angular's isolate: false), so
// what a test leaves behind reaches every later file.

// Spectator's factories turn TestBed's teardown off by default, so each test
// left its module behind: its styles in <head>, Material's overlay container
// in <body>, its subscriptions. Every spec then ran slower than the last,
// past Vitest's 5s timeout on CI's 4 CPUs
//
// The teardown also took each component's <style> out of <head>, and the
// next test put it back, so the test DOM parsed every stylesheet again in
// every test (a sixth of the suite's time under jsdom). This host adds each
// stylesheet once per worker and leaves it: a component's styles only match
// its own elements, and Material's are the same in every test.
const addedStyles = new Set<string>();
class WorkerStylesHost extends SharedStylesHost {
  override addStyles(styles: string[], urls?: string[]): void {
    for (const style of styles) {
      if (addedStyles.has(style)) continue;
      addedStyles.add(style);
      const element = document.createElement("style");
      element.textContent = style;
      document.head.appendChild(element);
    }
    super.addStyles([], urls);
  }
  override removeStyles(_styles: string[], urls?: string[]): void {
    super.removeStyles([], urls);
  }
}
defineGlobalsInjections({
  teardown: { destroyAfterEach: true },
  providers: [
    {
      provide: SHARED_STYLES_HOST,
      useFactory: () =>
        new WorkerStylesHost(
          inject(DOCUMENT),
          inject(APP_ID),
          inject(CSP_NONCE, { optional: true }),
          inject(PLATFORM_ID),
        ),
    },
  ],
});

// A login saved by one spec (sessionStorage comes first) was the next
// spec's current user
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Spectator looks a selector up (query, queryAll, click("…"), typeInElement,
// triggerEventHandler) by walking every DebugElement of the fixture and
// matching it against each, even to return the first one; on a screen with
// many fields that was most of a spec's time. A plain selector asks the DOM
// instead: the component's element first, then the document for what isn't
// under it (a menu's or a dialog's content in the overlay). A selector that
// matches nothing is answered by the document too, without the walk.
const domSpectator: {
  query(selector: unknown, options?: unknown): Element | null;
  queryAll(selector: unknown, options?: unknown): Element[];
  // What click, typeInElement and the other events look selectors up with
  getNativeElement(selector: unknown): unknown;
  // What triggerEventHandler looks selectors up with
  getDebugElement(selector: unknown, options?: unknown): DebugElement | null;
} = Object.getPrototypeOf(Spectator.prototype) as never;
const { query, queryAll, getNativeElement, getDebugElement } = domSpectator;
interface Queried {
  debugElement?: { nativeElement: Element };
}
const plainSelector = (
  spectator: Queried,
  selector: unknown,
  options?: unknown,
): { root: Element; selector: string } | null => {
  const root = spectator.debugElement?.nativeElement;
  return typeof selector === "string" && !options && root
    ? { root, selector }
    : null;
};
const queryDom = (root: Element, selector: string): Element | null =>
  root.querySelector(selector) ?? root.ownerDocument.querySelector(selector);
domSpectator.query = function (this: Queried, selector, options) {
  const plain = plainSelector(this, selector, options);
  return plain
    ? queryDom(plain.root, plain.selector)
    : query.call(this, selector, options);
};
domSpectator.queryAll = function (this: Queried, selector, options) {
  const plain = plainSelector(this, selector, options);
  if (!plain) return queryAll.call(this, selector, options);
  const found = plain.root.querySelectorAll(plain.selector);
  return Array.from(
    found.length
      ? found
      : plain.root.ownerDocument.querySelectorAll(plain.selector),
  );
};
domSpectator.getNativeElement = function (this: Queried, selector) {
  const plain = plainSelector(this, selector);
  return plain
    ? queryDom(plain.root, plain.selector)
    : getNativeElement.call(this, selector);
};
domSpectator.getDebugElement = function (this: Queried, selector, options) {
  const plain = plainSelector(this, selector, options);
  if (!plain) return getDebugElement.call(this, selector, options);
  const element = queryDom(plain.root, plain.selector);
  const debugNode = element && getDebugNode(element);
  return debugNode instanceof DebugElement ? debugNode : null;
};
