const { isFunction } = require("../ast");

function nearestFunction(ancestors) {
  // ancestors の末尾は自分自身なので1つ手前から探す
  for (let i = ancestors.length - 2; i >= 0; i--) {
    if (isFunction(ancestors[i])) return ancestors[i];
  }
  return null;
}

module.exports = {
  id: "T016",
  name: "async-without-await",
  description: "`await` のない `async` 関数",
  severity: "info",
  defaultOptions: {},

  check(context) {
    const awaiting = new Set();
    const mark = (node, ancestors) => {
      const fn = nearestFunction(ancestors);
      if (fn) awaiting.add(fn);
    };

    context.walkAncestor({
      AwaitExpression: (node, _, ancestors) => mark(node, ancestors),
      ForOfStatement(node, _, ancestors) {
        if (node.await) mark(node, ancestors);
      },
    });

    const check = (node) => {
      if (!node.async || node.generator || awaiting.has(node)) return;
      const name = node.id ? `'${node.id.name}'` : "この関数";
      context.report({
        node,
        message: `${name} は async なのに await してないじゃない！async をつけた意味あるの？`,
      });
    };

    context.walkSimple({
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    });
  },
};
