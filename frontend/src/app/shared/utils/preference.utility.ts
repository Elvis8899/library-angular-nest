/**
 * A choice remembered in this browser (a list's sort), for the user: one
 * of `allowed`, or `fallback` when none is stored or storage is blocked.
 */
export const readPreference = <T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T => {
  try {
    const stored = localStorage.getItem(key);
    return allowed.find((value) => value === stored) ?? fallback;
  } catch {
    return fallback;
  }
};

/** Remembers a choice; blocked storage only forgets it. */
export const writePreference = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered
  }
};
