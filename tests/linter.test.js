const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { lintSource, lintFile, lintDirectory } = require("../src/linter");
const { formatTerminal, formatJSON } = require("../src/formatter");
const { rules, findRule } = require("../src/rules");

function lintCode(source, config) {
  return lintSource(source, "test.js", config).issues;
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

describe("bug fixes", () => {
  it("should respect maxLineLength option", () => {
    const source = `const x = "${"a".repeat(90)}";\n`;
    assert.ok(!rulesOf(lintCode(source)).includes("T002"));
    const issues = lintCode(source, { rules: { T002: { max: 80 } } });
    assert.ok(rulesOf(issues).includes("T002"));
  });

  it("should fill tsundere text for syntax errors", () => {
    const [issue] = lintCode(`function foo(\n`);
    assert.ok(issue.tsundere.includes("SyntaxError"));
  });

  it("should fill tsundere text for missing files", () => {
    const [issue] = lintFile("non_existent_file.js").issues;
    assert.ok(issue.tsundere.includes("non_existent_file.js"));
  });

  it("should detect TODO in block comments", () => {
    const issues = lintCode(`/*\n * TODO: later\n */\nconst x = 1;\n`);
    const todo = issues.find((i) => i.rule === "T004");
    assert.ok(todo);
    assert.strictEqual(todo.line, 2);
  });

  it("should not detect TODO inside strings", () => {
    const issues = lintCode(`const url = "http://example.com/// TODO";\n`);
    assert.ok(!rulesOf(issues).includes("T004"));
  });

  it("should not treat a distant JSDoc as the function's JSDoc", () => {
    const source = `/** Unrelated. */\nconst a = 1;\n/* plain */\nfunction hello() {\n  return a;\n}\n`;
    assert.ok(rulesOf(lintCode(source)).includes("T003"));
  });

  it("should accept JSDoc before export", () => {
    const source = `/** Say hello. */\nexport function hello() {\n  return 1;\n}\n`;
    assert.ok(!rulesOf(lintCode(source)).includes("T003"));
  });

  it("should allow null == x comparison", () => {
    assert.ok(!rulesOf(lintCode(`if (null == x) {}\n`)).includes("T006"));
  });

  it("should report the actual column", () => {
    const issue = lintCode(`const y = 1;\nif (y == 2) {}\n`).find(
      (i) => i.rule === "T006"
    );
    assert.strictEqual(issue.col, 4);
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
    const result = lintSource(`import fs from 'fs';\nconst x = 1;\n`, "test.js");
    const output = formatTerminal([result]);
    assert.ok(output.includes("T001"));
  });

  it("should produce valid JSON output", () => {
    const result = lintSource(`import fs from 'fs';\nconst x = 1;\n`, "test.js");
    const output = formatJSON([result]);
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
    const { issues } = lintFile(badCodePath);
    assert.ok(issues.length > 0);
  });

  it("should lint example directory", () => {
    const examplesDir = path.join(__dirname, "..", "examples");
    const results = lintDirectory(examplesDir);
    assert.ok(results.flatMap((r) => r.issues).length > 0);
  });

  it("should return error for non-existent file", () => {
    const { issues } = lintFile("non_existent_file.js");
    assert.ok(rulesOf(issues).includes("T000"));
  });
});

describe("T001: require and re-export", () => {
  it("should detect unused require", () => {
    const issues = lintCode(`const fs = require("fs");\nconst x = 1;\n`);
    assert.ok(rulesOf(issues).includes("T001"));
  });

  it("should detect unused destructured require bindings", () => {
    const issues = lintCode(
      `const { join, resolve: r } = require("path");\njoin("a");\n`
    );
    const names = issues.filter((i) => i.rule === "T001").map((i) => i.message);
    assert.strictEqual(names.length, 1);
    assert.ok(names[0].includes("'r'"));
  });

  it("should not flag used require", () => {
    const issues = lintCode(`const fs = require("fs");\nfs.readFileSync("a");\n`);
    assert.ok(!rulesOf(issues).includes("T001"));
  });

  it("should treat re-exported imports as used", () => {
    const issues = lintCode(`import x from "y";\nexport { x };\n`);
    assert.ok(!rulesOf(issues).includes("T001"));
  });
});

describe("T011: no-var", () => {
  it("should detect var", () => {
    assert.ok(rulesOf(lintCode(`var x = 1;\n`)).includes("T011"));
  });

  it("should not flag let/const", () => {
    assert.ok(!rulesOf(lintCode(`let x = 1;\nconst y = x;\n`)).includes("T011"));
  });
});

describe("T012: no-debugger", () => {
  it("should detect debugger", () => {
    assert.ok(rulesOf(lintCode(`debugger;\n`)).includes("T012"));
  });
});

describe("T013: no-eval", () => {
  it("should detect eval and new Function", () => {
    const issues = lintCode(`eval("1");\nconst f = new Function("return 1");\n`);
    assert.strictEqual(issues.filter((i) => i.rule === "T013").length, 2);
  });

  it("should not flag methods named eval", () => {
    assert.ok(!rulesOf(lintCode(`obj.eval("1");\n`)).includes("T013"));
  });
});

describe("T014: duplicate keys", () => {
  it("should detect duplicate keys", () => {
    const issues = lintCode(`const o = { a: 1, "a": 2 };\n`);
    assert.ok(rulesOf(issues).includes("T014"));
  });

  it("should allow getter/setter pairs", () => {
    const issues = lintCode(`const o = { get a() { return 1; }, set a(v) {} };\n`);
    assert.ok(!rulesOf(issues).includes("T014"));
  });

  it("should not flag computed keys", () => {
    const issues = lintCode(`const k = "a";\nconst o = { [k]: 1, [k]: 2 };\n`);
    assert.ok(!rulesOf(issues).includes("T014"));
  });
});

describe("T015: unreachable code", () => {
  it("should detect code after return", () => {
    const issues = lintCode(`function f() {\n  return 1;\n  f();\n}\n`);
    const issue = issues.find((i) => i.rule === "T015");
    assert.strictEqual(issue.line, 3);
  });

  it("should detect code after break in switch", () => {
    const issues = lintCode(`switch (x) {\n  case 1:\n    break;\n    f();\n}\n`);
    assert.ok(rulesOf(issues).includes("T015"));
  });

  it("should allow hoisted function declarations after return", () => {
    const issues = lintCode(`function f() {\n  return g();\n  function g() { return 1; }\n}\n`);
    assert.ok(!rulesOf(issues).includes("T015"));
  });
});

describe("T016: async without await", () => {
  it("should detect async function without await", () => {
    const issues = lintCode(`async function f() {\n  return 1;\n}\n`);
    assert.ok(rulesOf(issues).includes("T016"));
  });

  it("should not count await in nested functions", () => {
    const issues = lintCode(`async function f() {\n  return async () => { await g(); };\n}\n`);
    assert.strictEqual(issues.filter((i) => i.rule === "T016").length, 1);
  });

  it("should accept for await", () => {
    const issues = lintCode(`async function f(xs) {\n  for await (const x of xs) g(x);\n}\n`);
    assert.ok(!rulesOf(issues).includes("T016"));
  });
});

describe("T017: too many params", () => {
  it("should detect too many params", () => {
    const issues = lintCode(`const f = (a, b, c, d, e) => a;\n`);
    assert.ok(rulesOf(issues).includes("T017"));
  });

  it("should respect max option", () => {
    const issues = lintCode(`const f = (a, b, c) => a;\n`, { rules: { T017: { max: 2 } } });
    assert.ok(rulesOf(issues).includes("T017"));
  });
});

describe("T018: trailing spaces", () => {
  it("should detect trailing spaces", () => {
    const issues = lintCode(`const x = 1;  \nconst y = 2;\t\r\n`);
    assert.strictEqual(issues.filter((i) => i.rule === "T018").length, 2);
  });

  it("should ignore whitespace inside template literals", () => {
    const issues = lintCode("const s = `a  \nb`;\n");
    assert.ok(!rulesOf(issues).includes("T018"));
  });
});

describe("--fix", () => {
  function fix(source, config) {
    return lintSource(source, "test.js", config, { fix: true });
  }

  it("should fix typeof comparisons", () => {
    const result = fix(`if (typeof x == "string") {}\nif ("a" != typeof y) {}\n`);
    assert.strictEqual(
      result.output,
      `if (typeof x === "string") {}\nif ("a" !== typeof y) {}\n`
    );
    assert.strictEqual(result.fixed, 2);
    assert.ok(!rulesOf(result.issues).includes("T006"));
  });

  it("should fix the operator even with parentheses and comments", () => {
    const result = fix(`if ((typeof x) /* == */ == ("a")) {}\n`);
    assert.strictEqual(result.output, `if ((typeof x) /* == */ === ("a")) {}\n`);
  });

  it("should not fix comparisons whose meaning would change", () => {
    const source = `if (x == 1) {}\n`;
    const result = fix(source);
    assert.strictEqual(result.output, source);
    assert.ok(rulesOf(result.issues).includes("T006"));
  });

  it("should remove debugger lines", () => {
    const result = fix(`function f() {\n  debugger;\n  return 1;\n}\nf();\n`);
    assert.strictEqual(result.output, `function f() {\n  return 1;\n}\nf();\n`);
  });

  it("should not remove debugger used as an if body", () => {
    const source = `if (x) debugger;\n`;
    assert.strictEqual(fix(source).output, source);
  });

  it("should remove trailing spaces but keep CRLF", () => {
    const result = fix(`const x = 1;  \r\nconst y = 2;\r\n`);
    assert.strictEqual(result.output, `const x = 1;\r\nconst y = 2;\r\n`);
  });

  it("should not fix suppressed or disabled issues", () => {
    const source = `debugger; // tsundere-disable-line\nconst x = 1;  \n`;
    const result = fix(source, { rules: { T018: "off" } });
    assert.strictEqual(result.output, source);
  });

  it("should apply fixes from multiple rules in one run", () => {
    const result = fix(`debugger;\nif (typeof x == "string") {}   \n`);
    assert.strictEqual(result.output, `if (typeof x === "string") {}\n`);
  });

  it("should write fixed files and mark fixable issues", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tsundere-fix-"));
    const file = path.join(dir, "a.js");
    try {
      fs.writeFileSync(file, `const x = 1;  \n`);
      const result = lintFile(file, {}, { fix: true });
      assert.strictEqual(fs.readFileSync(file, "utf-8"), `const x = 1;\n`);
      assert.strictEqual(result.fixed, 1);

      fs.writeFileSync(file, `const x = 1;  \n`);
      const data = JSON.parse(formatJSON([lintFile(file)]));
      assert.ok(data.find((i) => i.rule === "T018").fixable);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("file types", () => {
  it("should parse JSX and treat JSX usage as import usage", () => {
    const source = [
      `import Button from "./Button";`,
      `import Icon from "./Icon";`,
      `import UI from "./ui";`,
      `export const App = () => (`,
      `  <div className="app" {...props}>`,
      `    <Button onClick={() => x == 1} />`,
      `    <UI.Card>{/* TODO: later */}</UI.Card>`,
      `    <>text</>`,
      `  </div>`,
      `);`,
    ].join("\n");
    const issues = lintSource(source, "App.jsx").issues;
    const unused = issues.filter((i) => i.rule === "T001").map((i) => i.message);
    assert.strictEqual(unused.length, 1);
    assert.ok(unused[0].includes("'Icon'"));
    assert.ok(rulesOf(issues).includes("T006"));
    assert.ok(rulesOf(issues).includes("T004"));
    assert.ok(!rulesOf(issues).includes("T000"));
  });

  it("should parse .cjs as CommonJS (top-level return)", () => {
    const issues = lintSource(`if (x) return;\nmodule.exports = 1;\n`, "a.cjs").issues;
    assert.ok(!rulesOf(issues).includes("T000"));
  });

  it("should fall back to script for .js", () => {
    const issues = lintSource(`with (obj) { a(); }\n`, "a.js").issues;
    assert.ok(!rulesOf(issues).includes("T000"));
  });

  it("should parse .mjs strictly as a module", () => {
    const issues = lintSource(`with (obj) { a(); }\n`, "a.mjs").issues;
    assert.ok(rulesOf(issues).includes("T000"));
  });

  it("should lint configured extensions in directories", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tsundere-ext-"));
    try {
      for (const name of ["a.js", "b.mjs", "c.cjs", "d.jsx", "e.ts", "f.txt"]) {
        fs.writeFileSync(path.join(dir, name), "var x = 1;\n");
      }
      const names = (config) =>
        lintDirectory(dir, config).map((r) => path.basename(r.filepath)).sort();
      assert.deepStrictEqual(names({}), ["a.js", "b.mjs", "c.cjs", "d.jsx"]);
      assert.deepStrictEqual(names({ extensions: [".mjs"] }), ["b.mjs"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("inline disable comments", () => {
  it("should disable the next line", () => {
    const result = lintSource(
      `// tsundere-disable-next-line T006\nif (x == 1) {}\nif (y == 1) {}\n`,
      "test.js"
    );
    const t006 = result.issues.filter((i) => i.rule === "T006");
    assert.deepStrictEqual(t006.map((i) => i.line), [3]);
    assert.strictEqual(result.suppressed.length, 1);
  });

  it("should disable the same line", () => {
    const issues = lintCode(`if (x == 1) {} // tsundere-disable-line\n`);
    assert.ok(!rulesOf(issues).includes("T006"));
  });

  it("should accept rule names and a reason", () => {
    const issues = lintCode(
      `// tsundere-disable-next-line loose-equality, T008 -- legacy API\nif (x == 42) {}\n`
    );
    assert.ok(!rulesOf(issues).includes("T006"));
    assert.ok(!rulesOf(issues).includes("T008"));
  });

  it("should only disable the listed rules", () => {
    const issues = lintCode(
      `// tsundere-disable-next-line T008\nif (x == 42) {}\n`
    );
    assert.ok(rulesOf(issues).includes("T006"));
    assert.ok(!rulesOf(issues).includes("T008"));
  });

  it("should disable a range until enable", () => {
    const source = [
      "if (a == 1) {}",
      "/* tsundere-disable T006 */",
      "if (b == 1) {}",
      "if (c == 1) {}",
      "/* tsundere-enable T006 */",
      "if (d == 1) {}",
    ].join("\n");
    const lines = lintCode(source)
      .filter((i) => i.rule === "T006")
      .map((i) => i.line);
    assert.deepStrictEqual(lines, [1, 6]);
  });

  it("should re-enable a single rule inside disable-all", () => {
    const source = [
      "/* tsundere-disable */",
      "/* tsundere-enable T006 */",
      "if (x == 42) {}",
    ].join("\n");
    const issues = lintCode(source);
    assert.ok(rulesOf(issues).includes("T006"));
    assert.ok(!rulesOf(issues).includes("T008"));
  });

  it("should warn about unknown rules without disabling everything", () => {
    const issues = lintCode(
      `// tsundere-disable-next-line T999\nif (x == 1) {}\n`
    );
    assert.ok(rulesOf(issues).includes("T006"));
    const problem = issues.find((i) => i.rule === "T000");
    assert.ok(problem.message.includes("T999"));
  });

  it("should react to suppressed issues in terminal output", () => {
    const result = lintSource(
      `/** A. */\nfunction a() {\n  return 1; // tsundere-disable-line\n}\n// tsundere-disable-next-line\nif (x == 1) {}\n`,
      "test.js"
    );
    const output = formatTerminal([result]);
    assert.ok(output.includes("🙈"));
  });
});

describe("rule registry", () => {
  it("should have unique ids and names", () => {
    const keys = rules.flatMap((r) => [r.id, r.name]);
    assert.strictEqual(new Set(keys).size, keys.length);
  });

  it("should find rules by id or name", () => {
    assert.strictEqual(findRule("T006"), findRule("loose-equality"));
    assert.strictEqual(findRule("nope"), undefined);
  });

  it("should turn rules off", () => {
    const issues = lintCode(`if (x == 1) {}\n`, { rules: { T006: "off" } });
    assert.ok(!rulesOf(issues).includes("T006"));
  });

  it("should override severity", () => {
    const issues = lintCode(`if (x == 1) {}\n`, { rules: { T006: "warning" } });
    assert.strictEqual(issues.find((i) => i.rule === "T006").severity, "warning");
  });

  it("should override severity and options together", () => {
    const issues = lintCode(`if (x > 42) {}\n`, {
      rules: { T008: { severity: "warning", allowed: [42] } },
    });
    assert.ok(!rulesOf(issues).includes("T008"));
  });
});
