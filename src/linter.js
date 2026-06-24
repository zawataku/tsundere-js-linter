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

function lintSource(source, filepath) {
  const sourceLines = source.split("\n");
  let ast;
  try {
    ast = acorn.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
    });
  } catch (e) {
    return [
      {
        filepath,
        line: e.loc ? e.loc.line : 0,
        col: e.loc ? e.loc.column : 0,
        severity: "error",
        rule: "T000",
        message: `SyntaxErrorって…コード動かしてみたことないの!? → ${e.message}`,
        tsundere: "",
      },
    ];
  }

  const issues = [
    ...rules.checkUnusedImports(ast, sourceLines, filepath),
    ...rules.checkLineLength(sourceLines, filepath),
    ...rules.checkMissingJSDoc(ast, source, filepath),
    ...rules.checkTodoFixme(sourceLines, filepath),
    ...rules.checkEmptyCatch(ast, filepath),
    ...rules.checkLooseEquality(ast, filepath),
    ...rules.checkConsoleLog(ast, filepath),
    ...rules.checkMagicNumbers(ast, filepath),
    ...rules.checkLongFunctions(ast, filepath),
    ...rules.checkNestingDepth(ast, filepath),
  ];

  issues.sort((a, b) => a.line - b.line);

  for (const issue of issues) {
    issue.tsundere = personality.formatIssue(
      issue.severity,
      issue.rule,
      issue.message
    );
  }

  return issues;
}

function lintFile(filepath) {
  const resolved = path.resolve(filepath);
  if (!fs.existsSync(resolved)) {
    return [
      {
        filepath,
        line: 0,
        col: 0,
        severity: "error",
        rule: "T000",
        message: `ファイル '${filepath}' が見つからないんだけど？ちゃんとパス確認しなさいよ！`,
        tsundere: "",
      },
    ];
  }

  if (path.extname(resolved) !== ".js") return [];

  const source = fs.readFileSync(resolved, "utf-8");
  return lintSource(source, filepath);
}

function lintDirectory(dirpath, recursive = true) {
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
        allIssues.push(...lintFile(relPath));
      }
    }
  }

  walkDir(resolved);
  return allIssues;
}

module.exports = { lintFile, lintDirectory, lintSource };
