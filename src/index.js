const { lintFile, lintDirectory, lintSource } = require("./linter");
const { formatTerminal, formatJSON } = require("./formatter");
const personality = require("./personality");
const { rules } = require("./rules");

module.exports = {
  lintFile,
  lintDirectory,
  lintSource,
  formatTerminal,
  formatJSON,
  personality,
  rules,
};
