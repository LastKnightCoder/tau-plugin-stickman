import type { MessageKey } from "./i18n";
import type { StickBody, StickTint } from "./model/types";

/** 火柴人墨色与填充：只取主题 token，深浅主题自动跟随 */
export const STICK_INK = "var(--tau-ink-1)";
/** 纸色填充只负责遮挡后面的线（画板、气泡、桌面），与画布底色一致 */
export const STICK_PAPER = "var(--tau-bg-surface)";
export const STICK_MONO_FILL =
  "color-mix(in srgb, var(--tau-ink-1) 9%, var(--tau-bg-surface))";
export const STICK_WARN_FILL =
  "color-mix(in srgb, var(--tau-warn) 42%, var(--tau-bg-surface))";
/** 点缀着色：多人场景按人物序号轮换；与纸色混合保证不透明，能遮住身后的线 */
export const STICK_TINTS = ["accent", "tag-2", "tag-1", "tag-3", "tag-4"].map(
  (token) =>
    `color-mix(in srgb, var(--tau-${token}) 32%, var(--tau-bg-surface))`,
);

export const STICK_BODY_OPTIONS: { value: StickBody; label: MessageKey }[] = [
  { value: "classic", label: "body.classic" },
  { value: "bean", label: "body.bean" },
  { value: "glyph", label: "body.glyph" },
];

export const STICK_TINT_OPTIONS: { value: StickTint; label: MessageKey }[] = [
  { value: "mono", label: "tint.mono" },
  { value: "color", label: "tint.color" },
];

export const DEFAULT_STICK_POSE = "stand";
export const DEFAULT_STICK_BODY: StickBody = "classic";
export const DEFAULT_STICK_TINT: StickTint = "color";

/** 姿态画布四周的留白：道具与墨迹会略微出界 */
export const STICK_PADDING = 6;
export const elementType = "taunote.stickman.figure";
export const toolId = "taunote.stickman.create";

/** 姿态/分类的词典键：姿态 key 是稳定数据身份，名字走词典（未知 key 回落「人物」） */
export const POSE_NAME_KEYS: Record<string, MessageKey> = {
  stand: "pose.stand",
  wave: "pose.wave",
  point: "pose.point",
  walk: "pose.walk",
  run: "pose.run",
  sit: "pose.sit",
  raise: "pose.raise",
  jump: "pose.jump",
  crouch: "pose.crouch",
  think: "pose.think",
  idea: "pose.idea",
  cheer: "pose.cheer",
  confused: "pose.confused",
  sad: "pose.sad",
  angry: "pose.angry",
  surprised: "pose.surprised",
  frantic: "pose.frantic",
  like: "pose.like",
  present: "pose.present",
  laptop: "pose.laptop",
  sign: "pose.sign",
  carry: "pose.carry",
  flag: "pose.flag",
  write: "pose.write",
  phone: "pose.phone",
  read: "pose.read",
  overtime: "pose.overtime",
  podium: "pose.podium",
  sticky: "pose.sticky",
  search: "pose.search",
  push: "pose.push",
  ladder: "pose.ladder",
  stairs: "pose.stairs",
  lost: "pose.lost",
  balance: "pose.balance",
  puzzle: "pose.puzzle",
  target: "pose.target",
  nurture: "pose.nurture",
  handshake: "pose.handshake",
  talk: "pose.talk",
  team: "pose.team",
  highfive: "pose.highfive",
  qa: "pose.qa",
  handover: "pose.handover",
  argue: "pose.argue",
  meeting: "pose.meeting",
};

export const CATEGORY_KEYS: Record<string, MessageKey> = {
  basic: "category.basic",
  mood: "category.mood",
  work: "category.work",
  metaphor: "category.metaphor",
  group: "category.group",
};
