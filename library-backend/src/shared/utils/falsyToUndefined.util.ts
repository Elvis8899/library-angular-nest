export function falsyToUndefined<U = unknown>(x: U) {
  return x ?? undefined;
}
