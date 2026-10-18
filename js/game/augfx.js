const AUG_FX = {
  augFront(side, r) {
    return side === 'A' ? r <= 5 : r >= 2;
  },

  augCenter(side) {
    return side === 'A' ? [5, 3] : [2, 3];
  },

  augInit(side, units) {
    const T = this.teams[side];
    const st = this.side[side];
    for (const u of units) {
      if (u.augHp) u.flatHp += u.augHp;
      if (u.augTrain) {
        u.pct.pa += u.augTrain;
        u.pct.sa += u.augTrain;
      }
    }
    const list = (T && T.augs) || [];
    st.aug = null;
    if (!list.length) return;
    const has = id => list.includes(id);
    const v = (key, field) => augVal(list, key, field);
    const A = { has: new Set(list) };
    st.aug = A;
    const tiers = (T && T.tiers) || {};
    const activeIds = Object.keys(tiers).filter(id => tiers[id] > 0);
    const traitOn = u => u.types.concat(u.traits || []).some(id => tiers[id] > 0);
    const alone = u => !units.some(o => o !== u && Hex.dist(o.r, o.c, u.r, u.c) === 1);
    const copies = {};
    for (const u of units) copies[u.unitId] = (copies[u.unitId] || 0) + 1;
    const both = (u, k) => {
      u.pct.pa += k;
      u.pct.sa += k;
    };
    const anyBig = units.some(u => u.cost >= 4);
    const [cr, cc] = this.augCenter(side);
    let farA = null;
    let farB = null;
    if (has('longpals') && units.length >= 2) {
      let best = -1;
      for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
          const d = Hex.dist(units[i].r, units[i].c, units[j].r, units[j].c);
          if (d > best) {
            best = d;
            farA = units[i];
            farB = units[j];
          }
        }
      }
    }
    const itemKinds = new Set();
    for (const u of units) for (const id of u.items || []) itemKinds.add(id);
    const bronzeN = activeIds.filter(id => tiers[id] === 1 && TRAIT_DATA.map[id] && TRAIT_DATA.map[id].kind !== 'unique').length;
    for (const u of units) {
      const front = this.augFront(side, u.r);
      const items = (u.items || []).length > 0;
      if (v('cyber', 'hp') && items) {
        u.flatHp += v('cyber', 'hp');
        both(u, v('cyber', 'pct'));
        u.augPP2 = v('cyber', 'pp');
      }
      if (v('feather', 'as') && u.cost <= 2) {
        u.pct.as += v('feather', 'as');
        u.rk.spe += v('feather', 'spe');
      }
      if (v('bigfriend', 'red') && anyBig) u.taken *= 1 - v('bigfriend', 'red');
      if (v('double', 'pct') && copies[u.unitId] === 2) {
        const k = v('double', 'pct');
        both(u, k);
        u.pct.armor += k;
        u.pct.mr += k;
      }
      if (v('triforce', 'hp') && u.cost === 3) {
        u.flatHp += v('triforce', 'hp');
        u.pct.as += v('triforce', 'as');
      }
      if (v('pumping', 'as')) u.pct.as += v('pumping', 'as') + v('pumping', 'per') * (T.augPump || 0);
      if (v('united', 'per')) both(u, v('united', 'per') * activeIds.length);
      if (v('scoped', 'range') && !front) {
        u.range += v('scoped', 'range');
        u.pct.as += v('scoped', 'as');
      }
      if (v('glass', 'hp') && !front) {
        u.pct.hp -= v('glass', 'hp');
        u.amp += v('glass', 'amp');
      }
      if (v('celestial', 'vamp')) u.vamp += v('celestial', 'vamp');
      if (v('unified', 'def')) {
        u.flatArmor += v('unified', 'def');
        u.flatMr += v('unified', 'def');
        u.augDefLow = v('unified', 'def');
      }
      if (v('firstaid', 'mod')) {
        u.healMod += v('firstaid', 'mod');
        u.shieldMod += v('firstaid', 'mod');
      }
      if (v('built', 'hp') && !traitOn(u)) {
        u.flatHp += v('built', 'hp');
        u.pct.as += v('built', 'as');
      }
      if (v('distance', 'pct') && alone(u)) both(u, v('distance', 'pct'));
      if (v('knife', 'pct') && front) both(u, v('knife', 'pct'));
      if (v('lotus', 'crit')) u.critAdd += v('lotus', 'crit');
      for (const tr of T.augSoul || []) if (u.types.includes(tr) || (u.traits || []).includes(tr)) u.flatHp += 150;
      if (has('makeshift') && !items) {
        u.flatArmor += 20;
        u.flatMr += 20;
      }
      if (has('twohealthy') && u.star === 2) u.flatHp += 120;
      if (has('twotanky') && u.star === 2) u.flatHp += 250;
      if (has('center') && u.r === cr && u.c === cc) {
        u.amp += 0.2;
        u.flatHp += 150;
      }
      if (has('tonsstats')) {
        u.flatHp += 60;
        both(u, 0.06);
        u.pct.armor += 0.06;
        u.pct.mr += 0.06;
        u.pct.as += 0.06;
      }
      if (u === farA || u === farB) {
        u.pct.hp += 0.15;
        both(u, 0.15);
      }
      if (T.augExpected) both(u, T.augExpected);
      if (has('lonehero') && units.length === 1) {
        u.pct.hp += 2;
        both(u, 2);
      }
      if (has('collector')) {
        u.flatHp += 15 * itemKinds.size;
        u.amp += 0.01 * itemKinds.size;
      }
      if (has('reckoning') && T.augReckon) u.amp += 0.25 * T.augReckon;
      if (has('bronze') && bronzeN) {
        u.flatHp += 40 * bronzeN;
        u.amp += 0.03 * bronzeN;
      }
    }
    A.battery = v('battery', 'pp');
    A.electro = v('electro', 'dmg');
    A.spoils = v('spoils', 'ch') ? { ch: v('spoils', 'ch'), cap: v('spoils', 'cap'), n: 0 } : null;
    A.thrill = v('thrill', 'heal');
    A.thrillAs = v('thrill', 'as');
    A.celCap = v('celestial', 'cap');
    A.exiles = v('exiles', 'sh');
    A.manaflow = v('manaflow', 'pp');
    A.sunAt = has('sunfire') ? 0 : -1;
    A.windDone = !has('secondwind');
    A.ascDone = !has('ascension');
    A.ppAcc = 0;
  },

  augPost(side, units) {
    const A = this.side[side].aug;
    if (!A) return;
    for (const u of units) {
      if (A.exiles && !units.some(o => o !== u && Hex.dist(o.r, o.c, u.r, u.c) === 1)) this.timedShield(u, u.maxHp * A.exiles, 8);
      if (A.has.has('urf') && !u.experiment) u.maxMana = Math.max(4, Math.round(u.maxMana * 0.75));
      if (A.manaflow && !u.experiment) u.mana = Math.min(u.maxMana, u.mana + A.manaflow);
    }
  },

  augTick(dt) {
    for (const side of ['A', 'B']) {
      const A = this.side[side].aug;
      if (!A) continue;
      const allies = this.aliveOf(side);
      if (A.sunAt >= 0 && this.time >= A.sunAt) {
        A.sunAt += 5;
        const foes = this.aliveOf(this.enemyOf(side)).filter(e => !e.hidden);
        const src = allies.length ? allies[this.rng.int(allies.length)] : null;
        for (let i = 0; i < 2 && foes.length; i++) {
          const e = foes.splice(this.rng.int(foes.length), 1)[0];
          this.addBurn(e, src, 3);
          e.antiHeal = Math.max(e.antiHeal || 0, 0.33);
          e.antiHealUntil = Math.max(e.antiHealUntil, this.time + 3);
          this.emit({ type: 'hitfx', target: e.uid, kind: '불꽃' });
        }
      }
      if (!A.windDone && this.time >= 10) {
        A.windDone = true;
        for (const u of allies) this.heal(u, (u.maxHp - u.hp) * 0.4, u);
        this.emit({ type: 'augfx', side, kind: 'secondwind' });
      }
      if (!A.ascDone && this.time >= 15) {
        A.ascDone = true;
        for (const u of allies) u.amp += 0.5;
        this.emit({ type: 'augfx', side, kind: 'ascension' });
      }
      A.ppAcc += dt;
      if (A.ppAcc >= 2) {
        A.ppAcc -= 2;
        for (const u of allies) if (u.augPP2) this.gainPP(u, u.augPP2);
      }
    }
  },

  augAfterCast(u) {
    const A = this.side[u.side].aug;
    if (!A || !u.alive) return;
    if (A.battery && !u.experiment) u.mana = Math.min(u.maxMana, u.mana + A.battery);
    if (A.has.has('transfusion')) {
      let best = null;
      for (const a of this.aliveOf(u.side)) if (a !== u && !a.experiment && (!best || a.hp / a.maxHp < best.hp / best.maxHp)) best = a;
      if (best) best.mana = Math.min(best.maxMana, best.mana + 5);
    }
  },

  augOnKill(t) {
    const k = t.killedBy;
    const mine = this.side[t.side].aug;
    if (mine && mine.has.has('epitaph')) {
      let best = null;
      for (const a of this.aliveOf(t.side)) if (!best || a.hp / a.maxHp < best.hp / best.maxHp) best = a;
      if (best) this.timedShield(best, best.maxHp * 0.25, 4);
    }
    if (!k || k.side === t.side) return;
    const A = this.side[k.side].aug;
    if (!A) return;
    if (A.thrill && k.alive) {
      this.heal(k, A.thrill, k);
      if (A.thrillAs) k.pct.as += A.thrillAs;
    }
    if (A.spoils && A.spoils.n < A.spoils.cap && this.rng.next() < A.spoils.ch) {
      A.spoils.n += 1;
      this.side[k.side].augGold = (this.side[k.side].augGold || 0) + 1;
      this.emit({ type: 'gold', target: k.uid, amount: 1 });
    }
  },

  augElectro(t) {
    const A = this.side[t.side].aug;
    if (!A || !A.electro || t.augElecCd > this.time) return;
    t.augElecCd = this.time + 0.5;
    this.emit({ type: 'hitfx', target: t.uid, kind: '전기' });
    for (const e of this.aliveOf(this.enemyOf(t.side))) {
      if (e.hidden || Hex.dist(e.r, e.c, t.r, t.c) > 1) continue;
      this.dealDamage(t, e, A.electro, { special: true, kind: 'electro' });
    }
  },

  augOnHeal(t, src, over) {
    const A = this.side[t.side].aug;
    if (!A) return;
    if (A.celCap && over > 0 && t.celShield < A.celCap) {
      const add = Math.min(over, A.celCap - t.celShield);
      t.celShield += add;
      t.shield += add;
    }
    if (A.has.has('censer') && src && src !== t && src.side === t.side && !(t.censerUntil > this.time)) {
      t.censerUntil = this.time + 3;
      t.tmp.push({ k: 'spe', n: 1, until: this.time + 3 });
    }
  },

  augOnBasic(u, t) {
    const A = this.side[u.side].aug;
    if (!A || !A.has.has('weakspot') || !t.alive) return;
    t.antiHeal = Math.max(t.antiHealUntil > this.time ? t.antiHeal : 0, 0.33);
    t.antiHealUntil = Math.max(t.antiHealUntil, this.time + 3);
  }
};

Object.assign(CombatSim.prototype, AUG_FX);
