/**
 * 指摘に付いた fix ({ range: [start, end], text }) をソースに適用する。
 * 範囲が重なる修正は後回しにして、次のパスで改めて適用する。
 * @returns {{ output: string, applied: number }}
 */
function applyFixes(source, issues) {
  const fixes = issues
    .filter((i) => i.fix)
    .map((i) => i.fix)
    .sort((a, b) => a.range[0] - b.range[0] || a.range[1] - b.range[1]);

  let output = "";
  let cursor = 0;
  let applied = 0;
  for (const { range, text } of fixes) {
    const [start, end] = range;
    if (start < cursor) continue;
    output += source.slice(cursor, start) + text;
    cursor = end;
    applied++;
  }
  output += source.slice(cursor);
  return { output, applied };
}

/**
 * node の範囲を消す fix を作る。その行に他に何もなければ行ごと消す。
 */
function removeNodeFix(source, node) {
  const lineStart = source.lastIndexOf("\n", node.start - 1) + 1;
  let lineEnd = source.indexOf("\n", node.end);
  if (lineEnd === -1) lineEnd = source.length;

  const before = source.slice(lineStart, node.start);
  const after = source.slice(node.end, lineEnd);
  if (before.trim() === "" && after.trim() === "") {
    const end = lineEnd < source.length ? lineEnd + 1 : lineEnd;
    return { range: [lineStart, end], text: "" };
  }
  return { range: [node.start, node.end], text: "" };
}

module.exports = { applyFixes, removeNodeFix };
