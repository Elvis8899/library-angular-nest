const baseConf = require("./jest.config.js");
/** @type {import('jest').Config} */
const config = {
  ...baseConf,
  verbose: true,
  collectCoverage: true,
  bail: 1,
  testRegex: ".unit-spec.ts$",
  maxWorkers: 3,
  collectCoverageFrom: [
    "src/**/commands/**/*.command.ts",
    "src/**/domain/**/*.ts",
    "src/**/queries/**/*.query.ts",
  ],
  coverageThreshold: {
    "src/**/commands/**/*.command.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "src/**/domain/**/*.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "src/**/queries/**/*.query.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
module.exports = config;
