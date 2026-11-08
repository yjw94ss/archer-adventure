'use strict';

/* ============================================================
 *  主题配色与材质
 * ============================================================ */
const THEMES = {
  forest: {
    id: 'forest',
    sky: ['#8fd7f7', '#bce9fb', '#e6f7fb', '#f6fbf0'],
    sun: { x: 1030, y: 120, core: 'rgba(255,252,224,0.95)', g1: 'rgba(255,247,196,0.95)', g2: 'rgba(255,240,168,0.35)', r: 260 },
    hills: { top: '#a8dcc4', bot: '#cdeacd' },
    trees: 'green',
    clouds: true,
    grassTop: true,
    soil: ['#a9743f', '#8b5c31', '#5c3c22'],
    top: ['#8fe06a', '#5dbb44', '#3f9134'],
    edge: 'rgba(190,255,160,0.75)',
    blade: 'rgba(48,120,44,0.75)',
    vines: true,
    decor: ['flower', 'mushroom', 'rock', 'grass'],
    ambient: 'petal',
    fog: null,
    portal: { a: '#7bf0a0', b: '#eaffef' },
    mm: ['#f4eeda', '#e2d9bf'],
    mmPlat: 'rgba(94,140,80,0.95)',
  },

  cave: {
    id: 'cave',
    sky: ['#060b14', '#0d1828', '#16263c', '#20364e'],
    sun: null,
    hills: null,
    trees: null,
    clouds: false,
    grassTop: false,
    caveBack: true,
    stalactites: true,
    soil: ['#414c5e', '#333d4d', '#242b37'],
    top: ['#7c8ba2', '#5d6a7d', '#454f5f'],
    edge: 'rgba(150,205,245,0.55)',
    blade: 'rgba(130,180,220,0.45)',
    vines: false,
    decor: ['crystal', 'rock', 'moss'],
    ambient: 'dust',
    fog: 'rgba(14,30,54,0.34)',
    portal: { a: '#7fd8ff', b: '#e8f9ff' },
    mm: ['#2f3a4c', '#1e2632'],
    mmPlat: 'rgba(150,185,220,0.9)',
  },

  swamp: {
    id: 'swamp',
    sky: ['#36432c', '#4f5c38', '#727f49', '#98a063'],
    sun: { x: 940, y: 118, core: 'rgba(238,244,196,0.6)', g1: 'rgba(214,232,160,0.42)', g2: 'rgba(188,214,132,0.16)', r: 230 },
    hills: { top: '#46543a', bot: '#39452f' },
    trees: 'dead',
    clouds: false,
    grassTop: true,
    swampBack: true,
    soil: ['#4a3a26', '#382b1b', '#21180f'],
    top: ['#719b4c', '#4e7a36', '#35592a'],
    edge: 'rgba(176,220,134,0.55)',
    blade: 'rgba(62,102,48,0.8)',
    vines: true,
    decor: ['reed', 'mushroom2', 'rock', 'bubble'],
    ambient: 'spore',
    fog: 'rgba(92,122,62,0.24)',
    portal: { a: '#b0ea70', b: '#f2ffe0' },
    mm: ['#dfe4c8', '#bfc9a2'],
    mmPlat: 'rgba(120,150,90,0.92)',
  },

  ruins: {
    id: 'ruins',
    sky: ['#2b2660', '#544a86', '#a5718f', '#f2b478'],
    sun: { x: 980, y: 470, core: 'rgba(255,240,200,0.95)', g1: 'rgba(255,206,150,0.85)', g2: 'rgba(255,176,116,0.28)', r: 300 },
    hills: null,
    trees: null,
    clouds: true,
    cloudTint: ['rgba(255,214,190,0.75)', 'rgba(255,178,150,0.5)'],
    cloudSea: true,
    grassTop: false,
    soil: ['#cfc7e6', '#aca3c8', '#867ea4'],
    top: ['#f8f4ff', '#ded6f4', '#c0b6e2'],
    edge: 'rgba(255,250,255,0.9)',
    blade: 'rgba(190,170,225,0.55)',
    vines: false,
    decor: ['pillar', 'rune', 'rubble'],
    ambient: 'mote',
    fog: null,
    portal: { a: '#ffd98a', b: '#fff7e2' },
    mm: ['#efe7f6', '#d9cde9'],
    mmPlat: 'rgba(170,155,205,0.95)',
  },
};

/* ============================================================
 *  地图数据
 * ============================================================ */
const MAPS = {
  /* ---------- 第一章：蘑菇森林 ---------- */
  forest: {
    id: 'forest',
    name: '蘑菇森林',
    sub: '射手村 · 郊外',
    theme: 'forest',
    chapter: '第一章',
    suggestLv: 'Lv.1 - 10',
    worldW: 3200,
    worldH: 1360,
    spawn: { x: 300, y: 1240 },
    entries: { west: { x: 300, y: 1240 }, east: { x: 3030, y: 1240 } },
    portals: [{ x: 3120, y: 1240, to: 'cave', entry: 'west', label: '幽暗洞穴', reqLv: 8, dir: 1 }],
    platforms: [
      { x: 0, y: 1240, w: 3200, h: 160, ground: true },

      { x: 150, y: 1118, w: 440 },
      { x: 760, y: 1142, w: 400 },
      { x: 1320, y: 1108, w: 480 },
      { x: 1980, y: 1132, w: 420 },
      { x: 2520, y: 1110, w: 430 },

      { x: 250, y: 942, w: 360 },
      { x: 860, y: 906, w: 330 },
      { x: 1430, y: 928, w: 400 },
      { x: 2070, y: 900, w: 430 },
      { x: 2620, y: 940, w: 330 },

      { x: 600, y: 742, w: 340 },
      { x: 1300, y: 706, w: 420 },
      { x: 1980, y: 762, w: 380 },

      { x: 1560, y: 520, w: 320 },
    ],
    ropes: [
      { x: 520, y1: 1118, y2: 1240 },
      { x: 900, y1: 1142, y2: 1240 },
      { x: 1560, y1: 1108, y2: 1240 },
      { x: 2200, y1: 1132, y2: 1240 },
      { x: 2750, y1: 1110, y2: 1240 },
      { x: 430, y1: 942, y2: 1118 },
      { x: 980, y1: 906, y2: 1142 },
      { x: 1600, y1: 928, y2: 1108 },
      { x: 2280, y1: 900, y2: 1132 },
      { x: 2790, y1: 940, y2: 1110 },
      { x: 2140, y1: 762, y2: 900 },
      { x: 1650, y1: 520, y2: 706 },
    ],
    ladders: [
      { x: 700, y1: 742, y2: 906 },
      { x: 1450, y1: 706, y2: 928 },
      { x: 2900, y1: 1110, y2: 1240 },
    ],
    spawns: [
      { type: 'snail', x: 400, y: 1240, min: 250, max: 560 },
      { type: 'snail', x: 1150, y: 1240, min: 1000, max: 1300 },
      { type: 'snail', x: 1850, y: 1240, min: 1700, max: 1960 },
      { type: 'snail', x: 2350, y: 1240, min: 2200, max: 2480 },
      { type: 'snail', x: 2900, y: 1240, min: 2800, max: 2990 },
      { type: 'snail', x: 300, y: 1118, min: 190, max: 380 },
      { type: 'snail', x: 480, y: 1118, min: 420, max: 575 },
      { type: 'snail', x: 1450, y: 1108, min: 1360, max: 1560 },
      { type: 'snail', x: 2700, y: 1110, min: 2560, max: 2820 },
      { type: 'snail', x: 950, y: 1142, min: 800, max: 1120 },
      { type: 'mushroom', x: 350, y: 942, min: 280, max: 560 },
      { type: 'mushroom', x: 1000, y: 906, min: 900, max: 1150 },
      { type: 'mushroom', x: 2100, y: 1132, min: 2020, max: 2350 },
      { type: 'mushroom', x: 1600, y: 928, min: 1470, max: 1780 },
      { type: 'mushroom', x: 2750, y: 940, min: 2660, max: 2900 },
      { type: 'mushroom', x: 1450, y: 706, min: 1340, max: 1660 },
      { type: 'mushroom', x: 2250, y: 900, min: 2120, max: 2440 },
      { type: 'stump', x: 700, y: 742, min: 640, max: 900 },
      { type: 'stump', x: 2100, y: 762, min: 2020, max: 2320 },
      { type: 'stump', x: 2700, y: 1240, min: 2560, max: 2820 },
      { type: 'stump', x: 1050, y: 1142, min: 780, max: 1130 },
      { type: 'stump', x: 2350, y: 900, min: 2100, max: 2460 },
      { type: 'mk', x: 2980, y: 1240, min: 2860, max: 3040 },
    ],
    signs: [
      { x: 220, y: 1240, text: '蘑菇森林' },
      { x: 1240, y: 1108, text: '小心脚下' },
    ],
  },

  /* ---------- 第二章：幽暗洞穴 ---------- */
  cave: {
    id: 'cave',
    name: '幽暗洞穴',
    sub: '废弃矿坑 · 第三层',
    theme: 'cave',
    chapter: '第二章',
    suggestLv: 'Lv.8 - 17',
    worldW: 3600,
    worldH: 1520,
    spawn: { x: 200, y: 1360 },
    entries: { west: { x: 170, y: 1360 }, east: { x: 3440, y: 1360 } },
    portals: [
      { x: 90, y: 1360, to: 'forest', entry: 'east', label: '蘑菇森林', reqLv: 0, dir: -1 },
      { x: 3510, y: 1360, to: 'swamp', entry: 'west', label: '毒雾沼泽', reqLv: 14, dir: 1 },
    ],
    platforms: [
      { x: 0, y: 1360, w: 3600, h: 200, ground: true },

      { x: 180, y: 1215, w: 420 },
      { x: 740, y: 1215, w: 380 },
      { x: 1300, y: 1215, w: 460 },
      { x: 1900, y: 1215, w: 400 },
      { x: 2450, y: 1215, w: 430 },
      { x: 3020, y: 1215, w: 380 },

      { x: 340, y: 1068, w: 360 },
      { x: 940, y: 1068, w: 340 },
      { x: 1560, y: 1068, w: 400 },
      { x: 2160, y: 1068, w: 380 },
      { x: 2720, y: 1068, w: 400 },
      { x: 3240, y: 1068, w: 300 },

      { x: 560, y: 922, w: 380 },
      { x: 1200, y: 922, w: 360 },
      { x: 1820, y: 922, w: 340 },
      { x: 2420, y: 922, w: 420 },
      { x: 3040, y: 922, w: 320 },

      { x: 940, y: 786, w: 360 },
      { x: 1620, y: 786, w: 380 },
      { x: 2300, y: 786, w: 340 },
      { x: 2900, y: 786, w: 300 },

      { x: 1280, y: 658, w: 340 },
      { x: 2020, y: 658, w: 360 },
      { x: 2680, y: 658, w: 300 },

      { x: 1680, y: 536, w: 320 },
      { x: 2340, y: 536, w: 300 },
    ],
    ropes: [
      { x: 640, y1: 1068, y2: 1215 },
      { x: 1760, y1: 1068, y2: 1215 },
      { x: 2820, y1: 1068, y2: 1215 },
      { x: 1450, y1: 922, y2: 1068 },
      { x: 2560, y1: 922, y2: 1068 },
      { x: 1760, y1: 786, y2: 922 },
      { x: 2460, y1: 786, y2: 922 },
      { x: 2140, y1: 658, y2: 786 },
      { x: 2790, y1: 658, y2: 786 },
      { x: 1840, y1: 536, y2: 658 },
    ],
    ladders: [
      { x: 300, y1: 1215, y2: 1360 },
      { x: 1500, y1: 1215, y2: 1360 },
      { x: 2800, y1: 1215, y2: 1360 },
      { x: 1000, y1: 1068, y2: 1215 },
      { x: 2200, y1: 1068, y2: 1215 },
      { x: 1900, y1: 922, y2: 1068 },
      { x: 2500, y1: 786, y2: 922 },
      { x: 2350, y1: 658, y2: 786 },
      { x: 2360, y1: 536, y2: 658 },
    ],
    spawns: [
      { type: 'bat', x: 700, y: 1010, min: 480, max: 900 },
      { type: 'bat', x: 1100, y: 950, min: 900, max: 1300 },
      { type: 'bat', x: 1500, y: 880, min: 1300, max: 1700 },
      { type: 'bat', x: 1900, y: 1010, min: 1700, max: 2100 },
      { type: 'bat', x: 2300, y: 900, min: 2100, max: 2500 },
      { type: 'bat', x: 2700, y: 960, min: 2500, max: 2900 },
      { type: 'bat', x: 3060, y: 880, min: 2900, max: 3260 },
      { type: 'bat', x: 500, y: 1150, min: 300, max: 700 },
      { type: 'golem', x: 600, y: 1360, min: 400, max: 900 },
      { type: 'golem', x: 1600, y: 1360, min: 1350, max: 1800 },
      { type: 'golem', x: 2500, y: 1360, min: 2250, max: 2700 },
      { type: 'golem', x: 3150, y: 1360, min: 2950, max: 3300 },
      { type: 'golem', x: 1400, y: 922, min: 1250, max: 1560 },
      { type: 'golem', x: 1750, y: 786, min: 1650, max: 1960 },
      { type: 'golem_king', x: 3360, y: 1360, min: 3220, max: 3450 },
    ],
    signs: [
      { x: 210, y: 1360, text: '幽暗洞穴' },
      { x: 2900, y: 1360, text: '毒雾沼泽 →' },
    ],
  },

  /* ---------- 第三章：毒雾沼泽 ---------- */
  swamp: {
    id: 'swamp',
    name: '毒雾沼泽',
    sub: '腐叶湿地 · 深处',
    theme: 'swamp',
    chapter: '第三章',
    suggestLv: 'Lv.14 - 21',
    worldW: 3400,
    worldH: 1440,
    spawn: { x: 200, y: 1300 },
    entries: { west: { x: 170, y: 1300 }, east: { x: 3250, y: 1300 } },
    portals: [
      { x: 80, y: 1300, to: 'cave', entry: 'east', label: '幽暗洞穴', reqLv: 0, dir: -1 },
      { x: 3330, y: 1300, to: 'ruins', entry: 'west', label: '天空遗迹', reqLv: 20, dir: 1 },
    ],
    platforms: [
      { x: 0, y: 1300, w: 3400, h: 200, ground: true },

      { x: 150, y: 1158, w: 400 },
      { x: 700, y: 1158, w: 360 },
      { x: 1240, y: 1158, w: 420 },
      { x: 1820, y: 1158, w: 380 },
      { x: 2380, y: 1158, w: 400 },
      { x: 2900, y: 1158, w: 360 },

      { x: 300, y: 1015, w: 340 },
      { x: 880, y: 1015, w: 320 },
      { x: 1480, y: 1015, w: 360 },
      { x: 2050, y: 1015, w: 340 },
      { x: 2620, y: 1015, w: 360 },

      { x: 560, y: 875, w: 300 },
      { x: 1120, y: 875, w: 340 },
      { x: 1740, y: 875, w: 320 },
      { x: 2320, y: 875, w: 300 },

      { x: 900, y: 740, w: 300 },
      { x: 1500, y: 740, w: 320 },
      { x: 2100, y: 740, w: 300 },

      { x: 1250, y: 612, w: 300 },
      { x: 1900, y: 612, w: 280 },
    ],
    ropes: [
      { x: 350, y1: 1158, y2: 1300 },
      { x: 900, y1: 1158, y2: 1300 },
      { x: 1450, y1: 1158, y2: 1300 },
      { x: 2000, y1: 1158, y2: 1300 },
      { x: 2550, y1: 1158, y2: 1300 },
      { x: 3100, y1: 1158, y2: 1300 },
      { x: 400, y1: 1015, y2: 1158 },
      { x: 950, y1: 1015, y2: 1158 },
      { x: 1550, y1: 1015, y2: 1158 },
      { x: 2100, y1: 1015, y2: 1158 },
      { x: 2700, y1: 1015, y2: 1158 },
      { x: 2940, y1: 1015, y2: 1158 },
      { x: 600, y1: 875, y2: 1015 },
      { x: 1160, y1: 875, y2: 1015 },
      { x: 1790, y1: 875, y2: 1015 },
      { x: 2350, y1: 875, y2: 1015 },
      { x: 1150, y1: 740, y2: 875 },
      { x: 1780, y1: 740, y2: 875 },
      { x: 2360, y1: 740, y2: 875 },
      { x: 1520, y1: 612, y2: 740 },
      { x: 2140, y1: 612, y2: 740 },
    ],
    ladders: [],
    spawns: [
      { type: 'toad', x: 500, y: 1300, min: 300, max: 800 },
      { type: 'toad', x: 1200, y: 1300, min: 950, max: 1450 },
      { type: 'toad', x: 1900, y: 1300, min: 1650, max: 2150 },
      { type: 'toad', x: 2600, y: 1300, min: 2350, max: 2850 },
      { type: 'toad', x: 3150, y: 1300, min: 2950, max: 3250 },
      { type: 'toad', x: 900, y: 1015, min: 820, max: 1150 },
      { type: 'toad', x: 2200, y: 1015, min: 2080, max: 2360 },
      { type: 'plant', x: 350, y: 1158, min: 200, max: 500 },
      { type: 'plant', x: 1400, y: 1158, min: 1280, max: 1600 },
      { type: 'plant', x: 2200, y: 1158, min: 2050, max: 2380 },
      { type: 'plant', x: 2950, y: 1158, min: 2920, max: 3200 },
      { type: 'plant', x: 800, y: 875, min: 700, max: 1000 },
      { type: 'plant', x: 1900, y: 875, min: 1760, max: 2020 },
      { type: 'stump', x: 1000, y: 1300, min: 850, max: 1250 },
      { type: 'stump', x: 2400, y: 1300, min: 2250, max: 2650 },
      { type: 'snail', x: 1700, y: 1300, min: 1600, max: 1800 },
      { type: 'toad_king', x: 3160, y: 1300, min: 3030, max: 3300 },
    ],
    signs: [
      { x: 200, y: 1300, text: '毒雾沼泽' },
      { x: 3100, y: 1300, text: '天空遗迹 →' },
    ],
  },

  /* ---------- 第四章：天空遗迹 ---------- */
  ruins: {
    id: 'ruins',
    name: '天空遗迹',
    sub: '浮空神殿 · 顶端',
    theme: 'ruins',
    chapter: '第四章',
    suggestLv: 'Lv.20 - 28',
    worldW: 3800,
    worldH: 1560,
    spawn: { x: 200, y: 1400 },
    entries: { west: { x: 170, y: 1400 } },
    portals: [{ x: 80, y: 1400, to: 'swamp', entry: 'east', label: '毒雾沼泽', reqLv: 0, dir: -1 }],
    platforms: [
      { x: 0, y: 1400, w: 3800, h: 160, ground: true },

      { x: 200, y: 1255, w: 380 },
      { x: 760, y: 1255, w: 340 },
      { x: 1320, y: 1255, w: 400 },
      { x: 1900, y: 1255, w: 360 },
      { x: 2460, y: 1255, w: 380 },
      { x: 3060, y: 1255, w: 340 },

      { x: 420, y: 1108, w: 340 },
      { x: 1000, y: 1108, w: 320 },
      { x: 1580, y: 1108, w: 360 },
      { x: 2160, y: 1108, w: 320 },
      { x: 2740, y: 1108, w: 340 },
      { x: 3300, y: 1108, w: 300 },

      { x: 680, y: 968, w: 300 },
      { x: 1260, y: 968, w: 320 },
      { x: 1820, y: 968, w: 300 },
      { x: 2400, y: 968, w: 320 },
      { x: 2980, y: 968, w: 300 },

      { x: 980, y: 828, w: 280 },
      { x: 1520, y: 828, w: 300 },
      { x: 2080, y: 828, w: 280 },
      { x: 2650, y: 828, w: 300 },

      { x: 1300, y: 698, w: 280 },
      { x: 1880, y: 698, w: 280 },
      { x: 2450, y: 698, w: 260 },

      { x: 1650, y: 568, w: 300 },
      { x: 2250, y: 568, w: 280 },
    ],
    ropes: [
      { x: 500, y1: 1108, y2: 1255 },
      { x: 1200, y1: 1108, y2: 1255 },
      { x: 1700, y1: 1108, y2: 1255 },
      { x: 2300, y1: 1108, y2: 1255 },
      { x: 2800, y1: 1108, y2: 1255 },
      { x: 3350, y1: 1108, y2: 1255 },
      { x: 1750, y1: 968, y2: 1108 },
      { x: 2250, y1: 968, y2: 1108 },
      { x: 2950, y1: 968, y2: 1108 },
      { x: 1560, y1: 828, y2: 968 },
      { x: 2440, y1: 828, y2: 968 },
      { x: 2900, y1: 828, y2: 968 },
      { x: 1700, y1: 698, y2: 828 },
      { x: 2150, y1: 698, y2: 828 },
    ],
    ladders: [
      { x: 300, y1: 1255, y2: 1400 },
      { x: 900, y1: 1255, y2: 1400 },
      { x: 1500, y1: 1255, y2: 1400 },
      { x: 2100, y1: 1255, y2: 1400 },
      { x: 2650, y1: 1255, y2: 1400 },
      { x: 3200, y1: 1255, y2: 1400 },
      { x: 720, y1: 1108, y2: 1255 },
      { x: 1290, y1: 968, y2: 1108 },
      { x: 1550, y1: 828, y2: 968 },
      { x: 2100, y1: 828, y2: 968 },
      { x: 1550, y1: 698, y2: 828 },
      { x: 1900, y1: 568, y2: 698 },
    ],
    spawns: [
      { type: 'wisp', x: 700, y: 1050, min: 500, max: 900 },
      { type: 'wisp', x: 1200, y: 980, min: 1000, max: 1400 },
      { type: 'wisp', x: 1700, y: 920, min: 1500, max: 1900 },
      { type: 'wisp', x: 2200, y: 1000, min: 2000, max: 2400 },
      { type: 'wisp', x: 2700, y: 940, min: 2500, max: 2900 },
      { type: 'wisp', x: 3200, y: 1000, min: 3000, max: 3400 },
      { type: 'bat', x: 1500, y: 1150, min: 1300, max: 1700 },
      { type: 'bat', x: 2500, y: 1120, min: 2300, max: 2700 },
      { type: 'sentinel', x: 800, y: 1400, min: 600, max: 1000 },
      { type: 'sentinel', x: 1700, y: 1400, min: 1500, max: 1900 },
      { type: 'sentinel', x: 2600, y: 1400, min: 2400, max: 2800 },
      { type: 'sentinel', x: 3250, y: 1400, min: 3100, max: 3400 },
      { type: 'golem', x: 2000, y: 1400, min: 1800, max: 2200 },
      { type: 'sky_lord', x: 3480, y: 1400, min: 3360, max: 3620 },
    ],
    signs: [
      { x: 210, y: 1400, text: '天空遗迹' },
      { x: 1500, y: 1255, text: '遗迹顶端' },
    ],
  },
};

/* ============================================================
 *  当前地图
 * ============================================================ */
let MAP = MAPS.forest;

function buildClimbables(m) {
  if (m.climbables) return m.climbables;
  m.climbables = (m.ropes || [])
    .map((r) => ({ x: r.x, y1: r.y1, y2: r.y2, kind: 'rope' }))
    .concat((m.ladders || []).map((l) => ({ x: l.x, y1: l.y1, y2: l.y2, kind: 'ladder' })));
  return m.climbables;
}

function setMap(id) {
  const m = MAPS[id];
  if (!m) return null;
  buildClimbables(m);
  MAP = m;
  WORLD_W = m.worldW;
  WORLD_H = m.worldH;
  return m;
}

function theme() {
  return THEMES[MAP.theme] || THEMES.forest;
}

setMap('forest');

/* ============================================================
 *  绘图小工具
 * ============================================================ */
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wrapMod = (v, span) => ((v % span) + span) % span;

/* #rrggbb -> rgba(r,g,b,a) */
function hexA(hex, a) {
  if (hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ============================================================
 *  背景装饰数据
 * ============================================================ */
const BG = (() => {
  const r = mulberry32(20261107);
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    clouds.push({
      x: r() * 2200,
      y: 50 + r() * 210,
      s: 0.55 + r() * 0.85,
      p: 0.08 + r() * 0.1,
      a: 0.55 + r() * 0.35,
    });
  }
  const hills = [];
  for (let i = 0; i < 8; i++) {
    hills.push({ x: i * 420 + r() * 120, w: 560 + r() * 260, h: 210 + r() * 120, p: 0.22 });
  }
  const forest = [];
  for (let i = 0; i < 22; i++) {
    forest.push({ x: r() * 3200, s: 0.7 + r() * 0.9, p: 0.42, y: r() * 40 });
  }
  const near = [];
  for (let i = 0; i < 20; i++) {
    near.push({ x: r() * 3200, s: 0.5 + r() * 0.7, p: 0.66, y: r() * 60 });
  }
  return { clouds, hills, forest, near };
})();

const BGX = (() => {
  const mk = (seed) => mulberry32(seed);

  /* 洞穴 */
  let r = mk(771003);
  const walls = [];
  for (let i = 0; i < 12; i++) {
    walls.push({ x: i * 330 + r() * 90, w: 200 + r() * 220, h: 150 + r() * 230 });
  }
  const spikes = [];
  for (let i = 0; i < 26; i++) {
    spikes.push({ x: r() * 3600, w: 40 + r() * 90, h: 60 + r() * 170, dx: r() * 20 - 10 });
  }
  const crystals = [];
  for (let i = 0; i < 16; i++) {
    crystals.push({ x: r() * 3400, y: 60 + r() * 260, s: 0.6 + r() * 0.9, hue: r() < 0.4 ? 1 : 0 });
  }
  const caveDust = [];
  for (let i = 0; i < 34; i++) {
    caveDust.push({ x: r() * VIEW_W, y: r() * VIEW_H, s: 0.6 + r() * 1.6, v: 6 + r() * 16, a: 0.2 + r() * 0.4 });
  }

  /* 沼泽 */
  r = mk(330177);
  const deadTrees = [];
  for (let i = 0; i < 18; i++) {
    deadTrees.push({ x: r() * 3200, s: 0.7 + r() * 0.8, p: 0.4, y: r() * 50 });
  }
  const deadNear = [];
  for (let i = 0; i < 12; i++) {
    deadNear.push({ x: r() * 3200, s: 0.9 + r() * 0.9, p: 0.64, y: r() * 60 });
  }
  const spores = [];
  for (let i = 0; i < 40; i++) {
    spores.push({ x: r() * VIEW_W, y: r() * VIEW_H, s: 1 + r() * 2, v: 8 + r() * 20, a: 0.25 + r() * 0.45 });
  }
  const bubbles = [];
  for (let i = 0; i < 22; i++) {
    bubbles.push({ x: r() * 3200, y: 300 + r() * 900, s: 0.5 + r() * 1.1 });
  }

  /* 遗迹 */
  r = mk(990031);
  const islands = [];
  for (let i = 0; i < 9; i++) {
    islands.push({ x: i * 460 + r() * 160, w: 180 + r() * 240, h: 60 + r() * 90, p: 0.24, y: r() * 120 });
  }
  const pillars = [];
  for (let i = 0; i < 10; i++) {
    pillars.push({ x: i * 400 + r() * 140, h: 160 + r() * 220, p: 0.36 });
  }
  const motes = [];
  for (let i = 0; i < 36; i++) {
    motes.push({ x: r() * VIEW_W, y: r() * VIEW_H, s: 1 + r() * 2.2, v: 10 + r() * 22, a: 0.3 + r() * 0.5 });
  }
  const ruinClouds = [];
  for (let i = 0; i < 11; i++) {
    ruinClouds.push({ x: r() * 2600, y: 60 + r() * 200, s: 0.7 + r() * 1.1, p: 0.07 + r() * 0.09, a: 0.5 + r() * 0.35 });
  }

  return { walls, spikes, crystals, caveDust, deadTrees, deadNear, spores, bubbles, islands, pillars, motes, ruinClouds };
})();

/* ============================================================
 *  背景绘制
 * ============================================================ */
function drawBackground(ctx, cam, time) {
  const th = theme();

  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, th.sky[0]);
  sky.addColorStop(0.45, th.sky[1]);
  sky.addColorStop(0.8, th.sky[2]);
  sky.addColorStop(1, th.sky[3]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (th.sun) drawSun(ctx, th.sun, cam, time);
  if (th.caveBack) drawCaveBack(ctx, cam, time);
  if (th.clouds) drawClouds(ctx, cam, time, th);
  if (th.hills) drawHills(ctx, cam, th);
  if (th.trees === 'green') drawForestTrees(ctx, cam);
  if (th.trees === 'dead') drawDeadForest(ctx, cam);
  if (th.swampBack) drawSwampMist(ctx, cam, time);
  if (th.ruinsBack || th.cloudSea) drawRuinsBack(ctx, cam, time, th);

  drawAmbient(ctx, th, cam, time);
  if (th.fog) drawFog(ctx, th, cam, time);
}

function drawSun(ctx, sun, cam, time) {
  const sunX = sun.x;
  const sunY = sun.y - cam.y * 0.12;
  const pulse = 1 + Math.sin(time * 0.8) * 0.02;
  const glow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, sun.r * pulse);
  glow.addColorStop(0, sun.g1);
  glow.addColorStop(0.35, sun.g2);
  glow.addColorStop(1, 'rgba(255,240,168,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sun.r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sun.core;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(ctx, cam, time, th) {
  const span = VIEW_W + 700;
  const list = th.id === 'ruins' ? BGX.ruinClouds : BG.clouds;
  for (const c of list) {
    const sx = wrapMod(c.x - cam.x * c.p, span) - 350;
    const sy = c.y - cam.y * 0.1;
    if (th.id === 'ruins') {
      drawCloud(ctx, sx, sy, c.s, c.a, time + c.x, th.cloudTint[0], th.cloudTint[1]);
    } else {
      drawCloud(ctx, sx, sy, c.s, c.a, time + c.x);
    }
  }
}

function drawHills(ctx, cam, th) {
  const horizon = 690 - cam.y * 0.18;
  for (const h of BG.hills) {
    const sx = wrapMod(h.x - cam.x * h.p, 3600) - 600;
    const g = ctx.createLinearGradient(0, horizon - h.h, 0, horizon + 40);
    g.addColorStop(0, th.hills.top);
    g.addColorStop(1, th.hills.bot);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, horizon + 40);
    ctx.quadraticCurveTo(sx + h.w * 0.5, horizon - h.h, sx + h.w, horizon + 40);
    ctx.closePath();
    ctx.fill();
  }
}

function drawForestTrees(ctx, cam) {
  const base = 612 - cam.y * 0.12;
  for (const tr of BG.forest) {
    const sx = wrapMod(tr.x - cam.x * tr.p, 3500) - 400;
    drawTree(ctx, sx, base + tr.y, tr.s * 1.08, 'rgba(128,192,140,0.5)', 'rgba(110,174,126,0.5)', 0);
  }
  const base2 = 706 - cam.y * 0.18;
  for (const tr of BG.near) {
    const sx = wrapMod(tr.x - cam.x * tr.p, 3400) - 400;
    drawTree(ctx, sx, base2 + tr.y, tr.s * 1.3, 'rgba(100,174,106,0.44)', 'rgba(78,146,88,0.44)', 0);
  }
}

/* ---------- 洞穴 ---------- */
function drawCaveBack(ctx, cam, time) {
  const baseY = 520 - cam.y * 0.16;

  // 远处岩壁
  for (const w of BGX.walls) {
    const sx = wrapMod(w.x - cam.x * 0.2, 3900) - 500;
    ctx.fillStyle = 'rgba(14,23,38,0.92)';
    ctx.beginPath();
    ctx.moveTo(sx, VIEW_H);
    ctx.lineTo(sx + w.w * 0.18, baseY - w.h);
    ctx.lineTo(sx + w.w * 0.46, baseY - w.h * 0.78);
    ctx.lineTo(sx + w.w * 0.7, baseY - w.h * 1.12);
    ctx.lineTo(sx + w.w, VIEW_H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(30,48,72,0.35)';
    ctx.beginPath();
    ctx.moveTo(sx + w.w * 0.18, baseY - w.h);
    ctx.lineTo(sx + w.w * 0.46, baseY - w.h * 0.78);
    ctx.lineTo(sx + w.w * 0.52, baseY - w.h * 0.2);
    ctx.lineTo(sx + w.w * 0.3, baseY - w.h * 0.24);
    ctx.closePath();
    ctx.fill();
  }

  // 顶部钟乳石
  const yTop = -30 - cam.y * 0.3;
  for (const s of BGX.spikes) {
    const sx = wrapMod(s.x - cam.x * 0.34, 3600) - 300;
    ctx.fillStyle = 'rgba(19,31,50,0.95)';
    ctx.beginPath();
    ctx.moveTo(sx - s.w / 2, yTop);
    ctx.lineTo(sx + s.w / 2, yTop);
    ctx.lineTo(sx + s.dx * 0.3, yTop + s.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(90,140,190,0.16)';
    ctx.beginPath();
    ctx.moveTo(sx - s.w / 2, yTop);
    ctx.lineTo(sx + s.dx * 0.3, yTop + s.h);
    ctx.lineTo(sx + s.dx * 0.3 - 6, yTop + s.h * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // 发光水晶
  for (const k of BGX.crystals) {
    const sx = wrapMod(k.x - cam.x * 0.4, 3400) - 300;
    const sy = k.y + 210 - cam.y * 0.28;
    const pu = 0.55 + Math.sin(time * 1.5 + k.x * 0.01) * 0.45;
    const col = k.hue ? [255, 190, 255] : [130, 220, 255];
    const g = ctx.createRadialGradient(sx, sy, 4, sx, sy, 96 * k.s);
    g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.34 * pu})`);
    g.addColorStop(0.5, `rgba(${col[0]},${col[1]},${col[2]},${0.12 * pu})`);
    g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, 96 * k.s, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(k.s, k.s);
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.5 + 0.3 * pu})`;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(13, -4);
    ctx.lineTo(6, 18);
    ctx.lineTo(-7, 16);
    ctx.lineTo(-12, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(6, -4);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/* ---------- 沼泽 ---------- */
function drawDeadForest(ctx, cam) {
  const base = 660 - cam.y * 0.14;
  for (const tr of BGX.deadTrees) {
    const sx = wrapMod(tr.x - cam.x * tr.p, 3400) - 400;
    drawDeadTree(ctx, sx, base + tr.y, tr.s, 0.45);
  }
  const base2 = 760 - cam.y * 0.2;
  for (const tr of BGX.deadNear) {
    const sx = wrapMod(tr.x - cam.x * tr.p, 3400) - 400;
    drawDeadTree(ctx, sx, base2 + tr.y, tr.s * 1.25, 0.62);
  }
}

function drawDeadTree(ctx, x, y, s, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = `rgba(34,40,28,${alpha})`;
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-6, -50, -2, -96);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-3, -60);
  ctx.quadraticCurveTo(-30, -74, -42, -104);
  ctx.moveTo(-2, -78);
  ctx.quadraticCurveTo(24, -88, 34, -118);
  ctx.moveTo(-4, -46);
  ctx.quadraticCurveTo(18, -56, 26, -78);
  ctx.stroke();
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-42, -104);
  ctx.lineTo(-56, -118);
  ctx.moveTo(-42, -104);
  ctx.lineTo(-30, -122);
  ctx.moveTo(34, -118);
  ctx.lineTo(46, -134);
  ctx.moveTo(34, -118);
  ctx.lineTo(24, -138);
  ctx.stroke();
  ctx.restore();
}

function drawSwampMist(ctx, cam, time) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const y = 420 + i * 92 - cam.y * 0.1;
    const off = Math.sin(time * 0.25 + i) * 60;
    const g = ctx.createLinearGradient(0, y, 0, y + 110);
    g.addColorStop(0, 'rgba(196,214,150,0)');
    g.addColorStop(0.5, `rgba(196,214,150,${0.1 + i * 0.012})`);
    g.addColorStop(1, 'rgba(196,214,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-40 + off, y, VIEW_W + 80, 110);
  }
  // 沼泽气泡
  for (const b of BGX.bubbles) {
    const sx = wrapMod(b.x - cam.x * 0.75, 3200) - 100;
    const sy = b.y - cam.y * 0.5 + Math.sin(time * 0.9 + b.x) * 6;
    ctx.strokeStyle = 'rgba(210,230,160,0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sx, sy, 6 * b.s + Math.sin(time * 2 + b.x) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------- 遗迹 ---------- */
function drawRuinsBack(ctx, cam, time, th) {
  // 浮空岩岛（远景）
  if (BGX.islands) {
    for (const is of BGX.islands) {
      const sx = wrapMod(is.x - cam.x * is.p, 4200) - 600;
      const sy = 250 + is.y * 0.7 - cam.y * 0.2;
      ctx.fillStyle = 'rgba(92,78,124,0.34)';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + is.w, sy);
      ctx.lineTo(sx + is.w * 0.72, sy + is.h);
      ctx.lineTo(sx + is.w * 0.42, sy + is.h * 0.6);
      ctx.lineTo(sx + is.w * 0.2, sy + is.h * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,206,170,0.13)';
      ctx.fillRect(sx, sy - 2, is.w, 3);
    }
  }

  // 远景断柱
  for (const p of BGX.pillars) {
    const sx = wrapMod(p.x - cam.x * p.p, 4000) - 500;
    const sy = 560 - cam.y * 0.26;
    ctx.fillStyle = 'rgba(84,70,112,0.4)';
    ctx.fillRect(sx, sy - p.h, 26, p.h);
    ctx.fillStyle = 'rgba(120,102,150,0.35)';
    ctx.fillRect(sx - 5, sy - p.h - 10, 36, 12);
  }

  // 云海
  if (th.cloudSea) {
    ctx.save();
    const baseY = 620 - cam.y * 0.34;
    for (let layer = 0; layer < 3; layer++) {
      const y = baseY + layer * 44;
      const alpha = 0.22 + layer * 0.14;
      const drift = time * (5 + layer * 4);
      ctx.fillStyle = `rgba(255,220,200,${alpha})`;
      ctx.beginPath();
      for (let x = -80; x < VIEW_W + 160; x += 130) {
        const px = x + wrapMod(drift - cam.x * (0.3 + layer * 0.06), 2600);
        const r = 58 + Math.sin((px + layer * 60) * 0.01) * 22;
        ctx.ellipse(px, y + Math.sin(px * 0.006 + layer) * 8, r, r * 0.42, 0, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ---------- 通用物件 ---------- */
function drawCloud(ctx, x, y, s, a, t, c1, c2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, -30, 0, 34);
  g.addColorStop(0, c1 || '#ffffff');
  g.addColorStop(1, c2 || '#dceefb');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(-34, 6, 24, 0, Math.PI * 2);
  ctx.arc(0, -8 + Math.sin(t * 0.6) * 2, 32, 0, Math.PI * 2);
  ctx.arc(38, 8, 22, 0, Math.PI * 2);
  ctx.ellipse(0, 16, 52, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTree(ctx, x, y, s, c1, c2, trunkH) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (trunkH > 0) {
    ctx.fillStyle = 'rgba(120,88,62,0.5)';
    roundRect(ctx, -7, -60, 14, trunkH, 6);
    ctx.fill();
  }
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.arc(-26, -68, 30, 0, Math.PI * 2);
  ctx.arc(24, -76, 34, 0, Math.PI * 2);
  ctx.arc(0, -100, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.arc(-14, -84, 22, 0, Math.PI * 2);
  ctx.arc(18, -98, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- 空气粒子 ---------- */
function drawAmbient(ctx, th, cam, time) {
  ctx.save();
  if (th.ambient === 'petal') {
    for (let i = 0; i < 26; i++) {
      const seed = i * 137.5;
      const px = wrapMod(seed * 7.3 - cam.x * 0.8 + time * (12 + (i % 5) * 6), VIEW_W + 80) - 40;
      const py = (seed * 3.1 + time * (18 + (i % 4) * 9)) % (VIEW_H + 120) - 60;
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(time * 2 + i);
      ctx.fillStyle = i % 3 === 0 ? '#fff3b0' : '#ffffff';
      ctx.beginPath();
      ctx.ellipse(px, py, 3.2, 2, Math.sin(time + i) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (th.ambient === 'dust') {
    for (const d of BGX.caveDust) {
      const px = wrapMod(d.x - cam.x * 0.5 + Math.sin(time * 0.4 + d.x) * 14, VIEW_W + 40) - 20;
      const py = wrapMod(d.y - time * d.v - cam.y * 0.3, VIEW_H + 40) - 20;
      ctx.globalAlpha = d.a * (0.6 + 0.4 * Math.sin(time * 1.4 + d.x));
      ctx.fillStyle = '#bfe6ff';
      ctx.beginPath();
      ctx.arc(px, py, d.s, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (th.ambient === 'spore') {
    for (const s of BGX.spores) {
      const px = wrapMod(s.x - cam.x * 0.6 + Math.sin(time * 0.5 + s.x) * 18, VIEW_W + 40) - 20;
      const py = wrapMod(s.y - time * s.v * 0.5 - cam.y * 0.4, VIEW_H + 40) - 20;
      ctx.globalAlpha = s.a * (0.5 + 0.5 * Math.sin(time * 1.1 + s.x * 0.02));
      ctx.fillStyle = s.s > 2.2 ? '#e8ffa8' : '#c8e88a';
      ctx.beginPath();
      ctx.arc(px, py, s.s, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (th.ambient === 'mote') {
    for (const m of BGX.motes) {
      const px = wrapMod(m.x - cam.x * 0.55 + Math.sin(time * 0.35 + m.x) * 16, VIEW_W + 40) - 20;
      const py = wrapMod(m.y - time * m.v - cam.y * 0.35, VIEW_H + 40) - 20;
      ctx.globalAlpha = m.a * (0.45 + 0.55 * Math.sin(time * 1.6 + m.y));
      ctx.fillStyle = m.s > 2.4 ? '#fff0c0' : '#ffd79a';
      ctx.beginPath();
      ctx.arc(px, py, m.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFog(ctx, th, cam, time) {
  ctx.save();
  ctx.fillStyle = th.fog;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // 呼吸式雾带
  for (let i = 0; i < 3; i++) {
    const y = 260 + i * 180 - cam.y * 0.08;
    const off = Math.sin(time * 0.18 + i * 1.7) * 70;
    const g = ctx.createLinearGradient(0, y, 0, y + 150);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, th.id === 'cave' ? 'rgba(30,60,95,0.10)' : 'rgba(150,175,110,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-60 + off, y, VIEW_W + 120, 150);
  }
  ctx.restore();
}

/* ============================================================
 *  平台 / 绳索 / 梯子 / 传送门
 * ============================================================ */
function drawPlatforms(ctx, cam, time) {
  const th = theme();
  for (const p of MAP.platforms) {
    if (p.x + p.w < cam.x - 80 || p.x > cam.x + VIEW_W + 80) continue;
    const h = p.ground ? 260 : 30;
    const top = p.y + (p.ground ? 0 : 6);
    const radius = p.ground ? 10 : 12;

    // 泥土 / 岩石主体
    const g = ctx.createLinearGradient(0, top, 0, top + h);
    g.addColorStop(0, th.soil[0]);
    g.addColorStop(0.22, th.soil[1]);
    g.addColorStop(1, th.soil[2]);
    ctx.fillStyle = g;
    roundRect(ctx, p.x, top, p.w, h, radius);
    ctx.fill();

    // 材质纹理
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, p.x, top, p.w, h, radius);
    ctx.clip();
    if (th.grassTop) {
      ctx.strokeStyle = 'rgba(70,44,24,0.28)';
      ctx.lineWidth = 2;
      for (let i = 0; i < p.w; i += 46) {
        ctx.beginPath();
        ctx.arc(p.x + i + (i % 92 === 0 ? 10 : -6), p.y + 20 + ((i * 7) % 10), 6, 0, Math.PI);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,226,180,0.10)';
      for (let i = 0; i < p.w; i += 24) {
        ctx.fillRect(p.x + i, p.y + 40 + ((i * 13) % 18), 6, 4);
      }
    } else {
      // 石纹：斜向裂缝 + 高光斑
      ctx.strokeStyle = 'rgba(16,22,34,0.34)';
      ctx.lineWidth = 2;
      for (let i = 0; i < p.w; i += 58) {
        ctx.beginPath();
        ctx.moveTo(p.x + i, top + 14);
        ctx.lineTo(p.x + i + 13, top + 34);
        ctx.lineTo(p.x + i + 5, top + 58);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < p.w; i += 30) {
        ctx.fillRect(p.x + i, top + 22 + ((i * 7) % 26), 9, 3);
      }
      for (let i = 0; i < p.w; i += 74) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.ellipse(p.x + i + 20, top + 44 + ((i * 5) % 20), 14, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    if (th.grassTop) {
      // 草皮
      const grassH = p.ground ? 20 : 16;
      const gg = ctx.createLinearGradient(0, p.y - 4, 0, p.y + grassH);
      gg.addColorStop(0, th.top[0]);
      gg.addColorStop(0.5, th.top[1]);
      gg.addColorStop(1, th.top[2]);
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.moveTo(p.x - 3, p.y + grassH);
      ctx.lineTo(p.x - 3, p.y + 6);
      for (let x = p.x; x <= p.x + p.w; x += 18) {
        const bump = Math.sin(x * 0.09) * 2.4;
        ctx.lineTo(x, p.y + 2 + bump);
      }
      ctx.lineTo(p.x + p.w + 3, p.y + 6);
      ctx.lineTo(p.x + p.w + 3, p.y + grassH);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = th.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + 2, p.y + 5);
      for (let x = p.x + 12; x <= p.x + p.w - 4; x += 22) {
        ctx.lineTo(x, p.y + 3 + Math.sin(x * 0.09) * 2.4);
      }
      ctx.stroke();

      ctx.strokeStyle = th.blade;
      ctx.lineWidth = 2;
      for (let x = p.x + 14; x < p.x + p.w; x += 58) {
        const sy = p.y + 1;
        ctx.beginPath();
        ctx.moveTo(x, sy);
        ctx.quadraticCurveTo(x + 4, sy - 9, x + 9, sy - 13);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 8, sy);
        ctx.quadraticCurveTo(x + 3, sy - 8, x + 1, sy - 12);
        ctx.stroke();
      }
    } else {
      // 石台面
      const gg = ctx.createLinearGradient(0, p.y - 3, 0, p.y + 17);
      gg.addColorStop(0, th.top[0]);
      gg.addColorStop(0.55, th.top[1]);
      gg.addColorStop(1, th.top[2]);
      ctx.fillStyle = gg;
      roundRect(ctx, p.x - 2, p.y - 2, p.w + 4, 17, 7);
      ctx.fill();

      ctx.strokeStyle = th.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + 5, p.y + 2);
      ctx.lineTo(p.x + p.w - 5, p.y + 2);
      ctx.stroke();

      // 边缘碎石
      ctx.fillStyle = th.top[2];
      for (let x = p.x + 16; x < p.x + p.w - 8; x += 66) {
        ctx.beginPath();
        ctx.ellipse(x, p.y + 16, 7, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 悬挂藤蔓
    if (th.vines && !p.ground) {
      for (let x = p.x + 30; x < p.x + p.w - 20; x += 120) {
        const sway = Math.sin(time * 1.2 + x * 0.02) * 4;
        ctx.strokeStyle = 'rgba(56,112,46,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, p.y + 26);
        ctx.quadraticCurveTo(x + 6 + sway, p.y + 46, x + sway, p.y + 62);
        ctx.stroke();
        ctx.fillStyle = '#5ba747';
        ctx.beginPath();
        ctx.ellipse(x + sway + 2, p.y + 60, 7, 4, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 洞穴石笋（悬在平台下沿）
    if (th.stalactites && !p.ground) {
      for (let x = p.x + 24; x < p.x + p.w - 16; x += 94) {
        const hh = 16 + ((x * 7) % 22);
        ctx.fillStyle = 'rgba(38,48,64,0.95)';
        ctx.beginPath();
        ctx.moveTo(x - 6, p.y + 30);
        ctx.lineTo(x + 6, p.y + 30);
        ctx.lineTo(x + 1, p.y + 30 + hh);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function drawRopes(ctx, cam, time) {
  for (const r of MAP.ropes) {
    if (r.x < cam.x - 60 || r.x > cam.x + VIEW_W + 60) continue;
    ctx.strokeStyle = 'rgba(20,16,10,0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(r.x + 2, r.y1);
    ctx.lineTo(r.x + 2, r.y2);
    ctx.stroke();
    ctx.strokeStyle = theme().grassTop ? '#c9a068' : '#a98f6b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y1);
    const seg = Math.max(1, Math.floor((r.y2 - r.y1) / 22));
    for (let i = 1; i <= seg; i++) {
      const y = r.y1 + ((r.y2 - r.y1) * i) / seg;
      ctx.lineTo(r.x + Math.sin(time * 1.5 + i * 0.9) * 1.6, y);
    }
    ctx.stroke();
    for (let y = r.y1 + 10; y < r.y2; y += 22) {
      ctx.fillStyle = '#b8874f';
      ctx.beginPath();
      ctx.arc(r.x, y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,235,190,0.5)';
      ctx.beginPath();
      ctx.arc(r.x - 1, y - 1, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8a6338';
    ctx.beginPath();
    ctx.ellipse(r.x, r.y1 + 4, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const l of MAP.ladders) {
    if (l.x < cam.x - 60 || l.x > cam.x + VIEW_W + 60) continue;
    const w = 18;
    ctx.strokeStyle = 'rgba(20,16,10,0.26)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(l.x - w / 2 + 2, l.y1);
    ctx.lineTo(l.x - w / 2 + 2, l.y2);
    ctx.moveTo(l.x + w / 2 + 2, l.y1);
    ctx.lineTo(l.x + w / 2 + 2, l.y2);
    ctx.stroke();

    ctx.strokeStyle = '#b98a53';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(l.x - w / 2, l.y1);
    ctx.lineTo(l.x - w / 2, l.y2);
    ctx.moveTo(l.x + w / 2, l.y1);
    ctx.lineTo(l.x + w / 2, l.y2);
    ctx.stroke();

    ctx.strokeStyle = '#cfa269';
    ctx.lineWidth = 4;
    for (let y = l.y1 + 12; y < l.y2; y += 20) {
      ctx.beginPath();
      ctx.moveTo(l.x - w / 2, y);
      ctx.lineTo(l.x + w / 2, y - 1);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,240,210,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(l.x - w / 2 + 1.5, l.y1);
    ctx.lineTo(l.x - w / 2 + 1.5, l.y2);
    ctx.stroke();
  }
}

function drawSigns(ctx, cam) {
  for (const s of MAP.signs) {
    if (s.x < cam.x - 100 || s.x > cam.x + VIEW_W + 100) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = 'rgba(40,30,15,0.2)';
    ctx.beginPath();
    ctx.ellipse(4, 0, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-3, -58, 6, 58);
    const g = ctx.createLinearGradient(0, -96, 0, -56);
    g.addColorStop(0, '#e8c48a');
    g.addColorStop(1, '#c79a5c');
    ctx.fillStyle = g;
    roundRect(ctx, -58, -98, 116, 44, 8);
    ctx.fill();
    ctx.strokeStyle = '#7a5128';
    ctx.lineWidth = 3;
    roundRect(ctx, -58, -98, 116, 44, 8);
    ctx.stroke();
    ctx.fillStyle = '#5c3c1e';
    ctx.font = 'bold 17px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.text, 0, -75);
    ctx.restore();
  }
}

/* 传送门 */
function drawPortals(ctx, cam, time, nearPortal) {
  if (!MAP.portals) return;
  const th = theme();
  for (const pt of MAP.portals) {
    if (pt.x < cam.x - 160 || pt.x > cam.x + VIEW_W + 160) continue;
    const pulse = 0.6 + Math.sin(time * 2.2 + pt.x * 0.01) * 0.4;
    const near = nearPortal === pt;
    const c1 = th.portal.a;
    const c2 = th.portal.b;

    ctx.save();
    ctx.translate(pt.x, pt.y);

    // 地面光圈
    ctx.save();
    ctx.globalAlpha = 0.55 + pulse * 0.3;
    const fl = ctx.createRadialGradient(0, 0, 4, 0, 0, 74);
    fl.addColorStop(0, c2);
    fl.addColorStop(0.35, c1);
    fl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fl;
    ctx.beginPath();
    ctx.ellipse(0, 0, 74, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 光柱
    const beam = ctx.createLinearGradient(0, -170, 0, 6);
    beam.addColorStop(0, 'rgba(255,255,255,0)');
    beam.addColorStop(0.45, hexA(c1, 0.35));
    beam.addColorStop(1, c1);
    ctx.save();
    ctx.globalAlpha = 0.22 + pulse * 0.16;
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-38, 2);
    ctx.lineTo(-22, -170);
    ctx.lineTo(22, -170);
    ctx.lineTo(38, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 石拱
    ctx.fillStyle = 'rgba(30,36,48,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = th.grassTop ? '#9a7448' : '#8f9bb0';
    roundRect(ctx, -44, -104, 14, 104, 6);
    ctx.fill();
    roundRect(ctx, 30, -104, 14, 104, 6);
    ctx.fill();
    roundRect(ctx, -50, -118, 100, 20, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, -44, -104, 5, 104, 3);
    ctx.fill();
    roundRect(ctx, 30, -118, 5, 20, 3);
    ctx.fill();

    // 光膜
    ctx.save();
    ctx.globalAlpha = 0.28 + pulse * 0.24;
    const mem = ctx.createLinearGradient(0, -100, 0, 0);
    mem.addColorStop(0, c2);
    mem.addColorStop(1, c1);
    ctx.fillStyle = mem;
    roundRect(ctx, -30, -100, 60, 100, 26);
    ctx.fill();
    ctx.globalAlpha = 0.5 + pulse * 0.3;
    ctx.strokeStyle = c2;
    ctx.lineWidth = 2;
    roundRect(ctx, -30, -100, 60, 100, 26);
    ctx.stroke();
    ctx.restore();

    // 名字牌
    const label = pt.label;
    ctx.font = 'bold 13px "PingFang SC", "Microsoft YaHei", sans-serif';
    const tw = ctx.measureText(label).width + 26;
    const by = -140 - Math.sin(time * 2) * 3;
    ctx.fillStyle = near ? 'rgba(24,42,32,0.9)' : 'rgba(16,26,36,0.55)';
    roundRect(ctx, -tw / 2, by - 13, tw, 26, 13);
    ctx.fill();
    ctx.strokeStyle = near ? c2 : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = near ? 2 : 1;
    roundRect(ctx, -tw / 2, by - 13, tw, 26, 13);
    ctx.stroke();
    ctx.fillStyle = near ? '#ffffff' : 'rgba(255,255,255,0.82)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, by);

    // 交互提示
    if (near) {
      ctx.font = 'bold 11px "PingFang SC", "Microsoft YaHei", sans-serif';
      const tip = '按 ↑ 或 W 进入';
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      const tw2 = ctx.measureText(tip).width + 16;
      roundRect(ctx, -tw2 / 2, by + 16, tw2, 20, 10);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(tip, 0, by + 26);
    }
    ctx.restore();
  }
}

/* 平台 / 地面上的小装饰 */
function drawGroundDecor(ctx, cam, time) {
  const th = theme();
  const kinds = th.decor;
  for (const p of MAP.platforms) {
    if (p.x + p.w < cam.x - 100 || p.x > cam.x + VIEW_W + 100) continue;
    const step = p.ground ? 170 : 130;
    for (let x = p.x + 60; x < p.x + p.w - 30; x += step) {
      const k = kinds[Math.floor((x * 13 + p.y * 7) / 31) % kinds.length];
      ctx.save();
      ctx.translate(x, p.y + 2);
      drawDecorKind(ctx, k, time, x);
      ctx.restore();
    }
  }
}

function drawDecorKind(ctx, kind, time, seed) {
  if (kind === 'flower') {
    ctx.strokeStyle = '#3f8b3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2, -10, 4, -16);
    ctx.stroke();
    const c = seed % 3 === 0 ? '#ffe066' : '#ff9ec4';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + time * 0.3;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(4 + Math.cos(a) * 4, -17 + Math.sin(a) * 4, 3.4, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff8d8';
    ctx.beginPath();
    ctx.arc(4, -17, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'mushroom') {
    ctx.fillStyle = '#f5e6cf';
    ctx.fillRect(-2, -10, 4, 10);
    ctx.fillStyle = '#d94f4f';
    ctx.beginPath();
    ctx.ellipse(0, -11, 9, 6, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-3, -13, 1.6, 0, Math.PI * 2);
    ctx.arc(3, -14, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'mushroom2') {
    ctx.fillStyle = '#e6e2c8';
    ctx.fillRect(-2.5, -13, 5, 13);
    ctx.fillStyle = '#7a4fa0';
    ctx.beginPath();
    ctx.ellipse(0, -14, 11, 7, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,180,255,0.85)';
    ctx.beginPath();
    ctx.arc(-3, -17, 2, 0, Math.PI * 2);
    ctx.arc(4, -16, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35 + Math.sin(time * 2 + seed) * 0.15;
    ctx.fillStyle = '#b98cff';
    ctx.beginPath();
    ctx.arc(0, -16, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (kind === 'rock') {
    ctx.fillStyle = '#8f9aa3';
    ctx.beginPath();
    ctx.ellipse(0, -3, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-2, -5, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'grass') {
    ctx.strokeStyle = theme().id === 'cave' ? 'rgba(120,160,200,0.7)' : '#4e9c40';
    ctx.lineWidth = 2.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 3, 0);
      ctx.quadraticCurveTo(i * 5 + 2, -8, i * 7 + 3, -13 - Math.abs(i));
      ctx.stroke();
    }
  } else if (kind === 'crystal') {
    const pu = 0.6 + Math.sin(time * 2 + seed * 0.1) * 0.4;
    ctx.globalAlpha = 0.28 * pu;
    const g = ctx.createRadialGradient(0, -14, 2, 0, -14, 42);
    g.addColorStop(0, 'rgba(140,225,255,0.95)');
    g.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -14, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    const draw = (dx, w, h, c) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(dx, -h);
      ctx.lineTo(dx + w, -h * 0.42);
      ctx.lineTo(dx + w * 0.5, 0);
      ctx.lineTo(dx - w * 0.5, 0);
      ctx.lineTo(dx - w, -h * 0.42);
      ctx.closePath();
      ctx.fill();
    };
    draw(0, 6, 24, 'rgba(120,215,255,0.85)');
    draw(-8, 4.2, 15, 'rgba(90,180,235,0.8)');
    draw(8, 4, 13, 'rgba(170,235,255,0.8)');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.lineTo(2.4, -10);
    ctx.lineTo(0, -2);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'moss') {
    ctx.fillStyle = 'rgba(86,150,92,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 13, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,210,140,0.5)';
    ctx.beginPath();
    ctx.ellipse(-4, -4, 6, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'reed') {
    ctx.strokeStyle = '#5c7a3a';
    ctx.lineWidth = 2.4;
    for (let i = -2; i <= 2; i++) {
      const sway = Math.sin(time * 1.4 + i + seed * 0.02) * 3;
      ctx.beginPath();
      ctx.moveTo(i * 3, 0);
      ctx.quadraticCurveTo(i * 4 + sway, -14, i * 5 + sway, -30 - Math.abs(i) * 4);
      ctx.stroke();
      ctx.fillStyle = '#8a9c4a';
      ctx.beginPath();
      ctx.ellipse(i * 5 + sway, -32 - Math.abs(i) * 4, 2.2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'bubble') {
    const t = (time * 0.7 + seed * 0.05) % 3;
    const alpha = Math.max(0, 0.5 - t * 0.16);
    ctx.strokeStyle = `rgba(190,230,150,${alpha})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -4 - t * 9, 3 + t, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'pillar') {
    ctx.fillStyle = 'rgba(150,140,180,0.85)';
    roundRect(ctx, -9, -34, 18, 34, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(190,182,220,0.9)';
    roundRect(ctx, -13, -40, 26, 8, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, -6, -32, 4, 30, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,95,150,0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-6, -26);
    ctx.lineTo(6, -22);
    ctx.moveTo(-6, -16);
    ctx.lineTo(6, -19);
    ctx.stroke();
  } else if (kind === 'rune') {
    const pu = 0.5 + Math.sin(time * 1.8 + seed * 0.05) * 0.5;
    ctx.globalAlpha = 0.2 + pu * 0.2;
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.ellipse(0, -3, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(255,225,150,${0.4 + pu * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -3, 15, 4.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.lineTo(0, -1);
    ctx.lineTo(6, -6);
    ctx.stroke();
  } else if (kind === 'rubble') {
    ctx.fillStyle = 'rgba(160,150,190,0.9)';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-6, -8);
    ctx.lineTo(2, -6);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(200,190,225,0.85)';
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(7, -5);
    ctx.lineTo(12, -3);
    ctx.lineTo(13, 0);
    ctx.closePath();
    ctx.fill();
  }
}
