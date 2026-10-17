const ITEM_RANK_KEYS = ['atk', 'spa', 'def', 'spd', 'spe', 'crit'];
const ITEM_AURA = ['full-incense', 'lax-incense', 'flame-orb'];

const ITEM_FX = {
  applyItems(u, spec) {
    u.items = (spec.items || []).filter(id => id !== 'magnet' && typeof itemDef === 'function' && itemDef(id));
    const it = {};
    for (const id of u.items) it[id] = (it[id] || 0) + 1;
    u.it = it;
    u.itemPP = 0;
    u.itemTick = { regen: 0, dew: 0, vest: 0, aura: 0 };
    u.boostStacks = 0;
    u.kingN = 0;
    u.dewPct = 0;
    u.scarfPct = 0;
    u.vestRanks = 0;
    if (!u.items.length) return;
    const n = id => it[id] || 0;
    if (spec.evolvable && n('eviolite')) {
      for (const k of ['hp', 'pa', 'sa', 'armor', 'mr']) u.base[k] = Math.round(u.base[k] * 1.2);
    }
    for (const id of u.items) {
      const s = itemDef(id).stats || {};
      for (const k of ITEM_RANK_KEYS) if (s[k]) u.rk[k] += s[k];
      if (s.hp) u.flatHp += s.hp;
      if (s.pp) u.itemPP += s.pp;
    }
    u.pct.pa += 0.3 * n('choice-band');
    u.pct.sa += 0.25 * n('choice-specs');
    u.vamp += 0.4 * n('shell-bell');
    u.pct.hp += 0.2 * n('big-root');
    if (n('zoom-lens')) {
      u.range += n('zoom-lens');
      u.ranged = u.range > 1;
    }
    if (n('mental-herb')) {
      u.ccImmuneUntil = 18;
      u.herbGuard = true;
    }
    u.skillCritPa = n('punching-glove');
    u.skillCritSa = n('black-glasses');
    u.alwaysCrit = n('scope-lens') > 0;
    u.critGuard = n('shell-armor') > 0;
    u.cloakReady = n('covert-cloak') > 0;
    u.sashReady = n('focus-sash') > 0;
    u.wpReady = n('weakness-policy') > 0;
    u.hasAura = ITEM_AURA.some(id => n(id));
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
    if (it['choice-scarf']) {
      u.pct.as += 0.03 * it['choice-scarf'];
      u.scarfPct += 3 * it['choice-scarf'];
    }
    if (it['booster-energy'] && dmg > 0) this.boostStack(u);
    if (it['kings-rock'] && t.alive && this.rng.next() < 0.3) this.stun(t, 1.5, u.side, 'flinch');
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
