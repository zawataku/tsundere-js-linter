const acorn = require("acorn");
const walk = require("acorn-walk");

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

function isFunction(node) {
  return FUNCTION_TYPES.has(node.type);
}

/**
 * ソースをパースしてASTとコメント一覧を返す。失敗時はSyntaxErrorを投げる。
 */
function parse(source) {
  const comments = [];
  const ast = acorn.parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
    locations: true,
    onComment: comments,
  });
  return { ast, comments };
}

module.exports = { parse, isFunction, walk, base: walk.base };
