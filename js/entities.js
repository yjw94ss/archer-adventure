'use strict';

/* ============================================================
 *  通用命中判定
 * ============================================================ */
function groundAtPoint(x, y) {
  for (const p of MAP.platforms) {
    if (x >= p.x - 4 && x <= p.x + p.w + 4 && Math.abs(p.y - y) < 18) return p;
  }
  return null;
}

/* ============================================================
 *  玩家 —— 弓箭手
 * ============================================================ */
class Player {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = 30;
    this.h = 62;
    this.facing = 1;
    this.onGround = false;
    this.groundPlatform = null;
    this.climbing = false;
    this.climbNode = null;
    this.dropTimer = 0;
    this.aimAngle = 0;
    this.aimMode = 'mouse';

    this.level = PLAYER_BASE.level;
    this.exp = 0;
    this.str = PLAYER_BASE.str;
    this.dex = PLAYER_BASE.dex;
    this.int = PLAYER_BASE.int;
    this.luk = PLAYER_BASE.luk;
    this.ap = 0;

    this.maxHp = 100;
    this.maxMp = 55;
    this.hp = 100;
    this.mp = 55;

    this.equipment = { weapon: null, armor: null, ring: null };
    this.gold = 0;
    this.inventory = [];
    this.kills = 0;

    this.attackTimer = 0;
    this.recoil = 0;
    this.invuln = 0;
    this.buffTime = 0;
    /* 手感辅助状态 */
    this.coyote = 0; // 离开平台后的宽容起跳时间
    this.jumpBuf = 0; // 落地前提前按跳的缓冲
    this.jumpCut = false; // 本次跳跃是否已松开截断
    this.squash = 0; // 落地压扁（0~0.5）
    this.hurtLock = 0; // 受击硬直
    this.dustT = 0; // 跑动扬尘节流
    this.dead = false;
    this.deadTimer = 0;
    this.animTime = 0;
    this.hurtFlash = 0;
    this.combo = 0;
    this.comboTimer = 0;

    this.recalcStats(true);
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    // 初始物资
    this.addItem('hp_potion', 6);
    this.addItem('mp_potion', 4);
  }

  /* ---------- 属性 ---------- */
  equipBonus(key) {
    let sum = 0;
    for (const slot in this.equipment) {
      const id = this.equipment[slot];
      if (!id) continue;
      sum += ITEMS[id][key] || 0;
    }
    return sum;
  }

  recalcStats(fill) {
    const oldMaxHp = this.maxHp || 100;
    const oldMaxMp = this.maxMp || 55;
    this.bonusAtk = this.equipBonus('atk');
    this.bonusHp = this.equipBonus('hp');
    this.bonusCrit = this.equipBonus('crit');
    this.bonusDex = this.equipBonus('dex');

    this.maxHp = 100 + (this.level - 1) * 28 + this.bonusHp;
    this.maxMp = 55 + (this.level - 1) * 15;

    if (fill) {
      this.hp = this.maxHp;
      this.mp = this.maxMp;
    } else {
      this.hp = clamp(this.hp + Math.max(0, this.maxHp - oldMaxHp), 1, this.maxHp);
      this.mp = clamp(this.mp + Math.max(0, this.maxMp - oldMaxMp), 0, this.maxMp);
    }
  }

  get atk() {
    let base = 5 + (this.dex + this.bonusDex) * 2 + this.level * 1.5 + this.bonusAtk;
    if (this.buffTime > 0) base *= 1.15;
    return Math.round(base);
  }

  get critRate() {
    let c = 0.12 + this.luk * 0.003 + this.bonusCrit;
    if (this.buffTime > 0) c += 0.2;
    return clamp(c, 0, 0.8);
  }

  get critDamage() {
    return 1.9 + (this.buffTime > 0 ? 0.4 : 0);
  }

  get attackInterval() {
    // 连射更利落：随 DEX / 等级成长
    return Math.max(0.16, 0.32 - this.dex * 0.0035 - this.level * 0.004);
  }

  /* ---------- 背包 ---------- */
  addItem(id, qty = 1) {
    const def = ITEMS[id];
    if (!def) return false;
    if (def.stack) {
      const slot = this.inventory.find((s) => s.id === id);
      if (slot) {
        slot.qty += qty;
        return true;
      }
    }
    if (this.inventory.length >= MAX_INV) return false;
    this.inventory.push({ id, qty });
    return true;
  }

  removeItemAt(index, qty = 1) {
    const slot = this.inventory[index];
    if (!slot) return;
    slot.qty -= qty;
    if (slot.qty <= 0) this.inventory.splice(index, 1);
  }

  countItem(id) {
    const s = this.inventory.find((i) => i.id === id);
    return s ? s.qty : 0;
  }

  useItem(index) {
    const slot = this.inventory[index];
    if (!slot) return;
    const def = ITEMS[slot.id];
    if (def.kind === 'use') {
      if (def.heal) {
        if (this.hp >= this.maxHp) {
          this.game.ui.toast('HP 已经是满的');
          return;
        }
        this.hp = Math.min(this.maxHp, this.hp + def.heal);
        this.game.texts.push(new FloatText(this.x, this.y - 78, '+' + def.heal, '#7dffa3', 22, -55));
        Sound.potion();
      }
      if (def.mana) {
        if (this.mp >= this.maxMp) {
          this.game.ui.toast('MP 已经是满的');
          return;
        }
        this.mp = Math.min(this.maxMp, this.mp + def.mana);
        this.game.texts.push(new FloatText(this.x, this.y - 78, '+' + def.mana, '#8fd0ff', 22, -55));
        Sound.potion();
      }
      this.removeItemAt(index, 1);
      this.game.ui.renderInventory();
      return;
    }
    if (def.kind === 'equip') {
      const slotName = def.slot;
      const old = this.equipment[slotName];
      this.equipment[slotName] = slot.id;
      this.inventory.splice(index, 1);
      if (old) this.inventory.push({ id: old, qty: 1 });
      this.recalcStats(false);
      this.game.ui.toast('装备了 ' + def.name);
      Sound.ui();
      this.game.ui.renderInventory();
      this.game.ui.renderStats();
    }
  }

  unequip(slotName) {
    const id = this.equipment[slotName];
    if (!id) return;
    if (this.inventory.length >= MAX_INV) {
      this.game.ui.toast('背包已满');
      return;
    }
    this.equipment[slotName] = null;
    this.inventory.push({ id, qty: 1 });
    this.recalcStats(false);
    this.game.ui.renderInventory();
    this.game.ui.renderStats();
  }

  allocate(stat) {
    if (this.ap <= 0) {
      this.game.ui.toast('没有可分配的能力点');
      return;
    }
    if (!['str', 'dex', 'int', 'luk'].includes(stat)) return;
    this[stat] += 1;
    this.ap -= 1;
    this.recalcStats(false);
    Sound.ui();
    this.game.ui.renderStats();
  }

  /* ---------- 经验 ---------- */
  gainExp(n) {
    if (this.dead) return;
    this.exp += n;
    let gained = 0;
    while (this.exp >= expNeed(this.level)) {
      this.exp -= expNeed(this.level);
      this.level += 1;
      this.ap += 5;
      gained += 1;
      if (this.level > 60) break;
    }
    if (gained > 0) {
      this.recalcStats(true);
      this.game.onLevelUp(gained);
    }
  }

  /* ---------- 战斗 ---------- */
  takeDamage(amount, fromX) {
    if (this.invuln > 0 || this.dead) return;
    const dmg = Math.max(1, Math.round(amount * rand(0.9, 1.12)));
    this.hp -= dmg;
    this.invuln = 0.9;
    this.hurtFlash = 0.35;
    this.climbing = false;
    this.vx = (this.x < fromX ? -1 : 1) * 190;
    this.vy = -255;
    this.hurtLock = 0.09;
    this.game.texts.push(new FloatText(this.x, this.y - 74, '-' + dmg, '#ff6b6b', 26, -65, true));
    this.game.particles.push(new Particle(this.x, this.y - 40, 0, 0, 0.4, 'rgba(255,90,90,0.5)', 26, 0, true));
    this.game.shake(6);
    Sound.hurt();
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deadTimer = 2.2;
      this.game.onPlayerDeath();
    }
  }

  /* ---------- 物理与输入 ---------- */
  update(dt, game) {
    const inp = game.input;
    this.animTime += dt;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.recoil = Math.max(0, this.recoil - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.buffTime = Math.max(0, this.buffTime - dt);
    this.dropTimer = Math.max(0, this.dropTimer - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.hurtLock = Math.max(0, this.hurtLock - dt);
    this.squash = Math.max(0, this.squash - dt * 2.8);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this.dead) {
      this.deadTimer -= dt;
      this.vy += GRAVITY * dt;
      this.y = Math.min(this.y + this.vy * dt, WORLD_H - 20);
      if (this.deadTimer <= 0) this.respawn();
      return;
    }

    /* ---- 瞄准 ---- */
    let aimTarget;
    if (game.assistAngle != null) {
      aimTarget = game.assistAngle;
      this.aimMode = 'assist';
    } else if (inp.aimMode === 'mouse' && inp.mouseActive) {
      aimTarget = Math.atan2(inp.mouseWorldY - (this.y - 44), inp.mouseWorldX - this.x);
      this.aimMode = 'mouse';
    } else {
      this.aimMode = 'key';
      const horizontal = inp.left || inp.right;
      if (inp.up && !inp.down) {
        aimTarget = horizontal ? (this.facing > 0 ? -Math.PI / 4 : (-3 * Math.PI) / 4) : -Math.PI / 2;
      } else if (inp.down && !inp.up) {
        aimTarget = horizontal ? (this.facing > 0 ? Math.PI / 4 : (3 * Math.PI) / 4) : Math.PI / 2;
      } else {
        aimTarget = this.facing > 0 ? 0 : Math.PI;
      }
    }

    if (this.aimMode === 'key') {
      // 八方向瞄准要求精确，直接对齐
      this.aimAngle = aimTarget;
    } else {
      // 鼠标 / 自动瞄准走角度插值，避免准星抖动与手臂瞬移
      let d = aimTarget - this.aimAngle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const k = this.aimMode === 'assist' ? 1 - Math.pow(0.00002, dt) : 1 - Math.pow(0.000005, dt);
      this.aimAngle += d * k;
    }
    if (Math.abs(Math.cos(aimTarget)) > 0.2) {
      this.facing = Math.cos(aimTarget) > 0 ? 1 : -1;
    }

    /* ---- 攀爬 ---- */
    if (this.climbing) {
      const node = this.climbNode;
      this.vx = 0;
      this.vy = 0;
      this.x = lerp(this.x, node.x, 1 - Math.pow(0.0001, dt));
      const spd = 165;
      if (inp.up) this.y -= spd * dt;
      if (inp.down) this.y += spd * dt;
      this.animTime += (inp.up || inp.down) ? dt * 1.6 : 0;
      this.y = clamp(this.y, node.y1, node.y2);

      if (this.y <= node.y1 + 1 && inp.up) {
        this.climbing = false;
        this.y = node.y1 - 2;
        this.onGround = true;
        this.vy = 0;
      }
      if (this.y >= node.y2 - 1 && inp.down) {
        this.climbing = false;
        this.y = Math.min(node.y2, WORLD_H);
      }
      if (inp.jumpPressed) {
        this.climbing = false;
        this.vy = -640;
        this.vx = this.facing * 260;
      }
      if (inp.attack) game.tryBasicAttack();
      return;
    }

    /* ---- 抓绳子 ---- */
    // 桌面上按住射击 + ↑ 只调整射角，不抢绳子；触屏摇杆上推仍可攀爬
    const wantGrab = inp.up || (!this.onGround && inp.down);
    if (wantGrab && !(inp.attack && !game.touchMode)) {
      for (const node of MAP.climbables) {
        if (Math.abs(this.x - node.x) > 20) continue;
        if (this.y < node.y1 - 6 || this.y > node.y2 + 6) continue;
        // 站在平台上按上才抓；空中则上下都可抓
        this.climbing = true;
        this.climbNode = node;
        this.onGround = false;
        this.vx = 0;
        this.vy = 0;
        break;
      }
    }
    if (this.climbing) return;

    /* ---- 左右移动 ---- */
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const maxSpeed = 335;
    const accel = this.onGround ? 3000 : 1800;
    if (this.hurtLock > 0) {
      // 受击硬直：保留击退位移，短暂不响应转向，避免被弹开又被拉回
      this.vx = clamp(this.vx, -maxSpeed, maxSpeed);
    } else if (dir !== 0) {
      this.vx += dir * accel * dt;
      this.vx = clamp(this.vx, -maxSpeed, maxSpeed);
      // 键盘瞄准时朝向跟随移动；鼠标/自动瞄准下，只有不射击时才把身体转向移动方向
      if (inp.aimMode === 'key') this.facing = dir;
      else if (!inp.attack) this.facing = dir;
    } else {
      const fr = (this.onGround ? 3200 : 520) * dt;
      if (Math.abs(this.vx) <= fr) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * fr;
    }

    // 跑动扬尘
    this.dustT -= dt;
    if (this.onGround && Math.abs(this.vx) > 210 && this.dustT <= 0 && this.hurtLock <= 0) {
      this.dustT = 0.17;
      this.game.particles.push(
        new Particle(this.x - Math.sign(this.vx) * 8, this.y - 2, -this.vx * 0.12, rand(-26, -8), 0.32, 'rgba(233,222,190,0.5)', 5, -60)
      );
    }

    /* ---- 跳跃：土狼时间 + 输入缓冲 + 可变高度 ---- */
    this.coyote = this.onGround ? 0.1 : Math.max(0, this.coyote - dt);
    this.jumpBuf = inp.jumpPressed ? 0.2 : Math.max(0, this.jumpBuf - dt);
    if (this.jumpBuf > 0 && this.coyote > 0) {
      const plat = this.groundPlatform;
      this.jumpBuf = 0;
      this.coyote = 0;
      if (inp.down && plat && !plat.ground) {
        this.dropTimer = 0.2;
        this.onGround = false;
        this.vy = 90;
      } else {
        this.vy = -775;
        this.jumpCut = false;
        this.onGround = false;
        for (let i = 0; i < 3; i++) {
          this.game.particles.push(
            new Particle(this.x + rand(-8, 8), this.y, rand(-80, 80), rand(-40, -5), 0.32, 'rgba(255,255,255,0.5)', 8, -220)
          );
        }
      }
    }

    // 松开跳跃键提前收力：短按小跳、长按跳高
    if (!inp.jump && !this.jumpCut && this.vy < -190) {
      this.vy *= 0.55;
      this.jumpCut = true;
    }

    /* ---- 重力 ---- */
    const rising = this.vy < 0 && inp.jump;
    let gMul = rising ? 0.6 : 1;
    if (!this.onGround && Math.abs(this.vy) < 175) gMul *= 0.74; // 顶点短暂悬浮，滞空更好读
    this.vy += GRAVITY * gMul * dt;
    this.vy = Math.min(this.vy, 1350);

    /* ---- 位移与碰撞 ---- */
    const prevBottom = this.y;
    const wasGround = this.onGround;
    const fallVy = this.vy;
    this.x = clamp(this.x + this.vx * dt, 24, WORLD_W - 24);
    this.y += this.vy * dt;

    this.onGround = false;
    this.groundPlatform = null;
    if (this.vy >= 0 && this.dropTimer <= 0) {
      for (const p of MAP.platforms) {
        if (this.x + this.w / 2 < p.x || this.x - this.w / 2 > p.x + p.w) continue;
        if (prevBottom <= p.y + 2 && this.y >= p.y) {
          this.y = p.y;
          this.vy = 0;
          this.onGround = true;
          this.groundPlatform = p;
          break;
        }
      }
    }
    if (this.y > WORLD_H - 10) {
      this.y = WORLD_H - 10;
      this.vy = 0;
      this.onGround = true;
    }

    // 落地反馈：压扁 + 扬尘
    if (this.onGround && !wasGround && fallVy > 240) {
      this.squash = clamp(fallVy / 1600, 0.1, 0.46);
      for (let i = 0; i < 5; i++) {
        this.game.particles.push(
          new Particle(
            this.x + rand(-12, 12),
            this.y - 2,
            rand(-120, 120),
            rand(-55, -10),
            0.34,
            'rgba(240,232,208,0.55)',
            rand(4, 8),
            -120
          )
        );
      }
      if (fallVy > 900) this.game.shake(2.4);
    }

    // 落地瞬间让提前按下的跳跃立即生效（否则缓冲会白按）
    if (this.onGround && this.jumpBuf > 0 && !inp.down) {
      this.jumpBuf = 0;
      this.coyote = 0;
      this.vy = -775;
      this.jumpCut = false;
      this.squash = 0;
      this.onGround = false;
      this.groundPlatform = null;
      for (let i = 0; i < 3; i++) {
        this.game.particles.push(
          new Particle(this.x + rand(-8, 8), this.y, rand(-70, 70), rand(-40, -5), 0.3, 'rgba(255,255,255,0.45)', 7, -200)
        );
      }
    }

    if (inp.attack) game.tryBasicAttack();
    if (this.hp > 0 && this.onGround) this.mp = Math.min(this.maxMp, this.mp + 1.8 * dt);
  }

  respawn() {
    const s = MAP.spawn;
    this.x = s.x;
    this.y = s.y;
    this.vy = 0;
    this.vx = 0;
    this.hp = Math.round(this.maxHp * 0.6);
    this.mp = Math.round(this.maxMp * 0.5);
    this.dead = false;
    this.invuln = 2;
    this.exp = Math.max(0, this.exp - Math.floor(expNeed(this.level) * 0.05));
    this.game.camera.x = clamp(this.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    this.game.camera.y = clamp(this.y - VIEW_H * 0.62, 0, WORLD_H - VIEW_H);
    this.game.ui.log(`你在 ${MAP.name} 重新站了起来`);
  }

  /* ---------- 绘制 ---------- */
  render(ctx, t) {
    const moving = this.onGround && Math.abs(this.vx) > 30;
    const phase = this.animTime * 12;
    const bob = this.dead
      ? 0
      : this.onGround
      ? moving
        ? Math.abs(Math.sin(phase)) * 2.2
        : Math.sin(t * 2.2) * 1.2
      : 0;

    // 影子
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#0d2a17';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 1, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y - bob);
    if (this.squash > 0.002 && !this.dead) {
      // 落地瞬间的挤压感（以脚底为支点）
      ctx.scale(1 + this.squash * 0.55, 1 - this.squash * 0.62);
    }
    if (this.dead) ctx.rotate(this.facing * 1.3);
    if (this.invuln > 0 && !this.dead && Math.floor(this.invuln * 16) % 2 === 0) ctx.globalAlpha = 0.4;

    // 升级光环
    if (this.buffTime > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(t * 8) * 0.12;
      const g = ctx.createRadialGradient(0, -34, 6, 0, -34, 54);
      g.addColorStop(0, 'rgba(255,220,120,0.5)');
      g.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -34, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.scale(this.facing, 1);
    this.drawBody(ctx, t, phase, moving);
    ctx.restore();

    this.drawBow(ctx, t);

    ctx.restore();
  }

  drawBody(ctx, t, phase, moving) {
    const climbing = this.climbing;
    const swing = moving ? Math.sin(phase) * 6 : 0;
    const climbSwing = climbing ? Math.sin(this.animTime * 9) * 5 : 0;
    const legL = climbing ? climbSwing : swing;
    const legR = climbing ? -climbSwing : -swing;

    // 箭筒
    ctx.save();
    ctx.translate(-10, -43);
    ctx.rotate(-0.34);
    ctx.fillStyle = '#8a5a2b';
    roundRect(ctx, -6, -2, 12, 27, 5);
    ctx.fill();
    ctx.strokeStyle = '#5f3d1d';
    ctx.lineWidth = 2;
    roundRect(ctx, -6, -2, 12, 27, 5);
    ctx.stroke();
    ctx.strokeStyle = '#efe4c8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const ax = -3 + i * 3;
      ctx.beginPath();
      ctx.moveTo(ax, 0);
      ctx.lineTo(ax + 1, -15);
      ctx.stroke();
      ctx.fillStyle = i === 1 ? '#ffd166' : '#e05a5a';
      ctx.beginPath();
      ctx.moveTo(ax + 1, -20);
      ctx.lineTo(ax - 1.5, -14);
      ctx.lineTo(ax + 3.5, -14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 腿
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5c4026';
    ctx.lineWidth = 7;
    if (climbing) {
      ctx.beginPath();
      ctx.moveTo(-3, -20);
      ctx.lineTo(-7 + legL, -2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, -20);
      ctx.lineTo(8 + legR, -2);
      ctx.stroke();
    } else if (this.onGround) {
      ctx.beginPath();
      ctx.moveTo(-2, -21);
      ctx.lineTo(-2 + legL * 0.9, -2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, -21);
      ctx.lineTo(5 + legR * 0.9, -2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-2, -21);
      ctx.lineTo(-7, -4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, -21);
      ctx.lineTo(11, -6);
      ctx.stroke();
    }

    // 靴子
    ctx.fillStyle = '#4a3120';
    const bootY = climbing ? -2 : -2;
    ctx.beginPath();
    ctx.ellipse(-2 + (climbing ? -7 + legL : this.onGround ? legL * 0.9 : -5), bootY, 6, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5 + (climbing ? 8 + legR : this.onGround ? legR * 0.9 : 6), bootY, 6, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 身体
    const bodyG = ctx.createLinearGradient(-10, -40, 10, -16);
    bodyG.addColorStop(0, '#71c3e2');
    bodyG.addColorStop(0.55, '#3f87b0');
    bodyG.addColorStop(1, '#2a5f80');
    ctx.fillStyle = bodyG;
    roundRect(ctx, -10, -42, 20, 25, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(22,58,80,0.6)';
    ctx.lineWidth = 1.6;
    roundRect(ctx, -10, -42, 20, 25, 8);
    ctx.stroke();

    // 披风领
    ctx.fillStyle = '#2b6183';
    ctx.beginPath();
    ctx.moveTo(-11, -40);
    ctx.quadraticCurveTo(0, -45, 11, -40);
    ctx.lineTo(9, -33);
    ctx.quadraticCurveTo(0, -37, -9, -33);
    ctx.closePath();
    ctx.fill();

    // 围巾
    ctx.fillStyle = '#f3e6c8';
    ctx.beginPath();
    ctx.moveTo(-9, -40);
    ctx.quadraticCurveTo(0, -44, 9, -40);
    ctx.lineTo(8, -36);
    ctx.quadraticCurveTo(0, -39, -8, -36);
    ctx.closePath();
    ctx.fill();

    // 腰带
    ctx.fillStyle = '#6b4420';
    ctx.fillRect(-10, -24, 20, 5);
    ctx.fillStyle = '#e8c46a';
    ctx.fillRect(-2.5, -24.5, 5, 6);

    // 头
    ctx.fillStyle = '#f7cfae';
    ctx.beginPath();
    ctx.arc(0, -53, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,55,0.45)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-11, -52, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 头发
    ctx.fillStyle = '#b0703a';
    ctx.beginPath();
    ctx.arc(0, -55, 13.4, Math.PI * 1.02, Math.PI * 2.02);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-13, -55);
    ctx.quadraticCurveTo(-16, -46, -12, -44);
    ctx.quadraticCurveTo(-10, -50, -7, -54);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-4, -62);
    ctx.quadraticCurveTo(2, -64, 6, -60);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 兜帽
    ctx.fillStyle = 'rgba(40,94,126,0.92)';
    ctx.beginPath();
    ctx.moveTo(-13, -58);
    ctx.quadraticCurveTo(-2, -70, 11, -58);
    ctx.quadraticCurveTo(0, -62, -13, -58);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.ellipse(5, -52, 2.1, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-2, -52, 1.9, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(5.6, -53.2, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 嘴
    ctx.strokeStyle = '#c07a52';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(3, -46, 3, 0.25, 1.2);
    ctx.stroke();

    // 攀爬时的手臂
    if (climbing) {
      ctx.strokeStyle = '#f7cfae';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-8, -38);
      ctx.lineTo(-12, -56 + Math.sin(this.animTime * 9) * 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -38);
      ctx.lineTo(12, -56 - Math.sin(this.animTime * 9) * 4);
      ctx.stroke();
    }
  }

  drawBow(ctx) {
    const rec = clamp(this.recoil / 0.14, 0, 1);
    const pull = 5 + rec * 9;
    ctx.save();
    ctx.translate(0, -44);
    ctx.rotate(this.aimAngle);

    // 后臂
    ctx.strokeStyle = '#eab894';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9, 6);
    ctx.lineTo(-3 - pull * 0.4, 0);
    ctx.stroke();

    // 弓身
    ctx.save();
    ctx.translate(9, 0);
    const bg = ctx.createLinearGradient(0, -24, 0, 24);
    bg.addColorStop(0, '#d29a58');
    bg.addColorStop(0.5, '#a9713d');
    bg.addColorStop(1, '#7f5228');
    ctx.strokeStyle = bg;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 23, -1.16, 1.16);
    ctx.stroke();
    // 弓身高光
    ctx.strokeStyle = 'rgba(255,230,190,0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 24.6, -1.1, 1.1);
    ctx.stroke();
    // 握把
    ctx.strokeStyle = '#5c3b1c';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 23, -0.18, 0.18);
    ctx.stroke();

    // 弓弦
    const tipX = 23 * Math.cos(1.16);
    const tipY = 23 * Math.sin(1.16);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(tipX, -tipY);
    ctx.lineTo(-pull, 0);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // 搭箭
    if (rec > 0.02) {
      ctx.strokeStyle = '#e8dcc0';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-pull, 0);
      ctx.lineTo(34, 0);
      ctx.stroke();
      ctx.fillStyle = '#dfe9f5';
      ctx.beginPath();
      ctx.moveTo(38, 0);
      ctx.lineTo(30, -3.6);
      ctx.lineTo(30, 3.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 前手
    ctx.fillStyle = '#f7cfae';
    ctx.beginPath();
    ctx.arc(13, 0, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,120,80,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(13, 0, 4.6, 0, Math.PI * 2);
    ctx.stroke();

    // 拉弦的手
    ctx.fillStyle = '#f7cfae';
    ctx.beginPath();
    ctx.arc(-3 - pull * 0.4, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* ============================================================
 *  箭矢
 * ============================================================ */
class Arrow {
  constructor(game, x, y, angle, opts = {}) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.angle = angle;
    const speed = opts.speed || 1150;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.dmg = opts.dmg || 10;
    this.crit = !!opts.crit;
    this.pierce = opts.pierce || 0;
    this.hits = new Set();
    this.life = opts.life || 1.3;
    this.size = opts.size || 1;
    this.color = opts.color || '#f2f7ff';
    this.rain = !!opts.rain;
    this.endY = opts.endY !== undefined ? opts.endY : null;
    this.dead = false;
    this.trail = [];
  }

  update(dt, game) {
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -50 || this.x > WORLD_W + 50 || this.y < -100 || this.y > WORLD_H + 50) {
      this.dead = true;
      return;
    }

    // 箭雨落地即消失
    if (this.rain && this.endY !== null && this.y > this.endY) {
      this.dead = true;
      for (let i = 0; i < 3; i++) {
        game.particles.push(
          new Particle(this.x, this.y, rand(-50, 50), rand(-60, 0), 0.25, 'rgba(200,170,255,0.8)', 3, 200)
        );
      }
      return;
    }

    // 撞到平台（箭雨穿透地形）
    if (!this.rain) {
      for (const p of MAP.platforms) {
        const h = p.ground ? 200 : 28;
        if (this.x > p.x && this.x < p.x + p.w && this.y > p.y + 3 && this.y < p.y + h) {
          this.dead = true;
          for (let i = 0; i < 4; i++) {
            game.particles.push(
              new Particle(this.x, this.y, rand(-70, 70), rand(-90, 10), 0.3, 'rgba(210,180,130,0.9)', 3, 400)
            );
          }
          return;
        }
      }
    }

    // 命中怪物
    for (const m of game.monsters) {
      if (m.dead || this.hits.has(m)) continue;
      const hw = m.w / 2 + 10;
      if (Math.abs(this.x - m.x) < hw && this.y > m.y - m.h - 16 && this.y < m.y + 8) {
        this.hits.add(m);
        const d = game.damageMonster(m, this.dmg, this.crit, this.x);
        if (d > 0) {
          for (let i = 0; i < 5; i++) {
            game.particles.push(
              new Particle(
                this.x,
                this.y,
                rand(-120, 120),
                rand(-140, 40),
                0.35,
                this.crit ? 'rgba(255,214,90,0.95)' : 'rgba(255,255,255,0.9)',
                this.crit ? 4 : 3,
                420
              )
            );
          }
        }
        if (this.hits.size > this.pierce) {
          this.dead = true;
          return;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    // 拖尾
    ctx.strokeStyle = this.rain ? 'rgba(190,160,255,0.5)' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2.5 * this.size;
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.size, this.size);

    // 箭杆
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    // 箭头
    ctx.fillStyle = this.crit ? '#ffd166' : this.color;
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.lineTo(8, -4.2);
    ctx.lineTo(8, 4.2);
    ctx.closePath();
    ctx.fill();
    // 尾羽
    ctx.fillStyle = this.rain ? '#b9a3ff' : '#e7eefc';
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-14, -4);
    ctx.lineTo(-10, -1);
    ctx.lineTo(-10, 1);
    ctx.lineTo(-14, 4);
    ctx.closePath();
    ctx.fill();

    if (this.crit) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ffcf5c';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* ============================================================
 *  敌方弹幕
 * ============================================================ */
const SHOT_STYLE = {
  spore: { core: '#f0d0ff', mid: 'rgba(180,110,240,0.75)', edge: 'rgba(120,50,180,0)' },
  poison: { core: '#d8ffb0', mid: 'rgba(130,200,70,0.75)', edge: 'rgba(80,150,40,0)' },
  seed: { core: '#ffe6b0', mid: 'rgba(190,150,70,0.75)', edge: 'rgba(130,95,30,0)' },
  orb: { core: '#ffe9c0', mid: 'rgba(255,180,110,0.7)', edge: 'rgba(220,120,50,0)' },
};

class EnemyShot {
  constructor(game, x, y, tx, ty, dmg, kind, speed) {
    this.game = game;
    this.x = x;
    this.y = y;
    const a = Math.atan2(ty - y, tx - x);
    const sp = speed || 320;
    this.vx = Math.cos(a) * sp;
    this.vy = Math.sin(a) * sp;
    this.dmg = dmg;
    this.life = 3.4;
    this.r = 11;
    this.kind = kind || 'spore';
    this.dead = false;
    this.t = 0;
  }

  update(dt, game) {
    this.t += dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.t > 0.15) {
      const p = game.player;
      if (Math.abs(this.x - p.x) < p.w / 2 + this.r && Math.abs(this.y - (p.y - p.h / 2)) < p.h / 2 + this.r) {
        p.takeDamage(this.dmg, this.x);
        this.dead = true;
        return;
      }
    }
    for (const pl of MAP.platforms) {
      const h = pl.ground ? 200 : 28;
      if (this.x > pl.x && this.x < pl.x + pl.w && this.y > pl.y + 2 && this.y < pl.y + h) {
        this.dead = true;
        for (let i = 0; i < 6; i++) {
          game.particles.push(new Particle(this.x, this.y, rand(-80, 80), rand(-100, 20), 0.4, 'rgba(190,120,255,0.8)', 4, 300));
        }
        return;
      }
    }
  }

  render(ctx) {
    const st = SHOT_STYLE[this.kind] || SHOT_STYLE.spore;
    ctx.save();
    const glow = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.r + 8);
    glow.addColorStop(0, st.core);
    glow.addColorStop(0.6, st.mid);
    glow.addColorStop(1, st.edge);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.kind === 'poison' ? '#4f8a2c' : this.kind === 'seed' ? '#8a6a2a' : this.kind === 'orb' ? '#c47a2a' : '#7a3ba8';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    // 旋转内纹
    ctx.strokeStyle = st.core;
    ctx.lineWidth = 1.6;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.t * 5);
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.6, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ============================================================
 *  怪物
 * ============================================================ */
class Monster {
  constructor(game, spawn) {
    this.game = game;
    this.spawn = spawn;
    this.type = spawn.type;
    const cfg = MONSTER_TYPES[this.type];
    this.cfg = cfg;
    this.name = cfg.name;
    this.level = cfg.level;
    this.maxHp = cfg.maxHp;
    this.hp = cfg.maxHp;
    this.w = cfg.w;
    this.h = cfg.h;
    this.x = spawn.x;
    this.y = spawn.y;
    this.homeX = spawn.x;
    this.min = spawn.min;
    this.max = spawn.max;
    this.vx = 0;
    this.vy = 0;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.onGround = false;
    this.attackCd = 0;
    this.flash = 0;
    this.dead = false;
    this.respawn = 0;
    this.animT = Math.random() * 10;
    this.hopT = rand(0, 2);
    this.shootCd = rand(1.5, 3);
    this.aggro = false;
    this.hitShake = 0;
    this.chargeCd = rand(1.2, 2.4);
    this.charging = false;
    this.chargeT = 0;
    this.boss = !!cfg.boss;
  }

  update(dt, game) {
    this.animT += dt;
    if (this.dead) return;
    this.flash = Math.max(0, this.flash - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.hitShake = Math.max(0, this.hitShake - dt);
    const p = game.player;
    const cfg = this.cfg;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const aggroRange = this.boss ? 640 : cfg.flying ? 440 : 320;
    this.aggro = !p.dead && Math.abs(dx) < aggroRange && Math.abs(dy) < (cfg.flying ? 250 : 160);

    const speed = cfg.speed;

    /* ---- 远程攻击 ---- */
    if (cfg.ranged && !p.dead) {
      this.shootCd -= dt;
      const shootRange = this.aggro ? aggroRange : this.boss ? 720 : 0;
      if (this.shootCd <= 0 && shootRange && Math.abs(dx) < shootRange && Math.abs(dy) < 340) {
        this.shootCd = cfg.ranged.cd;
        const kind = cfg.ranged.kind;
        const mx = this.x;
        const my = this.y - this.h * 0.72;
        game.enemyShots.push(new EnemyShot(game, mx, my, p.x, p.y - 34, cfg.atk * cfg.ranged.dmg, kind, cfg.ranged.speed));
        game.particles.push(new Particle(mx, my, 0, 0, 0.36, 'rgba(255,235,190,0.7)', 15, 0, true));
      }
    }

    if (cfg.flying) {
      /* ---- 飞行怪：自由追击 ---- */
      if (this.aggro) {
        const tvx = p.x - this.x;
        const tvy = p.y - 58 - this.y;
        this.vx = lerp(this.vx, clamp(tvx * 1.8, -speed * 2.3, speed * 2.3), 1 - Math.pow(0.02, dt));
        this.vy = lerp(this.vy, clamp(tvy * 1.8, -speed * 1.8, speed * 1.8), 1 - Math.pow(0.02, dt));
      } else {
        if (this.x <= this.min) this.dir = 1;
        if (this.x >= this.max) this.dir = -1;
        this.vx = lerp(this.vx, this.dir * speed * 0.55, 1 - Math.pow(0.01, dt));
        this.vy = lerp(this.vy, 0, 1 - Math.pow(0.06, dt));
      }
      if (this.vx > 6) this.dir = 1;
      else if (this.vx < -6) this.dir = -1;
      this.x = clamp(this.x + this.vx * dt, 20, WORLD_W - 20);
      this.y = clamp(this.y + this.vy * dt, 90, WORLD_H - 60);
      this.onGround = false;
    } else {
      /* ---- 地面怪 ---- */
      if (cfg.static) {
        this.vx = 0;
        if (this.aggro) this.dir = dx > 0 ? 1 : -1;
      } else if (this.aggro) {
        if (Math.abs(dx) > 8) this.dir = dx > 0 ? 1 : -1;
        if (cfg.charger) {
          this.chargeCd -= dt;
          if (this.charging) {
            this.chargeT -= dt;
            this.vx = this.dir * speed * 4.6;
            if (this.chargeT <= 0 || Math.abs(dx) < 26) {
              this.charging = false;
              this.chargeCd = 2.6;
              this.vx *= 0.2;
            }
          } else if (this.chargeCd <= 0 && Math.abs(dx) < 470 && Math.abs(dy) < 90) {
            this.charging = true;
            this.chargeT = 0.72;
            this.vx = this.dir * speed * 2;
            game.particles.push(new Particle(this.x, this.y - 24, 0, 0, 0.4, 'rgba(255,150,90,0.75)', 22, 0, true));
          } else {
            this.vx = lerp(this.vx, this.dir * speed, 1 - Math.pow(0.002, dt));
          }
        } else {
          if (Math.abs(dx) > 46) {
            this.vx = lerp(this.vx, this.dir * speed * 1.5, 1 - Math.pow(0.0015, dt));
          } else {
            this.vx = lerp(this.vx, 0, 1 - Math.pow(0.001, dt));
          }
          // 跳跃型怪物
          if (cfg.jumper && this.onGround && Math.abs(dx) < 320) {
            this.hopT -= dt;
            if (this.hopT <= 0) {
              this.hopT = rand(1.7, 2.7);
              this.vy = -430;
              this.vx = this.dir * 160;
            }
          }
        }
      } else {
        if (this.x <= this.min) this.dir = 1;
        if (this.x >= this.max) this.dir = -1;
        this.vx = lerp(this.vx, this.dir * speed, 1 - Math.pow(0.002, dt));
        if (Math.abs(this.x - this.homeX) > 260) this.dir = this.x > this.homeX ? -1 : 1;
      }

      // 边缘检测
      if (this.onGround && !cfg.static) {
        const ahead = groundAtPoint(this.x + this.dir * (this.w / 2 + 14), this.y);
        if (!ahead) {
          this.dir *= -1;
          this.vx = 0;
        }
      }

      // 物理
      this.vy += GRAVITY * dt;
      const prevBottom = this.y;
      this.x += this.vx * dt;
      this.x = clamp(this.x, 20, WORLD_W - 20);
      this.y += this.vy * dt;
      this.onGround = false;
      if (this.vy >= 0) {
        for (const pl of MAP.platforms) {
          if (this.x + this.w / 2 < pl.x || this.x - this.w / 2 > pl.x + pl.w) continue;
          if (prevBottom <= pl.y + 2 && this.y >= pl.y) {
            this.y = pl.y;
            this.vy = 0;
            this.onGround = true;
            break;
          }
        }
      }
      if (this.y > WORLD_H - 10) {
        this.y = WORLD_H - 10;
        this.vy = 0;
        this.onGround = true;
      }
    }

    // 接触伤害
    if (this.aggro && !p.dead && this.attackCd <= 0) {
      const hw = this.w / 2 + p.w / 2 - 6;
      if (Math.abs(p.x - this.x) < hw && p.y > this.y - this.h - 10 && p.y - p.h < this.y + 4) {
        this.attackCd = 1.1;
        p.takeDamage(this.cfg.atk, this.x);
        this.vx = -this.dir * 80;
      }
    }
  }

  hurt(dmg, crit, fromX) {
    if (this.dead) return 0;
    this.hp -= dmg;
    this.flash = 0.16;
    this.hitShake = 0.16;
    this.vx += (this.x < fromX ? -1 : 1) * (crit ? 120 : 60);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
    return dmg;
  }

  die() {
    this.dead = true;
    this.respawn = this.boss ? 32 : rand(6, 9);
    this.game.onMonsterDeath(this);
  }

  render(ctx, t) {
    if (this.dead) return;
    const squash = this.onGround ? 1 : clamp(1 + this.vy / 2600, 0.94, 1.06);
    ctx.save();
    // 影子
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#0d2a17';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 1, this.w * 0.42, this.w * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const shakeX = this.hitShake > 0 ? Math.sin(this.hitShake * 90) * 3 : 0;
    ctx.translate(this.x + shakeX, this.y);
    ctx.scale(this.dir, 1);
    ctx.scale(1, squash);

    if (this.cfg.flying) ctx.translate(0, Math.sin(t * 3 + this.x * 0.01) * 4);

    if (this.type === 'snail') drawSnail(ctx, this.animT);
    else if (this.type === 'mushroom') drawMushroom(ctx, this.animT, this.aggro);
    else if (this.type === 'stump') drawStump(ctx, this.animT, this.aggro);
    else if (this.type === 'mk') drawBoss(ctx, this.animT, this.aggro);
    else if (this.type === 'bat') drawBat(ctx, this.animT, this.aggro);
    else if (this.type === 'golem') drawGolem(ctx, this.animT, this.aggro);
    else if (this.type === 'golem_king') drawGolemKing(ctx, this.animT, this.aggro);
    else if (this.type === 'toad') drawToad(ctx, this.animT, this.aggro, this.charging);
    else if (this.type === 'toad_king') drawToadKing(ctx, this.animT, this.aggro);
    else if (this.type === 'plant') drawPlant(ctx, this.animT, this.aggro);
    else if (this.type === 'wisp') drawWisp(ctx, this.animT, this.aggro);
    else if (this.type === 'sentinel') drawSentinel(ctx, this.animT, this.aggro, this.charging);
    else if (this.type === 'sky_lord') drawSkyLord(ctx, this.animT, this.aggro);

    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 3.2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // 血条
    if (this.hp < this.maxHp && !this.boss) {
      const bw = Math.max(44, this.w);
      const bx = this.x - bw / 2;
      const by = this.y - this.h - 16;
      ctx.fillStyle = 'rgba(10,20,30,0.65)';
      roundRect(ctx, bx - 2, by - 2, bw + 4, 9, 4);
      ctx.fill();
      ctx.fillStyle = '#e5483f';
      roundRect(ctx, bx, by, bw * (this.hp / this.maxHp), 5, 2.5);
      ctx.fill();
    }

    // BOSS 名称
    if (this.boss) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
      const label = 'Lv.' + this.level + '  ' + this.name;
      const tw = ctx.measureText(label).width + 24;
      const bx = this.x - tw / 2;
      const gap = this.type === 'golem_king' || this.type === 'sky_lord' ? 62 : 40;
      const by = this.y - this.h - gap;
      ctx.fillStyle = 'rgba(46,20,64,0.62)';
      roundRect(ctx, bx, by, tw, 24, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,120,0.55)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, bx, by, tw, 24, 12);
      ctx.stroke();
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(label, this.x, by + 12);
      ctx.restore();
    }
  }
}

/* ---------- 怪物绘制 ---------- */
function drawSnail(ctx, t) {
  const slim = Math.sin(t * 4) * 0.06;
  ctx.save();
  ctx.scale(1 + slim, 1 - slim);

  // 身体
  const bg = ctx.createLinearGradient(0, -12, 0, 0);
  bg.addColorStop(0, '#a8e28a');
  bg.addColorStop(1, '#6fbe58');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(2, -8, 21, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,120,50,0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(2, -8, 21, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 头部
  ctx.fillStyle = '#b6eb9b';
  ctx.beginPath();
  ctx.ellipse(17, -14, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 眼柄
  ctx.strokeStyle = '#8ecf74';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(15, -19);
  ctx.lineTo(14, -28);
  ctx.moveTo(21, -19);
  ctx.lineTo(22, -27);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(14, -29, 3.4, 0, Math.PI * 2);
  ctx.arc(22, -28, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22331c';
  ctx.beginPath();
  ctx.arc(14.6, -29, 1.6, 0, Math.PI * 2);
  ctx.arc(22.6, -28, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // 壳
  const sg = ctx.createRadialGradient(-6, -20, 3, -6, -20, 17);
  sg.addColorStop(0, '#ffd97a');
  sg.addColorStop(0.6, '#e0a144');
  sg.addColorStop(1, '#b06f28');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(-6, -19, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,70,20,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-6, -19, 16, 0, Math.PI * 2);
  ctx.stroke();
  // 螺旋
  ctx.strokeStyle = 'rgba(140,85,25,0.7)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 4; a += 0.15) {
    const r = 2 + a * 2.1;
    const px = -6 + Math.cos(a) * r;
    const py = -19 + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-11, -26, 6, 4, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // 嘴
  ctx.strokeStyle = '#5e9b4a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(20, -10, 3, 0.2, 1.3);
  ctx.stroke();
  ctx.restore();
}

function drawMushroom(ctx, t, aggro) {
  const bob = Math.sin(t * 5) * 1.6;
  ctx.save();
  ctx.translate(0, bob);

  // 脚
  ctx.fillStyle = '#d8b98a';
  ctx.beginPath();
  ctx.ellipse(-9, -2, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(9, -2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 身体
  const bg = ctx.createLinearGradient(0, -32, 0, -4);
  bg.addColorStop(0, '#fff4dd');
  bg.addColorStop(1, '#e7d0a8');
  ctx.fillStyle = bg;
  roundRect(ctx, -12, -32, 24, 32, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,115,70,0.5)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, -12, -32, 24, 32, 8);
  ctx.stroke();

  // 眼睛
  ctx.fillStyle = '#3a2a1c';
  ctx.beginPath();
  ctx.ellipse(-5, -20, 2.6, 3.4, 0, 0, Math.PI * 2);
  ctx.ellipse(6, -20, 2.6, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (aggro) {
    ctx.strokeStyle = '#3a2a1c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, -25);
    ctx.lineTo(-2, -22);
    ctx.moveTo(9, -25);
    ctx.lineTo(3, -22);
    ctx.stroke();
  }
  // 嘴
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (aggro) {
    ctx.arc(1, -12, 4, 0.1, Math.PI - 0.1);
  } else {
    ctx.arc(1, -14, 3, 0.2, Math.PI - 0.2);
  }
  ctx.stroke();

  // 伞盖
  const cg = ctx.createLinearGradient(0, -56, 0, -26);
  cg.addColorStop(0, '#ff8b7c');
  cg.addColorStop(1, '#d9473f');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.ellipse(0, -30, 26, 22, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(130,40,35,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -30, 26, 22, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.ellipse(-12, -40, 5, 3.6, -0.3, 0, Math.PI * 2);
  ctx.ellipse(6, -46, 4.4, 3, 0.2, 0, Math.PI * 2);
  ctx.ellipse(15, -36, 3.6, 2.6, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // 伞沿
  ctx.fillStyle = 'rgba(255,235,220,0.9)';
  roundRect(ctx, -26, -32, 52, 5, 2.5);
  ctx.fill();
  ctx.restore();
}

function drawStump(ctx, t, aggro) {
  const sway = Math.sin(t * 1.6) * 0.02;
  ctx.save();
  ctx.rotate(sway);

  // 脚
  ctx.fillStyle = '#6b4a2a';
  ctx.beginPath();
  ctx.ellipse(-14, -3, 10, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(14, -3, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 树干
  const tg = ctx.createLinearGradient(-20, 0, 20, 0);
  tg.addColorStop(0, '#7a5230');
  tg.addColorStop(0.4, '#96703f');
  tg.addColorStop(1, '#5f4023');
  ctx.fillStyle = tg;
  roundRect(ctx, -20, -56, 40, 54, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,38,18,0.75)';
  ctx.lineWidth = 2;
  roundRect(ctx, -20, -56, 40, 54, 9);
  ctx.stroke();

  // 树皮纹
  ctx.strokeStyle = 'rgba(70,45,22,0.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-14 + i * 9, -46 + (i % 2) * 6);
    ctx.lineTo(-16 + i * 9, -10);
    ctx.stroke();
  }

  // 截面
  ctx.fillStyle = '#d9b478';
  ctx.beginPath();
  ctx.ellipse(0, -56, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,105,55,0.8)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, -56, 20, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -56, 11, 4.4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 树枝手臂
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const armSwing = aggro ? Math.sin(t * 8) * 3 : Math.sin(t * 2) * 1.5;
  ctx.beginPath();
  ctx.moveTo(-19, -40);
  ctx.lineTo(-30, -46 + armSwing);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(19, -40);
  ctx.lineTo(30, -46 - armSwing);
  ctx.stroke();

  // 叶子
  ctx.fillStyle = '#4e9c3f';
  ctx.beginPath();
  ctx.ellipse(-8, -64, 12, 7, -0.5, 0, Math.PI * 2);
  ctx.ellipse(9, -66, 11, 6.5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#63b54e';
  ctx.beginPath();
  ctx.ellipse(-2, -70, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 脸
  ctx.fillStyle = '#2f2116';
  ctx.beginPath();
  ctx.ellipse(-8, -36, 3, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(8, -36, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2f2116';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, -43);
  ctx.lineTo(-4, -40);
  ctx.moveTo(13, -43);
  ctx.lineTo(4, -40);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -22, 6, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();
}

function drawBoss(ctx, t, aggro) {
  const bob = Math.sin(t * 2.4) * 3;
  ctx.save();
  ctx.translate(0, bob);

  // 脚
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath();
  ctx.ellipse(-24, -4, 20, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(24, -4, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 身体
  const bg = ctx.createLinearGradient(0, -70, 0, -4);
  bg.addColorStop(0, '#fdf0d8');
  bg.addColorStop(1, '#d9bf95');
  ctx.fillStyle = bg;
  roundRect(ctx, -32, -74, 64, 72, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,85,50,0.6)';
  ctx.lineWidth = 2.4;
  roundRect(ctx, -32, -74, 64, 72, 18);
  ctx.stroke();

  // 脸
  ctx.fillStyle = '#2b1f14';
  ctx.beginPath();
  ctx.ellipse(-13, -46, 6, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(14, -46, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = aggro ? '#ff5c4d' : '#ffffff';
  ctx.beginPath();
  ctx.arc(-11, -48, 2.4, 0, Math.PI * 2);
  ctx.arc(16, -48, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1f14';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-24, -58);
  ctx.lineTo(-6, -53);
  ctx.moveTo(24, -58);
  ctx.lineTo(6, -53);
  ctx.stroke();
  // 大嘴
  ctx.fillStyle = '#5c2a22';
  ctx.beginPath();
  ctx.ellipse(0, -24, 15, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6e2';
  ctx.beginPath();
  ctx.moveTo(-10, -30);
  ctx.lineTo(-4, -30);
  ctx.lineTo(-7, -24);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, -30);
  ctx.lineTo(10, -30);
  ctx.lineTo(7, -24);
  ctx.closePath();
  ctx.fill();

  // 伞盖
  const cg = ctx.createLinearGradient(0, -140, 0, -60);
  cg.addColorStop(0, '#c46bd8');
  cg.addColorStop(0.6, '#9a3fb5');
  cg.addColorStop(1, '#722a8c');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.ellipse(0, -70, 60, 52, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,25,90,0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -70, 60, 52, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  // 斑点
  ctx.fillStyle = 'rgba(255,225,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(-28, -94, 11, 8, -0.3, 0, Math.PI * 2);
  ctx.ellipse(12, -110, 9, 7, 0.2, 0, Math.PI * 2);
  ctx.ellipse(34, -88, 7, 5.5, 0.5, 0, Math.PI * 2);
  ctx.ellipse(-6, -80, 6, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // 伞沿
  ctx.fillStyle = '#f0dcf8';
  roundRect(ctx, -60, -74, 120, 10, 5);
  ctx.fill();

  // 王冠
  ctx.fillStyle = '#ffd257';
  ctx.beginPath();
  ctx.moveTo(-24, -118);
  ctx.lineTo(-18, -140);
  ctx.lineTo(-8, -126);
  ctx.lineTo(0, -146);
  ctx.lineTo(9, -126);
  ctx.lineTo(20, -140);
  ctx.lineTo(24, -118);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c99a20';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = '#ff5c8a';
  ctx.beginPath();
  ctx.arc(0, -128, 4, 0, Math.PI * 2);
  ctx.fill();

  // 手臂
  ctx.strokeStyle = '#e7cda6';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  const swing = Math.sin(t * 3) * (aggro ? 10 : 4);
  ctx.beginPath();
  ctx.moveTo(-32, -56);
  ctx.lineTo(-56, -34 + swing);
  ctx.moveTo(32, -56);
  ctx.lineTo(56, -34 - swing);
  ctx.stroke();
  ctx.restore();
}

/* ============================================================
 *  掉落物
 * ============================================================ */
class Loot {
  constructor(game, id, qty, x, y) {
    this.game = game;
    this.id = id;
    this.qty = qty;
    this.x = x;
    this.y = y;
    this.vx = rand(-140, 140);
    this.vy = rand(-380, -220);
    this.onGround = false;
    this.life = 45;
    this.t = 0;
    this.pickDelay = 0.4;
    this.dead = false;
    this.magnet = false;
  }

  update(dt, game) {
    this.t += dt;
    this.life -= dt;
    this.pickDelay -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    const p = game.player;
    if (!p.dead && this.pickDelay <= 0) {
      const d = Math.sqrt(dist2(this.x, this.y, p.x, p.y - 30));
      if (d < 90) this.magnet = true;
      if (this.magnet) {
        const a = Math.atan2(p.y - 30 - this.y, p.x - this.x);
        this.x += Math.cos(a) * 420 * dt;
        this.y += Math.sin(a) * 420 * dt;
        if (d < 26) {
          this.collect();
          return;
        }
        return;
      }
    }

    this.vy += GRAVITY * 0.85 * dt;
    const prev = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.15, dt);
    if (this.vy >= 0 && !this.onGround) {
      for (const pl of MAP.platforms) {
        if (this.x < pl.x || this.x > pl.x + pl.w) continue;
        if (prev <= pl.y && this.y >= pl.y) {
          this.y = pl.y - 2;
          this.vy *= -0.35;
          this.vx *= 0.6;
          if (Math.abs(this.vy) < 40) {
            this.vy = 0;
            this.onGround = true;
          }
          break;
        }
      }
    }
    if (this.y > WORLD_H - 10) {
      this.y = WORLD_H - 10;
      this.onGround = true;
    }
  }

  collect() {
    if (this.dead) return;
    this.dead = true;
    const p = this.game.player;
    const def = ITEMS[this.id];
    if (this.id === 'meso') {
      p.gold += this.qty;
      this.game.texts.push(new FloatText(this.x, this.y - 6, '+' + this.qty + ' 金币', '#ffd76a', 17, -50));
      Sound.coin();
    } else {
      const ok = p.addItem(this.id, this.qty);
      if (!ok) {
        this.game.ui.log('背包已满，无法拾取 ' + def.name);
        return;
      }
      this.game.texts.push(new FloatText(this.x, this.y - 6, def.name + ' ×' + this.qty, '#a9f0ff', 16, -50));
      if (def.kind === 'equip') {
        this.game.ui.log('获得了稀有装备：' + def.name + '！');
        Sound.levelup();
      } else {
        Sound.coin();
      }
    }
    this.game.ui.renderInventory();
  }

  render(ctx) {
    const bob = Math.sin(this.t * 4) * 3;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    const def = ITEMS[this.id];
    if (this.id === 'meso') {
      const g = ctx.createRadialGradient(-2, -8, 1, 0, -6, 10);
      g.addColorStop(0, '#fff3b0');
      g.addColorStop(0.5, '#ffd447');
      g.addColorStop(1, '#d99a12');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -7, 8, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,90,10,0.6)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(130,80,10,0.55)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('M', 0, -3.5);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(0, -8, 10, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#3b2b1a';
      ctx.fillText(iconGlyph(def.icon), 0, -7);
    }
    // 光晕
    ctx.globalAlpha = 0.28 + Math.sin(this.t * 5) * 0.1;
    ctx.strokeStyle = def.kind === 'equip' ? '#ffe27a' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -8, 13, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/* 掉落图标用简单字形代替（画布上不加载 SVG） */
function iconGlyph(icon) {
  return (
    {
      hpPot: '🜂',
      mpPot: '🜄',
      shell: '◎',
      cap: '⌒',
      branch: '≡',
      bow: '🏹',
      bow2: '🏹',
      armor: '⛨',
      ring: '◯',
      meso: 'M',
    }[icon] || '◆'
  );
}

/* ============================================================
 *  粒子 / 飘字
 * ============================================================ */
class Particle {
  constructor(x, y, vx, vy, life, color, size, gravity = 0, shrink = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.gravity = gravity;
    this.shrink = shrink;
    this.dead = false;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.3, dt);
  }
  render(ctx) {
    const a = clamp(this.life / this.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    const s = this.shrink ? this.size * (1 - a * 0.7) : this.size;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.5, s), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class FloatText {
  constructor(x, y, text, color, size = 20, vy = -50, big = false) {
    this.x = x + rand(-6, 6);
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.vy = vy;
    this.life = big ? 1.1 : 0.9;
    this.maxLife = this.life;
    this.dead = false;
    this.big = big;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    this.y += this.vy * dt;
    this.vy *= Math.pow(0.12, dt);
  }
  render(ctx) {
    const a = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `bold ${this.size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(35,22,10,0.85)';
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

/* ============================================================
 *  新地图怪物绘制
 * ============================================================ */

/* 洞穴蝙蝠 */
function drawBat(ctx, t, aggro) {
  const flap = Math.sin(t * 12) * 0.5;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);
    const wg = ctx.createLinearGradient(6, -30, 40, -14);
    wg.addColorStop(0, 'rgba(96,70,134,0.95)');
    wg.addColorStop(1, 'rgba(62,44,94,0.9)');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(6, -22);
    ctx.quadraticCurveTo(24, -36 - flap * 9, 40, -26 - flap * 7);
    ctx.quadraticCurveTo(33, -20, 31, -13);
    ctx.quadraticCurveTo(21, -18, 6, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,26,62,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(11, -20);
    ctx.lineTo(33, -25 - flap * 7);
    ctx.moveTo(13, -16);
    ctx.lineTo(28, -17);
    ctx.stroke();
    ctx.restore();
  }

  const bg = ctx.createLinearGradient(0, -28, 0, -2);
  bg.addColorStop(0, '#6f52a0');
  bg.addColorStop(1, '#3d2c5c');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(0, -15, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5a407f';
  ctx.beginPath();
  ctx.moveTo(-8, -25);
  ctx.lineTo(-11, -36);
  ctx.lineTo(-2, -27);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -25);
  ctx.lineTo(11, -36);
  ctx.lineTo(2, -27);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = aggro ? '#ff5d5d' : '#ffd36a';
  ctx.beginPath();
  ctx.arc(-4, -17, 2.6, 0, Math.PI * 2);
  ctx.arc(4, -17, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(-3, -9);
  ctx.lineTo(-1, -4.5);
  ctx.lineTo(1, -9);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, -9);
  ctx.lineTo(4, -4.5);
  ctx.lineTo(6, -9);
  ctx.closePath();
  ctx.fill();
}

/* 岩石魔像 */
function drawGolem(ctx, t, aggro) {
  const sway = Math.sin(t * 1.6) * 2;
  const pu = 0.55 + Math.sin(t * 2.4) * 0.45;

  ctx.fillStyle = '#4a5364';
  roundRect(ctx, -20, -20, 16, 20, 5);
  ctx.fill();
  roundRect(ctx, 4, -20, 16, 20, 5);
  ctx.fill();
  ctx.fillStyle = '#5b657a';
  roundRect(ctx, -23, -6, 21, 7, 3);
  ctx.fill();
  roundRect(ctx, 2, -6, 21, 7, 3);
  ctx.fill();

  const g = ctx.createLinearGradient(-26, -60, 26, -20);
  g.addColorStop(0, '#8390a6');
  g.addColorStop(0.5, '#5e6a80');
  g.addColorStop(1, '#3f4859');
  ctx.fillStyle = g;
  roundRect(ctx, -24, -60, 48, 42, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(22,28,40,0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, -24, -60, 48, 42, 10);
  ctx.stroke();

  ctx.strokeStyle = `rgba(120,215,255,${0.45 + pu * 0.45})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-15, -55);
  ctx.lineTo(-5, -46);
  ctx.lineTo(-12, -36);
  ctx.lineTo(2, -26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(13, -54);
  ctx.lineTo(7, -42);
  ctx.stroke();

  const cg = ctx.createRadialGradient(0, -40, 2, 0, -40, 13);
  cg.addColorStop(0, `rgba(220,250,255,${0.85})`);
  cg.addColorStop(0.55, `rgba(130,215,255,${0.55 + pu * 0.3})`);
  cg.addColorStop(1, 'rgba(90,180,240,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, -40, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6b768c';
  roundRect(ctx, -40, -58 + sway, 14, 32, 6);
  ctx.fill();
  roundRect(ctx, 26, -58 - sway, 14, 32, 6);
  ctx.fill();

  ctx.fillStyle = '#8a97ad';
  roundRect(ctx, -15, -78, 30, 22, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(22,28,40,0.6)';
  roundRect(ctx, -15, -78, 30, 22, 8);
  ctx.stroke();

  ctx.fillStyle = aggro ? '#ff7a5d' : '#8fe6ff';
  roundRect(ctx, -10, -71, 7, 5, 2);
  ctx.fill();
  roundRect(ctx, 3, -71, 7, 5, 2);
  ctx.fill();
}

/* 石魔领主 */
function drawGolemKing(ctx, t, aggro) {
  const pu = 0.55 + Math.sin(t * 2) * 0.45;

  ctx.fillStyle = '#3d4557';
  roundRect(ctx, -38, -30, 28, 30, 8);
  ctx.fill();
  roundRect(ctx, 10, -30, 28, 30, 8);
  ctx.fill();

  const g = ctx.createLinearGradient(-52, -96, 52, -26);
  g.addColorStop(0, '#7b86a0');
  g.addColorStop(0.5, '#59647c');
  g.addColorStop(1, '#373f50');
  ctx.fillStyle = g;
  roundRect(ctx, -48, -96, 96, 70, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,24,36,0.65)';
  ctx.lineWidth = 3;
  roundRect(ctx, -48, -96, 96, 70, 16);
  ctx.stroke();

  ctx.fillStyle = '#6d788f';
  ctx.beginPath();
  ctx.ellipse(-50, -88, 22, 17, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(50, -88, 22, 17, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5f6a80';
  roundRect(ctx, -72, -92, 20, 52, 9);
  ctx.fill();
  roundRect(ctx, 52, -92, 20, 52, 9);
  ctx.fill();

  ctx.strokeStyle = `rgba(120,215,255,${0.4 + pu * 0.5})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-28, -88);
  ctx.lineTo(-14, -70);
  ctx.lineTo(-24, -52);
  ctx.lineTo(-6, -36);
  ctx.lineTo(8, -30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(26, -86);
  ctx.lineTo(18, -66);
  ctx.lineTo(30, -48);
  ctx.stroke();

  const cg = ctx.createRadialGradient(0, -66, 3, 0, -66, 22);
  cg.addColorStop(0, 'rgba(225,252,255,0.95)');
  cg.addColorStop(0.5, `rgba(120,210,255,${0.6 + pu * 0.3})`);
  cg.addColorStop(1, 'rgba(90,180,240,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, -66, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8490a6';
  roundRect(ctx, -26, -126, 52, 32, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,24,36,0.6)';
  ctx.lineWidth = 2.5;
  roundRect(ctx, -26, -126, 52, 32, 10);
  ctx.stroke();

  ctx.fillStyle = aggro ? '#ff8258' : '#9fe8ff';
  roundRect(ctx, -17, -117, 12, 8, 3);
  ctx.fill();
  roundRect(ctx, 5, -117, 12, 8, 3);
  ctx.fill();

  ctx.fillStyle = 'rgba(150,232,255,0.9)';
  for (const c of [[-21, 18], [-7, 27], [7, 23], [21, 15]]) {
    ctx.beginPath();
    ctx.moveTo(c[0], -126);
    ctx.lineTo(c[0] + 5, -126 - c[1]);
    ctx.lineTo(c[0] + 10, -126);
    ctx.closePath();
    ctx.fill();
  }
}

/* 毒沼蟾蜍 */
function drawToad(ctx, t, aggro) {
  const breathe = 1 + Math.sin(t * 3) * 0.03;
  ctx.fillStyle = '#3f7a3a';
  ctx.beginPath();
  ctx.ellipse(-22, -9, 14, 9, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(22, -9, 14, 9, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.scale(1, breathe);
  const g = ctx.createRadialGradient(-8, -34, 4, 0, -22, 34);
  g.addColorStop(0, '#93d46e');
  g.addColorStop(0.65, '#57953f');
  g.addColorStop(1, '#31612a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -22, 30, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(26,60,24,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -22, 30, 21, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(228,244,196,0.5)';
  ctx.beginPath();
  ctx.ellipse(2, -13, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(146,204,112,0.9)';
  for (const w of [[-16, -32, 3.4], [6, -36, 3], [18, -26, 2.6], [-4, -12, 3]]) {
    ctx.beginPath();
    ctx.arc(w[0], w[1], w[2], 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#f2f7d8';
  ctx.beginPath();
  ctx.arc(-12, -38, 8, 0, Math.PI * 2);
  ctx.arc(12, -38, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = aggro ? '#c4342c' : '#2b3a1e';
  ctx.beginPath();
  ctx.arc(-12, -38, 3.4, 0, Math.PI * 2);
  ctx.arc(12, -38, 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2c4a22';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, -20, 14, 0.3, Math.PI - 0.3);
  ctx.stroke();
  ctx.fillStyle = '#e8697d';
  ctx.beginPath();
  ctx.ellipse(0, -16, 7, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* 食人花 */
function drawPlant(ctx, t, aggro) {
  const sway = Math.sin(t * 1.7) * 0.045;
  ctx.save();
  ctx.rotate(sway);

  ctx.strokeStyle = '#3f7a34';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(7, -28, 0, -50);
  ctx.stroke();
  ctx.strokeStyle = '#5ba346';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(7, -28, 0, -50);
  ctx.stroke();

  ctx.fillStyle = '#4d8f3a';
  ctx.beginPath();
  ctx.ellipse(-16, -16, 14, 7, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(16, -26, 13, 6.5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,70,28,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-28, -12);
  ctx.lineTo(-6, -20);
  ctx.moveTo(28, -23);
  ctx.lineTo(6, -27);
  ctx.stroke();

  const g = ctx.createRadialGradient(0, -58, 4, 0, -58, 26);
  g.addColorStop(0, '#ff9fb0');
  g.addColorStop(1, '#b8305a');
  ctx.fillStyle = g;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.sin(t * 1.1) * 0.08;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 15, -58 + Math.sin(a) * 12, 11, 7.5, a, 0, Math.PI * 2);
    ctx.fill();
  }

  const open = aggro ? 9 : 5;
  ctx.fillStyle = '#4a1024';
  ctx.beginPath();
  ctx.ellipse(0, -58, 10, open, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6e8';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4.2 - 1.6, -58 - open * 0.72);
    ctx.lineTo(i * 4.2, -58 - open * 0.1);
    ctx.lineTo(i * 4.2 + 1.6, -58 - open * 0.72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* 幽灵术士 */
function drawWisp(ctx, t, aggro) {
  const pu = 0.5 + Math.sin(t * 3) * 0.5;

  const halo = ctx.createRadialGradient(0, -40, 4, 0, -40, 44);
  halo.addColorStop(0, `rgba(170,225,255,${0.26 * pu + 0.1})`);
  halo.addColorStop(1, 'rgba(120,180,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, -40, 44, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createLinearGradient(0, -68, 0, 0);
  g.addColorStop(0, 'rgba(126,156,232,0.96)');
  g.addColorStop(0.55, 'rgba(82,108,184,0.9)');
  g.addColorStop(1, 'rgba(56,70,128,0.3)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -70);
  ctx.quadraticCurveTo(24, -60, 22, -30);
  ctx.quadraticCurveTo(25, -10, 15, 0);
  ctx.quadraticCurveTo(6, -8, 0, -3);
  ctx.quadraticCurveTo(-6, -8, -15, 0);
  ctx.quadraticCurveTo(-25, -10, -22, -30);
  ctx.quadraticCurveTo(-24, -60, 0, -70);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(54,70,126,0.96)';
  ctx.beginPath();
  ctx.ellipse(0, -54, 15, 17, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = aggro ? '#ff7a7a' : '#9be8ff';
  ctx.beginPath();
  ctx.arc(-5, -52, 2.8, 0, Math.PI * 2);
  ctx.arc(5, -52, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(196,240,255,${0.65 + pu * 0.35})`;
  ctx.beginPath();
  ctx.arc(20, -44, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(190,235,255,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(20, -44, 9, t * 2, t * 2 + Math.PI);
  ctx.stroke();
}

/* 遗迹守卫 */
function drawSentinel(ctx, t, aggro, charging) {
  ctx.fillStyle = '#8c88a6';
  roundRect(ctx, -18, -22, 14, 22, 4);
  ctx.fill();
  roundRect(ctx, 4, -22, 14, 22, 4);
  ctx.fill();

  const g = ctx.createLinearGradient(-22, -62, 22, -20);
  g.addColorStop(0, '#d9d3f0');
  g.addColorStop(0.5, '#a9a2c6');
  g.addColorStop(1, '#7e7899');
  ctx.fillStyle = g;
  roundRect(ctx, -22, -62, 44, 42, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(66,58,92,0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, -22, -62, 44, 42, 10);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,246,214,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -56);
  ctx.lineTo(14, -56);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,226,150,0.9)';
  ctx.beginPath();
  ctx.arc(0, -44, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,96,50,0.65)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -44, 7, 0, Math.PI * 2);
  ctx.stroke();

  // 盾
  ctx.fillStyle = '#bab3d8';
  ctx.beginPath();
  ctx.moveTo(-35, -64);
  ctx.lineTo(-17, -58);
  ctx.lineTo(-17, -30);
  ctx.lineTo(-26, -20);
  ctx.lineTo(-35, -30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6d6690';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#928bb4';
  ctx.beginPath();
  ctx.arc(-26, -42, 4.4, 0, Math.PI * 2);
  ctx.fill();

  // 长枪
  ctx.strokeStyle = '#8a7f6a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(20, -8);
  ctx.lineTo(30, -90);
  ctx.stroke();
  ctx.fillStyle = '#eae2ca';
  ctx.beginPath();
  ctx.moveTo(30, -90);
  ctx.lineTo(35, -103);
  ctx.lineTo(39, -90);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c8c2e0';
  roundRect(ctx, -14, -82, 28, 22, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(66,58,92,0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, -14, -82, 28, 22, 7);
  ctx.stroke();
  ctx.fillStyle = aggro ? '#ff8a5c' : '#ffd98a';
  roundRect(ctx, -9, -74, 18, 5, 2.5);
  ctx.fill();

  ctx.fillStyle = charging ? '#ff9a6a' : '#d8b0ff';
  ctx.beginPath();
  ctx.ellipse(0, -86, 7, 5, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

/* 天空守望者 */
function drawSkyLord(ctx, t, aggro) {
  const pu = 0.55 + Math.sin(t * 2.2) * 0.45;
  const float = Math.sin(t * 1.8) * 3;

  // 背后光晕
  ctx.save();
  ctx.globalAlpha = 0.4 + pu * 0.28;
  const hg = ctx.createRadialGradient(0, -70, 10, 0, -70, 100);
  hg.addColorStop(0, 'rgba(255,240,190,0.55)');
  hg.addColorStop(0.55, 'rgba(255,196,120,0.18)');
  hg.addColorStop(1, 'rgba(255,180,110,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(0, -70, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 光轮
  ctx.save();
  ctx.globalAlpha = 0.55 + pu * 0.35;
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, -158 + float, 25, 7.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.28 + pu * 0.2;
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#fff3c8';
  ctx.beginPath();
  ctx.ellipse(0, -158 + float, 25, 7.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 双翼（三层羽）
  for (const s2 of [-1, 1]) {
    ctx.save();
    ctx.scale(s2, 1);
    ctx.translate(10, float);
    const wg = ctx.createLinearGradient(20, -120, 92, -40);
    wg.addColorStop(0, 'rgba(255,252,238,0.97)');
    wg.addColorStop(0.55, 'rgba(255,226,176,0.92)');
    wg.addColorStop(1, 'rgba(246,182,120,0.8)');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(14, -100);
    ctx.quadraticCurveTo(58, -126, 92, -86);
    ctx.quadraticCurveTo(72, -80, 66, -62);
    ctx.quadraticCurveTo(54, -72, 44, -52);
    ctx.quadraticCurveTo(36, -70, 24, -60);
    ctx.closePath();
    ctx.fill();
    // 羽轴
    ctx.strokeStyle = 'rgba(214,158,96,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(20, -98 + i * 8);
      ctx.quadraticCurveTo(56 - i * 4, -100 + i * 10, 84 - i * 9, -78 + i * 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 长袍
  const g = ctx.createLinearGradient(0, -104 + float, 0, float);
  g.addColorStop(0, '#f6eeff');
  g.addColorStop(0.45, '#cbb8ee');
  g.addColorStop(1, '#8b76bd');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -106 + float);
  ctx.quadraticCurveTo(30, -98 + float, 27, -56 + float);
  ctx.quadraticCurveTo(31, -22 + float, 24, float);
  ctx.lineTo(6, -6 + float);
  ctx.lineTo(0, 2 + float);
  ctx.lineTo(-6, -6 + float);
  ctx.lineTo(-24, float);
  ctx.quadraticCurveTo(-31, -22 + float, -27, -56 + float);
  ctx.quadraticCurveTo(-30, -98 + float, 0, -106 + float);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(108,88,166,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 袍上金纹
  ctx.strokeStyle = 'rgba(255,226,152,0.75)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-16, -40 + float);
  ctx.quadraticCurveTo(0, -30 + float, 16, -40 + float);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, -22 + float);
  ctx.quadraticCurveTo(0, -14 + float, 12, -22 + float);
  ctx.stroke();

  // 胸口宝珠
  ctx.fillStyle = 'rgba(255,224,146,0.95)';
  ctx.beginPath();
  ctx.arc(0, -74 + float, 10, 0, Math.PI * 2);
  ctx.fill();
  const core = ctx.createRadialGradient(0, -74 + float, 1, 0, -74 + float, 7);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.6, '#a8f0ff');
  core.addColorStop(1, 'rgba(120,220,255,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, -74 + float, 7, 0, Math.PI * 2);
  ctx.fill();

  // 肩甲
  ctx.fillStyle = '#f2e8ff';
  ctx.beginPath();
  ctx.ellipse(-28, -94 + float, 15, 9.5, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(28, -94 + float, 15, 9.5, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,226,152,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-28, -94 + float, 15, 9.5, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(28, -94 + float, 15, 9.5, 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // 手臂
  ctx.strokeStyle = '#e8dcff';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  const swing = Math.sin(t * 2) * 2;
  ctx.beginPath();
  ctx.moveTo(-28, -92 + float);
  ctx.quadraticCurveTo(-40, -74 + float, -34, -56 + float + swing);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, -92 + float);
  ctx.quadraticCurveTo(42, -78 + float, 38, -60 + float - swing);
  ctx.stroke();
  // 手甲
  ctx.fillStyle = '#fff6dc';
  ctx.beginPath();
  ctx.arc(-34, -54 + float + swing, 5.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(38, -58 + float - swing, 5.4, 0, Math.PI * 2);
  ctx.fill();

  // 长矛
  ctx.strokeStyle = '#c9a869';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(38, -2 + float);
  ctx.lineTo(50, -128 + float);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,246,214,0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(36, -4 + float);
  ctx.lineTo(48, -126 + float);
  ctx.stroke();
  // 枪刃
  ctx.fillStyle = '#fff8dc';
  ctx.beginPath();
  ctx.moveTo(50, -128 + float);
  ctx.lineTo(56, -152 + float);
  ctx.lineTo(62, -128 + float);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,160,90,0.7)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // 缨穗
  ctx.strokeStyle = '#ffcf7a';
  ctx.lineWidth = 2.4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(50 + i * 2, -126 + float);
    ctx.quadraticCurveTo(46 + i * 5, -114 + float, 44 + i * 7, -106 + float);
    ctx.stroke();
  }

  // 头部：兜帽 + 面具
  ctx.fillStyle = '#4a3a72';
  ctx.beginPath();
  ctx.arc(0, -118 + float, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8f0ff';
  ctx.beginPath();
  ctx.arc(0, -120 + float, 14, Math.PI * 0.92, Math.PI * 2.08);
  ctx.quadraticCurveTo(14, -108 + float, 0, -106 + float);
  ctx.quadraticCurveTo(-14, -108 + float, -14, -120 + float);
  ctx.fill();
  // 面具下的光眼
  ctx.fillStyle = `rgba(140,240,255,${0.75 + pu * 0.25})`;
  ctx.beginPath();
  ctx.ellipse(-5, -118 + float, 3.4, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(5, -118 + float, 3.4, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // 额饰
  ctx.fillStyle = 'rgba(255,216,142,0.96)';
  roundRect(ctx, -10, -128 + float, 20, 4.4, 2.2);
  ctx.fill();

  // 冠冕
  ctx.fillStyle = '#ffd98a';
  for (const c of [[-14, 13], [-5, 21], [5, 19], [14, 12]]) {
    ctx.beginPath();
    ctx.moveTo(c[0], -132 + float);
    ctx.lineTo(c[0] + 3, -132 - c[1] + float);
    ctx.lineTo(c[0] + 6, -132 + float);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#fff3c8';
  for (const c of [[-14, 13], [-5, 21], [5, 19], [14, 12]]) {
    ctx.beginPath();
    ctx.arc(c[0] + 3, -132 - c[1] + float, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* 毒沼蛙王 */
function drawToadKing(ctx, t, aggro) {
  const breathe = 1 + Math.sin(t * 2.6) * 0.035;
  const croak = aggro ? 0.5 + Math.sin(t * 5) * 0.5 : 0;

  // 毒雾光环
  ctx.save();
  const aura = ctx.createRadialGradient(0, -36, 10, 0, -36, 86);
  const aA = 0.1 + croak * 0.1;
  aura.addColorStop(0, `rgba(158,232,96,${aA})`);
  aura.addColorStop(0.65, `rgba(96,176,64,${aA * 0.42})`);
  aura.addColorStop(1, 'rgba(70,140,50,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -36, 86, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 后腿
  ctx.fillStyle = '#2f5c2a';
  ctx.beginPath();
  ctx.ellipse(-46, -14, 24, 15, 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(46, -14, 24, 15, -0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(122,196,86,0.55)';
  ctx.beginPath();
  ctx.ellipse(-48, -18, 14, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, -18, 14, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // 脚趾
  ctx.fillStyle = '#24491f';
  for (const s of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(s * 62 + i * 5, -4 + Math.abs(i) * 2, 4.6, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 身体
  ctx.save();
  ctx.scale(1, breathe);
  const body = ctx.createRadialGradient(-16, -62, 8, 0, -40, 62);
  body.addColorStop(0, '#8fce63');
  body.addColorStop(0.55, '#4d8a3a');
  body.addColorStop(1, '#234a20');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, -40, 54, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,48,18,0.6)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, -40, 54, 38, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 肚皮
  ctx.fillStyle = 'rgba(226,242,180,0.55)';
  ctx.beginPath();
  ctx.ellipse(2, -26, 38, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,160,80,0.4)';
  ctx.lineWidth = 1.4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-28, -26 + i * 8);
    ctx.quadraticCurveTo(0, -20 + i * 8, 28, -26 + i * 8);
    ctx.stroke();
  }
  ctx.restore();

  // 毒疣
  const warts = [[-30, -60, 5], [-8, -70, 4.2], [22, -62, 5], [36, -44, 3.6], [-40, -40, 4], [12, -50, 3.4], [-18, -28, 3]];
  for (const w of warts) {
    const g = ctx.createRadialGradient(w[0], w[1], 0.5, w[0], w[1], w[2] * 2);
    g.addColorStop(0, 'rgba(198,255,140,0.95)');
    g.addColorStop(1, 'rgba(112,190,72,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w[0], w[1], w[2] * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8f08a';
    ctx.beginPath();
    ctx.arc(w[0], w[1], w[2] * 0.72, 0, Math.PI * 2);
    ctx.fill();
  }

  // 前爪
  ctx.strokeStyle = '#3d7233';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  const swing = Math.sin(t * 2.2) * 3;
  ctx.beginPath();
  ctx.moveTo(-38, -44);
  ctx.quadraticCurveTo(-54, -26, -50, -8 + swing);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(38, -44);
  ctx.quadraticCurveTo(54, -26, 50, -8 - swing);
  ctx.stroke();
  ctx.fillStyle = '#24491f';
  for (const s of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(s * 50 + i * 5, -6 + Math.abs(i), 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 喉囊（呼吸/鸣叫）
  const sac = 1 + croak * 0.28;
  ctx.fillStyle = 'rgba(232,246,192,0.72)';
  ctx.beginPath();
  ctx.ellipse(0, -22, 26 * sac, 14 * sac, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(96,140,64,0.5)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -22, 26 * sac, 14 * sac, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 眼睛
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#e9f5c4';
    ctx.beginPath();
    ctx.arc(s * 25, -78, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,62,26,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s * 25, -78, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = aggro ? '#c93a2f' : '#c9a11e';
    ctx.beginPath();
    ctx.arc(s * 25, -78, 7.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#241a08';
    ctx.beginPath();
    ctx.ellipse(s * 25, -78, 2.6, 6.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(s * 25 - 3, -82, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 嘴
  const open = aggro ? 11 : 6;
  ctx.strokeStyle = '#1f3d1b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -58, 26, 0.22, Math.PI - 0.22);
  ctx.stroke();
  ctx.fillStyle = '#42101f';
  ctx.beginPath();
  ctx.ellipse(0, -50, 22, open, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 7 - 2, -50 - open * 0.85);
    ctx.lineTo(i * 7, -50 - open * 0.1);
    ctx.lineTo(i * 7 + 2, -50 - open * 0.85);
    ctx.closePath();
    ctx.fill();
  }

  // 王冠
  ctx.fillStyle = '#e8b53f';
  ctx.beginPath();
  ctx.moveTo(-24, -88);
  ctx.lineTo(-26, -104);
  ctx.lineTo(-14, -95);
  ctx.lineTo(-6, -110);
  ctx.lineTo(4, -95);
  ctx.lineTo(16, -109);
  ctx.lineTo(22, -94);
  ctx.lineTo(26, -102);
  ctx.lineTo(26, -87);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,74,10,0.55)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#fff2c4';
  for (const c of [[-6, -108], [16, -107], [0, -93]]) {
    ctx.beginPath();
    ctx.arc(c[0], c[1], 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,120,150,0.95)';
  ctx.beginPath();
  ctx.arc(0, -93, 3.4, 0, Math.PI * 2);
  ctx.fill();
}
