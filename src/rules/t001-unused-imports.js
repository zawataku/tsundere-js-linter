module.exports = {
  id: "T001",
  name: "unused-imports",
  description: "未使用のimport",
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

    if (imports.length === 0) return;

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
