// コメント各行の先頭（ブロックコメントの " * " は除く）にあるタグだけを拾う
const PATTERN = /^[\s*]*(TODO|FIXME|HACK|XXX)\b/i;

module.exports = {
  id: "T004",
  name: "todo-comments",
  description: "TODO / FIXME / HACK / XXX コメント",
  severity: "warning",
  defaultOptions: {},

  check(context) {
    for (const comment of context.comments) {
      const lines = comment.value.split("\n");
      lines.forEach((line, i) => {
        const match = line.match(PATTERN);
        if (!match) return;
        context.report({
          loc: {
            line: comment.loc.start.line + i,
            column: i === 0 ? comment.loc.start.column : 0,
          },
          message: `'${match[1].toUpperCase()}' って書いてあるけど、いつ直すつもり？放置しないでよね`,
        });
      });
    }
  },
};
