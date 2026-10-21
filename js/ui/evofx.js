const EVO = { dur: 2.0, fly: 0.5, flash: 1.5, swapEnd: 1.5 };

const EVO_APP = {
  evoLayer() {
    if (this._evoLayer && this._evoLayer.isConnected) return this._evoLayer;
    const el = document.createElement('div');
    el.id = 'evo-layer';
    document.getElementById('arena').appendChild(el);
    this._evoLayer = el;
    return el;
  },

  onStarUpEvent(e) {
    if (!e || e.p !== this.human || this.replaying) return;
    (this.evoQueue = this.evoQueue || []).push(e);
  },

  evoSide() {
    const sc = this.curScene;
    if (!sc || sc.mode === 'carousel' || this.viewId !== this.human.id) return null;
    if (sc.bottom && sc.bottom.player === this.human) return 'bottom';
    if (sc.top && sc.top.player === this.human) return 'top';
    return null;
  },

  evoFlat(loc, side) {
    if (!loc) return null;
    const top = side === 'top';
    if (loc.zone === 'bench') {
      const sc = slotCenter(loc.i, top);
      return { x: sc.x, y: sc.y + 8 };
    }
    if (loc.zone === 'board') {
      const [r, c] = top ? Hex.mirror(loc.r, loc.c) : [loc.r, loc.c];
      return View.cellCenter(r, c);
    }
    return null;
  },

  evoGhost(inst, star, x, y) {
    const v = View.instanceView(Object.assign({}, inst, { star }), this.human);
    const wrap = document.createElement('div');
    wrap.className = 'evo-ghost';
    const color = View.unitEl({ className: 'unit evo-col', form: v.form, types: v.types, star, cost: v.cost, name: '' });
    const white = View.unitEl({ className: 'unit evo-white', form: v.form, types: v.types, star, cost: v.cost, name: '' });
    for (const u of [color, white]) {
      const st = u._spr;
      if (st) Sprites.face(st, SPRITE_DIR.down);
      if (st) Sprites.setAnim(st, 'idle', { offset: 0 });
      wrap.appendChild(u);
    }
    wrap._white = white;
    wrap._color = color;
    this.evoLayer().appendChild(wrap);
    this.evoPlace(wrap, x, y, 1, 0);
    return wrap;
  },

  evoPlace(g, x, y, scale, white, alpha) {
    placeSprite(g, x, y, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE * scale);
    g.style.zIndex = String(Number(g.style.zIndex) + 5);
    g._white.style.opacity = white.toFixed(3);
    g._color.style.opacity = white >= 0.999 ? '0' : '1';
    g.style.opacity = (alpha === undefined ? 1 : alpha).toFixed(3);
  },

  evoTokens(iid, hide) {
    const layer = this.arena.unitLayer;
    for (const el of layer.children) if (el._inst && el._inst.iid === iid && el._owner === this.human) el.classList.toggle('evo-hide', hide);
  },

  evoStop(a) {
    if (!a) return;
    for (const g of a.ghosts) g.remove();
    if (a.pre) a.pre.remove();
    if (a.post) a.post.remove();
    if (a.flashEl) a.flashEl.remove();
    this.evoTokens(a.iid, false);
  },

  evoStart(list) {
    const last = list[list.length - 1];
    const removed = new Set();
    for (const e of list) for (const id of e.removed || []) removed.add(id);
    for (const a of this.evoAnims || []) {
      if (a.iid === last.iid || removed.has(a.iid)) {
        this.evoStop(a);
        a.dead = true;
      }
    }
    this.evoAnims = (this.evoAnims || []).filter(a => !a.dead);
    const inst = this.human.allUnits().find(u => u.iid === last.iid);
    Sound.sfx(last.star >= 3 ? 'star3' : 'star2');
    const side = this.evoSide();
    if (!inst || !inst.loc || !side) return;
    const to = this.evoFlat(inst.loc, side);
    if (!to) return;
    const srcs = [];
    for (const e of list) for (const s of e.srcs || []) if (!s || s.iid !== last.iid) srcs.push(s);
    const preStar = Math.max(1, last.star - 1);
    const a = { iid: inst.iid, inst, loc: Object.assign({}, inst.loc), t: 0, to, star: last.star, ghosts: [], flies: [], sparkled: false };
    for (const s of srcs) {
      const from = (s && this.evoFlat(s.loc, side)) || { x: to.x, y: to.y + 26 };
      const g = this.evoGhost(inst, preStar, from.x, from.y);
      a.ghosts.push(g);
      a.flies.push(from);
    }
    a.pre = this.evoGhost(inst, preStar, to.x, to.y);
    a.post = this.evoGhost(inst, last.star, to.x, to.y);
    a.post.style.display = 'none';
    this.evoTokens(inst.iid, true);
    this.evoAnims.push(a);
  },

  evoFlash(a) {
    const p = Proj.toScreen(a.to.x, a.to.y);
    const f = document.createElement('div');
    f.className = 'evo-flash' + (a.star >= 3 ? ' big' : '');
    f.style.left = Math.round(p.x) + 'px';
    f.style.top = Math.round(p.y - 22) + 'px';
    this.evoLayer().appendChild(f);
    a.flashEl = f;
    const n = a.star >= 3 ? 14 : 9;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'evo-spark' + (a.star >= 3 ? ' gold' : '');
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 26 + Math.random() * 22;
      s.style.left = Math.round(p.x) + 'px';
      s.style.top = Math.round(p.y - 22) + 'px';
      s.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
      s.style.setProperty('--dy', Math.round(Math.sin(ang) * dist * 0.8) + 'px');
      s.style.animationDelay = (Math.random() * 0.08).toFixed(2) + 's';
      this.evoLayer().appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  },

  evoUpdate(dt) {
    if (this.evoQueue && this.evoQueue.length) {
      const q = this.evoQueue;
      this.evoQueue = [];
      if (!this.replaying) this.evoStart(q);
    }
    if (!this.evoAnims || !this.evoAnims.length) return;
    const ease = x => x * x * (3 - 2 * x);
    for (const a of this.evoAnims) {
      a.t += Math.min(dt, 0.05);
      const l = a.inst.loc;
      const moved = !l || l.zone !== a.loc.zone || l.i !== a.loc.i || l.r !== a.loc.r || l.c !== a.loc.c || !this.evoSide() || a.inst.star !== a.star;
      if (moved || a.t >= EVO.dur) {
        this.evoStop(a);
        a.dead = true;
        continue;
      }
      this.evoTokens(a.iid, true);
      const t = a.t;
      a.ghosts.forEach((g, k) => {
        if (t >= EVO.fly) {
          g.style.display = 'none';
          return;
        }
        const u = ease(Math.min(1, t / EVO.fly));
        const f = a.flies[k];
        const x = f.x + (a.to.x - f.x) * u;
        const y = f.y + (a.to.y - f.y) * u - Math.sin(u * Math.PI) * 18;
        this.evoPlace(g, x, y, 1 - 0.35 * u, Math.min(1, t / 0.18), 1 - Math.max(0, (u - 0.85) / 0.15));
      });
      if (t < EVO.fly) {
        this.evoPlace(a.pre, a.to.x, a.to.y, 1, Math.min(1, t / 0.35));
        a.post.style.display = 'none';
      } else if (t < EVO.swapEnd) {
        const s = (t - EVO.fly) / (EVO.swapEnd - EVO.fly);
        const phase = 2 * Math.PI * (1.2 * s + 5.5 * s * s);
        const showPost = Math.sin(phase) > 0;
        const pulse = 1 + 0.06 * Math.sin(2 * Math.PI * 6 * s) + 0.08 * s;
        a.pre.style.display = showPost ? 'none' : '';
        a.post.style.display = showPost ? '' : 'none';
        this.evoPlace(showPost ? a.post : a.pre, a.to.x, a.to.y, pulse, 1);
      } else {
        if (!a.sparkled) {
          a.sparkled = true;
          a.pre.style.display = 'none';
          a.post.style.display = '';
          this.evoFlash(a);
        }
        const s = Math.min(1, (t - EVO.flash) / (EVO.dur - EVO.flash));
        const pop = 1 + 0.18 * Math.sin(Math.min(1, s * 2) * Math.PI) * (1 - s);
        this.evoPlace(a.post, a.to.x, a.to.y, pop, s < 0.25 ? 1 : 1 - ease((s - 0.25) / 0.75));
      }
    }
    this.evoAnims = this.evoAnims.filter(a => !a.dead);
  },

  evoClear() {
    for (const a of this.evoAnims || []) this.evoStop(a);
    this.evoAnims = [];
    this.evoQueue = [];
  },

  evoHidden(inst, owner) {
    return owner === this.human && !!this.evoAnims && this.evoAnims.some(a => a.iid === inst.iid);
  }
};

Object.assign(App.prototype, EVO_APP);
