/**
 * ルール一覧。ルールを追加するときはファイルを作ってここに登録する。
 *
 * ルールの形:
 *   id              "T001" のようなID
 *   name            設定ファイルや無効化コメントでも使える名前
 *   description     READMEやヘルプ用の短い説明
 *   severity        デフォルトの重要度 ("error" | "warning" | "info")
 *   defaultOptions  ルール固有オプションのデフォルト値
 *   check(context)  context.report({ node | loc, message, fix? }) で指摘する
 */
const rules = [
  require("./t001-unused-imports"),
  require("./t002-max-line-length"),
  require("./t003-missing-jsdoc"),
  require("./t004-todo-comments"),
  require("./t005-empty-catch"),
  require("./t006-loose-equality"),
  require("./t007-console-log"),
  require("./t008-magic-numbers"),
  require("./t009-long-functions"),
  require("./t010-nesting-depth"),
  require("./t011-no-var"),
  require("./t012-no-debugger"),
  require("./t013-no-eval"),
  require("./t014-duplicate-keys"),
  require("./t015-unreachable-code"),
  require("./t016-async-without-await"),
  require("./t017-too-many-params"),
];

const byKey = new Map();
for (const rule of rules) {
  byKey.set(rule.id, rule);
  byKey.set(rule.name, rule);
}

/** IDか名前からルールを探す。見つからなければ undefined。 */
function findRule(key) {
  return byKey.get(key);
}

module.exports = { rules, findRule };
