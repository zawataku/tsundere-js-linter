// const x = require("x") / const { a, b: c } = require("x") の形か
function isRequireCall(node) {
  return (
    node &&
    node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === "require" &&
    node.arguments.length === 1 &&
    node.arguments[0].type === "Literal" &&
    typeof node.arguments[0].value === "string"
  );
}

// パターンから束縛される識別子を集める（分割代入にも対応）
function collectBindings(pattern, out) {
  if (!pattern) return out;
  switch (pattern.type) {
    case "Identifier":
      out.push(pattern);
      break;
    case "ObjectPattern":
      for (const prop of pattern.properties) {
        collectBindings(prop.type === "RestElement" ? prop.argument : prop.value, out);
      }
      break;
    case "ArrayPattern":
      for (const el of pattern.elements) collectBindings(el, out);
      break;
    case "RestElement":
      collectBindings(pattern.argument, out);
      break;
    case "AssignmentPattern":
      collectBindings(pattern.left, out);
      break;
  }
  return out;
}

module.exports = {
  id: "T001",
  name: "unused-imports",
  description: "未使用のimport / require",
  severity: "warning",
  defaultOptions: {},

  check(context) {
    const imports = [];
    const importRanges = [];

    context.walkSimple({
      ImportDeclaration(node) {
        importRanges.push({ start: node.start, end: node.end });
        for (const spec of node.specifiers) {
          imports.push({ name: spec.local.name, node: spec });
        }
      },
    });

    // トップレベルの require だけを対象にする
    for (const stmt of context.ast.body) {
      if (stmt.type !== "VariableDeclaration") continue;
      for (const decl of stmt.declarations) {
        if (!isRequireCall(decl.init)) continue;
        for (const id of collectBindings(decl.id, [])) {
          imports.push({ name: id.name, node: id });
        }
      }
    }

    if (imports.length === 0) return;

    // 宣言側の識別子は Identifier としては訪問されないので、残りはすべて参照
    const importedNames = new Set(imports.map((i) => i.name));
    const usedNames = new Set();
    context.walkSimple({
      Identifier(node) {
        if (!importedNames.has(node.name)) return;
        const inImport = importRanges.some(
          (r) => node.start >= r.start && node.end <= r.end
        );
        if (!inImport) usedNames.add(node.name);
      },
      // export { x } の x は acorn-walk が訪問しないので別に拾う
      ExportNamedDeclaration(node) {
        if (node.source) return;
        for (const spec of node.specifiers) usedNames.add(spec.local.name);
      },
    });

    for (const imp of imports) {
      if (!usedNames.has(imp.name)) {
        context.report({
          node: imp.node,
          message: `'${imp.name}' をインポートしてるけど使ってないじゃない！`,
        });
      }
    }
  },
};
