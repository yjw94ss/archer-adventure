'use strict';

/* 「第四章」→ 4 */
const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
function chapterNo(text) {
  const ch = String(text || '');
  for (const k in CN_NUM) if (ch.includes(k)) return CN_NUM[k];
  return 1;
}

/* ============================================================
 *  矢量图标
 * ============================================================ */
const Art = {
  wrap(inner) {
    return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  },

  arrow() {
    return this.wrap(`
      <path d="M41 7 L30 10.5 L37 18 Z" fill="#ffe08a" stroke="#a9760a" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M12 36 L33 15" stroke="#eef6ff" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M8 32 L13 37 L7 41 L4 39 Z" fill="#8fd0ff"/>
      <path d="M12 36 L8 40" stroke="#7fa5c9" stroke-width="2" stroke-linecap="round"/>
      <circle cx="26" cy="22" r="1.6" fill="#ffe08a"/>
    `);
  },
  triple() {
    return this.wrap(`
      <g stroke="#eef6ff" stroke-width="3" stroke-linecap="round">
        <path d="M13 36 L32 17"/><path d="M18 40 L37 21"/><path d="M8 32 L27 13"/>
      </g>
      <g fill="#ffe08a" stroke="#a9760a" stroke-width="1">
        <path d="M40 9 L31 12 L36 17 Z"/><path d="M39 33 L30 36 L35 41 Z" transform="translate(2,-9)"/>
        <path d="M31 5 L22 8 L27 13 Z"/>
      </g>
      <g fill="#8fd0ff"><path d="M10 34 L14 38 L8 41 Z"/><path d="M15 38 L19 42 L13 45 Z"/><path d="M5 30 L9 34 L3 37 Z"/></g>
    `);
  },
  pierce() {
    return this.wrap(`
      <circle cx="24" cy="24" r="15" fill="#ffb347" opacity="0.18"/>
      <circle cx="24" cy="24" r="10" fill="#ffd166" opacity="0.2"/>
      <path d="M6 24 L32 24" stroke="#fff3d0" stroke-width="6" stroke-linecap="round"/>
      <path d="M45 24 L31 14 L31 34 Z" fill="#ffd166" stroke="#b8791a" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M10 18 L16 24 L10 30" stroke="#ffd166" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M16 18 L22 24 L16 30" stroke="#ffd166" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.7"/>
    `);
  },
  rain() {
    return this.wrap(`
      <path d="M10 12 Q24 4 38 12 Q34 20 24 20 Q14 20 10 12 Z" fill="#b9a3ff" opacity="0.55"/>
      <g stroke="#e6dcff" stroke-width="2.8" stroke-linecap="round">
        <path d="M15 24 L12 36"/><path d="M24 24 L21 38"/><path d="M33 24 L30 36"/><path d="M39 24 L36 34"/>
      </g>
      <g fill="#cbb8ff"><path d="M12 38 L15 32 L18 38 Z"/><path d="M21 40 L24 34 L27 40 Z"/><path d="M30 38 L33 32 L36 38 Z"/></g>
    `);
  },
  eye() {
    return this.wrap(`
      <circle cx="24" cy="24" r="17" fill="#ffd6e7" opacity="0.16"/>
      <path d="M6 24 Q24 8 42 24 Q24 40 6 24 Z" fill="#fff0f6" stroke="#c98aa6" stroke-width="1.6"/>
      <circle cx="24" cy="24" r="8.4" fill="#f0a12c"/>
      <circle cx="24" cy="24" r="4.4" fill="#5a3208"/>
      <circle cx="21" cy="21" r="2" fill="#fff"/>
      <path d="M11 14 L14 19 M37 14 L34 19" stroke="#e07fa5" stroke-width="2" stroke-linecap="round"/>
    `);
  },
  hpPot() {
    return this.wrap(`
      <rect x="20" y="7" width="8" height="6" rx="2" fill="#c98f5e"/>
      <path d="M20 13 L28 13 L28 16 Q36 19 36 27 L36 37 Q36 42 30 42 L18 42 Q12 42 12 37 L12 27 Q12 19 20 16 Z" fill="#f6fbff" stroke="#9fb6c9" stroke-width="1.6"/>
      <path d="M13 26 Q24 22 35 26 L35 37 Q35 41 30 41 L18 41 Q13 41 13 37 Z" fill="#e8402f"/>
      <path d="M15 28 Q24 25 33 28 L33 32 Q24 29 15 32 Z" fill="#ff8a76" opacity="0.85"/>
      <rect x="19" y="20" width="4" height="9" rx="2" fill="#fff" opacity="0.55"/>
    `);
  },
  mpPot() {
    return this.wrap(`
      <rect x="20" y="7" width="8" height="6" rx="2" fill="#c98f5e"/>
      <path d="M20 13 L28 13 L28 16 Q36 19 36 27 L36 37 Q36 42 30 42 L18 42 Q12 42 12 37 L12 27 Q12 19 20 16 Z" fill="#f6fbff" stroke="#9fb6c9" stroke-width="1.6"/>
      <path d="M13 26 Q24 22 35 26 L35 37 Q35 41 30 41 L18 41 Q13 41 13 37 Z" fill="#3a9bea"/>
      <path d="M15 28 Q24 25 33 28 L33 32 Q24 29 15 32 Z" fill="#8fd8ff" opacity="0.85"/>
      <rect x="19" y="20" width="4" height="9" rx="2" fill="#fff" opacity="0.55"/>
    `);
  },
  meso() {
    return this.wrap(`
      <circle cx="24" cy="24" r="15" fill="#f5c02c" stroke="#a9760a" stroke-width="1.8"/>
      <circle cx="24" cy="24" r="11" fill="none" stroke="#fff0a8" stroke-width="1.4" opacity="0.8"/>
      <text x="24" y="30" font-size="14" font-weight="bold" text-anchor="middle" fill="#7a5405" font-family="sans-serif">M</text>
    `);
  },
  shell() {
    return this.wrap(`
      <path d="M8 34 Q10 16 26 14 Q40 14 40 26 Q40 34 30 34 Z" fill="#9be07a" stroke="#4f8c3d" stroke-width="1.6"/>
      <path d="M38 24 Q34 12 22 14 Q10 17 12 30" fill="none" stroke="#e0a144" stroke-width="7" stroke-linecap="round"/>
      <path d="M36 23 Q33 15 24 17 Q16 19 17 28" fill="none" stroke="#b06f28" stroke-width="2"/>
      <path d="M32 22 Q30 18 26 19" fill="none" stroke="#ffd97a" stroke-width="2"/>
      <circle cx="14" cy="34" r="3" fill="#b6eb9b" stroke="#4f8c3d" stroke-width="1.2"/>
    `);
  },
  cap() {
    return this.wrap(`
      <path d="M8 30 Q8 12 24 12 Q40 12 40 30 Z" fill="#e8564c" stroke="#97302a" stroke-width="1.6" stroke-linejoin="round"/>
      <ellipse cx="24" cy="30" rx="17" ry="4" fill="#ffe6dd"/>
      <circle cx="18" cy="20" r="3.2" fill="#fff2ec"/>
      <circle cx="28" cy="17" r="2.4" fill="#fff2ec"/>
      <circle cx="33" cy="24" r="2" fill="#fff2ec"/>
      <rect x="21" y="34" width="6" height="8" rx="2" fill="#efdcb8"/>
    `);
  },
  branch() {
    return this.wrap(`
      <path d="M10 40 Q20 26 36 10" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M22 26 Q26 18 34 20 Q28 24 24 28 Z" fill="#63b54e"/>
      <path d="M16 33 Q14 24 22 22 Q20 30 16 34 Z" fill="#4e9c3f"/>
      <path d="M10 40 Q8 34 12 30" stroke="#6b4420" stroke-width="2" fill="none"/>
    `);
  },
  bow() {
    return this.wrap(`
      <path d="M14 10 Q34 24 14 38" fill="none" stroke="#a9713d" stroke-width="4" stroke-linecap="round"/>
      <path d="M14 10 L16 24 L14 38" fill="none" stroke="#fff" stroke-width="1.4" opacity="0.85"/>
      <path d="M16 24 L38 24" stroke="#eef6ff" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M43 24 L34 20.5 L34 27.5 Z" fill="#ffe08a"/>
    `);
  },
  bow2() {
    return this.wrap(`
      <path d="M13 8 Q36 24 13 40" fill="none" stroke="#cfd8e6" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M13 8 Q32 24 13 40" fill="none" stroke="#8fa3bd" stroke-width="1.4"/>
      <path d="M14 10 L17 24 L14 38" fill="none" stroke="#7fe4ff" stroke-width="1.4" opacity="0.9"/>
      <path d="M17 24 L38 24" stroke="#eef6ff" stroke-width="2" stroke-linecap="round"/>
      <path d="M43 24 L34 20 L34 28 Z" fill="#9be5ff"/>
      <circle cx="20" cy="24" r="2.6" fill="#ffd166"/>
    `);
  },
  armor() {
    return this.wrap(`
      <path d="M16 10 L22 12 L26 12 L32 10 L38 16 L34 22 L34 40 L14 40 L14 22 L10 16 Z" fill="#8a5a2b" stroke="#5b3a1a" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M22 12 L24 20 L26 12" fill="#f0d5b0"/>
      <path d="M14 26 L34 26 L34 32 L14 32 Z" fill="#6b4420"/>
      <circle cx="24" cy="29" r="2.4" fill="#e8c46a"/>
      <path d="M18 13 L18 22 M30 13 L30 22" stroke="#f0d5b0" stroke-width="1.4" opacity="0.55"/>
    `);
  },
  ring() {
    return this.wrap(`
      <circle cx="24" cy="28" r="10" fill="none" stroke="#e8c46a" stroke-width="4"/>
      <path d="M24 8 L32 16 L24 22 L16 16 Z" fill="#7fe4ff" stroke="#2b8fb5" stroke-width="1.4"/>
      <path d="M24 11 L28 16 L24 19 L20 16 Z" fill="#ffffff" opacity="0.65"/>
      <circle cx="35" cy="33" r="1.6" fill="#fff3b0"/>
    `);
  },
  wing() {
    return this.wrap(`
      <path d="M24 12 Q40 6 42 20 Q36 18 34 24 Q38 28 32 30 Q28 24 22 26 Z" fill="#6f52a0" stroke="#3d2c5c" stroke-width="1.4"/>
      <path d="M24 12 Q8 6 6 20 Q12 18 14 24 Q10 28 16 30 Q20 24 26 26 Z" fill="#5c4488" stroke="#3d2c5c" stroke-width="1.4"/>
      <path d="M24 14 L24 30" stroke="#2e2046" stroke-width="3" stroke-linecap="round"/>
      <circle cx="24" cy="33" r="3.4" fill="#ffd36a"/>
      <path d="M21 17 L15 22 M27 17 L33 22" stroke="#c9b3ee" stroke-width="1.2" opacity="0.7"/>
    `);
  },
  ore() {
    return this.wrap(`
      <path d="M10 38 L16 16 L24 10 L34 18 L38 38 Z" fill="#3d4a63" stroke="#232d3f" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M24 14 L30 22 L24 34 L18 22 Z" fill="#7fd8ff" stroke="#2f7fbe" stroke-width="1.2"/>
      <path d="M24 16 L28 22 L24 30 Z" fill="#dff6ff" opacity="0.8"/>
      <circle cx="15" cy="28" r="3" fill="#9be5ff" opacity="0.85"/>
      <circle cx="35" cy="30" r="2.4" fill="#9be5ff" opacity="0.7"/>
    `);
  },
  venom() {
    return this.wrap(`
      <rect x="20" y="7" width="8" height="6" rx="2" fill="#8a6a2a"/>
      <path d="M20 13 L28 13 L28 16 Q36 19 36 27 L36 37 Q36 42 30 42 L18 42 Q12 42 12 37 L12 27 Q12 19 20 16 Z" fill="#f4fbee" stroke="#9fb69c" stroke-width="1.6"/>
      <path d="M13 26 Q24 22 35 26 L35 37 Q35 41 30 41 L18 41 Q13 41 13 37 Z" fill="#5aa832"/>
      <path d="M15 28 Q24 25 33 28 L33 32 Q24 29 15 32 Z" fill="#a8e06a" opacity="0.9"/>
      <circle cx="20" cy="35" r="2" fill="#dcff9e" opacity="0.8"/>
      <circle cx="27" cy="33" r="1.4" fill="#dcff9e" opacity="0.7"/>
    `);
  },
  rune() {
    return this.wrap(`
      <path d="M14 40 L11 14 L37 10 L39 38 Z" fill="#b9b2d6" stroke="#6d6690" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M17 36 L15 16 L35 13 L36 34 Z" fill="#a49cc4" opacity="0.55"/>
      <path d="M21 30 L24 18 L27 26 L30 20" stroke="#ffe08a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="24" cy="18" r="1.8" fill="#fff3c0"/>
    `);
  },
  elixir() {
    return this.wrap(`
      <rect x="20" y="6" width="8" height="6" rx="2" fill="#b98a3c"/>
      <path d="M20 12 L28 12 L28 15 Q37 18 37 28 L37 36 Q37 42 30 42 L18 42 Q11 42 11 36 L11 28 Q11 18 20 15 Z" fill="#fffdf4" stroke="#c2ac7e" stroke-width="1.6"/>
      <path d="M12 26 Q24 21 36 26 L36 36 Q36 41 30 41 L18 41 Q12 41 12 36 Z" fill="#f0a92c"/>
      <path d="M14 28 Q24 24 34 28 L34 32 Q24 28 14 32 Z" fill="#ffe08a" opacity="0.9"/>
      <path d="M24 16 L26 21 L24 25 L22 21 Z" fill="#fff6d2"/>
      <circle cx="20" cy="35" r="1.8" fill="#fff3c0"/>
      <circle cx="28" cy="33" r="1.4" fill="#fff3c0"/>
    `);
  },
  bow3() {
    return this.wrap(`
      <path d="M13 8 Q36 24 13 40" fill="none" stroke="#4f9a5e" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M13 8 Q33 24 13 40" fill="none" stroke="#9ce8a8" stroke-width="1.4"/>
      <path d="M14 10 L17 24 L14 38" fill="none" stroke="#d7ffdf" stroke-width="1.3" opacity="0.9"/>
      <path d="M17 24 L38 24" stroke="#eef6ff" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M43 24 L34 20.5 L34 27.5 Z" fill="#9cf0b0"/>
      <ellipse cx="20" cy="24" rx="3" ry="4.4" fill="#d7ffe0" opacity="0.75"/>
    `);
  },
  bow4() {
    return this.wrap(`
      <path d="M13 7 Q37 24 13 41" fill="none" stroke="#d9a63c" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M13 7 Q34 24 13 41" fill="none" stroke="#ffe8a8" stroke-width="1.6"/>
      <path d="M14 9 L17 24 L14 39" fill="none" stroke="#fff6cf" stroke-width="1.4"/>
      <path d="M17 24 L38 24" stroke="#fffaf0" stroke-width="2" stroke-linecap="round"/>
      <path d="M44 24 L34 19.6 L34 28.4 Z" fill="#ffe08a" stroke="#b8791a" stroke-width="1"/>
      <path d="M20 8 L22 12 L20 16 L18 12 Z" fill="#fff3c0"/>
      <path d="M20 32 L22 36 L20 40 L18 36 Z" fill="#fff3c0"/>
    `);
  },
  armor2() {
    return this.wrap(`
      <path d="M16 10 L22 12 L26 12 L32 10 L38 16 L34 22 L34 40 L14 40 L14 22 L10 16 Z" fill="#5a4b7e" stroke="#33294d" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M22 12 L24 20 L26 12" fill="#2d2544"/>
      <path d="M14 26 L34 26 L34 32 L14 32 Z" fill="#42355f"/>
      <circle cx="24" cy="29" r="2.6" fill="#9be5ff"/>
      <path d="M17 14 L14 24 M31 14 L34 24" stroke="#9b8cc6" stroke-width="1.4" opacity="0.75"/>
      <path d="M19 36 L29 36" stroke="#9b8cc6" stroke-width="1.2" opacity="0.6"/>
    `);
  },
  ring2() {
    return this.wrap(`
      <circle cx="24" cy="30" r="9.5" fill="none" stroke="#e0a93c" stroke-width="4"/>
      <path d="M24 7 L31 15 L24 21 L17 15 Z" fill="#ff7a5d" stroke="#a8321a" stroke-width="1.4"/>
      <path d="M24 10 L27.5 15 L24 18 L20.5 15 Z" fill="#ffd0a8" opacity="0.8"/>
      <path d="M33 22 Q39 18 42 12 M36 24 Q41 22 43 17" stroke="#8fe6ff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <circle cx="34" cy="34" r="1.6" fill="#fff3b0"/>
    `);
  },
  skillIcon(name) {
    return this[name] ? this[name]() : this.arrow();
  },
  itemIcon(name) {
    return this[name] ? this[name]() : this.meso();
  },
};

/* ============================================================
 *  界面控制
 * ============================================================ */
class UI {
  constructor(game) {
    this.game = game;
    this.el = {};
    const ids = [
      'hp-fill', 'hp-text', 'mp-fill', 'mp-text', 'exp-fill', 'exp-text', 'exp-num', 'lv-badge', 'char-name',
      'mini-atk', 'mini-crit', 'mini-def', 'mini-gold', 'minimap-canvas', 'quest-tracker', 'quick-bar', 'log-box',
      'toast-wrap', 'boss-bar', 'boss-name', 'boss-lv', 'boss-hp-fill', 'boss-hp-text', 'inv-grid',
      'inv-meso', 'inv-slots', 'equip-slots', 'equip-summary', 'combat-summary', 'stat-list', 'ap-left', 'stat-level',
      'stat-exp', 'quest-list', 'buff-bar', 'tooltip', 'hurt-flash', 'levelup-banner', 'lu-sub',
      'death-veil', 'sound-btn', 'map-name', 'map-sub', 'map-fade', 'map-banner', 'mb-chapter', 'mb-name', 'mb-sub',
      'map-ch', 'hud-chapter', 'ending-veil', 'ending-stats', 'ending-btn',
    ];
    ids.forEach((id) => (this.el[id] = document.getElementById(id)));
    this.mm = this.el['minimap-canvas'].getContext('2d');
    this.activePanel = null;
    this.invFilter = 'all';
    this.skillEls = {};
    this.potionEls = {};
    this.buffEl = null;
    this.bossVisible = false;
    this.build();
    this.bindGlobal();
    this.initTouchHud();
    this.drawPortrait(document.getElementById('portrait-canvas'));
    this.drawPortrait(document.getElementById('stat-portrait'));
    this.updateQuestTracker();
    this.log('欢迎来到蘑菇森林，弓箭手。');
    this.log('提示：按 T 打开任务日志，接取村民的委托。', 'sys');
  }

  /* ---------- 构建 ---------- */
  build() {
    const wrap = this.el['quick-bar'];
    let html = '';
    SKILLS.forEach((s) => {
      html += `<div class="slot" data-skill="${s.id}" style="--tint:${s.tint}">
        <div class="icon">${Art.skillIcon(s.icon)}</div>
        <div class="mp-warn"></div>
        <div class="cd-mask"></div>
        <div class="cd-num"></div>
        <div class="cost">${s.mp ? s.mp : ''}</div>
        <div class="key">${s.keyLabel}</div>
      </div>`;
    });
    html += '<div class="qb-sep"></div>';
    html += `<div class="slot potion-hp" data-potion="hp_potion">
      <div class="icon">${Art.itemIcon('hpPot')}</div>
      <div class="cost" data-count>×0</div>
      <div class="key">5</div>
    </div>`;
    html += `<div class="slot potion-mp" data-potion="mp_potion">
      <div class="icon">${Art.itemIcon('mpPot')}</div>
      <div class="cost" data-count>×0</div>
      <div class="key">6</div>
    </div>`;
    wrap.innerHTML = html;

    wrap.querySelectorAll('[data-skill]').forEach((el) => {
      const id = el.dataset.skill;
      this.skillEls[id] = {
        el,
        mask: el.querySelector('.cd-mask'),
        num: el.querySelector('.cd-num'),
        cd: SKILL_MAP[id].cd,
        wasCooling: false,
      };
      el.addEventListener('click', () => this.game.castSkill(id));
      this.bindTip(el, () => this.skillTip(id));
    });

    wrap.querySelectorAll('[data-potion]').forEach((el) => {
      const id = el.dataset.potion;
      this.potionEls[id] = { el, count: el.querySelector('[data-count]') };
      el.addEventListener('click', () => this.game.usePotion(id));
      this.bindTip(el, () => this.itemTip(id));
    });

    document.querySelectorAll('.menu-btn[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => this.togglePanel(btn.dataset.panel));
    });
    this.el['sound-btn'].addEventListener('click', () => {
      Sound.on = !Sound.on;
      this.el['sound-btn'].classList.toggle('sound-off', !Sound.on);
      if (Sound.on) Sound.ui();
      this.toast(Sound.on ? '音效已开启' : '音效已关闭');
    });

    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.closePanels());
    });

    document.querySelectorAll('#inv-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#inv-tabs .tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.invFilter = tab.dataset.tab;
        this.renderInventory();
        Sound.ui();
      });
    });

    this.el['inv-grid'].addEventListener('click', (e) => {
      const slot = e.target.closest('.inv-slot');
      if (!slot || slot.classList.contains('empty')) return;
      const idx = Number(slot.dataset.index);
      const item = this.game.player.inventory[idx];
      if (!item) return;
      const def = ITEMS[item.id];
      if (def.kind === 'etc') {
        this.toast(def.name + ' 暂时无法使用，可以卖给商人');
        return;
      }
      this.game.player.useItem(idx);
    });

    this.el['equip-slots'].addEventListener('click', (e) => {
      const row = e.target.closest('.equip-row');
      if (!row) return;
      this.game.player.unequip(row.dataset.slot);
    });

    this.el['stat-list'].addEventListener('click', (e) => {
      const btn = e.target.closest('.plus-btn');
      if (!btn) return;
      this.game.player.allocate(btn.dataset.stat);
    });

    this.el['quest-list'].addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quest-action]');
      if (!btn) return;
      const id = btn.dataset.questId;
      if (btn.dataset.questAction === 'accept') this.game.acceptQuest(id);
      else this.game.claimQuest(id);
    });
  }

  /* ---------- 触屏 HUD ---------- */
  initTouchHud() {
    const q = (id) => document.getElementById(id);
    this.tEl = {
      lv: q('th-lv'),
      hp: q('th-hp'),
      hpt: q('th-hp-t'),
      mp: q('th-mp'),
      mpt: q('th-mp-t'),
      map: q('th-map'),
      gold: q('th-gold'),
      exp: q('th-exp'),
    };
    this.tSkills = {};
    document.querySelectorAll('#t-actions .t-skill').forEach((b) => {
      this.tSkills[b.dataset.skill] = { el: b, num: b.querySelector('.tnum'), cooling: false };
    });
    this.tPotions = {};
    document.querySelectorAll('#t-actions [data-potion]').forEach((b) => {
      this.tPotions[b.dataset.potion] = { el: b, num: b.querySelector('[data-count]') };
    });
  }

  updateTouch(p) {
    const t = this.tEl;
    if (!t || !t.lv) return;
    const hpPct = clamp((p.hp / p.maxHp) * 100, 0, 100);
    const mpPct = clamp((p.mp / p.maxMp) * 100, 0, 100);
    t.hp.style.width = hpPct + '%';
    t.mp.style.width = mpPct + '%';
    t.hpt.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    t.mpt.textContent = `${Math.ceil(p.mp)} / ${p.maxMp}`;
    t.lv.textContent = p.level;
    t.gold.textContent = p.gold.toLocaleString() + ' M';
    const need = expNeed(p.level);
    t.exp.textContent = 'EXP ' + clamp((p.exp / need) * 100, 0, 100).toFixed(0) + '%';

    for (const id in this.tSkills) {
      const s = this.tSkills[id];
      const left = this.game.cooldowns[id] || 0;
      const skill = SKILL_MAP[id];
      if (left > 0) {
        s.el.classList.add('cooling');
        s.num.textContent = left > 1 ? Math.ceil(left) : left.toFixed(1);
        s.cooling = true;
      } else if (s.cooling) {
        s.el.classList.remove('cooling');
        s.num.textContent = '';
        s.cooling = false;
      }
      s.el.classList.toggle('no-mp', p.mp < skill.mp);
    }
    for (const id in this.tPotions) {
      const pt = this.tPotions[id];
      const n = p.countItem(id);
      pt.num.textContent = '×' + n;
      pt.el.classList.toggle('empty', n <= 0);
    }
  }

  bindGlobal() {
    document.querySelectorAll('.panel').forEach((p) => {
      p.addEventListener('mousedown', (e) => e.stopPropagation());
    });
    if (this.el['ending-btn']) {
      this.el['ending-btn'].addEventListener('click', () => this.game.resumeAfterEnding());
    }
  }

  /* ---------- 提示 ---------- */
  bindTip(el, contentFn) {
    el.addEventListener('mouseenter', (e) => {
      this.showTip(contentFn(), e.clientX, e.clientY);
    });
    el.addEventListener('mousemove', (e) => {
      this.moveTip(e.clientX, e.clientY);
    });
    el.addEventListener('mouseleave', () => this.hideTip());
  }

  showTip(html, cx, cy) {
    const tip = this.el['tooltip'];
    tip.innerHTML = html;
    tip.classList.add('show');
    this.moveTip(cx, cy);
  }

  moveTip(cx, cy) {
    const tip = this.el['tooltip'];
    const stage = document.getElementById('stage');
    const r = stage.getBoundingClientRect();
    const s = r.width / 1280;
    let x = (cx - r.left) / s + 16;
    let y = (cy - r.top) / s + 16;
    const w = tip.offsetWidth || 190;
    const h = tip.offsetHeight || 80;
    if (x + w > 1264) x = (cx - r.left) / s - w - 14;
    if (y + h > 704) y = (cy - r.top) / s - h - 12;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  hideTip() {
    this.el['tooltip'].classList.remove('show');
  }

  skillTip(id) {
    const s = SKILL_MAP[id];
    const p = this.game.player;
    const dmg = s.mult > 0 ? `伤害 ${Math.round(p.atk * s.mult)}` : '增益技能';
    const cd = s.cd > 0 ? `冷却 ${s.cd.toFixed(1)} 秒` : '无冷却';
    return `<b>${s.name} <span style="color:#9fb6c9;font-weight:700">[${s.keyLabel}]</span></b>
      <div class="tt-line">${s.desc}</div>
      <div class="tt-line" style="margin-top:4px">${dmg} · ${cd}${s.mp ? ` · <span class="tt-cost">消耗 ${s.mp} MP</span>` : ''}</div>`;
  }

  itemTip(id) {
    const d = ITEMS[id];
    const kinds = { equip: '装备', use: '消耗品', etc: '其他', meso: '货币' };
    let extra = '';
    if (d.kind === 'equip') {
      const parts = [];
      if (d.atk) parts.push('攻击力 +' + d.atk);
      if (d.hp) parts.push('最大HP +' + d.hp);
      if (d.crit) parts.push('暴击率 +' + Math.round(d.crit * 100) + '%');
      if (d.dex) parts.push('DEX +' + d.dex);
      extra = `<div class="tt-line" style="color:#ffd76a">${parts.join(' · ')}</div>`;
    }
    return `<b>${d.name}</b><div class="tt-line" style="color:#8fb8d8">${kinds[d.kind] || ''}${
      d.price ? ' · 售价 ' + d.price + ' 金币' : ''
    }</div>${extra}<div class="tt-line">${d.desc || ''}</div>`;
  }

  /* ---------- 面板 ---------- */
  togglePanel(name) {
    if (this.activePanel === name) {
      this.closePanels();
      return;
    }
    this.closePanels();
    const el = document.getElementById('panel-' + name);
    if (!el) return;
    el.hidden = false;
    this.activePanel = name;
    document.body.classList.add('panel-open');
    if (name === 'inventory') this.renderInventory();
    if (name === 'stats') this.renderStats();
    if (name === 'quests') this.renderQuests();
    Sound.ui();
  }

  closePanels() {
    document.querySelectorAll('.panel').forEach((p) => (p.hidden = true));
    this.activePanel = null;
    document.body.classList.remove('panel-open');
    this.hideTip();
  }

  /* ---------- 日志 / 提示 ---------- */
  log(msg, cls) {
    const box = this.el['log-box'];
    const line = document.createElement('div');
    line.className = 'log-line' + (cls ? ' ' + cls : '');
    line.textContent = msg;
    box.appendChild(line);
    while (box.children.length > 5) box.removeChild(box.firstChild);
    setTimeout(() => {
      line.style.transition = 'opacity .5s';
      line.style.opacity = '0';
      setTimeout(() => line.remove(), 500);
    }, 6500);
  }

  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    this.el['toast-wrap'].appendChild(t);
    setTimeout(() => t.remove(), 2100);
  }

  flashHurt() {
    const f = this.el['hurt-flash'];
    f.classList.add('show');
    setTimeout(() => f.classList.remove('show'), 130);
  }

  showLevelUp(level) {
    const b = this.el['levelup-banner'];
    b.classList.remove('show');
    void b.offsetWidth;
    this.el['lu-sub'].textContent = 'Lv.' + level;
    b.classList.add('show');
  }

  setDead(dead) {
    this.el['death-veil'].classList.toggle('show', dead);
  }

  /* ---------- 每帧更新 ---------- */
  update(dt) {
    const p = this.game.player;
    const hpPct = clamp((p.hp / p.maxHp) * 100, 0, 100);
    const mpPct = clamp((p.mp / p.maxMp) * 100, 0, 100);
    this.el['hp-fill'].style.width = hpPct + '%';
    this.el['mp-fill'].style.width = mpPct + '%';
    this.el['hp-text'].textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    this.el['mp-text'].textContent = `${Math.ceil(p.mp)} / ${p.maxMp}`;

    const need = expNeed(p.level);
    const expPct = clamp((p.exp / need) * 100, 0, 100);
    this.el['exp-fill'].style.width = expPct + '%';
    this.el['exp-text'].textContent = `EXP ${expPct.toFixed(1)}%`;
    if (this.el['exp-num']) this.el['exp-num'].textContent = `${Math.floor(p.exp)} / ${need}`;

    this.el['char-name'].textContent = `Lv.${p.level} 弓箭手`;
    this.el['lv-badge'].textContent = p.level;
    this.el['mini-atk'].textContent = p.atk;
    this.el['mini-crit'].textContent = (p.critRate * 100).toFixed(0) + '%';
    this.el['mini-def'].textContent = p.equipBonus('hp') ? Math.round(p.equipBonus('hp') / 8) : 0;
    this.el['mini-gold'].textContent = p.gold;

    // 药水数量
    ['hp_potion', 'mp_potion'].forEach((id) => {
      const pe = this.potionEls[id];
      if (!pe) return;
      pe.count.textContent = '×' + p.countItem(id);
      pe.el.classList.toggle('no-mp', p.countItem(id) <= 0);
    });

    // 技能冷却
    for (const id in this.skillEls) {
      const se = this.skillEls[id];
      const left = this.game.cooldowns[id] || 0;
      const skill = SKILL_MAP[id];
      if (left > 0 && se.cd > 0) {
        se.mask.style.height = Math.min(100, (left / se.cd) * 100) + '%';
        se.num.textContent = left > 1 ? Math.ceil(left) : left.toFixed(1);
        se.el.classList.add('cooling');
        se.wasCooling = true;
      } else {
        if (se.wasCooling) {
          se.mask.style.height = '0%';
          se.el.classList.remove('cooling');
          se.el.classList.add('flash');
          setTimeout(() => se.el.classList.remove('flash'), 380);
          se.wasCooling = false;
        }
      }
      se.el.classList.toggle('no-mp', p.mp < skill.mp);
    }

    // 增益
    if (p.buffTime > 0) {
      if (!this.buffEl) {
        this.buffEl = document.createElement('div');
        this.buffEl.className = 'buff';
        this.buffEl.innerHTML = '<span class="bico">◈</span><span>鹰眼</span><span class="btime"></span>';
        this.el['buff-bar'].appendChild(this.buffEl);
        this.el['buff-bar'].classList.add('has-buff');
      }
      this.buffEl.querySelector('.btime').textContent = Math.ceil(p.buffTime) + 's';
    } else if (this.buffEl) {
      this.buffEl.remove();
      this.buffEl = null;
      this.el['buff-bar'].classList.remove('has-buff');
    }

    // BOSS 血条
    const boss = this.game.monsters.find((m) => m.boss && !m.dead);
    if (boss && (boss.aggro || boss.hp < boss.maxHp)) {
      this.el['boss-bar'].classList.add('show');
      this.el['boss-hp-fill'].style.width = clamp((boss.hp / boss.maxHp) * 100, 0, 100) + '%';
      this.el['boss-name'].textContent = boss.name;
      this.el['boss-lv'].textContent = 'Lv.' + boss.level;
      this.el['boss-hp-text'].textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`;
      if (this.game.touchMode) document.body.classList.add('boss-on');
    } else {
      this.el['boss-bar'].classList.remove('show');
      if (this.game.touchMode) document.body.classList.remove('boss-on');
    }

    // 背包面板实时金币
    if (this.activePanel === 'inventory') {
      this.el['inv-meso'].textContent = p.gold;
      this.el['inv-slots'].textContent = p.inventory.length + ' / ' + MAX_INV;
    }

    if (this.game.touchMode) this.updateTouch(p);

    this.drawMinimap();
  }

  /* ---------- 地图信息 ---------- */
  setMapInfo(def) {
    if (!def) return;
    this.el['map-name'].textContent = def.name;
    this.el['map-sub'].textContent = def.sub;
    const n = chapterNo(def.chapter);
    if (this.el['map-ch']) this.el['map-ch'].textContent = 'CH.' + n;
    if (this.el['hud-chapter']) this.el['hud-chapter'].textContent = 'CH.' + n;
    if (this.tEl && this.tEl.map) this.tEl.map.textContent = 'CH.' + n + ' ' + def.name;
  }

  /* ---------- 通关结算 ---------- */
  showEnding(rows) {
    const box = this.el['ending-stats'];
    if (box) {
      box.innerHTML = rows
        .map(([k, v]) => `<div class="st"><span>${k}</span><b>${v}</b></div>`)
        .join('');
    }
    if (this.el['ending-veil']) this.el['ending-veil'].classList.add('show');
  }

  hideEnding() {
    if (this.el['ending-veil']) this.el['ending-veil'].classList.remove('show');
  }

  showMapBanner(def) {
    if (!def) return;
    this.el['mb-chapter'].textContent = def.chapter || '';
    this.el['mb-name'].textContent = def.name;
    this.el['mb-sub'].textContent = def.sub + '　推荐 ' + def.suggestLv;
    const b = this.el['map-banner'];
    b.classList.add('show');
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => b.classList.remove('show'), 2200);
  }

  fadeMap(on) {
    this.el['map-fade'].classList.toggle('show', !!on);
  }

  /* ---------- 小地图 ---------- */
  drawMinimap() {
    const ctx = this.mm;
    const W = 216;
    const H = 148;
    const pad = 7;
    const sx = (W - pad * 2) / WORLD_W;
    const sy = (H - pad * 2) / WORLD_H;

    ctx.clearRect(0, 0, W, H);
    const th = theme();
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, th.mm[0]);
    bg.addColorStop(1, th.mm[1]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = th.id === 'cave' ? 'rgba(150,195,235,0.14)' : 'rgba(150,135,105,0.16)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 平台
    MAP.platforms.forEach((p) => {
      if (p.ground) {
        ctx.fillStyle = th.id === 'cave' || th.id === 'ruins' ? 'rgba(110,120,150,0.85)' : 'rgba(122,95,58,0.8)';
        ctx.fillRect(pad + p.x * sx, pad + p.y * sy, p.w * sx, 6);
        ctx.fillStyle = th.mmPlat;
        ctx.fillRect(pad + p.x * sx, pad + p.y * sy - 1, p.w * sx, 2);
      } else {
        ctx.fillStyle = th.mmPlat;
        ctx.fillRect(pad + p.x * sx, pad + p.y * sy, p.w * sx, 4);
      }
    });

    // 传送门
    (MAP.portals || []).forEach((pt) => {
      const x = pad + pt.x * sx;
      const y = pad + pt.y * sy;
      ctx.fillStyle = 'rgba(120,240,180,0.9)';
      ctx.beginPath();
      ctx.arc(x, y - 2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,255,220,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y - 2, 5, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 绳索 / 梯子
    ctx.strokeStyle = 'rgba(150,110,60,0.55)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    MAP.climbables.forEach((c) => {
      ctx.beginPath();
      ctx.moveTo(pad + c.x * sx, pad + c.y1 * sy);
      ctx.lineTo(pad + c.x * sx, pad + c.y2 * sy);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // 怪物
    this.game.monsters.forEach((m) => {
      if (m.dead) return;
      const x = pad + m.x * sx;
      const y = pad + (m.y - m.h * 0.5) * sy;
      if (m.boss) {
        ctx.fillStyle = '#9b3fd0';
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,120,220,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 5.4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(214,72,60,0.9)';
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 视口
    const cam = this.game.camera;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(pad + cam.x * sx, pad + cam.y * sy, VIEW_W * sx, VIEW_H * sy);

    // 玩家
    const px = pad + this.game.player.x * sx;
    const py = pad + (this.game.player.y - 20) * sy;
    const pulse = 1 + Math.sin(performance.now() / 260) * 0.12;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#1fc463';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(31,196,99,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 8 + Math.sin(performance.now() / 300) * 2, 0, Math.PI * 2);
    ctx.stroke();

    // 边框
    ctx.strokeStyle = 'rgba(120,100,70,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  }

  /* ---------- 背包 ---------- */
  renderInventory() {
    const p = this.game.player;
    const list = p.inventory
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => {
        const k = ITEMS[item.id].kind;
        if (this.invFilter === 'all') return true;
        if (this.invFilter === 'equip') return k === 'equip';
        if (this.invFilter === 'use') return k === 'use';
        return k === 'etc';
      });

    let html = '';
    for (let i = 0; i < MAX_INV; i++) {
      const entry = list[i];
      if (!entry) {
        html += '<div class="inv-slot empty"></div>';
        continue;
      }
      const def = ITEMS[entry.item.id];
      html += `<div class="inv-slot" data-index="${entry.i}" data-item="${entry.item.id}">
        ${def.kind === 'equip' ? '<div class="rare"></div>' : ''}
        <div class="ico">${Art.itemIcon(def.icon)}</div>
        ${entry.item.qty > 1 ? `<span class="qty">${entry.item.qty}</span>` : ''}
      </div>`;
    }
    this.el['inv-grid'].innerHTML = html;

    this.el['inv-grid'].querySelectorAll('.inv-slot[data-item]').forEach((slot) => {
      const id = slot.dataset.item;
      this.bindTip(slot, () => this.itemTip(id));
    });

    this.el['inv-meso'].textContent = p.gold;
    this.el['inv-slots'].textContent = p.inventory.length + ' / ' + MAX_INV;

    let eq = '';
    ['weapon', 'armor', 'ring'].forEach((slot) => {
      const id = p.equipment[slot];
      const def = id ? ITEMS[id] : null;
      eq += `<div class="equip-row ${def ? '' : 'empty'}" data-slot="${slot}">
        <div class="eq-ico">${def ? Art.itemIcon(def.icon) : ''}</div>
        <div class="eq-txt">
          <div class="eq-slot">${EQUIP_SLOT_LABEL[slot]}</div>
          <div class="eq-name">${def ? def.name : '未装备'}</div>
        </div>
      </div>`;
    });
    this.el['equip-slots'].innerHTML = eq;

    const parts = [];
    if (p.bonusAtk) parts.push('攻击力 <b>+' + p.bonusAtk + '</b>');
    if (p.bonusHp) parts.push('最大HP <b>+' + p.bonusHp + '</b>');
    if (p.bonusCrit) parts.push('暴击率 <b>+' + Math.round(p.bonusCrit * 100) + '%</b>');
    if (p.bonusDex) parts.push('DEX <b>+' + p.bonusDex + '</b>');
    this.el['equip-summary'].innerHTML = parts.length ? parts.join('<br>') : '暂无装备加成';

    const rows = [
      ['攻击力', p.atk],
      ['暴击率', (p.critRate * 100).toFixed(1) + '%'],
      ['暴击伤害', Math.round(p.critDamage * 100) + '%'],
      ['最大 HP', p.maxHp],
      ['最大 MP', p.maxMp],
    ];
    this.el['combat-summary'].innerHTML = rows
      .map((r) => `<div class="cs-row"><span>${r[0]}</span><b>${r[1]}</b></div>`)
      .join('');
  }

  /* ---------- 属性 ---------- */
  renderStats() {
    const p = this.game.player;
    this.el['stat-level'].textContent = p.level;
    this.el['stat-exp'].textContent = `${Math.floor(p.exp)} / ${expNeed(p.level)}`;
    this.el['ap-left'].textContent = p.ap;
    const can = p.ap > 0;

    const base = [
      { label: '攻击力', val: p.atk, desc: '由 DEX、等级与装备共同决定', noPlus: true },
      { label: '暴击率', val: (p.critRate * 100).toFixed(1) + '%', desc: '暴击时造成 ' + p.critDamage.toFixed(1) + ' 倍伤害', noPlus: true },
      { label: '最大 HP', val: p.maxHp, desc: '每次升级提升 28 点', noPlus: true },
      { label: '最大 MP', val: p.maxMp, desc: '每次升级提升 15 点', noPlus: true },
    ];

    let html = '';
    base.forEach((r) => {
      html += `<div class="stat-row"><span class="s-label">${r.label}</span>
        <span class="s-val">${r.val}</span><span class="s-desc">${r.desc}</span></div>`;
    });

    const attrs = [
      { key: 'str', label: 'STR', desc: '力量 · 提升少量攻击力' },
      { key: 'dex', label: 'DEX', desc: '敏捷 · 每点 +2 攻击力（弓箭手主属性）' },
      { key: 'int', label: 'INT', desc: '智力 · 提升魔法上限' },
      { key: 'luk', label: 'LUK', desc: '幸运 · 每点 +0.3% 暴击率' },
    ];
    attrs.forEach((a) => {
      html += `<div class="stat-row"><span class="s-label">${a.label}</span>
        <span class="s-val">${p[a.key]}</span><span class="s-desc">${a.desc}</span>
        <button class="plus-btn" data-stat="${a.key}" ${can ? '' : 'disabled'}>+</button></div>`;
    });

    this.el['stat-list'].innerHTML = html;
  }

  /* ---------- 任务 ---------- */
  updateQuestTracker() {
    const active = this.game.quests.filter((q) => q.state === 'active');
    const head = '<div class="qt-head">任务追踪</div>';
    if (!active.length) {
      this.el['quest-tracker'].innerHTML =
        head + '<div class="qt-empty">按 T 打开任务日志，接取新的委托</div>';
      return;
    }
    let html = head;
    active.slice(0, 2).forEach((q) => {
      const def = q.def;
      const name = MONSTER_TYPES[def.monster].name;
      const pct = clamp((q.progress / def.need) * 100, 0, 100);
      html += `<div class="qt-item">
        <div class="qt-name">${def.name}<em>${q.progress >= def.need ? '可完成' : '进行中'}</em></div>
        <div class="qt-obj"><span>${name} 讨伐</span><span>${Math.min(q.progress, def.need)} / ${def.need}</span></div>
        <div class="qt-bar"><i style="width:${pct}%"></i></div>
      </div>`;
    });
    this.el['quest-tracker'].innerHTML = html;
  }

  renderQuests() {
    let html = '';
    this.game.quests.forEach((q) => {
      const def = q.def;
      const name = MONSTER_TYPES[def.monster].name;
      const pct = clamp((q.progress / def.need) * 100, 0, 100);
      const locked = q.state === 'available' && def.reqLv && this.game.player.level < def.reqLv;
      const stateLabel = locked
        ? '未解锁'
        : {
            available: '可接取',
            active: '进行中',
            ready: '可领取',
            done: '已完成',
          }[q.state];
      const stateCls = locked ? 'done' : { available: '', active: 'active', ready: 'ready', done: 'done' }[q.state];
      const rewardItems = def.rewards.items.map((it) => ITEMS[it.id].name + '×' + it.qty).join('、');
      let action = '';
      if (locked) {
        action = `<button class="btn" disabled>需要 Lv.${def.reqLv}</button>`;
      } else if (q.state === 'available') {
        action = `<button class="btn" data-quest-action="accept" data-quest-id="${def.id}">接受委托</button>`;
      } else if (q.state === 'ready') {
        action = `<button class="btn gold" data-quest-action="claim" data-quest-id="${def.id}">领取奖励</button>`;
      } else if (q.state === 'active') {
        action = `<button class="btn" disabled>讨伐中…</button>`;
      }
      html += `<div class="quest-card ${q.state === 'active' ? 'active' : ''} ${q.state === 'done' ? 'done' : ''}">
        <div class="qc-head">
          <span class="qc-name">${def.name}</span>
          <span class="qc-giver">${def.giver}</span>
          <span class="qc-state ${stateCls}">${stateLabel}</span>
        </div>
        <div class="qc-desc">${def.desc}</div>
        <div class="qc-prog">
          <div class="bar2"><i style="width:${pct}%"></i></div>
          <span>${name} ${Math.min(q.progress, def.need)} / ${def.need}</span>
        </div>
        <div class="qc-reward">奖励：EXP ${def.rewards.exp} · ${def.rewards.meso} 金币 · ${rewardItems}</div>
        <div class="qc-actions">${action}</div>
      </div>`;
    });
    this.el['quest-list'].innerHTML = html;
  }

  /* ---------- 头像 ---------- */
  drawPortrait(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#bfe9ff');
    g.addColorStop(0.6, '#93d0e9');
    g.addColorStop(1, '#6fb4cf');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // 光斑
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.26, w * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(w * 0.5, h * 0.92);
    const s = w / 62;
    ctx.scale(s, s);

    // 箭袋（背景，露出肩后）
    ctx.save();
    ctx.translate(15, -30);
    ctx.rotate(-0.26);
    // 箭杆与箭羽
    ctx.strokeStyle = '#c9a06a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -20);
    ctx.lineTo(-6, -34);
    ctx.moveTo(3, -20);
    ctx.lineTo(2, -35);
    ctx.stroke();
    ctx.fillStyle = '#f0e6d2';
    ctx.beginPath();
    ctx.moveTo(-6, -34);
    ctx.lineTo(-1.5, -30);
    ctx.lineTo(-9, -29);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -35);
    ctx.lineTo(6, -30.5);
    ctx.lineTo(-1, -30);
    ctx.closePath();
    ctx.fill();
    // 袋身
    ctx.fillStyle = '#8a5a2b';
    roundRect(ctx, -8, -22, 16, 26, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,58,26,0.85)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, -8, -22, 16, 26, 5);
    ctx.stroke();
    ctx.fillStyle = 'rgba(240,212,160,0.55)';
    roundRect(ctx, -8, -15, 16, 4, 2);
    ctx.fill();
    ctx.restore();

    // 身体
    ctx.fillStyle = '#3f87b0';
    roundRect(ctx, -17, -26, 34, 30, 11);
    ctx.fill();
    ctx.fillStyle = '#2b6183';
    ctx.beginPath();
    ctx.moveTo(-17, -22);
    ctx.quadraticCurveTo(0, -28, 17, -22);
    ctx.lineTo(15, -12);
    ctx.quadraticCurveTo(0, -17, -15, -12);
    ctx.closePath();
    ctx.fill();

    // 头
    ctx.fillStyle = '#f7cfae';
    ctx.beginPath();
    ctx.arc(0, -44, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-15.5, -43, 4.4, 0, Math.PI * 2);
    ctx.fill();

    // 头发
    ctx.fillStyle = '#b0703a';
    ctx.beginPath();
    ctx.arc(0, -47, 18.6, Math.PI * 1.02, Math.PI * 2.02);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-18, -47);
    ctx.quadraticCurveTo(-22, -34, -15, -32);
    ctx.quadraticCurveTo(-13, -41, -9, -46);
    ctx.closePath();
    ctx.fill();

    // 兜帽
    ctx.fillStyle = 'rgba(40,94,126,0.94)';
    ctx.beginPath();
    ctx.moveTo(-18, -52);
    ctx.quadraticCurveTo(-2, -70, 15, -52);
    ctx.quadraticCurveTo(0, -58, -18, -52);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.ellipse(7, -43, 2.9, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-3, -43, 2.6, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(8, -44.6, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2, -44.6, 1, 0, Math.PI * 2);
    ctx.fill();

    // 嘴
    ctx.strokeStyle = '#c07a52';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(4, -35, 4, 0.25, 1.25);
    ctx.stroke();

    ctx.restore();
  }
}
