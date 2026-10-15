const { findRule } = require("./rules");

// インライン無効化コメント
//
//   // tsundere-disable-next-line T007           次の行だけ
//   foo(); // tsundere-disable-line T006          その行だけ
//   /* tsundere-disable T008, magic-numbers */   ここから…
//   /* tsundere-enable */                        …ここまで
//
// ルールを省略すると全ルールが対象。"-- 理由" 以降は無視する。
const PATTERN =
  /^\s*tsundere-(disable-next-line|disable-line|disable|enable)(?:\s+([^]*?))?\s*$/;

function parseRuleList(text) {
  if (!text) return [];
  return text
    .split(/\s--\s|^--\s/)[0]
    .split(/[\s,]+/)
    .filter(Boolean);
}

/**
 * コメント一覧から無効化ディレクティブを読み取る。
 * 存在しないルール名は problems に入れて返す。
 */
function parseDirectives(comments, filepath) {
  const lineRules = new Map(); // line -> Set(ruleId) | "all"
  const ranges = []; // { line, column, kind: "disable"|"enable", rules: ruleId[] | null }
  const problems = [];

  function addLine(line, ids) {
    const current = lineRules.get(line);
    if (ids === null || current === "all") {
      lineRules.set(line, "all");
    } else {
      lineRules.set(line, new Set([...(current || []), ...ids]));
    }
  }

  for (const comment of comments) {
    const match = comment.value.match(PATTERN);
    if (!match) continue;
    const [, kind, rest] = match;

    const ids = [];
    for (const key of parseRuleList(rest)) {
      const rule = findRule(key);
      if (rule) {
        ids.push(rule.id);
      } else {
        problems.push({
          filepath,
          line: comment.loc.start.line,
          col: comment.loc.start.column,
          severity: "warning",
          rule: "T000",
          message: `'${key}' なんてルールないんだけど？無効化コメントを確認しなさいよ`,
        });
      }
    }
    // 全部タイポだった場合に「全ルール無効」と誤解しないよう、何もしない
    if (ids.length === 0 && parseRuleList(rest).length > 0) continue;
    const target = ids.length > 0 ? ids : null;

    if (kind === "disable-line") {
      addLine(comment.loc.start.line, target);
    } else if (kind === "disable-next-line") {
      addLine(comment.loc.end.line + 1, target);
    } else {
      ranges.push({
        line: comment.loc.start.line,
        column: comment.loc.start.column,
        kind,
        rules: target,
      });
    }
  }

  return { lineRules, ranges, problems };
}

function isBefore(range, issue) {
  return (
    range.line < issue.line ||
    (range.line === issue.line && range.column <= issue.col)
  );
}

function isSuppressed(issue, { lineRules, ranges }) {
  const onLine = lineRules.get(issue.line);
  if (onLine === "all" || (onLine && onLine.has(issue.rule))) return true;

  // ディレクティブを先頭から順に再生して、指摘位置での状態を求める
  let all = false;
  const overrides = new Map();
  for (const range of ranges) {
    if (!isBefore(range, issue)) break;
    const disabled = range.kind === "disable";
    if (range.rules === null) {
      all = disabled;
      overrides.clear();
    } else {
      for (const id of range.rules) overrides.set(id, disabled);
    }
  }
  return overrides.has(issue.rule) ? overrides.get(issue.rule) : all;
}

/**
 * 指摘を「残すもの」と「無効化コメントで消されたもの」に分ける。
 */
function applyDirectives(issues, directives) {
  const kept = [];
  const suppressed = [];
  for (const issue of issues) {
    if (issue.rule !== "T000" && isSuppressed(issue, directives)) {
      suppressed.push(issue);
    } else {
      kept.push(issue);
    }
  }
  return { kept, suppressed };
}

module.exports = { parseDirectives, applyDirectives };
