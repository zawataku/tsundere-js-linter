module.exports = {
  id: "T012",
  name: "no-debugger",
  description: "`debugger` 文の消し忘れ",
  severity: "error",
  defaultOptions: {},

  check(context) {
    context.walkSimple({
      DebuggerStatement(node) {
        context.report({
          node,
          message: "`debugger` が残ってるじゃない！本番に持ち込む気!?",
        });
      },
    });
  },
};
