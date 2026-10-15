module.exports = {
  id: "T002",
  name: "max-line-length",
  description: "行の長さ超過",
  severity: "warning",
  defaultOptions: { max: 120 },

  check(context) {
    const { max } = context.options;
    context.sourceLines.forEach((rawLine, i) => {
      const line = rawLine.replace(/\r$/, "");
      if (line.length > max) {
        context.report({
          loc: { line: i + 1, column: max },
          message: `この行${line.length}文字もあるんだけど!? (${max}文字以内にしなさいよ)`,
        });
      }
    });
  },
};
