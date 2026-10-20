const AUG_VAMP = { shaymin1: [0.12, 200], shaymin2: [0.18, 400], shaymin3: [0.25, 1000] };
const AUG_THRILL = { thrill1: 220, thrill2: 500 };
const AUG_EXILE = { exiles1: 0.2, exiles2: 0.3 };
const AUG_SHELLBREAK = { shellbreak1: 0.17, shellbreak2: 0.3 };
const AUG_BUDDY = { buddy1: [0.1, 13], buddy2: [0.15, 22] };
const AUG_LOOT = { spoils1: 0.25, spoils2: 0.3, spoils3: 0.4 };

function augHelmetBonus(stage) {
  return Math.min(1.7, 0.2 + 0.3 * Math.max(0, (stage || 2) - 2));
}

const AUG_FX = {
  augFront(side, r) {
    return side === 'A' ? r <= 5 : r >= 2;
  },

  augBackRow(side, r) {
    return side === 'A' ? r === BOARD_ROWS - 1 : r === 0;
  },

  augFrontCenter(side) {
    return side === 'A' ? [4, 3] : Hex.mirror(4, 3);
  },

  augPick(list, key) {
    for (const id in key) if (list.includes(id)) return key[id];
    return null;
  },

  augItemMods(u) {
    const T = this.teams && this.teams[u.side];
    const list = (T && T.augs) || [];
    const X = (T && T.augX) || {};
    const A = this.side && this.side[u.side] ? this.side[u.side].aug : null;
    const it = u.it || {};
    const m = { hp: 0, as: 0, pa: 0, sa: 0, def: 0 };
    if (list.length) {
      if (list.includes('yoshhelp')) m.hp += 85 * (it['leftovers'] || 0);
      if (list.includes('gardhelp')) m.as += 0.05 * (it['wise-glasses'] || 0);
      if (list.includes('harihelp')) m.as += 0.05 * (it['muscle-band'] || 0);
      if (list.includes('deadlyband')) m.pa += 0.01 * (A ? A.band : X.band || 0) * (it['choice-band'] || 0);
      if (list.includes('deadlyspecs')) m.sa += 0.01 * (A ? A.specs : X.specs || 0) * (it['choice-specs'] || 0);
      const mk = list.includes('makeshift2') ? 50 : list.includes('makeshift1') ? 30 : 0;
      if (mk && !(u.items || []).length) m.def += mk;
    }
    const o = u.augItem || { hp: 0, as: 0, pa: 0, sa: 0, def: 0 };
    u.flatHp += m.hp - o.hp;
    u.pct.as += m.as - o.as;
    u.pct.pa += m.pa - o.pa;
    u.pct.sa += m.sa - o.sa;
    u.flatArmor += m.def - o.def;
    u.flatMr += m.def - o.def;
    u.augItem = m;
  },

  augInit(side, units) {
    const T = this.teams[side];
    const st = this.side[side];
    st.aug = null;
    for (const u of units) {
      if (!u.augOne) continue;
      u.pct.hp += 0.01 * u.augOne;
      u.pct.pa += 0.015 * u.augOne;
      u.pct.sa += 0.015 * u.augOne;
    }
    const list = (T && T.augs) || [];
    if (!list.length) return;
    const X = T.augX || {};
    const has = id => list.includes(id);
    const A = {
      has: new Set(list),
      sec: 0,
      secN: 0,
      gold: 0,
      lootN: 0,
      xp: 0,
      firstKill: null,
      band: X.band || 0,
      specs: X.specs || 0,
      bandGain: 0,
      specsGain: 0,
      chaosPP: 0,
      soulMax: false,
      ascDone: !has('ascend'),
      wishDone: !has('wishful'),
      lost: X.lost || 0,
      loot: this.augPick(list, AUG_LOOT) || 0,
      thrill: this.augPick(list, AUG_THRILL) || 0,
      overCap: (this.augPick(list, AUG_VAMP) || [0, 0])[1],
      helmet: has('bumpy') ? augHelmetBonus(X.stage) : 0,
      rocket: !!X.rocket,
      solo: !!X.solo
    };
    st.aug = A;
    const both = (u, k) => {
      u.pct.pa += k;
      u.pct.sa += k;
    };
    const front = u => this.augFront(side, u.r);
    const nb = u => units.filter(o => o !== u && Hex.dist(o.r, o.c, u.r, u.c) === 1);
    const fronts = units.filter(front).length;
    const smalls = units.filter(u => u.cost <= 2).length;
    const copies = {};
    for (const u of units) if (u.unitId) copies[u.unitId] = (copies[u.unitId] || 0) + 1;
    const [fr, fc] = this.augFrontCenter(side);
    const vamp = this.augPick(list, AUG_VAMP);
    const sb = this.augPick(list, AUG_SHELLBREAK);
    const buddy = this.augPick(list, AUG_BUDDY);
    const bronze = X.bronze || 0;
    const anyFive = units.some(u => u.cost >= 5);
    const trio = has('trio') ? this.rng.shuffle(units.filter(u => u.cost === 3)).slice(0, 3) : [];
    for (const u of units) {
      if (vamp) u.vamp += vamp[0];
      if (has('formation') && !front(u)) {
        u.pct.sa += 0.1 * fronts;
        u.pct.pa += 0.09 * fronts;
      }
      if (has('shrink')) {
        u.pct.as += 0.3;
        u.mvMul *= 1.3;
      }
      if (bronze && (has('bronze1') || has('bronze2'))) {
        u.amp += 0.025 * bronze;
        if (has('bronze2')) {
          u.flatArmor += 4 * bronze;
          u.flatMr += 4 * bronze;
        }
      }
      if (has('comeback') && A.lost) {
        u.flatHp += 5 * A.lost;
        u.pct.as += 0.004 * A.lost;
      }
      if (has('lotus1') || has('lotus2')) u.rk.crit += 1;
      if (has('lotus2')) u.critDmg += 0.1;
      if (has('bigstrong')) {
        u.flatHp += 200;
        u.pct.hp += 0.1;
      }
      if (has('lateclass') && u.cost >= 5) {
        u.pct.hp += 0.12;
        u.pct.as += 0.12;
      }
      if (has('earlyedu')) both(u, (0.08 + 0.01 * (X.edu || 0)) * (u.cost === 1 ? 2 : 1));
      if (has('haste')) u.hasteUntil = 3;
      if (has('littlebuddies') && u.cost >= 4 && smalls) {
        u.flatHp += 55 * smalls;
        u.pct.as += 0.06 * smalls;
      }
      if (sb && this.augBackRow(side, u.r)) u.amp += sb;
      if (has('polymath')) {
        u.pct.sa += 0.08;
        u.flatArmor += 6;
      }
      if (has('soulbeat')) {
        u.flatHp += 44;
        both(u, 0.04);
        u.flatArmor += 4;
        u.flatMr += 4;
        u.pct.as += 0.04;
      }
      if (trio.includes(u)) {
        u.flatHp += 220;
        u.pct.as += 0.2;
      }
      if (has('doublebattle') && u.unitId && copies[u.unitId] === 2) {
        both(u, 0.3);
        u.pct.armor += 0.3;
        u.pct.mr += 0.3;
      }
      if (has('gildedsteel') && anyFive && u.cost <= 4) u.dura += 0.08;
      if (buddy) {
        const n = nb(u);
        if (n.length === 1 && nb(n[0]).length === 1) {
          u.pct.as += buddy[0];
          u.flatArmor += buddy[1];
        }
      }
      if (has('crownweight') && u.it && u.it['kings-rock'] && !units.some(o => o !== u && o.r === u.r)) u.pct.hp += 0.2;
      if (A.solo) {
        u.pct.hp += 2;
        both(u, 2);
      }
      if (has('swordsdance')) u.pct.pa += 0.1;
      if (has('calmmind')) u.pct.sa += 0.1;
      if (has('laststand') && u.r === fr && u.c === fc) {
        u.amp += 0.15;
        u.pct.hp += 0.25;
      }
      if (has('boxing')) u.flatHp += 30 * fronts;
      if (has('shellup') && u.it && u.it['shell-bell']) u.pct.pa += 0.1;
    }
  },

  augPost(side, units) {
    const A = this.side[side].aug;
    if (!A) return;
    const has = id => A.has.has(id);
    const exile = this.augPick(Array.from(A.has), AUG_EXILE);
    const sb = this.augPick(Array.from(A.has), AUG_SHELLBREAK);
    const big = has('bigfriend') ? units.filter(o => o.maxHp >= 1750) : [];
    for (const u of units) {
      if (exile && !units.some(o => o !== u && Hex.dist(o.r, o.c, u.r, u.c) === 1)) this.timedShield(u, u.maxHp * exile, 10);
      if (has('chaos') && u.traits.includes('주문술사') && !u.experiment) u.mana = Math.min(u.maxMana, u.mana + 15);
      if (has('soulbeat') && !u.experiment) u.mana = Math.min(u.maxMana, u.mana + 4);
      if (has('shellup') && u.it && u.it['shell-bell']) {
        u.hp = Math.max(1, Math.round(u.hp - u.maxHp * 0.2));
        this.addShield(u, u.maxHp * 0.3);
      }
      if (sb && this.augBackRow(side, u.r)) u.hp = Math.max(1, Math.round(u.maxHp * 0.8));
      if (big.length && big.some(o => o !== u && Hex.dist(o.r, o.c, u.r, u.c) === 1)) u.dura += 0.1;
    }
  },

  augRegen(u, n) {
    if (!u.alive || n <= 0 || u.experiment || u.egg || u.casting || u.channel) return;
    u.mana = Math.min(u.maxMana, u.mana + (u.ppFreezeUntil > this.time ? n * 0.5 : n));
  },

  augTick(dt) {
    for (const side of ['A', 'B']) {
      const A = this.side[side].aug;
      if (!A) continue;
      const has = id => A.has.has(id);
      if (!A.ascDone && this.time >= 12) {
        A.ascDone = true;
        const allies = this.aliveOf(side);
        for (const u of allies) u.amp += 0.35;
        this.emit({ type: 'augfx', side, kind: 'ascend', uids: allies.map(u => u.uid) });
      }
      if (!A.wishDone && this.time >= 10) {
        A.wishDone = true;
        const allies = this.aliveOf(side);
        for (const u of allies) this.heal(u, (u.maxHp - u.hp) * 0.4, u);
        this.emit({ type: 'augfx', side, kind: 'wish', uids: allies.map(u => u.uid) });
      }
      A.sec += dt;
      while (A.sec >= 1) {
        A.sec -= 1;
        A.secN += 1;
        const n = A.secN;
        const allies = this.aliveOf(side);
        if (has('soulawaken') && n <= 10) {
          for (const u of allies) {
            u.pct.pa += 0.02;
            u.pct.sa += 0.02;
          }
          if (n === 10) {
            A.soulMax = true;
            this.emit({ type: 'augfx', side, kind: 'soul', uids: allies.map(u => u.uid) });
          }
        }
        if (has('wootears')) for (const u of allies) this.augRegen(u, this.time >= 12 ? 3 : 1);
        if (has('heartup')) for (const u of allies) if (u.it && u.it['soul-dew'] && u.pct.sa >= 0.9) this.augRegen(u, 2);
        if (n % 5 === 0) {
          for (const u of allies) {
            if (has('swordsdance')) u.pct.pa += 0.05;
            if (has('calmmind')) u.pct.sa += 0.05;
          }
        }
        if (has('mindlink') && n % 4 === 0) {
          const k = 0.05 + 0.005 * Math.floor(A.lost / 10);
          for (const u of allies) this.heal(u, u.maxHp * k, u);
        }
      }
    }
  },

  augAfterCast(u, used) {
    const A = this.side[u.side].aug;
    if (!A || !A.has.has('chaos') || !u.traits.includes('주문술사')) return;
    A.chaosPP += used || 0;
    while (A.chaosPP >= 150) {
      A.chaosPP -= 150;
      const foes = this.aliveOf(this.enemyOf(u.side)).filter(e => !e.hidden);
      this.emit({ type: 'augfx', side: u.side, kind: 'chaos', uids: foes.map(e => e.uid) });
      for (const e of foes) this.dealDamage(u.alive ? u : null, e, e.maxHp * 0.1, { special: true, kind: 'chaos' });
    }
  },

  augOnKill(t) {
    const mine = this.side[t.side].aug;
    if (mine && mine.has.has('useful') && t.unitId && !t.creep && !(t.items || []).length && this.rng.next() < 0.4) {
      mine.gold += 1;
      this.emit({ type: 'gold', target: t.uid, amount: 1 });
    }
    const side = this.enemyOf(t.side);
    const A = this.side[side].aug;
    if (!A) return;
    const champ = !!t.unitId && !t.creep;
    if (A.thrill) {
      let best = null;
      let bd = Infinity;
      for (const a of this.aliveOf(side)) {
        const d = Hex.dist(a.r, a.c, t.deathR, t.deathC);
        if (d < bd || (d === bd && best && a.uid < best.uid)) {
          best = a;
          bd = d;
        }
      }
      if (best) this.heal(best, A.thrill, best);
    }
    if (A.loot && this.rng.next() < A.loot) {
      A.lootN += 1;
      this.emit({ type: 'augfx', side, kind: 'loot', uids: [t.uid] });
    }
    if (A.rocket && champ) {
      A.gold += 2;
      this.emit({ type: 'gold', target: t.uid, amount: 2 });
    }
    if (champ && A.firstKill == null) A.firstKill = t.unitId;
    if (A.solo && t.killedBy && t.killedBy.side === side) A.xp += 1;
    const band = A.has.has('deadlyband');
    const specs = A.has.has('deadlyspecs');
    const haste = A.has.has('haste');
    if (!band && !specs && !haste) return;
    for (const uid of t.damagers) {
      const k = this.byUid[uid];
      if (!k || k.side !== side || !k.alive) continue;
      if (band && k.it && k.it['choice-band']) {
        A.band += 1;
        A.bandGain += 1;
        this.augItemMods(k);
      }
      if (specs && k.it && k.it['choice-specs']) {
        A.specs += 1;
        A.specsGain += 1;
        this.augItemMods(k);
      }
      if (haste) {
        k.hasteUntil = this.time + 3;
        const next = this.nearestEnemy(k);
        if (next && !k.gyaraFx && !k.channel && this.distTo(k, next) > k.range) {
          this.dash(k, next);
          this.setTarget(k, next);
        }
      }
    }
  },

  augOnBasic(u, t, dmg) {
    const A = this.side[u.side].aug;
    if (!A || !A.has.has('energywave')) return;
    u.augHits += 1;
    if (u.augHits % 5 === 0 && t.alive) {
      this.emit({ type: 'hitfx', target: t.uid, kind: '전기' });
      this.dealDamage(u, t, dmg * 2, { trueDmg: true, kind: 'energy' });
    }
  },

  augOnHeal(t, src, over) {
    const A = this.side[t.side].aug;
    if (!A || !A.overCap || !(over > 0) || t.augShield >= A.overCap) return;
    const add = Math.min(over, A.overCap - t.augShield);
    t.augShield += add;
    t.shield += add;
    t.shieldPeak = Math.max(t.shieldPeak, t.shield);
  },

  augAfterDamage(src, t, total) {
    const A = this.side[src.side].aug;
    if (!A || !A.soulMax || !(total > 0)) return;
    this.dealDamage(src, t, total * 0.12, { trueDmg: true, kind: 'soul' });
  },

  augVamp(src, t) {
    const A = this.side[src.side].aug;
    return A && A.has.has('kindling') && t.burnUntil > this.time ? 0.12 : 0;
  },

  augHelmet(t) {
    const A = this.side[t.side].aug;
    return A ? A.helmet : 0;
  }
};

Object.assign(CombatSim.prototype, AUG_FX);
