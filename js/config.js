'use strict';

/* ============================================================
 *  枫之谷 · 弓箭手传说 —— 全局配置
 * ============================================================ */

const VIEW_W = 1280;
const VIEW_H = 720;

/* 世界尺寸随当前地图变化（由 world.js 的 setMap 更新） */
let WORLD_W = 3200;
let WORLD_H = 1360;

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

  /* ---- 洞穴 / 沼泽 / 遗迹素材 ---- */
  wing: { name: '蝙蝠翅膀', icon: 'wing', kind: 'etc', stack: true, price: 48, desc: '薄如蝉翼的暗紫色翅膀，还带着洞窟的寒气。' },
  ore: { name: '魔法矿石', icon: 'ore', kind: 'etc', stack: true, price: 76, desc: '洞穴深处结晶的蓝色矿石，内部有魔力流动。' },
  venom: { name: '毒囊', icon: 'venom', kind: 'etc', stack: true, price: 94, desc: '沼泽生物体内的囊袋，散发刺鼻的酸味。' },
  rune: { name: '遗迹符文', icon: 'rune', kind: 'etc', stack: true, price: 155, desc: '刻着古老文字的碎石，仍有微光沿着刻痕游走。' },
  elixir: {
    name: '万能药水',
    icon: 'elixir',
    kind: 'use',
    stack: true,
    price: 180,
    heal: 320,
    mana: 180,
    desc: '同时恢复 320 HP 与 180 MP，深处冒险的必需品。',
  },

  /* ---- 中后期装备 ---- */
  bow3: {
    name: '精灵长弓',
    icon: 'bow3',
    kind: 'equip',
    slot: 'weapon',
    atk: 34,
    crit: 0.06,
    price: 4200,
    desc: '攻击力 +34，暴击率 +6%',
  },
  bow4: {
    name: '苍穹神弓',
    icon: 'bow4',
    kind: 'equip',
    slot: 'weapon',
    atk: 56,
    dex: 10,
    crit: 0.1,
    price: 12000,
    desc: '攻击力 +56，DEX +10，暴击率 +10%',
  },
  armor2: {
    name: '幽影战甲',
    icon: 'armor2',
    kind: 'equip',
    slot: 'armor',
    hp: 220,
    atk: 6,
    price: 6000,
    desc: '最大HP +220，攻击力 +6',
  },
  ring2: {
    name: '猎鹰指环',
    icon: 'ring2',
    kind: 'equip',
    slot: 'ring',
    atk: 10,
    crit: 0.04,
    price: 5200,
    desc: '攻击力 +10，暴击率 +4%',
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
    ranged: { kind: 'spore', cd: 2.8, dmg: 0.75, speed: 320 },
    drops: [
      { id: 'meso', chance: 1, min: 300, max: 520 },
      { id: 'hp_potion', chance: 1, qty: 8 },
      { id: 'mp_potion', chance: 1, qty: 8 },
      { id: 'bow2', chance: 0.55, qty: 1 },
      { id: 'ring1', chance: 0.4, qty: 1 },
      { id: 'armor1', chance: 0.45, qty: 1 },
    ],
  },

  /* ============ 第二章：幽暗洞穴 ============ */
  bat: {
    name: '洞穴蝙蝠',
    level: 10,
    maxHp: 280,
    atk: 24,
    exp: 165,
    speed: 104,
    w: 46,
    h: 28,
    body: 'bat',
    flying: true,
    drops: [
      { id: 'meso', chance: 1, min: 38, max: 88 },
      { id: 'wing', chance: 0.58, qty: 1 },
      { id: 'hp_potion', chance: 0.22, qty: 1 },
    ],
  },
  golem: {
    name: '岩石魔像',
    level: 13,
    maxHp: 700,
    atk: 33,
    exp: 345,
    speed: 34,
    w: 62,
    h: 72,
    body: 'golem',
    drops: [
      { id: 'meso', chance: 1, min: 70, max: 148 },
      { id: 'ore', chance: 0.52, qty: 1 },
      { id: 'hp_potion', chance: 0.3, qty: 2 },
      { id: 'armor1', chance: 0.05, qty: 1 },
    ],
  },
  golem_king: {
    name: '石魔领主',
    level: 17,
    maxHp: 5600,
    atk: 52,
    exp: 4200,
    speed: 52,
    w: 124,
    h: 112,
    body: 'golemKing',
    boss: true,
    drops: [
      { id: 'meso', chance: 1, min: 900, max: 1500 },
      { id: 'elixir', chance: 1, qty: 6 },
      { id: 'ore', chance: 1, qty: 5 },
      { id: 'bow3', chance: 0.6, qty: 1 },
      { id: 'ring2', chance: 0.5, qty: 1 },
      { id: 'armor2', chance: 0.5, qty: 1 },
    ],
  },

  /* ============ 第三章：毒雾沼泽 ============ */
  toad: {
    name: '毒沼蟾蜍',
    level: 16,
    maxHp: 580,
    atk: 31,
    exp: 320,
    speed: 56,
    w: 68,
    h: 50,
    body: 'toad',
    jumper: true,
    drops: [
      { id: 'meso', chance: 1, min: 90, max: 190 },
      { id: 'venom', chance: 0.55, qty: 1 },
      { id: 'mp_potion', chance: 0.3, qty: 2 },
      { id: 'elixir', chance: 0.08, qty: 1 },
    ],
  },
  plant: {
    name: '食人花',
    level: 15,
    maxHp: 430,
    atk: 29,
    exp: 255,
    speed: 0,
    w: 54,
    h: 66,
    body: 'plant',
    static: true,
    ranged: { kind: 'seed', cd: 1.9, dmg: 0.8, speed: 300 },
    drops: [
      { id: 'meso', chance: 1, min: 80, max: 165 },
      { id: 'venom', chance: 0.45, qty: 1 },
      { id: 'hp_potion', chance: 0.35, qty: 2 },
    ],
  },

  toad_king: {
    name: '毒沼蛙王',
    level: 20,
    maxHp: 7200,
    atk: 46,
    exp: 5600,
    speed: 58,
    w: 112,
    h: 96,
    body: 'toadKing',
    boss: true,
    jumper: true,
    ranged: { kind: 'poison', cd: 2.5, dmg: 0.7, speed: 300 },
    drops: [
      { id: 'meso', chance: 1, min: 1300, max: 2000 },
      { id: 'elixir', chance: 1, qty: 6 },
      { id: 'venom', chance: 1, qty: 5 },
      { id: 'bow3', chance: 0.45, qty: 1 },
      { id: 'ring2', chance: 0.4, qty: 1 },
      { id: 'armor2', chance: 0.45, qty: 1 },
    ],
  },

  /* ============ 第四章：天空遗迹 ============ */
  wisp: {
    name: '幽灵术士',
    level: 21,
    maxHp: 820,
    atk: 41,
    exp: 560,
    speed: 76,
    w: 52,
    h: 64,
    body: 'wisp',
    flying: true,
    ranged: { kind: 'orb', cd: 2.4, dmg: 0.9, speed: 340 },
    drops: [
      { id: 'meso', chance: 1, min: 190, max: 360 },
      { id: 'rune', chance: 0.5, qty: 1 },
      { id: 'elixir', chance: 0.18, qty: 1 },
    ],
  },
  sentinel: {
    name: '遗迹守卫',
    level: 24,
    maxHp: 1300,
    atk: 47,
    exp: 800,
    speed: 46,
    w: 66,
    h: 78,
    body: 'sentinel',
    charger: true,
    drops: [
      { id: 'meso', chance: 1, min: 260, max: 460 },
      { id: 'rune', chance: 0.62, qty: 1 },
      { id: 'elixir', chance: 0.24, qty: 1 },
      { id: 'ring2', chance: 0.04, qty: 1 },
    ],
  },
  sky_lord: {
    name: '天空守望者',
    level: 28,
    maxHp: 9800,
    atk: 62,
    exp: 9200,
    speed: 62,
    w: 120,
    h: 120,
    body: 'skyLord',
    boss: true,
    ranged: { kind: 'orb', cd: 2.2, dmg: 0.85, speed: 380 },
    drops: [
      { id: 'meso', chance: 1, min: 2400, max: 3600 },
      { id: 'elixir', chance: 1, qty: 10 },
      { id: 'rune', chance: 1, qty: 8 },
      { id: 'bow4', chance: 0.75, qty: 1 },
      { id: 'armor2', chance: 0.65, qty: 1 },
      { id: 'ring2', chance: 0.65, qty: 1 },
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

  /* ---------- 第二章 · 幽暗洞穴 ---------- */
  {
    id: 'q4',
    name: '洞窟的翅膀',
    giver: '矿工 · 巴鲁',
    desc: '洞里的蝙蝠群遮住了矿灯，矿工们不敢下井。清理 8 只洞穴蝙蝠，让矿道重见光明。',
    monster: 'bat',
    need: 8,
    reqLv: 8,
    rewards: { exp: 1600, meso: 1000, items: [{ id: 'elixir', qty: 3 }] },
  },
  {
    id: 'q5',
    name: '岩石的愤怒',
    giver: '矿工 · 巴鲁',
    desc: '沉睡了百年的岩石魔像被吵醒了，它们正把矿脉一寸寸砸碎。击碎 6 只岩石魔像。',
    monster: 'golem',
    need: 6,
    reqLv: 12,
    rewards: { exp: 3400, meso: 2100, items: [{ id: 'ore', qty: 5 }] },
  },
  {
    id: 'q6',
    name: '深渊之主',
    giver: '矿工 · 巴鲁',
    desc: '矿道尽头盘踞着石魔领主，它的拳头能震塌整条隧道。讨伐它，矿坑才能复工。',
    monster: 'golem_king',
    need: 1,
    reqLv: 15,
    rewards: { exp: 5600, meso: 3400, items: [{ id: 'bow3', qty: 1 }] },
  },

  /* ---------- 第三章 · 毒雾沼泽 ---------- */
  {
    id: 'q7',
    name: '毒雾中的低鸣',
    giver: '药师 · 薇拉',
    desc: '沼泽的毒雾让蟾蜍变得暴躁。击退 8 只毒沼蟾蜍，我需要它们的毒囊配药。',
    monster: 'toad',
    need: 8,
    reqLv: 16,
    rewards: { exp: 6400, meso: 4000, items: [{ id: 'elixir', qty: 5 }] },
  },
  {
    id: 'q8',
    name: '会走的花',
    giver: '药师 · 薇拉',
    desc: '食人花把药圃当成了猎场。铲除 6 株食人花，让采药人敢重新进沼泽。',
    monster: 'plant',
    need: 6,
    reqLv: 18,
    rewards: { exp: 8600, meso: 5200, items: [{ id: 'armor2', qty: 1 }] },
  },

  {
    id: 'q9',
    name: '沼泽之王',
    giver: '药师 · 薇拉',
    desc: '毒雾的源头是一头盘踞在沼泽尽头的蛙王，它每跳一次，毒雾就浓一分。斩杀它，让湿地重新呼吸。',
    monster: 'toad_king',
    need: 1,
    reqLv: 19,
    rewards: { exp: 12000, meso: 6800, items: [{ id: 'ring2', qty: 1 }, { id: 'elixir', qty: 6 }] },
  },

  /* ---------- 第四章 · 天空遗迹 ---------- */
  {
    id: 'q10',
    name: '遗迹的守望',
    giver: '考古学家 · 赛勒斯',
    desc: '漂浮的遗迹里游荡着不肯离去的幽灵术士。送 8 位术士回到长眠，才能继续考察。',
    monster: 'wisp',
    need: 8,
    reqLv: 21,
    rewards: { exp: 13000, meso: 7600, items: [{ id: 'elixir', qty: 8 }] },
  },
  {
    id: 'q11',
    name: '不会疲倦的守卫',
    giver: '考古学家 · 赛勒斯',
    desc: '遗迹守卫仍在执行千年前的命令，把一切活物当作入侵者。击毁 6 台守卫。',
    monster: 'sentinel',
    need: 6,
    reqLv: 23,
    rewards: { exp: 19000, meso: 11000, items: [{ id: 'ring2', qty: 1 }] },
  },
  {
    id: 'q12',
    name: '天空之王',
    giver: '考古学家 · 赛勒斯',
    desc: '守望者盘踞在遗迹顶端，它的羽翼遮住了最后的光。终结这场千年的守望。',
    monster: 'sky_lord',
    need: 1,
    reqLv: 26,
    rewards: { exp: 30000, meso: 18000, items: [{ id: 'bow4', qty: 1 }, { id: 'elixir', qty: 10 }] },
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
