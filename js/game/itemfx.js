const ITEM_STAT_KEYS = ['atk', 'spa', 'def', 'spd', 'spe', 'crit'];
function eviolitePick(base, st, hp) {
  const rel = { atk: st.atk || 0, spa: (st.spa || 0) / 100, def: base.def ? (st.def || 0) / base.def : 0, spd: base.spd ? (st.spd || 0) / base.spd : 0, spe: st.spe || 0, hp: base.hp ? (hp || 0) / base.hp : 0 };
  let best = null;
  for (const k in rel) if (rel[k] > 0 && (!best || rel[k] > rel[best])) best = k;
  return best;
}
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
const TR_BLUE_BASIC = [0, 10, 20, 30];
const TR_BLUE_CAST = [0, 5, 8, 13];
const TR_BLUE_SPA = [0, 0.05, 0.07, 0.1];

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
    const it = itemCountMap(items);
    const n = id => it[id] || 0;
    const S = { it, stats: { atk: 0, spa: 0, def: 0, spd: 0, spe: 0, crit: 0 }, hp: 0, pp: 0, atk: 0, spa: 0, hpPct: 0, vamp: 0, range: 0 };
    for (const id of items) {
      const st = itemDef(id).stats || {};
      for (const k of ITEM_STAT_KEYS) if (st[k]) S.stats[k] += st[k];
      if (st.hp) S.hp += st.hp;
      if (st.pp) S.pp += st.pp;
    }
    S.evo = n('eviolite');
    S.evoPct = n('eviolite') * (evolvable ? 0.4 : 0.2);
    S.everstonePct = n('everstone') * (evolvable ? 0.1 : 0.05);
    S.atk = 0;
    S.spa = 0;
    S.vamp = 0.4 * n('shell-bell') + 0.2 * n('super-potion');
    S.hpPct = 0.3 * n('big-root');
    S.range = n('zoom-lens');
    S.herb = n('mental-herb');
    S.critAtk = 0.1 * n('punching-glove');
    S.critSpa = 0.1 * n('black-glasses');
    S.alwaysCrit = n('scope-lens') > 0;
    S.critGuard = 0;
    S.critDmgGuard = 0.3 * n('shell-armor');
    S.cloak = n('covert-cloak');
    S.sash = n('focus-sash');
    S.wp = n('weakness-policy');
    S.critDamage = 0.1 * n('punching-glove') + 0.1 * n('black-glasses') + 0.2 * n('scope-lens');
    S.aura = ITEM_AURA.some(id => n(id));
    S.shield = treasureTop(treasureCounts(it, 'rusted-shield')) > 0;
    S.life = treasureTop(treasureCounts(it, 'life-orb'));
    return S;
  },

  applyItems(u, spec) {
    u.items = [];
    u.it = {};
    u.itemPP = 0;
    u.itemTick = { regen: 0, dew: 0, vest: 0, aura: 0, bulb: 0, shield: 0, hood: 0, fullRestore: 0 };
    u.boostStacks = 0;
    u.kingN = 0;
    u.kingAttackers = new Set();
    u.dewPct = 0;
    u.scarfPct = 0;
    u.vestAtkBonus = 0;
    u.vestSpaBonus = 0;
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
    u.redSpe = 0;
    u.blueSpa = 0;
    u.bluePP = 0;
    u.grisFlat = 0;
    u.wpFired = false;
    u.sashFired = false;
    u.herbUntil = 0;
    u.rockyCd = 0;
    u.vestCd = 0;
    u.shellBellReady = false;
    u.flameAt = 0;
    u.laxBonusApplied = false;
    u.expertAmp = 0;
    u.sashUntil = 0;
    const list = (spec.items || []).filter(id => typeof itemDef === 'function' && itemDef(id) && !isConsumable(id));
    this.swapItems(u, list, !!spec.evolvable, false);
    u.itemPP = this.itemStatic(list, !!spec.evolvable).pp;
  },

    evoMul(u, k) {
    return u.evoKey === k ? u.evoMul : 1;
  },

  swapItems(u, items, evolvable, live) {
    const A = this.itemStatic(u.items, evolvable);
    const B = this.itemStatic(items, evolvable);
    const hpBefore = (u.base.hp * (1 + u.pct.hp) + u.flatHp) * this.evoMul(u, 'hp');
    u.evoKey = B.evoPct ? eviolitePick(u.base, B.stats, B.hp) : null;
    u.evoMul = 1 + B.evoPct;
    const everstonePct = B.everstonePct - A.everstonePct;
    u.pct.atk += everstonePct;
    u.pct.spa += everstonePct;
    u.pct.hp += everstonePct;
    u.pct.spe += everstonePct;
    u.flatDef += u.base.def * everstonePct;
    u.flatSpd += u.base.spd * everstonePct;
    addStatModifier(u, 'crit', everstonePct / STAT_MODIFIER_PER_POINT.crit);
    u.pct.atk += B.stats.atk - A.stats.atk;
    u.pct.spa += (B.stats.spa - A.stats.spa) / 100;
    u.flatDef += B.stats.def - A.stats.def;
    u.flatSpd += B.stats.spd - A.stats.spd;
    u.pct.spe += B.stats.spe - A.stats.spe;
    addStatModifier(u, 'crit', (B.stats.crit - A.stats.crit) / STAT_MODIFIER_PER_POINT.crit);
    u.flatHp += B.hp - A.hp;
    u.pct.atk += B.atk - A.atk;
    u.pct.spa += B.spa - A.spa;
    u.pct.hp += B.hpPct - A.hpPct;
    u.vamp += B.vamp - A.vamp;
    u.critDmg += B.critDamage - A.critDamage;
    u.critDmgGuard = B.critDmgGuard;
    if (B.range !== A.range) {
      u.range += B.range - A.range;
      u.ranged = u.range > 1;
    }
    if (B.herb && !A.herb) {
      u.herbUntil = 18 * B.herb;
      u.ccImmuneUntil = Math.max(u.ccImmuneUntil, u.herbUntil);
    } else if (!B.herb && A.herb && live && u.ccImmuneUntil <= u.herbUntil) u.ccImmuneUntil = Math.min(u.ccImmuneUntil, this.time);
    u.herbGuard = B.herb;
    if (live) this.itemRevert(u, A.it, B.it);
    u.skillCritAtk = B.critAtk;
    u.skillCritSpa = B.critSpa;
    u.alwaysCrit = B.alwaysCrit;
    u.critGuard = B.critGuard;
    u.hasAura = B.aura;
    if (B.cloak !== A.cloak) u.cloakReady = B.cloak > 0;
    if (B.sash !== A.sash) u.sashReady = B.sash > 0;
    if (B.wp !== A.wp) u.wpReady = B.wp > 0;
    u.cloakK = B.cloak;
    u.sashK = B.sash;
    u.wpK = B.wp;
    u.shellBellReady = B.it['shell-bell'] > 0;
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
    this.augItemMods(u);
    this.gimmickMods(u, A.it, B.it, live);
    if (!live) return;
    const hpAfter = (u.base.hp * (1 + u.pct.hp) + u.flatHp) * this.evoMul(u, 'hp');
    const d = Math.round(hpAfter - hpBefore);
    if (d) {
      u.maxHp = Math.max(1, u.maxHp + d);
      if (d > 0) u.hp += d;
      u.hp = Math.min(u.hp, u.maxHp);
    }
    if (B.pp > A.pp && !u.experiment) u.pp = Math.min(u.maxPP, u.pp + (B.pp - A.pp));
    this.snapshot(u);
  },
  
  itemRevert(u, a, b) {
    const gone = id => (a[id] || 0) > 0 && !(b[id] || 0);
    const goneAll = base => [1, 2, 3].some(k => a[base + '-' + k]) && ![1, 2, 3].some(k => b[base + '-' + k]);
    if (gone('soul-dew') && u.dewPct) {
      u.pct.spa -= u.dewPct / 100;
      u.dewPct = 0;
    }
    if (gone('assault-vest') && (u.vestAtkBonus || u.vestSpaBonus)) {
      u.pct.atk -= u.vestAtkBonus;
      u.pct.spa -= u.vestSpaBonus;
      u.vestAtkBonus = 0;
      u.vestSpaBonus = 0;
    }
    if (gone('absorb-bulb') && u.bulbPct) {
      u.amp -= u.bulbPct / 100;
      u.bulbPct = 0;
    }
    if (gone('choice-scarf') && u.scarfPct) {
      u.pct.spe -= u.scarfPct / 100;
      u.scarfPct = 0;
    }
    if (gone('expert-belt') && u.expertAmp) {
      u.amp -= u.expertAmp;
      u.expertAmp = 0;
    }
    if (gone('booster-energy') && u.boostStacks) {
      u.amp -= u.boostGain || 0;
      u.flatDef -= u.boostDef || 0;
      u.flatSpd -= u.boostDef || 0;
      u.boostStacks = 0;
      u.boostGain = 0;
      u.boostDef = 0;
    }
    if (gone('kings-rock')) {
      u.kingN = 0;
      u.kingAttackers.clear();
    }
    if (gone('weakness-policy') && u.wpFired) {
      u.pct.atk -= u.wpGain || 0.3;
      u.wpFired = false;
    }
    if (gone('focus-sash') && u.sashFired) {
      u.pct.atk -= u.sashGain || 0;
      u.sashFired = false;
    }
    if (gone('red-orb-3') && u.redSpe) {
      u.pct.spe -= u.redSpe / 100;
      u.redSpe = 0;
    }
    if (goneAll('red-orb')) u.redHits = 0;
    if (goneAll('blue-orb')) {
      if (u.blueSpa) u.pct.spa -= u.blueSpa / 100;
      if (u.bluePP) u.maxPP += u.bluePP;
      u.blueSpa = 0;
      u.bluePP = 0;
    }
    if (goneAll('griseous-orb')) {
      u.flatDef -= u.grisFlat;
      u.flatSpd -= u.grisFlat;
      u.grisFlat = 0;
      u.grisStacks = 0;
    }
  },

  itemsInitSide(side) {
    for (const u of this.units) {
      if (u.side !== side || !u.it) continue;
      if (u.it['full-restore']) {
        for (const a of this.units) {
          if (a.side !== side || Hex.dist(a.r, a.c, u.r, u.c) > 1) continue;
          a.pct.spa += 0.25 * u.it['full-restore'];
          this.gainPP(a, 10 * u.it['full-restore']);
        }
      }
      if (!u.it['scope-lens']) continue;
      for (const a of this.units) {
        if (a === u || a.side !== side || a.r !== u.r || Math.abs(a.c - u.c) !== 1) continue;
        addStatModifier(a, 'crit', 2 * u.it['scope-lens']);
        a.pct.spe += 0.1 * u.it['scope-lens'];
      }
    }
  },

  tagDebuff(t, k, n, dur, tag) {
    const until = this.time + dur;
    const e = t.tmp.find(b => b.tag === tag && b.k === k);
    if (e) e.until = Math.max(e.until, until);
    else t.tmp.push({ k, value: statModifierDelta(k, n), until, tag });
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
    const k = (u.it && u.it['booster-energy']) || 1;
    u.boostStacks += 1;
    u.amp += 0.02 * k;
    u.boostGain = (u.boostGain || 0) + 0.02 * k;
    if (u.boostStacks === 25) {
      u.flatDef += 20 * k;
      u.flatSpd += 20 * k;
      u.boostDef = 20 * k;
      this.emit({ type: 'buff', target: u.uid, kind: 'boost' });
    }
  },

  tickItems(u, dt) {
    const it = u.it;
    const T = u.itemTick;
    if (it['soul-dew']) {
      T.dew += dt;
      while (T.dew >= 5) {
        T.dew -= 5;
        u.pct.spa += 0.3 * it['soul-dew'];
        u.dewPct += 30 * it['soul-dew'];
        this.emit({ type: 'buff', target: u.uid, kind: 'dew' });
      }
    }
    if (it['mental-herb'] && this.time < 18) {
      T.herb = (T.herb || 0) + dt;
      while (T.herb >= 2 && this.time < 18) {
        T.herb -= 2;
        u.pct.spe += 0.03 * it['mental-herb'];
      }
    }
    if (u.sashFired && u.sashUntil <= this.time && u.sashGain) {
      u.pct.atk -= u.sashGain;
      u.sashGain = 0;
    }
    if (it['full-restore']) {
      T.fullRestore += dt;
      while (T.fullRestore >= 7) {
        T.fullRestore -= 7;
        for (const a of this.aliveOf(u.side)) {
          if (Hex.dist(a.r, a.c, u.r, u.c) > 1) continue;
          this.cleanse(a);
          this.emit({ type: 'buff', target: a.uid, kind: 'cleanse' });
        }
      }
    }
    if (it['rescue-hood']) {
      T.hood += dt;
      while (T.hood >= 5) {
        T.hood -= 5;
        const ally = this.aliveOf(u.side)
          .filter(a => Hex.dist(a.r, a.c, u.r, u.c) <= 1)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.uid - b.uid)[0];
        if (ally) this.heal(ally, ally.maxHp * 0.15 * it['rescue-hood'], u);
      }
    }
    if (it['lax-incense'] && !u.laxBonusApplied) {
      u.laxBonusApplied = true;
      u.tmp.push({ k: 'def', value: statModifierDelta('def', 25 * it['lax-incense']), until: 15 });
      u.tmp.push({ k: 'spd', value: statModifierDelta('spd', 25 * it['lax-incense']), until: 15 });
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
    if (u.hasAura) {
      T.aura += dt;
      if (T.aura >= 0.5) {
        T.aura = 0;
        for (const o of this.units) {
          if (!o.alive || o.side === u.side) continue;
          const d = Hex.dist(u.r, u.c, o.r, o.c);
          if (d > 2) continue;
          if (it['full-incense']) {
            this.tagDebuff(o, 'spd', -30 * it['full-incense'], 0.7, 'fullinc');
          }
          if (it['lax-incense']) {
            this.tagDebuff(o, 'def', -30 * it['lax-incense'], 0.7, 'laxinc');
          }
          if (it['flame-orb'] && d <= 2 && this.time >= u.flameAt) {
            u.flameAt = this.time + 2;
            this.antiHealOn(o, Math.min(0.9, 0.33 * it['flame-orb']), 10);
            this.itemBurn(o, u, 10);
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
        this.sashFire(t);
        hpDmg = Math.max(0, t.hp - 1);
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
    const foes = this.units.filter(o => this.canTarget(u, o)).sort((a, b) => Hex.dist(u.r, u.c, a.r, a.c) - Hex.dist(u.r, u.c, b.r, b.c) || a.uid - b.uid).slice(0, 3);
    for (const o of foes) {
      this.emit({ type: 'hitfx', target: o.uid, kind: '땅' });
      this.dealDamage(u, o, u.maxHp * 0.15 * u.it['rusted-shield-3'], { special: true, kind: 'quakefx' });
    }
  },

  itemAfterDamage(src, t, o, isHit) {
    if (!t.alive) return;
    const it = t.it;
    if (isHit && src && src.side !== t.side && it['kings-rock']) {
      t.kingAttackers.add(src.uid);
      t.kingN = t.kingAttackers.size * it['kings-rock'];
    }
    if (t.shellBellReady && t.hp <= t.maxHp * 0.4) {
      t.shellBellReady = false;
      const amount = t.maxHp * 0.25 * it['shell-bell'];
      this.addShield(t, amount);
      t.shieldTimed.push({ amt: amount, until: this.time + 5 });
    }
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
          t.flatDef += v;
          t.flatSpd += v;
          t.grisFlat += v;
        } else {
          const best = Math.max(this.defense(t, false), this.defense(t, true));
          if (this.time >= t.grisCd) {
            t.grisCd = this.time + 2;
            this.emit({ type: 'skillfx', uid: t.uid, r: t.r, c: t.c, radius: 1, kind: '바위' });
            for (const e of this.units.filter(x => this.canTarget(t, x) && Hex.dist(t.r, t.c, x.r, x.c) <= 1)) {
              this.dealDamage(t, e, best * TR_GRIS_PCT[top], { special: true, kind: 'griseous' });
            }
          }
          if (g[3] && this.time >= t.grisCd2 && t.alive) {
            t.grisCd2 = this.time + 3;
            for (const e of this.units.filter(x => this.canTarget(t, x) && Hex.dist(t.r, t.c, x.r, x.c) <= 4)) {
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
    t.killedBy = src;
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
        if (!this.canTarget(src, o)) continue;
        const d = Hex.dist(src.r, src.c, o.r, o.c);
        if (d <= 3 && d > bestD) {
          best = o;
          bestD = d;
        }
      }
      if (best) {
        const cell = this.freeNear(best.r, best.c, best.r, best.c);
        if (cell && !src.gyaraFx) this.moveTo(src, cell[0], cell[1], 0.1);
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
      src.pct.spe += 0.2 * n[3];
      src.redSpe += 20 * n[3];
    }
  },

  itemAfterCast(u, usedPP) {
    for (const source of this.units) {
      if (!source.alive || source.side === u.side || !source.it || !source.it['full-incense']) continue;
      if (Hex.dist(source.r, source.c, u.r, u.c) > 2) continue;
      this.dealDamage(source, u, usedPP * 1.6 * source.it['full-incense'], { special: true, kind: 'incense' });
    }
    const n = treasureCounts(u.it, 'blue-orb');
    if (treasureTop(n)) {
      u.pp = Math.min(u.maxPP, u.pp + treasureSum(n, TR_BLUE_CAST));
      const gain = treasureSum(n, TR_BLUE_SPA);
      u.pct.spa += gain;
      u.blueSpa += Math.round(gain * 100);
      if (n[3]) {
        const before = u.maxPP;
        u.maxPP = Math.max(20, u.maxPP - 5 * n[3]);
        u.bluePP += before - u.maxPP;
      }
    }
  },

  itemDamageMult(src, t, o) {
    let m = 1;
    const it = src.it;
    if (it) {
    }
    if (t.it && t.it['covert-cloak'] && !o.special) m *= 0.75;
    if (t.it && (t.it['rocky-helmet'] || t.it['assault-vest']) && o.kind === 'basic') m *= 0.92;
    if (t.it && t.it['rescue-hood'] && o.aoe) m *= 0.92;
    if (t.critDmgGuard && o.crit) {
      const critMultiplier = CONFIG.combat.critMult + (src && src.critDmg || 0);
      m *= (1 + (critMultiplier - 1) * (1 - t.critDmgGuard)) / critMultiplier;
    }
    return m;
  },

  itemAfterHit(src, t, o, total) {
    const si = src.it;
    if (si) {
      if (si['expert-belt'] && this.effMult(src, t) > 1) {
        const gain = 0.03 * si['expert-belt'];
        src.amp += gain;
        src.expertAmp += gain;
      }
      if (si['booster-energy']) this.boostStack(src);
      if (si['super-potion'] && total > 0) {
        const ally = this.lowestRatioAlly(src.side);
        if (ally) this.heal(ally, total * 0.25 * si['super-potion'], src);
      }
      if (si['black-sludge']) {
        this.antiHealOn(t, Math.min(0.9, 0.33 * si['black-sludge']), 10);
        this.itemBurn(t, src, 10);
      }
      if (si['spell-tag']) this.tagDebuff(t, 'def', -30 * si['spell-tag'], 3, 'spelltag');
      if (si['twisted-spoon']) this.tagDebuff(t, 'spd', -30 * si['twisted-spoon'], 3, 'spoon');
    }
    const ti = t.it;
    if (!ti) return;
    if (ti['booster-energy']) this.boostStack(t);
    if (ti['weakness-policy'] && t.wpReady && (t.hp <= t.maxHp * 0.6 || this.effMult(src, t) > 1)) {
      const k = t.wpK || 1;
      t.wpReady = false;
      t.wpFired = true;
      t.wpGain = 0.3 * k;
      this.addShield(t, t.maxHp * 0.3 * k);
      t.pct.atk += t.wpGain;
      this.emit({ type: 'buff', target: t.uid, kind: 'policy' });
    }
    if (ti['rocky-helmet'] && o.kind === 'basic' && src.alive && total > 0 && this.time >= t.rockyCd) {
      t.rockyCd = this.time + 2;
      for (const target of this.units) {
        if (target.side === t.side || !target.alive || Hex.dist(t.r, t.c, target.r, target.c) > 1) continue;
        this.dealDamage(t, target, t.maxHp * 0.08, { special: true, kind: 'rocky' });
      }
    }
  },

  itemCloak(t) {
    if (!t.cloakReady || !t.alive || t.hp > t.maxHp * 0.6) return;
    const k = t.cloakK || 1;
    t.cloakReady = false;
    t.hidden = true;
    t.untargetUntil = this.time + 2 * k;
    this.emit({ type: 'hide', uid: t.uid, on: true });
    this.emit({ type: 'buff', target: t.uid, kind: 'cloak' });
    this.cleanse(t);
    t.pct.spe += 0.15 * k;
  },

  sashFire(t) {
    const k = t.sashK || 1;
    t.sashReady = false;
    t.sashFired = true;
    t.endureUntil = this.time + 5 * k;
    t.sashUntil = t.endureUntil;
    t.sashGain = 0.3 * k;
    t.pct.atk += t.sashGain;
    this.emit({ type: 'buff', target: t.uid, kind: 'sash' });
  },

  itemOnBasic(u, t, raw, dmg, crit) {
    const it = u.it;
    if (!it || !u.items.length) return;
    if (it['ether']) this.gainPP(u, 5 * it['ether']);
    const blue = treasureCounts(it, 'blue-orb');
    if (treasureTop(blue)) this.gainPP(u, treasureSum(blue, TR_BLUE_BASIC));
    if (it['choice-scarf']) {
      u.pct.spe += 0.04 * it['choice-scarf'];
      u.scarfPct += 4 * it['choice-scarf'];
    }
    if (it['black-belt'] && t.maxHp >= 1750 && dmg > 0) this.heal(u, dmg * 0.15 * it['black-belt'], u);
    if (it['kings-rock'] && t.alive && this.rng.next() < 0.1 * it['kings-rock']) this.stun(t, 1.5, u.side);
    if (it['assault-vest'] && t.alive && this.time >= u.vestCd) {
      u.vestCd = this.time + 2;
      for (const o of this.units) {
        if (!this.canTarget(u, o) || Hex.dist(t.r, t.c, o.r, o.c) > 1) continue;
        this.dealDamage(u, o, this.atkStat(u) * 0.1, { special: true, kind: 'vest' });
      }
    }
    if (it['silver-wing']) {
      const others = this.units.filter(o => o !== t && this.canTarget(u, o)).sort((a, b) => Hex.dist(u.r, u.c, a.r, a.c) - Hex.dist(u.r, u.c, b.r, b.c) || a.uid - b.uid).slice(0, 2 * it['silver-wing']);
      for (const o of others) {
        this.emit({ type: 'attack', uid: u.uid, target: o.uid, ranged: true, special: u.special });
        this.dealDamage(u, o, raw * 0.6, { special: u.special, kind: 'proj' });
      }
    }
  }
};

Object.assign(CombatSim.prototype, ITEM_FX);
