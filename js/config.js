'use strict';

/* ============================================================
 *  枫之谷 · 弓箭手传说 —— 全局配置
 * ============================================================ */

const VIEW_W = 1280;
const VIEW_H = 720;
const WORLD_W = 3200;
const WORLD_H = 1360;

const GRAVITY = 2200;
const FIXED_DT = 1 / 60;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const dist2 = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

/** 升级所需经验 */
const expNeed = (lv) => Math.floor(45 * Math.pow(lv, 1.5) + 35 * lv);

/* ============================================================
 *  技能
 * ============================================================ */
const SKILLS = [
  {
    id: 'shot',
    name: '普通射击',
    key: 'Z',
    keyLabel: 'Z',
    mp: 0,
    cd: 0,
    mult: 1.0,
    icon: 'arrow',
    tint: '#d7efb0',
    desc: '拉动长弓射出箭矢，按住 Z 或鼠标左键可连续射击。按住 ↑ / ↓ 可调整射角。',
  },
  {
    id: 'triple',
    name: '三连箭',
    key: '1',
    keyLabel: '1',
    mp: 16,
    cd: 0.9,
    mult: 0.82,
    icon: 'triple',
    tint: '#b9ecff',
    desc: '一次射出三支箭，形成扇形弹幕，适合清理成群的怪物。',
  },
  {
    id: 'pierce',
    name: '贯穿箭',
    key: '2',
    keyLabel: '2',
    mp: 28,
    cd: 2.6,
    mult: 2.0,
    icon: 'pierce',
    tint: '#ffe1a4',
    desc: '凝聚魔力射出重箭，最多贯穿 5 个敌人，伤害极高。',
  },
  {
    id: 'rain',
    name: '箭雨',
    key: '3',
    keyLabel: '3',
    mp: 45,
    cd: 9.0,
    mult: 1.05,
    icon: 'rain',
    tint: '#d9c9ff',
    desc: '在鼠标位置召唤箭雨，1.6 秒内落下 14 支箭，对大范围敌人持续造成伤害。',
  },
  {
    id: 'eyes',
    name: '鹰眼',
    key: '4',
    keyLabel: '4',
    mp: 30,
    cd: 26.0,
    mult: 0,
    icon: 'eye',
    tint: '#ffd3e4',
    desc: '20 秒内提升 20% 暴击率、40% 暴击伤害与 15% 攻击力。',
  },
];

const SKILL_MAP = {};
SKILLS.forEach((s) => (SKILL_MAP[s.id] = s));

/* ============================================================
 *  道具
 * ============================================================ */
const ITEMS = {
  meso: { name: '金币', icon: 'meso', kind: 'meso', stack: true, desc: '枫之谷通用的货币。' },
  hp_potion: {
    name: '红色药水',
    icon: 'hpPot',
    kind: 'use',
    stack: true,
    price: 35,
    heal: 90,
    desc: '恢复 90 点 HP。快捷键 5。',
  },
  mp_potion: {
    name: '蓝色药水',
    icon: 'mpPot',
    kind: 'use',
    stack: true,
    price: 35,
    mana: 55,
    desc: '恢复 55 点 MP。快捷键 6。',
  },
  shell: { name: '蜗牛壳', icon: 'shell', kind: 'etc', stack: true, price: 12, desc: '带着粘液的绿色外壳，可以卖给商人。' },
  cap: { name: '蘑菇伞', icon: 'cap', kind: 'etc', stack: true, price: 20, desc: '蘑菇仔的伞盖，会散发淡淡的荧光。' },
  branch: { name: '枯木枝', icon: 'branch', kind: 'etc', stack: true, price: 30, desc: '木妖身上掉落的干枯枝条。' },
  bow1: { name: '枫叶短弓', icon: 'bow', kind: 'equip', slot: 'weapon', atk: 9, price: 320, desc: '攻击力 +9' },
  bow2: {
    name: '银月长弓',
    icon: 'bow2',
    kind: 'equip',
    slot: 'weapon',
    atk: 18,
    crit: 0.05,
    price: 1200,
    desc: '攻击力 +18，暴击率 +5%',
  },
  armor1: { name: '猎人皮甲', icon: 'armor', kind: 'equip', slot: 'armor', hp: 60, price: 600, desc: '最大HP +60' },
  ring1: {
    name: '力量戒指',
    icon: 'ring',
    kind: 'equip',
    slot: 'ring',
    atk: 4,
    dex: 3,
    price: 800,
    desc: '攻击力 +4，DEX +3',
  },
};

const EQUIP_SLOT_LABEL = { weapon: '武器', armor: '防具', ring: '饰品' };

/* ============================================================
 *  怪物
 * ============================================================ */
const MONSTER_TYPES = {
  snail: {
    name: '绿蜗牛',
    level: 1,
    maxHp: 52,
    atk: 7,
    exp: 24,
    speed: 42,
    w: 46,
    h: 32,
    body: 'snail',
    drops: [
      { id: 'meso', chance: 1, min: 4, max: 15 },
      { id: 'hp_potion', chance: 0.18, qty: 1 },
      { id: 'shell', chance: 0.55, qty: 1 },
    ],
  },
  mushroom: {
    name: '蘑菇仔',
    level: 3,
    maxHp: 130,
    atk: 12,
    exp: 52,
    speed: 58,
    w: 50,
    h: 46,
    body: 'mushroom',
    drops: [
      { id: 'meso', chance: 1, min: 12, max: 30 },
      { id: 'mp_potion', chance: 0.2, qty: 1 },
      { id: 'cap', chance: 0.45, qty: 1 },
      { id: 'hp_potion', chance: 0.12, qty: 1 },
    ],
  },
  stump: {
    name: '木妖',
    level: 6,
    maxHp: 300,
    atk: 19,
    exp: 112,
    speed: 34,
    w: 58,
    h: 66,
    body: 'stump',
    drops: [
      { id: 'meso', chance: 1, min: 25, max: 60 },
      { id: 'branch', chance: 0.5, qty: 1 },
      { id: 'hp_potion', chance: 0.3, qty: 2 },
      { id: 'bow1', chance: 0.06, qty: 1 },
    ],
  },
  mk: {
    name: '蘑菇王',
    level: 12,
    maxHp: 2400,
    atk: 32,
    exp: 1800,
    speed: 46,
    w: 116,
    h: 108,
    body: 'boss',
    boss: true,
    drops: [
      { id: 'meso', chance: 1, min: 300, max: 520 },
      { id: 'hp_potion', chance: 1, qty: 8 },
      { id: 'mp_potion', chance: 1, qty: 8 },
      { id: 'bow2', chance: 0.55, qty: 1 },
      { id: 'ring1', chance: 0.4, qty: 1 },
      { id: 'armor1', chance: 0.45, qty: 1 },
    ],
  },
};

/* ============================================================
 *  任务
 * ============================================================ */
const QUESTS = [
  {
    id: 'q1',
    name: '村庄的委托',
    giver: '村民 · 露西亚',
    desc: '森林边缘的绿蜗牛越来越多了，帮忙清理 8 只，让村里的孩子可以安心采蘑菇。',
    monster: 'snail',
    need: 8,
    rewards: { exp: 220, meso: 260, items: [{ id: 'hp_potion', qty: 5 }] },
  },
  {
    id: 'q2',
    name: '蘑菇的侵扰',
    giver: '猎人 · 阿贝尔',
    desc: '那些蘑菇仔在夜里到处乱跳，把陷阱都踩坏了。击退 6 只蘑菇仔。',
    monster: 'mushroom',
    need: 6,
    rewards: { exp: 620, meso: 480, items: [{ id: 'bow1', qty: 1 }] },
  },
  {
    id: 'q3',
    name: '森林之王',
    giver: '村长 · 汉斯',
    desc: '森林深处沉睡的蘑菇王苏醒了。击败它，森林才能恢复平静。',
    monster: 'mk',
    need: 1,
    rewards: { exp: 2600, meso: 1600, items: [{ id: 'armor1', qty: 1 }, { id: 'mp_potion', qty: 10 }] },
  },
];

/* ============================================================
 *  玩家成长
 * ============================================================ */
const PLAYER_BASE = {
  level: 1,
  str: 5,
  dex: 12,
  int: 4,
  luk: 7,
  hp: 120,
  mp: 55,
};

const MAX_INV = 24;

/* 音效合成器 */
const Sound = {
  ctx: null,
  on: true,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type = 'square', vol = 0.05, slideTo = null) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },
  shoot() {
    this.tone(780, 0.09, 'square', 0.028, 260);
  },
  hit() {
    this.tone(180, 0.07, 'sawtooth', 0.03, 90);
  },
  crit() {
    this.tone(520, 0.1, 'square', 0.04, 1100);
    this.tone(140, 0.12, 'sawtooth', 0.028, 70);
  },
  coin() {
    this.tone(1180, 0.06, 'square', 0.026);
    setTimeout(() => this.tone(1560, 0.08, 'square', 0.022), 55);
  },
  potion() {
    this.tone(620, 0.1, 'sine', 0.05, 920);
  },
  levelup() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.24, 'triangle', 0.05), i * 95)
    );
  },
  skill() {
    this.tone(340, 0.12, 'triangle', 0.04, 720);
  },
  hurt() {
    this.tone(150, 0.16, 'sawtooth', 0.045, 70);
  },
  ui() {
    this.tone(880, 0.04, 'square', 0.02);
  },
};
