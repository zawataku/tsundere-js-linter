const PREFIXES = {
  error: [
    "ちょっと！",
    "はぁ!?",
    "信じらんない…",
    "あんたねぇ…",
    "何やってんのよ！",
    "もう、バカじゃないの!?",
  ],
  warning: [
    "べ、別に気になったわけじゃないけど…",
    "一応言っておくけど…",
    "あんたのためじゃないんだからね…",
    "し、仕方ないから教えてあげるけど…",
    "ちょっとだけ気になっただけよ…",
    "まぁ…あんたにしては頑張ってるけど…",
  ],
  info: [
    "ふーん…",
    "まぁ、悪くはないけど…",
    "あんたにしてはマシね…",
    "言われなくても分かってるでしょうけど…",
  ],
};

const SUFFIXES = {
  error: [
    "早く直しなさいよ！",
    "こんなの基本中の基本でしょ！",
    "あたしがいなかったらどうするつもりだったの？",
    "もう知らないんだから！…って、直すまで見届けてあげるけど。",
  ],
  warning: [
    "…直した方がいいんじゃない？知らないけど。",
    "…別にあんたの好きにすればいいけど。",
    "…まぁ、次は気をつけなさいよね。",
    "…あんたのコード、ちょっとだけ心配になっただけよ。",
  ],
  info: [
    "…参考までに言っただけよ。",
    "…覚えておきなさい。",
    "…まぁ、どうでもいいけど。",
  ],
};

const PRAISE = [
  "ふ、ふん…まぁ、今回はミスがなかっただけよ。別に褒めてないんだからね！",
  "…悔しいけど、今回のコードは悪くなかったわ。次もこの調子でいなさいよね！",
  "え？問題なし？…あんたにしてはやるじゃない。ちょっとだけ見直したわ。ちょっとだけよ！",
  "あ、あんたのコード完璧だなんて思ってないんだからね！たまたま今回は指摘がなかっただけ！",
  "…きれいなコードね。誰かに教わったの？…べ、別に嬉しくなんかないんだから！",
];

const SUMMARY_BAD = [
  "全部で{count}個も問題があるじゃない！あんた本当にプログラマなの!?",
  "{count}個の問題…はぁ、あたしがいなかったら大変なことになってたわよ。感謝しなさい。",
  "{count}個見つけちゃった…。べ、別にあんたのコードを隅々まで読んだわけじゃないんだからね。",
];

const SUMMARY_FEW = [
  "{count}個だけ…まぁ、あんたにしては少ない方ね。",
  "たった{count}個。…ちょっとだけ成長したんじゃない？認めてあげてもいいわ。",
];

const SUPPRESSED = [
  "…{count}個は見逃してあげたんだからね。今回だけよ！",
  "無効化コメントで{count}個も隠してるじゃない…あたしの目はごまかせないわよ。",
  "{count}個は黙らせたのね…べ、別に寂しくなんかないんだから！",
];

const FIXED = [
  "し、仕方ないから{count}個直しておいてあげたわよ。…感謝しなさいよね！",
  "{count}個直しといたから。べ、別にあんたのためにやったんじゃないんだからね！",
  "はぁ…{count}個も直させるなんて。次は自分でやりなさいよ！",
];

const FIXABLE_HINT = [
  "…そのうち{count}個は --fix で直せるんだけど。自分でやる？あたしがやってあげてもいいけど？",
  "{count}個は --fix で直せるわよ。…べ、別に手伝いたいわけじゃないけど！",
];

// 同じミスが何回目から反応するか、と回数ごとのセリフ
const REPEAT_THRESHOLD = 3;
const REPEATED = [
  {
    min: 10,
    lines: [
      "「{label}」が{count}回…もう、わざとやってるでしょ!?",
      "「{label}」{count}回目…あたしを困らせて楽しいわけ!?",
    ],
  },
  {
    min: 5,
    lines: [
      "「{label}」が{count}回も!? 何回言わせるのよ！",
      "また「{label}」…{count}回目なんだけど!? ちゃんと聞いてる？",
    ],
  },
  {
    min: REPEAT_THRESHOLD,
    lines: [
      "また「{label}」…これで{count}回目よ？",
      "「{label}」、{count}回目ね。…クセになってるんじゃない？",
    ],
  },
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatIssue(severity, rule, message) {
  const prefixes = PREFIXES[severity] || PREFIXES.info;
  const suffixes = SUFFIXES[severity] || SUFFIXES.info;
  return `${randomChoice(prefixes)} ${message} ${randomChoice(suffixes)}`;
}

function getPraise() {
  return randomChoice(PRAISE);
}

function getSummary(count) {
  if (count === 0) return getPraise();
  if (count <= 3) return randomChoice(SUMMARY_FEW).replace("{count}", count);
  return randomChoice(SUMMARY_BAD).replace("{count}", count);
}

/** 無効化コメントで消された指摘の数へのひとこと */
function getSuppressedReaction(count) {
  return randomChoice(SUPPRESSED).replace("{count}", count);
}

/** 自動修正した数へのひとこと */
function getFixReaction(count) {
  return randomChoice(FIXED).replace("{count}", count);
}

/** 自動修正できる指摘が残っているときのひとこと */
function getFixableHint(count) {
  return randomChoice(FIXABLE_HINT).replace("{count}", count);
}

/**
 * 同じ種類のミスが何度も出たときのひとこと。回数が少なければ null。
 * @param {string} label ミスの種類を表す短い説明（例: "`==` / `!=` の使用"）
 * @param {number} count 出現回数
 */
function getRepeatReaction(label, count) {
  const tier = REPEATED.find((t) => count >= t.min);
  if (!tier) return null;
  return randomChoice(tier.lines)
    .replace("{label}", label)
    .replace("{count}", count);
}

module.exports = {
  formatIssue,
  getPraise,
  getSummary,
  getSuppressedReaction,
  getFixReaction,
  getFixableHint,
  getRepeatReaction,
};
