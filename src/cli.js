#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { lintFile, lintDirectory } = require("./linter");
const { formatTerminal, formatJSON } = require("./formatter");

const VERSION = "1.0.0";

const BANNER = `
  💢 tsundere-js-linter v${VERSION}
  ──────────────────────────────────
  べ、別にあんたのコードが気になった
  わけじゃないんだからね！
`;

function parseArgs(argv) {
  const args = {
    path: null,
    json: false,
    maxLineLength: 120,
    noBanner: false,
    version: false,
    help: false,
  };

  let i = 2;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--json" || arg === "-j") {
      args.json = true;
    } else if (arg === "--max-line-length") {
      i++;
      args.maxLineLength = parseInt(argv[i], 10);
    } else if (arg === "--no-banner") {
      args.noBanner = true;
    } else if (arg === "--version" || arg === "-v") {
      args.version = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (!arg.startsWith("-")) {
      args.path = arg;
    }
    i++;
  }
  return args;
}

function showHelp() {
  console.log(`
使い方: tsundere-lint-js <path> [options]

引数:
  path                         lintするファイルまたはディレクトリ

オプション:
  --json, -j                   JSON形式で出力
  --max-line-length <number>   最大行長（デフォルト: 120）
  --no-banner                  バナーを非表示
  --version, -v                バージョン表示
  --help, -h                   ヘルプ表示
`);
}

function main() {
  const args = parseArgs(process.argv);

  if (args.version) {
    console.log(`tsundere-js-linter ${VERSION}`);
    process.exit(0);
  }

  if (args.help || !args.path) {
    showHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (!args.json && !args.noBanner) {
    console.log(BANNER);
  }

  const target = args.path;
  let issues;

  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    issues = lintFile(target);
  } else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    issues = lintDirectory(target);
  } else {
    console.error(
      `💢 '${target}' が見つからないわ！パスを確認しなさい！`
    );
    process.exit(2);
  }

  if (args.json) {
    console.log(formatJSON(issues));
  } else {
    console.log(formatTerminal(issues));
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  process.exit(hasErrors ? 1 : 0);
}

main();
