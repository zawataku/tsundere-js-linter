const fs = require("fs");
const path = require("path");
const personality = require("./personality");
const { parse, walk, base } = require("./ast");
const { rules } = require("./rules");
const { createIgnoreMatcher, DEFAULT_EXTENSIONS } = require("./config");
const { parseDirectives, applyDirectives } = require("./directives");
const { applyFixes } = require("./fixer");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "__pycache__",
  "dist",
  "build",
  ".next",
  "coverage",
]);

/**
 * 設定からルールの重要度とオプションを決める。無効なら null。
 * 設定値は "off" / 重要度の文字列 / { severity, ...options } のどれか。
 */
function resolveRule(rule, config) {
  const setting = config.rules ? config.rules[rule.id] : undefined;
  const settings = {
    severity: rule.severity,
    options: { ...rule.defaultOptions },
  };
  if (setting === undefined) return settings;
  if (setting === "off") return null;
  if (typeof setting === "string") {
    settings.severity = setting;
    return settings;
  }
  const { severity, ...options } = setting;
  if (severity === "off") return null;
  if (severity) settings.severity = severity;
  Object.assign(settings.options, options);
  return settings;
}

function withTsundere(issues) {
  for (const issue of issues) {
    issue.tsundere = personality.formatIssue(
      issue.severity,
      issue.rule,
      issue.message
    );
  }
  return issues;
}

function fatalResult(filepath, message, loc = {}) {
  return {
    filepath,
    issues: withTsundere([
      {
        filepath,
        line: loc.line || 0,
        col: loc.column || 0,
        severity: "error",
        rule: "T000",
        message,
      },
    ]),
  };
}

function runRule(rule, settings, shared) {
  const issues = [];
  const context = {
    ...shared,
    options: settings.options,
    report({ node, loc, message, fix }) {
      const start = node ? node.loc.start : loc;
      const issue = {
        filepath: shared.filepath,
        line: start.line,
        col: start.column,
        severity: settings.severity,
        rule: rule.id,
        message,
      };
      if (fix) issue.fix = fix;
      issues.push(issue);
    },
  };
  rule.check(context);
  return issues;
}

const MAX_FIX_PASSES = 10;

/**
 * ソース文字列をlintする。options.fix が true なら自動修正を繰り返し適用し、
 * 修正後のソースを output、適用した数を fixed に入れて返す。
 * @returns {{ filepath: string, issues: object[], suppressed: object[], fixed?: number, output?: string }}
 */
function lintSource(source, filepath, config = {}, options = {}) {
  if (!options.fix) return lintOnce(source, filepath, config);

  let output = source;
  let fixed = 0;
  for (let pass = 0; pass < MAX_FIX_PASSES; pass++) {
    const result = lintOnce(output, filepath, config);
    const fixResult = applyFixes(output, result.issues);
    if (fixResult.applied === 0) break;
    output = fixResult.output;
    fixed += fixResult.applied;
  }
  return { ...lintOnce(output, filepath, config), fixed, output };
}

function lintOnce(source, filepath, config) {
  let parsed;
  try {
    parsed = parse(source, filepath);
  } catch (e) {
    return fatalResult(
      filepath,
      `SyntaxErrorって…コード動かしてみたことないの!? → ${e.message}`,
      e.loc
    );
  }

  const { ast, comments } = parsed;
  const shared = {
    filepath,
    source,
    sourceLines: source.split("\n"),
    ast,
    comments,
    walkSimple: (visitors) => walk.simple(ast, visitors, base),
    walkAncestor: (visitors) => walk.ancestor(ast, visitors, base),
  };

  const directives = parseDirectives(comments, filepath);
  const issues = [...directives.problems];
  for (const rule of rules) {
    const settings = resolveRule(rule, config);
    if (settings) issues.push(...runRule(rule, settings, shared));
  }

  issues.sort((a, b) => a.line - b.line || a.col - b.col);
  const { kept, suppressed } = applyDirectives(issues, directives);
  return { filepath, issues: withTsundere(kept), suppressed };
}

function hasLintableExtension(filepath, config) {
  const extensions = config.extensions || DEFAULT_EXTENSIONS;
  return extensions.includes(path.extname(filepath));
}

function lintFile(filepath, config = {}, options = {}) {
  if (createIgnoreMatcher(config)(filepath)) {
    return { filepath, issues: [], ignored: true };
  }
  return lintFileUnchecked(filepath, config, options);
}

function lintFileUnchecked(filepath, config, options) {
  const resolved = path.resolve(filepath);
  if (!fs.existsSync(resolved)) {
    return fatalResult(
      filepath,
      `ファイル '${filepath}' が見つからないんだけど？ちゃんとパス確認しなさいよ！`
    );
  }

  if (!hasLintableExtension(resolved, config)) return { filepath, issues: [] };

  const source = fs.readFileSync(resolved, "utf-8");
  const result = lintSource(source, filepath, config, options);
  if (result.output !== undefined && result.output !== source) {
    fs.writeFileSync(resolved, result.output);
  }
  return result;
}

function lintDirectory(dirpath, config = {}, options = {}) {
  const results = [];
  const resolved = path.resolve(dirpath);
  const isIgnored = createIgnoreMatcher(config);

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (SKIP_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (isIgnored(fullPath)) continue;
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && hasLintableExtension(entry.name, config)) {
        const relPath = path.relative(process.cwd(), fullPath);
        results.push(lintFileUnchecked(relPath, config, options));
      }
    }
  }

  walkDir(resolved);
  return results;
}

module.exports = {
  lintFile,
  lintDirectory,
  lintSource,
  resolveRule,
};
