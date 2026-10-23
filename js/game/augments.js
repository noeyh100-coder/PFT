const AUG_GOLD = {
  hedge: 25, silph1: 26, silph2: 40, longinvest: 8, oakhelp: 8, indecisive2: 6, indecisive1: 4, fossil: 10, moneystorm: 7, realsnack: 15, sweetcandy: 10,
  pandorabench: 6, custom: 10, bigbag: 2, savings: 4, cavity1: 5, cavity2: 8, cavity3: 14, rocketway: 7, dealer: 3, munchkin: 7, craftmate: 2, gimmihelp: 7,
  loan1: 20, loan2: 33, exchange: 2, gold21: 21, fourplus: 5, efficient: 4, onetwofive: 2, gimmiuse: 3, winning: 2, survivor: 4, crumbs: 1, predict: 4
};
const AUG_XP = { achieve: 6, cram: 50, studyagain: 8, silverspoon: 10, boomlearn1: 7, boomlearn2: 10, newera1: 4, newera2: 8 };
const AUG_ROLLS = { sweetcandy: 18, tradehub: 16, rerollday: 10, newera1: 2, newera2: 2 };
const AUG_FATE = { prismfate1: [3, 3], prismfate2: [3, 7], goldfate1: [2, 3], goldfate2: [2, 6], silverfate1: [1, 2], silverfate2: [1, 4] };
const AUG_ITEMS = {
  deadlyband: ['choice-band'], deadlyspecs: ['choice-specs'], yoshhelp: ['leftovers', 'leftovers', 'leftovers', 'leftovers'], gardhelp: ['wise-glasses', 'wise-glasses', 'wise-glasses', 'wise-glasses'],
  harihelp: ['muscle-band', 'muscle-band', 'muscle-band', 'muscle-band'], sweetcandy: ['exp-l'], shellup: ['shell-bell'], custom: ['lucky-box', 'magnet'], bigbag: ['loaded-dice'],
  radiantrelic: ['radiant-box', 'magnet'], doublekill: ['choice-scarf'], polymath: ['wise-glasses', 'protective-pads'], cavity1: ['exp-m', 'exp-m'], cavity2: ['exp-m', 'exp-m'],
  cavity3: ['exp-m', 'exp-m'], wootears: ['leppa-berry'], kindling: ['flame-orb'], heartup: ['soul-dew'], crownweight: ['kings-rock'], bumpy: ['rocky-helmet'], bigfriend: ['leftovers'],
  gimmiuse: ['poke-box'], smallcandy: ['exp-m'], cataclysm: ['magnet', 'magnet'], optimize: ['golden-magnet']
};
const AUG_COMPS = { optimize: 4, pandora2: 2, pandora1: 1, bigbag: 3, cooperate: 1, onetwofive: 1, smallbag: 2 };
const AUG_DONE = { recycle1: 1, recycle2: 1, itembag: 1 };
const AUG_RECYCLE = { recycle1: 8, recycle2: 4 };
const AUG_PANDORA = ['pandora1', 'pandora2', 'pandora3'];

function augFamily(id) {
  const d = augDef(id);
  return d ? d.name.replace(/(I{1,3}|\+{1,2})$/, '').trim() : id;
}

function augLabel(a) {
  const d = augDef(a.id);
  return d ? d.name : a.id;
}

function augText(a) {
  const d = augDef(a.id);
  return d ? d.desc : '';
}

const AUG_GAME = {
  hasAug(p, id) {
    return p.augs.some(a => a.id === id);
  },

  hasAnyAug(p, ids) {
    return p.augs.some(a => ids.includes(a.id));
  },

  augRoundIndex() {
    return AUG_ROUNDS.indexOf(this.roundLabel());
  },

  isAugRound() {
    return this.augRoundIndex() >= 0;
  },

  labelReached(label) {
    const [s, r] = String(label).split('-').map(Number);
    return this.stage > s || (this.stage === s && this.round >= r);
  },

  augPoolRound() {
    let k = 0;
    AUG_ROUNDS.forEach((lab, i) => {
      if (this.labelReached(lab)) k = i;
    });
    return k;
  },

  augOwnedBlock(p, id) {
    const fam = augFamily(id);
    return p.augs.some(a => a.id === id || augFamily(a.id) === fam);
  },

  augCandidates(p, tier, round, exclude) {
    const lab = AUG_ROUNDS[round];
    return AUGMENTS.filter(d => d.tier === tier && d.rounds.includes(lab) && !this.augOwnedBlock(p, d.id) && !(exclude || []).includes(d.id)).map(d => d.id);
  },

  makeAugOffer(p, tier, round) {
    const S = p.augState;
    const t = Math.max(1, Math.min(3, tier + (S.tierShift || 0)));
    S.tierShift = 0;
    const rd = round != null && round >= 0 ? round : this.augPoolRound();
    let pool = this.augCandidates(p, t, rd, []);
    if (pool.length < 3) {
      const extra = AUGMENTS.filter(d => d.tier === t && !pool.includes(d.id) && !this.augOwnedBlock(p, d.id)).map(d => d.id);
      pool = pool.concat(this.pickDistinct(extra, 3 - pool.length));
    }
    const ids = this.pickDistinct(pool, 3);
    if (!ids.length) {
      p.augOffer = null;
      return;
    }
    const left = 1 + (this.encounter === '먹고자' ? 2 : 0);
    p.augOffer = { tier: t, round: rd, choices: ids.map(id => ({ id })), rerolls: ids.map(() => left) };
  },

  startAugRound() {
    const idx = this.augRoundIndex();
    if (idx < 0) return;
    const tier = this.augPattern[idx];
    for (const p of this.alivePlayers()) {
      this.makeAugOffer(p, tier, idx);
      if (!p.isHuman && p.augOffer) this.pickAug(p, this.rng.int(p.augOffer.choices.length));
    }
    for (const p of this.alivePlayers()) if (p.isHuman && p.augOffer) this.notify(p, AUG_TIER_NAME[p.augOffer.tier] + ' 증강을 고르세요', 'info');
  },

  rerollAug(p, n) {
    const o = p.augOffer;
    if (!o || !o.choices[n]) return { ok: false, reason: '' };
    if (!(o.rerolls[n] > 0)) return { ok: false, reason: '이 증강은 더 새로고침할 수 없습니다' };
    const pool = this.augCandidates(p, o.tier, o.round != null ? o.round : this.augPoolRound(), o.choices.map(c => c.id));
    if (!pool.length) return { ok: false, reason: '바꿀 수 있는 증강이 없습니다' };
    o.choices[n] = { id: pool[this.rng.int(pool.length)] };
    o.rerolls[n] -= 1;
    this.emit('update');
    return { ok: true, reason: '' };
  },

  pickAug(p, n) {
    const o = p.augOffer;
    const c = o ? o.choices[n] : null;
    if (!c) return { ok: false, reason: '' };
    p.augOffer = null;
    this.grantAug(p, c.id);
    this.emit('update');
    return { ok: true, reason: '' };
  },

  grantAug(p, id) {
    const c = { id };
    p.augs.push(c);
    this.notify(p, '증강 획득: ' + augLabel(c), 'loot');
    this.applyAugPick(p, c);
    this.augLevels(p);
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

  augFromComponent(p, comp, n) {
    const list = ITEMS.completed.filter(id => itemDef(id).from.includes(comp));
    for (let i = 0; i < n; i++) this.augItem(p, this.rng.pick(list));
  },

  augUnit(p, cost, star, filter) {
    let list = this.baseCandidates(p, cost);
    if (filter) {
      const f = list.filter(filter);
      if (f.length) list = f;
    }
    if (!list.length) {
      p.gold += cost * copiesForStar(star);
      return null;
    }
    const def = this.rng.pick(list);
    return this.augGive(p, def.id, star);
  },

  augGive(p, unitId, star, quiet) {
    const def = UNITS[unitId];
    if (!def) return null;
    if (this.lockedVariants(p).has(unitId)) {
      if (!quiet) p.gold += def.cost * copiesForStar(star);
      return null;
    }
    const inst = this.addUnit(p, unitId, star);
    if (!inst) {
      if (!quiet) p.gold += def.cost * copiesForStar(star);
      return null;
    }
    if (inst.star >= 2) this.onStarUp(p, inst, true);
    return inst;
  },

  augFate(p, tier) {
    const pool = this.augCandidates(p, tier, this.augPoolRound(), []).filter(id => !AUG_FATE[id]);
    if (!pool.length) return;
    this.grantAug(p, pool[this.rng.int(pool.length)]);
  },

  augRecommend(p, inst, n) {
    const st = instanceStats(inst, p);
    const out = [];
    for (const id of this.pickDistinct(recommendedPool({ role: st.role, special: st.special }), 8)) {
      if (out.length >= n) break;
      if (uniqueClash(out, id)) continue;
      out.push(id);
    }
    return out;
  },

  augClearUnits(p, sellThem) {
    for (const inst of p.allUnits()) {
      const def = UNITS[inst.unitId];
      p.remove(inst);
      this.returnItems(p, inst);
      if (sellThem) p.gold += sellValue(def, inst.star);
      this.pool.give(inst.unitId, copiesForStar(inst.star));
      if (p.dittoLink === inst.iid) p.dittoLink = null;
    }
    p.branch = {};
    p.pendingBranch = [];
  },

  augSoloTrim(p) {
    const keep = this.soloKeep(p);
    for (const inst of p.boardUnits()) {
      if (inst === keep || inst.overflow) continue;
      const slot = p.freeBenchSlot();
      if (slot < 0) break;
      p.remove(inst);
      p.placeBench(inst, slot);
    }
  },

  soloKeep(p) {
    let best = null;
    for (const inst of p.boardUnits()) {
      if (inst.overflow) continue;
      const v = UNITS[inst.unitId].cost * copiesForStar(inst.star);
      const bv = best ? UNITS[best.unitId].cost * copiesForStar(best.star) : -1;
      if (v > bv || (v === bv && inst.iid < best.iid)) best = inst;
    }
    return best;
  },

  soloActive(p) {
    return (p.augState.soloLeft || 0) > 0;
  },

  augLocked(p, inst) {
    return !!inst && this.hasAug(p, 'onecomp') && (p.augState.locked || []).includes(inst.iid);
  },

  benchLocked(inst) {
    return !!inst && !!inst.lockUntil && !this.labelReached(inst.lockUntil);
  },

  applyAugPick(p, c) {
    const S = p.augState;
    const id = c.id;
    p.gold += AUG_GOLD[id] || 0;
    if (AUG_XP[id]) p.addXp(AUG_XP[id]);
    p.freeRolls += AUG_ROLLS[id] || 0;
    if (AUG_FATE[id]) {
      p.gold += AUG_FATE[id][1];
      this.augFate(p, AUG_FATE[id][0]);
    }
    if (id === 'optimize') {
      p.items = p.items.map(x => (x === 'magnet' ? 'loaded-dice' : x));
      for (const o of p.orbs || []) if (o.item === 'magnet') o.item = 'loaded-dice';
    }
    for (const it of AUG_ITEMS[id] || []) this.augItem(p, it);
    if (AUG_COMPS[id]) this.augComps(p, AUG_COMPS[id]);
    if (AUG_DONE[id]) this.augDone(p, AUG_DONE[id]);
    if (AUG_RECYCLE[id]) {
      S.recycleN = AUG_RECYCLE[id];
      S.recycleCount = 0;
    }
    if (id === 'timerball') S.eggAt = this.roundSeq + 11;
    else if (id === 'ringcall') {
      this.augRing(p);
      S.ringLeft = 2;
      S.ringStage = this.stage;
    } else if (id === 'hedge') S.interestCap = Math.max(S.interestCap || 0, 10);
    else if (id === 'savings') {
      S.interestCap = Math.max(S.interestCap || 0, 7);
      S.interestSum = 0;
    } else if (id === 'longinvest' || id === 'dealer') S.noInterest = true;
    else if (id === 'pandora3') this.augItem(p, this.rng.pick(ITEMS.radiants));
    else if (id === 'oakhelp') {
      const inst = this.augUnit(p, 4, 1);
      const four = inst ? UNITS[inst.unitId] : this.rng.pick(this.baseCandidates(p, 4).concat(UNIT_DATA.filter(d => d.shop && d.cost === 4 && this.regionAllowed(d))));
      if (four) {
        const tr = allTraitsOf(four, 1, p).filter(t => !four.uniques.includes(t));
        this.augUnit(p, 1, 2, d => tr.some(t => this.defHasTrait(d, t)));
        S.oakId = four.id;
        S.oakLeft = 2;
        S.oakStage = this.stage;
      }
    } else if (id === 'indecisive1' || id === 'indecisive2') S.indecisive = { at: this.roundSeq + 3, tier: augDef(id).tier };
    else if (id === 'fossil') this.augGive(p, '암나이트', 2);
    else if (id === 'patience2' || id === 'patience1') {
      const ids = [];
      const inst = this.augUnit(p, id === 'patience2' ? 2 : 1, 1);
      if (inst) {
        ids.push(inst.unitId);
        if (id === 'patience2') this.augCopy(p, inst.unitId);
      }
      S.waitIds = (S.waitIds || []).concat(ids);
    } else if (id === 'boomlearn1' || id === 'boomlearn2') {
      S.boomLeft = 3;
      S.boomXp = AUG_XP[id];
    } else if (id === 'campaign') {
      this.augUnit(p, 2, 2);
      S.dealt = 0;
    } else if (id === 'opticshop') this.augFromComponent(p, 'wise-glasses', 2);
    else if (id === 'bandmaker') this.augFromComponent(p, 'muscle-band', 2);
    else if (id === 'dualtech') {
      this.augUnit(p, 2, 2);
      this.augUnit(p, 1, 2);
      this.augUnit(p, 1, 2);
    } else if (id === 'lastpoke') {
      const inst = this.augUnit(p, 5, 2);
      if (inst) {
        this.returnItems(p, inst);
        inst.items = this.augRecommend(p, inst, 3);
        inst.lockUntil = '4-3';
        if (inst.loc && inst.loc.zone === 'board') {
          const slot = p.freeBenchSlot();
          if (slot >= 0) {
            p.remove(inst);
            p.placeBench(inst, slot);
          }
        }
      }
    } else if (id === 'clutter') for (let i = 0; i < 4; i++) this.augUnit(p, 1, 1);
    else if (id === 'rocketway') S.rocketLeft = 2;
    else if (id === 'birthday') this.augUnit(p, 2, 2);
    else if (id === 'trio') {
      this.augUnit(p, 3, 1);
      this.augUnit(p, 3, 1);
    } else if (id === 'munchkin') {
      S.munch1 = true;
      S.munch2 = true;
    } else if (id === 'craftmate') S.craft1 = true;
    else if (id === 'fourplus') S.four = true;
    else if (id === 'gildedsteel') {
      const nonTank = d => !/탱커/.test(formOf(d, 1, p).role || '');
      this.augUnit(p, 5, 1, nonTank);
      this.augUnit(p, 5, 1, nonTank);
    } else if (id === 'loan1' || id === 'loan2') S.tierShift = (S.tierShift || 0) - 1;
    else if (id === 'augpower') S.tierShift = (S.tierShift || 0) + 1;
    else if (id === 'onecomp') S.locked = S.locked || [];
    else if (id === 'sololevel') {
      S.soloLeft = 5;
      this.augSoloTrim(p);
    } else if (id === 'twovalue') this.augUnit(p, 2, 1);
    else if (id === 'latebloom') {
      this.augClearUnits(p, true);
      for (let i = 0; i < 4; i++) this.augUnit(p, 1, 2);
      S.shopOffUntil = this.roundSeq + 3;
      this.refreshShop(p);
    } else if (id === 'efficient') S.efficientLeft = 4;
    else if (id === 'cooperate') {
      this.augUnit(p, 3, 1);
      this.augUnit(p, 3, 1);
    } else if (id === 'onetwothree') {
      this.augUnit(p, 1, 1);
      this.augUnit(p, 2, 1);
      this.augUnit(p, 2, 1);
      this.augUnit(p, 3, 1);
    } else if (id === 'onetwofive') this.augUnit(p, 5, 1);
    else if (id === 'patientblessing') S.lastBuySeq = S.lastBuySeq != null ? S.lastBuySeq : -1;
    else if (id === 'lunchmoney') S.lunch = 0;
    else if (id === 'pallet') {
      this.augClearUnits(p, false);
      this.augUnit(p, 3, 2);
      this.augUnit(p, 3, 2);
      for (let i = 0; i < 3; i++) this.augUnit(p, 2, 2);
      this.augUnit(p, 1, 2);
    } else if (id === 'noconnect') {
      const ids = [];
      for (const inst of p.allUnits()) if (UNITS[inst.unitId].cost === 1 && !ids.includes(inst.unitId)) ids.push(inst.unitId);
      for (const u of ids) this.augGive(p, u, 1);
    } else if (id === 'crumbs') S.crumbsLeft = 2;
    else if (id === 'titan') {
      p.maxHp += 25;
      p.hp += 25;
    } else if (id === 'predict') p.streak = 4;
    else if (id === 'smallcandy') S.candyCount = 0;
    else if (id === 'cataclysm') this.recombobulate(p);
    this.augLevelGates(p);
    if (p.hp > p.maxHp) p.hp = p.maxHp;
  },

  augFossil(p, unitId) {
    const form = formOf(UNITS[unitId], 1, p);
    const pool = recommendedPool({ role: form.role || formRole(form), special: !!form.special });
    const id = pool[this.rng.int(pool.length)];
    this.augItem(p, id);
    this.notify(p, '화석의 비밀: ' + form.name + '에게 맞는 ' + itemDef(id).name + '을(를) 얻었습니다', 'loot');
  },

  augRing(p) {
    this.augUnit(p, 5, 1);
    this.augUnit(p, 1, 2);
    p.gold += 5;
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
      this.pool.give(inst.unitId, copiesForStar(inst.star));
      if (p.dittoLink === inst.iid) p.dittoLink = null;
      const ni = newInstance(nd.id, inst.star);
      ni.items = items;
      p.setAt(loc, ni);
      if (ni.star >= 2) this.onStarUp(p, ni, true);
    }
    this.mergeAll(p);
  },

  pandoraBench(p) {
    let n = 0;
    for (let i = CONFIG.benchSize - 1; i >= 0 && n < 3; i--) {
      const inst = p.unitAt({ zone: 'bench', i });
      if (!inst) continue;
      if (p.freshIids && p.freshIids.includes(inst.iid)) continue;
      n++;
      const def = UNITS[inst.unitId];
      if (!def || !def.shop) continue;
      const list = this.baseCandidates(p, def.cost).filter(d => d.id !== def.id);
      if (!list.length) continue;
      const nd = this.rng.pick(list);
      const items = (inst.items || []).slice();
      p.remove(inst);
      this.pool.give(inst.unitId, copiesForStar(inst.star));
      if (p.dittoLink === inst.iid) p.dittoLink = null;
      const ni = newInstance(nd.id, inst.star);
      ni.items = items;
      p.setAt({ zone: 'bench', i }, ni);
      if (ni.star >= 2) this.onStarUp(p, ni, true);
    }
    this.mergeAll(p);
  },

  augCopy(p, unitId) {
    if (!UNITS[unitId] || this.lockedVariants(p).has(unitId)) return null;
    if (p.freeBenchSlot() < 0 && this.countMergeable(p, unitId, 1) < 2) return null;
    return this.addUnit(p, unitId, 1);
  },

  augRosa(p, unitId) {
    const S = p.augState;
    const inst = this.augCopy(p, unitId);
    if (!inst) return;
    this.notify(p, '로사와 로이: ' + formOf(UNITS[unitId], 1, p).name + ' 복사본을 얻었습니다', 'loot');
    if (S.rosaDone) return;
    S.rosaVal = (S.rosaVal || 0) + UNITS[unitId].cost;
    if (S.rosaVal >= 25) {
      S.rosaDone = true;
      this.augComps(p, 1);
    }
  },

  augHatch(p) {
    const S = p.augState;
    S.eggAt = 0;
    S.eggDone = true;
    for (let i = 0; i < 3; i++) this.augItem(p, 'great-box');
    p.gold += 60;
    this.notify(p, '황금 타이머볼이 부화했습니다!', 'loot');
  },

  augRoundStart(p) {
    if (!p.augs.length) return;
    const S = p.augState;
    const has = id => this.hasAug(p, id);
    const info = this.roundInfo();
    const stageStart = this.round === 1;
    if (has('longinvest')) p.addXp(4);
    if (has('moneystorm')) p.gold += 7;
    if (has('gimmihelp')) p.gold += 1;
    if (has('exchange')) p.freeRolls += 1;
    if (has('tradehub')) p.freeRolls += 2;
    if (has('patientblessing') && S.lastBuySeq !== this.roundSeq - 1) p.freeRolls += 2;
    if (S.boomLeft > 0) {
      S.boomLeft -= 1;
      p.addXp(S.boomXp || 0);
    }
    if (stageStart && (has('newera1') || has('newera2'))) {
      p.addXp(has('newera2') ? 8 : 4);
      p.freeRolls += 2;
    }
    if (info.type === 'pvp' && has('lateclass')) p.addXp(2);
    if (info.type === 'pvp' && has('dealer')) p.gold += 3;
    if (stageStart && S.ringLeft > 0 && this.stage > S.ringStage) {
      S.ringLeft -= 1;
      this.augRing(p);
      this.notify(p, '링의 소환!: 꾸러미를 받았습니다', 'loot');
    }
    if (stageStart && S.oakLeft > 0 && this.stage > S.oakStage && S.oakId) {
      S.oakLeft -= 1;
      this.augGive(p, S.oakId, 1);
      this.notify(p, '오박사의 도움: ' + formOf(UNITS[S.oakId], 1, p).name + '을(를) 다시 받았습니다', 'loot');
    }
    for (const id of S.waitIds || []) this.augCopy(p, id);
    if (this.hasAnyAug(p, AUG_PANDORA)) {
      const skip = Object.assign({}, p.freshItems || {});
      p.items = p.items.map(x => {
        if (skip[x] > 0) {
          skip[x] -= 1;
          return x;
        }
        return isConsumable(x) ? x : this.reforgeId(x);
      });
    }
    if (has('pandorabench')) this.pandoraBench(p);
    p.freshItems = null;
    p.freshIids = null;
    if (S.rosaId) {
      const id = S.rosaId;
      S.rosaId = null;
      this.augRosa(p, id);
    }
    if (S.eggAt && this.roundSeq >= S.eggAt) this.augHatch(p);
    if (S.indecisive && this.roundSeq >= S.indecisive.at && !p.augOffer && info.type !== 'carousel' && info.type !== 'encounter' && !this.isAugRound()) {
      const tier = S.indecisive.tier;
      S.indecisive = null;
      this.makeAugOffer(p, tier, this.augPoolRound());
      if (p.augOffer) {
        if (!p.isHuman) this.pickAug(p, this.rng.int(p.augOffer.choices.length));
        else this.notify(p, '우유부단: ' + AUG_TIER_NAME[p.augOffer.tier] + ' 증강을 고르세요', 'info');
      }
    }
    this.augLevels(p);
  },

  augLevels(p) {
    while (p.levelUps.length) {
      const lv = p.levelUps.shift();
      if (!p.augs.length) continue;
      if (this.hasAug(p, 'rockethelp')) {
        this.augUnit(p, Math.max(1, Math.min(5, lv - 4)), 2);
        p.gold += 1;
      }
      this.augLevelGates(p);
    }
  },

  augLevelGates(p) {
    if (!p.augs.length) return;
    const S = p.augState;
    const has = id => this.hasAug(p, id);
    if (has('birthday')) {
      if (p.level >= 7 && !S.bday7) {
        S.bday7 = true;
        this.augItem(p, 'thiefs-gloves');
        this.notify(p, '생일 모임: 도적의 장갑을 받았습니다', 'loot');
      }
      if (p.level >= 9 && !S.bday9) {
        S.bday9 = true;
        this.augUnit(p, 5, 2);
        this.notify(p, '생일 모임: 5코스트 2성 포켓몬을 받았습니다', 'loot');
      }
    }
    if (has('epicroll') && p.level >= 8 && !S.epic) {
      S.epic = true;
      p.freeRolls += 20;
      this.notify(p, '서사적 새로고침: 무료 새로고침 20회', 'loot');
    }
    if (has('latespec') && p.level >= 9 && !S.latespec) {
      S.latespec = true;
      p.gold += 36;
      this.notify(p, '후반 전문가: 36골드', 'loot');
    }
    if (has('achieve') && p.level >= 9 && !S.achieved) {
      S.achieved = true;
      p.freeRolls += 2;
      if (p.level < 10 && p.maxLevel() >= 10) {
        p.level = 10;
        p.xp = 0;
        p.levelUps.push(10);
      }
      this.notify(p, '성취: 10레벨이 되었습니다', 'loot');
    }
  },

  augBought(p) {
    p.augState.lastBuySeq = this.roundSeq;
  },

  augBuyStar(p, def) {
    const S = p.augState;
    if (def.cost === 1 && S.craft1) return { star: 3, key: 'craft1' };
    if (def.cost === 1 && S.munch1) return { star: 2, key: 'munch1' };
    if (def.cost === 2 && S.munch2) return { star: 2, key: 'munch2' };
    if (def.cost === 4 && S.four) return { star: 2, key: 'four' };
    return null;
  },

  augCrafted(p) {
    if (this.hasAug(p, 'craft')) {
      p.freeRolls += 2;
      this.notify(p, '정교한 공예: 무료 새로고침 2회', 'loot');
    }
  },

  augStarUp(p, inst, fielded) {
    if (!p.augs.length) return;
    if (fielded && this.hasAug(p, 'winning')) {
      p.freeRolls += 2;
      this.notify(p, '승승장구: 무료 새로고침 2회', 'loot');
    }
    if (inst.star >= 3 && this.hasAug(p, 'doublebattle')) {
      const made = this.augGive(p, inst.unitId, 2, true);
      if (made) this.notify(p, '더블배틀: ' + formOf(UNITS[inst.unitId], 2, p).name + ' 2성을 얻었습니다', 'loot');
    }
  },

  augSalvage(p, inst) {
    if (!this.hasAnyAug(p, ['recycle1', 'recycle2']) || !inst.items) return;
    inst.items = [].concat(...inst.items.map(x => {
      const d = itemDef(itemBase(x));
      return d && d.kind === 'completed' && d.from ? d.from.slice() : [x];
    }));
  },

  augDealt(p, dmg) {
    if (!p.augs.length || !(dmg > 0)) return;
    const S = p.augState;
    if (this.hasAug(p, 'lunchmoney')) {
      S.lunch = (S.lunch || 0) + dmg;
      const n = Math.floor(S.lunch / 7);
      if (n > 0) {
        S.lunch -= n * 7;
        p.gold += 2 * n;
        this.notify(p, '점심값: ' + 2 * n + '골드', 'loot');
      }
    }
    if (this.hasAug(p, 'campaign') && !S.campaignDone) {
      S.dealt = (S.dealt || 0) + dmg;
      if (S.dealt >= 80) {
        S.campaignDone = true;
        this.augUnit(p, 5, 1);
        this.augItem(p, 'great-box');
        this.notify(p, '출정: 보상 상자를 열었습니다', 'loot');
      }
    }
  },

  augEliminations() {
    const out = this.players.filter(p => !p.alive).length;
    for (const p of this.alivePlayers()) {
      const S = p.augState;
      if (out >= 2 && this.hasAug(p, 'doublekill') && !S.dkDone) {
        S.dkDone = true;
        p.gold += 40;
        this.notify(p, '재빠른 더블 킬: 40골드', 'loot');
      }
      if (out >= 3 && this.hasAug(p, 'survivor') && !S.survDone) {
        S.survDone = true;
        p.gold += 100;
        this.notify(p, '생존자: 100골드', 'loot');
      }
    }
  },

  augLootOrb(p) {
    const orb = this.makeOrb(4 + this.rng.int(4), this.rng.int(BOARD_COLS));
    if (p.isHuman && this.realtime) {
      p.orbs = (p.orbs || []).concat([orb]);
      this.emit('orbs');
    } else this.openOrb(p, orb);
  },

  augAfterCombat(p, sim, side, result, pvp) {
    if (!p.augs.length) return;
    const S = p.augState;
    const has = id => this.hasAug(p, id);
    const A = sim.side[side].aug;
    if (A) {
      if (A.gold) {
        p.gold += A.gold;
        this.notify(p, '증강: ' + A.gold + '골드', 'loot');
      }
      for (let i = 0; i < (A.lootN || 0); i++) this.augLootOrb(p);
      if (A.xp) p.addXp(A.xp);
      if (A.firstKill && has('rosaroy')) S.rosaId = A.firstKill;
      if (A.bandGain) S.bandStacks = (S.bandStacks || 0) + A.bandGain;
      if (A.specsGain) S.specsStacks = (S.specsStacks || 0) + A.specsGain;
    }
    if (S.soloLeft > 0) {
      S.soloLeft -= 1;
      if (!S.soloLeft) {
        this.augComps(p, 2);
        this.notify(p, '나 혼자 레벨업이 끝났습니다: 조합 아이템 2개', 'loot');
      }
    }
    if (S.rocketLeft > 0) S.rocketLeft -= 1;
    if (result === 'loss' && has('calcloss')) {
      p.gold += 2;
      p.freeRolls += 1;
    }
    if ((has('silph1') || has('silph2')) && p.gold > 50) {
      const n = Math.floor((Math.min(p.gold, 80) - 50) / 10);
      if (n > 0) {
        p.freeRolls += n;
        this.notify(p, '실프주식회사의 지원: 무료 새로고침 ' + n + '회', 'loot');
      }
    }
    if (pvp) {
      const win = result === 'win';
      const loss = result === 'loss';
      if (has('realsnack') && p.hp > 0) {
        p.hp = Math.min(p.maxHp, p.hp + 2);
        p.gold += 2;
      }
      if (has('persist')) p.addXp(win ? 2 : loss ? 3 : 0);
      if (has('clearmind') && !p.benchUnits().length) p.addXp(3);
      if (has('clutter') && p.freeBenchSlot() < 0) p.addXp(3);
      if (has('earlyedu')) S.edu = (S.edu || 0) + 1;
      if (has('onecomp')) {
        S.locked = S.locked || [];
        for (const u of sim.units) {
          if (u.side !== side || !u.iid) continue;
          const inst = p.findInstance(u.iid);
          if (!inst) continue;
          inst.augOne = (inst.augOne || 0) + 1;
          if (!S.locked.includes(inst.iid)) S.locked.push(inst.iid);
        }
      }
      if (S.recycleN && !S.recycleDone) {
        S.recycleCount = (S.recycleCount || 0) + 1;
        if (S.recycleCount >= S.recycleN) {
          S.recycleDone = true;
          this.augComps(p, 1);
          this.notify(p, '재활용 쓰레기통: 조합 아이템 1개', 'loot');
        }
      }
      if (has('smallcandy') && !S.candyDone) {
        S.candyCount = (S.candyCount || 0) + 1;
        if (S.candyCount >= 5) {
          S.candyDone = true;
          this.augItem(p, 'exp-m');
          this.notify(p, '조금 달콤한 사탕: 경험사탕M', 'loot');
        }
      }
      if (has('twovalue')) {
        const ids = new Set(sim.units.filter(u => u.side === side && u.cost === 2 && u.unitId && !u.ditto).map(u => u.unitId));
        const n = Math.floor(ids.size / 2);
        if (n > 0) {
          p.freeRolls += n;
          this.notify(p, '2만한 가치: 무료 새로고침 ' + n + '회', 'loot');
        }
      }
      if (win && S.eggAt) S.eggAt -= 1;
    }
    this.augLevels(p);
  },

  augTeam(p, t) {
    const S = p.augState;
    t.augs = p.augs.map(a => a.id);
    let bronze = 0;
    if (t.augs.includes('bronze1') || t.augs.includes('bronze2')) {
      for (const s of computeSynergies(p)) {
        const td = TRAIT_DATA.map[s.id];
        if (!s.active || s.kind === 'unique' || !td) continue;
        const total = td.stepLabels ? td.stepLabels.length : (s.tiers || [1]).length;
        if (total >= 2 && s.tier === 1) bronze++;
      }
    }
    t.augX = {
      lost: Math.max(0, p.maxHp - p.hp),
      stage: this.stage,
      edu: S.edu || 0,
      band: S.bandStacks || 0,
      specs: S.specsStacks || 0,
      solo: this.soloActive(p),
      rocket: (S.rocketLeft || 0) > 0,
      bronze
    };
  },

  stratSpeed(p, carousel) {
    let k = 1;
    if (!p) return k;
    if (this.hasAug(p, 'realsnack')) k *= 1.3;
    if (carousel && this.hasAug(p, 'titan')) k *= 0.55;
    return k;
  },

  shopOff(p) {
    const S = p.augState;
    return !!S.shopOffUntil && this.roundSeq <= S.shopOffUntil;
  },

  rerollCost(p) {
    if (p.freeRolls > 0) return 0;
    return CONFIG.rerollCost;
  },

  payReroll(p) {
    if (this.shopOff(p)) return 0;
    if (p.freeRolls > 0) {
      p.freeRolls -= 1;
      return 1;
    }
    if (p.gold < CONFIG.rerollCost) return 0;
    p.gold -= CONFIG.rerollCost;
    return 2;
  },

  augRerolled(p) {
    if (this.hasAug(p, 'prismticket') && this.rng.next() < 0.5) {
      p.freeRolls += 1;
      this.notify(p, '프리즘 티켓: 무료 새로고침!', 'loot');
    }
  },

  augStatus(p, a) {
    const S = p.augState;
    const id = a.id;
    if (id === 'timerball') return S.eggDone ? '부화 완료' : S.eggAt ? '부화까지 ' + Math.max(0, S.eggAt - this.roundSeq) + '라운드' : '';
    if (id === 'ringcall') return '남은 꾸러미 ' + (S.ringLeft || 0) + '번';
    if (id === 'oakhelp') return S.oakId ? '남은 횟수 ' + (S.oakLeft || 0) + '번 (' + formOf(UNITS[S.oakId], 1, p).name + ')' : '';
    if (id === 'indecisive1' || id === 'indecisive2') return S.indecisive ? '새 증강까지 ' + Math.max(0, S.indecisive.at - this.roundSeq) + '라운드' : '받음';
    if (id === 'deadlyband') return '구애머리띠 공격 +' + (S.bandStacks || 0) + '%';
    if (id === 'deadlyspecs') return '구애안경 특수공격 +' + (S.specsStacks || 0) + '%';
    if (id === 'earlyedu') return '지금 공격·특수공격 +' + (8 + (S.edu || 0)) + '%';
    if (id === 'sololevel') return S.soloLeft > 0 ? '남은 전투 ' + S.soloLeft + '번' : '끝남';
    if (id === 'rocketway') return S.rocketLeft > 0 ? '남은 라운드 ' + S.rocketLeft : '끝남';
    if (id === 'campaign') return S.campaignDone ? '보상 받음' : '입힌 피해 ' + Math.min(80, S.dealt || 0) + ' / 80';
    if (id === 'lunchmoney') return '다음 2골드까지 피해 ' + (7 - (S.lunch || 0));
    if (id === 'savings') return S.savingsDone ? '보상 받음' : '이자 ' + (S.interestSum || 0) + ' / 50';
    if (id === 'recycle1' || id === 'recycle2') return S.recycleDone ? '조합 아이템 받음' : '전투 ' + (S.recycleCount || 0) + ' / ' + S.recycleN;
    if (id === 'smallcandy') return S.candyDone ? '받음' : '전투 ' + (S.candyCount || 0) + ' / 5';
    if (id === 'boomlearn1' || id === 'boomlearn2') return '남은 횟수 ' + (S.boomLeft || 0);
    if (id === 'munchkin') return [S.munch1 ? '1코스트 대기' : '1코스트 사용', S.munch2 ? '2코스트 대기' : '2코스트 사용'].join(' · ');
    if (id === 'craftmate') return S.craft1 ? '대기 중' : '사용함';
    if (id === 'fourplus') return S.four ? '대기 중' : '사용함';
    if (id === 'efficient') return '남은 회전초밥 ' + (S.efficientLeft || 0) + '번';
    if (id === 'crumbs') return '남은 회전초밥 ' + (S.crumbsLeft || 0) + '번';
    if (id === 'latebloom') return this.shopOff(p) ? '상점 비활성화 (' + (S.shopOffUntil - this.roundSeq + 1) + '라운드)' : '';
    if (id === 'rosaroy') return S.rosaDone ? '조합 아이템 받음' : '모은 가치 ' + (S.rosaVal || 0) + ' / 25';
    if (id === 'patience1' || id === 'patience2') return (S.waitIds || []).map(u => formOf(UNITS[u], 1, p).name).join(', ');
    return '';
  }
};

Object.assign(Game.prototype, AUG_GAME);
