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

    this.player = new Player(this, MAP.spawn.x, MAP.spawn.y);
    this.quests = QUESTS.map((def) => ({ def, state: 'available', progress: 0 }));

    this.ui = new UI(this);

    this.spawnMonsters();
    this.initInput();

    this.camera.x = clamp(this.player.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    this.camera.y = clamp(this.player.y - VIEW_H * 0.62, 0, WORLD_H - VIEW_H);

    this.layout();
    window.addEventListener('resize', () => this.layout());
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
    this.ui.log(`${q.def.giver} 似乎有话想说：按 T 打开任务日志接取「${q.def.name}」`, 'sys');
  }

  updatePortal(dt) {
    this.nearPortal = null;
    if (this.player.dead || this.transition) return;
    const p = this.player;
    for (const pt of MAP.portals || []) {
      if (Math.abs(p.x - pt.x) > 64) continue;
      if (p.y < pt.y - 150 || p.y > pt.y + 28) continue;
      this.nearPortal = pt;
      if (this.input.upPressed && this.portalCd <= 0) {
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
    const s = Math.min(window.innerWidth / VIEW_W, (window.innerHeight - 8) / VIEW_H);
    this.stageScale = clamp(s, 0.35, 1.6);
    this.stage.style.transform = `scale(${this.stageScale})`;
    const ratio = clamp((window.devicePixelRatio || 1) * this.stageScale, 1, 2.5);
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
      const tx = this.input.aimMode === 'mouse' ? this.input.mouseWorldX : p.x + p.facing * 180;
      const ty = this.input.aimMode === 'mouse' ? this.input.mouseWorldY : p.y;
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

    // 鼠标世界坐标（跟随相机）
    this.input.mouseWorldX = this.input.mouseScreenX + this.camera.x;
    this.input.mouseWorldY = this.input.mouseScreenY + this.camera.y;

    // 冷却
    for (const k in this.cooldowns) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);

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

    // 相机
    const cam = this.camera;
    const targetX = clamp(p.x - VIEW_W / 2 + p.facing * 30, 0, WORLD_W - VIEW_W);
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

    ctx.restore();
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
  game.ui.log('露西亚：森林里的蜗牛就拜托你了！', 'sys');
  game.ui.toast('按 T 打开任务日志，接取第一份委托');
  Sound.skill();
}

document.getElementById('start-btn').addEventListener('click', startGame);

// 便于分享 / 直接进入游戏
const __params = new URLSearchParams(location.search);
if (__params.get('play') === '1') {
  window.addEventListener('load', () => setTimeout(startGame, 120));
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
            inp.jump = false;
            inp.aimMode = 'mouse';
            inp.mouseActive = true;
            inp.mouseWorldX = target.x;
            inp.mouseWorldY = target.y - target.h * 0.7;
            inp.attack = true;
            if (bd < 150 && i % 90 === 0) {
              inp.jumpPressed = true;
              inp.jump = true;
            }
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
          `SIM sec=${sec} kills=${p.kills} lv=${p.level} exp=${p.exp} gold=${p.gold} ` +
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
      }
    }, 80)
  );
}
