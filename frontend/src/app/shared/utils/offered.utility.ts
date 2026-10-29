/** What a picker offers: the active entries, plus those already chosen,
 * which stay though deactivated since. `kept` holds their `key` (the id
 * unless named). */
export const offered = <
  T extends { active: boolean } & Record<K, string>,
  K extends string = "id",
>(
  entries: readonly T[],
  kept: string | null | readonly (string | null)[],
  key: K = "id" as K,
): T[] => {
  const keep = typeof kept === "string" || kept === null ? [kept] : kept;
  return entries.filter((entry) => entry.active || keep.includes(entry[key]));
};
