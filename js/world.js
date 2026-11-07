'use strict';

/* ============================================================
 *  地图数据
 * ============================================================ */
const MAP = {
  name: '蘑菇森林',
  sub: '射手村 郊外',
  spawn: { x: 300, y: 1240 },
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
    // 绿蜗牛
    { type: 'snail', x: 400, y: 1240, min: 250, max: 560 },
    { type: 'snail', x: 1150, y: 1240, min: 1000, max: 1300 },
    { type: 'snail', x: 1850, y: 1240, min: 1700, max: 1960 },
    { type: 'snail', x: 2350, y: 1240, min: 2200, max: 2480 },
    { type: 'snail', x: 3060, y: 1240, min: 2960, max: 3150 },
    { type: 'snail', x: 300, y: 1118, min: 190, max: 380 },
    { type: 'snail', x: 480, y: 1118, min: 420, max: 575 },
    { type: 'snail', x: 1450, y: 1108, min: 1360, max: 1560 },
    { type: 'snail', x: 2700, y: 1110, min: 2560, max: 2820 },
    { type: 'snail', x: 950, y: 1142, min: 800, max: 1120 },
    // 蘑菇仔
    { type: 'mushroom', x: 350, y: 942, min: 280, max: 560 },
    { type: 'mushroom', x: 1000, y: 906, min: 900, max: 1150 },
    { type: 'mushroom', x: 2100, y: 1132, min: 2020, max: 2350 },
    { type: 'mushroom', x: 1600, y: 928, min: 1470, max: 1780 },
    { type: 'mushroom', x: 2750, y: 940, min: 2660, max: 2900 },
    { type: 'mushroom', x: 1450, y: 706, min: 1340, max: 1660 },
    { type: 'mushroom', x: 2250, y: 900, min: 2120, max: 2440 },
    // 木妖
    { type: 'stump', x: 700, y: 742, min: 640, max: 900 },
    { type: 'stump', x: 2100, y: 762, min: 2020, max: 2320 },
    { type: 'stump', x: 2700, y: 1240, min: 2560, max: 2830 },
    { type: 'stump', x: 1050, y: 1142, min: 780, max: 1130 },
    { type: 'stump', x: 2350, y: 900, min: 2100, max: 2460 },
    // BOSS
    { type: 'mk', x: 3020, y: 1240, min: 2880, max: 3130 },
  ],
  signs: [
    { x: 220, y: 1240, text: '蘑菇森林' },
    { x: 1240, y: 1108, text: '小心脚下' },
  ],
};

MAP.climbables = MAP.ropes
  .map((r) => ({ x: r.x, y1: r.y1, y2: r.y2, kind: 'rope' }))
  .concat(MAP.ladders.map((l) => ({ x: l.x, y1: l.y1, y2: l.y2, kind: 'ladder' })));

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

/* 背景装饰 */
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

/* ============================================================
 *  背景绘制
 * ============================================================ */
function drawBackground(ctx, cam, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#8fd7f7');
  sky.addColorStop(0.45, '#bce9fb');
  sky.addColorStop(0.8, '#e6f7fb');
  sky.addColorStop(1, '#f6fbf0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // 阳光
  const sunX = 1030;
  const sunY = 120 - cam.y * 0.12;
  const glow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 260);
  glow.addColorStop(0, 'rgba(255,247,196,0.95)');
  glow.addColorStop(0.35, 'rgba(255,240,168,0.35)');
  glow.addColorStop(1, 'rgba(255,240,168,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,252,224,0.95)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
  ctx.fill();

  // 云
  const span = VIEW_W + 700;
  for (const c of BG.clouds) {
    let sx = ((c.x - cam.x * c.p) % span + span) % span - 350;
    const sy = c.y - cam.y * 0.1;
    drawCloud(ctx, sx, sy, c.s, c.a, time + c.x);
  }

  // 远山
  const horizon = 690 - cam.y * 0.18;
  for (const h of BG.hills) {
    let sx = ((h.x - cam.x * h.p) % 3600 + 3600) % 3600 - 600;
    const g = ctx.createLinearGradient(0, horizon - h.h, 0, horizon + 40);
    g.addColorStop(0, '#a8dcc4');
    g.addColorStop(1, '#cdeacd');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, horizon + 40);
    ctx.quadraticCurveTo(sx + h.w * 0.5, horizon - h.h, sx + h.w, horizon + 40);
    ctx.closePath();
    ctx.fill();
  }

  // 远景树（剪影）
  const base = 612 - cam.y * 0.12;
  for (const tr of BG.forest) {
    let sx = ((tr.x - cam.x * tr.p) % 3500 + 3500) % 3500 - 400;
    drawTree(ctx, sx, base + tr.y, tr.s * 1.08, 'rgba(128,192,140,0.5)', 'rgba(110,174,126,0.5)', 0);
  }

  // 近景树
  const base2 = 706 - cam.y * 0.18;
  for (const tr of BG.near) {
    let sx = ((tr.x - cam.x * tr.p) % 3400 + 3400) % 3400 - 400;
    drawTree(ctx, sx, base2 + tr.y, tr.s * 1.3, 'rgba(100,174,106,0.44)', 'rgba(78,146,88,0.44)', 0);
  }

  // 空气花瓣
  ctx.save();
  for (let i = 0; i < 26; i++) {
    const seed = i * 137.5;
    const px = ((seed * 7.3 - cam.x * 0.8 + time * (12 + (i % 5) * 6)) % (VIEW_W + 80) + VIEW_W + 80) % (VIEW_W + 80) - 40;
    const py = ((seed * 3.1 + time * (18 + (i % 4) * 9)) % (VIEW_H + 120)) - 60;
    ctx.globalAlpha = 0.35 + 0.3 * Math.sin(time * 2 + i);
    ctx.fillStyle = i % 3 === 0 ? '#fff3b0' : '#ffffff';
    ctx.beginPath();
    ctx.ellipse(px, py, 3.2, 2, Math.sin(time + i) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCloud(ctx, x, y, s, a, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, -30, 0, 34);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dceefb');
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
  // 树干（背景层向下延伸，避免悬空）
  if (trunkH > 0) {
    ctx.fillStyle = 'rgba(120,88,62,0.5)';
    roundRect(ctx, -7, -60, 14, trunkH, 6);
    ctx.fill();
  }
  // 树冠
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

/* ============================================================
 *  平台 / 绳索 / 梯子
 * ============================================================ */
function drawPlatforms(ctx, cam, time) {
  for (const p of MAP.platforms) {
    if (p.x + p.w < cam.x - 80 || p.x > cam.x + VIEW_W + 80) continue;
    const h = p.ground ? 260 : 30;

    // 泥土主体
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
    g.addColorStop(0, '#a9743f');
    g.addColorStop(0.22, '#8b5c31');
    g.addColorStop(1, '#5c3c22');
    ctx.fillStyle = g;
    if (p.ground) {
      roundRect(ctx, p.x, p.y, p.w, h, 10);
    } else {
      roundRect(ctx, p.x, p.y + 6, p.w, h, 12);
    }
    ctx.fill();

    // 泥土纹理
    ctx.save();
    ctx.beginPath();
    if (p.ground) roundRect(ctx, p.x, p.y, p.w, h, 10);
    else roundRect(ctx, p.x, p.y + 6, p.w, h, 12);
    ctx.clip();
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
    ctx.restore();

    // 草皮
    const grassH = p.ground ? 20 : 16;
    const gg = ctx.createLinearGradient(0, p.y - 4, 0, p.y + grassH);
    gg.addColorStop(0, '#8fe06a');
    gg.addColorStop(0.5, '#5dbb44');
    gg.addColorStop(1, '#3f9134');
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

    // 高光
    ctx.strokeStyle = 'rgba(190,255,160,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + 2, p.y + 5);
    for (let x = p.x + 12; x <= p.x + p.w - 4; x += 22) {
      ctx.lineTo(x, p.y + 3 + Math.sin(x * 0.09) * 2.4);
    }
    ctx.stroke();

    // 草叶
    ctx.strokeStyle = 'rgba(48,120,44,0.75)';
    ctx.lineWidth = 2;
    for (let x = p.x + 14; x < p.x + p.w; x += 58) {
      const sx = x;
      const sy = p.y + 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 4, sy - 9, sx + 9, sy - 13);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy);
      ctx.quadraticCurveTo(sx + 3, sy - 8, sx + 1, sy - 12);
      ctx.stroke();
    }

    // 悬挂的藤蔓
    if (!p.ground) {
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
  }
}

function drawRopes(ctx, cam, time) {
  for (const r of MAP.ropes) {
    if (r.x < cam.x - 60 || r.x > cam.x + VIEW_W + 60) continue;
    // 影子
    ctx.strokeStyle = 'rgba(60,40,20,0.25)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(r.x + 2, r.y1);
    ctx.lineTo(r.x + 2, r.y2);
    ctx.stroke();
    // 绳身
    ctx.strokeStyle = '#c9a068';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y1);
    const seg = Math.max(1, Math.floor((r.y2 - r.y1) / 22));
    for (let i = 1; i <= seg; i++) {
      const y = r.y1 + ((r.y2 - r.y1) * i) / seg;
      ctx.lineTo(r.x + Math.sin(time * 1.5 + i * 0.9) * 1.6, y);
    }
    ctx.stroke();
    // 绳结
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
    // 顶端绑结
    ctx.fillStyle = '#8a6338';
    ctx.beginPath();
    ctx.ellipse(r.x, r.y1 + 4, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const l of MAP.ladders) {
    if (l.x < cam.x - 60 || l.x > cam.x + VIEW_W + 60) continue;
    const w = 18;
    ctx.strokeStyle = 'rgba(60,40,20,0.22)';
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
    roundRect(ctx, -56, -98, 112, 44, 8);
    ctx.fill();
    ctx.strokeStyle = '#7a5128';
    ctx.lineWidth = 3;
    roundRect(ctx, -56, -98, 112, 44, 8);
    ctx.stroke();
    ctx.fillStyle = '#5c3c1e';
    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.text, 0, -75);
    ctx.restore();
  }
}

/* 平台/地面上的小装饰 */
function drawGroundDecor(ctx, cam, time) {
  for (const p of MAP.platforms) {
    if (p.x + p.w < cam.x - 100 || p.x > cam.x + VIEW_W + 100) continue;
    const step = p.ground ? 170 : 130;
    for (let x = p.x + 60; x < p.x + p.w - 30; x += step) {
      const seed = (x * 13 + p.y) % 7;
      ctx.save();
      ctx.translate(x, p.y + 2);
      if (seed < 2) {
        // 小花
        ctx.strokeStyle = '#3f8b3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(2, -10, 4, -16);
        ctx.stroke();
        const c = seed === 0 ? '#ffe066' : '#ff9ec4';
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
      } else if (seed < 4) {
        // 蘑菇
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
      } else if (seed < 5) {
        // 石头
        ctx.fillStyle = '#8f9aa3';
        ctx.beginPath();
        ctx.ellipse(0, -3, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(-2, -5, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 草丛
        ctx.strokeStyle = '#4e9c40';
        ctx.lineWidth = 2.5;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 3, 0);
          ctx.quadraticCurveTo(i * 5 + 2, -8, i * 7 + 3, -13 - Math.abs(i));
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}
