import { enUS } from "@app/shared/i18n/translations/en-US";
import { enUSPages } from "@app/shared/i18n/translations/pages.en-US";
import { ptBRPages } from "@app/shared/i18n/translations/pages.pt-BR";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import { errorCodes } from "@library/contracts";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Keys from TypeScript are checked by the compiler (TranslationKey, t()).
// Templates aren't, so this reads them, and the code too, to find keys that
// don't exist and keys nothing uses.

interface Tree {
  [key: string]: string | Tree;
}

const keysOf = (tree: Tree, prefix = ""): string[] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [prefix + key]
      : keysOf(value, `${prefix}${key}.`)
  );

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return path.endsWith(join("i18n", "translations"))
        ? []
        : sourceFiles(path);
    }
    const isSource = /\.(html|ts)$/.test(entry.name);
    return isSource && !entry.name.endsWith(".spec.ts") ? [path] : [];
  });

const keys = keysOf({ ...ptBR, ...ptBRPages });
const namespaces = [...Object.keys(ptBR), ...Object.keys(ptBRPages)].join("|");
// A quoted string starting with a namespace: "common.cancel", 'nav.users'
const keyPattern = new RegExp(
  `["'\`]((?:${namespaces})(?:\\.\\w+)+)["'\`]`,
  "g"
);

const keysIn = (file: string) =>
  [...readFileSync(file, "utf8").matchAll(keyPattern)].map((match) => match[1]);

const usedKeys = new Set(sourceFiles("src/app").flatMap(keysIn));

// What shows outside the layout's pages, before the pages' texts are loaded
const outsidePages = [
  "src/app/app.component.html",
  "src/app/app.component.ts",
  "src/app/app.config.ts",
  ...sourceFiles("src/app/layouts"),
  ...sourceFiles("src/app/pages/auth"),
  ...sourceFiles("src/app/services"),
  ...sourceFiles("src/app/shared/interceptors"),
  ...sourceFiles("src/app/shared/i18n"),
].filter((file) => existsSync(file));

// errors.unknown is both the API's code for what it didn't expect and the
// interceptor's own, for errors without a body
const apiErrorKeys = keys.filter((key) => key.startsWith("errors."));

describe("Translation keys", () => {
  it("Should find the templates and the code", () => {
    expect(usedKeys.size).toBeGreaterThan(50);
  });

  it("Should only use keys that exist", () => {
    expect([...usedKeys].filter((key) => !keys.includes(key))).toEqual([]);
  });

  it("Should use every key", () => {
    // errors.<code> keys are built from the API's codes, checked below
    const unused = keys.filter(
      (key) => !usedKeys.has(key) && !apiErrorKeys.includes(key)
    );
    expect(unused).toEqual([]);
  });

  it("Should translate every API error code, and only those", () => {
    expect([...apiErrorKeys].sort()).toEqual(
      errorCodes.map((code) => `errors.${code}`).sort()
    );
  });

  it("Should have the same keys in every language", () => {
    expect(keysOf({ ...enUS, ...enUSPages })).toEqual(keys);
  });

  it("Should keep each namespace in one part", () => {
    expect(
      Object.keys(ptBRPages).filter((namespace) => namespace in ptBR)
    ).toEqual([]);
  });

  it("Should find the core's texts outside the pages", () => {
    const pageNamespaces = Object.keys(ptBRPages);
    const pageKeys = outsidePages.flatMap((file) =>
      keysIn(file)
        .filter((key) => pageNamespaces.includes(key.split(".")[0]))
        .map((key) => `${file}: ${key}`)
    );
    expect(outsidePages.length).toBeGreaterThan(10);
    expect(pageKeys).toEqual([]);
  });
});
