import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslint from "@eslint/js";
import prettierlint from "eslint-config-prettier";
import checkFile from "eslint-plugin-check-file";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const relativeImports = [
  { group: ["./", "../"], message: "Relative imports are not allowed." },
];
// Commands and queries name what they answer, and the decorators check
// their handlers against it
const nestCqrs = [
  {
    name: "@nestjs/cqrs",
    message: "Import from @shared/utils/application/cqrs.",
  },
];
// Subscribers name a domain event, and the decorator checks the payload they
// take against it
const nestEventEmitter = [
  {
    name: "@nestjs/event-emitter",
    message: "Subscribe with @shared/domainEventPublisher/onDomainEvent.",
  },
];

export default defineConfig(
  // Written by prisma generate; an object with only ignores applies to all
  { ignores: ["prisma/generated/**"] },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    ignores: ["coverage/**"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      prettierlint,
      comments.recommended,
      eslintPluginPrettierRecommended,
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: relativeImports,
          paths: [...nestCqrs, ...nestEventEmitter],
        },
      ],
      "no-console": "error",
      "@typescript-eslint/no-unsafe-member-access": [
        "error",
        { allowOptionalChaining: true },
      ],
      // Casts go through FPF.unsafeCoerce, which makes them easy to spot;
      // `as const` is still allowed
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      "@eslint-community/eslint-comments/require-description": [
        "error",
        { ignore: [] },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-extraneous-class": "off",
      // `text.trim() || null`: an empty text means none
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true } },
      ],
      // Its rewrite of `x === null || x.y === null` (`x?.y === null`) is false
      // for a null x
      "@typescript-eslint/prefer-optional-chain": "off",
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
    // disable type-aware rules on subset of files
    files: ["**/*.{js,mjs,d.ts}"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Files and folders are named in camelCase; suffixes like .command or
    // .unit-spec are ignored.
    files: ["src/**/*.ts", "test/**/*.ts", "prisma/**/*.ts", "scripts/**/*.ts"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.ts": "CAMEL_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/**/": "CAMEL_CASE",
          "test/**/": "CAMEL_CASE",
          "prisma/**/": "CAMEL_CASE",
          "scripts/**/": "CAMEL_CASE",
        },
      ],
    },
  },
  {
    // The files that wrap @nestjs/cqrs and @nestjs/event-emitter
    files: [
      "src/modules/shared/utils/application/cqrs.ts",
      "src/modules/shared/domainEventPublisher/*.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", { patterns: relativeImports }],
    },
  },
  {
    // The seed and the scripts are command-line tools: they report progress
    files: ["prisma/seed.ts", "scripts/**/*.ts"],
    rules: { "no-console": "off" },
  },
);
