const TERMINATORS = new Set([
  "ReturnStatement",
  "ThrowStatement",
  "BreakStatement",
  "ContinueStatement",
]);

// 巻き上げられる関数宣言と空文は到達しなくても実害がない
const HARMLESS = new Set(["FunctionDeclaration", "EmptyStatement"]);

const KEYWORDS = {
  ReturnStatement: "return",
  ThrowStatement: "throw",
  BreakStatement: "break",
  ContinueStatement: "continue",
};

module.exports = {
  id: "T015",
  name: "unreachable-code",
  description: "`return` / `throw` などの後の到達不能コード",
  severity: "warning",
  defaultOptions: {},

  check(context) {
    function checkList(statements) {
      const index = statements.findIndex((s) => TERMINATORS.has(s.type));
      if (index === -1) return;
      const dead = statements
        .slice(index + 1)
        .find((s) => !HARMLESS.has(s.type));
      if (dead) {
        const keyword = KEYWORDS[statements[index].type];
        context.report({
          node: dead,
          message: `\`${keyword}\` の後のコードは絶対に実行されないわよ？何がしたいの？`,
        });
      }
    }

    context.walkSimple({
      BlockStatement: (node) => checkList(node.body),
      StaticBlock: (node) => checkList(node.body),
      SwitchCase: (node) => checkList(node.consequent),
    });
  },
};
