const { lintFile, lintDirectory, lintSource } = require("./linter");
const { formatTerminal, formatJSON } = require("./formatter");
const personality = require("./personality");

module.exports = {
  lintFile,
  lintDirectory,
  lintSource,
  formatTerminal,
  formatJSON,
  personality,
};
