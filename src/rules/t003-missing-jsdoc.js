module.exports = {
  id: "T003",
  name: "missing-jsdoc",
  description: "JSDocがない関数/クラス",
  severity: "info",
  defaultOptions: {},

  check(context) {
    const { source, comments } = context;

    // 直前のコメントが /** */ で、間に空白か export しかなければJSDocありとみなす
    function hasJSDocBefore(node) {
      let prev = null;
      for (const comment of comments) {
        if (comment.end > node.start) break;
        prev = comment;
      }
      if (!prev || prev.type !== "Block" || !prev.value.startsWith("*")) {
        return false;
      }
      const between = source.slice(prev.end, node.start).trim();
      return between === "" || /^export(\s+default)?$/.test(between);
    }

    context.walkSimple({
      FunctionDeclaration(node) {
        if (node.id && !node.id.name.startsWith("_") && !hasJSDocBefore(node)) {
          context.report({
            node,
            message: `関数 '${node.id.name}' にJSDocがないんだけど？説明くらい書きなさいよ`,
          });
        }
      },
      ClassDeclaration(node) {
        if (node.id && !hasJSDocBefore(node)) {
          context.report({
            node,
            message: `クラス '${node.id.name}' にJSDocがないんだけど？説明くらい書きなさいよ`,
          });
        }
      },
    });
  },
};
