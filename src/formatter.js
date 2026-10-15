const personality = require("./personality");
const { ruleLabel } = require("./rules");

const Colors = {
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  RED: "\x1b[91m",
  YELLOW: "\x1b[93m",
  CYAN: "\x1b[96m",
  MAGENTA: "\x1b[95m",
  GREEN: "\x1b[92m",
  DIM: "\x1b[2m",
  PINK: "\x1b[95m",
};

const SEVERITY_COLORS = {
  error: Colors.RED,
  warning: Colors.YELLOW,
  info: Colors.CYAN,
};

const SEVERITY_EMOJI = {
  error: "💢",
  warning: "💭",
  info: "💬",
};

function allIssues(results) {
  return results.flatMap((r) => r.issues);
}

// ファイル内で同じルールに何度も引っかかっていたら反応する
function repeatLines(issues) {
  const counts = new Map();
  for (const issue of issues) {
    if (issue.rule === "T000") continue;
    counts.set(issue.rule, (counts.get(issue.rule) || 0) + 1);
  }
  const lines = [];
  for (const [rule, count] of counts) {
    const reaction = personality.getRepeatReaction(ruleLabel(rule), count);
    if (reaction) {
      lines.push(`  ${Colors.PINK}🔁 [${rule}] ${reaction}${Colors.RESET}`);
    }
  }
  return lines;
}

function sum(results, count) {
  return results.reduce((n, r) => n + count(r), 0);
}

// 指摘以外のひとこと（自動修正・無効化コメントへの反応など）
function footerLines(results) {
  const lines = [];
  const fixed = sum(results, (r) => r.fixed || 0);
  if (fixed > 0) {
    lines.push(
      `   ${Colors.GREEN}🔧 ${personality.getFixReaction(fixed)}${Colors.RESET}`
    );
  }
  const fixable = sum(results, (r) => r.issues.filter((i) => i.fix).length);
  if (fixable > 0) {
    lines.push(
      `   ${Colors.DIM}🔧 ${personality.getFixableHint(fixable)}${Colors.RESET}`
    );
  }
  const suppressed = sum(results, (r) => (r.suppressed ? r.suppressed.length : 0));
  if (suppressed > 0) {
    lines.push(
      `   ${Colors.DIM}🙈 ${personality.getSuppressedReaction(suppressed)}${Colors.RESET}`
    );
  }
  return lines;
}

function formatTerminal(results) {
  const lines = [];
  const issues = allIssues(results);

  if (issues.length === 0) {
    lines.push(`\n${Colors.PINK}💝 ${personality.getPraise()}${Colors.RESET}`);
    lines.push(...footerLines(results));
    lines.push("");
    return lines.join("\n");
  }

  for (const result of results) {
    if (result.issues.length === 0) continue;
    lines.push(
      `\n${Colors.BOLD}${Colors.MAGENTA}📁 ${result.filepath}${Colors.RESET}`
    );
    lines.push(`${Colors.DIM}${"─".repeat(60)}${Colors.RESET}`);

    for (const issue of result.issues) {
      const color = SEVERITY_COLORS[issue.severity] || Colors.RESET;
      const emoji = SEVERITY_EMOJI[issue.severity] || "";
      const lineNum = `L${issue.line}`.padEnd(5);
      const fixMark = issue.fix ? ` ${Colors.GREEN}🔧${Colors.RESET}` : "";

      lines.push(
        `  ${Colors.DIM}${lineNum}${Colors.RESET} ` +
          `${color}${Colors.BOLD}[${issue.rule}]${Colors.RESET}${fixMark} ` +
          `${emoji} ${issue.tsundere}`
      );
    }
    lines.push(...repeatLines(result.issues));
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  lines.push(`\n${Colors.DIM}${"─".repeat(60)}${Colors.RESET}`);
  lines.push(
    `\n${Colors.PINK}💝 ${personality.getSummary(issues.length)}${Colors.RESET}`
  );
  lines.push(
    `   ${Colors.RED}💢 Error: ${errorCount}${Colors.RESET}  ` +
      `${Colors.YELLOW}💭 Warning: ${warnCount}${Colors.RESET}  ` +
      `${Colors.CYAN}💬 Info: ${infoCount}${Colors.RESET}`
  );
  lines.push(...footerLines(results));
  lines.push("");

  return lines.join("\n");
}

function formatJSON(results) {
  return JSON.stringify(
    allIssues(results).map((i) => ({
      file: i.filepath,
      line: i.line,
      col: i.col,
      severity: i.severity,
      rule: i.rule,
      message: i.message,
      tsundere: i.tsundere,
      fixable: Boolean(i.fix),
    })),
    null,
    2
  );
}

module.exports = { formatTerminal, formatJSON };
