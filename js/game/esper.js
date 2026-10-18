const ESPER_COMPONENT_KIND = { 'muscle-band': 'phys', 'wise-glasses': 'spec', 'protective-pads': 'def', 'x-sp-def': 'def', 'leftovers': 'def' };

function esperItemKind(id) {
  if (ESPER_COMPONENT_KIND[id]) return ESPER_COMPONENT_KIND[id];
  if (typeof BOT_DEF_ITEMS !== 'undefined' && BOT_DEF_ITEMS.has(id)) return 'def';
  if (typeof BOT_PHYS_ITEMS !== 'undefined' && BOT_PHYS_ITEMS.has(id)) return 'phys';
  if (typeof BOT_SPEC_ITEMS !== 'undefined' && BOT_SPEC_ITEMS.has(id)) return 'spec';
  return 'dps';
}

function esperIsTank(u) {
  return /탱커/.test((u.stats && u.stats.role) || '');
}

const ESPER_FX = {
  esperVar(side) {
    const T = this.teams[side];
    return T && T.esp && this.tier(side, '에스퍼') ? T.esp : null;
  },

  ev(side, key) {
    return esperVal(this.side[side].esp, key, this.tier(side, '에스퍼'));
  },

  esperInit(side, units) {
    const v = this.esperVar(side);
    this.side[side].esp = v;
    if (!v) return;
    const val = k => this.ev(side, k);
    for (const u of units) {
      if (!(u.types.includes('에스퍼') || u.mew)) continue;
      u.esper = true;
      if (v === '매직룸') {
        u.rk.spe += val('spe');
        u.roomExtra = val('extra');
      } else if (v === '미러코트') {
        u.rk.spd += val('spd');
        u.mirror = { acc: 0, at: 4 };
      } else if (v === '신통력') {
        u.rk.spa += val('spa');
        u.psyBonus = val('bonus');
        u.psyChance = val('chance');
        u.psyPer = val('per');
        u.psyPerMax = val('perMax');
      } else if (v === '치유소원') {
        u.pct.hp += val('hp');
        u.wish = true;
      } else if (v === '봉인') {
        u.rk.acc += val('acc');
        u.rk.eva += val('acc');
        u.sealKill = val('kill') > 0;
      }
    }
  },

  esperStart() {
    const rooms = [];
    for (const side of ['A', 'B']) {
      if (this.side[side].esp !== '매직룸') continue;
      const foe = this.enemyOf(side);
      const until = this.ev(side, 'perma') ? Infinity : this.time + this.ev(side, 'dur');
      const victims = this.aliveOf(foe).filter(u => u.items && u.items.length);
      rooms.push({ side, until, victims });
      this.emit({ type: 'magicroom', side });
    }
    for (const r of rooms) for (const u of r.victims) this.roomStrip(u, r.until, r.side);
    for (const r of rooms) if (this.ev(r.side, 'steal')) this.roomSteal(r.side, r.victims);
    for (const side of ['A', 'B']) {
      if (this.side[side].esp === '봉인') this.seal(side, this.ev(side, 'count'), this.ev(side, 'start'));
    }
  },

  roomSwap(u, list) {
    const ratio = u.alive && u.maxHp > 0 ? u.hp / u.maxHp : 0;
    this.swapItems(u, list, u.evolvable, true);
    u.hp = u.alive ? Math.min(u.maxHp, Math.max(1, ratio * u.maxHp)) : 0;
  },

  roomStrip(u, until, bySide) {
    const items = u.items.slice();
    const pp = this.itemStatic(items, u.evolvable).pp;
    this.roomSwap(u, []);
    if (!u.experiment) u.mana = Math.max(0, u.mana - pp);
    u.roomItems = items;
    u.roomUntil = until;
    u.roomTaken = [];
    this.emit({ type: 'buff', target: u.uid, kind: 'room' });
  },

  roomSteal(side, victims) {
    const allies = this.aliveOf(side).filter(a => !a.roomItems);
    if (!allies.length) return;
    const add = {};
    const extra = a => add[a.uid] || [];
    for (const v of victims) {
      for (const id of v.roomItems) {
        const kind = esperItemKind(id);
        const fits = a => {
          const tank = esperIsTank(a);
          if (kind === 'def') return tank;
          if (kind === 'phys') return !tank && !a.special;
          if (kind === 'spec') return !tank && a.special;
          return !tank;
        };
        const has = a => a.items.includes(id) || extra(a).includes(id);
        let cand = allies.filter(a => fits(a) && !has(a));
        if (!cand.length) cand = allies.filter(a => !has(a));
        if (!cand.length) continue;
        const cnt = a => a.items.length + extra(a).length;
        const min = Math.min(...cand.map(cnt));
        cand = cand.filter(a => cnt(a) === min);
        const a = cand[Math.floor(this.rng.next() * cand.length)];
        (add[a.uid] = add[a.uid] || []).push(id);
        v.roomTaken.push({ thief: a.uid, id });
      }
    }
    for (const key in add) {
      const a = this.byUid[key];
      a.roomStolen = (a.roomStolen || []).concat(add[key]);
      this.roomSwap(a, a.items.concat(add[key]));
      this.emit({ type: 'buff', target: a.uid, kind: 'steal' });
    }
  },

  roomReturn(u) {
    const items = u.roomItems || [];
    u.roomItems = null;
    for (const e of u.roomTaken || []) {
      const th = this.byUid[e.thief];
      if (!th || !th.roomStolen) continue;
      const i = th.roomStolen.indexOf(e.id);
      if (i < 0) continue;
      th.roomStolen.splice(i, 1);
      const list = th.items.slice();
      const j = list.lastIndexOf(e.id);
      if (j >= 0) list.splice(j, 1);
      this.roomSwap(th, list);
    }
    u.roomTaken = [];
    this.roomSwap(u, items);
  },

  setOwnItems(u, list, evolvable) {
    u.evolvable = evolvable;
    if (u.roomItems) {
      u.roomItems = list.slice();
      return;
    }
    this.swapItems(u, list.concat(u.roomStolen || []), evolvable, true);
  },

  sealTargets(side, n) {
    const foes = this.aliveOf(this.enemyOf(side)).filter(o => !o.hidden);
    const order = (a, b) => (b.cost - a.cost) || (b.star - a.star) || (b.maxHp - a.maxHp) || (a.uid - b.uid);
    const dps = foes.filter(o => !esperIsTank(o)).sort(order);
    const tanks = foes.filter(o => esperIsTank(o)).sort(order);
    return dps.concat(tanks).slice(0, n);
  },

  seal(side, n, dur) {
    const list = this.sealTargets(side, n);
    for (const o of list) {
      const d = this.stun(o, dur, side, 'seal');
      if (d > 0) {
        o.sealedBy = o.sealedBy || {};
        o.sealedBy[side] = true;
      }
    }
  },

  sealCast(u) {
    for (const side in u.sealedBy) {
      if (this.side[side].esp !== '봉인') continue;
      const k = this.ev(side, 'spa');
      if (!k) continue;
      for (const a of this.aliveOf(side)) {
        if (!a.esper) continue;
        a.pct.sa += k;
        a.sealSa += Math.round(k * 100);
      }
    }
  },

  healWish(u) {
    const side = u.side;
    const val = k => this.ev(side, k);
    const R = val('radius');
    const r = u.deathR;
    const c = u.deathC;
    this.emit({ type: 'skillfx', uid: u.uid, r, c, radius: Math.min(R, 6), kind: '에스퍼', heal: true });
    this.emit({ type: 'buff', target: u.uid, kind: 'wish' });
    const allies = this.aliveOf(side).filter(a => a !== u).sort((a, b) => (a.hp / a.maxHp - b.hp / b.maxHp) || (a.uid - b.uid)).slice(0, val('allies'));
    if (allies.length) {
      const each = (u.maxHp * val('heal')) / allies.length;
      const over = val('overflow') > 0;
      for (const a of allies) {
        this.cleanse(a);
        this.healAmt(u, a, each, over);
      }
    }
    const foes = this.aliveOf(this.enemyOf(side)).filter(o => R >= 99 || Hex.dist(r, c, o.r, o.c) <= R);
    const dmg = u.maxHp * val('dmg');
    const vuln = val('vuln');
    for (const o of foes) {
      if (!o.alive) continue;
      this.emit({ type: 'hitfx', target: o.uid, kind: '에스퍼' });
      this.dealDamage(u, o, dmg, { special: true, kind: 'wish' });
      if (vuln && o.alive) {
        o.wishVuln = o.wishVulnUntil > this.time ? Math.max(o.wishVuln, vuln) : vuln;
        o.wishVulnUntil = this.time + 5;
      }
    }
  },

  esperOnKill(t) {
    if (t.wish) this.healWish(t);
    const k = t.killedBy;
    t.killedBy = null;
    if (k && k.esper && k.sealKill && k.side !== t.side && this.side[k.side].esp === '봉인') this.seal(k.side, this.ev(k.side, 'count'), 1);
  },

  esperAfterHit(src, t, o, total) {
    if (!src || src.side === t.side || !t.alive) return;
    if (src.roomExtra && total > 0 && !(t.items && t.items.length)) this.dealDamage(src, t, total * src.roomExtra, { trueDmg: true, kind: 'room' });
    if (!src.psyBonus || !t.alive) return;
    if (t.flinchUntil > this.time) {
      this.emit({ type: 'hitfx', target: t.uid, kind: '에스퍼' });
      this.dealDamage(src, t, this.spaStat(src) * src.psyBonus, { special: true, kind: 'psy' });
    }
    if (o.kind === 'skill' && t.alive) {
      const p = src.psyChance + Math.min(src.psyPerMax, this.spaStat(src) * src.psyPer);
      if (this.rng.next() < p) this.stun(t, 1, src.side, 'flinch');
    }
  },

  mirrorPulse(u) {
    const m = u.mirror;
    m.at += 4;
    const acc = m.acc;
    m.acc = 0;
    if (acc <= 0) return;
    const side = u.side;
    const R = this.ev(side, 'radius');
    const foes = this.units.filter(o => o.alive && o.side !== side && !o.hidden && (R >= 99 || this.distTo(u, o) <= R));
    if (!foes.length) return;
    const lost = this.ev(side, 'lost');
    const total = lost ? acc * lost : this.defense(u, true) * this.ev(side, 'mr');
    const each = total / foes.length;
    const conf = this.ev(side, 'conf');
    this.emit({ type: 'skillfx', uid: u.uid, r: u.r, c: u.c, radius: Math.min(R, 6), kind: '에스퍼' });
    this.emit({ type: 'buff', target: u.uid, kind: 'mirror' });
    for (const o of foes) {
      if (!o.alive) continue;
      this.dealDamage(u, o, each, { special: true, kind: 'mirror' });
      if (conf && o.alive) this.addConfuse(o, conf);
    }
  },

  esperTick() {
    if (!this.esperOn) {
      this.esperOn = true;
      this.esperStart();
    }
    for (const u of this.units) {
      if (u.roomItems && this.time >= u.roomUntil) this.roomReturn(u);
      if (u.mirror && u.alive && this.time >= u.mirror.at) this.mirrorPulse(u);
    }
  }
};

Object.assign(CombatSim.prototype, ESPER_FX);
