const personality = require("./personality");

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

function formatTerminal(issues) {
  const lines = [];

  if (issues.length === 0) {
    lines.push(
      `\n${Colors.PINK}💝 ${personality.getPraise()}${Colors.RESET}\n`
    );
    return lines.join("\n");
  }

  let currentFile = null;
  for (const issue of issues) {
    if (issue.filepath !== currentFile) {
      currentFile = issue.filepath;
      lines.push(
        `\n${Colors.BOLD}${Colors.MAGENTA}📁 ${currentFile}${Colors.RESET}`
      );
      lines.push(`${Colors.DIM}${"─".repeat(60)}${Colors.RESET}`);
    }

    const color = SEVERITY_COLORS[issue.severity] || Colors.RESET;
    const emoji = SEVERITY_EMOJI[issue.severity] || "";
    const lineNum = `L${issue.line}`.padEnd(5);

    lines.push(
      `  ${Colors.DIM}${lineNum}${Colors.RESET} ` +
        `${color}${Colors.BOLD}[${issue.rule}]${Colors.RESET} ` +
        `${emoji} ${issue.tsundere}`
    );
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
  lines.push("");

  return lines.join("\n");
}

function formatJSON(issues) {
  return JSON.stringify(
    issues.map((i) => ({
      file: i.filepath,
      line: i.line,
      col: i.col,
      severity: i.severity,
      rule: i.rule,
      message: i.message,
      tsundere: i.tsundere,
    })),
    null,
    2
  );
}

module.exports = { formatTerminal, formatJSON };
