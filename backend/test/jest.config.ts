/** @jest-config-loader ts-node */
import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  bail: true,
  clearMocks: true,
  rootDir: "..",
  testEnvironment: "node",
  // One database per worker, copied from the test database (globalSetup.ts)
  globalSetup: "<rootDir>/test/globalSetup.ts",
  setupFiles: ["<rootDir>/test/util/useWorkerDatabase.ts"],
  // Each worker compiles the TypeScript again, so more workers than this
  // cost more than they save
  maxWorkers: "50%",
  testRegex: "-spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  coveragePathIgnorePatterns: [
    "^<rootDir>/node_modules/",
    "^<rootDir>/prisma/generated/",
    "^<rootDir>/src/configs",
    // "^<rootDir>/.*.dto.ts$",
  ],
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "^@shared/(.*)$": "<rootDir>/src/modules/shared/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@db/(.*)$": "<rootDir>/prisma/$1",
  },
  coverageReporters: ["json", "text-summary", "lcov", "clover", "json-summary"],
};
export default config;
