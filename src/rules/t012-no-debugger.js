const { removeNodeFix } = require("../fixer");

// 文のリストの中にある debugger なら消しても構文が壊れない
// （`if (x) debugger;` の debugger を消すと次の文が if の中に入ってしまう）
const STATEMENT_LISTS = new Set([
  "Program",
  "BlockStatement",
  "StaticBlock",
  "SwitchCase",
]);

module.exports = {
  id: "T012",
  name: "no-debugger",
  description: "`debugger` 文の消し忘れ",
  severity: "error",
  fixable: true,
  defaultOptions: {},

  check(context) {
    context.walkAncestor({
      DebuggerStatement(node, _, ancestors) {
        const parent = ancestors[ancestors.length - 2];
        context.report({
          node,
          message: "`debugger` が残ってるじゃない！本番に持ち込む気!?",
          fix: STATEMENT_LISTS.has(parent.type)
            ? removeNodeFix(context.source, node)
            : undefined,
        });
      },
    });
  },
};
