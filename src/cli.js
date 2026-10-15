#!/usr/bin/env node

const fs = require("fs");
const { lintPaths, lintStaged } = require("./linter");
const { FORMATTERS } = require("./formatter");
const { loadConfig, setRuleOption, ConfigError } = require("./config");
const { installHook, GitError } = require("./git");

const VERSION = "1.0.0";

const BANNER = `
  💢 tsundere-js-linter v${VERSION}
  ──────────────────────────────────
  べ、別にあんたのコードが気になった
  わけじゃないんだからね！
`;

function fail(message) {
  console.error(`💢 ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = {
    paths: [],
    format: "terminal",
    maxLineLength: null,
    config: null,
    fix: false,
    staged: false,
    installHook: false,
    noBanner: false,
    version: false,
    help: false,
  };

  let i = 2;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--json" || arg === "-j") {
      args.format = "json";
    } else if (arg === "--format" || arg === "-f") {
      i++;
      if (!(argv[i] in FORMATTERS)) {
        fail(
          `'${argv[i]}' なんて出力形式知らないわよ！ ${Object.keys(FORMATTERS).join(" / ")} から選びなさい`
        );
      }
      args.format = argv[i];
    } else if (arg === "--max-line-length") {
      i++;
      const value = Number(argv[i]);
      if (!Number.isInteger(value) || value <= 0) {
        fail(`--max-line-length には正の整数を指定しなさいよ！ ('${argv[i]}' って何？)`);
      }
      args.maxLineLength = value;
    } else if (arg === "--config" || arg === "-c") {
      i++;
      args.config = argv[i];
    } else if (arg === "--fix") {
      args.fix = true;
    } else if (arg === "--staged") {
      args.staged = true;
    } else if (arg === "--install-hook") {
      args.installHook = true;
    } else if (arg === "--no-banner") {
      args.noBanner = true;
    } else if (arg === "--version" || arg === "-v") {
      args.version = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (!arg.startsWith("-")) {
      args.paths.push(arg);
    } else {
      fail(`'${arg}' なんてオプション知らないわよ！ --help を見なさい`);
    }
    i++;
  }
  return args;
}

function showHelp() {
  console.log(`
使い方: tsundere-lint-js <path...> [options]
        tsundere-lint-js --staged [options]
        tsundere-lint-js --install-hook

引数:
  path...                      lintするファイルまたはディレクトリ（複数可）

オプション:
  --format, -f <name>          出力形式 terminal / json / github（デフォルト: terminal）
  --json, -j                   --format json と同じ
  --config, -c <path>          設定ファイルを指定（デフォルト: .tsundererc.json を探す）
  --max-line-length <number>   最大行長（設定ファイルより優先）
  --fix                        直せる指摘を自動修正してファイルを書き換える
  --staged                     git にステージされた内容だけをlintする
  --install-hook               .git/hooks/pre-commit に --staged で動くフックを作る
  --no-banner                  バナーを非表示
  --version, -v                バージョン表示
  --help, -h                   ヘルプ表示
`);
}

function runInstallHook() {
  try {
    const { file, updated } = installHook();
    console.log(
      updated
        ? `💝 フックを更新しておいたわ: ${file}`
        : `💝 し、仕方ないからフックを入れてあげたわよ: ${file}\n   これからはコミットのたびに見張っててあげる。…べ、別に嬉しくないんだからね！`
    );
    process.exit(0);
  } catch (e) {
    if (e instanceof GitError) fail(e.message);
    throw e;
  }
}

function main() {
  const args = parseArgs(process.argv);

  if (args.version) {
    console.log(`tsundere-js-linter ${VERSION}`);
    process.exit(0);
  }

  if (args.installHook) runInstallHook();

  if (args.help || (args.paths.length === 0 && !args.staged)) {
    showHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (args.staged && args.paths.length > 0) {
    fail("--staged とパスは一緒に指定できないわよ！どっちかにしなさい");
  }
  if (args.staged && args.fix) {
    fail("--staged と --fix は一緒に使えないわよ！ステージした内容とずれちゃうでしょ");
  }

  let config;
  try {
    config = loadConfig({ configPath: args.config });
  } catch (e) {
    if (!(e instanceof ConfigError)) throw e;
    fail(`設定ファイルがおかしいわよ！\n   ${e.message}`);
  }
  if (args.maxLineLength !== null) {
    setRuleOption(config, "T002", "max", args.maxLineLength);
  }

  const missing = args.paths.find((p) => !fs.existsSync(p));
  if (missing) {
    fail(`'${missing}' が見つからないわ！パスを確認しなさい！`);
  }

  if (args.format === "terminal" && !args.noBanner) {
    console.log(BANNER);
  }

  let results;
  if (args.staged) {
    try {
      results = lintStaged(config);
    } catch (e) {
      if (e instanceof GitError) fail(e.message);
      throw e;
    }
    if (results.length === 0 && args.format === "terminal") {
      console.log("💭 lintするステージ済みファイルがないじゃない。…別にいいけど。");
      process.exit(0);
    }
  } else {
    results = lintPaths(args.paths, config, { fix: args.fix });
  }

  console.log(FORMATTERS[args.format](results));

  const hasErrors = results.some((r) =>
    r.issues.some((i) => i.severity === "error")
  );
  process.exit(hasErrors ? 1 : 0);
}

main();
