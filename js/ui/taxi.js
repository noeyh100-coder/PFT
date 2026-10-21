const TAXI_CAB = {
  side: { src: 'img/dot/ui/taxi-side.png', w: 36, h: 36 },
  front: { src: 'img/dot/ui/taxi-front.png', w: 28, h: 37 }
};
const TAXI_BIRD = { src: 'img/dot/pokemon/Corviknight/Hover.png', fw: 40, fh: 64, frames: 11, sw: 440, sh: 512, footSide: 22, footFront: 20, footY: 35, fps: 18 };
const TAXI_PX = 2;
const TAXI_SCALE = 0.9;
const TAXI_T = { approach: 1.0, land: 0.35, wait: 0.15, rise: 0.35, leave: 0.8 };
const TAXI_LEAD = 1.5;

function taxiEase(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function shownHp(p) {
  const a = typeof window !== 'undefined' ? window.app : null;
  const h = a && a.hpHold ? a.hpHold[p.id] : null;
  return h ? Math.max(0, h.hp) : p.hp;
}

class TaxiRide {
  constructor(fx, start, legs) {
    this.fx = fx;
    this.pos = { x: start.x, y: start.y, alt: start.alt || 0 };
    this.from = Object.assign({}, this.pos);
    this.legs = legs;
    this.i = 0;
    this.t = 0;
    this.anim = 0;
    this.done = false;
    this.el = document.createElement('div');
    this.el.className = 'taxi';
    this.body = document.createElement('div');
    this.body.className = 'taxi-body';
    this.cab = document.createElement('i');
    this.cab.className = 'taxi-cab';
    this.bird = document.createElement('i');
    this.bird.className = 'taxi-bird';
    this.body.appendChild(this.cab);
    this.body.appendChild(this.bird);
    this.el.appendChild(this.body);
    this.shadow = document.createElement('div');
    this.shadow.className = 'taxi-shadow';
    fx.layer.appendChild(this.shadow);
    fx.layer.appendChild(this.el);
    this.setLook(start.view || 'side', start.face || 'right');
    this.apply();
  }

  setLook(view, face) {
    if (this.view === view && this.face === face) return;
    this.view = view;
    this.face = face;
    const c = TAXI_CAB[view];
    const P = TAXI_PX;
    const W = Math.max(c.w, TAXI_BIRD.fw) * P;
    const by = TAXI_BIRD.footY * P;
    const H = c.h * P + by;
    this.W = W;
    this.H = H;
    this.el.style.width = W + 'px';
    this.el.style.height = H + 'px';
    this.body.style.width = W + 'px';
    this.body.style.height = H + 'px';
    this.body.style.transform = view === 'side' && face === 'right' ? 'scaleX(-1)' : '';
    const cs = this.cab.style;
    cs.left = (W - c.w * P) / 2 + 'px';
    cs.top = by + 'px';
    cs.width = c.w * P + 'px';
    cs.height = c.h * P + 'px';
    cs.backgroundImage = 'url("' + c.src + '")';
    const foot = (view === 'front' ? TAXI_BIRD.footFront : TAXI_BIRD.footSide) * P;
    const bs = this.bird.style;
    bs.left = W / 2 - foot + 'px';
    bs.top = '0px';
    bs.width = TAXI_BIRD.fw * P + 'px';
    bs.height = TAXI_BIRD.fh * P + 'px';
    bs.backgroundImage = 'url("' + TAXI_BIRD.src + '")';
    bs.backgroundSize = TAXI_BIRD.sw * P + 'px ' + TAXI_BIRD.sh * P + 'px';
    this.row = view === 'front' ? 0 : 6;
    this.paintBird();
  }

  paintBird() {
    const f = Math.floor(this.anim * TAXI_BIRD.fps) % TAXI_BIRD.frames;
    this.bird.style.backgroundPosition = -f * TAXI_BIRD.fw * TAXI_PX + 'px ' + -this.row * TAXI_BIRD.fh * TAXI_PX + 'px';
  }

  apply() {
    const p = this.pos;
    const g = Proj.toScreen(p.x, p.y);
    const s = Proj.depthScale(p.y) * TAXI_SCALE;
    this.el.style.left = Math.round(g.x) + 'px';
    this.el.style.top = Math.round(g.y - p.alt) + 'px';
    this.el.style.transformOrigin = this.W / 2 + 'px ' + this.H + 'px';
    this.el.style.transform = 'translate(' + -this.W / 2 + 'px, ' + -this.H + 'px) scale(' + s.toFixed(3) + ')';
    this.el.style.zIndex = String(140 + Math.round(g.y));
    const sh = this.shadow.style;
    sh.left = Math.round(g.x) + 'px';
    sh.top = Math.round(g.y) + 'px';
    sh.width = Math.round(46 * s) + 'px';
    sh.height = Math.round(12 * s) + 'px';
    sh.opacity = Math.max(0, 0.45 - p.alt / 500).toFixed(2);
    sh.zIndex = String(99 + Math.round(g.y));
  }

  update(dt) {
    if (this.done) return;
    this.anim += dt;
    this.paintBird();
    let left = dt;
    while (left > 0 && this.i < this.legs.length) {
      const leg = this.legs[this.i];
      if (this.t === 0 && (leg.view || leg.face)) this.setLook(leg.view || this.view, leg.face || this.face);
      if (leg.hold) {
        if (!this.released) {
          const at = leg.to();
          const k = Math.min(1, dt * 10);
          this.pos.x += (at.x - this.pos.x) * k;
          this.pos.y += (at.y - this.pos.y) * k;
          this.pos.alt += ((at.alt != null ? at.alt : this.pos.alt) - this.pos.alt) * k;
          left = 0;
          break;
        }
        this.from = Object.assign({}, this.pos);
        this.i += 1;
        this.t = 0;
        continue;
      }
      const dur = Math.max(0.001, leg.dur);
      const use = Math.min(left, dur - this.t);
      this.t += use;
      left -= use;
      const k = taxiEase(Math.min(1, this.t / dur));
      const to = typeof leg.to === 'function' ? leg.to() : leg.to || this.from;
      this.pos.x = this.from.x + (to.x - this.from.x) * k;
      this.pos.y = this.from.y + (to.y - this.from.y) * k;
      this.pos.alt = this.from.alt + ((to.alt != null ? to.alt : this.from.alt) - this.from.alt) * k;
      if (this.t >= dur - 1e-6) {
        this.from = Object.assign({}, this.pos);
        this.i += 1;
        this.t = 0;
        if (leg.then) leg.then();
      }
    }
    this.apply();
    if (this.i >= this.legs.length) this.finish();
  }

  release() {
    this.released = true;
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.el.remove();
    this.shadow.remove();
  }
}

class TaxiFx {
  constructor(app) {
    this.app = app;
    this.layer = document.getElementById('strat-layer');
    this.rides = [];
    this.timers = [];
    this.tweens = [];
    this.fadeEl = document.createElement('div');
    this.fadeEl.id = 'taxi-fade';
    document.getElementById('arena').appendChild(this.fadeEl);
    this.fadeVal = 0;
    this.fadeAnim = null;
  }

  ride(start, legs) {
    const r = new TaxiRide(this, start, legs);
    this.rides.push(r);
    return r;
  }

  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  }

  tween(dur, step, done) {
    this.tweens.push({ t: 0, dur, step, done });
  }

  fadeTo(v, dur, done) {
    this.fadeAnim = { from: this.fadeVal, to: v, t: 0, dur, done };
  }

  setFade(v) {
    this.fadeVal = v;
    this.fadeEl.style.opacity = v.toFixed(3);
    this.fadeEl.style.display = v > 0.001 ? 'block' : 'none';
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    for (const r of this.rides) r.update(dt);
    this.rides = this.rides.filter(r => !r.done);
    if (this.timers.length) {
      const due = [];
      for (const t of this.timers) {
        t.t -= dt;
        if (t.t <= 0) due.push(t);
      }
      if (due.length) {
        this.timers = this.timers.filter(t => !due.includes(t));
        for (const t of due) t.fn();
      }
    }
    if (this.tweens.length) {
      const fin = [];
      for (const tw of this.tweens) {
        tw.t += dt;
        const k = Math.min(1, tw.t / tw.dur);
        tw.step(k);
        if (k >= 1) fin.push(tw);
      }
      if (fin.length) {
        this.tweens = this.tweens.filter(t => !fin.includes(t));
        for (const tw of fin) if (tw.done) tw.done();
      }
    }
    if (this.fadeAnim) {
      const f = this.fadeAnim;
      f.t += dt;
      const k = Math.min(1, f.t / Math.max(0.001, f.dur));
      this.setFade(f.from + (f.to - f.from) * k);
      if (k >= 1) {
        this.fadeAnim = null;
        if (f.done) f.done();
      }
    }
  }

  camera(focus, u, zoom) {
    const root = this.app.arena.root;
    if (!focus || u <= 0.001) {
      root.style.transform = '';
      root.style.transformOrigin = '';
      return;
    }
    const sc = 1 + u * (zoom - 1);
    let tx = focus.x + u * (640 - focus.x);
    let ty = focus.y + u * (360 - focus.y);
    tx = Math.min(sc * focus.x, Math.max(1280 - sc * (1280 - focus.x), tx));
    ty = Math.min(sc * focus.y, Math.max(720 - sc * (720 - focus.y), ty));
    root.style.transformOrigin = focus.x + 'px ' + focus.y + 'px';
    root.style.transform = 'translate(' + (tx - focus.x).toFixed(1) + 'px, ' + (ty - focus.y).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
  }

  clear() {
    this.camera(null, 0);
    for (const r of this.rides) r.finish();
    this.rides = [];
    this.timers = [];
    for (const tw of this.tweens) tw.step(1);
    this.tweens = [];
    this.fadeAnim = null;
    this.setFade(0);
    this.layer.querySelectorAll('.boom-orb, .boom-hit, .boom-dmg, .ball-fly, .ball-pop').forEach(el => el.remove());
  }
}

const TRAVEL_APP = {
  taxiFx() {
    if (!this._taxi) {
      this._taxi = new TaxiFx(this);
      this.ballHide = new Set();
      this.ballShown = new Set();
      this.taxiHide = new Set();
      this.tx = {};
      this.hpHold = {};
    }
    return this._taxi;
  },

  taxiOk() {
    return !this.replaying && this.human && this.human.alive && this.game.phase !== 'over';
  },

  taxiReset() {
    this.taxiFx().clear();
    this.taxiHide.clear();
    this.tx = {};
    this.hpHold = {};
    this.travelHold = false;
    this.holdScene = false;
    if (this.curtainQ && this.curtainQ.length) {
      const q = this.curtainQ;
      this.curtainQ = [];
      for (const f of q) f();
    }
    this.ballReset();
    const card = this.$('enc-card');
    if (card) card.classList.remove('enc-fade');
  },

  ballReset() {
    const had = this.ballHide && this.ballHide.size;
    this.ballHide = new Set();
    this.ballShown = new Set();
    if (had && this.arena) this.arena.unitLayer.querySelectorAll('.ball-hidden, .ball-recall, .ball-out').forEach(el => el.classList.remove('ball-hidden', 'ball-recall', 'ball-out'));
  },

  ballKey(el) {
    if (el._cu) return 'u' + el._cu.uid;
    if (el._inst) return 'i' + el._inst.iid;
    return null;
  },

  fieldEls(pid) {
    const p = this.game.players[pid];
    const sc = this.curScene;
    let side = null;
    if (sc && sc.mode === 'combat' && sc.match) side = sc.match.a === p ? 'A' : sc.match.b === p ? 'B' : null;
    const out = [];
    for (const el of this.arena.unitLayer.children) {
      if (!el.classList || !el.classList.contains('unit')) continue;
      if (el.classList.contains('bench-top') || el.classList.contains('bench-bottom')) continue;
      if (el._cu) {
        if (side && el._cu.side === side && el._cu.alive && !el._cu.creep) out.push(el);
      } else if (el._inst && el._owner === p && el._inst.loc && el._inst.loc.zone === 'board') out.push(el);
    }
    return out;
  },

  applyBallHide() {
    if (!this.ballHide || !this.ballHide.size) return;
    for (const pid of this.ballHide) {
      for (const el of this.fieldEls(pid)) el.classList.toggle('ball-hidden', !this.ballShown.has(this.ballKey(el)));
    }
  },

  stratScreen(pid) {
    const a = this.arena;
    const sp = pid === this.human.id ? a.me : a.others[pid];
    const f = sp ? { x: sp.x, y: sp.y } : pid === this.human.id ? HOME_BOTTOM : HOME_TOP;
    const s = Proj.toScreen(f.x, f.y);
    return { x: s.x, y: s.y - 34 };
  },

  elScreen(el) {
    return { x: parseFloat(el.style.left) || 0, y: (parseFloat(el.style.top) || 0) - 20 };
  },

  ballFly(from, to, dur, done) {
    const fx = this.taxiFx();
    const el = document.createElement('div');
    el.className = 'ball-fly';
    el.style.zIndex = '2003';
    fx.layer.appendChild(el);
    const arc = 26 + Math.hypot(to.x - from.x, to.y - from.y) * 0.18;
    fx.tween(dur, k => {
      const x = from.x + (to.x - from.x) * k;
      const y = from.y + (to.y - from.y) * k - Math.sin(Math.PI * k) * arc;
      el.style.left = Math.round(x - 9) + 'px';
      el.style.top = Math.round(y - 9) + 'px';
      el.style.transform = 'rotate(' + Math.round(k * 540) + 'deg)';
    }, () => {
      el.remove();
      if (done) done();
    });
  },

  ballPop(at, red) {
    const fx = this.taxiFx();
    const el = document.createElement('div');
    el.className = 'ball-pop' + (red ? ' red' : '');
    el.style.left = Math.round(at.x) + 'px';
    el.style.top = Math.round(at.y) + 'px';
    el.style.zIndex = '2002';
    fx.layer.appendChild(el);
    fx.after(0.4, () => el.remove());
  },

  ballRecall(pid) {
    const fx = this.taxiFx();
    const els = this.fieldEls(pid);
    for (const el of els) this.ballShown.add(this.ballKey(el));
    this.ballHide.add(pid);
    const to = this.stratScreen(pid);
    els.forEach((el, i) => {
      fx.after(i * 0.04, () => {
        const k = this.ballKey(el);
        const at = this.elScreen(el);
        el.classList.add('ball-recall');
        this.ballPop(at, true);
        fx.after(0.3, () => {
          this.ballShown.delete(k);
          el.classList.remove('ball-recall');
          this.applyBallHide();
          this.ballFly(at, to, 0.32, null);
        });
      });
    });
  },

  ballThrow(pid, done) {
    const fx = this.taxiFx();
    const els = this.fieldEls(pid);
    const from = this.stratScreen(pid);
    const finish = () => {
      if (!this.ballHide.has(pid)) return;
      this.ballHide.delete(pid);
      for (const el of this.fieldEls(pid)) {
        this.ballShown.delete(this.ballKey(el));
        el.classList.remove('ball-hidden');
      }
      if (done) done();
    };
    if (!els.length) {
      finish();
      return;
    }
    els.forEach((el, i) => {
      fx.after(i * 0.06, () => {
        const k = this.ballKey(el);
        const at = this.elScreen(el);
        this.ballFly(from, at, 0.34, () => {
          this.ballShown.add(k);
          const cur = this.fieldEls(pid).find(e => this.ballKey(e) === k) || el;
          cur.classList.remove('ball-hidden');
          cur.classList.add('ball-out');
          this.ballPop(at, false);
          fx.after(0.32, () => cur.classList.remove('ball-out'));
        });
      });
    });
    fx.after(els.length * 0.06 + 0.42, finish);
  },

  isTaxiHidden(pid) {
    return !!this.taxiHide && this.taxiHide.has(pid);
  },

  applyTaxiVis(sprite, pid) {
    if (!sprite || !sprite.el) return;
    const v = this.isTaxiHidden(pid) ? 'hidden' : '';
    if (sprite.el.style.visibility !== v) sprite.el.style.visibility = v;
  },

  taxiSide(pos) {
    const c = Proj.toScreen(ARENA_W / 2, ARENA_H / 2);
    return Proj.toScreen(pos.x, pos.y).x < c.x ? -1 : 1;
  },

  taxiLegs(get, dir, q, onLand, onGone, hold) {
    const T = TAXI_T;
    const at = alt => () => {
      const p = get();
      return { x: p.x, y: p.y, alt };
    };
    const legs = [{ to: at(55), dur: T.approach * q }];
    if (hold) legs.push({ hold: true, to: at(55) });
    legs.push(
      { to: at(6), dur: T.land, then: onLand },
      { dur: T.wait },
      { to: at(70), dur: T.rise, face: dir < 0 ? 'left' : 'right' },
      { to: () => { const p = get(); return { x: p.x + dir * 440, y: p.y - 40, alt: 240 }; }, dur: T.leave * q, then: onGone }
    );
    const p = get();
    return { start: { x: p.x + dir * 400, y: p.y - 40, alt: 230, view: 'side', face: dir < 0 ? 'right' : 'left' }, legs };
  },

  taxiPickup(pos, pid, onGone, quick, hold) {
    const get = typeof pos === 'function' ? pos : () => pos;
    const r = this.taxiLegs(get, this.taxiSide(get()), quick ? 0.8 : 1, () => this.taxiHide.add(pid), onGone, hold);
    return this.taxiFx().ride(r.start, r.legs);
  },

  taxiDrop(pos, pid, onDone, onLand) {
    this.taxiHide.add(pid);
    const r = this.taxiLegs(() => pos, this.taxiSide(pos), 1, () => {
      if (pid === this.human.id) {
        const s = this.driver.strats[pid];
        this.arena.me.place(s.x, s.y);
      }
      this.taxiHide.delete(pid);
      if (onLand) this.taxiFx().after(0.12, onLand);
    }, onDone);
    return this.taxiFx().ride(r.start, r.legs);
  },

  awayPair() {
    const h = this.human;
    if (!h || this.game.roundInfo().type !== 'pvp') return null;
    return this.game.pairings.find(pr => pr[1] === h && !pr[2]) || null;
  },

  taxiPlanTick() {
    if (!this._taxi || this.tx.preRide || !this.taxiOk()) return;
    const d = this.driver;
    if (d.state !== 'planning' || this.game.phase !== 'planning' || d.timeLeft > TAXI_LEAD) return;
    if (this.viewId !== this.human.id || this.carouselScene || this.isTaxiHidden(this.human.id)) return;
    if (!this.awayPair()) return;
    const me = this.arena.me;
    if (me.el.style.display === 'none') return;
    this.tx.preRide = this.taxiPickup(() => ({ x: me.x, y: me.y }), this.human.id, () => this.taxiArriveAway(), false, true);
  },

  taxiArriveAway() {
    this.travelHold = false;
    this.tx.freezeMe = false;
    this.arenaKey = null;
    this.renderArena();
    const s = this.driver.strats[this.human.id];
    this.arena.me.place(s.x, s.y);
    this.taxiDrop(HOME_BOTTOM, this.human.id, null, () => this.ballThrow(this.human.id));
  },

  taxiSeatRide(pid, sp, arrive, onEvent) {
    const n = this.game.players.length;
    const a = Math.PI / 2 + (pid * Math.PI * 2) / n;
    const out = { x: sp.x + Math.cos(a) * 420, y: sp.y + Math.sin(a) * 420, alt: 220 };
    const side = Math.abs(Math.cos(a)) > 0.6;
    const inFace = -Math.cos(a) < 0 ? 'left' : 'right';
    const outFace = inFace === 'left' ? 'right' : 'left';
    const view = side ? 'side' : 'front';
    const fx = this.taxiFx();
    const start = arrive ? Object.assign({ view, face: inFace }, out) : { x: sp.x + Math.cos(a) * 300, y: sp.y + Math.sin(a) * 300, alt: 200, view, face: inFace };
    fx.ride(start, [
      { to: { x: sp.x, y: sp.y, alt: 55 }, dur: arrive ? 1.15 : 0.7 },
      { to: { x: sp.x, y: sp.y, alt: 6 }, dur: 0.26, then: onEvent },
      { dur: 0.12 },
      { to: { x: sp.x, y: sp.y, alt: 70 }, dur: 0.28, face: outFace },
      { to: out, dur: 0.6 }
    ]);
  },

  stratFlatPos(player, fallback) {
    const a = this.arena;
    if (player === this.human) return { x: a.me.x, y: a.me.y };
    const sp = a.others[player.id];
    if (sp) return { x: sp.x, y: sp.y };
    return { x: fallback.x, y: fallback.y };
  },

  taxiCombatStart(e) {
    const pre = this.tx && this.tx.preRide;
    if (this.tx) this.tx.preRide = null;
    if (!this.taxiOk() || !e || !(e.pre > 0)) {
      if (pre) pre.finish();
      return;
    }
    const h = this.human;
    const m = this.game.matchFor(h);
    if (!m || m.kind !== 'pvp' || m.ghost) {
      if (pre) pre.finish();
      return;
    }
    const fx = this.taxiFx();
    if (m.b === h) {
      if (this.viewId !== h.id) {
        if (pre) pre.finish();
        return;
      }
      this.travelHold = true;
      this.tx.freezeMe = true;
      this.ballRecall(h.id);
      if (pre && !pre.done) fx.after(0.55, () => pre.release());
      else {
        const me = this.arena.me;
        this.taxiPickup({ x: me.x, y: me.y }, h.id, () => this.taxiArriveAway());
      }
    } else if (m.a === h && m.b) {
      if (pre) pre.finish();
      const pid = m.b.id;
      this.taxiHide.add(pid);
      this.ballHide.add(pid);
      this.applyBallHide();
      fx.after(0.55 + TAXI_T.land + TAXI_T.wait + TAXI_T.rise + TAXI_T.leave, () => {
        if (this.game.phase === 'combat' || this.driver.state === 'precombat') this.taxiDrop(HOME_TOP, pid, null, () => this.ballThrow(pid));
        else {
          this.taxiHide.delete(pid);
          this.ballHide.delete(pid);
          this.applyBallHide();
        }
      });
    }
  },

  taxiCombatEnd() {
    if (!this.taxiOk()) return;
    const fx = this.taxiFx();
    this.boomFx();
    const h = this.human;
    const m = this.game.matchFor(h);
    if (!m || m.kind !== 'pvp' || m.ghost) return;
    if (m.b === h) {
      this.tx.returning = true;
      fx.after(0.15, () => {
        if (!this.tx.returning) return;
        const ride = this.taxiPickup(() => this.stratFlatPos(h, HOME_BOTTOM), h.id, () => {
          this.tx.returnReady = true;
          this.travelHold = true;
          if (this.tx.afterReturn) {
            const fn = this.tx.afterReturn;
            this.tx.afterReturn = null;
            fn();
          } else if (this.tx.roundWaiting) this.taxiFinishReturn();
        }, false, true);
        fx.after(0.55, () => this.ballRecall(h.id));
        fx.after(1.1, () => ride.release());
      });
    } else if (m.a === h && m.b) {
      const pid = m.b.id;
      fx.after(0.15, () => {
        const ride = this.taxiPickup(() => this.stratFlatPos(m.b, HOME_TOP), pid, null, false, true);
        fx.after(0.55, () => this.ballRecall(pid));
        fx.after(1.1, () => ride.release());
      });
    }
  },

  taxiFinishReturn() {
    this.tx.returning = false;
    this.tx.returnReady = false;
    this.tx.roundWaiting = false;
    this.travelHold = false;
    this.arenaKey = null;
    this.renderArena();
    if (this.game.phase === 'planning') this.taxiDrop(HOME_BOTTOM, this.human.id, null, () => this.ballThrow(this.human.id));
    else {
      this.taxiHide.delete(this.human.id);
      this.ballHide.delete(this.human.id);
      this.applyBallHide();
    }
  },

  taxiRoundStart() {
    if (!this._taxi) return;
    if (!this.taxiOk()) {
      this.taxiReset();
      return;
    }
    const h = this.human;
    for (const id of Array.from(this.taxiHide)) if (id !== h.id) this.taxiHide.delete(id);
    for (const id of Array.from(this.ballHide)) if (id !== h.id) this.ballHide.delete(id);
    if (this.game.phase !== 'planning') return;
    if (this.tx.returning) {
      if (this.tx.returnReady) this.taxiFinishReturn();
      else this.tx.roundWaiting = true;
    } else if (this.tx.carouselReturn) {
      this.tx.carouselReturn = false;
      this.taxiHide.add(h.id);
      this.taxiFx().fadeTo(0, 0.5);
      this.taxiDrop(HOME_BOTTOM, h.id, null, this.ballHide.has(h.id) ? () => this.ballThrow(h.id) : null);
    } else {
      this.taxiHide.delete(h.id);
      if (this.ballHide.has(h.id)) this.ballThrow(h.id);
    }
  },

  taxiEncounterStart() {
    const fx = this.taxiFx();
    const car = this.game.carousel;
    fx.setFade(1);
    this.buildCarousel();
    const sc = this.carouselScene;
    const card = this.$('enc-card');
    card.classList.remove('show', 'enc-fade');
    if (!sc) {
      fx.fadeTo(0, 0.5);
      return true;
    }
    const h = this.human;
    for (const p of car.order) if (p.alive) this.taxiHide.add(p.id);
    const mine = sc.spawn[h.id];
    const g = Proj.toScreen(mine.x, mine.y);
    const focus = { x: g.x, y: g.y - 40 };
    fx.camera(focus, 1, 2);
    fx.after(0.4, () => fx.fadeTo(0, 0.6));
    let k = 0;
    for (const p of car.order) {
      if (!p.alive) continue;
      const sp = sc.spawn[p.id];
      const isMe = p === h;
      const ride = () => {
        if (this.carouselScene !== sc) {
          this.taxiHide.delete(p.id);
          return;
        }
        this.taxiSeatRide(p.id, sp, true, () => {
          this.taxiHide.delete(p.id);
          if (!isMe) return;
          fx.tween(2, t => fx.camera(focus, 1 - t * t * (3 - 2 * t), 2), () => {
            fx.camera(null, 0);
            if (this.carouselScene === sc) card.classList.add('show', 'enc-fade');
          });
        });
      };
      if (isMe) ride();
      else fx.after(0.95 + 0.12 * k++, ride);
    }
    return true;
  },

  taxiCarouselStart() {
    const car = this.game.carousel;
    if (!car || !this.taxiOk()) return false;
    if (car.encounter) return this.taxiEncounterStart();
    if (this.tx.carouselPending) return true;
    const fx = this.taxiFx();
    this.tx.carouselPending = true;
    this.tx.freezeMe = true;
    this.travelHold = true;
    this.holdScene = true;
    const h = this.human;
    const go = () => {
      fx.fadeTo(1, 0.5, () => {
        this.holdScene = false;
        this.travelHold = false;
        this.tx.carouselPending = false;
        this.tx.freezeMe = false;
        this.tx.returning = false;
        this.tx.returnReady = false;
        this.buildCarousel();
        const sc = this.carouselScene;
        if (!sc) {
          fx.fadeTo(0, 0.5);
          return;
        }
        for (const p of car.order) if (p.alive) this.taxiHide.add(p.id);
        fx.fadeTo(0, 0.5);
        for (const p of car.order) {
          if (!p.alive) continue;
          const sp = sc.spawn[p.id];
          this.taxiSeatRide(p.id, sp, true, () => this.taxiHide.delete(p.id));
        }
      });
    };
    if (this.tx.returning) {
      if (this.tx.returnReady) go();
      else this.tx.afterReturn = go;
    } else if (this.viewId === h.id && this.arena.me.el.style.display !== 'none' && !this.isTaxiHidden(h.id)) {
      this.taxiPickup({ x: this.arena.me.x, y: this.arena.me.y }, h.id, go, true);
    } else go();
    return true;
  },

  taxiCarouselDone() {
    const car = this.game.carousel;
    const sc = this.carouselScene;
    if (!car || !sc || !this.taxiOk()) return;
    const fx = this.taxiFx();
    this.tx.carouselReturn = true;
    for (const p of car.order) {
      if (!p.alive) continue;
      const sprite = p === this.human ? this.arena.me : sc.sprites[p.id];
      if (!sprite) continue;
      this.taxiSeatRide(p.id, { x: sprite.x, y: sprite.y }, false, () => this.taxiHide.add(p.id));
    }
    fx.after(1.0, () => fx.fadeTo(1, 0.5));
  },

  boomFx() {
    const g = this.game;
    const fx = this.taxiFx();
    this.hpHold = {};
    for (const p of g.players) if (p.lastDamage > 0) this.hpHold[p.id] = { hp: p.hp + p.lastDamage };
    const release = pid => {
      if (pid === undefined) this.hpHold = {};
      else delete this.hpHold[pid];
      this.arena.refreshSprites();
      if (this.rightMode === 'players') this.renderHud();
    };
    fx.after(1.05, () => release());
    const sc = this.curScene;
    if (!sc || sc.mode !== 'combat' || !sc.match) return;
    const roles = [[sc.top, HOME_TOP], [sc.bottom, HOME_BOTTOM]];
    const posOf = (role, home) => {
      if (role && role.player && !role.ghost) return this.stratFlatPos(role.player, home);
      return { x: home.x, y: home.y };
    };
    roles.forEach(([role, home], i) => {
      if (!role || !role.player || role.ghost) return;
      const p = role.player;
      if (!(p.lastDamage > 0) || p.lastResult === 'win') return;
      const [orole, ohome] = roles[1 - i];
      const from = posOf(orole, ohome);
      const to = posOf(role, home);
      this.boomShot(from, to, p.lastDamage, () => {
        release(p.id);
        this.boomHit(to, p);
      });
    });
  },

  boomShot(from, to, dmg, onHit) {
    const fx = this.taxiFx();
    const a = Proj.toScreen(from.x, from.y);
    const b = Proj.toScreen(to.x, to.y);
    const el = document.createElement('div');
    el.className = 'boom-orb';
    const size = Math.round(Math.min(34, 12 + dmg * 0.9));
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.zIndex = '2000';
    fx.layer.appendChild(el);
    const lift = 34;
    const arc = 70 + Math.hypot(b.x - a.x, b.y - a.y) * 0.12;
    fx.tween(0.85, k => {
      const e = k * k * (3 - 2 * k);
      const x = a.x + (b.x - a.x) * e;
      const y = a.y - lift + (b.y - a.y) * e - Math.sin(Math.PI * e) * arc;
      el.style.left = Math.round(x - size / 2) + 'px';
      el.style.top = Math.round(y - size / 2) + 'px';
    }, () => {
      el.remove();
      if (onHit) onHit();
    });
  },

  boomHit(pos, player) {
    const fx = this.taxiFx();
    const s = Proj.toScreen(pos.x, pos.y);
    const hit = document.createElement('div');
    hit.className = 'boom-hit';
    hit.style.left = Math.round(s.x) + 'px';
    hit.style.top = Math.round(s.y - 34) + 'px';
    hit.style.zIndex = '2001';
    fx.layer.appendChild(hit);
    const num = document.createElement('div');
    num.className = 'boom-dmg';
    num.textContent = '-' + player.lastDamage;
    num.style.left = Math.round(s.x) + 'px';
    num.style.top = Math.round(s.y - 62) + 'px';
    num.style.zIndex = '2002';
    fx.layer.appendChild(num);
    const sprite = player === this.human ? this.arena.me : this.arena.others[player.id];
    if (sprite && sprite.el) {
      sprite.el.classList.remove('boom-shake');
      void sprite.el.offsetWidth;
      sprite.el.classList.add('boom-shake');
      fx.after(0.5, () => sprite.el && sprite.el.classList.remove('boom-shake'));
    }
    fx.after(0.5, () => hit.remove());
    fx.after(0.9, () => num.remove());
  }
};

Object.assign(App.prototype, TRAVEL_APP);
