const fs = require("fs");
const path = require("path");
const { findRule } = require("./rules");

const CONFIG_FILENAME = ".tsundererc.json";
const SEVERITIES = ["error", "warning", "info"];
const TOP_LEVEL_KEYS = new Set(["rules", "ignorePatterns", "extensions"]);
const DEFAULT_EXTENSIONS = [".js", ".mjs", ".cjs", ".jsx"];

class ConfigError extends Error {}

function typeOf(value) {
  return Array.isArray(value) ? "array" : typeof value;
}

function checkSeverity(value, where) {
  if (value !== "off" && !SEVERITIES.includes(value)) {
    throw new ConfigError(
      `${where} の重要度 '${value}' って何？ off / ${SEVERITIES.join(" / ")} から選びなさいよ`
    );
  }
}

/** ルール1つ分の設定を検証して返す */
function validateRuleSetting(rule, key, setting) {
  const where = `rules.${key}`;
  if (typeof setting === "string") {
    checkSeverity(setting, where);
    return setting;
  }
  if (typeOf(setting) !== "object") {
    throw new ConfigError(
      `${where} は文字列かオブジェクトで書きなさいよ！`
    );
  }
  const { severity, ...options } = setting;
  if (severity !== undefined) checkSeverity(severity, where);
  for (const [name, value] of Object.entries(options)) {
    if (!(name in rule.defaultOptions)) {
      const known = Object.keys(rule.defaultOptions);
      const hint = known.length
        ? `使えるのは ${known.join(", ")} だけよ`
        : "このルールにオプションはないわよ";
      throw new ConfigError(`${where}.${name} なんてオプションないんだけど？${hint}`);
    }
    const expected = typeOf(rule.defaultOptions[name]);
    if (typeOf(value) !== expected) {
      throw new ConfigError(`${where}.${name} は ${expected} で指定しなさいよ！`);
    }
  }
  return setting;
}

/**
 * 設定オブジェクトを検証し、ルール名をIDに揃えたものを返す。
 * おかしなところがあれば ConfigError を投げる。
 */
function validateConfig(raw) {
  if (typeOf(raw) !== "object") {
    throw new ConfigError("設定はオブジェクトで書きなさいよ！");
  }
  for (const key of Object.keys(raw)) {
    if (!TOP_LEVEL_KEYS.has(key)) {
      throw new ConfigError(`'${key}' なんて設定項目ないわよ`);
    }
  }

  const config = {
    rules: {},
    ignorePatterns: [],
    extensions: DEFAULT_EXTENSIONS,
  };

  if (raw.rules !== undefined) {
    if (typeOf(raw.rules) !== "object") {
      throw new ConfigError("rules はオブジェクトで書きなさいよ！");
    }
    for (const [key, setting] of Object.entries(raw.rules)) {
      const rule = findRule(key);
      if (!rule) {
        throw new ConfigError(`'${key}' なんてルールないんだけど？IDか名前を確認しなさい`);
      }
      config.rules[rule.id] = validateRuleSetting(rule, key, setting);
    }
  }

  if (raw.ignorePatterns !== undefined) {
    const patterns = raw.ignorePatterns;
    if (
      typeOf(patterns) !== "array" ||
      !patterns.every((p) => typeof p === "string")
    ) {
      throw new ConfigError("ignorePatterns は文字列の配列で書きなさいよ！");
    }
    config.ignorePatterns = patterns;
  }

  if (raw.extensions !== undefined) {
    const exts = raw.extensions;
    if (
      typeOf(exts) !== "array" ||
      exts.length === 0 ||
      !exts.every((e) => typeof e === "string" && /^\.\w+$/.test(e))
    ) {
      throw new ConfigError(
        'extensions は ".js" みたいな拡張子の配列で書きなさいよ！'
      );
    }
    config.extensions = exts;
  }

  return config;
}

/** startDir から親へ向かって設定ファイルを探す */
function findConfigFile(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, CONFIG_FILENAME);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * 設定ファイルを読み込む。configPath が無ければ cwd から探す。
 * 戻り値の baseDir は ignorePatterns の基準ディレクトリ。
 */
function loadConfig({ configPath, cwd = process.cwd() } = {}) {
  const file = configPath ? path.resolve(configPath) : findConfigFile(cwd);
  if (!file) {
    return { ...validateConfig({}), baseDir: path.resolve(cwd), file: null };
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    const reason = e.code === "ENOENT" ? "見つからない" : `読めない (${e.message})`;
    throw new ConfigError(`設定ファイル '${file}' が${reason}んだけど!?`);
  }

  try {
    return { ...validateConfig(raw), baseDir: path.dirname(file), file };
  } catch (e) {
    if (e instanceof ConfigError) e.message = `${file}: ${e.message}`;
    throw e;
  }
}

/** ルールのオプションを1つ上書きする（CLIオプション用） */
function setRuleOption(config, ruleId, name, value) {
  const current = config.rules[ruleId];
  const setting =
    typeof current === "string" ? { severity: current } : { ...current };
  setting[name] = value;
  config.rules[ruleId] = setting;
}

function globToRegExp(pattern) {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        // "**/" は0個以上のディレクトリ、末尾の "**" は何でも
        if (pattern[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

/**
 * ignorePatterns から「このパスは無視するか」を判定する関数を作る。
 * パターンは baseDir からの相対パスで、"/" を含まなければどの階層にもマッチする。
 * ディレクトリにマッチしたら中身もすべて無視する。
 */
function createIgnoreMatcher(config) {
  const baseDir = config.baseDir || process.cwd();
  const regexps = (config.ignorePatterns || []).map((p) => {
    let pattern = p.replace(/\\/g, "/").replace(/\/+$/, "");
    if (pattern.startsWith("/")) pattern = pattern.slice(1);
    else if (!pattern.includes("/")) pattern = `**/${pattern}`;
    return globToRegExp(pattern);
  });

  return (filepath) => {
    if (regexps.length === 0) return false;
    const rel = path.relative(baseDir, path.resolve(filepath)).replace(/\\/g, "/");
    if (rel === "" || rel.startsWith("../")) return false;
    const parts = rel.split("/");
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join("/");
      if (regexps.some((re) => re.test(prefix))) return true;
    }
    return false;
  };
}

module.exports = {
  CONFIG_FILENAME,
  DEFAULT_EXTENSIONS,
  ConfigError,
  loadConfig,
  validateConfig,
  findConfigFile,
  setRuleOption,
  createIgnoreMatcher,
};
