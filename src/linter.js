const fs = require("fs");
const path = require("path");
const acorn = require("acorn");
const personality = require("./personality");
const rules = require("./rules");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "__pycache__",
  "dist",
  "build",
  ".next",
  "coverage",
]);

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

function lintSource(source, filepath, options = {}) {
  const sourceLines = source.split("\n");
  const comments = [];
  let ast;
  try {
    ast = acorn.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      onComment: comments,
    });
  } catch (e) {
    return withTsundere([
      {
        filepath,
        line: e.loc ? e.loc.line : 0,
        col: e.loc ? e.loc.column : 0,
        severity: "error",
        rule: "T000",
        message: `SyntaxErrorって…コード動かしてみたことないの!? → ${e.message}`,
      },
    ]);
  }

  const issues = [
    ...rules.checkUnusedImports(ast, sourceLines, filepath),
    ...rules.checkLineLength(sourceLines, filepath, options.maxLineLength),
    ...rules.checkMissingJSDoc(ast, source, comments, filepath),
    ...rules.checkTodoFixme(comments, filepath),
    ...rules.checkEmptyCatch(ast, filepath),
    ...rules.checkLooseEquality(ast, filepath),
    ...rules.checkConsoleLog(ast, filepath),
    ...rules.checkMagicNumbers(ast, filepath),
    ...rules.checkLongFunctions(ast, filepath),
    ...rules.checkNestingDepth(ast, filepath),
  ];

  issues.sort((a, b) => a.line - b.line || a.col - b.col);

  return withTsundere(issues);
}

function lintFile(filepath, options = {}) {
  const resolved = path.resolve(filepath);
  if (!fs.existsSync(resolved)) {
    return withTsundere([
      {
        filepath,
        line: 0,
        col: 0,
        severity: "error",
        rule: "T000",
        message: `ファイル '${filepath}' が見つからないんだけど？ちゃんとパス確認しなさいよ！`,
      },
    ]);
  }

  if (path.extname(resolved) !== ".js") return [];

  const source = fs.readFileSync(resolved, "utf-8");
  return lintSource(source, filepath, options);
}

function lintDirectory(dirpath, options = {}, recursive = true) {
  const allIssues = [];
  const resolved = path.resolve(dirpath);

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (SKIP_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && recursive) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        const relPath = path.relative(process.cwd(), fullPath);
        allIssues.push(...lintFile(relPath, options));
      }
    }
  }

  walkDir(resolved);
  return allIssues;
}

module.exports = { lintFile, lintDirectory, lintSource };
