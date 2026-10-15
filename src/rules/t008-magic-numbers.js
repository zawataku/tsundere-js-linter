const COMPARISONS = new Set(["==", "===", "!=", "!==", "<", ">", "<=", ">="]);

// 比較式の片側が数値リテラル（負数を含む）ならその値を返す
function numericValue(node) {
  if (node.type === "Literal" && typeof node.value === "number") {
    return node.value;
  }
  if (
    node.type === "UnaryExpression" &&
    node.operator === "-" &&
    node.argument.type === "Literal" &&
    typeof node.argument.value === "number"
  ) {
    return -node.argument.value;
  }
  return null;
}

module.exports = {
  id: "T008",
  name: "magic-numbers",
  description: "マジックナンバー",
  severity: "info",
  defaultOptions: { allowed: [0, 1, 2, -1, 100, 0.5] },

  check(context) {
    const allowed = new Set(context.options.allowed);
    context.walkSimple({
      BinaryExpression(node) {
        if (!COMPARISONS.has(node.operator)) return;
        for (const side of [node.left, node.right]) {
          const value = numericValue(side);
          if (value !== null && !allowed.has(value)) {
            context.report({
              node: side,
              message: `マジックナンバー ${value} って何？定数に名前つけなさいよ`,
            });
          }
        }
      },
    });
  },
};
