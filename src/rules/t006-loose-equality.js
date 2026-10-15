const acorn = require("acorn");

function isNull(node) {
  return node.type === "Literal" && node.value === null;
}

function isTypeof(node) {
  return node.type === "UnaryExpression" && node.operator === "typeof";
}

function isStringLiteral(node) {
  return node.type === "Literal" && typeof node.value === "string";
}

// `===` にしても意味が変わらない比較だけ自動修正する
function isSafeToFix(node) {
  const { left, right } = node;
  if (isTypeof(left) && isStringLiteral(right)) return true;
  if (isStringLiteral(left) && isTypeof(right)) return true;
  return (
    left.type === "Literal" &&
    right.type === "Literal" &&
    !left.regex &&
    !right.regex &&
    typeof left.value === typeof right.value
  );
}

// 左右の間（括弧やコメントを含みうる）から演算子トークンの位置を探す
function operatorRange(source, node) {
  const offset = node.left.end;
  const between = source.slice(offset, node.right.start);
  for (const token of acorn.tokenizer(between, { ecmaVersion: "latest" })) {
    if (token.value === node.operator) {
      return [offset + token.start, offset + token.end];
    }
  }
  return null;
}

module.exports = {
  id: "T006",
  name: "loose-equality",
  description: "`==` / `!=` の使用（`===` / `!==` を使うべき）",
  severity: "error",
  fixable: true,
  defaultOptions: {},

  check(context) {
    context.walkSimple({
      BinaryExpression(node) {
        if (node.operator !== "==" && node.operator !== "!=") return;
        if (isNull(node.left) || isNull(node.right)) return;

        const strict = `${node.operator}=`;
        const range = isSafeToFix(node) ? operatorRange(context.source, node) : null;
        context.report({
          node,
          message: `\`${node.operator}\` じゃなくて \`${strict}\` を使いなさいよ！型の比較を曖昧にしないで`,
          fix: range ? { range, text: strict } : undefined,
        });
      },
    });
  },
};
