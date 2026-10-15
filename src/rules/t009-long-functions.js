module.exports = {
  id: "T009",
  name: "long-functions",
  description: "長すぎる関数",
  severity: "warning",
  defaultOptions: { max: 50 },

  check(context) {
    const { max } = context.options;

    function checkFunc(node, name) {
      const length = node.loc.end.line - node.loc.start.line;
      if (length > max) {
        context.report({
          node,
          message: `関数 '${name}' が${length}行もあるんだけど!? 分割しなさいよ`,
        });
      }
    }

    context.walkSimple({
      FunctionDeclaration(node) {
        checkFunc(node, node.id ? node.id.name : "<anonymous>");
      },
      FunctionExpression(node) {
        checkFunc(node, node.id ? node.id.name : "<anonymous>");
      },
      ArrowFunctionExpression(node) {
        checkFunc(node, "<arrow>");
      },
    });
  },
};
