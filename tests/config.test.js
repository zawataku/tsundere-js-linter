const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  loadConfig,
  validateConfig,
  setRuleOption,
  createIgnoreMatcher,
  ConfigError,
} = require("../src/config");
const { lintSource, lintFile, lintDirectory } = require("../src/linter");

describe("validateConfig", () => {
  it("should normalize rule names to ids", () => {
    const config = validateConfig({ rules: { "loose-equality": "warning" } });
    assert.deepStrictEqual(config.rules, { T006: "warning" });
  });

  it("should reject unknown rules", () => {
    assert.throws(() => validateConfig({ rules: { T999: "off" } }), ConfigError);
  });

  it("should reject unknown severities", () => {
    assert.throws(() => validateConfig({ rules: { T006: "fatal" } }), ConfigError);
  });

  it("should reject unknown options", () => {
    assert.throws(
      () => validateConfig({ rules: { T002: { maxLength: 80 } } }),
      /max/
    );
  });

  it("should reject options of the wrong type", () => {
    assert.throws(
      () => validateConfig({ rules: { T002: { max: "80" } } }),
      ConfigError
    );
  });

  it("should reject unknown top-level keys", () => {
    assert.throws(() => validateConfig({ rule: {} }), ConfigError);
  });

  it("should reject non-string ignorePatterns", () => {
    assert.throws(() => validateConfig({ ignorePatterns: [1] }), ConfigError);
  });
});

describe("setRuleOption", () => {
  it("should keep severity from a string setting", () => {
    const config = { rules: { T002: "error" } };
    setRuleOption(config, "T002", "max", 80);
    assert.deepStrictEqual(config.rules.T002, { severity: "error", max: 80 });
  });

  it("should stay off when the rule is off", () => {
    const config = { rules: { T002: "off" } };
    setRuleOption(config, "T002", "max", 10);
    const issues = lintSource(`const x = 12345678901;\n`, "a.js", config).issues;
    assert.ok(!issues.some((i) => i.rule === "T002"));
  });
});

describe("createIgnoreMatcher", () => {
  const baseDir = path.resolve("/project");
  const matcher = (patterns) =>
    createIgnoreMatcher({ baseDir, ignorePatterns: patterns });
  const p = (rel) => path.join(baseDir, rel);

  it("should match basenames at any depth", () => {
    const isIgnored = matcher(["*.min.js"]);
    assert.ok(isIgnored(p("a.min.js")));
    assert.ok(isIgnored(p("lib/vendor/a.min.js")));
    assert.ok(!isIgnored(p("a.js")));
  });

  it("should ignore everything inside a matched directory", () => {
    const isIgnored = matcher(["examples/"]);
    assert.ok(isIgnored(p("examples/bad_code.js")));
    assert.ok(isIgnored(p("sub/examples/x.js")));
    assert.ok(!isIgnored(p("src/examples.js")));
  });

  it("should anchor patterns containing a slash", () => {
    const isIgnored = matcher(["src/generated/**"]);
    assert.ok(isIgnored(p("src/generated/a/b.js")));
    assert.ok(!isIgnored(p("lib/src/generated/b.js")));
  });

  it("should ignore nothing outside baseDir", () => {
    const isIgnored = matcher(["**"]);
    assert.ok(!isIgnored(path.resolve("/elsewhere/a.js")));
  });
});

describe("loadConfig", () => {
  let dir;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "tsundere-"));
    fs.mkdirSync(path.join(dir, "src", "vendor"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, ".tsundererc.json"),
      JSON.stringify({
        rules: { T006: "off", "max-line-length": { max: 10 } },
        ignorePatterns: ["vendor"],
      })
    );
    fs.writeFileSync(path.join(dir, "src", "a.js"), "if (x == 1) {}\n");
    fs.writeFileSync(path.join(dir, "src", "vendor", "b.js"), "if (x == 1) {}\n");
  });

  after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("should find the config file in a parent directory", () => {
    const config = loadConfig({ cwd: path.join(dir, "src") });
    assert.strictEqual(config.file, path.join(dir, ".tsundererc.json"));
    assert.strictEqual(config.rules.T006, "off");
    assert.deepStrictEqual(config.rules.T002, { max: 10 });
  });

  it("should apply rules and ignorePatterns when linting", () => {
    const config = loadConfig({ cwd: dir });
    const results = lintDirectory(dir, config);
    const files = results.map((r) => path.basename(r.filepath));
    assert.deepStrictEqual(files, ["a.js"]);
    const rules = results[0].issues.map((i) => i.rule);
    assert.ok(!rules.includes("T006"));
    assert.ok(rules.includes("T002"));
  });

  it("should skip ignored files passed explicitly", () => {
    const config = loadConfig({ cwd: dir });
    const result = lintFile(path.join(dir, "src", "vendor", "b.js"), config);
    assert.strictEqual(result.issues.length, 0);
    assert.ok(result.ignored);
  });

  it("should return an empty config when no file exists", () => {
    const config = loadConfig({ cwd: path.parse(dir).root });
    assert.deepStrictEqual(config.rules, {});
  });

  it("should report broken JSON", () => {
    const file = path.join(dir, "broken.json");
    fs.writeFileSync(file, "{ rules: ");
    assert.throws(() => loadConfig({ configPath: file }), ConfigError);
  });

  it("should report a missing --config file", () => {
    assert.throws(
      () => loadConfig({ configPath: path.join(dir, "nope.json") }),
      /見つからない/
    );
  });
});
