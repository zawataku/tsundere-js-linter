module.exports = {
  id: "T018",
  name: "trailing-spaces",
  description: "行末の空白",
  severity: "info",
  fixable: true,
  defaultOptions: {},

  check(context) {
    // テンプレートリテラルの中の空白は値の一部なので触らない
    const templates = [];
    context.walkSimple({
      TemplateElement(node) {
        templates.push([node.start, node.end]);
      },
    });
    const inTemplate = (pos) => templates.some(([s, e]) => pos >= s && pos < e);

    let offset = 0;
    context.sourceLines.forEach((rawLine, i) => {
      const lineStart = offset;
      offset += rawLine.length + 1;

      const match = rawLine.match(/[ \t]+(?=\r?$)/);
      if (!match) return;
      const start = lineStart + match.index;
      if (inTemplate(start)) return;

      context.report({
        loc: { line: i + 1, column: match.index },
        message: "行末に空白が残ってるわよ。…見えないところも気をつけなさいよね",
        fix: { range: [start, start + match[0].length], text: "" },
      });
    });
  },
};
