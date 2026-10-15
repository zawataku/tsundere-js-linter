const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { lintStaged } = require("../src/linter");
const { installHook, getStagedFiles, GitError, HOOK_MARKER } = require("../src/git");

const CLI = path.join(__dirname, "..", "src", "cli.js");

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: "pipe" });
}

let repo;

beforeEach(() => {
  repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "tsundere-git-")));
  git(repo, "init", "-q");
});

afterEach(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

function write(name, content) {
  const file = path.join(repo, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

describe("--staged", () => {
  it("should lint the staged content, not the working tree", () => {
    write("a.js", "var x = 1;\n");
    git(repo, "add", "a.js");
    write("a.js", "let x = 1;\n");

    const results = lintStaged({}, repo);
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].issues.some((i) => i.rule === "T011"));
  });

  it("should only include staged lintable files", () => {
    write("staged.js", "let a = 1;\n");
    write("unstaged.js", "let b = 1;\n");
    write("notes.txt", "hello\n");
    write("日本語/ファイル.mjs", "let c = 1;\n");
    git(repo, "add", "staged.js", "notes.txt", "日本語/ファイル.mjs");

    const names = lintStaged({}, repo).map((r) => r.filepath.replace(/\\/g, "/")).sort();
    assert.deepStrictEqual(names, ["staged.js", "日本語/ファイル.mjs"]);
  });

  it("should respect ignorePatterns", () => {
    write("vendor/lib.js", "var x = 1;\n");
    git(repo, "add", ".");
    const config = { baseDir: repo, ignorePatterns: ["vendor"] };
    assert.deepStrictEqual(lintStaged(config, repo), []);
  });

  it("should fail outside a git repository", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tsundere-nogit-"));
    try {
      // 親ディレクトリにリポジトリがあっても見に行かないようにする
      const env = { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(dir) };
      const res = spawnSync(process.execPath, [CLI, "--staged"], { cwd: dir, env, encoding: "utf-8" });
      assert.strictEqual(res.status, 2);
      assert.ok(res.stderr.includes("gitリポジトリじゃない"));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("should exit 1 from the CLI when staged code has errors", () => {
    write("a.js", "debugger;\n");
    git(repo, "add", "a.js");
    const res = spawnSync(process.execPath, [CLI, "--staged", "--no-banner"], {
      cwd: repo,
      encoding: "utf-8",
    });
    assert.strictEqual(res.status, 1);
    assert.ok(res.stdout.includes("T012"));
  });

  it("should say so when nothing is staged", () => {
    const res = spawnSync(process.execPath, [CLI, "--staged", "--no-banner"], {
      cwd: repo,
      encoding: "utf-8",
    });
    assert.strictEqual(res.status, 0);
    assert.ok(res.stdout.includes("ステージ済みファイルがない"));
  });

  it("should list staged files relative to the repo root", () => {
    write("src/a.js", "let a = 1;\n");
    git(repo, "add", ".");
    const [file] = getStagedFiles(path.join(repo, "src"));
    assert.strictEqual(file.rel, "src/a.js");
  });
});

describe("--install-hook", () => {
  const hookFile = () => path.join(repo, ".git", "hooks", "pre-commit");

  it("should write a pre-commit hook", () => {
    const { file, updated } = installHook(repo);
    assert.strictEqual(path.resolve(file), path.resolve(hookFile()));
    assert.strictEqual(updated, false);
    const content = fs.readFileSync(hookFile(), "utf-8");
    assert.ok(content.startsWith("#!/bin/sh\n"));
    assert.ok(content.includes(HOOK_MARKER));
    assert.ok(content.includes("--staged --no-banner"));
  });

  it("should update its own hook", () => {
    installHook(repo);
    assert.strictEqual(installHook(repo).updated, true);
  });

  it("should not overwrite someone else's hook", () => {
    fs.mkdirSync(path.dirname(hookFile()), { recursive: true });
    fs.writeFileSync(hookFile(), "#!/bin/sh\necho mine\n");
    assert.throws(() => installHook(repo), GitError);
    assert.strictEqual(fs.readFileSync(hookFile(), "utf-8"), "#!/bin/sh\necho mine\n");
  });

  it("should refuse when core.hooksPath is set", () => {
    git(repo, "config", "core.hooksPath", ".husky");
    assert.throws(() => installHook(repo), /core\.hooksPath/);
  });
});

describe("CLI arguments", () => {
  function run(...args) {
    return spawnSync(process.execPath, [CLI, "--no-banner", ...args], {
      cwd: repo,
      encoding: "utf-8",
    });
  }

  it("should lint multiple paths", () => {
    write("a.js", "var a = 1;\n");
    write("dir/b.js", "var b = 1;\n");
    const res = run("a.js", "dir", "-f", "json");
    const files = JSON.parse(res.stdout).map((i) => i.file.replace(/\\/g, "/"));
    assert.deepStrictEqual([...new Set(files)].sort(), ["a.js", "dir/b.js"]);
  });

  it("should reject --staged with --fix", () => {
    const res = run("--staged", "--fix");
    assert.strictEqual(res.status, 2);
  });

  it("should reject unknown options", () => {
    write("a.js", "let a = 1;\n");
    const res = run("a.js", "--nope");
    assert.strictEqual(res.status, 2);
    assert.ok(res.stderr.includes("--nope"));
  });
});
