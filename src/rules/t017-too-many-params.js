module.exports = {
  id: "T017",
  name: "too-many-params",
  description: "引数が多すぎる関数",
  severity: "warning",
  defaultOptions: { max: 4 },

  check(context) {
    const { max } = context.options;
    const check = (node) => {
      if (node.params.length > max) {
        context.report({
          node,
          message: `引数が${node.params.length}個もあるんだけど!? オブジェクトにまとめなさいよ`,
        });
      }
    };

    context.walkSimple({
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    });
  },
};
