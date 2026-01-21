const baseConf = require("./jest.config.js");
/** @type {import('jest').Config} */
const config = {
  ...baseConf,
  verbose: false,
};
module.exports = config;
