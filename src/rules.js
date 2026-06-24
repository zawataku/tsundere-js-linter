const acorn = require("acorn");
const walk = require("acorn-walk");

const MESSAGES = {
  T001: (name) => `'${name}' をインポートしてるけど使ってないじゃない！`,
  T002: (length, max) =>
    `この行${length}文字もあるんだけど!? (${max}文字以内にしなさいよ)`,
  T003_func: (name) =>
    `関数 '${name}' にJSDocがないんだけど？説明くらい書きなさいよ`,
  T003_class: (name) =>
    `クラス '${name}' にJSDocがないんだけど？説明くらい書きなさいよ`,
  T004: (tag) =>
    `'${tag}' って書いてあるけど、いつ直すつもり？放置しないでよね`,
  T005: "空のcatchブロックとか最悪！ちゃんとエラー処理を書きなさい",
  T006: "`==` じゃなくて `===` を使いなさいよ！型の比較を曖昧にしないで",
  T006_ne: "`!=` じゃなくて `!==` を使いなさいよ！型の比較を曖昧にしないで",
  T007: "console.log()使ってるの？本番コードならちゃんとしたロガーを使いなさいよ",
  T008: (value) => `マジックナンバー ${value} って何？定数に名前つけなさいよ`,
  T009: (name, lines) =>
    `関数 '${name}' が${lines}行もあるんだけど!? 分割しなさいよ`,
  T010: (depth) => `ネストが${depth}段!? インデントの迷宮を作らないで`,
};

function checkUnusedImports(ast, sourceLines, filepath) {
  const issues = [];
  const imports = [];

  const importRanges = [];
  walk.simple(ast, {
    ImportDeclaration(node) {
      importRanges.push({ start: node.start, end: node.end });
      for (const spec of node.specifiers) {
        imports.push({
          name: spec.local.name,
          line: node.loc.start.line,
          source: node.source.value,
        });
      }
    },
  });

  if (imports.length === 0) return issues;

  const importedNames = new Set(imports.map((i) => i.name));
  const usedNames = new Set();
  walk.simple(ast, {
    Identifier(node) {
      if (!importedNames.has(node.name)) return;
      const inImport = importRanges.some(
        (r) => node.start >= r.start && node.end <= r.end
      );
      if (!inImport) usedNames.add(node.name);
    },
  });

  for (const imp of imports) {
    if (!usedNames.has(imp.name)) {
      issues.push({
        filepath,
        line: imp.line,
        col: 0,
        severity: "warning",
        rule: "T001",
        message: MESSAGES.T001(imp.name),
      });
    }
  }
  return issues;
}

function checkLineLength(sourceLines, filepath, maxLen = 120) {
  const issues = [];
  for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i].replace(/\r$/, "");
    if (line.length > maxLen) {
      issues.push({
        filepath,
        line: i + 1,
        col: maxLen,
        severity: "warning",
        rule: "T002",
        message: MESSAGES.T002(line.length, maxLen),
      });
    }
  }
  return issues;
}

function checkMissingJSDoc(ast, source, filepath) {
  const issues = [];
  const sourceLines = source.split("\n");

  function hasJSDocBefore(node) {
    const lineAbove = node.loc.start.line - 2;
    if (lineAbove < 0) return false;
    for (let i = lineAbove; i >= 0; i--) {
      const trimmed = sourceLines[i].trim();
      if (trimmed === "") continue;
      if (trimmed.endsWith("*/")) {
        for (let j = i; j >= 0; j--) {
          if (sourceLines[j].trim().startsWith("/**")) return true;
        }
        return false;
      }
      return false;
    }
    return false;
  }

  walk.simple(ast, {
    FunctionDeclaration(node) {
      if (node.id && !node.id.name.startsWith("_") && !hasJSDocBefore(node)) {
        issues.push({
          filepath,
          line: node.loc.start.line,
          col: 0,
          severity: "info",
          rule: "T003",
          message: MESSAGES.T003_func(node.id.name),
        });
      }
    },
    ClassDeclaration(node) {
      if (node.id && !hasJSDocBefore(node)) {
        issues.push({
          filepath,
          line: node.loc.start.line,
          col: 0,
          severity: "info",
          rule: "T003",
          message: MESSAGES.T003_class(node.id.name),
        });
      }
    },
  });

  return issues;
}

function checkTodoFixme(sourceLines, filepath) {
  const issues = [];
  const pattern = /\/\/\s*(TODO|FIXME|HACK|XXX)\b/i;
  for (let i = 0; i < sourceLines.length; i++) {
    const match = sourceLines[i].match(pattern);
    if (match) {
      issues.push({
        filepath,
        line: i + 1,
        col: match.index,
        severity: "warning",
        rule: "T004",
        message: MESSAGES.T004(match[1].toUpperCase()),
      });
    }
  }
  return issues;
}

function checkEmptyCatch(ast, filepath) {
  const issues = [];
  walk.simple(ast, {
    TryStatement(node) {
      if (node.handler) {
        const body = node.handler.body.body;
        if (body.length === 0) {
          issues.push({
            filepath,
            line: node.handler.loc.start.line,
            col: 0,
            severity: "error",
            rule: "T005",
            message: MESSAGES.T005,
          });
        }
      }
    },
  });
  return issues;
}

function checkLooseEquality(ast, filepath) {
  const issues = [];
  walk.simple(ast, {
    BinaryExpression(node) {
      if (node.operator === "==" || node.operator === "!=") {
        if (
          node.right.type === "Literal" &&
          node.right.value === null
        ) {
          return;
        }
        const msg =
          node.operator === "==" ? MESSAGES.T006 : MESSAGES.T006_ne;
        issues.push({
          filepath,
          line: node.loc.start.line,
          col: node.loc.start.column,
          severity: "error",
          rule: "T006",
          message: msg,
        });
      }
    },
  });
  return issues;
}

function checkConsoleLog(ast, filepath) {
  const issues = [];
  walk.simple(ast, {
    CallExpression(node) {
      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "console" &&
        node.callee.property.type === "Identifier" &&
        ["log", "debug", "info", "warn"].includes(node.callee.property.name)
      ) {
        issues.push({
          filepath,
          line: node.loc.start.line,
          col: 0,
          severity: "info",
          rule: "T007",
          message: MESSAGES.T007,
        });
      }
    },
  });
  return issues;
}

function checkMagicNumbers(ast, filepath) {
  const issues = [];
  const allowed = new Set([0, 1, 2, -1, 0.0, 1.0, 100, 0.5]);

  walk.simple(ast, {
    BinaryExpression(node) {
      const comparisons = ["==", "===", "!=", "!==", "<", ">", "<=", ">="];
      if (!comparisons.includes(node.operator)) return;

      for (const side of [node.left, node.right]) {
        if (side.type === "Literal" && typeof side.value === "number") {
          if (!allowed.has(side.value)) {
            issues.push({
              filepath,
              line: node.loc.start.line,
              col: 0,
              severity: "info",
              rule: "T008",
              message: MESSAGES.T008(side.value),
            });
          }
        }
        if (
          side.type === "UnaryExpression" &&
          side.operator === "-" &&
          side.argument.type === "Literal" &&
          typeof side.argument.value === "number"
        ) {
          const val = -side.argument.value;
          if (!allowed.has(val)) {
            issues.push({
              filepath,
              line: node.loc.start.line,
              col: 0,
              severity: "info",
              rule: "T008",
              message: MESSAGES.T008(val),
            });
          }
        }
      }
    },
  });
  return issues;
}

function checkLongFunctions(ast, filepath, maxLines = 50) {
  const issues = [];

  function checkFunc(node, name) {
    if (!node.loc) return;
    const length = node.loc.end.line - node.loc.start.line;
    if (length > maxLines) {
      issues.push({
        filepath,
        line: node.loc.start.line,
        col: 0,
        severity: "warning",
        rule: "T009",
        message: MESSAGES.T009(name, length),
      });
    }
  }

  walk.simple(ast, {
    FunctionDeclaration(node) {
      checkFunc(node, node.id ? node.id.name : "<anonymous>");
    },
    FunctionExpression(node) {
      const name = node.id ? node.id.name : "<anonymous>";
      checkFunc(node, name);
    },
    ArrowFunctionExpression(node) {
      checkFunc(node, "<arrow>");
    },
  });

  return issues;
}

function checkNestingDepth(ast, filepath, maxDepth = 4) {
  const issues = [];
  const reported = new Set();

  function walkNode(node, depth) {
    const nestingTypes = [
      "IfStatement",
      "ForStatement",
      "ForInStatement",
      "ForOfStatement",
      "WhileStatement",
      "DoWhileStatement",
      "WithStatement",
      "SwitchStatement",
      "TryStatement",
    ];

    if (nestingTypes.includes(node.type)) {
      depth++;
      if (depth > maxDepth && !reported.has(node.loc.start.line)) {
        reported.add(node.loc.start.line);
        issues.push({
          filepath,
          line: node.loc.start.line,
          col: 0,
          severity: "warning",
          rule: "T010",
          message: MESSAGES.T010(depth),
        });
      }
    }

    for (const key of Object.keys(node)) {
      if (key === "type" || key === "loc" || key === "start" || key === "end")
        continue;
      const child = node[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === "string") {
              if (
                item.type === "FunctionDeclaration" ||
                item.type === "FunctionExpression" ||
                item.type === "ArrowFunctionExpression"
              ) {
                walkNode(item, 0);
              } else {
                walkNode(item, depth);
              }
            }
          }
        } else if (typeof child.type === "string") {
          if (
            child.type === "FunctionDeclaration" ||
            child.type === "FunctionExpression" ||
            child.type === "ArrowFunctionExpression"
          ) {
            walkNode(child, 0);
          } else {
            walkNode(child, depth);
          }
        }
      }
    }
  }

  walkNode(ast, 0);
  return issues;
}

module.exports = {
  checkUnusedImports,
  checkLineLength,
  checkMissingJSDoc,
  checkTodoFixme,
  checkEmptyCatch,
  checkLooseEquality,
  checkConsoleLog,
  checkMagicNumbers,
  checkLongFunctions,
  checkNestingDepth,
  MESSAGES,
};
