module.exports = {
  id: "T005",
  name: "empty-catch",
  description: "空のcatchブロック",
  severity: "error",
  defaultOptions: {},

  check(context) {
    context.walkSimple({
      TryStatement(node) {
        if (node.handler && node.handler.body.body.length === 0) {
          context.report({
            node: node.handler,
            message: "空のcatchブロックとか最悪！ちゃんとエラー処理を書きなさい",
          });
        }
      },
    });
  },
};
