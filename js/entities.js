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
    return Math.max(0.2, 0.38 - this.dex * 0.003 - this.level * 0.004);
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
    this.vx = (this.x < fromX ? -1 : 1) * 240;
    this.vy = -320;
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

    // 瞄准
    if (inp.aimMode === 'mouse' && inp.mouseActive) {
      const bx = this.x;
      const by = this.y - 44;
      this.aimAngle = Math.atan2(inp.mouseWorldY - by, inp.mouseWorldX - bx);
      this.aimMode = 'mouse';
    } else {
      this.aimMode = 'key';
      const horizontal = inp.left || inp.right;
      if (inp.up && !inp.down) {
        this.aimAngle = horizontal ? (this.facing > 0 ? -Math.PI / 4 : (-3 * Math.PI) / 4) : -Math.PI / 2;
      } else if (inp.down && !inp.up) {
        this.aimAngle = horizontal ? (this.facing > 0 ? Math.PI / 4 : (3 * Math.PI) / 4) : Math.PI / 2;
      } else {
        this.aimAngle = this.facing > 0 ? 0 : Math.PI;
      }
    }
    if (Math.abs(Math.cos(this.aimAngle)) > 0.15) {
      this.facing = Math.cos(this.aimAngle) > 0 ? 1 : -1;
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
    if (inp.up || (!this.onGround && inp.down)) {
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
    const maxSpeed = 320;
    const accel = this.onGround ? 2600 : 1500;
    if (dir !== 0) {
      this.vx += dir * accel * dt;
      this.vx = clamp(this.vx, -maxSpeed, maxSpeed);
      if (Math.abs(this.aimAngle) < Math.PI / 2 - 0.2 || Math.abs(this.aimAngle) > Math.PI / 2 + 0.2) {
        // 仅在键盘瞄准模式下强制转向
        if (inp.aimMode !== 'mouse') this.facing = dir;
      }
    } else {
      const fr = (this.onGround ? 2400 : 700) * dt;
      if (Math.abs(this.vx) <= fr) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * fr;
    }

    /* ---- 跳跃 ---- */
    if (inp.jumpPressed && this.onGround) {
      const plat = this.groundPlatform;
      if (inp.down && plat && !plat.ground) {
        this.dropTimer = 0.2;
        this.onGround = false;
        this.vy = 90;
      } else {
        this.vy = -790;
        this.onGround = false;
        this.game.particles.push(new Particle(this.x, this.y, rand(-60, 60), -30, 0.35, 'rgba(255,255,255,0.55)', 10, -200));
      }
    }

    /* ---- 重力 ---- */
    const rising = this.vy < 0 && inp.jump;
    this.vy += GRAVITY * (rising ? 0.62 : 1) * dt;
    this.vy = Math.min(this.vy, 1500);

    /* ---- 位移与碰撞 ---- */
    const prevBottom = this.y;
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
    this.game.ui.log('你在蘑菇森林重新站了起来');
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
class EnemyShot {
  constructor(game, x, y, tx, ty, dmg) {
    this.game = game;
    this.x = x;
    this.y = y;
    const a = Math.atan2(ty - y, tx - x);
    const sp = 320;
    this.vx = Math.cos(a) * sp;
    this.vy = Math.sin(a) * sp;
    this.dmg = dmg;
    this.life = 3.2;
    this.r = 11;
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
    ctx.save();
    const glow = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.r + 8);
    glow.addColorStop(0, 'rgba(230,190,255,0.95)');
    glow.addColorStop(0.6, 'rgba(170,90,230,0.6)');
    glow.addColorStop(1, 'rgba(120,50,180,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a3ba8';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
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
    this.boss = !!cfg.boss;
  }

  update(dt, game) {
    this.animT += dt;
    if (this.dead) return;
    this.flash = Math.max(0, this.flash - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.hitShake = Math.max(0, this.hitShake - dt);
    const p = game.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const aggroRange = this.boss ? 620 : 320;
    this.aggro = !p.dead && Math.abs(dx) < aggroRange && Math.abs(dy) < 150;

    let speed = this.cfg.speed;

    if (this.aggro) {
      if (Math.abs(dx) > 8) this.dir = dx > 0 ? 1 : -1;
      if (Math.abs(dx) > 46) {
        this.vx = lerp(this.vx, this.dir * speed * 1.5, 1 - Math.pow(0.0015, dt));
      } else {
        this.vx = lerp(this.vx, 0, 1 - Math.pow(0.001, dt));
      }
      // 跳跃型怪物
      if (this.type === 'mushroom' && this.onGround && Math.abs(dx) < 300) {
        this.hopT -= dt;
        if (this.hopT <= 0) {
          this.hopT = rand(1.6, 2.6);
          this.vy = -430;
          this.vx = this.dir * 150;
        }
      }
      // BOSS 毒孢子
      if (this.boss) {
        this.shootCd -= dt;
        if (this.shootCd <= 0 && Math.abs(dx) > 120) {
          this.shootCd = 2.8;
          game.enemyShots.push(new EnemyShot(game, this.x, this.y - 70, p.x, p.y - 34, this.cfg.atk * 0.75));
          game.particles.push(new Particle(this.x, this.y - 70, 0, 0, 0.4, 'rgba(200,120,255,0.7)', 18, 0, true));
        }
      }
    } else {
      if (this.x <= this.min) this.dir = 1;
      if (this.x >= this.max) this.dir = -1;
      this.vx = lerp(this.vx, this.dir * speed, 1 - Math.pow(0.002, dt));
      // 回到出生点附近
      if (Math.abs(this.x - this.homeX) > 260) this.dir = this.x > this.homeX ? -1 : 1;
    }

    // 边缘检测
    if (this.onGround) {
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

    if (this.type === 'snail') drawSnail(ctx, this.animT);
    else if (this.type === 'mushroom') drawMushroom(ctx, this.animT, this.aggro);
    else if (this.type === 'stump') drawStump(ctx, this.animT, this.aggro);
    else if (this.type === 'mk') drawBoss(ctx, this.animT, this.aggro);

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
      const by = this.y - this.h - 40;
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
