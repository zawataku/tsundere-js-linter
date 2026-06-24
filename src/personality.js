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

module.exports = { formatIssue, getPraise, getSummary };
