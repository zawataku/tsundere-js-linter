const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { lintSource, lintFile, lintDirectory } = require("../src/linter");
const { formatTerminal, formatJSON } = require("../src/formatter");

function lintCode(source) {
  return lintSource(source, "test.js");
}

function rulesOf(issues) {
  return issues.map((i) => i.rule);
}

describe("T001: unused imports", () => {
  it("should detect unused imports", () => {
    const issues = lintCode(`import fs from 'fs';\nconst x = 1;\n`);
    assert.ok(rulesOf(issues).includes("T001"));
  });

  it("should not flag used imports", () => {
    const issues = lintCode(
      `import path from 'path';\nconst p = path.resolve('.');\n`
    );
    assert.ok(!rulesOf(issues).includes("T001"));
  });
});

describe("T002: line length", () => {
  it("should detect long lines", () => {
    const issues = lintCode(`const x = "${"a".repeat(200)}";\n`);
    assert.ok(rulesOf(issues).includes("T002"));
  });

  it("should not flag short lines", () => {
    const issues = lintCode(`const x = 1;\n`);
    assert.ok(!rulesOf(issues).includes("T002"));
  });
});

describe("T003: missing JSDoc", () => {
  it("should detect missing JSDoc on functions", () => {
    const issues = lintCode(`function hello() {\n  return 1;\n}\n`);
    assert.ok(rulesOf(issues).includes("T003"));
  });

  it("should not flag functions with JSDoc", () => {
    const issues = lintCode(
      `/** Say hello. */\nfunction hello() {\n  return 1;\n}\n`
    );
    assert.ok(!rulesOf(issues).includes("T003"));
  });

  it("should skip private functions starting with _", () => {
    const issues = lintCode(`function _helper() {\n  return 1;\n}\n`);
    assert.ok(!rulesOf(issues).includes("T003"));
  });
});

describe("T004: TODO/FIXME comments", () => {
  it("should detect TODO", () => {
    const issues = lintCode(`// TODO: fix this\nconst x = 1;\n`);
    assert.ok(rulesOf(issues).includes("T004"));
  });

  it("should detect FIXME", () => {
    const issues = lintCode(`// FIXME: broken\nconst x = 1;\n`);
    assert.ok(rulesOf(issues).includes("T004"));
  });

  it("should detect HACK", () => {
    const issues = lintCode(`// HACK: workaround\nconst x = 1;\n`);
    assert.ok(rulesOf(issues).includes("T004"));
  });
});

describe("T005: empty catch blocks", () => {
  it("should detect empty catch", () => {
    const issues = lintCode(
      `try {\n  const x = 1;\n} catch (e) {\n}\n`
    );
    assert.ok(rulesOf(issues).includes("T005"));
  });

  it("should not flag catch with body", () => {
    const issues = lintCode(
      `try {\n  const x = 1;\n} catch (e) {\n  console.error(e);\n}\n`
    );
    assert.ok(!rulesOf(issues).includes("T005"));
  });
});

describe("T006: loose equality", () => {
  it("should detect == operator", () => {
    const issues = lintCode(`if (x == 1) {}\n`);
    assert.ok(rulesOf(issues).includes("T006"));
  });

  it("should detect != operator", () => {
    const issues = lintCode(`if (x != 1) {}\n`);
    assert.ok(rulesOf(issues).includes("T006"));
  });

  it("should not flag === operator", () => {
    const issues = lintCode(`if (x === 1) {}\n`);
    assert.ok(!rulesOf(issues).includes("T006"));
  });

  it("should allow == null comparison", () => {
    const issues = lintCode(`if (x == null) {}\n`);
    assert.ok(!rulesOf(issues).includes("T006"));
  });
});

describe("T007: console.log", () => {
  it("should detect console.log", () => {
    const issues = lintCode(`console.log("hello");\n`);
    assert.ok(rulesOf(issues).includes("T007"));
  });

  it("should detect console.debug", () => {
    const issues = lintCode(`console.debug("debug");\n`);
    assert.ok(rulesOf(issues).includes("T007"));
  });

  it("should not flag console.error", () => {
    const issues = lintCode(`console.error("error");\n`);
    assert.ok(!rulesOf(issues).includes("T007"));
  });
});

describe("T008: magic numbers", () => {
  it("should detect magic numbers in comparisons", () => {
    const issues = lintCode(`if (x > 42) {}\n`);
    assert.ok(rulesOf(issues).includes("T008"));
  });

  it("should allow common numbers (0, 1, 2)", () => {
    const issues = lintCode(`if (x === 0) {}\nif (y === 1) {}\n`);
    assert.ok(!rulesOf(issues).includes("T008"));
  });
});

describe("T009: long functions", () => {
  it("should detect functions over 50 lines", () => {
    const lines = Array.from(
      { length: 55 },
      (_, i) => `  const v${i} = ${i};`
    );
    const source = `function longFunc() {\n${lines.join("\n")}\n  return 0;\n}\n`;
    const issues = lintCode(source);
    assert.ok(rulesOf(issues).includes("T009"));
  });

  it("should not flag short functions", () => {
    const issues = lintCode(`function short() {\n  return 1;\n}\n`);
    assert.ok(!rulesOf(issues).includes("T009"));
  });
});

describe("T010: nesting depth", () => {
  it("should detect deep nesting", () => {
    const source = `
if (true) {
  if (true) {
    if (true) {
      if (true) {
        if (true) {
          const x = 1;
        }
      }
    }
  }
}
`;
    const issues = lintCode(source);
    assert.ok(rulesOf(issues).includes("T010"));
  });

  it("should not flag shallow nesting", () => {
    const issues = lintCode(
      `if (true) {\n  if (true) {\n    const x = 1;\n  }\n}\n`
    );
    assert.ok(!rulesOf(issues).includes("T010"));
  });
});

describe("syntax errors", () => {
  it("should report syntax errors", () => {
    const issues = lintCode(`function foo(\n`);
    assert.ok(rulesOf(issues).includes("T000"));
  });
});

describe("clean code", () => {
  it("should have no errors for clean code", () => {
    const source = `/** Add numbers. */\nfunction add(a, b) {\n  return a + b;\n}\n`;
    const issues = lintCode(source);
    const errors = issues.filter((i) => i.severity === "error");
    assert.strictEqual(errors.length, 0);
  });
});

describe("output formatting", () => {
  it("should show praise for clean code", () => {
    const output = formatTerminal([]);
    assert.ok(output.includes("💝"));
  });

  it("should include rule in terminal output", () => {
    const issues = lintCode(`import fs from 'fs';\nconst x = 1;\n`);
    const output = formatTerminal(issues);
    assert.ok(output.includes("T001"));
  });

  it("should produce valid JSON output", () => {
    const issues = lintCode(`import fs from 'fs';\nconst x = 1;\n`);
    const output = formatJSON(issues);
    const data = JSON.parse(output);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    assert.ok("tsundere" in data[0]);
  });
});

describe("file and directory linting", () => {
  it("should lint example bad_code.js", () => {
    const examplesDir = path.join(__dirname, "..", "examples");
    const badCodePath = path.join(examplesDir, "bad_code.js");
    const issues = lintFile(badCodePath);
    assert.ok(issues.length > 0);
  });

  it("should lint example directory", () => {
    const examplesDir = path.join(__dirname, "..", "examples");
    const issues = lintDirectory(examplesDir);
    assert.ok(issues.length > 0);
  });

  it("should return error for non-existent file", () => {
    const issues = lintFile("non_existent_file.js");
    assert.ok(rulesOf(issues).includes("T000"));
  });
});
