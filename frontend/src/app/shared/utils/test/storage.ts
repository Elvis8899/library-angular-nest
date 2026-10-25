/**
 * Makes `localStorage` refuse every read and write, as a browser that
 * blocks it does, until `vi.unstubAllGlobals()` (in the spec's afterEach).
 * happy-dom's storage can't be spied on: it binds its methods to the
 * instance, and a restored spy stays, refusing in every later spec.
 */
export const blockStorage = () => {
  const refuse = () => {
    throw new DOMException("Storage is blocked", "SecurityError");
  };
  vi.stubGlobal("localStorage", {
    length: 0,
    key: refuse,
    getItem: refuse,
    setItem: refuse,
    removeItem: refuse,
    clear: refuse,
  });
};
