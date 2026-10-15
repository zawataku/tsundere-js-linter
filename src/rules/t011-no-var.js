module.exports = {
  id: "T011",
  name: "no-var",
  description: "`var` の使用（`let` / `const` を使うべき）",
  severity: "warning",
  defaultOptions: {},

  check(context) {
    context.walkSimple({
      VariableDeclaration(node) {
        if (node.kind === "var") {
          context.report({
            node,
            message: "`var` なんていつの時代よ！`let` か `const` を使いなさい！",
          });
        }
      },
    });
  },
};
