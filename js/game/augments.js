const AUG_LINE_KEYS = ['rolling', 'cyber', 'feather', 'bigfriend', 'double', 'triforce', 'battery', 'electro', 'exiles', 'training', 'manaflow', 'spoils', 'pumping', 'united', 'scoped', 'thrill', 'glass', 'celestial', 'unified', 'firstaid', 'built', 'distance', 'knife', 'lotus'];

const AUG_LV = {
  cyber: { hp: [120, 220, 350], pct: [0.06, 0.1, 0.15], pp: [0, 0, 3] },
  feather: { as: [0.15, 0.25, 0.4], spe: [1, 2, 3] },
  bigfriend: { red: [0.06, 0.1, 0.16] },
  double: { pct: [0.15, 0.25, 0.4] },
  triforce: { hp: [150, 250, 400], as: [0.1, 0.18, 0.28] },
  battery: { pp: [4, 16, 24] },
  electro: { dmg: [60, 110, 180] },
  exiles: { sh: [0.2, 0.35, 0.55] },
  training: { step: [0.01, 0.015, 0.02], cap: [0.15, 0.25, 0.4] },
  manaflow: { pp: [10, 20, 30] },
  spoils: { ch: [0.15, 0.25, 0.4], cap: [999, 5, 8] },
  pumping: { as: [0.05, 0.08, 0.12], per: [0.005, 0.01, 0.015] },
  united: { per: [0.015, 0.025, 0.04] },
  scoped: { range: [1, 1, 2], as: [0.06, 0.12, 0.2] },
  thrill: { heal: [250, 450, 700], as: [0, 0, 0.1] },
  glass: { hp: [0.1, 0.2, 0.25], amp: [0.13, 0.25, 0.4] },
  celestial: { vamp: [0.08, 0.15, 0.25], cap: [200, 350, 600] },
  unified: { def: [8, 14, 22] },
  firstaid: { mod: [0.15, 0.3, 0.5] },
  built: { hp: [200, 350, 500], as: [0.25, 0.45, 0.65] },
  distance: { pct: [0.12, 0.22, 0.35] },
  knife: { pct: [0.12, 0.22, 0.35] },
  lotus: { crit: [0.1, 0.2, 0.35] },
  rolling: { n: [1, 2, 3] }
};

function augLineOf(id) {
  const m = /^([a-z]+)([123])$/.exec(id);
  return m && AUG_LINE_KEYS.includes(m[1]) ? m[1] : null;
}

function augLevelIn(list, key) {
  let lv = 0;
  for (const a of list || []) {
    const id = typeof a === 'string' ? a : a.id;
    if (augLineOf(id) === key) lv = Math.max(lv, Number(id.slice(-1)));
  }
  return lv;
}

function augVal(list, key, field) {
  const lv = augLevelIn(list, key);
  return lv ? AUG_LV[key][field][lv - 1] : 0;
}

function augTraitPool() {
  return Object.keys(TRAIT_DATA.map).filter(id => {
    const td = TRAIT_DATA.map[id];
    return (td.kind === 'type' || td.kind === 'class') && (td.mode === 'count' || td.mode === 'normal');
  }).sort();
}

function augLabel(a) {
  const d = augDef(a.id);
  if (!d) return a.id;
  if (a.id === 'heart') return a.trait + '의 마음';
  if (a.id === 'soul') return a.trait + '의 영혼';
  if (a.id === 'crown') return a.trait + '의 왕관';
  if (a.id === 'archives') return d.name + ' (' + a.trait + ')';
  if (a.id === 'kitchen') return d.name + ' (' + (a.traits || []).join('·') + ')';
  return d.name;
}

function augText(a) {
  const d = augDef(a.id);
  if (!d) return '';
  if (a.id === 'heart') return a.trait + ' 시너지 +1';
  if (a.id === 'soul') return a.trait + ' 시너지 +1, ' + a.trait + ' 기물 체력 +150';
  if (a.id === 'crown') return a.trait + ' 시너지 +2';
  if (a.id === 'archives') return a.trait + ' 시너지 +1 + 큰 모으령 상자 1개';
  if (a.id === 'kitchen') return (a.traits || []).join(', ') + ' 시너지가 각각 +1';
  return d.desc;
}

const AUG_GAME = {
  hasAug(p, id) {
    return p.augs.some(a => a.id === id);
  },

  augLv(p, key) {
    return augLevelIn(p.augs, key);
  },

  augV(p, key, field) {
    return augVal(p.augs, key, field);
  },

  augRoundIndex() {
    const label = this.roundLabel();
    return AUG_ROUNDS.indexOf(label);
  },

  isAugRound() {
    return this.augRoundIndex() >= 0;
  },

  augOwnedBlock(p, id) {
    if (p.augs.some(a => a.id === id)) return true;
    const line = augLineOf(id);
    return !!line && p.augs.some(a => augLineOf(a.id) === line);
  },

  augChoice(p, id) {
    const c = { id };
    const pool = augTraitPool();
    if (AUG_TRAIT[id]) {
      if (id === 'kitchen') c.traits = this.pickDistinct(pool, 2);
      else c.trait = pool[this.rng.int(pool.length)];
    }
    return c;
  },

  augCandidates(p, tier, exclude) {
    return AUGMENTS.filter(d => d.tier === tier && !this.augOwnedBlock(p, d.id) && !(exclude || []).includes(d.id)).map(d => d.id);
  },

  makeAugOffer(p, tier) {
    const ids = this.pickDistinct(this.augCandidates(p, tier, []), 3);
    p.augOffer = { tier, choices: ids.map(id => this.augChoice(p, id)), rerolls: ids.map(() => false) };
  },

  startAugRound() {
    const idx = this.augRoundIndex();
    if (idx < 0) return;
    const tier = this.augPattern[idx];
    for (const p of this.alivePlayers()) {
      this.makeAugOffer(p, tier);
      if (!p.isHuman) this.pickAug(p, this.rng.int(p.augOffer.choices.length));
    }
    for (const p of this.alivePlayers()) if (p.isHuman && p.augOffer) this.notify(p, AUG_TIER_NAME[tier] + ' 증강을 고르세요', 'info');
  },

  rerollAug(p, n) {
    const o = p.augOffer;
    if (!o || !o.choices[n]) return { ok: false, reason: '' };
    if (o.rerolls[n]) return { ok: false, reason: '이미 새로고침한 증강입니다' };
    const pool = this.augCandidates(p, o.tier, o.choices.map(c => c.id));
    if (!pool.length) return { ok: false, reason: '바꿀 수 있는 증강이 없습니다' };
    o.choices[n] = this.augChoice(p, pool[this.rng.int(pool.length)]);
    o.rerolls[n] = true;
    this.emit('update');
    return { ok: true, reason: '' };
  },

  pickAug(p, n) {
    const o = p.augOffer;
    const c = o ? o.choices[n] : null;
    if (!c) return { ok: false, reason: '' };
    p.augOffer = null;
    p.augs.push(c);
    this.applyAugPick(p, c);
    this.augLevels(p);
    this.notify(p, '증강 획득: ' + augLabel(c), 'loot');
    this.emit('update');
    return { ok: true, reason: '' };
  },

  autoPickAugs() {
    for (const p of this.players) if (p.augOffer) this.pickAug(p, this.rng.int(p.augOffer.choices.length));
  },

  augItem(p, id) {
    if (!p.isHuman || !this.realtime) {
      this.giveItem(p, id);
      return;
    }
    const orb = this.makeItemOrb(id, 5 + this.rng.int(3), this.rng.int(4));
    p.orbs = (p.orbs || []).concat([orb]);
    this.emit('orbs');
  },

  augComps(p, n) {
    for (let i = 0; i < n; i++) this.augItem(p, this.randomComponent());
  },

  augDone(p, n) {
    for (let i = 0; i < n; i++) this.augItem(p, this.randomCompleted());
  },

  augTreasure(p, tier) {
    this.augItem(p, this.rng.pick(ITEMS.treasures[tier]));
  },

  addAugTrait(p, trait, n) {
    if (!trait) return;
    p.augTraits[trait] = (p.augTraits[trait] || 0) + n;
  },

  applyAugPick(p, c) {
    const S = p.augState;
    const id = c.id;
    if (AUG_TRAIT[id]) {
      if (c.traits) for (const t of c.traits) this.addAugTrait(p, t, 1);
      else this.addAugTrait(p, c.trait, AUG_TRAIT[id]);
    }
    if (augLineOf(id) === 'rolling') p.roundRolls = Math.max(p.roundRolls, AUG_LV.rolling.n[Number(id.slice(-1)) - 1]);
    if (id === 'rolling1') p.gold += 7;
    else if (id === 'archives') this.augItem(p, 'great-box');
    else if (id === 'compbag') this.augComps(p, 2);
    else if (id === 'bigbag') {
      this.augComps(p, 3);
      this.augItem(p, 'loaded-dice');
      p.gold += 2;
    } else if (id === 'heroicbag') {
      this.augDone(p, 2);
      this.augItem(p, 'loaded-dice');
      this.augItem(p, 'loaded-dice');
      p.gold += 6;
    } else if (id === 'windfall') p.gold += 8;
    else if (id === 'windfall3') p.gold += 30;
    else if (id === 'richer') p.interestBonus += 1;
    else if (id === 'richerplus') {
      p.gold += 12;
      p.interestBonus += 1;
    } else if (id === 'hedge') {
      p.gold += 20;
      p.interestBonus += 5;
    } else if (id === 'starter') {
      this.giveRandomUnit(p, 2);
      this.giveRandomUnit(p, 2);
      p.gold += 1;
    } else if (id === 'pbench') p.gold += 3;
    else if (id === 'patience') S.patienceFrom = this.roundSeq;
    else if (id === 'hyperroll') p.freeRolls += 6;
    else if (id === 'spree') p.freeRolls += p.level;
    else if (id === 'prismticket') p.freeRolls += 5;
    else if (id === 'teamup') {
      this.augComps(p, 1);
      this.augItem(p, 'loaded-dice');
    } else if (id === 'branching') {
      this.augComps(p, 1);
      this.augItem(p, 'magnet');
      p.gold += 3;
    } else if (id === 'corners') p.xpCut += 2;
    else if (id === 'pitems') this.augComps(p, 2);
    else if (id === 'gifts') this.augItem(p, 'great-box');
    else if (id === 'trove') {
      this.augTreasure(p, 1);
      this.augTreasure(p, 1);
    } else if (id === 'buried') S.buried = 4;
    else if (id === 'tinytitans') {
      p.maxHp += 20;
      p.hp += 20;
    } else if (id === 'tiniest') {
      p.maxHp += 30;
      p.hp += 30;
    } else if (id === 'recombob') this.recombobulate(p);
    else if (id === 'cape') p.extraSlots += 1;
    else if (id === 'tacrown') {
      p.extraSlots += 1;
      this.augComps(p, 2);
    } else if (id === 'waiting') {
      const r = this.giveRandomUnit(p, 1);
      S.waitId = r.def ? r.def.id : null;
      S.waitStart = this.roundSeq;
    } else if (id === 'itembag') {
      this.augDone(p, 1);
      this.augComps(p, 1);
    } else if (id === 'thinkfast') S.thinkUntil = this.roundSeq + 3;
    else if (id === 'pforge') this.augItem(p, 'forge-box');
    else if (id === 'lforge') S.lforgeAt = this.roundSeq + 5;
    else if (id === 'gloves') {
      p.boxSize = 6;
      this.augItem(p, 'great-box');
    } else if (id === 'relics') {
      this.augTreasure(p, 3);
      this.augTreasure(p, 2);
      this.augTreasure(p, 2);
    } else if (id === 'goldenegg') S.eggAt = this.roundSeq + 9;
    else if (id === 'phreaky') S.phreakyAt = this.roundSeq + 4;
    else if (id === 'level11') p.augLevel = 1;
    else if (id === 'pbox') {
      this.augItem(p, 'great-box');
      this.augItem(p, 'great-box');
    }
    if (p.hp > p.maxHp) p.hp = p.maxHp;
  },

  augUnit(p, cost, star) {
    const list = this.baseCandidates(p, cost);
    if (!list.length) {
      p.gold += cost * copiesForStar(star);
      return null;
    }
    const def = this.rng.pick(list);
    const inst = this.addUnit(p, def.id, star);
    if (!inst) p.gold += cost * copiesForStar(star);
    return inst;
  },

  recombobulate(p) {
    for (const inst of p.boardUnits()) {
      const def = UNITS[inst.unitId];
      if (!def || def.cost >= 5) continue;
      const list = this.baseCandidates(p, def.cost + 1);
      if (!list.length) continue;
      const nd = this.rng.pick(list);
      const loc = Object.assign({}, inst.loc);
      const items = (inst.items || []).slice();
      p.remove(inst);
      const ni = newInstance(nd.id, inst.star);
      ni.items = items;
      p.setAt(loc, ni);
    }
    this.mergeAll(p);
  },

  pandoraBench(p) {
    for (let i = 0; i < 4; i++) {
      const inst = p.unitAt({ zone: 'bench', i });
      if (!inst) continue;
      const def = UNITS[inst.unitId];
      if (!def || !def.shop) continue;
      const list = this.baseCandidates(p, def.cost).filter(d => d.id !== def.id);
      if (!list.length) continue;
      const nd = this.rng.pick(list);
      const items = (inst.items || []).slice();
      p.remove(inst);
      const ni = newInstance(nd.id, inst.star);
      ni.items = items;
      p.setAt({ zone: 'bench', i }, ni);
    }
  },

  augRoundStart(p) {
    const S = p.augState;
    if (!p.augs.length) return;
    const has = id => this.hasAug(p, id);
    p.roundRolls = this.augV(p, 'rolling', 'n');
    if (S.lastSeq !== undefined && has('patience') && S.patienceFrom <= S.lastSeq && !S.rolled) {
      p.addXp(3);
      p.gold += 1;
    }
    S.rolled = false;
    S.lastSeq = this.roundSeq;
    if (this.augLv(p, 'pumping')) S.pump += 1;
    if (S.buried > 0) {
      S.buried -= 1;
      this.augComps(p, 1);
    }
    if (S.lforgeAt && this.roundSeq >= S.lforgeAt) {
      S.lforgeAt += 5;
      this.augItem(p, 'great-box');
    }
    if (S.eggAt && this.roundSeq >= S.eggAt) {
      S.eggAt = 0;
      for (let i = 0; i < 3; i++) this.augItem(p, 'great-box');
      p.gold += 60;
      this.notify(p, '황금 알이 부화했습니다!', 'loot');
    }
    if (S.phreakyAt && this.roundSeq >= S.phreakyAt) {
      S.phreakyAt = 0;
      this.augUnit(p, 4, 2);
      p.gold += 25;
      this.notify(p, '기괴한 금요일!', 'loot');
    }
    if (has('magicdice')) this.augItem(p, 'loaded-dice');
    if (has('waiting') && S.waitId && S.waitStart < this.roundSeq) {
      if (p.freeBenchSlot() >= 0 || this.countMergeable(p, S.waitId, 1) >= 2) this.addUnit(p, S.waitId, 1);
    }
    if (has('pitems')) p.items = p.items.map(x => (isConsumable(x) ? x : this.reforgeId(x)));
    if (has('pbox')) p.items = p.items.map(x => (itemDef(x) && itemDef(x).kind === 'completed' ? this.reforgeId(x) : x));
    if (has('pbench')) this.pandoraBench(p);
    if (has('metabolic')) p.hp = Math.min(p.maxHp, p.hp + 1);
    if (has('tiniest')) p.gold += 1;
    if (has('money') && this.roundInfo().type === 'pve') p.gold += 4;
    if (has('wellness')) for (const u of p.boardUnits()) u.augHp = (u.augHp || 0) + 12;
    this.augLevels(p);
  },

  augLevels(p) {
    const ups = p.levelUps.splice(0);
    for (const lv of ups) {
      if (this.hasAug(p, 'lategame') && lv >= 9 && !p.augState.lategame) {
        p.augState.lategame = true;
        p.gold += 30;
        this.notify(p, '후반 전문가: 30골드', 'loot');
      }
      if (this.hasAug(p, 'birthday')) this.augUnit(p, Math.max(1, Math.min(5, lv - 3)), 2);
    }
  },

  augBeforeCombat(p) {
    if (this.hasAug(p, 'clearmind') && !p.benchUnits().length) {
      p.addXp(3);
      this.augLevels(p);
    }
  },

  augAfterCombat(p, sim, side, result, pvp) {
    if (!p.augs.length) return;
    const S = p.augState;
    const has = id => this.hasAug(p, id);
    const st = sim.side[side];
    if (st.augGold) p.gold += st.augGold;
    const step = this.augV(p, 'training', 'step');
    if (step) {
      const cap = this.augV(p, 'training', 'cap');
      for (const u of sim.units) {
        if (u.side !== side || !u.alive || !u.iid) continue;
        const inst = p.findInstance(u.iid);
        if (inst) inst.augTrain = Math.min(cap, (inst.augTrain || 0) + step);
      }
    }
    if (!pvp) return;
    const win = result === 'win';
    const loss = result === 'loss';
    if (has('patient')) p.addXp(win ? 2 : loss ? 4 : 0);
    if (loss && has('calcloss')) {
      p.gold += 2;
      p.freeRolls += 1;
    }
    if (loss && has('beggars')) {
      S.losses += 1;
      if (S.losses % 3 === 0) this.augItem(p, 'poke-box');
    }
    if (win && has('pilfer') && this.rng.next() < 0.2) this.augComps(p, 1);
    if (has('reckoning')) S.reckon = loss ? S.reckon + 1 : win ? 0 : S.reckon;
    this.augLevels(p);
  },

  augTeam(p, t) {
    t.augs = p.augs.map(a => a.id);
    t.augSoul = p.augs.filter(a => a.id === 'soul').map(a => a.trait);
    t.augPump = p.augState.pump || 0;
    t.augReckon = p.augState.reckon || 0;
    t.augExpected = this.hasAug(p, 'expected') ? 0.15 + this.rng.next() * 0.3 : 0;
  },

  rerollCost(p) {
    if (p.roundRolls > 0 || p.freeRolls > 0) return 0;
    if (p.augState.thinkUntil && this.roundSeq <= p.augState.thinkUntil) return 0;
    return CONFIG.rerollCost;
  },

  payReroll(p) {
    if (p.roundRolls > 0) {
      p.roundRolls -= 1;
      p.augState.rolled = true;
      return 1;
    }
    if (p.freeRolls > 0) {
      p.freeRolls -= 1;
      p.augState.rolled = true;
      return 1;
    }
    if (p.augState.thinkUntil && this.roundSeq <= p.augState.thinkUntil) {
      p.augState.rolled = true;
      return 1;
    }
    if (p.gold < CONFIG.rerollCost) return 0;
    p.gold -= CONFIG.rerollCost;
    p.augState.rolled = true;
    const chance = Math.max(this.hasAug(p, 'goldenticket') ? 0.5 : 0, this.hasAug(p, 'prismticket') ? 0.4 : 0);
    if (chance && this.rng.next() < chance) {
      p.gold += CONFIG.rerollCost;
      this.notify(p, '티켓: 무료 새로고침!', 'loot');
      return 1;
    }
    return 2;
  }
};

Object.assign(Game.prototype, AUG_GAME);
