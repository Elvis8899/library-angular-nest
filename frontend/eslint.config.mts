import eslint from "@eslint/js";
import angular from "angular-eslint";
import checkFile from "eslint-plugin-check-file";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    // Templates: the .html files and, through the processor below, inline ones
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
      // Includes eslint-config-prettier
      eslintPluginPrettierRecommended,
    ],
    // Lints inline templates with the .html files' rules
    processor: angular.processInlineTemplates,
    rules: {
      "no-console": ["error"],
      // `() => this.saved.emit()` and the like: a shorthand arrow that
      // returns a void call is how callbacks are written
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
      // Trusts that every index exists (no noUncheckedIndexedAccess here, as
      // the backend has), so it calls needed guards on rows[i] unnecessary
      "@typescript-eslint/no-unnecessary-condition": "off",
      // Assertions are allowed here, `as` and `!` alike (the backend allows
      // neither): a validated form's required values are still typed nullable
      "@typescript-eslint/no-non-null-assertion": "off",
      // `text.trim() || null`: an empty text means none
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true } },
      ],
      // Its rewrite of `x === null || x.y === null` (`x?.y === null`) is false
      // for a null x
      "@typescript-eslint/prefer-optional-chain": "off",
      // Components and directives can be empty classes: their decorator is
      // what they are
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowWithDecorator: true },
      ],
      // Angular's own API: output<void>(), Subject<void>
      "@typescript-eslint/no-invalid-void-type": "off",
      // Angular's validators (Validators.required) are static functions meant
      // to be passed around, and specs pass spied methods to expect()
      "@typescript-eslint/unbound-method": "off",
      // Specs reach private members with obj["member"], which TypeScript allows
      "@typescript-eslint/dot-notation": [
        "error",
        {
          allowPrivateClassPropertyAccess: true,
          allowProtectedClassPropertyAccess: true,
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./", "../"],
              message: "Relative imports are not allowed.",
            },
          ],
        },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "LabeledStatement",
          message:
            "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
        },
        {
          selector: "WithStatement",
          message:
            "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
        },
        {
          selector: "MethodDefinition[kind='set']",
          message: "Property setters are not allowed",
        },
      ],
    },
  },
  {
    files: ["**/*.spec.ts", "src/app/shared/utils/test/**/*.ts"],
    rules: {
      // Vitest's asymmetric matchers (expect.objectContaining…) and the calls
      // spies record are `any`
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
  {
    // Files and folders are named in camelCase; suffixes like .component or
    // .spec are ignored. Translation files keep their locale codes (en-US).
    files: ["src/**/*.ts", "src/**/*.html"],
    ignores: ["src/app/shared/i18n/translations/*-*.ts"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.{ts,html}": "CAMEL_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/**/": "CAMEL_CASE" },
      ],
    },
  },
);
