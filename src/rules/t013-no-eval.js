function isGlobalCall(node, name) {
  return node.callee.type === "Identifier" && node.callee.name === name;
}

module.exports = {
  id: "T013",
  name: "no-eval",
  description: "`eval()` / `new Function()` の使用",
  severity: "error",
  defaultOptions: {},

  check(context) {
    const report = (node, what) =>
      context.report({
        node,
        message: `${what} とか危ないじゃない！…べ、別にあんたのことが心配なわけじゃないけど`,
      });

    context.walkSimple({
      CallExpression(node) {
        if (isGlobalCall(node, "eval")) report(node, "`eval()`");
        if (isGlobalCall(node, "Function")) report(node, "`Function()`");
      },
      NewExpression(node) {
        if (isGlobalCall(node, "Function")) report(node, "`new Function()`");
      },
    });
  },
};
