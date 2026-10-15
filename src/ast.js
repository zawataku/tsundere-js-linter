const path = require("path");
const acorn = require("acorn");
const jsx = require("acorn-jsx");
const walk = require("acorn-walk");

const Parser = acorn.Parser.extend(jsx());

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

function isFunction(node) {
  return FUNCTION_TYPES.has(node.type);
}

// acorn-walk は JSX を知らないので、JSX ノードの辿り方を足したベースを使う
const ignore = () => {};
const base = {
  ...walk.base,
  JSXElement(node, st, c) {
    c(node.openingElement, st);
    for (const child of node.children) c(child, st);
  },
  JSXFragment(node, st, c) {
    for (const child of node.children) c(child, st);
  },
  JSXOpeningElement(node, st, c) {
    c(node.name, st);
    for (const attr of node.attributes) c(attr, st);
  },
  JSXAttribute(node, st, c) {
    if (node.value) c(node.value, st);
  },
  JSXSpreadAttribute(node, st, c) {
    c(node.argument, st, "Expression");
  },
  JSXExpressionContainer(node, st, c) {
    c(node.expression, st, "Expression");
  },
  JSXSpreadChild(node, st, c) {
    c(node.expression, st, "Expression");
  },
  JSXMemberExpression(node, st, c) {
    c(node.object, st);
  },
  JSXIdentifier: ignore,
  JSXNamespacedName: ignore,
  JSXEmptyExpression: ignore,
  JSXText: ignore,
};

function parseAs(source, sourceType) {
  const comments = [];
  const ast = Parser.parse(source, {
    ecmaVersion: "latest",
    sourceType,
    locations: true,
    allowReturnOutsideFunction: sourceType === "script",
    onComment: comments,
  });
  return { ast, comments };
}

/**
 * ソースをパースしてASTとコメント一覧を返す。失敗時はSyntaxErrorを投げる。
 * .mjs は ES モジュール、.cjs は CommonJS として読む。
 * それ以外は ES モジュールとして読み、失敗したら CommonJS として読み直す。
 */
function parse(source, filepath = "") {
  const ext = path.extname(filepath);
  if (ext === ".mjs") return parseAs(source, "module");
  if (ext === ".cjs") return parseAs(source, "script");
  try {
    return parseAs(source, "module");
  } catch (moduleError) {
    try {
      return parseAs(source, "script");
    } catch {
      throw moduleError;
    }
  }
}

module.exports = { parse, isFunction, walk, base };
