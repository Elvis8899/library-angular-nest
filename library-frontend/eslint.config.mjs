// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended  from 'eslint-plugin-prettier/recommended'
import prettierlint from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
   {
    // Everything in this config object targets our HTML files (both external template files,
    // AND inline templates thanks to the processor set in the TypeScript config above)
    files: ['**/*.html'],
    extends: [
      // Apply the recommended Angular template rules
      ...angular.configs.templateRecommended,
      // Apply the Angular template rules which focus on accessibility of our apps
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    // Everything in this config object targets our TypeScript files (Components, Directives, Pipes etc)
    files: ['**/*.ts'],
    extends: [
      // Apply the recommended core rules
      eslint.configs.recommended,
      // Apply the recommended TypeScript rules
      ...tseslint.configs.recommended,
      // Optionally apply stylistic rules from typescript-eslint that improve code consistency
      ...tseslint.configs.stylistic,
      // Apply the recommended Angular rules
      ...angular.configs.tsRecommended,
      //
      eslintPluginPrettierRecommended,
      prettierlint,
    ],
    // IMPORTANT: Set the custom processor to enable inline template linting
    // This allows your inline Component templates to be extracted and linted with the same
    // rules as your external .html template files
    processor: angular.processInlineTemplates,
    // Override specific rules for TypeScript files (these will take priority over the extended configs above)
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  // {
  //   files: ["**/*.ts"],
  //   languageOptions: {
  //     parserOptions: {
  //       project: "./tsconfig.json",
  //     },
  //   },
  //   extends: [
  //     eslint.configs.recommended,
  //     ...tseslint.configs.strict,
  //     ...tseslint.configs.stylistic,
  //     ...angular.configs.tsRecommended,
  //     // angular.configs.templateRecommended,
  //     eslintPluginPrettierRecommended,
  //     prettierlint,
  //   ],
  //   processor: angular.processInlineTemplates,
  //   rules: {
  //     "@angular-eslint/directive-selector": [
  //       "error",
  //       {
  //         type: "attribute",
  //         prefix: "app",
  //         style: "camelCase",
  //       },
  //     ],
  //     "@angular-eslint/component-selector": [
  //       "error",
  //       {
  //         type: "element",
  //         prefix: "app",
  //         style: "kebab-case",
  //       },
  //     ],
  //     "@angular-eslint/no-empty-lifecycle-method": "error",
  //     "max-len": [
  //       "error",
  //       {
  //         code: 200,
  //       },
  //     ],
  //     "no-console": [
  //       "error",
  //       {
  //         allow: ["warn", "error", "log"],
  //       },
  //     ],
  //     quotes: ["error", "double"],
  //     "@typescript-eslint/prefer-readonly": "error",
  //     "@typescript-eslint/no-non-null-assertion": "error",
  //     "@typescript-eslint/no-unused-vars": [
  //       "error",
  //       {
  //         args: "none",
  //       },
  //     ],
  //     "no-duplicate-imports": "error",
  //     "no-var": "error",
  //     "@angular-eslint/no-conflicting-lifecycle": "error",
  //     "@angular-eslint/no-output-native": "error",
  //     "@angular-eslint/no-inputs-metadata-property": "error",
  //     "@angular-eslint/no-outputs-metadata-property": "error",
  //     "@angular-eslint/no-input-rename": "error",
  //     "@angular-eslint/no-output-rename": "error",
  //     "@angular-eslint/use-lifecycle-interface": "error",
  //     "@angular-eslint/use-pipe-transform-interface": "error",
  //     "@angular-eslint/component-class-suffix": "error",
  //     "@angular-eslint/directive-class-suffix": "error",
  //     "@angular-eslint/contextual-lifecycle": "error",
  //     "no-empty-function": "off",
  //     "@typescript-eslint/no-empty-function": [
  //       "error",
  //       {
  //         allow: ["constructors"],
  //       },
  //     ],
  //     "@typescript-eslint/member-ordering": [
  //       "error",
  //       {
  //         default: [
  //           "public-static-field",
  //           "protected-static-field",
  //           "private-static-field",
  //           "public-instance-field",
  //           "protected-instance-field",
  //           "private-instance-field",
  //           "public-static-method",
  //           "protected-static-method",
  //           "private-static-method",
  //           "constructor",
  //           "public-instance-method",
  //           "protected-instance-method",
  //           "private-instance-method",
  //         ],
  //       },
  //     ],
  //     "@typescript-eslint/no-explicit-any": "off",
  //     "@typescript-eslint/naming-convention": [
  //       "error",
  //       {
  //         selector: "memberLike",
  //         modifiers: ["private"],
  //         format: ["camelCase"],
  //         leadingUnderscore: "require",
  //       },
  //       {
  //         selector: "enumMember",
  //         format: null,
  //       },
  //     ],
  //     "@typescript-eslint/explicit-member-accessibility": [
  //       "off",
  //       {
  //         accessibility: "no-public",
  //       },
  //     ],
  //     "@typescript-eslint/no-extraneous-class": "off",
  //   },
  // },
);
