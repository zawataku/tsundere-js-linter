const { isFunction } = require("../ast");

const NESTING_TYPES = new Set([
  "IfStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "WithStatement",
  "SwitchStatement",
  "TryStatement",
]);

const SKIP_KEYS = new Set(["type", "loc", "start", "end"]);

module.exports = {
  id: "T010",
  name: "nesting-depth",
  description: "ネストが深すぎる",
  severity: "warning",
  defaultOptions: { max: 4 },

  check(context) {
    const { max } = context.options;
    const reported = new Set();

    function visit(node, depth) {
      if (NESTING_TYPES.has(node.type)) {
        depth++;
        if (depth > max && !reported.has(node.loc.start.line)) {
          reported.add(node.loc.start.line);
          context.report({
            node,
            message: `ネストが${depth}段!? インデントの迷宮を作らないで`,
          });
        }
      }

      for (const key of Object.keys(node)) {
        if (SKIP_KEYS.has(key)) continue;
        const children = [].concat(node[key]);
        for (const child of children) {
          if (child && typeof child.type === "string") {
            // 関数の中はネストを数え直す
            visit(child, isFunction(child) ? 0 : depth);
          }
        }
      }
    }

    visit(context.ast, 0);
  },
};
