/**
 * Rows pasted from a spreadsheet: one per line, cells split by tabs, each
 * trimmed; blank lines left out.
 */
export const pastedRows = (text: string): string[][] =>
  text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => line.split("\t").map((cell) => cell.trim()));
