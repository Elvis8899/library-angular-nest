import { computed, effect, Signal } from "@angular/core";

/**
 * A blob's object URL, for an `<img>` (a picked file, a file the API sent),
 * or none without one. Each URL is freed when the blob changes and when the
 * component goes. Call it in an injection context.
 */
export const objectUrlOf = (
  blob: Signal<Blob | null>,
): Signal<string | null> => {
  const url = computed(() => {
    const current = blob();
    return current ? URL.createObjectURL(current) : null;
  });
  effect((onCleanup) => {
    const current = url();
    if (current) onCleanup(() => URL.revokeObjectURL(current));
  });
  return url;
};
