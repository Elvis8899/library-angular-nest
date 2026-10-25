import { textKey } from "@library/contracts";

export { textKey };

/** The values that contain what was typed, ignoring accents and case. */
export const matching = (
  values: readonly string[],
  typed: string
): string[] => {
  const key = textKey(typed);
  return values.filter(
    (value) => textKey(value).includes(key) && textKey(value) !== key
  );
};
