/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: ["js", "json", "ts"],
  bail: true,
  clearMocks: true,
  rootDir: "..",
  testEnvironment: "node",
  testRegex: "-spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  coveragePathIgnorePatterns: [
    "^<rootDir>/node_modules/",
    "^<rootDir>/src/configs",
    // "^<rootDir>/.*.dto.ts$",
  ],
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@user/(.*)$": "<rootDir>/src/modules/user/$1",
    "^@configs/(.*)$": "<rootDir>/src/configs/$1",
  },
  transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],
};
module.exports = config;
