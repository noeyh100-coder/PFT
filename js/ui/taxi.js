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

  clear() {
    for (const r of this.rides) r.finish();
    this.rides = [];
    this.timers = [];
    for (const tw of this.tweens) tw.step(1);
    this.tweens = [];
    this.fadeAnim = null;
    this.setFade(0);
    this.layer.querySelectorAll('.boom-orb, .boom-hit, .boom-dmg').forEach(el => el.remove());
  }
}

const TRAVEL_APP = {
  taxiFx() {
    if (!this._taxi) {
      this._taxi = new TaxiFx(this);
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

  taxiDrop(pos, pid, onDone) {
    this.taxiHide.add(pid);
    const r = this.taxiLegs(() => pos, this.taxiSide(pos), 1, () => {
      if (pid === this.human.id) {
        const s = this.driver.strats[pid];
        this.arena.me.place(s.x, s.y);
      }
      this.taxiHide.delete(pid);
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
    this.taxiDrop(HOME_BOTTOM, this.human.id, null);
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
      if (pre && !pre.done) pre.release();
      else {
        const me = this.arena.me;
        this.taxiPickup({ x: me.x, y: me.y }, h.id, () => this.taxiArriveAway());
      }
    } else if (m.a === h && m.b) {
      if (pre) pre.finish();
      const pid = m.b.id;
      this.taxiHide.add(pid);
      fx.after(TAXI_T.land + TAXI_T.wait + TAXI_T.rise + TAXI_T.leave, () => {
        if (this.game.phase === 'combat' || this.driver.state === 'precombat') this.taxiDrop(HOME_TOP, pid, null);
        else this.taxiHide.delete(pid);
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
        this.taxiPickup(() => this.stratFlatPos(h, HOME_BOTTOM), h.id, () => {
          this.tx.returnReady = true;
          this.travelHold = true;
          if (this.tx.afterReturn) {
            const fn = this.tx.afterReturn;
            this.tx.afterReturn = null;
            fn();
          } else if (this.tx.roundWaiting) this.taxiFinishReturn();
        });
      });
    } else if (m.a === h && m.b) {
      const pid = m.b.id;
      fx.after(0.15, () => this.taxiPickup(() => this.stratFlatPos(m.b, HOME_TOP), pid, null));
    }
  },

  taxiFinishReturn() {
    this.tx.returning = false;
    this.tx.returnReady = false;
    this.tx.roundWaiting = false;
    this.travelHold = false;
    this.arenaKey = null;
    this.renderArena();
    if (this.game.phase === 'planning') this.taxiDrop(HOME_BOTTOM, this.human.id, null);
    else this.taxiHide.delete(this.human.id);
  },

  taxiRoundStart() {
    if (!this._taxi) return;
    if (!this.taxiOk()) {
      this.taxiReset();
      return;
    }
    const h = this.human;
    for (const id of Array.from(this.taxiHide)) if (id !== h.id) this.taxiHide.delete(id);
    if (this.game.phase !== 'planning') return;
    if (this.tx.returning) {
      if (this.tx.returnReady) this.taxiFinishReturn();
      else this.tx.roundWaiting = true;
    } else if (this.tx.carouselReturn) {
      this.tx.carouselReturn = false;
      this.taxiHide.add(h.id);
      this.taxiFx().fadeTo(0, 0.3);
      this.taxiDrop(HOME_BOTTOM, h.id, null);
    } else this.taxiHide.delete(h.id);
  },

  taxiCarouselStart() {
    const car = this.game.carousel;
    if (!car || car.encounter || !this.taxiOk()) return false;
    if (this.tx.carouselPending) return true;
    const fx = this.taxiFx();
    this.tx.carouselPending = true;
    this.tx.freezeMe = true;
    this.travelHold = true;
    const h = this.human;
    const go = () => {
      fx.fadeTo(1, 0.3, () => {
        this.travelHold = false;
        this.tx.carouselPending = false;
        this.tx.freezeMe = false;
        this.tx.returning = false;
        this.tx.returnReady = false;
        this.buildCarousel();
        const sc = this.carouselScene;
        if (!sc) {
          fx.fadeTo(0, 0.3);
          return;
        }
        for (const p of car.order) if (p.alive) this.taxiHide.add(p.id);
        fx.fadeTo(0, 0.3);
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
    if (!car || car.encounter || !sc || !this.taxiOk()) return;
    const fx = this.taxiFx();
    this.tx.carouselReturn = true;
    for (const p of car.order) {
      if (!p.alive) continue;
      const sprite = p === this.human ? this.arena.me : sc.sprites[p.id];
      if (!sprite) continue;
      this.taxiSeatRide(p.id, { x: sprite.x, y: sprite.y }, false, () => this.taxiHide.add(p.id));
    }
    fx.after(1.25, () => fx.fadeTo(1, 0.3));
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
