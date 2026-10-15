const METHODS = new Set(["log", "debug", "info", "warn"]);

module.exports = {
  id: "T007",
  name: "console-log",
  description: "`console.log()` 等の使用（ロガーを使うべき）",
  severity: "info",
  defaultOptions: {},

  check(context) {
    context.walkSimple({
      CallExpression(node) {
        const { callee } = node;
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "console" &&
          callee.property.type === "Identifier" &&
          METHODS.has(callee.property.name)
        ) {
          context.report({
            node,
            message: `console.${callee.property.name}()使ってるの？本番コードならちゃんとしたロガーを使いなさいよ`,
          });
        }
      },
    });
  },
};
