const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const HOOK_MARKER = "# tsundere-js-linter pre-commit hook";
const CLI_PATH = path.join(__dirname, "cli.js");

class GitError extends Error {}

function git(args, cwd) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    if (e.code === "ENOENT") {
      throw new GitError("git コマンドが見つからないんだけど？インストールしてある？");
    }
    throw new GitError(
      `git ${args[0]} に失敗したわよ: ${String(e.stderr || e.message).trim()}`
    );
  }
}

function repoRoot(cwd) {
  try {
    return git(["rev-parse", "--show-toplevel"], cwd).trim();
  } catch (e) {
    if (e instanceof GitError) {
      throw new GitError("ここ、gitリポジトリじゃないんだけど？");
    }
    throw e;
  }
}

/**
 * ステージ済み（追加・変更・コピー・リネーム）のファイルを返す。
 * path は絶対パス、rel はリポジトリルートからの相対パス（/区切り）。
 */
function getStagedFiles(cwd = process.cwd()) {
  const root = repoRoot(cwd);
  // -z で区切ると日本語などのファイル名がクォートされない
  const out = git(
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    root
  );
  return out
    .split("\0")
    .filter(Boolean)
    .map((rel) => ({ rel, path: path.join(root, rel), root }));
}

/** インデックスに入っている（ステージされた）内容を読む */
function readStagedFile(file) {
  return git(["show", `:${file.rel}`], file.root);
}

function hooksDir(cwd) {
  const custom = (() => {
    try {
      return git(["config", "core.hooksPath"], cwd).trim();
    } catch {
      return "";
    }
  })();
  if (custom) {
    throw new GitError(
      `core.hooksPath が '${custom}' に設定されてるわ。husky とかを使ってるなら、そっちのフックに\n` +
        "   npx tsundere-lint-js --staged --no-banner\n" +
        "   を書き足しなさいよね。…勝手に上書きしたりしないんだから。"
    );
  }
  return path.resolve(cwd, git(["rev-parse", "--git-path", "hooks"], cwd).trim());
}

// フックから呼ぶコマンド。リポジトリ内にある cli.js なら相対パスで呼ぶ
function hookCommand(root) {
  const rel = path.relative(root, CLI_PATH);
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
    return `node "${rel.replace(/\\/g, "/")}"`;
  }
  return "tsundere-lint-js";
}

/**
 * .git/hooks/pre-commit を作る。自分以外が作ったフックは上書きしない。
 * @returns {{ file: string, updated: boolean }}
 */
function installHook(cwd = process.cwd()) {
  const root = repoRoot(cwd);
  const dir = hooksDir(root);
  const file = path.join(dir, "pre-commit");

  let updated = false;
  if (fs.existsSync(file)) {
    if (!fs.readFileSync(file, "utf-8").includes(HOOK_MARKER)) {
      throw new GitError(
        `'${file}' にはもう別の pre-commit フックがあるわよ。消すのはあんたの判断でしょ？\n` +
          "   残したいなら、そのフックに tsundere-lint-js --staged --no-banner を書き足しなさい。"
      );
    }
    updated = true;
  }

  const script = [
    "#!/bin/sh",
    HOOK_MARKER,
    `exec ${hookCommand(root)} --staged --no-banner`,
    "",
  ].join("\n");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, script, { mode: 0o755 });
  return { file, updated };
}

module.exports = {
  GitError,
  getStagedFiles,
  readStagedFile,
  installHook,
  HOOK_MARKER,
};
