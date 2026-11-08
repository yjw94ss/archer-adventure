'use strict';

/* ============================================================
 *  游戏主体
 * ============================================================ */
class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.stage = document.getElementById('stage');

    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpPressed: false,
      upPressed: false,
      attack: false,
      mouseActive: false,
      mouseScreenX: 700,
      mouseScreenY: 300,
      mouseWorldX: 700,
      mouseWorldY: 300,
      aimMode: 'mouse',
    };

    this.camera = { x: 0, y: 0, shake: 0 };
    this.monsters = [];
    this.arrows = [];
    this.enemyShots = [];
    this.loots = [];
    this.particles = [];
    this.texts = [];
    this.rainZones = [];
    this.cooldowns = { shot: 0, triple: 0, pierce: 0, rain: 0, eyes: 0 };

    this.time = 0;
    this.started = false;
    this.lastTs = 0;
    this.acc = 0;
    this.renderScale = 1;
    this.stageScale = 1;
    this.mouseHeld = false;
    this.keyAttack = false;
    this.flashTimer = 0;

    this.mapId = 'forest';
    this.transition = null;
    this.portalCd = 0;
    this.nearPortal = null;
    this.endingShown = false;
    this.finalCleared = false;
    this.touchMode = false;
    this.assistAngle = null;
    this.assistTarget = null;
    this.manualAimT = 0;

    this.player = new Player(this, MAP.spawn.x, MAP.spawn.y);
    this.quests = QUESTS.map((def) => ({ def, state: 'available', progress: 0 }));

    this.ui = new UI(this);

    this.spawnMonsters();
    this.initInput();
    this.initTouch();

    this.camera.x = clamp(this.player.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    this.camera.y = clamp(this.player.y - VIEW_H * 0.62, 0, WORLD_H - VIEW_H);

    this.layout();
    window.addEventListener('resize', () => this.layout());
    window.addEventListener('orientationchange', () => setTimeout(() => this.layout(), 260));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.layout());
    }
    document.addEventListener('fullscreenchange', () => setTimeout(() => this.layout(), 120));
    this.ui.update(0);
    this.ui.setMapInfo(MAP);
  }

  /* ---------- 地图切换 ---------- */
  travelTo(to, entry) {
    if (this.transition) return;
    this.transition = { t: 0, to, entry, swapped: false };
    this.portalCd = 1.2;
    this.ui.fadeMap(true);
    Sound.skill();
  }

  applyMap(id, entry, silent) {
    const def = setMap(id);
    if (!def) return;
    this.mapId = id;
    const e = def.entries[entry] || def.spawn;
    const p = this.player;
    p.x = e.x;
    p.y = e.y;
    p.vx = 0;
    p.vy = 0;
    p.climbing = false;
    p.onGround = true;
    p.groundPlatform = null;
    p.invuln = 1.2;
    this.monsters = def.spawns.map((s) => new Monster(this, s));
    this.arrows.length = 0;
    this.enemyShots.length = 0;
    this.loots.length = 0;
    this.rainZones.length = 0;
    this.nearPortal = null;
    this.camera.x = clamp(p.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    this.camera.y = clamp(p.y - VIEW_H * 0.62, 0, WORLD_H - VIEW_H);
    this.ui.setMapInfo(def);
    if (!silent) {
      this.ui.showMapBanner(def);
      this.ui.log(`进入 ${def.name} · ${def.sub}（推荐等级 ${def.suggestLv}）`, 'sys');
      this.hintQuest(def);
    }
  }

  /* 进入地图时提示可接的委托 */
  hintQuest(def) {
    const types = new Set((def.spawns || []).map((s) => s.type));
    const q = this.quests.find(
      (x) =>
        x.state === 'available' &&
        types.has(x.def.monster) &&
        (!x.def.reqLv || this.player.level >= x.def.reqLv)
    );
    if (!q) return;
    this.ui.toast('可接委托：' + q.def.name);
    this.ui.log(
      `${q.def.giver} 似乎有话想说：${this.touchMode ? '点右上「任务」' : '按 T 打开任务日志'}接取「${q.def.name}」`,
      'sys'
    );
  }

  updatePortal(dt) {
    this.nearPortal = null;
    if (this.player.dead || this.transition) return;
    const p = this.player;
    for (const pt of MAP.portals || []) {
      if (Math.abs(p.x - pt.x) > 64) continue;
      if (p.y < pt.y - 150 || p.y > pt.y + 28) continue;
      this.nearPortal = pt;
      const pressed = this.input.upPressed || (this.touchMode && this.input.up);
      if (pressed && this.portalCd <= 0) {
        if (pt.reqLv && p.level < pt.reqLv) {
          this.ui.toast(`需要 Lv.${pt.reqLv} 才能前往 ${pt.label}`);
          this.ui.log(`传送门尚未开启：${pt.label} 需要 Lv.${pt.reqLv}`, 'sys');
          this.portalCd = 1.4;
          return;
        }
        this.travelTo(pt.to, pt.entry);
        return;
      }
    }
  }

  /* ---------- 布局 ---------- */
  layout() {
    const vw = window.innerWidth || VIEW_W;
    const vh = window.innerHeight || VIEW_H;
    const s = Math.min(vw / VIEW_W, vh / VIEW_H);
    // 手机端允许缩得更小，保证整屏完整显示（不裁切）
    this.stageScale = clamp(s, 0.2, 1.6);
    this.stage.style.transform = `scale(${this.stageScale})`;

    // 供移动端 UI 反向缩放：控件与面板保持真实像素尺寸
    const inv = 1 / this.stageScale;
    const root = document.documentElement.style;
    root.setProperty('--inv', inv.toFixed(4));
    root.setProperty('--ssw', (VIEW_W * this.stageScale).toFixed(1) + 'px');
    root.setProperty('--ssh', (VIEW_H * this.stageScale).toFixed(1) + 'px');

    document.body.classList.toggle('is-portrait', vh > vw * 1.06);

    const cap = this.touchMode ? 1.35 : 2.5;
    const ratio = clamp((window.devicePixelRatio || 1) * this.stageScale, 1, cap);
    this.renderScale = ratio;
    this.canvas.width = Math.round(VIEW_W * ratio);
    this.canvas.height = Math.round(VIEW_H * ratio);
    this.canvas.style.width = VIEW_W + 'px';
    this.canvas.style.height = VIEW_H + 'px';
  }

  spawnMonsters() {
    this.monsters = MAP.spawns.map((s) => new Monster(this, s));
  }

  /* ---------- 输入 ---------- */
  initInput() {
    const blocked = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
    window.addEventListener('keydown', (e) => {
      if (blocked.includes(e.code)) e.preventDefault();
      if (!this.started) {
        if (e.code === 'Enter' || e.code === 'Space') startGame();
        return;
      }
      const inp = this.input;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          inp.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          inp.right = true;
          break;
        case 'ArrowUp':
        case 'KeyW':
          if (!e.repeat) inp.upPressed = true;
          inp.up = true;
          inp.aimMode = 'key';
          break;
        case 'ArrowDown':
        case 'KeyS':
          inp.down = true;
          inp.aimMode = 'key';
          break;
        case 'Space':
          if (!e.repeat) inp.jumpPressed = true;
          inp.jump = true;
          break;
        case 'KeyZ':
          this.keyAttack = true;
          this.input.attack = true;
          break;
        case 'Digit1':
          if (!e.repeat) this.castSkill('triple');
          break;
        // 左手也能放技能：Q / E / R / F，右手不必离开鼠标
        case 'KeyQ':
          if (!e.repeat) this.castSkill('triple');
          break;
        case 'KeyE':
          if (!e.repeat) this.castSkill('pierce');
          break;
        case 'KeyR':
          if (!e.repeat) this.castSkill('rain');
          break;
        case 'KeyF':
          if (!e.repeat) this.castSkill('eyes');
          break;
        case 'Digit2':
          if (!e.repeat) this.castSkill('pierce');
          break;
        case 'Digit3':
          if (!e.repeat) this.castSkill('rain');
          break;
        case 'Digit4':
          if (!e.repeat) this.castSkill('eyes');
          break;
        case 'Digit5':
          if (!e.repeat) this.usePotion('hp_potion');
          break;
        case 'Digit6':
          if (!e.repeat) this.usePotion('mp_potion');
          break;
        case 'KeyV':
          if (!e.repeat) this.usePotion('hp_potion');
          break;
        case 'KeyB':
          if (!e.repeat) this.usePotion('mp_potion');
          break;
        case 'KeyI':
          if (!e.repeat) this.ui.togglePanel('inventory');
          break;
        case 'KeyC':
          if (!e.repeat) this.ui.togglePanel('stats');
          break;
        case 'KeyT':
          if (!e.repeat) this.ui.togglePanel('quests');
          break;
        case 'KeyH':
          if (!e.repeat) this.ui.togglePanel('help');
          break;
        case 'Escape':
          this.ui.closePanels();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      const inp = this.input;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          inp.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          inp.right = false;
          break;
        case 'ArrowUp':
        case 'KeyW':
          inp.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          inp.down = false;
          break;
        case 'Space':
          inp.jump = false;
          break;
        case 'KeyZ':
          this.keyAttack = false;
          this.input.attack = this.mouseHeld;
          break;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.input.mouseScreenX = ((e.clientX - r.left) / r.width) * VIEW_W;
      this.input.mouseScreenY = ((e.clientY - r.top) / r.height) * VIEW_H;
      this.input.mouseActive = true;
      this.input.aimMode = 'mouse';
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      Sound.init();
      this.mouseHeld = true;
      this.input.attack = true;
      Sound.ui();
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      this.mouseHeld = false;
      this.input.attack = this.keyAttack;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // 失焦时清理按键状态
    window.addEventListener('blur', () => {
      const inp = this.input;
      inp.left = inp.right = inp.up = inp.down = inp.jump = inp.attack = false;
      this.mouseHeld = false;
      this.keyAttack = false;
    });
  }

  /* ---------- 触屏 ---------- */
  initTouch() {
    const qs = new URLSearchParams(location.search).get('touch');
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet|HarmonyOS/i.test(navigator.userAgent || '');
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isTouch = qs === '1' ? true : qs === '0' ? false : coarse || (hasTouch && mobileUA);
    if (!isTouch) return;

    this.touchMode = true;
    document.body.classList.add('is-touch');

    // 开始界面换成触屏说明
    const ctr = document.querySelector('.start-controls');
    if (ctr) {
      ctr.innerHTML =
        '<span>左侧摇杆 移动 / 攀爬</span><span>「射」按住连射</span>' +
        '<span>「跳」跳跃</span><span>技能自动瞄准最近敌人</span>';
    }
    const foot = document.querySelector('.start-foot');
    if (foot) foot.textContent = '建议横屏 · 右上角可切换全屏 · 拖动画面也可精确瞄准';
    const btn = document.getElementById('start-btn');
    if (btn) btn.textContent = '进 入 森 林';

    // 帮助面板换成触屏说明
    const hg = document.querySelector('.help-grid');
    if (hg) {
      hg.innerHTML = [
        ['摇杆', '左右移动，向上/向下攀爬绳索与梯子'],
        ['射', '按住连续射击，自动锁定最近的敌人'],
        ['跳', '跳跃；摇杆向下 + 跳 可从单向平台跳下'],
        ['拖动画面', '手动精确瞄准，松手约 2 秒后恢复自动瞄准'],
        ['技能', '三连箭 / 贯穿箭 / 箭雨 / 鹰眼（有冷却）'],
        ['红 / 蓝', '即时恢复 HP / MP，数量见按钮角标'],
        ['右上', '背包、属性、任务、帮助、全屏'],
        ['传送门', '走到地图尽头，把摇杆向上推即可进入下一章'],
      ]
        .map(([k, v]) => `<div class="hk"><kbd>${k}</kbd><span>${v}</span></div>`)
        .join('');
    }
    const tips = document.querySelector('.help-tips');
    if (tips) {
      tips.innerHTML =
        '<p>· 手机上的核心打法是「自动瞄准 + 风筝」：拉开距离，按住「射」连续输出。</p>' +
        '<p>· 摇杆向上推可抓绳索、进传送门；向下推 + 跳 可穿过单向平台。</p>' +
        '<p>· 技能有冷却与 MP 消耗，蓝药水不够时先退到高台等回蓝。</p>' +
        '<p>· 四章地图依次为：蘑菇森林 → 幽暗洞穴 → 毒雾沼泽 → 天空遗迹，等级门槛 Lv.8 / 14 / 20。</p>' +
        '<p>· 右上「全屏」可隐藏浏览器地址栏，视野更大；建议始终横屏游玩。</p>';
    }

    const inp = this.input;

    /* ---- 虚拟摇杆 ---- */
    const stick = document.getElementById('t-stick');
    const knob = document.getElementById('t-knob');
    let sid = null, cx = 0, cy = 0, R = 46;

    const applyStick = (dx, dy) => {
      const len = Math.hypot(dx, dy) || 1;
      const cl = Math.min(len, R);
      const nx = dx / len;
      const ny = dy / len;
      knob.style.transform = `translate(${(nx * cl).toFixed(1)}px, ${(ny * cl).toFixed(1)}px)`;
      const mx = (nx * cl) / R;
      const my = (ny * cl) / R;
      const dead = 0.14;
      const wasUp = inp.up;
      inp.left = mx < -dead;
      inp.right = mx > dead;
      inp.up = my < -0.36;
      inp.down = my > 0.36;
      if ((inp.up || inp.down) && Math.abs(my) > dead) inp.aimMode = 'key';
      if (inp.up && !wasUp) inp.upPressed = true;
      stick.classList.toggle('on', cl > R * 0.16);
    };

    const resetStick = () => {
      knob.style.transform = 'translate(0px, 0px)';
      inp.left = inp.right = inp.up = inp.down = false;
      stick.classList.remove('on');
    };

    stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.init();
      sid = e.pointerId;
      try { stick.setPointerCapture(sid); } catch (_) {}
      const r = stick.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      R = r.width * 0.33;
      applyStick(e.clientX - cx, e.clientY - cy);
    });
    stick.addEventListener('pointermove', (e) => {
      if (e.pointerId !== sid) return;
      e.preventDefault();
      applyStick(e.clientX - cx, e.clientY - cy);
    });
    const stickEnd = (e) => {
      if (e.pointerId !== sid) return;
      sid = null;
      resetStick();
    };
    stick.addEventListener('pointerup', stickEnd);
    stick.addEventListener('pointercancel', stickEnd);
    stick.addEventListener('lostpointercapture', stickEnd);

    /* ---- 按住型按键 ---- */
    const bindHold = (id, down, up) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        Sound.init();
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        el.classList.add('on');
        down();
      });
      const release = () => {
        el.classList.remove('on');
        if (up) up();
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('pointerleave', release);
    };

    bindHold(
      't-atk',
      () => {
        this.mouseHeld = true;
        this.input.attack = true;
        // 按下即出手，不等到下一帧，手感更跟手
        if (this.started) this.tryBasicAttack();
        Sound.ui();
      },
      () => {
        this.mouseHeld = false;
        this.input.attack = this.keyAttack;
      }
    );
    bindHold(
      't-jump',
      () => {
        this.input.jumpPressed = true;
        this.input.jump = true;
      },
      () => {
        this.input.jump = false;
      }
    );

    /* ---- 技能 / 药水 / 面板 ---- */
    document.querySelectorAll('#t-actions .t-skill').forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        Sound.init();
        b.classList.add('on');
        setTimeout(() => b.classList.remove('on'), 130);
        this.castSkill(b.dataset.skill);
      });
    });
    document.querySelectorAll('#t-actions [data-potion]').forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.classList.add('on');
        setTimeout(() => b.classList.remove('on'), 130);
        this.usePotion(b.dataset.potion);
      });
    });
    document.querySelectorAll('#touch-menu [data-panel]').forEach((b) => {
      b.addEventListener('click', () => {
        Sound.ui();
        this.ui.togglePanel(b.dataset.panel);
      });
    });

    const full = document.getElementById('t-full');
    if (full) {
      const supported = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
      if (!supported) full.style.display = 'none';
      else full.addEventListener('click', () => this.toggleFullscreen());
    }

    const skip = document.getElementById('rh-skip');
    if (skip) {
      skip.addEventListener('click', () => {
        document.getElementById('rotate-hint').classList.add('skip');
        setTimeout(() => this.layout(), 60);
      });
    }

    /* ---- 画面拖动瞄准（精确瞄准 / 按住连射） ---- */
    const aimAt = (clientX, clientY) => {
      const r = this.canvas.getBoundingClientRect();
      const sx = ((clientX - r.left) / r.width) * VIEW_W;
      const sy = ((clientY - r.top) / r.height) * VIEW_H;
      inp.mouseScreenX = sx;
      inp.mouseScreenY = sy;
      inp.mouseActive = true;
      inp.aimMode = 'mouse';
      this.manualAimT = 2.4;
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      if (!this.started) return;
      e.preventDefault();
      Sound.init();
      aimAt(e.clientX, e.clientY);
      this.mouseHeld = true;
      inp.attack = true;
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || !this.mouseHeld) return;
      e.preventDefault();
      aimAt(e.clientX, e.clientY);
    });
    const canvasUp = () => {
      if (!this.touchMode) return;
      this.mouseHeld = false;
      inp.attack = this.keyAttack;
    };
    this.canvas.addEventListener('pointerup', canvasUp);
    this.canvas.addEventListener('pointercancel', canvasUp);

    // 阻止双击缩放 / 页面滚动
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener(
      'touchmove',
      (e) => {
        const t = e.target;
        if (t && t.closest && t.closest('.panel-body, .start-card, .ending-card')) return;
        if (e.cancelable) e.preventDefault();
      },
      { passive: false }
    );
  }

  /* ---------- 全屏 ---------- */
  toggleFullscreen() {
    const d = document;
    const el = d.documentElement;
    try {
      if (!d.fullscreenElement && !d.webkitFullscreenElement) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) req.call(el);
      } else {
        const exit = d.exitFullscreen || d.webkitExitFullscreen;
        if (exit) exit.call(d);
      }
    } catch (_) {}
  }

  /* ---------- 触屏自动瞄准 ---------- */
  findAimTarget() {
    const p = this.player;
    let best = null;
    let bd = 700;
    for (const m of this.monsters) {
      if (m.dead) continue;
      const ay = m.y - m.h * 0.6;
      const dy = ay - (p.y - 44);
      if (Math.abs(dy) > 320) continue;
      const d = Math.hypot(m.x - p.x, dy);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  }

  /* ---------- 战斗 ---------- */
  getBowPos() {
    const p = this.player;
    return {
      x: p.x + Math.cos(p.aimAngle) * 22,
      y: p.y - 44 + Math.sin(p.aimAngle) * 22,
    };
  }

  tryBasicAttack() {
    const p = this.player;
    if (p.dead || p.attackTimer > 0) return;
    p.attackTimer = p.attackInterval;
    p.recoil = 0.13;
    const b = this.getBowPos();
    const crit = Math.random() < p.critRate;
    this.arrows.push(
      new Arrow(this, b.x, b.y, p.aimAngle, {
        dmg: p.atk,
        crit,
        speed: 1150,
        size: 1,
        color: '#f2f7ff',
      })
    );
    Sound.shoot();
  }

  castSkill(id) {
    if (!this.started || this.player.dead) return;
    const s = SKILL_MAP[id];
    const p = this.player;
    if (!s) return;
    if (this.cooldowns[id] > 0) return;
    if (p.mp < s.mp) {
      this.ui.toast('MP 不足，按 6 饮用蓝色药水');
      return;
    }

    p.mp -= s.mp;
    this.cooldowns[id] = s.cd;
    p.recoil = 0.15;
    Sound.skill();

    if (id === 'shot') {
      this.tryBasicAttack();
      return;
    }

    const b = this.getBowPos();
    if (id === 'triple') {
      [-0.15, 0, 0.15].forEach((off) => {
        const crit = Math.random() < p.critRate;
        this.arrows.push(
          new Arrow(this, b.x, b.y, p.aimAngle + off, {
            dmg: p.atk * s.mult,
            crit,
            speed: 1180,
            size: 0.9,
            color: '#c3f1ff',
          })
        );
      });
      this.shake(3);
    } else if (id === 'pierce') {
      const crit = Math.random() < p.critRate;
      this.arrows.push(
        new Arrow(this, b.x, b.y, p.aimAngle, {
          dmg: p.atk * s.mult,
          crit,
          speed: 1600,
          size: 1.8,
          pierce: 4,
          color: '#ffe9a8',
          life: 1.6,
        })
      );
      for (let i = 0; i < 10; i++) {
        this.particles.push(
          new Particle(b.x, b.y, rand(-120, 120), rand(-120, 120), 0.35, 'rgba(255,220,120,0.9)', 4, 0)
        );
      }
      this.shake(5);
    } else if (id === 'rain') {
      const tx = this.assistTarget
        ? this.assistTarget.x
        : this.input.aimMode === 'mouse'
        ? this.input.mouseWorldX
        : p.x + p.facing * 180;
      const ty = this.assistTarget
        ? this.assistTarget.y
        : this.input.aimMode === 'mouse'
        ? this.input.mouseWorldY
        : p.y;
      this.rainZones.push({
        x: clamp(tx, 40, WORLD_W - 40),
        y: clamp(ty, 120, WORLD_H - 20),
        time: 1.6,
        tick: 0,
        count: 0,
        dmg: p.atk * s.mult,
      });
    } else if (id === 'eyes') {
      p.buffTime = 20;
      this.ui.toast('鹰眼生效：暴击率与伤害提升 20 秒');
      this.ui.log('鹰眼发动！暴击率 +20%，暴击伤害 +40%', 'good');
      for (let i = 0; i < 26; i++) {
        this.particles.push(
          new Particle(p.x, p.y - 34, rand(-160, 160), rand(-160, 60), 0.7, 'rgba(255,230,130,0.9)', 3.4, 100)
        );
      }
    }
    if (this.ui.activePanel === 'stats') this.ui.renderStats();
  }

  damageMonster(m, baseDmg, isCrit, fromX) {
    if (m.dead) return 0;
    const p = this.player;
    let dmg = baseDmg * (isCrit ? p.critDamage : 1) * rand(0.94, 1.06);
    dmg = Math.max(1, Math.round(dmg));
    m.hurt(dmg, isCrit, fromX);
    this.texts.push(
      new FloatText(
        m.x + rand(-12, 12),
        m.y - m.h - 4,
        String(dmg),
        isCrit ? '#ffd447' : '#ffffff',
        isCrit ? 27 : 19,
        -75,
        isCrit
      )
    );
    if (isCrit) {
      Sound.crit();
      this.shake(4);
    } else {
      Sound.hit();
    }
    p.combo += 1;
    p.comboTimer = 2.4;
    return dmg;
  }

  onMonsterDeath(m) {
    const p = this.player;
    p.kills += 1;
    p.gainExp(m.cfg.exp);
    this.ui.log(`击败 ${m.name}  +${m.cfg.exp} EXP`, 'good');

    for (let i = 0; i < (m.boss ? 46 : 16); i++) {
      this.particles.push(
        new Particle(
          m.x + rand(-m.w / 2, m.w / 2),
          m.y - rand(0, m.h),
          rand(-180, 180),
          rand(-260, 40),
          rand(0.4, 0.9),
          m.boss ? 'rgba(200,130,255,0.95)' : 'rgba(255,235,200,0.95)',
          rand(2, 5),
          480
        )
      );
    }
    this.shake(m.boss ? 16 : 4);

    // 掉落
    (m.cfg.drops || []).forEach((d) => {
      if (Math.random() <= d.chance) {
        const qty = d.id === 'meso' ? randInt(d.min || 1, d.max || 10) : d.qty || 1;
        this.loots.push(new Loot(this, d.id, qty, m.x, m.y - m.h * 0.5));
      }
    });

    if (m.boss) {
      this.ui.log(`强大的 ${m.name} 被击败了！`, 'sys');
      this.ui.toast('讨伐成功：' + m.name);
      if (m.type !== 'sky_lord') {
        const def = MAPS[this.mapId];
        this.ui.log(`「${def ? def.chapter : ''}」守关 BOSS 已讨伐，可继续深入或返回补给`, 'good');
      }
    }
    this.progressQuests(m.type);

    if (m.type === 'sky_lord' && !this.finalCleared) {
      setTimeout(() => this.showEnding(), 900);
    }
  }

  /* ---------- 全章通关结算 ---------- */
  showEnding() {
    if (this.finalCleared) return;
    this.finalCleared = true;
    this.endingShown = true;
    const p = this.player;
    const cleared = this.quests.filter((q) => q.state === 'done').length;
    this.ui.showEnding([
      ['等级', 'Lv.' + p.level],
      ['累计击杀', p.kills],
      ['完成任务', cleared + ' / ' + QUESTS.length],
      ['持有金币', p.gold],
    ]);
    this.ui.log('天空守望者已被讨伐，四章旅程告一段落。感谢游玩！', 'good');
    Sound.levelup();
  }

  resumeAfterEnding() {
    this.endingShown = false;
    this.ui.hideEnding();
    this.ui.toast('可以继续在遗迹中游历，或返回森林');
  }

  progressQuests(type) {
    let changed = false;
    this.quests.forEach((q) => {
      if (q.state === 'active' && q.def.monster === type) {
        q.progress += 1;
        changed = true;
        if (q.progress >= q.def.need) {
          q.state = 'ready';
          this.ui.toast('任务完成：' + q.def.name);
          this.ui.log(`任务「${q.def.name}」目标达成，可以领取奖励了`, 'sys');
        }
      }
    });
    if (changed) {
      this.ui.updateQuestTracker();
      if (this.ui.activePanel === 'quests') this.ui.renderQuests();
    }
  }

  acceptQuest(id) {
    const q = this.quests.find((x) => x.def.id === id);
    if (!q || q.state !== 'available') return;
    if (q.def.reqLv && this.player.level < q.def.reqLv) {
      this.ui.toast(`需要 Lv.${q.def.reqLv} 才能接受该委托`);
      return;
    }
    q.state = 'active';
    q.progress = 0;
    this.ui.toast('已接受任务：' + q.def.name);
    this.ui.log(`${q.def.giver}：${q.def.desc}`, 'sys');
    this.ui.updateQuestTracker();
    this.ui.renderQuests();
    Sound.ui();
  }

  claimQuest(id) {
    const q = this.quests.find((x) => x.def.id === id);
    if (!q || q.state !== 'ready') return;
    const p = this.player;
    q.state = 'done';
    p.gainExp(q.def.rewards.exp);
    p.gold += q.def.rewards.meso;
    q.def.rewards.items.forEach((it) => p.addItem(it.id, it.qty));
    this.ui.toast('任务奖励已领取！');
    this.ui.log(`完成任务「${q.def.name}」，获得 ${q.def.rewards.exp} EXP、${q.def.rewards.meso} 金币`, 'good');
    Sound.levelup();
    this.ui.updateQuestTracker();
    this.ui.renderQuests();
    this.ui.renderInventory();
    this.ui.renderStats();
  }

  usePotion(id) {
    const p = this.player;
    if (p.dead) return;
    const idx = p.inventory.findIndex((s) => s.id === id);
    if (idx < 0) {
      this.ui.toast('背包里没有 ' + ITEMS[id].name);
      return;
    }
    p.useItem(idx);
  }

  onPlayerDeath() {
    this.ui.setDead(true);
    this.ui.log('你被击倒了…经验轻微损失，正在返回村庄', 'sys');
    this.shake(10);
  }

  onLevelUp(gained) {
    const p = this.player;
    this.ui.showLevelUp(p.level);
    this.ui.toast(`升级！Lv.${p.level} · 获得 ${gained * 5} 点能力点`);
    this.ui.log(`等级提升到 Lv.${p.level}！HP / MP 已完全恢复`, 'good');
    Sound.levelup();
    this.shake(9);
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(60, 260);
      this.particles.push(
        new Particle(p.x, p.y - 34, Math.cos(a) * sp, Math.sin(a) * sp - 120, rand(0.6, 1.2), 'rgba(255,225,120,0.95)', rand(2.5, 5), 220)
      );
    }
    this.ui.renderStats();
    this.ui.renderInventory();
  }

  shake(amount) {
    this.camera.shake = Math.max(this.camera.shake, amount);
  }

  /* ---------- 更新 ---------- */
  update(dt) {
    this.time += dt;
    const p = this.player;

    /* ---- 通关结算中：暂停世界 ---- */
    if (this.endingShown) {
      this.ui.update(dt);
      return;
    }

    /* ---- 地图切换过场 ---- */
    if (this.transition) {
      const tr = this.transition;
      tr.t += dt;
      if (!tr.swapped && tr.t >= 0.26) {
        tr.swapped = true;
        this.applyMap(tr.to, tr.entry);
      }
      if (tr.t >= 0.56) {
        this.transition = null;
        this.ui.fadeMap(false);
      }
      this.ui.update(dt);
      return;
    }

    /* ---- 打开面板时世界暂停，避免翻背包被怪物偷袭 ---- */
    if (this.ui.activePanel) {
      this.ui.update(dt);
      return;
    }

    // 鼠标世界坐标（跟随相机）
    this.input.mouseWorldX = this.input.mouseScreenX + this.camera.x;
    this.input.mouseWorldY = this.input.mouseScreenY + this.camera.y;

    // 冷却
    for (const k in this.cooldowns) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);

    /* ---- 触屏自动瞄准 ---- */
    this.assistAngle = null;
    this.assistTarget = null;
    if (this.manualAimT > 0) {
      this.manualAimT -= dt;
      if (this.manualAimT <= 0) {
        this.input.mouseActive = false;
        this.input.aimMode = 'key';
      }
    }
    if (this.touchMode && this.manualAimT <= 0 && !this.input.up && !this.input.down && !p.dead) {
      const tgt = this.findAimTarget();
      if (tgt) {
        this.assistTarget = tgt;
        this.assistAngle = Math.atan2(tgt.y - tgt.h * 0.6 - (p.y - 44), tgt.x - p.x);
      }
    }

    p.update(dt, this);
    this.input.jumpPressed = false;

    // 怪物
    this.monsters.forEach((m) => {
      if (m.dead) {
        m.respawn -= dt;
        if (m.respawn <= 0) {
          m.dead = false;
          m.hp = m.maxHp;
          m.x = m.spawn.x;
          m.y = m.spawn.y;
          m.vx = 0;
          m.vy = 0;
          m.dir = Math.random() < 0.5 ? -1 : 1;
          m.aggro = false;
          m.flash = 0;
          m.attackCd = 0.6;
        }
      } else {
        m.update(dt, this);
      }
    });

    // 箭矢
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.update(dt, this);
      if (a.dead) this.arrows.splice(i, 1);
    }
    // 敌方弹幕
    for (let i = this.enemyShots.length - 1; i >= 0; i--) {
      const s = this.enemyShots[i];
      s.update(dt, this);
      if (s.dead) this.enemyShots.splice(i, 1);
    }
    // 掉落
    for (let i = this.loots.length - 1; i >= 0; i--) {
      const l = this.loots[i];
      l.update(dt, this);
      if (l.dead) this.loots.splice(i, 1);
    }
    // 箭雨
    for (let i = this.rainZones.length - 1; i >= 0; i--) {
      const z = this.rainZones[i];
      z.time -= dt;
      z.tick -= dt;
      if (z.time <= 0) {
        this.rainZones.splice(i, 1);
        continue;
      }
      if (z.tick <= 0 && z.count < 14) {
        z.tick = 0.11;
        z.count += 1;
        const sx = z.x + rand(-110, 110);
        this.arrows.push(
          new Arrow(this, sx, Math.max(-60, z.y - 420), Math.PI / 2 + rand(-0.06, 0.06), {
            dmg: z.dmg,
            crit: Math.random() < this.player.critRate,
            speed: 1050,
            size: 1.05,
            rain: true,
            endY: z.y + 40,
            life: 2,
            color: '#d9c9ff',
          })
        );
      }
    }

    // 粒子 / 飘字
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].dead) this.particles.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      this.texts[i].update(dt);
      if (this.texts[i].dead) this.texts.splice(i, 1);
    }

    // 相机：按移动速度前探，跑得越快看得越远
    const cam = this.camera;
    const targetX = clamp(p.x - VIEW_W / 2 + clamp(p.vx * 0.2, -46, 46), 0, WORLD_W - VIEW_W);
    const targetY = clamp(p.y - VIEW_H * 0.62, 0, WORLD_H - VIEW_H);
    const k = 1 - Math.pow(0.0001, dt);
    cam.x = lerp(cam.x, targetX, k * 0.85);
    cam.y = lerp(cam.y, targetY, k * 0.7);
    cam.shake = Math.max(0, cam.shake - dt * 34);

    // 死亡覆盖
    if (!p.dead) this.ui.setDead(false);

    // 传送门
    if (this.portalCd > 0) this.portalCd -= dt;
    this.updatePortal(dt);
    this.input.upPressed = false;

    this.ui.update(dt);
  }

  /* ---------- 渲染 ---------- */
  render() {
    const ctx = this.ctx;
    const cam = this.camera;
    ctx.setTransform(this.renderScale, 0, 0, this.renderScale, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    drawBackground(ctx, cam, this.time);

    const shx = cam.shake > 0 ? rand(-cam.shake, cam.shake) : 0;
    const shy = cam.shake > 0 ? rand(-cam.shake, cam.shake) * 0.6 : 0;

    ctx.save();
    ctx.translate(-Math.round(cam.x) + shx, -Math.round(cam.y) + shy);

    drawPlatforms(ctx, cam, this.time);
    drawGroundDecor(ctx, cam, this.time);
    drawRopes(ctx, cam, this.time);
    drawSigns(ctx, cam);
    drawPortals(ctx, cam, this.time, this.nearPortal);

    // 箭雨落点
    this.rainZones.forEach((z) => {
      const a = 0.25 + Math.sin(this.time * 12) * 0.1;
      ctx.save();
      ctx.strokeStyle = `rgba(190,150,255,${a + 0.25})`;
      ctx.lineWidth = 3;
      const r = 70 + Math.sin(this.time * 6) * 8;
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, r, r * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(220,190,255,${a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, r * 0.6, r * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    this.loots.forEach((l) => l.render(ctx));
    this.monsters.forEach((m) => m.render(ctx, this.time));

    // 任务目标标记
    const targets = new Set();
    this.quests.forEach((q) => {
      if (q.state === 'active') targets.add(q.def.monster);
    });
    this.monsters.forEach((m) => {
      if (m.dead || !targets.has(m.type)) return;
      const y = m.y - m.h - 24 + Math.sin(this.time * 3 + m.x * 0.05) * 3;
      ctx.save();
      ctx.translate(m.x, y);
      ctx.fillStyle = 'rgba(30,45,60,0.35)';
      roundRect(ctx, -9, -11, 18, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#ffd257';
      roundRect(ctx, -8, -12, 16, 21, 5);
      ctx.fill();
      ctx.fillStyle = '#7a4a05';
      ctx.font = 'bold 14px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 0);
      ctx.restore();
    });

    this.enemyShots.forEach((s) => s.render(ctx));

    // 瞄准辅助线
    this.drawAimGuide(ctx);

    this.arrows.forEach((a) => a.render(ctx));
    this.player.render(ctx, this.time);

    // 角色名字
    if (!this.player.dead) {
      ctx.save();
      ctx.font = 'bold 11px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(20,35,25,0.55)';
      const label = `Lv.${this.player.level} 弓箭手`;
      ctx.strokeText(label, this.player.x, this.player.y + 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, this.player.x, this.player.y + 20);
      ctx.restore();
    }

    this.particles.forEach((p) => p.render(ctx));
    this.texts.forEach((t) => t.render(ctx));

    // 触屏锁定标记
    this.drawLockOn(ctx);

    ctx.restore();

    // 桌面准星（屏幕坐标，不随相机移动）
    const cross = this.drawCrosshair(ctx);
    if (cross !== this._crossState) {
      this._crossState = cross;
      document.body.classList.toggle('aim-cursor', cross);
    }
  }

  /* ---------- 触屏：锁定目标标记 ---------- */
  drawLockOn(ctx) {
    const t = this.assistTarget;
    if (!t || t.dead) return;
    const cx = t.x;
    const cy = t.y - t.h * 0.6;
    const base = Math.max(t.w, t.h) * 0.52 + 12;
    const r = base + Math.sin(this.time * 7) * 2;
    const a = 0.5 + Math.sin(this.time * 7) * 0.16;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.time * 0.8);
    ctx.strokeStyle = `rgba(255, 214, 120, ${a})`;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const ang = (Math.PI / 2) * i;
      ctx.beginPath();
      ctx.arc(0, 0, r, ang - 0.22, ang + 0.22);
      ctx.stroke();
    }
    ctx.restore();
    // 中心小十字
    ctx.save();
    ctx.strokeStyle = `rgba(255, 240, 200, ${a + 0.2})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy);
    ctx.lineTo(cx + 4, cy);
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx, cy + 4);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 桌面：自定义准星 ---------- */
  drawCrosshair(ctx) {
    if (this.touchMode) return false;
    const inp = this.input;
    if (!inp.mouseActive || inp.aimMode !== 'mouse') return false;
    const x = inp.mouseScreenX;
    const y = inp.mouseScreenY;
    if (x < 0 || y < 0 || x > VIEW_W || y > VIEW_H) return false;

    let hot = false;
    for (const m of this.monsters) {
      if (m.dead) continue;
      const mx = m.x - this.camera.x;
      const my = m.y - m.h * 0.6 - this.camera.y;
      if (Math.hypot(mx - x, my - y) < Math.max(m.w, m.h) * 0.62 + 10) {
        hot = true;
        break;
      }
    }

    ctx.save();
    ctx.translate(x, y);
    // 暗色描边打底，保证任何背景下都清晰
    ctx.strokeStyle = 'rgba(12, 20, 30, 0.55)';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
    // 主环
    ctx.strokeStyle = hot ? 'rgba(255, 208, 110, 0.95)' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
    // 四向短线
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const ang = (Math.PI / 2) * i;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      ctx.moveTo(c * 14, s * 14);
      ctx.lineTo(c * 20, s * 20);
    }
    ctx.stroke();
    // 中心点
    ctx.fillStyle = hot ? '#ffd166' : 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  }

  drawAimGuide(ctx) {
    const p = this.player;
    if (p.dead || p.climbing) return;
    const b = this.getBowPos();
    const len = 170;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    ctx.moveTo(b.x + Math.cos(p.aimAngle) * 26, b.y + Math.sin(p.aimAngle) * 26);
    ctx.lineTo(b.x + Math.cos(p.aimAngle) * len, b.y + Math.sin(p.aimAngle) * len);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffe9a8';
    const ex = b.x + Math.cos(p.aimAngle) * (len + 6);
    const ey = b.y + Math.sin(p.aimAngle) * (len + 6);
    ctx.beginPath();
    ctx.arc(ex, ey, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  loop(ts) {
    if (!this.lastTs) this.lastTs = ts;
    let dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;
    dt = Math.min(dt, 0.05);

    if (this.started) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= FIXED_DT && steps < 5) {
        this.update(FIXED_DT);
        this.acc -= FIXED_DT;
        steps += 1;
      }
      if (steps === 5) this.acc = 0;
    }
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
}

/* ============================================================
 *  启动
 * ============================================================ */
const game = new Game();
window.game = game;
requestAnimationFrame(game.loop.bind(game));

function startGame() {
  if (game.started) return;
  Sound.init();
  const screen = document.getElementById('start-screen');
  screen.classList.add('hide');
  setTimeout(() => (screen.style.display = 'none'), 520);
  game.started = true;
  game.lastTs = 0;
  document.body.classList.add('playing');
  game.ui.log('露西亚：森林里的蜗牛就拜托你了！', 'sys');
  game.ui.toast(game.touchMode ? '点右上「任务」接取第一份委托' : '按 T 打开任务日志，接取第一份委托');
  Sound.skill();
}

document.getElementById('start-btn').addEventListener('click', startGame);

// 便于分享 / 直接进入游戏
const __params = new URLSearchParams(location.search);
if (__params.get('play') === '1') {
  window.addEventListener('load', () => setTimeout(startGame, 120));
}

// 截图/调试：关闭所有过渡动画（无头截图的 CSS transition 不推进）
if (__params.get('notrans') === '1') {
  const st = document.createElement('style');
  st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
  document.head.appendChild(st);
}

// 调试 / 演示模式
const __test = __params.get('test');
if (__test) {
  window.addEventListener('load', () =>
    setTimeout(() => {
      startGame();
      const inp = game.input;
      const p = game.player;
      p.addItem('bow1', 1);
      p.addItem('armor1', 1);
      p.addItem('ring1', 1);
      p.addItem('shell', 12);
      p.addItem('cap', 5);
      p.addItem('hp_potion', 8);
      p.gold = 1280;
      p.exp = 60;
      game.ui.renderInventory();
      game.acceptQuest('q1');

      const dbg = document.createElement('div');
      dbg.id = 'dbg';
      dbg.style.display = 'none';
      document.body.appendChild(dbg);
      setInterval(() => {
        const bb = document.getElementById('boss-bar');
        dbg.textContent = `map=${game.mapId} x=${p.x.toFixed(1)} y=${p.y.toFixed(1)} vy=${p.vy.toFixed(1)} onGround=${p.onGround} gp=${p.groundPlatform ? p.groundPlatform.y : '-'} climb=${p.climbing} camY=${game.camera.y.toFixed(1)} kills=${p.kills} exp=${p.exp} lv=${p.level} loot=${game.loots.length} arrows=${game.arrows.length} monAlive=${game.monsters.filter((m) => !m.dead).length} inv=${p.inventory.length} portalCd=${game.portalCd.toFixed(2)} near=${game.nearPortal ? game.nearPortal.label : '-'} trans=${!!game.transition}`;
      }, 100);

      if (__test === '1') {
        inp.right = true;
        inp.attack = true;
        setTimeout(() => (p.x = 430), 300);
        setTimeout(() => game.castSkill('triple'), 900);
        setTimeout(() => game.castSkill('rain'), 1500);
        setTimeout(() => game.castSkill('pierce'), 2100);
        setTimeout(() => {
          p.takeDamage(18, 600);
        }, 2600);
        setTimeout(() => {
          inp.jumpPressed = true;
          inp.jump = true;
        }, 3000);
        setTimeout(() => {
          inp.jump = false;
          game.usePotion('mp_potion');
          game.castSkill('eyes');
        }, 3500);
        setTimeout(() => game.usePotion('hp_potion'), 4000);
      } else if (__test === '2') {
        game.ui.togglePanel('inventory');
      } else if (__test === '3') {
        game.ui.togglePanel('stats');
      } else if (__test === '4') {
        game.ui.togglePanel('quests');
      } else if (__test === '5') {
        game.ui.togglePanel('help');
      } else if (__test === '7') {
        p.x = 1600;
        p.y = 520;
        p.vy = 0;
        game.camera.x = 960;
        game.camera.y = 74;
        inp.attack = true;
      } else if (__test === '8') {
        p.x = 2900;
        p.y = 1240;
        game.camera.x = 1920;
        game.camera.y = 640;
        game.acceptQuest('q3');
      } else if (__test === '9') {
        p.x = 1000;
        p.y = 1240;
        game.camera.x = 360;
        game.camera.y = 640;
        p.mp = p.maxMp;
        setInterval(() => {
          p.mp = p.maxMp;
          game.castSkill('rain');
          game.castSkill('triple');
        }, 700);
      } else if (__test === 'map') {
        // 直接切到指定地图观察
        const mid = __params.get('m') || 'cave';
        const lv = Number(__params.get('lv') || 12);
        p.level = lv;
        p.recalcStats(true);
        game.applyMap(mid, 'west', true);
        if (__params.get('sx')) {
          p.x = Number(__params.get('sx'));
          p.y = Number(__params.get('sy') || 1300);
          p.vy = 0;
          game.camera.x = clamp(p.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
          game.camera.y = clamp(p.y - VIEW_H * 0.62, 0, WORLD_H - VIEW_H);
        }
      } else if (__test === 'ending') {
        // 预览终章通关结算
        p.level = 28;
        p.recalcStats(true);
        p.kills = 268;
        p.gold = 86420;
        game.applyMap('ruins', 'west', true);
        setTimeout(() => game.showEnding(), 120);
      } else if (__test === 'bosskill') {
        // 验证 BOSS 死亡 → 通关结算
        const mid = __params.get('m') || 'ruins';
        p.level = 28;
        p.recalcStats(true);
        game.applyMap(mid, 'west', true);
        const boss = game.monsters.find((m) => m.boss);
        if (boss) boss.hurt(999999, false, boss.x + 10);
        for (let i = 0; i < 120; i++) game.update(1 / 60);
        setTimeout(() => {
          const veil = document.getElementById('ending-veil');
          const o = document.createElement('div');
          o.id = 'simout';
          o.textContent = `BOSS ${boss ? boss.name + '@' + boss.type : 'NONE'} dead=${boss ? boss.dead : '-'} ` +
            `ending=${game.endingShown} veil="${veil.className}" frozen=${game.time} map=${game.mapId}`;
          document.body.appendChild(o);
        }, 1600);
      } else if (__test === 'portal') {
        // 确定性验证：等级门槛 → 按 ↑ 传送 → 过场落点
        const out = [];
        const step = (n) => { for (let i = 0; i < n; i++) game.update(1 / 60); };
        const goPortal = () => { inp.upPressed = true; game.update(1 / 60); };

        p.level = 5;
        p.recalcStats(true);
        p.x = 3120;
        p.y = 1240;
        p.vy = 0;
        step(6);
        out.push(`lv5 near=${game.nearPortal ? game.nearPortal.label : '-'}`);
        goPortal();
        step(10);
        out.push(`lv5_gate map=${game.mapId} cd=${game.portalCd.toFixed(1)}`);

        p.level = 12;
        p.recalcStats(true);
        game.portalCd = 0;
        step(4);
        goPortal();
        out.push(`press tr=${!!game.transition}`);
        step(45);
        out.push(`after map=${game.mapId} champ=${document.getElementById('map-ch').textContent} ` +
          `x=${p.x.toFixed(0)} y=${p.y.toFixed(0)} ground=${p.onGround}`);

        // 反向传送：洞穴西侧回到森林
        p.x = 90;
        p.y = 1360;
        p.vy = 0;
        game.portalCd = 0;
        step(6);
        goPortal();
        step(45);
        out.push(`back map=${game.mapId} champ=${document.getElementById('map-ch').textContent}`);

        const o = document.createElement('div');
        o.id = 'simout';
        o.textContent = 'PORTAL ' + out.join(' | ');
        document.body.appendChild(o);
      } else if (__test === 'portalsim') {
        // 确定性验证：静态校验 + 每张地图落点 + 传送链
        const out = [];
        let bad = 0;
        for (const id in MAPS) {
          const m = MAPS[id];
          (m.portals || []).forEach((pt) => {
            if (!MAPS[pt.to]) {
              out.push(`BAD_TARGET ${id}.${pt.label}->${pt.to}`);
              bad++;
            } else if (!MAPS[pt.to].entries[pt.entry]) {
              out.push(`BAD_ENTRY ${id}->${pt.to}:${pt.entry}`);
              bad++;
            }
          });
          const es = Object.keys(m.entries || {});
          if (!es.length) {
            out.push(`NO_ENTRY ${id}`);
            bad++;
          }
        }
        p.level = 30;
        p.recalcStats(true);
        const hop = (id, entry) => {
          game.applyMap(id, entry, true);
          for (let i = 0; i < 150; i++) game.update(1 / 60);
          out.push(`${id}@${Math.round(p.x)},${Math.round(p.y)} ground=${p.onGround} hp=${Math.round(p.hp)} mon=${game.monsters.length}`);
        };
        hop('cave', 'west');
        hop('swamp', 'west');
        hop('ruins', 'west');
        hop('forest', 'east');
        // 传送链
        game.applyMap('forest', 'east', true);
        game.travelTo('cave', 'west');
        for (let i = 0; i < 90; i++) game.update(1 / 60);
        out.push(`travel1=${game.mapId}`);
        game.travelTo('swamp', 'west');
        for (let i = 0; i < 90; i++) game.update(1 / 60);
        out.push(`travel2=${game.mapId}`);
        game.travelTo('ruins', 'west');
        for (let i = 0; i < 90; i++) game.update(1 / 60);
        out.push(`travel3=${game.mapId} lv=${p.level}`);
        const o = document.createElement('div');
        o.id = 'simout';
        o.textContent = `PORTALSIM bad=${bad} | ` + out.join(' | ');
        document.body.appendChild(o);
      } else if (__test === 'aim') {
        // 触屏：摇杆映射 / 按键 / 自动瞄准
        const out = [];
        const step = (n) => {
          for (let i = 0; i < n; i++) game.update(1 / 60);
        };
        out.push('touch=' + game.touchMode + ' inv=' + (1 / game.stageScale).toFixed(2));
        out.push('hud=' + (document.getElementById('th-hp') ? 'ok' : 'missing'));

        const stick = document.getElementById('t-stick');
        const r = stick.getBoundingClientRect();
        const pe = (type, x, y, id) =>
          new PointerEvent(type, {
            pointerId: id || 1,
            pointerType: 'touch',
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
          });
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        stick.dispatchEvent(pe('pointerdown', r.left + r.width * 0.93, cy));
        out.push('右=' + (inp.right && !inp.left));
        stick.dispatchEvent(pe('pointermove', cx, r.top + r.height * 0.04));
        out.push('上=' + inp.up);
        stick.dispatchEvent(pe('pointermove', r.left + r.width * 0.06, r.top + r.height * 0.96));
        out.push('左下=' + (inp.left && inp.down));
        stick.dispatchEvent(pe('pointerup', cx, cy));
        out.push('松手=' + (!inp.left && !inp.right && !inp.up && !inp.down));

        const atk = document.getElementById('t-atk');
        atk.dispatchEvent(pe('pointerdown', 0, 0, 2));
        out.push('attack=' + inp.attack);
        atk.dispatchEvent(pe('pointerup', 0, 0, 2));
        out.push('attackOff=' + !inp.attack);

        const jump = document.getElementById('t-jump');
        jump.dispatchEvent(pe('pointerdown', 0, 0, 3));
        out.push('jump=' + (inp.jump && inp.jumpPressed));
        jump.dispatchEvent(pe('pointerup', 0, 0, 3));
        out.push('jumpOff=' + !inp.jump);

        // 自动瞄准：站到目标左侧但背对目标
        p.x = 1480;
        p.y = 1300;
        p.vy = 0;
        p.facing = -1;
        inp.left = inp.right = inp.up = inp.down = false;
        step(8);
        let mon = null;
        let bd = 1e9;
        for (const m of game.monsters) {
          if (m.dead) continue;
          const d = Math.hypot(m.x - p.x, m.y - p.y);
          if (d < bd) {
            bd = d;
            mon = m;
          }
        }
        if (mon) {
          // 只留目标怪，保证自动瞄准锁定它
          game.monsters.forEach((m) => {
            if (m !== mon) {
              m.dead = true;
              m.respawn = 999;
            }
          });
          p.x = mon.x - 230;
          p.y = mon.y;
          p.facing = -1;
          step(6);
          out.push('assist=' + (game.assistAngle != null) + '@' + (game.assistTarget === mon));
          out.push('angle=' + (p.aimAngle * 57.3).toFixed(0) + '°');
          const hp0 = mon.hp;
          inp.attack = true;
          for (let i = 0; i < 300; i++) {
            game.update(1 / 60);
            if (mon.dead) break;
          }
          inp.attack = false;
          out.push(`${mon.type} hp=${hp0}->${Math.max(0, mon.hp).toFixed(0)} face=${p.facing}`);
        } else {
          out.push('no-monster');
        }

        const o = document.createElement('div');
        o.id = 'simout';
        o.textContent = 'AIM ' + out.join(' | ');
        document.body.appendChild(o);
      } else if (__test === 'sim') {
        // 固定步长无头模拟：验证战斗、掉落、升级、任务链路
        const sec = Number(__params.get('sec') || 40);        const dt = 1 / 60;
        const steps = Math.round(sec / dt);
        if (__params.get('m')) game.applyMap(__params.get('m'), __params.get('entry') || 'west', true);
        if (__params.get('lv')) {
          p.level = Number(__params.get('lv'));
          p.recalcStats(true);
        }
        if (__params.get('sx')) {
          p.x = Number(__params.get('sx'));
          p.y = Number(__params.get('sy') || 1240);
          p.vy = 0;
          game.camera.x = clamp(p.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
          game.camera.y = clamp(p.y - VIEW_H * 0.62, 0, WORLD_H - VIEW_H);
        }
        const skills = ['triple', 'pierce', 'rain', 'eyes'];
        window.__sim = { dmg: 0, hits: 0, kills: 0, maxLv: 1, loot: 0 };
        const holdUp = __params.get('up') === '1';
        for (let i = 0; i < steps; i++) {
          if (holdUp) inp.up = true;
          let target = null;
          let bd = 1e9;
          for (const m of game.monsters) {
            if (m.dead) continue;
            if (Math.abs(m.x - p.x) > 760 || Math.abs(m.y - p.y) > 300) continue;
            const d = Math.abs(m.x - p.x) + Math.abs(m.y - p.y) * 0.7;
            if (d < bd) {
              bd = d;
              target = m;
            }
          }
          if (target) {
            inp.left = target.x < p.x - 50;
            inp.right = target.x > p.x + 50;
            inp.aimMode = 'mouse';
            inp.mouseActive = true;
            // 注意：update 会用 mouseScreen + camera 重算世界坐标，所以这里给屏幕坐标
            inp.mouseScreenX = target.x - game.camera.x;
            inp.mouseScreenY = target.y - target.h * 0.7 - game.camera.y;
            inp.mouseWorldX = target.x;
            inp.mouseWorldY = target.y - target.h * 0.7;
            inp.attack = true;
            // 模拟真实按键：每 1.5 秒起跳一次，并按住约 0.17 秒（可变跳跃高度）
            const jumpPhase = i % 90;
            inp.jump = bd < 150 && jumpPhase < 10;
            if (bd < 150 && jumpPhase === 0) inp.jumpPressed = true;
          } else {
            inp.attack = false;
          }
          if (i % 240 === 0) game.castSkill(skills[(i / 240) % 4 | 0]);
          game.update(dt);
          window.__sim.kills = p.kills;
          window.__sim.maxLv = Math.max(window.__sim.maxLv, p.level);
          window.__sim.loot = Math.max(window.__sim.loot, game.loots.length);
          window.__sim.inv = p.inventory.length;
          const q1 = game.quests.find((q) => q.def.id === 'q1');
          window.__sim.q1 = q1 ? q1.progress : 0;
          window.__sim.dead = p.dead;
        }
        dbg.textContent =
          `SIM sec=${sec} steps=${steps} kills=${p.kills} lv=${p.level} exp=${p.exp} gold=${p.gold} ` +
          `inv=${p.inventory.length} lootSeen=${window.__sim.loot} quest1=${window.__sim.q1} ` +
          `hp=${p.hp.toFixed(0)}/${p.maxHp} mp=${p.mp.toFixed(0)} dead=${p.dead} x=${p.x.toFixed(0)} y=${p.y.toFixed(0)} climb=${p.climbing} onGround=${p.onGround} vw=${innerWidth}x${innerHeight} sc=${game.stageScale.toFixed(3)} sw=${document.getElementById('stage').getBoundingClientRect().width.toFixed(0)}`;
        const out = document.createElement('div');
        out.id = 'simout';
        if (__params.get('claim')) {
          const before = `exp=${p.exp} gold=${p.gold} lv=${p.level} inv=${p.inventory.length}`;
          game.quests.forEach((q) => {
            if (q.state === 'active') {
              q.progress = q.def.need;
              q.state = 'ready';
            }
          });
          game.quests.forEach((q) => {
            if (q.state === 'ready') game.claimQuest(q.def.id);
          });
          out.textContent = dbg.textContent + ` || CLAIM ${before} -> exp=${p.exp} gold=${p.gold} lv=${p.level} inv=${p.inventory.length}`;
        } else {
          out.textContent = dbg.textContent;
        }
        document.body.appendChild(out);
      } else if (__test === 'feel') {
        /* 手感回归：长/短跳、落地缓冲、面板暂停、按住射击时不抢绳 */
        const out = [];
        const step = (n) => {
          for (let i = 0; i < n; i++) game.update(1 / 60);
        };
        const reset = () => {
          p.x = 600;
          p.y = 1240;
          p.vx = 0;
          p.vy = 0;
          p.climbing = false;
          p.climbNode = null;
          inp.left = inp.right = inp.up = inp.down = inp.attack = false;
          inp.jump = false;
          step(8);
        };

        // 长按跳：按住整整 1 秒
        reset();
        const base = p.y;
        inp.jumpPressed = true;
        inp.jump = true;
        let top = p.y;
        for (let i = 0; i < 60; i++) {
          game.update(1 / 60);
          top = Math.min(top, p.y);
        }
        out.push(`hold=${(base - top).toFixed(0)}`);

        // 短按跳：约 5 帧（80ms）后松手
        reset();
        const base2 = p.y;
        inp.jumpPressed = true;
        inp.jump = true;
        step(5);
        inp.jump = false;
        let top2 = p.y;
        for (let i = 0; i < 45; i++) {
          game.update(1 / 60);
          top2 = Math.min(top2, p.y);
        }
        out.push(`tap=${(base2 - top2).toFixed(0)}`);

        // 落地前提前按跳：应该被缓冲，落地后立即起跳
        reset();
        p.y = 1130;
        p.vy = 0;
        step(10); // 自由落体，onGround 已变为 false，土狼时间耗尽
        const airborne = !p.onGround && p.y < 1230;
        inp.jumpPressed = true;
        inp.jump = true;
        step(1);
        out.push(`air=${airborne}&buf=${p.jumpBuf.toFixed(2)}`);
        step(20);
        out.push(`lateJump=${p.vy < -300}`);

        // 面板打开时世界暂停
        reset();
        const mon = game.monsters.find((m) => !m.dead);
        const mx0 = mon ? mon.x : 0;
        const hp0 = p.hp;
        game.ui.togglePanel('inventory');
        step(90);
        out.push(`paused=${mon ? Math.abs(mon.x - mx0) < 0.01 : 'n/a'}&hpSame=${p.hp === hp0}`);
        game.ui.closePanels();

        // 桌面：按住射击 + ↑ 只调射角，不抢绳；松开射击才抓
        reset();
        const node = MAP.climbables[0];
        if (node) {
          p.x = node.x;
          p.y = (node.y1 + node.y2) / 2;
          p.vy = 0;
          inp.attack = true;
          inp.up = true;
          inp.upPressed = true;
          step(3);
          out.push(`grabShooting=${p.climbing}`);
          inp.attack = false;
          step(6);
          out.push(`grabIdle=${p.climbing}`);
          inp.up = false;
          p.climbing = false;
        } else {
          out.push('no-rope');
        }

        // 受击硬直时长
        reset();
        p.takeDamage(5, p.x + 50);
        out.push(`hurtLock=${p.hurtLock.toFixed(2)}`);

        const o = document.createElement('div');
        o.id = 'simout';
        o.textContent = 'FEEL ' + out.join(' | ');
        document.body.appendChild(o);
      }
    }, 80)
  );
}
