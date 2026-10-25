// Text rules both apps apply, without Zod

/** Spaces collapsed and trimmed. */
export const collapseSpaces = (text: string): string =>
  text.replace(/\s+/g, " ").trim();

/** What two texts share to match: no accents, case or extra spaces
 * ("  JOÃO   silva " is "joao silva"). */
export const textKey = (text: string): string =>
  collapseSpaces(text.normalize("NFD").replace(/\p{M}/gu, "")).toLowerCase();
