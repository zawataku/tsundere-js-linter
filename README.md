<div align="center">

# 💢 tsundere-js-linter

### A JavaScript linter that reviews your code with tsundere attitude

*Real static analysis. Real attitude.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-33%2F33%20passing-brightgreen)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-blue)]()
[![Rules](https://img.shields.io/badge/lint%20rules-10-orange)]()
[![Language](https://img.shields.io/badge/lang-日本語-ff69b4)]()

---

**べ、別にあんたのコードが気になったわけじゃないんだからね！**

JavaScriptの静的解析ルール10個を搭載した、ツンデレ口調でコードレビューしてくれるlinter。

Inspired by [@urokiurotsuki/tsundere-linter](https://github.com/urokiurotsuki/tsundere-linter)
</div>

---

## ✨ Demo

```
📁 bad_code.js
────────────────────────────────────────────────────────────
  L3    [T001] 💭 し、仕方ないから教えてあげるけど… 'crypto' をインポートしてるけど
                  使ってないじゃない！ …直した方がいいんじゃない？知らないけど。

  L13   [T006] 💢 ちょっと！ `==` じゃなくて `===` を使いなさいよ！型の比較を曖昧に
                  しないで あたしがいなかったらどうするつもりだったの？

  L32   [T005] 💢 何やってんのよ！ 空のcatchブロックとか最悪！ちゃんとエラー処理を
                  書きなさい 早く直しなさいよ！

  L14   [T010] 💭 まぁ…あんたにしては頑張ってるけど… ネストが5段!?
                  インデントの迷宮を作らないで …別にあんたの好きにすればいいけど。
────────────────────────────────────────────────────────────

💝 20個見つけちゃった…。べ、別にあんたのコードを隅々まで読んだわけじゃないんだからね。
   💢 Error: 2  💭 Warning: 10  💬 Info: 8
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

# ディレクトリをlint
node src/cli.js ./src

# examplesで動作確認
npm run lint
```

## 📏 Lint Rules

10個のルールで静的解析を行います（[acorn](https://github.com/acornjs/acorn) AST解析）

| Rule | Severity | What It Catches |
|------|:--------:|-----------------|
| **T001** | ⚠️ Warning | 未使用のimport |
| **T002** | ⚠️ Warning | 行の長さ超過（デフォルト: 120文字） |
| **T003** | ℹ️ Info | JSDocがない関数/クラス |
| **T004** | ⚠️ Warning | TODO / FIXME / HACK / XXX コメント |
| **T005** | 🔴 Error | 空のcatchブロック |
| **T006** | 🔴 Error | `==` / `!=` の使用（`===` / `!==` を使うべき） |
| **T007** | ℹ️ Info | `console.log()` 等の使用（ロガーを使うべき） |
| **T008** | ℹ️ Info | マジックナンバー |
| **T009** | ⚠️ Warning | 長すぎる関数（50行超） |
| **T010** | ⚠️ Warning | ネストが深すぎる（4段超） |


## 💬 Feedbacks

フィードバックは3段階あります

| Severity | Example |
|----------|---------|
| 💢 Error | 「はぁ!? 空のcatchブロックとか最悪！早く直しなさいよ！」 |
| 💭 Warning | 「べ、別に気になったわけじゃないけど…直した方がいいんじゃない？知らないけど。」 |
| 💬 Info | 「ふーん…console.log()使ってるの？…まぁ、どうでもいいけど。」 |

メッセージはプールからランダムに選ばれるので、実行するたびに違う反応が返ってきます。

## ⚙️ Options

```bash
tsundere-lint-js <path>                       # ファイルまたはディレクトリをlint
tsundere-lint-js <path> --json                # JSON出力（CI連携用）
tsundere-lint-js <path> --max-line-length 80  # 行長カスタマイズ
tsundere-lint-js <path> --no-banner           # バナー非表示
```

## 🔧 JSON Output（CI/CD Integration）

```bash
node src/cli.js your_code.js --json
```

```json
[
  {
    "file": "your_code.js",
    "line": 3,
    "col": 0,
    "severity": "warning",
    "rule": "T001",
    "message": "'crypto' をインポートしてるけど使ってないじゃない！",
    "tsundere": "一応言っておくけど… 'crypto' を..."
  }
]
```

終了コード: `0` = エラーなし, `1` = エラーあり。CIパイプラインで利用できます。

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

ℹ tests 33
ℹ pass 33
ℹ fail 0
💝 べ、別に全部パスして嬉しいわけじゃないんだからね！
```

## 📁 Project Structure

```
tsundere-js-linter/
├── src/
│   ├── index.js         ← パッケージエントリポイント
│   ├── linter.js        ← コアエンジン: AST解析 + パーソナリティ適用
│   ├── rules.js         ← 10個のlintルール
│   ├── personality.js   ← ツンデレメッセージエンジン
│   ├── formatter.js     ← 出力フォーマッタ（ターミナル / JSON）
│   └── cli.js           ← CLIエントリポイント
├── tests/
│   └── linter.test.js   ← 33テスト
├── examples/
│   ├── bad_code.js      ← わざとダメなコード（デモ用）
│   └── good_code.js     ← きれいなコード（しぶしぶ褒められる）
├── package.json
├── LICENSE
└── README.md
```

## 📜 License

MIT License — べ、別にあんたに自由に使ってほしいわけじゃないんだからね！

---

<div align="center">

*「あたしがいなかったらどうするつもりだったの？」*

**⭐ Star this repo. ...べ、別にスターが欲しいわけじゃないんだからね！ ⭐**

</div>
