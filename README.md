<div align="center">

# 💢 tsundere-js-linter

### A JavaScript linter that reviews your code with tsundere attitude

*Real static analysis. Real attitude.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-131%2F131%20passing-brightgreen)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-blue)]()
[![Rules](https://img.shields.io/badge/lint%20rules-18-orange)]()
[![Language](https://img.shields.io/badge/lang-日本語-ff69b4)]()

---

**べ、別にあんたのコードが気になったわけじゃないんだからね！**

JavaScriptの静的解析ルール18個を搭載した、ツンデレ口調でコードレビューしてくれるlinter。

Inspired by [@urokiurotsuki/tsundere-linter](https://github.com/urokiurotsuki/tsundere-linter)
</div>

---

## ✨ Demo

```
📁 bad_code.js
────────────────────────────────────────────────────────────
  L3    [T001] 💭 し、仕方ないから教えてあげるけど… 'crypto' をインポートしてるけど
                  使ってないじゃない！ …直した方がいいんじゃない？知らないけど。

  L13   [T006] 🔧 💢 ちょっと！ `==` じゃなくて `===` を使いなさいよ！型の比較を曖昧に
                  しないで あたしがいなかったらどうするつもりだったの？

  L32   [T005] 💢 何やってんのよ！ 空のcatchブロックとか最悪！ちゃんとエラー処理を
                  書きなさい 早く直しなさいよ！

  L14   [T010] 💭 まぁ…あんたにしては頑張ってるけど… ネストが5段!?
                  インデントの迷宮を作らないで …別にあんたの好きにすればいいけど。
  🔁 [T001] また「未使用のimport / require」…これで3回目よ？
────────────────────────────────────────────────────────────

💝 20個見つけちゃった…。べ、別にあんたのコードを隅々まで読んだわけじゃないんだからね。
   💢 Error: 2  💭 Warning: 10  💬 Info: 8
   🔧 1個は --fix で直せるわよ。…べ、別に手伝いたいわけじゃないけど！
```

コードがきれいな時

```
💝 ふ、ふん…まぁ、今回はミスがなかっただけよ。別に褒めてないんだからね！
```

## 🚀 Quick Start

```bash
git clone https://github.com/zawataku/tsundere-js-linter.git
cd tsundere-js-linter
npm install

# ファイルをlint
node src/cli.js your_code.js

# ディレクトリをlint（複数指定もOK）
node src/cli.js ./src ./lib

# 直せるものは自動修正
node src/cli.js ./src --fix

# examplesで動作確認
npm run lint
```

対象の拡張子は `.js` / `.mjs` / `.cjs` / `.jsx` です。

- `.mjs` は ES モジュール、`.cjs` は CommonJS として読みます
- `.js` / `.jsx` は ES モジュールとして読み、だめなら CommonJS として読み直します
- JSX は [acorn-jsx](https://github.com/acornjs/acorn-jsx) でパースします

## 📏 Lint Rules

18個のルールで静的解析を行います（[acorn](https://github.com/acornjs/acorn) AST解析）。
🔧 が付いているルールは `--fix` で自動修正できます。

| Rule | Name | Severity | What It Catches |
|------|------|:--------:|-----------------|
| **T001** | `unused-imports` | ⚠️ Warning | 未使用のimport / require |
| **T002** | `max-line-length` | ⚠️ Warning | 行の長さ超過（デフォルト: 120文字） |
| **T003** | `missing-jsdoc` | ℹ️ Info | JSDocがない関数/クラス |
| **T004** | `todo-comments` | ⚠️ Warning | TODO / FIXME / HACK / XXX コメント |
| **T005** | `empty-catch` | 🔴 Error | 空のcatchブロック |
| **T006** 🔧 | `loose-equality` | 🔴 Error | `==` / `!=` の使用（`===` / `!==` を使うべき） |
| **T007** | `console-log` | ℹ️ Info | `console.log()` 等の使用（ロガーを使うべき） |
| **T008** | `magic-numbers` | ℹ️ Info | マジックナンバー |
| **T009** | `long-functions` | ⚠️ Warning | 長すぎる関数（50行超） |
| **T010** | `nesting-depth` | ⚠️ Warning | ネストが深すぎる（4段超） |
| **T011** | `no-var` | ⚠️ Warning | `var` の使用 |
| **T012** 🔧 | `no-debugger` | 🔴 Error | `debugger` 文の消し忘れ |
| **T013** | `no-eval` | 🔴 Error | `eval()` / `new Function()` の使用 |
| **T014** | `duplicate-keys` | 🔴 Error | オブジェクトリテラルのキー重複 |
| **T015** | `unreachable-code` | ⚠️ Warning | `return` / `throw` などの後の到達不能コード |
| **T016** | `async-without-await` | ℹ️ Info | `await` のない `async` 関数 |
| **T017** | `too-many-params` | ⚠️ Warning | 引数が多すぎる関数（4個超） |
| **T018** 🔧 | `trailing-spaces` | ℹ️ Info | 行末の空白 |

自動修正は、意味が変わらない場合にだけ行います。

- **T006**: `typeof x == "string"` や、同じ型のリテラル同士の比較だけを `===` に直します。`x == 1` のように型が変わりうる比較は直しません。
- **T012**: 文として独立している `debugger` だけを消します。`if (x) debugger;` のようなものは消しません。
- **T018**: テンプレートリテラルの中の空白は値の一部なので消しません。

## 💬 Feedbacks

フィードバックは3段階あります

| Severity | Example |
|----------|---------|
| 💢 Error | 「はぁ!? 空のcatchブロックとか最悪！早く直しなさいよ！」 |
| 💭 Warning | 「べ、別に気になったわけじゃないけど…直した方がいいんじゃない？知らないけど。」 |
| 💬 Info | 「ふーん…console.log()使ってるの？…まぁ、どうでもいいけど。」 |

メッセージはプールからランダムに選ばれるので、実行するたびに違う反応が返ってきます。

指摘以外にも、こんな場面で反応します。

| 場面 | Example |
|------|---------|
| 🔁 同じファイルで同じミスを3回以上 | 「`==` / `!=` の使用」が5回も!? 何回言わせるのよ！ |
| 🔧 `--fix` で直せる指摘がある | 3個は --fix で直せるわよ。…べ、別に手伝いたいわけじゃないけど！ |
| 🔧 `--fix` で直した | し、仕方ないから3個直しておいてあげたわよ。…感謝しなさいよね！ |
| 🙈 無効化コメントで指摘を消した | 無効化コメントで2個も隠してるじゃない…あたしの目はごまかせないわよ。 |

## ⚙️ Options

```bash
tsundere-lint-js <path...>                    # ファイルまたはディレクトリをlint（複数可）
tsundere-lint-js <path> --fix                 # 直せる指摘を自動修正
tsundere-lint-js <path> --format github       # 出力形式 terminal / json / github
tsundere-lint-js <path> --json                # --format json と同じ
tsundere-lint-js <path> --config my.json      # 設定ファイルを指定
tsundere-lint-js <path> --max-line-length 80  # 行長カスタマイズ（設定ファイルより優先）
tsundere-lint-js <path> --no-banner           # バナー非表示
tsundere-lint-js --staged                     # git にステージされた内容だけをlint
tsundere-lint-js --install-hook               # pre-commit フックをインストール
```

## 🛠️ Configuration（.tsundererc.json）

カレントディレクトリから親へ向かって `.tsundererc.json` を探して読み込みます。`--config` で直接指定することもできます。

```json
{
  "rules": {
    "T007": "off",
    "loose-equality": "warning",
    "T002": { "max": 100 },
    "T008": { "severity": "warning", "allowed": [0, 1, 2, 10, 60] }
  },
  "ignorePatterns": ["dist/", "*.min.js", "src/generated/**"],
  "extensions": [".js", ".mjs", ".cjs", ".jsx"]
}
```

| Key | 説明 |
|-----|------|
| `rules` | ルールID（`T007`）か名前（`console-log`）をキーに、`"off"` / 重要度（`"error"` / `"warning"` / `"info"`）/ `{ "severity": ..., ...オプション }` を指定 |
| `ignorePatterns` | 無視するファイル・ディレクトリのglob。設定ファイルの場所からの相対パスで、`/` を含まないパターンはどの階層にもマッチ |
| `extensions` | lint対象の拡張子 |

ルールごとのオプションは次のとおりです。

| Rule | Option | Default |
|------|--------|---------|
| T002 | `max` | `120` |
| T008 | `allowed` | `[0, 1, 2, -1, 100, 0.5]` |
| T009 | `max` | `50` |
| T010 | `max` | `4` |
| T017 | `max` | `4` |

存在しないルールやオプション、型の違う値を書くと、ツンデレに怒られて終了コード `2` で止まります。

## 🙈 Disable Comments

コメントでルールを一時的に黙らせることができます。ルールはIDでも名前でも書けて、省略すると全ルールが対象です。`--` 以降は理由として無視されます。

```js
// tsundere-disable-next-line T007 -- デバッグ用に残しておく
console.log(value);

if (a == b) {} // tsundere-disable-line loose-equality

/* tsundere-disable T008, T009 */
// ...この範囲は T008 と T009 を無視...
/* tsundere-enable T008, T009 */
```

存在しないルールを書いた場合は、全ルールを無効にしたりせず警告を出します。

## 🔧 JSON Output（CI/CD Integration）

```bash
node src/cli.js your_code.js --json
```

```json
[
  {
    "file": "your_code.js",
    "line": 3,
    "col": 7,
    "severity": "warning",
    "rule": "T001",
    "message": "'crypto' をインポートしてるけど使ってないじゃない！",
    "tsundere": "一応言っておくけど… 'crypto' を...",
    "fixable": false
  }
]
```

終了コード: `0` = エラーなし, `1` = エラーあり, `2` = 引数や設定ファイルの間違い。CIパイプラインで利用できます。

## 🐙 GitHub Actions

`--format github` を付けると、[ワークフローコマンド](https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions)形式で出力します。PRの差分にツンデレな注釈が付きます（Info は notice として表示されます）。

```yaml
name: tsundere-lint
on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install --save-dev github:zawataku/tsundere-js-linter
      - run: npx tsundere-lint-js src --format github
```

## 🪝 Pre-commit Hook

### フックを直接インストール

```bash
npx tsundere-lint-js --install-hook
```

`.git/hooks/pre-commit` に、コミットのたびに `--staged` でlintするフックを作ります。

- `--staged` は作業ツリーではなく、ステージされた内容をlintします
- すでに別の pre-commit フックがある場合や、husky などで `core.hooksPath` を使っている場合は上書きしません。代わりに、既存のフックに `npx tsundere-lint-js --staged --no-banner` を書き足すよう案内します

### pre-commit フレームワーク

[pre-commit](https://pre-commit.com) を使っている場合は、`.pre-commit-config.yaml` に次のように書きます。

```yaml
repos:
  - repo: https://github.com/zawataku/tsundere-js-linter
    rev: <tag or commit SHA>
    hooks:
      - id: tsundere-js-linter
```

## 🧩 Adding Rules

ルールは `src/rules/` に1ファイルずつ置き、`src/rules/index.js` に登録します。

```js
module.exports = {
  id: "T019",
  name: "my-rule",
  description: "このルールが見つけるもの",
  severity: "warning",
  defaultOptions: {},

  check(context) {
    context.walkSimple({
      DebuggerStatement(node) {
        context.report({ node, message: "ツンデレなメッセージ" });
      },
    });
  },
};
```

`context` には次のものが入っています。

- `ast`、`source`、`sourceLines`、`comments`、`options`
- `walkSimple(visitors)` / `walkAncestor(visitors)`: JSX にも対応した acorn-walk
- `report({ node | loc, message, fix? })`: 指摘を報告する

## 🧪 Tests

```bash
npm test
```

```
▶ T001: unused imports
  ✔ should detect unused imports
  ✔ should not flag used imports
▶ T002: line length
  ✔ should detect long lines
  ✔ should not flag short lines
  ...

ℹ tests 131
ℹ pass 131
ℹ fail 0
💝 べ、別に全部パスして嬉しいわけじゃないんだからね！
```

## 📜 License

MIT License — べ、別にあんたに自由に使ってほしいわけじゃないんだからね！

---

<div align="center">

*「あたしがいなかったらどうするつもりだったの？」*

**⭐ Star this repo. ...べ、別にスターが欲しいわけじゃないんだからね！ ⭐**

</div>
