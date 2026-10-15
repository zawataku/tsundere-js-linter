function isNull(node) {
  return node.type === "Literal" && node.value === null;
}

module.exports = {
  id: "T006",
  name: "loose-equality",
  description: "`==` / `!=` の使用（`===` / `!==` を使うべき）",
  severity: "error",
  defaultOptions: {},

  check(context) {
    context.walkSimple({
      BinaryExpression(node) {
        if (node.operator !== "==" && node.operator !== "!=") return;
        if (isNull(node.left) || isNull(node.right)) return;

        const strict = `${node.operator}=`;
        context.report({
          node,
          message: `\`${node.operator}\` じゃなくて \`${strict}\` を使いなさいよ！型の比較を曖昧にしないで`,
        });
      },
    });
  },
};
