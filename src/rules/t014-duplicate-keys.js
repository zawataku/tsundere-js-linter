// 計算されないキーの名前を返す。計算プロパティなら null
function keyName(prop) {
  if (prop.computed) return null;
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "Literal") return String(prop.key.value);
  return null;
}

module.exports = {
  id: "T014",
  name: "duplicate-keys",
  description: "オブジェクトリテラルのキー重複",
  severity: "error",
  defaultOptions: {},

  check(context) {
    context.walkSimple({
      ObjectExpression(node) {
        const seen = new Map(); // name -> Set(kind)
        for (const prop of node.properties) {
          if (prop.type !== "Property") continue;
          const name = keyName(prop);
          if (name === null || name === "__proto__") continue;

          const kinds = seen.get(name) || new Set();
          // getter と setter のペアだけは重複してよい
          const ok =
            kinds.size === 0 ||
            (prop.kind !== "init" && !kinds.has("init") && !kinds.has(prop.kind));
          if (!ok) {
            context.report({
              node: prop,
              message: `キー '${name}' が重複してるじゃない！前の値が上書きされちゃうわよ`,
            });
          }
          kinds.add(prop.kind);
          seen.set(name, kinds);
        }
      },
    });
  },
};
