const ITEM_RANK_KEYS = ['atk', 'spa', 'def', 'spd', 'spe', 'crit'];
const ITEM_AURA = ['full-incense', 'lax-incense', 'flame-orb'];
const TR_SWORD_THR = [0, 0.1, 0.12, 0.15];
const TR_SWORD_BONUS = [0, 0, 0.1, 0.15];
const TR_SHIELD_FIRST = [0, 0.25, 0.5, 0.7];
const TR_SHIELD_EVERY = [0, 0.1, 0.1, 0.15];
const TR_GRIS_STACK = [0, 3, 5, 10];
const TR_GRIS_PCT = [0, 0.5, 0.75, 0.9];
const TR_LIFE_DUR = [0, 5, 7, 10];
const TR_LIFE_SHIELD = [0, 5, 10, 15];
const TR_RED_DMG = [0, 150, 250, 300];
const TR_BLUE_BASIC = [0, 1, 2, 3];
const TR_BLUE_CAST = [0, 2, 3, 5];
const TR_BLUE_SA = [0, 0.05, 0.07, 0.1];

function treasureCounts(it, base) {
  return [0, it[base + '-1'] || 0, it[base + '-2'] || 0, it[base + '-3'] || 0];
}

function treasureTop(n) {
  return n[3] ? 3 : n[2] ? 2 : n[1] ? 1 : 0;
}

function treasureSum(n, table) {
  return n[1] * table[1] + n[2] * table[2] + n[3] * table[3];
}

const ITEM_FX = {
  itemStatic(items, evolvable) {
    const it = {};
    for (const id of items) it[id] = (it[id] || 0) + 1;
    const n = id => it[id] || 0;
    const S = { it, rk: { atk: 0, spa: 0, def: 0, spd: 0, spe: 0, crit: 0 }, hp: 0, pp: 0, pa: 0, sa: 0, hpPct: 0, vamp: 0, range: 0 };
    for (const id of items) {
      const st = itemDef(id).stats || {};
      for (const k of ITEM_RANK_KEYS) if (st[k]) S.rk[k] += st[k];
      if (st.hp) S.hp += st.hp;
      if (st.pp) S.pp += st.pp;
    }
    S.evo = !!(evolvable && n('eviolite'));
    S.pa = 0.3 * n('choice-band');
    S.sa = 0.25 * n('choice-specs');
    S.vamp = 0.4 * n('shell-bell');
    S.hpPct = 0.2 * n('big-root');
    S.range = n('zoom-lens');
    S.herb = n('mental-herb') > 0;
    S.critPa = n('punching-glove');
    S.critSa = n('black-glasses');
    S.alwaysCrit = n('scope-lens') > 0;
    S.critGuard = n('shell-armor') > 0;
    S.cloak = n('covert-cloak') > 0;
    S.sash = n('focus-sash') > 0;
    S.wp = n('weakness-policy') > 0;
    S.aura = ITEM_AURA.some(id => n(id));
    S.shield = treasureTop(treasureCounts(it, 'rusted-shield')) > 0;
    S.life = treasureTop(treasureCounts(it, 'life-orb'));
    return S;
  },

  applyItems(u, spec) {
    u.items = [];
    u.it = {};
    u.itemPP = 0;
    u.itemTick = { regen: 0, dew: 0, vest: 0, aura: 0, bulb: 0, shield: 0 };
    u.boostStacks = 0;
    u.kingN = 0;
    u.dewPct = 0;
    u.scarfPct = 0;
    u.vestRanks = 0;
    u.bulbPct = 0;
    u.trShieldReady = false;
    u.trShieldOn = false;
    u.grisStacks = 0;
    u.grisCd = 0;
    u.grisCd2 = 0;
    u.orbDur = 0;
    u.orbShieldDur = 0;
    u.orbDone = false;
    u.orbQ = [];
    u.redHits = 0;
    u.redAs = 0;
    u.blueSa = 0;
    const list = (spec.items || []).filter(id => id !== 'magnet' && typeof itemDef === 'function' && itemDef(id) && !isConsumable(id));
    this.swapItems(u, list, !!spec.evolvable, false);
    u.itemPP = this.itemStatic(list, !!spec.evolvable).pp;
  },

  swapItems(u, items, evolvable, live) {
    const A = this.itemStatic(u.items, evolvable);
    const B = this.itemStatic(items, evolvable);
    const hpBefore = u.base.hp * (1 + u.pct.hp) + u.flatHp;
    if (A.evo !== B.evo) {
      const f = B.evo ? 1.2 : 1 / 1.2;
      for (const k of ['hp', 'pa', 'sa', 'armor', 'mr']) u.base[k] = Math.round(u.base[k] * f);
    }
    for (const k of ITEM_RANK_KEYS) u.rk[k] += B.rk[k] - A.rk[k];
    u.flatHp += B.hp - A.hp;
    u.pct.pa += B.pa - A.pa;
    u.pct.sa += B.sa - A.sa;
    u.pct.hp += B.hpPct - A.hpPct;
    u.vamp += B.vamp - A.vamp;
    if (B.range !== A.range) {
      u.range += B.range - A.range;
      u.ranged = u.range > 1;
    }
    if (B.herb && !A.herb) {
      u.ccImmuneUntil = Math.max(u.ccImmuneUntil, 18);
      u.herbGuard = true;
    } else if (!B.herb) u.herbGuard = false;
    u.skillCritPa = B.critPa;
    u.skillCritSa = B.critSa;
    u.alwaysCrit = B.alwaysCrit;
    u.critGuard = B.critGuard;
    u.hasAura = B.aura;
    if (B.cloak !== A.cloak) u.cloakReady = B.cloak;
    if (B.sash !== A.sash) u.sashReady = B.sash;
    if (B.wp !== A.wp) u.wpReady = B.wp;
    if (B.shield && !A.shield) {
      u.trShieldReady = true;
      u.itemTick.shield = 0;
    } else if (!B.shield) {
      u.trShieldReady = false;
      u.trShieldOn = false;
    }
    u.orbDur = TR_LIFE_DUR[B.life];
    u.orbShieldDur = TR_LIFE_SHIELD[B.life];
    u.items = items.slice();
    u.it = B.it;
    if (!live) return;
    const hpAfter = u.base.hp * (1 + u.pct.hp) + u.flatHp;
    const d = Math.round(hpAfter - hpBefore);
    if (d) {
      u.maxHp = Math.max(1, u.maxHp + d);
      if (d > 0) u.hp += d;
      u.hp = Math.min(u.hp, u.maxHp);
    }
    if (B.pp > A.pp && !u.experiment) u.mana = Math.min(u.maxMana, u.mana + (B.pp - A.pp));
    this.snapshot(u);
  },

  itemsInitSide(side) {
    for (const u of this.units) {
      if (u.side !== side || !u.it || !u.it['scope-lens']) continue;
      for (const a of this.units) {
        if (a === u || a.side !== side || a.r !== u.r || Math.abs(a.c - u.c) !== 1) continue;
        a.rk.crit += u.it['scope-lens'];
      }
    }
  },

  tagDebuff(t, k, n, dur, tag) {
    const until = this.time + dur;
    const e = t.tmp.find(b => b.tag === tag && b.k === k);
    if (e) e.until = Math.max(e.until, until);
    else t.tmp.push({ k, n, until, tag });
  },

  antiHealOn(t, v, dur) {
    t.antiHeal = t.antiHealUntil > this.time ? Math.max(t.antiHeal, v) : v;
    t.antiHealUntil = Math.max(t.antiHealUntil, this.time + dur);
  },

  itemBurn(t, src, dur) {
    if (!t.alive || t.egg) return;
    if (t.burnUntil > this.time) {
      t.burnUntil = Math.max(t.burnUntil, this.time + dur);
      t.burnSrc = src.uid;
    } else this.addBurn(t, src, dur);
  },

  boostStack(u) {
    if (u.boostStacks >= 25) return;
    u.boostStacks += 1;
    u.pct.pa += 0.03;
    u.pct.sa += 0.03;
    if (u.boostStacks === 25) {
      u.rk.def += 2;
      u.rk.spd += 2;
      this.emit({ type: 'buff', target: u.uid, kind: 'boost' });
    }
  },

  tickItems(u, dt) {
    const it = u.it;
    const T = u.itemTick;
    if (it['super-potion']) {
      T.regen += dt;
      while (T.regen >= 1) {
        T.regen -= 1;
        this.heal(u, u.maxHp * 0.015 * it['super-potion'], u);
      }
    }
    if (it['soul-dew']) {
      T.dew += dt;
      while (T.dew >= 5) {
        T.dew -= 5;
        u.pct.sa += 0.18 * it['soul-dew'];
        u.dewPct += 18 * it['soul-dew'];
        this.emit({ type: 'buff', target: u.uid, kind: 'dew' });
      }
    }
    if (it['assault-vest']) {
      T.vest += dt;
      while (T.vest >= 6) {
        T.vest -= 6;
        u.rk.atk += it['assault-vest'];
        u.rk.spa += it['assault-vest'];
        u.vestRanks += it['assault-vest'];
      }
    }
    if (it['absorb-bulb']) {
      T.bulb += dt;
      while (T.bulb >= 5) {
        T.bulb -= 5;
        u.amp += 0.05 * it['absorb-bulb'];
        u.bulbPct += 5 * it['absorb-bulb'];
      }
    }
    if (u.trShieldOn) {
      T.shield += dt;
      while (T.shield >= 8 && u.alive) {
        T.shield -= 8;
        this.treasureShield(u, treasureSum(treasureCounts(it, 'rusted-shield'), TR_SHIELD_EVERY));
      }
    }
    if (it['kings-rock']) {
      let c = 0;
      for (const o of this.units) if (o.alive && o.side !== u.side && !o.serpent && Hex.dist(u.r, u.c, o.r, o.c) <= 2) c++;
      u.kingN = Math.min(4, c) * it['kings-rock'];
    }
    if (u.hasAura) {
      T.aura += dt;
      if (T.aura >= 0.5) {
        T.aura = 0;
        for (const o of this.units) {
          if (!o.alive || o.side === u.side || o.serpent) continue;
          const d = Hex.dist(u.r, u.c, o.r, o.c);
          if (d > 2) continue;
          if (it['full-incense']) {
            this.tagDebuff(o, 'spd', -1, 0.7, 'fullinc');
            this.tagDebuff(o, 'spe', -1, 0.7, 'fullinc');
          }
          if (it['lax-incense']) {
            this.tagDebuff(o, 'def', -1, 0.7, 'laxinc');
            this.tagDebuff(o, 'acc', -1, 0.7, 'laxinc');
          }
          if (it['flame-orb'] && d <= 1) {
            this.antiHealOn(o, 0.33, 0.7);
            this.itemBurn(o, u, 1);
          }
        }
      }
    }
  },

  tickOrbQueue(u, dt) {
    if (!u.orbQ || !u.orbQ.length || !u.alive) return;
    let amt = 0;
    for (const q of u.orbQ) {
      const d = Math.min(q.left, q.rate * dt);
      q.left -= d;
      amt += d;
    }
    u.orbQ = u.orbQ.filter(q => q.left > 0.001);
    if (amt > 0) this.dealDamage(null, u, amt, { orbTick: true, kind: 'orb' });
  },

  orbTickDamage(t, amt) {
    let hpDmg = amt;
    if (hpDmg >= t.hp) {
      if (t.endureUntil > this.time) hpDmg = Math.max(0, t.hp - 1);
      else if (t.endure && !t.endureUsed) {
        t.endureUsed = true;
        t.endureUntil = this.time + t.endure;
        hpDmg = Math.max(0, t.hp - 1);
        this.emit({ type: 'buff', target: t.uid, kind: 'endure' });
      } else if (t.sashReady) {
        t.sashReady = false;
        t.endureUntil = this.time + 2;
        hpDmg = Math.max(0, t.hp - 1);
        t.pct.pa += 0.2;
        t.pct.sa += 0.2;
        this.emit({ type: 'buff', target: t.uid, kind: 'sash' });
      }
    }
    const real = Math.min(hpDmg, t.hp);
    t.hp -= real;
    if (t.hp <= 0) {
      this.kill(t, 'orb');
      return real;
    }
    if (t.cloakReady) this.itemCloak(t);
    this.itemAfterDamage(null, t, { kind: 'orb' }, false);
    if (t.warriorShield && !t.warriorUsed && t.hp <= t.maxHp * 0.4) {
      t.warriorUsed = true;
      t.warriorOn = true;
      this.addShield(t, (t.maxHp - t.hp) * t.warriorShield);
      this.emit({ type: 'buff', target: t.uid, kind: 'warrior' });
    }
    return real;
  },

  orbVamp(u) {
    if (!u.it || !u.it['life-orb-3'] || !u.maxHp) return 0;
    return Math.min(1, Math.max(0, (u.maxHp - u.hp) / u.maxHp));
  },

  swordAmpOf(u) {
    return u.swordUntil > this.time ? u.swordAmp : 0;
  },

  swordDuraOf(u) {
    return u.swordUntil > this.time ? u.swordDura : 0;
  },

  treasureShield(u, pct) {
    if (!u.alive || pct <= 0) return;
    this.addShield(u, u.maxHp * pct);
    this.emit({ type: 'buff', target: u.uid, kind: 'tshield' });
    if (!u.it['rusted-shield-3']) return;
    const foes = this.units.filter(o => this.canTarget(u, o) && !o.serpent).sort((a, b) => Hex.dist(u.r, u.c, a.r, a.c) - Hex.dist(u.r, u.c, b.r, b.c) || a.uid - b.uid).slice(0, 3);
    for (const o of foes) {
      this.emit({ type: 'hitfx', target: o.uid, kind: '땅' });
      this.dealDamage(u, o, u.maxHp * 0.15 * u.it['rusted-shield-3'], { special: true, kind: 'quakefx' });
    }
  },

  itemAfterDamage(src, t, o, isHit) {
    if (!t.alive) return;
    const it = t.it;
    if (t.trShieldReady && t.hp <= t.maxHp * 0.5) {
      t.trShieldReady = false;
      t.trShieldOn = true;
      t.itemTick.shield = 0;
      this.treasureShield(t, TR_SHIELD_FIRST[treasureTop(treasureCounts(it, 'rusted-shield'))]);
    }
    if (t.orbDur && !t.orbDone && t.hp <= t.maxHp * 0.4) {
      t.orbDone = true;
      t.orbQ = [];
      const lost = t.maxHp - t.hp;
      const before = t.shield;
      this.addShield(t, lost * 0.5);
      const real = t.shield - before;
      if (real > 0) t.shieldTimed.push({ amt: real, until: this.time + t.orbShieldDur });
      this.emit({ type: 'buff', target: t.uid, kind: 'lifeorb' });
    }
    if (isHit && src && src.side !== t.side) {
      const g = treasureCounts(it, 'griseous-orb');
      const top = treasureTop(g);
      if (top) {
        if (t.grisStacks < 15) {
          t.grisStacks += 1;
          const v = treasureSum(g, TR_GRIS_STACK);
          t.flatArmor += v;
          t.flatMr += v;
        } else {
          const best = Math.max(this.defense(t, false), this.defense(t, true));
          if (this.time >= t.grisCd) {
            t.grisCd = this.time + 2;
            this.emit({ type: 'skillfx', uid: t.uid, r: t.r, c: t.c, radius: 1, kind: '바위' });
            for (const e of this.units.filter(x => this.canTarget(t, x) && !x.serpent && Hex.dist(t.r, t.c, x.r, x.c) <= 1)) {
              this.dealDamage(t, e, best * TR_GRIS_PCT[top], { special: true, kind: 'griseous' });
            }
          }
          if (g[3] && this.time >= t.grisCd2 && t.alive) {
            t.grisCd2 = this.time + 3;
            for (const e of this.units.filter(x => this.canTarget(t, x) && !x.serpent && Hex.dist(t.r, t.c, x.r, x.c) <= 4)) {
              this.dealDamage(t, e, best * 0.5 * g[3], { trueDmg: true, kind: 'griseous' });
            }
          }
        }
      }
    }
  },

  swordExecute(src, t) {
    const n = treasureCounts(src.it, 'rusted-sword');
    const top = treasureTop(n);
    if (!top || !t.alive || t.egg || t.hp > t.maxHp * TR_SWORD_THR[top]) return false;
    this.emit({ type: 'freeze', target: t.uid, duration: 0.3 });
    this.execute(t, src.side);
    if (n[3]) {
      this.side[src.side].swordGold = (this.side[src.side].swordGold || 0) + 3 * n[3];
      this.heal(src, src.maxHp * 0.4 * n[3], src);
    }
    this.itemOnKill(src, t, true);
    return true;
  },

  itemOnKill(src, t, executed) {
    if (!src.alive || !src.it) return;
    const n = treasureCounts(src.it, 'rusted-sword');
    const top = treasureTop(n);
    if (!top) return;
    this.swordDepth = (this.swordDepth || 0) + 1;
    if (this.swordDepth <= 6) {
      if (TR_SWORD_BONUS[top]) {
        src.swordUntil = this.time + 5;
        src.swordAmp = TR_SWORD_BONUS[top];
        src.swordDura = TR_SWORD_BONUS[top];
      }
      let best = null;
      let bestD = -1;
      for (const o of this.units) {
        if (!this.canTarget(src, o) || o.serpent) continue;
        const d = Hex.dist(src.r, src.c, o.r, o.c);
        if (d <= 3 && d > bestD) {
          best = o;
          bestD = d;
        }
      }
      if (best) {
        const cell = this.freeNear(best.r, best.c, best.r, best.c);
        if (cell && !src.serpent) this.moveTo(src, cell[0], cell[1], 0.1);
        this.emit({ type: 'dash', uid: src.uid, target: best.uid });
        this.dealDamage(src, best, this.atkStat(src), { special: false, kind: 'sword' });
      }
    }
    this.swordDepth -= 1;
  },

  redOrbCount(src) {
    const n = treasureCounts(src.it, 'red-orb');
    if (!treasureTop(n) || !src.alive) return;
    src.redHits += 1;
    if (src.redHits < 6) return;
    src.redHits = 0;
    const dmg = treasureSum(n, TR_RED_DMG);
    const targets = this.units.filter(o => this.canTarget(src, o)).sort((a, b) => a.hp - b.hp || a.uid - b.uid).slice(0, 2);
    for (const o of targets) {
      this.emit({ type: 'hitfx', target: o.uid, kind: '격투' });
      this.dealDamage(src, o, dmg, { special: false, kind: 'redorb' });
    }
    if (n[3]) {
      src.pct.as += 0.2 * n[3];
      src.redAs += 20 * n[3];
    }
  },

  itemAfterCast(u) {
    const n = treasureCounts(u.it, 'blue-orb');
    if (!treasureTop(n)) return;
    u.mana = Math.min(u.maxMana, u.mana + treasureSum(n, TR_BLUE_CAST));
    const sa = treasureSum(n, TR_BLUE_SA);
    u.pct.sa += sa;
    u.blueSa += Math.round(sa * 100);
    if (n[3]) u.maxMana = Math.max(8, u.maxMana - 2 * n[3]);
  },

  itemDamageMult(src, t, o) {
    let m = 1;
    const it = src.it;
    if (it) {
      if (it['expert-belt']) m *= 1 + (typeMult(src.skillType, t.defTypes) > 1 ? 0.6 : 0.1) * it['expert-belt'];
      if (it['black-belt'] && t.maxHp >= 1300) m *= 1 + 0.45 * it['black-belt'];
      if (it['metronome']) {
        const tg = src.target ? src.target.uid : t.uid;
        if (src.metroTarget !== tg) {
          src.metroTarget = tg;
          src.metroSince = this.time;
        }
        m *= 1 + 0.3 * it['metronome'] * Math.floor((this.time - src.metroSince) / 3);
      }
    }
    if (t.critGuard) m *= 0.85;
    if (t.herbGuard && t.ccImmuneUntil > this.time) m *= 0.75;
    return m;
  },

  itemAfterHit(src, t, o, total) {
    const si = src.it;
    if (si) {
      if (si['black-sludge']) {
        this.antiHealOn(t, 0.33, 4);
        this.itemBurn(t, src, 3);
      }
      if (si['spell-tag']) this.tagDebuff(t, 'def', -3, 6, 'spelltag');
      if (si['twisted-spoon']) this.tagDebuff(t, 'spd', -3, 6, 'spoon');
    }
    const ti = t.it;
    if (!ti) return;
    if (ti['soothe-bell']) this.gainPP(t, 2 * ti['soothe-bell']);
    if (ti['booster-energy']) this.boostStack(t);
    if (ti['weakness-policy'] && t.wpReady && typeMult(src.skillType, t.defTypes) > 1) {
      t.wpReady = false;
      this.addShield(t, t.maxHp * 0.3);
      t.pct.pa += 0.3;
      t.pct.sa += 0.3;
      this.emit({ type: 'buff', target: t.uid, kind: 'policy' });
    }
    if (ti['rocky-helmet'] && o.kind === 'basic' && src.alive && total > 0) this.dealDamage(t, src, total * 0.5 * ti['rocky-helmet'], { trueDmg: true, kind: 'reflect' });
  },

  itemCloak(t) {
    if (!t.cloakReady || !t.alive || t.hp > t.maxHp * 0.4) return;
    t.cloakReady = false;
    t.hidden = true;
    t.untargetUntil = this.time + 2;
    this.emit({ type: 'hide', uid: t.uid, on: true });
    this.emit({ type: 'buff', target: t.uid, kind: 'cloak' });
    this.heal(t, (t.maxHp - t.hp) * 0.6, t);
  },

  itemOnBasic(u, t, raw, dmg, crit) {
    const it = u.it;
    if (!it || !u.items.length) return;
    if (it['ether']) this.gainPP(u, 3 * it['ether']);
    if (it['dragon-fang']) this.gainPP(u, (crit ? 6 : 3) * it['dragon-fang']);
    const blue = treasureCounts(it, 'blue-orb');
    if (treasureTop(blue)) this.gainPP(u, treasureSum(blue, TR_BLUE_BASIC));
    if (it['choice-scarf']) {
      u.pct.as += 0.02 * it['choice-scarf'];
      u.scarfPct += 2 * it['choice-scarf'];
    }
    if (it['booster-energy'] && dmg > 0) this.boostStack(u);
    if (it['kings-rock'] && t.alive && this.rng.next() < 0.1) this.stun(t, 1.5, u.side, 'flinch');
    if (it['silver-wing']) {
      const others = this.units.filter(o => o !== t && !o.serpent && this.canTarget(u, o)).sort((a, b) => Hex.dist(u.r, u.c, a.r, a.c) - Hex.dist(u.r, u.c, b.r, b.c) || a.uid - b.uid).slice(0, 2 * it['silver-wing']);
      for (const o of others) {
        this.emit({ type: 'attack', uid: u.uid, target: o.uid, ranged: true, special: u.special });
        this.dealDamage(u, o, raw * 0.3, { special: u.special, kind: 'proj' });
      }
    }
  }
};

Object.assign(CombatSim.prototype, ITEM_FX);
