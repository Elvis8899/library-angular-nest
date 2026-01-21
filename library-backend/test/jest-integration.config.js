const baseConf = require("./jest.config.js");
/** @type {import('jest').Config} */
const config = {
  ...baseConf,
  verbose: true,
  collectCoverage: true,
  testRegex: ".inte-spec.ts$",
  collectCoverageFrom: ["src/**/database/real*.ts"],
  coverageThreshold: {
    "src/**/database/real*.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
module.exports = config;
