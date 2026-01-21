const baseConf = require("./jest.config.js");
/** @type {import('jest').Config} */
const config = {
  ...baseConf,
  verbose: true,
  collectCoverage: true,
  testRegex: ".e2e-spec.ts$",
  collectCoverageFrom: ["src/**/*controller.ts"],
  coverageThreshold: {
    "src/**/*controller.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
module.exports = config;
