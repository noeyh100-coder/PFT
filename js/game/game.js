const CELL_ORDER_FRONT = [];
const CELL_ORDER_BACK = [];
(function () {
  const cols = [3, 2, 4, 1, 5, 0, 6];
  for (const r of [4, 5, 6, 7]) for (const c of cols) CELL_ORDER_FRONT.push([r, c]);
  for (const r of [7, 6, 5, 4]) for (const c of cols) CELL_ORDER_BACK.push([r, c]);
})();

class Game {
  constructor(opts) {
    const o = opts || {};
    this.seed = o.seed || ((Date.now() ^ 0x5bd1e995) >>> 0);
    NEXT_IID = 1;
    this.rng = new Rng(this.seed);
    this.pool = new Pool();
    this.players = [];
    const names = this.rng.shuffle(CONFIG.botNames.slice());
    let n = 0;
    this.solo = !o.seats;
    if (o.seats) {
      o.seats.slice(0, 8).forEach((seat, i) => {
        const name = seat.human ? String(seat.name || '플레이어 ' + (i + 1)) : names[n++ % names.length];
        this.players.push(new Player(i, name, !!seat.human));
      });
    } else if (o.humanName) this.players.push(new Player(0, o.humanName, true));
    while (this.players.length < 8) {
      this.players.push(new Player(this.players.length, names[n % names.length], false));
      n++;
    }
    this.human = o.localSlot != null ? this.players[o.localSlot] || null : this.players.find(p => p.isHuman) || null;
    const looks = this.rng.shuffle(CONFIG.strategists.slice());
    const maps = this.rng.shuffle(CONFIG.maps.slice());
    const valid = l => CONFIG.strategists.includes(l);
    const want = this.players.map((p, i) => {
      if (!p.isHuman) return null;
      const l = o.seats ? o.seats[i] && o.seats[i].look : o.look;
      return valid(l) ? l : null;
    });
    want.forEach((l, i) => {
      if (l && want.indexOf(l) !== i) want[i] = null;
    });
    const free = looks.filter(l => !want.includes(l));
    let k = 0;
    this.players.forEach((p, i) => {
      p.strategist = want[i] || (free.length ? free[k++ % free.length] : looks[i % looks.length]);
      const wm = p.isHuman ? (o.seats ? o.seats[i] && o.seats[i].map : o.map) : null;
      p.mapId = CONFIG.maps.includes(wm) ? wm : maps[i % maps.length];
      p.seaTiles = this.rollSea();
    });
    this.realtime = !!o.realtime;
    this.hostLog = {};
    this.orbSeq = 1;
    this.stage = 1;
    this.round = 1;
    this.phase = 'idle';
    this.listeners = {};
    this.matches = [];
    this.pairings = [];
    this.carousel = null;
    this.humanSim = null;
    this.lastIncome = null;
    this.region = o.region || null;
    this.espVariant = ESPER_KEYS.includes(o.esp) ? o.esp : this.rng.pick(ESPER_KEYS);
    for (const p of this.players) p.espVariant = this.espVariant;
    this.encounter = ENCOUNTER_IDS.includes(o.enc) ? o.enc : this.rng.pick(ENCOUNTER_IDS);
    const hp = this.encounter === '해피너스' ? 120 : this.encounter === '저승갓숭' ? 90 : CONFIG.startHp;
    for (const p of this.players) {
      p.encounter = this.encounter;
      p.hp = hp;
      p.maxHp = hp;
    }
    this.augPattern = this.rng.pick(AUG_PATTERNS).slice();
    this.roundSeq = 0;
  }

  rollSea() {
    const pick = rows => {
      const cells = [];
      for (const r of rows) for (let c = 0; c < BOARD_COLS; c++) cells.push(r * 10 + c);
      return this.rng.shuffle(cells).slice(0, 7);
    };
    return pick([4, 5]).concat(pick([6, 7]));
  }

  teamFor(p, mirror) {
    const t = synergyTeam(p);
    t.benchFree = CONFIG.benchSize - p.benchUnits().length;
    t.healStack = p.counters.heal;
    t.esp = this.espVariant;
    this.augTeam(p, t);
    t.sea = (p.seaTiles || []).map(k => {
      if (!mirror) return k;
      const [r, c] = Hex.mirror(Math.floor(k / 10), k % 10);
      return r * 10 + c;
    });
    return t;
  }

  linkDitto(p, ditto, target) {
    if (!ditto || !target || ditto.unitId !== '메타몽' || target.unitId === '메타몽' || ditto === target) return false;
    p.dittoLink = target.iid;
    this.notify(p, '메타몽이 ' + formOf(UNITS[target.unitId], target.star, p).name + '와(과) 연결되었습니다', 'info');
    this.emit('update');
    return true;
  }

  canFeed(p, food, eater) {
    if (this.phase !== 'planning') return { ok: false, reason: '준비 단계에만 먹이를 줄 수 있습니다' };
    if (!food || !eater || food === eater || eater.unitId !== '먹고자') return { ok: false, reason: '' };
    if (!food.loc || food.loc.zone !== 'bench') return { ok: false, reason: '대기석에 있는 기물만 먹일 수 있습니다' };
    if (p.fedRound === this.roundLabel()) return { ok: false, reason: '이번 준비 단계에는 이미 먹이를 줬습니다' };
    return { ok: true, reason: '' };
  }

  feed(p, food, eater) {
    const chk = this.canFeed(p, food, eater);
    if (!chk.ok) return chk;
    const def = UNITS[food.unitId];
    const form = formOf(def, food.star, p);
    const key = FEAST_STAT[form.role] || (form.special ? 'spa' : 'atk');
    const amount = def.cost * food.star * 0.03;
    p.remove(food);
    this.returnItems(p, food);
    this.pool.give(food.unitId, copiesForStar(food.star));
    if (p.dittoLink === food.iid) p.dittoLink = null;
    eater.feast = eater.feast || { atk: 0, spa: 0, def: 0, spd: 0 };
    eater.feast[key] += amount;
    p.fedRound = this.roundLabel();
    const label = { atk: '공격', spa: '특수공격', def: '방어', spd: '특수방어' }[key];
    this.notify(p, formOf(UNITS[eater.unitId], eater.star, p).name + '이(가) ' + form.name + '을(를) 삼켰습니다: ' + label + ' +' + Math.round(amount * 100) + '%', 'evolve');
    this.emit('update');
    return chk;
  }

  setRegion(region) {
    this.region = region ? '리전폼' : null;
    this.emit('update');
  }

  isRegional() {
    return this.encounter === '따라큐' || !!this.region;
  }

  regionAllowed(def) {
    return regionVisible(def, this.isRegional());
  }

  on(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  emit(type, data) {
    for (const fn of this.listeners[type] || []) fn(data);
  }

  notify(p, msg, kind) {
    if (p && p.isHuman) this.emit('notify', { msg, kind: kind || 'info', p });
  }

  alivePlayers() {
    return this.players.filter(p => p.alive);
  }

  roundsInStage(stage) {
    return stage === 1 ? 4 : 7;
  }

  roundInfo(stage, round) {
    const s = stage || this.stage;
    const r = round || this.round;
    if (s === 1) return { type: r === 1 ? 'encounter' : 'pve' };
    if (r === 4) return { type: 'carousel' };
    if (r === 7) return { type: 'pve' };
    return { type: 'pvp' };
  }

  roundLabel() {
    return this.stage + '-' + this.round;
  }

  planningTime() {
    const info = this.roundInfo();
    if (info.type === 'encounter') return CONFIG.planningTime.encounter;
    if (this.isAugRound()) return CONFIG.planningTime.augment;
    if (info.type === 'pve') return CONFIG.planningTime.pve;
    if (this.stage === 1) return CONFIG.planningTime.early;
    return CONFIG.planningTime.normal;
  }

  start() {
    this.stage = 1;
    this.round = 1;
    for (const p of this.players) this.notify(p, '이번 게임의 에스퍼 효과: ' + this.espVariant, 'info');
    this.beginRound();
  }

  beginRound() {
    const info = this.roundInfo();
    this.matches = [];
    this.pairings = [];
    this.humanSim = null;
    const alive = this.alivePlayers();
    for (const p of alive) {
      this.releaseStones(p);
      Unlocks.resolvePending(this, p);
      this.mergeAll(p);
      p.currentOpponent = null;
      p.currentGhost = false;
      p.lastDamage = 0;
    }
    this.roundSeq += 1;
    for (const p of alive) {
      this.augRoundStart(p);
      this.rollGloves(p);
    }
    if (info.type === 'encounter') {
      this.setupGather();
      this.phase = 'carousel';
      this.emit('round', info);
      return;
    }
    if (info.type === 'carousel') {
      this.setupCarousel();
      this.phase = 'carousel';
      this.emit('round', info);
      return;
    }
    for (const p of alive) {
      if (this.bugTier(p) >= 1) {
        p.bugRounds = (p.bugRounds || 0) + 1;
        p.bugShop = p.bugRounds % 4 === 0 && !p.shopLocked;
        if (p.bugShop) this.notify(p, '벌레 시너지: 이번 라운드 첫 상점에는 벌레 포켓몬만 나옵니다', 'info');
      } else {
        p.bugRounds = 0;
        p.bugShop = false;
      }
      const enc = encounterDef(this.encounter);
      if (enc && enc.item && this.stage === 4 && this.round === 6) {
        if (p.isHuman && this.realtime) {
          p.fruit = { item: enc.item };
          this.notify(p, enc.id + ': 상대 진영에 ' + itemDef(enc.item).name + '이(가) 나타났습니다! 기물에 끌어다 놓거나 클릭해서 얻으세요', 'loot');
        } else {
          this.giveItem(p, enc.item);
          this.notify(p, enc.id + ': ' + enc.gift + ' 받았습니다', 'loot');
        }
      }
      if (this.encounter === '나옹' && this.round === 1 && encounterGold(this.stage)) {
        const n = encounterGold(this.stage);
        p.gold += n;
        this.notify(p, '나옹: ' + n + '골드를 받았습니다', 'loot');
      }
      if (!(this.stage === 1 && this.round === 2)) {
        const inc = this.grantIncome(p, this.stage === 1 ? CONFIG.earlyIncome : CONFIG.baseIncome);
        if (!(this.stage === 1 && this.round <= 2)) p.addXp(CONFIG.passiveXp);
        this.augLevels(p);
        p.lastIncome = inc;
        if (p === this.human) this.lastIncome = inc;
      }
      if (!p.shopLocked) this.refreshShop(p);
      else p.shopLocked = false;
      p.bugShop = false;
      p.mineSkip = false;
      this.refreshMineOffer(p);
    }
    if (info.type === 'pvp') this.makePairings();
    this.phase = 'planning';
    if (this.isAugRound()) this.startAugRound();
    for (const p of alive) if (!p.isHuman || p.afk) Bot.plan(this, p);
    this.emit('round', info);
  }

  grantIncome(p, base) {
    const S = p.augState;
    const cap = Math.max(CONFIG.interestMax, S.interestCap || 0);
    const interest = S.noInterest ? 0 : Math.min(cap, Math.floor(p.gold / CONFIG.interestPer));
    const streak = CONFIG.streakBonus(Math.abs(p.streak));
    p.gold += base + interest + streak;
    if (interest && this.hasAug(p, 'savings') && !S.savingsDone) {
      S.interestSum = (S.interestSum || 0) + interest;
      if (S.interestSum >= 50) {
        S.savingsDone = true;
        p.gold += 30;
        this.notify(p, '예금 계좌: 30골드', 'loot');
      }
    }
    return { base, interest, streak };
  }

  lockedVariants(p) {
    const locked = new Set();
    for (const inst of p.allUnits()) {
      const def = UNITS[inst.unitId];
      for (const v of FAMILIES[def.family]) if (v.variant !== def.variant) locked.add(v.id);
    }
    return locked;
  }

  isEligible(p, def) {
    if (p.excluded.has(def.id)) return false;
    if (p.allUnits().some(u => u.unitId === def.id && u.star >= 3)) return false;
    if (!this.regionAllowed(def)) return false;
    return def.shop || p.unlockedShop.has(def.id);
  }

  wantedUnits(p) {
    const copies = {};
    const maxed = new Set();
    for (const u of p.allUnits()) {
      copies[u.unitId] = (copies[u.unitId] || 0) + copiesForStar(u.star);
      if (u.star >= 3) maxed.add(u.unitId);
    }
    const out = new Set();
    for (const id in copies) if (copies[id] >= 2 && !maxed.has(id)) out.add(id);
    return out;
  }

  rollShopUnit(p, locked, wanted, filter) {
    const odds = CONFIG.shopOdds[Math.min(p.level, CONFIG.maxLevel)];
    const byCost = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    const bugOnly = !filter && p.bugShop && UNIT_DATA.some(def => this.isBugDef(def) && this.isEligible(p, def) && !locked.has(def.id) && this.pool.remaining(def.id) > 0);
    for (const def of UNIT_DATA) {
      if (!this.isEligible(p, def) || locked.has(def.id) || this.pool.remaining(def.id) <= 0) continue;
      if (bugOnly && !this.isBugDef(def)) continue;
      if (filter && !filter(def)) continue;
      byCost[Math.min(5, def.cost)].push(def);
    }
    let costs = [1, 2, 3, 4, 5].filter(c => byCost[c].length > 0 && odds[c - 1] > 0);
    let cost = this.rng.weighted(costs, c => odds[c - 1]);
    if (cost == null) {
      costs = [1, 2, 3, 4, 5].filter(c => byCost[c].length > 0);
      if (!costs.length) return null;
      cost = costs[0];
    }
    const boost = 1 + CONFIG.pityStep * (p.pity || 0);
    const fam = {};
    for (const d of byCost[cost]) if (d.region) fam[d.family] = (fam[d.family] || 0) + 1;
    const def = this.rng.weighted(byCost[cost], d => (this.pool.remaining(d.id) * (wanted && wanted.has(d.id) ? boost : 1)) / (d.region ? fam[d.family] : 1));
    return def ? def.id : null;
  }

  isBugDef(def) {
    return (def.stageForms || def.forms).some(f => f.types.includes('벌레'));
  }

  bugTier(p) {
    return synergyTeam(p).tiers['벌레'] || 0;
  }

  refreshShop(p) {
    for (let i = 0; i < p.shop.length; i++) {
      if (p.shop[i]) this.pool.give(p.shop[i], 1);
      p.shop[i] = null;
    }
    if (this.shopOff(p)) return;
    const locked = this.lockedVariants(p);
    const wanted = this.wantedUnits(p);
    for (let i = 0; i < CONFIG.shopSize; i++) {
      let id = null;
      if (p.guaranteed.length) {
        id = p.guaranteed.shift();
        this.pool.take(id, 1);
      } else {
        id = this.rollShopUnit(p, locked, wanted);
        if (id) this.pool.take(id, 1);
      }
      p.shop[i] = id;
    }
    if (!wanted.size || p.shop.some(id => id && wanted.has(id))) p.pity = 0;
    else p.pity = (p.pity || 0) + 1;
  }

  rerollCheck(p) {
    if (this.shopOff(p)) return { ok: false, reason: '후발 주자: 상점이 비활성화되어 있습니다' };
    if (this.rerollCost(p) > p.gold) return { ok: false, reason: '골드가 부족합니다' };
    return { ok: true, reason: '' };
  }

  reroll(p) {
    const paid = this.payReroll(p);
    if (!paid) return false;
    this.augRerolled(p);
    const bt = this.bugTier(p);
    if (bt >= 3) p.addXp(bt >= 6 ? 2 : 1);
    this.augLevels(p);
    if (paid === 2 && bt >= 2 && this.rng.next() < (bt >= 6 ? 0.6 : 0.3)) {
      p.gold += CONFIG.rerollCost;
      this.notify(p, '벌레 시너지: 무료 새로고침!', 'loot');
    }
    this.refreshShop(p);
    return true;
  }

  buyXp(p) {
    if (p.level >= p.maxLevel()) return false;
    if (p.gold < CONFIG.xpCost) return false;
    p.gold -= CONFIG.xpCost;
    p.addXp(CONFIG.xpAmount + (this.hasAug(p, 'studyagain') ? 2 : 0));
    this.augLevels(p);
    return true;
  }

  countMergeable(p, unitId, star) {
    const list = this.phase === 'combat' ? p.benchUnits() : p.allUnits();
    return list.filter(u => u.unitId === unitId && u.star === star).length;
  }

  canBuy(p, slot) {
    const id = p.shop[slot];
    if (!id) return { ok: false, reason: '' };
    const def = UNITS[id];
    if (p.gold < def.cost) return { ok: false, reason: '골드가 부족합니다' };
    if (this.lockedVariants(p).has(id)) return { ok: false, reason: '이미 다른 폼을 가지고 있습니다' };
    if (p.freeBenchSlot() < 0 && this.countMergeable(p, id, 1) < 2) return { ok: false, reason: '대기석이 가득 찼습니다' };
    return { ok: true, reason: '' };
  }

  buy(p, slot) {
    const check = this.canBuy(p, slot);
    if (!check.ok) return null;
    const id = p.shop[slot];
    const def = UNITS[id];
    p.gold -= def.cost;
    p.shop[slot] = null;
    this.augBought(p);
    const up = p.augs.length ? this.augBuyStar(p, def) : null;
    if (up && (p.freeBenchSlot() >= 0 || this.countMergeable(p, id, up.star) >= 2)) {
      p.augState[up.key] = false;
      const inst = this.addUnit(p, id, up.star);
      if (inst) {
        this.onStarUp(p, inst, true);
        this.notify(p, formOf(def, up.star, p, inst).name + ' ' + '★'.repeat(up.star) + '(으)로 바로 업그레이드!', 'merge');
      }
      return inst;
    }
    return this.addUnit(p, id, 1);
  }

  addUnit(p, unitId, star) {
    const inst = newInstance(unitId, star || 1);
    const slot = p.freeBenchSlot();
    if (slot >= 0) {
      p.placeBench(inst, slot);
      this.mergeAll(p);
      return inst;
    }
    if (this.countMergeable(p, unitId, inst.star) >= 2) {
      this.mergeAll(p, inst);
      return inst;
    }
    return null;
  }

  mergeAll(p, extra) {
    const benchOnly = this.phase === 'combat';
    let floating = extra || null;
    const rank = u => (u === floating ? 0 : u.loc && u.loc.zone === 'bench' ? 1 : 2);
    for (let guard = 0; guard < 30; guard++) {
      const list = (benchOnly ? p.benchUnits() : p.allUnits()).slice();
      if (floating) list.push(floating);
      const groups = new Map();
      for (const u of list) {
        if (u.star >= 3) continue;
        const k = u.unitId + '|' + u.star;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(u);
      }
      let merged = false;
      for (const g of groups.values()) {
        if (g.length < 3) continue;
        const placed = g.filter(u => u.loc);
        const onBoard = placed.filter(u => u.loc.zone === 'board' && !u.overflow);
        const onBench = placed.filter(u => u.loc.zone === 'bench').sort((a, b) => a.loc.i - b.loc.i);
        const keep = onBoard[0] || onBench[0] || placed.find(u => u.overflow);
        if (!keep) continue;
        const others = g.filter(u => u !== keep).sort((a, b) => rank(a) - rank(b)).slice(0, 2);
        const srcs = others.map(o => ({ iid: o.iid, loc: o.loc ? Object.assign({}, o.loc) : null }));
        for (const o of others) {
          if (o === floating) floating = null;
          else p.remove(o);
        }
        const preForm = formOf(UNITS[keep.unitId], keep.star, p, keep).name;
        const fielded = [keep].concat(others).some(u => p.participants && p.participants.has(u.iid));
        const pool = (keep.items || []).concat(...others.map(o => o.items || []));
        keep.items = [];
        for (const x of pool) {
          const d = itemDef(x);
          const ci = d && d.kind === 'component' ? keep.items.findIndex(y => itemDef(y) && itemDef(y).kind === 'component') : -1;
          const res = ci >= 0 ? combineItems(keep.items[ci], x) : null;
          if (res && !uniqueClash(keep.items, res, ci)) {
            keep.items[ci] = res;
            this.augCrafted(p);
          } else if ((d && d.gloves ? !keep.items.length : itemSlotsUsed(keep.items) < 3) && !uniqueClash(keep.items, x)) keep.items.push(x);
          else p.items.push(x);
        }
        for (const o of others) o.items = [];
        if (hasItem(keep, 'everstone')) {
          keep.fz = keep.fz || (others.find(o => o.fz) || {}).fz || preForm;
          keep.fzFree = false;
        }
        keep.star += 1;
        keep.wins = Math.max(keep.wins, ...others.map(o => o.wins));
        keep.pvpWins = Math.max(keep.pvpWins, ...others.map(o => o.pvpWins));
        keep.takedowns = Math.max(keep.takedowns, ...others.map(o => o.takedowns));
        keep.battles = Math.max(keep.battles || 0, ...others.map(o => o.battles || 0));
        keep.augOne = Math.max(keep.augOne || 0, ...others.map(o => o.augOne || 0));
        if (others.some(o => o.lockUntil) && !keep.lockUntil) keep.lockUntil = others.find(o => o.lockUntil).lockUntil;
        if (p.augState.locked && others.some(o => p.augState.locked.includes(o.iid)) && !p.augState.locked.includes(keep.iid)) p.augState.locked.push(keep.iid);
        keep.payday = (keep.payday || 0) + others.reduce((s, o) => s + (o.payday || 0), 0);
        for (const o of others) {
          if (!o.feast) continue;
          keep.feast = keep.feast || { atk: 0, spa: 0, def: 0, spd: 0 };
          for (const k in o.feast) keep.feast[k] += o.feast[k];
          if (p.dittoLink === o.iid) p.dittoLink = keep.iid;
        }
        this.onStarUp(p, keep);
        this.augStarUp(p, keep, fielded);
        this.emit('starup', { p, iid: keep.iid, star: keep.star, srcs, removed: others.map(o => o.iid) });
        merged = true;
        break;
      }
      if (!merged) break;
    }
    this.resolveOverflow(p);
  }

  onStarUp(p, inst, silent) {
    const def = UNITS[inst.unitId];
    if (def.branches && inst.star >= def.branchStar && !p.branch[def.id] && !inst.fz && ADAPT[def.id]) {
      const mode = plannedAdaptMode(inst);
      p.branch[def.id] = ADAPT[def.id].evo[mode] || def.branches[0].key;
      p.pendingBranch = p.pendingBranch.filter(x => x !== def.id);
    } else if (def.branches && inst.star >= def.branchStar && !p.branch[def.id] && !inst.fz) {
      if (p.isHuman) {
        if (!p.pendingBranch.includes(def.id)) {
          p.pendingBranch.push(def.id);
          this.emit('branch', { unitId: def.id, p });
        }
      } else {
        p.branch[def.id] = this.rng.pick(def.branches).key;
      }
    }
    if (!silent) this.notify(p, formOf(def, inst.star, p, inst).name + ' ' + '★'.repeat(inst.star) + ' 달성!', 'merge');
  }

  chooseBranch(p, unitId, key) {
    const def = UNITS[unitId];
    if (!def || !def.branches || !def.branches.some(b => b.key === key)) return false;
    p.branch[unitId] = key;
    p.pendingBranch = p.pendingBranch.filter(x => x !== unitId);
    this.emit('update');
    return true;
  }

  sellCheck(p, inst) {
    if (!inst || !inst.loc) return { ok: false, reason: '' };
    if (this.phase === 'combat' && inst.loc.zone === 'board') return { ok: false, reason: '전투 중에는 필드의 기물을 팔 수 없습니다' };
    if (this.augLocked(p, inst)) return { ok: false, reason: '단일 조합 사수: 플레이어 대상 전투에 나간 포켓몬은 팔 수 없습니다' };
    return { ok: true, reason: '' };
  }

  sell(p, inst) {
    if (!this.sellCheck(p, inst).ok) return false;
    const def = UNITS[inst.unitId];
    p.remove(inst);
    this.augSalvage(p, inst);
    this.returnItems(p, inst);
    p.gold += sellValue(def, inst.star);
    this.pool.give(inst.unitId, copiesForStar(inst.star));
    if (def.branches && !p.allUnits().some(u => u.unitId === def.id && u.star >= def.branchStar)) {
      delete p.branch[def.id];
      p.pendingBranch = p.pendingBranch.filter(x => x !== def.id);
    }
    this.resolveOverflow(p);
    return true;
  }

  moveUnit(p, inst, to) {
    if (!inst || !inst.loc) return { ok: false, reason: '' };
    if (inst.overflow) return { ok: false, reason: '자리가 없어 기다리는 기물입니다. 다른 기물을 팔아 자리를 만들어 주세요' };
    if (to.zone === 'board' && (!Hex.inBounds(to.r, to.c) || !Hex.isHome(to.r))) return { ok: false, reason: '' };
    if (to.zone === 'bench' && (to.i < 0 || to.i >= CONFIG.benchSize)) return { ok: false, reason: '' };
    if (this.phase === 'combat' && (inst.loc.zone === 'board' || to.zone === 'board')) {
      return { ok: false, reason: '전투 중에는 필드를 바꿀 수 없습니다' };
    }
    const from = Object.assign({}, inst.loc);
    const other = p.unitAt(to);
    if (other === inst) return { ok: true, reason: '' };
    if (other && other.overflow) return { ok: false, reason: '자리가 없어 기다리는 기물입니다' };
    if (to.zone === 'bench' && from.zone === 'board' && this.augLocked(p, inst)) return { ok: false, reason: '단일 조합 사수: 플레이어 대상 전투에 나간 포켓몬은 대기석에 놓을 수 없습니다' };
    if (to.zone === 'board' && from.zone === 'bench' && other && this.augLocked(p, other)) return { ok: false, reason: '단일 조합 사수: 플레이어 대상 전투에 나간 포켓몬은 대기석에 놓을 수 없습니다' };
    if (to.zone === 'board' && from.zone === 'bench' && this.benchLocked(inst)) return { ok: false, reason: '마지막 포켓몬: 이 포켓몬은 ' + inst.lockUntil + '부터 배치할 수 있습니다' };
    if (to.zone === 'bench' && from.zone === 'board' && other && this.benchLocked(other)) return { ok: false, reason: '마지막 포켓몬: 이 포켓몬은 ' + other.lockUntil + '부터 배치할 수 있습니다' };
    if (from.zone === 'bench' && to.zone === 'board' && !other && p.boardCount() >= p.boardLimit()) {
      return { ok: false, reason: '필드에 놓을 수 있는 기물은 ' + p.boardLimit() + '개입니다' };
    }
    p.remove(inst);
    if (other) p.remove(other);
    p.setAt(to, inst);
    if (other) p.setAt(from, other);
    return { ok: true, reason: '' };
  }

  baseCandidates(p, cost) {
    const locked = this.lockedVariants(p);
    return UNIT_DATA.filter(d => d.shop && d.cost === cost && this.isEligible(p, d) && !locked.has(d.id));
  }

  giveRandomUnit(p, cost) {
    const list = this.baseCandidates(p, cost);
    if (!list.length) {
      p.gold += cost;
      return { def: null, gold: cost };
    }
    const def = this.rng.pick(list);
    const inst = this.addUnit(p, def.id, 1);
    if (!inst) {
      p.gold += cost;
      return { def, gold: cost };
    }
    return { def, gold: 0 };
  }

  makePairings() {
    const alive = this.alivePlayers();
    let best = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const arr = this.rng.shuffle(alive.slice());
      const pairs = [];
      let ok = true;
      for (let i = 0; i + 1 < arr.length; i += 2) {
        pairs.push([arr[i], arr[i + 1], false]);
        if (alive.length > 3 && (arr[i].lastOpponent === arr[i + 1].id || arr[i + 1].lastOpponent === arr[i].id)) ok = false;
      }
      if (arr.length % 2 === 1) {
        const p = arr[arr.length - 1];
        const others = alive.filter(o => o !== p);
        if (others.length) pairs.push([p, this.rng.pick(others), true]);
      }
      best = pairs;
      if (ok) break;
    }
    this.pairings = (best || []).map(([a, b, ghost]) => {
      if (ghost) return [a, b, ghost];
      const key = Math.min(a.id, b.id) + '-' + Math.max(a.id, b.id);
      const last = this.hostLog[key];
      const host = last == null ? (this.rng.next() < 0.5 ? a : b) : last === a.id ? b : a;
      this.hostLog[key] = host.id;
      return host === a ? [a, b, false] : [b, a, false];
    });
    for (const [a, b, ghost] of this.pairings) {
      a.currentOpponent = b.id;
      a.currentGhost = ghost;
      if (!ghost) b.currentOpponent = a.id;
    }
  }

  autoFill(p) {
    for (let guard = 0; guard < 40 && p.boardCount() < p.boardLimit(); guard++) {
      const bench = p.benchUnits().filter(u => !this.benchLocked(u));
      if (!bench.length) break;
      bench.sort((a, b) => UNITS[b.unitId].cost * copiesForStar(b.star) - UNITS[a.unitId].cost * copiesForStar(a.star));
      const inst = bench[0];
      const order = instanceStats(inst, p).range >= 3 ? CELL_ORDER_BACK : CELL_ORDER_FRONT;
      const cell = order.find(([r, c]) => !p.board[r][c]);
      if (!cell) break;
      p.remove(inst);
      p.placeBoard(inst, cell[0], cell[1]);
    }
  }

  combatItemsOf(inst) {
    const own = (inst.items || []).filter(id => itemDef(id) && !isConsumable(id));
    return hasItem(inst, 'thiefs-gloves') ? own.concat(inst.gloveItems || []) : own;
  }

  rollGloves(p) {
    for (const inst of p.allUnits()) {
      if (!hasItem(inst, 'thiefs-gloves')) {
        if (inst.gloveItems) inst.gloveItems = null;
        continue;
      }
      inst.gloveItems = this.pickDistinct(ITEMS.completed.filter(id => !itemDef(id).unique), 2);
    }
  }

  boardSpecs(p, mirror, ghost) {
    const specs = [];
    const strong = strongestDragonIid(p);
    const solo = this.soloActive(p) ? this.soloKeep(p) : null;
    for (const inst of p.boardUnits()) {
      if (solo && inst !== solo) continue;
      const def = UNITS[inst.unitId];
      const form = formOf(def, inst.star, p, inst);
      let r = inst.loc.r;
      let c = inst.loc.c;
      if (mirror) [r, c] = Hex.mirror(r, c);
      const cp = def.id === '메타몽' ? dittoCopy(inst, p) : null;
      if (cp) {
        specs.push({
          iid: ghost ? null : inst.iid,
          unitId: def.id,
          name: cp.form.name,
          form: cp.form,
          traits: cp.traits,
          unlockOnly: cp.def.unlockOnly,
          types: cp.form.types,
          skillType: cp.form.skillType,
          star: cp.star,
          cost: cp.def.cost,
          stats: cp.stats,
          augOne: inst.augOne || 0,
          strongDragon: false,
          ditto: true,
          items: this.combatItemsOf(inst),
          evolvable: false,
          r,
          c
        });
        continue;
      }
      specs.push({
        iid: ghost ? null : inst.iid,
        unitId: def.id,
        name: form.name,
        form,
        traits: allTraitsOf(def, inst.star, p, inst),
        unlockOnly: def.unlockOnly,
        types: form.types,
        skillType: form.skillType,
        star: inst.star,
        cost: def.cost,
        stats: instanceStats(inst, p),
        augOne: inst.augOne || 0,
        strongDragon: inst.iid === strong,
        items: this.combatItemsOf(inst),
        evolvable: canEvolveFurther(inst, p),
        r,
        c
      });
    }
    return specs;
  }

  creepSpecs(camp) {
    return camp.units.map(u => {
      const form = FORM_INDEX[u.name];
      const [r, c] = Hex.mirror(u.r, u.c);
      const stats = computeStats(form, u.cost, u.star, u.mult * CONFIG.pveScale, { hpMult: u.hpMult, range: u.range, legacy: true });
      return { iid: null, unitId: null, creep: true, name: form.name, form, types: form.types, star: u.star, cost: u.cost, stats, r, c, drops: u.drops || 1 };
    });
  }

  currentCamp() {
    return CONFIG.pve[this.roundLabel()] || CONFIG.pve.default;
  }

  takeFruit(p, iid) {
    if (!p.fruit) return { ok: false, reason: '' };
    const id = p.fruit.item;
    p.fruit = null;
    p.items.push(id);
    let res = { ok: true, reason: '' };
    const inst = iid != null ? p.findInstance(iid) : null;
    if (inst && inst.loc) res = this.equipItem(p, p.items.length - 1, inst);
    this.notify(p, itemDef(id).name + '을(를) 얻었습니다' + (inst && res.ok ? ' (장착)' : ''), 'loot');
    this.emit('update');
    return { ok: true, reason: res.ok ? '' : res.reason, item: id, equipped: !!(inst && res.ok) };
  }

  startCombat() {
    for (const p of this.players) if (p.fruit) this.takeFruit(p, null);
    const info = this.roundInfo();
    this.phase = 'combat';
    this.matches = [];
    this.humanSim = null;
    if (info.type === 'encounter') {
      this.emit('combat');
      return null;
    }
    this.autoPickAugs();
    const alive = this.alivePlayers();
    for (const p of alive) {
      this.convertOverflow(p);
      this.collectOrbs(p);
      this.autoFill(p);
      Unlocks.onCombatStart(this, p);
    }
    if (info.type === 'pve') {
      const camp = this.currentCamp();
      for (const p of alive) {
        const teamA = this.teamFor(p, false);
        const sim = new CombatSim(this.boardSpecs(p, false, false), this.creepSpecs(camp), this.rng.seedFor(), this.realtime, teamA, null);
        const m = { kind: 'pve', a: p, b: null, ghost: false, sim, camp, teamA, teamB: null, itemAssign: {} };
        const creeps = sim.units.filter(u => u.side === 'B');
        this.pveItems(p).forEach((id, i) => {
          const cu = creeps.length ? creeps[(creeps.length - 1 - (i % creeps.length))] : null;
          const key = cu ? cu.uid : 0;
          (m.itemAssign[key] = m.itemAssign[key] || []).push(id);
        });
        this.matches.push(m);
        if (p.isHuman) this.humanSim = sim;
      }
    } else {
      for (const pair of this.pairings) {
        const a = pair[0];
        const b = pair[1];
        const ghost = pair[2];
        const teamA = this.teamFor(a, false);
        const teamB = this.teamFor(b, true);
        const sim = new CombatSim(this.boardSpecs(a, false, false), this.boardSpecs(b, true, ghost), this.rng.seedFor(), this.realtime, teamA, teamB);
        this.matches.push({ kind: 'pvp', a, b, ghost, sim, teamA, teamB });
        if (a.isHuman || (b.isHuman && !ghost)) this.humanSim = sim;
      }
    }
    if (!this.realtime) for (const m of this.matches) m.sim.runToEnd();
    this.emit('combat');
    return this.humanSim;
  }

  stepCombat(dt) {
    for (const m of this.matches) {
      if (m.sim.over) continue;
      m.sim.step(dt);
      if (m.kind === 'pve' && m.a.isHuman && this.realtime) this.liveDrops(m);
      if (m.sim.over) this.payWin(m);
    }
  }

  payWin(m) {
    if (m.kind !== 'pvp' || m.winPaid || !m.sim.over) return;
    m.winPaid = true;
    const w = m.sim.winner === 'A' ? m.a : m.sim.winner === 'B' && !m.ghost ? m.b : null;
    if (!w) return;
    w.gold += 1;
    this.notify(w, '승리 보상: 1골드', 'loot');
    this.emit('wingold', w);
  }

  liveDrops(m) {
    let added = false;
    for (const u of m.sim.units) {
      if (u.side !== 'B' || u.alive || u.dropped) continue;
      u.dropped = true;
      for (let i = 0; i < (u.drops || 1); i++) m.a.orbs.push(this.makeOrb(u.deathR, u.deathC));
      for (const id of this.takeAssigned(m, u.uid)) m.a.orbs.push(this.makeItemOrb(id, u.deathR, u.deathC));
      added = true;
    }
    if (added) this.emit('orbs');
  }

  takeAssigned(m, uid) {
    if (!m || !m.itemAssign || !m.itemAssign[uid]) return [];
    const list = m.itemAssign[uid];
    delete m.itemAssign[uid];
    return list;
  }

  makeItemOrb(id, r, c) {
    return { id: this.orbSeq++, tier: 'item', grade: 'item', r, c, gold: 0, cost: 0, item: id };
  }

  randomComponent() {
    return this.rng.pick(ITEMS.components);
  }

  randomCompleted() {
    return this.rng.pick(ITEMS.completed);
  }

  pveItems(p) {
    const out = [];
    if (this.stage === 1) {
      if (!p.stage1Items) p.stage1Items = 3 + this.rng.int(2);
      const n = this.round >= 4 ? Math.max(0, p.stage1Items - p.stage1Given) : 1;
      for (let i = 0; i < n; i++) out.push(this.randomComponent());
      p.stage1Given += n;
      return out;
    }
    if (this.stage <= 4) {
      const n = 3 + this.rng.int(2);
      for (let i = 0; i < n; i++) out.push(this.randomComponent());
    } else {
      for (let i = 0; i < 2; i++) out.push(this.randomCompleted());
    }
    out.push('magnet');
    if (this.rng.next() < CONFIG.diceChance) out.push('loaded-dice');
    return out;
  }

  combatUnitOf(p, inst) {
    if (this.phase !== 'combat' || !inst || !inst.loc || inst.loc.zone !== 'board') return null;
    const m = this.matchFor(p);
    const side = this.sideOf(m, p);
    if (!m || !side || !m.sim) return null;
    return m.sim.units.find(u => u.side === side && u.iid === inst.iid) || null;
  }

  syncCombatItems(p, inst, cu) {
    if (!cu) return;
    const m = this.matchFor(p);
    if (!m || m.sim.over) return;
    m.sim.setOwnItems(cu, this.combatItemsOf(inst), cu.ditto ? false : canEvolveFurther(inst, p));
  }

  useCandy(p, i, inst, d) {
    const def = UNITS[inst.unitId];
    if (inst.star >= 3) return { ok: false, reason: '이미 3성인 기물입니다' };
    if (def.cost > d.maxCost) return { ok: false, reason: d.name + '은(는) ' + d.maxCost + '코스트' + (d.maxCost > 1 ? ' 이하' : '') + ' 기물에게만 쓸 수 있습니다' };
    p.items.splice(i, 1);
    inst.star += 1;
    this.onStarUp(p, inst);
    this.augStarUp(p, inst, !!(p.participants && p.participants.has(inst.iid)));
    this.mergeAll(p);
    this.emit('update');
    return { ok: true, reason: '' };
  }

  useDuplicator(p, i, inst, d) {
    const def = UNITS[inst.unitId];
    if (!def) return { ok: false, reason: '' };
    if (def.cost > d.maxCost) return { ok: false, reason: d.name + '은(는) ' + d.maxCost + '코스트' + (d.maxCost > 1 ? ' 이하' : '') + ' 기물에게만 쓸 수 있습니다' };
    if (p.freeBenchSlot() < 0 && this.countMergeable(p, inst.unitId, 1) < 2) return { ok: false, reason: '대기석이 가득 찼습니다' };
    if (this.pool.remaining(inst.unitId) < 1) return { ok: false, reason: '창고에 남은 ' + formOf(def, 1, p).name + '이(가) 없습니다' };
    this.pool.take(inst.unitId, 1);
    const made = this.addUnit(p, inst.unitId, 1);
    if (!made) {
      this.pool.give(inst.unitId, 1);
      return { ok: false, reason: '대기석이 가득 찼습니다' };
    }
    p.items.splice(i, 1);
    this.notify(p, formOf(def, 1, p).name + ' 복사본을 얻었습니다', 'loot');
    this.emit('update');
    return { ok: true, reason: '' };
  }

  itemEntries(p) {
    const list = [];
    const groups = {};
    p.items.forEach((id, idx) => {
      if (isConsumable(id)) {
        if (groups[id]) {
          groups[id].ids.push(id);
          return;
        }
        groups[id] = { start: idx, ids: [id] };
        list.push(groups[id]);
        return;
      }
      list.push({ start: idx, ids: [id] });
    });
    return list;
  }

  swapItemEntries(p, i, j) {
    const list = this.itemEntries(p);
    const a = list.findIndex(e => e.start === i || (e.ids.length > 1 && p.items[i] === e.ids[0]));
    const b = list.findIndex(e => e.start === j || (e.ids.length > 1 && p.items[j] === e.ids[0]));
    if (a < 0 || b < 0 || a === b) return { ok: false, reason: '' };
    const t = list[a];
    list[a] = list[b];
    list[b] = t;
    p.items = [].concat(...list.map(e => e.ids));
    this.emit('update');
    return { ok: true, reason: '' };
  }

  reforgeId(id) {
    const d = itemDef(id);
    if (!d || d.special) return id;
    let pool = null;
    if (d.kind === 'component') pool = ITEMS.components;
    else if (d.radiant) pool = ITEMS.radiants;
    else if (d.kind === 'completed') pool = ITEMS.completed;
    else if (d.kind === 'treasure') pool = ITEMS.treasures[d.tier];
    if (!pool) return id;
    const opts = pool.filter(x => x !== id);
    return opts.length ? opts[this.rng.int(opts.length)] : id;
  }

  defHasTrait(def, t) {
    if (def.traits.includes(t)) return true;
    if ((def.stageForms || def.forms).some(f => f.types.includes(t))) return true;
    return (def.branches || []).some(b => b.form.types.includes(t) || (b.traits || []).includes(t));
  }

  useTraitShop(p, i, inst) {
    const def = UNITS[inst.unitId];
    const want = allTraitsOf(def, inst.star, p, inst).filter(t => !def.uniques.includes(t));
    if (!want.length) return { ok: false, reason: '시너지가 없는 기물입니다' };
    const match = d => want.some(t => this.defHasTrait(d, t));
    p.items.splice(i, 1);
    for (let k = 0; k < p.shop.length; k++) {
      if (p.shop[k]) this.pool.give(p.shop[k], 1);
      p.shop[k] = null;
    }
    const locked = this.lockedVariants(p);
    for (let k = 0; k < CONFIG.shopSize; k++) {
      const id = this.rollShopUnit(p, locked, null, match);
      if (id) this.pool.take(id, 1);
      p.shop[k] = id;
    }
    this.notify(p, '두드리짱의 망치: ' + formOf(def, inst.star, p, inst).name + '와(과) 시너지가 겹치는 포켓몬으로 상점을 채웠습니다', 'loot');
    this.emit('update');
    return { ok: true, reason: '' };
  }

  useReforge(p, i, inst, cu) {
    const own = (inst.items || []).filter(x => itemDef(x) && !isConsumable(x));
    if (!own.length) return { ok: false, reason: '아이템이 없는 기물입니다' };
    p.items.splice(i, 1);
    inst.items = (inst.items || []).filter(x => !own.includes(x));
    for (const id of own) p.items.push(this.reforgeId(id));
    this.syncCombatItems(p, inst, cu);
    this.notify(p, '아이템 ' + own.length + '개를 바꿨습니다', 'loot');
    this.emit('update');
    return { ok: true, reason: '' };
  }

  equipItem(p, index, inst) {
    const fail = reason => ({ ok: false, reason });
    const i = Math.floor(Number(index));
    const id = p.items[i];
    if (!id || !itemDef(id)) return fail('');
    if (!inst || !inst.loc || p.findInstance(inst.iid) !== inst) return fail('');
    const cu = this.combatUnitOf(p, inst);
    if (cu && !cu.alive) return fail('쓰러진 기물에는 아이템을 쓸 수 없습니다');
    const d = itemDef(id);
    inst.items = inst.items || [];
    if (d.candy) return this.useCandy(p, i, inst, d);
    if (d.dup) return this.useDuplicator(p, i, inst, d);
    if (d.traitShop) return this.useTraitShop(p, i, inst);
    if (d.reforge) return this.useReforge(p, i, inst, cu);
    if (d.lucky) return this.useLucky(p, i, inst);
    if (d.box) return fail('상자는 클릭해서 여세요');
    if (d.magnet) {
      if (!inst.items.length) return fail('아이템이 없는 기물입니다');
      if (!d.keep) p.items.splice(i, 1);
      const out = inst.items.splice(0);
      inst.gloveItems = null;
      for (const x of out) p.items.push(x);
      this.syncCombatItems(p, inst, cu);
      this.notify(p, d.name + ': 아이템 ' + out.length + '개를 뺐습니다', 'info');
      this.emit('update');
      return { ok: true, reason: '' };
    }
    if (hasItem(inst, 'thiefs-gloves')) return fail('도적의 장갑이 아이템 칸을 모두 차지하고 있습니다');
    if (d.kind === 'component') {
      const ci = inst.items.findIndex(x => itemDef(x) && itemDef(x).kind === 'component');
      if (ci >= 0) {
        const res = combineItems(inst.items[ci], id);
        if (!res) return fail('');
        if (uniqueClash(inst.items, res, ci)) return fail(itemDef(res).name + '은(는) 한 기물에 하나만 장착할 수 있습니다');
        inst.items[ci] = res;
        p.items.splice(i, 1);
        this.notify(p, itemDef(res).name + ' 완성!', 'merge');
        this.augCrafted(p);
        this.syncCombatItems(p, inst, cu);
        this.onItemsChanged(p, inst);
        return { ok: true, reason: '' };
      }
    }
    if (d.gloves && inst.items.length) return fail('도적의 장갑은 아이템이 없는 포켓몬에게만 줄 수 있습니다');
    if (itemSlotsUsed(inst.items) >= 3) return fail('아이템은 3개까지 장착할 수 있습니다');
    if (uniqueClash(inst.items, id)) return fail(d.name + '은(는) 한 기물에 하나만 장착할 수 있습니다');
    inst.items.push(id);
    p.items.splice(i, 1);
    if (d.gloves) inst.gloveItems = this.pickDistinct(ITEMS.completed.filter(x => !itemDef(x).unique), 2);
    this.syncCombatItems(p, inst, cu);
    this.onItemsChanged(p, inst);
    return { ok: true, reason: '' };
  }

  useLucky(p, i, inst) {
    if (p.boxOpen) return { ok: false, reason: '먼저 열어 둔 상자에서 아이템을 고르세요' };
    const choices = this.augRecommend(p, inst, 4);
    if (!choices.length) return { ok: false, reason: '' };
    p.items.splice(i, 1);
    p.boxOpen = { id: 'lucky-box', choices, left: CONFIG.boxTime, unit: formOf(UNITS[inst.unitId], inst.star, p, inst).name };
    this.emit('update');
    return { ok: true, reason: '' };
  }

  combineBench(p, i, j) {
    const fail = reason => ({ ok: false, reason });
    const a = Math.floor(Number(i));
    const b = Math.floor(Number(j));
    if (a === b || !p.items[a] || !p.items[b]) return fail('');
    const da = itemDef(p.items[a]);
    const db = itemDef(p.items[b]);
    if (!da || !db || da.kind !== 'component' || db.kind !== 'component') return fail('조합 아이템끼리만 합칠 수 있습니다');
    const res = combineItems(p.items[a], p.items[b]);
    if (!res) return fail('');
    p.items[b] = res;
    p.items.splice(a, 1);
    this.notify(p, itemDef(res).name + ' 완성!', 'merge');
    this.augCrafted(p);
    this.emit('update');
    return { ok: true, reason: '' };
  }

  onItemsChanged(p, inst) {
    if (hasItem(inst, 'everstone')) {
      if (!inst.fz) inst.fz = formOf(UNITS[inst.unitId], inst.star, p, inst).name;
      inst.fzFree = false;
    }
    this.emit('update');
  }

  returnItems(p, inst) {
    if (!inst || !inst.items || !inst.items.length) return;
    for (const x of inst.items) p.items.push(x);
    inst.items = [];
  }

  markStoneFree(p) {
    for (const u of p.allUnits()) if (u.fz && !hasItem(u, 'everstone')) u.fzFree = true;
  }

  releaseStones(p) {
    for (const u of p.allUnits()) {
      if (!u.fz || hasItem(u, 'everstone') || !u.fzFree) continue;
      const before = u.fz;
      u.fz = null;
      u.fzFree = false;
      const now = formOf(UNITS[u.unitId], u.star, p, u).name;
      if (now !== before) this.notify(p, before + ' → ' + now + ' 진화!', 'evolve');
      this.onStarUp(p, u, true);
    }
  }

  allCombatOver() {
    return this.matches.every(m => m.sim.over);
  }

  matchFor(p) {
    return this.matches.find(m => m.a === p || (m.b === p && !m.ghost)) || null;
  }

  sideOf(match, p) {
    if (!match) return null;
    if (match.a === p) return 'A';
    if (match.b === p && !match.ghost) return 'B';
    return null;
  }

  rollOrbTier() {
    const t = CONFIG.orbs[Math.min(5, this.stage)];
    const r = this.rng.next();
    if (r < t.gold) return 'gold';
    if (r < t.gold + t.blue) return 'blue';
    return 'gray';
  }

  makeOrb(r, c) {
    const tier = this.rollOrbTier();
    const orb = { id: this.orbSeq++, tier: 'white', grade: tier, r, c, gold: 0, cost: 0 };
    if (tier === 'gray') {
      orb.gold = this.stage === 1 ? 1 + this.rng.int(2) : 2 + this.rng.int(3);
    } else if (tier === 'blue') {
      orb.cost = this.stage === 1 ? 1 : this.lootCost();
    } else {
      orb.cost = Math.min(5, this.lootCost() + 1);
    }
    return orb;
  }

  dropOrbs(p, sim, m) {
    const orbs = [];
    for (const u of sim.units) {
      if (u.side !== 'B' || u.alive || u.dropped) continue;
      u.dropped = true;
      for (let i = 0; i < (u.drops || 1); i++) orbs.push(this.makeOrb(u.deathR, u.deathC));
      for (const id of this.takeAssigned(m, u.uid)) orbs.push(this.makeItemOrb(id, u.deathR, u.deathC));
    }
    if (m && m.itemAssign) {
      for (const key in m.itemAssign) {
        const cu = sim.byUid[key];
        for (const id of m.itemAssign[key]) orbs.push(this.makeItemOrb(id, cu ? (cu.alive ? cu.r : cu.deathR) : 3, cu ? (cu.alive ? cu.c : cu.deathC) : 3));
      }
      m.itemAssign = {};
    }
    if (p.isHuman && this.realtime) {
      p.orbs = (p.orbs || []).concat(orbs);
      return orbs;
    }
    for (const o of orbs) this.openOrb(p, o);
    return orbs;
  }

  openOrb(p, orb) {
    if (orb.item) {
      this.giveItem(p, orb.item);
      const d = itemDef(orb.item);
      this.notify(p, '전리품: ' + (d ? d.name : orb.item), 'loot');
      return;
    }
    if (orb.gold) {
      p.gold += orb.gold;
      this.notify(p, '전리품: ' + orb.gold + '골드', 'loot');
      return;
    }
    const res = this.giveRandomUnit(p, orb.cost);
    if (res.def && !res.gold) this.notify(p, '전리품: ' + formOf(res.def, 1, p).name + ' (' + orb.cost + '코스트)', 'loot');
    else if (res.gold) this.notify(p, '전리품: ' + res.gold + '골드 (대기석 부족)', 'loot');
  }

  pickOrb(p, id) {
    const list = p.orbs || [];
    const i = list.findIndex(o => o.id === id);
    if (i < 0) return null;
    const orb = list.splice(i, 1)[0];
    this.openOrb(p, orb);
    this.emit('update');
    return orb;
  }

  collectOrbs(p) {
    const list = p.orbs || [];
    p.orbs = [];
    for (const o of list) this.openOrb(p, o);
  }

  afterSynergy(p, team, sim, side, won, pvp) {
    const st = sim.side[side].stats;
    p.counters.bolt += st.bolt;
    p.counters.burn += st.burn;
    p.counters.hypnosis += st.hypno || 0;
    if (!team) return;
    const tier = id => team.tiers[id] || 0;
    if (tier('치유의 마음')) p.counters.heal += st.heal * (p.boardUnits().some(u => u.unitId === '핑복' && u.star >= 3) ? 2 : 1);
    if (tier('다운로드')) p.counters.download += sim.casts;
    if (tier('유전자') && pvp) {
      p.counters.gene += sim.units.length;
      this.notify(p, '유전자 +' + sim.units.length + ' (총 ' + p.counters.gene + ')', 'loot');
    }
    if (tier('드래곤') && won) {
      const n = sim.survivors(side).filter(u => u.types.includes('드래곤')).length;
      if (n) {
        p.dragonScales += n;
        this.notify(p, '용의 비늘 +' + n + ' (총 ' + p.dragonScales + '개)', 'loot');
      }
    }
  }

  payGold(p, sim, side) {
    for (const u of sim.units) {
      if (u.side !== side || !u.payday || !u.iid) continue;
      const inst = p.findInstance(u.iid);
      if (inst) inst.payday = (inst.payday || 0) + u.payday;
    }
    const g = sim.side[side].gold;
    if (g) {
      p.gold += g;
      this.notify(p, '고양이돈받기: ' + g + '골드', 'loot');
    }
    const sg = sim.side[side].swordGold;
    if (sg) {
      p.gold += sg;
      this.notify(p, '완벽한 녹슨검: ' + sg + '골드', 'loot');
    }
  }

  isGroundDef(def) {
    const forms = (def.stageForms || def.forms).concat((def.branches || []).map(b => b.form));
    return forms.some(f => f.types.includes('땅'));
  }

  groundTier(p) {
    return synergyTeam(p).tiers['땅'] || 0;
  }

  mining(p, team, res) {
    const tier = team && team.tiers ? team.tiers['땅'] || 0 : 0;
    if (!tier) return;
    const cfg = CONFIG.mine;
    if (res === 'loss') {
      const n = Math.max(1, -p.streak);
      const gain = Math.round((cfg.base + cfg.step * (n - 1)) * traitVal('땅', 'gain', tier));
      p.mine += gain;
      this.notify(p, '땅굴을 팠습니다: 채굴 스택 +' + gain + ' (현재 ' + p.mine + ')', 'loot');
    } else if (res === 'win') {
      const cut = Math.floor(p.mine * cfg.winCut);
      if (cut > 0) {
        p.mine -= cut;
        this.notify(p, '승리: 채굴 스택 -' + cut + ' (현재 ' + p.mine + ')', 'info');
      }
    }
  }

  mineThreshold(p) {
    const th = Math.min(700, Math.floor((p.mine || 0) / 100) * 100);
    return th >= 100 ? th : 0;
  }

  refreshMineOffer(p) {
    const th = this.mineThreshold(p);
    if (!th) {
      p.mineOffer = null;
      return;
    }
    if (p.mineOffer && p.mineOffer.th === th) return;
    p.mineOffer = { th, list: this.rollMineRewards(p, th) };
  }

  pickGroundUnit(p, cost, star) {
    const locked = this.lockedVariants(p);
    const copies = copiesForStar(star);
    const list = UNIT_DATA.filter(d => d.shop && d.cost === cost && this.isGroundDef(d) && this.isEligible(p, d) && !locked.has(d.id) && this.pool.remaining(d.id) >= copies);
    return list.length ? this.rng.pick(list).id : null;
  }

  rollMineRewards(p, th) {
    const out = [];
    const add = e => {
      if (e.pick) {
        const branch = e.pick[this.rng.int(e.pick.length)];
        for (const x of branch) add(x);
        return;
      }
      if (e.item) {
        const m = /^t(\d)$/.exec(e.item);
        out.push({ k: 'item', id: m ? this.rng.pick(ITEMS.treasures[Number(m[1])]) : e.item });
        return;
      }
      if (e.unit) {
        const star = e.star || 1;
        const id = this.pickGroundUnit(p, e.unit, star);
        if (id) out.push({ k: 'unit', id, star });
        else out.push({ k: 'gold', n: e.unit * copiesForStar(star) });
        return;
      }
      if (e.gold) out.push({ k: 'gold', n: e.gold });
    };
    for (const e of CONFIG.mine.rewards[th] || []) add(e);
    return out;
  }

  canTakeMine(p) {
    return this.phase === 'planning' && !!p.mineOffer && !p.mineSkip && p.mine >= p.mineOffer.th && this.groundTier(p) >= 1;
  }

  takeMine(p) {
    if (!p.mineOffer) return { ok: false, reason: '' };
    if (this.groundTier(p) < 1) return { ok: false, reason: '땅 시너지가 켜져 있어야 채굴 보상을 받을 수 있습니다' };
    if (!this.canTakeMine(p)) return { ok: false, reason: '' };
    const offer = p.mineOffer;
    p.mine -= offer.th;
    p.mineOffer = null;
    for (const e of offer.list) {
      if (e.k === 'item') this.giveItem(p, e.id);
      else if (e.k === 'gold') p.gold += e.n;
      else if (e.k === 'unit') {
        const def = UNITS[e.id];
        const copies = copiesForStar(e.star);
        if (this.pool.remaining(e.id) >= copies) {
          this.pool.take(e.id, copies);
          if (!this.addUnit(p, e.id, e.star)) {
            this.pool.give(e.id, copies);
            p.gold += def.cost * copies;
          }
        } else p.gold += def.cost * copies;
      }
    }
    this.notify(p, '채굴 보상을 받았습니다 (채굴 스택 -' + offer.th + ')', 'loot');
    this.refreshMineOffer(p);
    this.emit('update');
    return { ok: true, reason: '' };
  }

  skipMine(p) {
    if (!p.mineOffer) return { ok: false, reason: '' };
    p.mineSkip = true;
    this.emit('update');
    return { ok: true, reason: '' };
  }

  damageFor(survivors) {
    const stageDmg = CONFIG.stageDamage[Math.min(8, this.stage)];
    return stageDmg + survivors.reduce((s, u) => s + (CONFIG.unitDamage[u.star] || 1), 0);
  }

  applyPvp(p, result, enemySurvivors) {
    if (result === 'win') {
      p.streak = p.streak > 0 ? p.streak + 1 : 1;
      p.lastResult = 'win';
    } else if (result === 'draw') {
      p.streak = 0;
      p.lastResult = 'draw';
      const dmg = enemySurvivors.length + 1;
      p.hp -= dmg;
      p.lastDamage = dmg;
    } else {
      p.streak = p.streak < 0 ? p.streak - 1 : -1;
      p.lastResult = 'loss';
      const dmg = this.damageFor(enemySurvivors);
      p.hp -= dmg;
      p.lastDamage = dmg;
    }
  }

  lootCost() {
    if (this.stage <= 2) return 2;
    if (this.stage === 3) return 3;
    if (this.stage === 4) return this.rng.pick([3, 4]);
    if (this.stage === 5) return 4;
    return this.rng.pick([4, 5]);
  }

  finishCombat() {
    for (const m of this.matches) {
      if (!m.sim.over) m.sim.runToEnd();
      const sim = m.sim;
      if (m.kind === 'pve') {
        const p = m.a;
        const won = sim.winner === 'A';
        p.lastResult = won ? 'win' : 'loss';
        if (!won) {
          const dmg = this.damageFor(sim.survivors('B'));
          p.hp -= dmg;
          p.lastDamage = dmg;
        }
        this.payGold(p, sim, 'A');
        this.augAfterCombat(p, sim, 'A', won ? 'win' : 'loss', false);
        Unlocks.onCombatEnd(this, p, sim, 'A', false);
        this.markStoneFree(p);
        this.afterSynergy(p, m.teamA, sim, 'A', won, false);
        this.dropOrbs(p, sim, m);
        if (p.isHuman && this.realtime && (p.orbs || []).length) {
          this.collectOrbs(p);
          this.emit('orbs');
        }
      } else {
        this.payWin(m);
        const a = m.a;
        const b = m.b;
        const resA = sim.winner === 'draw' ? 'draw' : sim.winner === 'A' ? 'win' : 'loss';
        const resB = sim.winner === 'draw' ? 'draw' : sim.winner === 'B' ? 'win' : 'loss';
        this.applyPvp(a, resA, sim.survivors('B'));
        if (!m.ghost) this.applyPvp(b, resB, sim.survivors('A'));
        if (!m.ghost) {
          this.augDealt(a, b.lastDamage || 0);
          this.augDealt(b, a.lastDamage || 0);
        }
        this.mining(a, m.teamA, resA);
        this.payGold(a, sim, 'A');
        this.augAfterCombat(a, sim, 'A', resA, true);
        Unlocks.onCombatEnd(this, a, sim, 'A', true);
        this.markStoneFree(a);
        this.afterSynergy(a, m.teamA, sim, 'A', sim.winner === 'A', true);
        a.lastOpponent = b.id;
        if (!m.ghost) {
          this.mining(b, m.teamB, resB);
          this.payGold(b, sim, 'B');
          this.augAfterCombat(b, sim, 'B', resB, true);
          Unlocks.onCombatEnd(this, b, sim, 'B', true);
          this.markStoneFree(b);
          this.afterSynergy(b, m.teamB, sim, 'B', sim.winner === 'B', true);
          b.lastOpponent = a.id;
        }
      }
    }
    const label = this.roundLabel();
    for (const m of this.matches) {
      m.a.history[label] = m.a.lastResult;
      if (m.b && !m.ghost) m.b.history[label] = m.b.lastResult;
    }
    this.encounterAfterDamage();
    this.handleEliminations();
    this.phase = this.alivePlayers().length <= 1 || (this.solo && this.human && !this.human.alive) ? 'over' : 'result';
    this.emit('result');
  }

  handleEliminations() {
    const dying = this.players.filter(p => p.alive && p.hp <= 0);
    if (!dying.length) return;
    let rank = this.alivePlayers().length;
    dying.sort((a, b) => a.hp - b.hp);
    for (const p of dying) {
      p.alive = false;
      p.hp = 0;
      p.placement = rank--;
      for (const inst of p.allUnits()) {
        this.pool.give(inst.unitId, copiesForStar(inst.star));
        p.remove(inst);
      }
      for (let i = 0; i < p.shop.length; i++) {
        if (p.shop[i]) this.pool.give(p.shop[i], 1);
        p.shop[i] = null;
      }
      this.emit('eliminated', p);
    }
    this.augEliminations();
    const alive = this.alivePlayers();
    if (this.encounter === '썬더') {
      const pot = dying.reduce((s, p) => s + p.gold, 0);
      for (const p of dying) p.gold = 0;
      const each = alive.length ? Math.floor(pot / alive.length) : 0;
      if (each > 0) {
        for (const q of alive) {
          q.gold += each;
          this.notify(q, '썬더: 탈락한 플레이어의 골드 ' + each + '을(를) 나눠 받았습니다', 'loot');
        }
      }
    }
    if (alive.length === 1) alive[0].placement = 1;
  }

  nextRound() {
    if (this.phase === 'over') return;
    this.round += 1;
    if (this.round > this.roundsInStage(this.stage)) {
      this.stage += 1;
      this.round = 1;
    }
    this.beginRound();
  }

  setupCarousel() {
    const costs = CONFIG.carouselCosts[Math.min(7, this.stage)] || CONFIG.carouselCosts[7];
    const items = [];
    const used = new Set();
    costs.forEach((c, i) => {
      const all = UNIT_DATA.filter(d => d.shop && this.regionAllowed(d));
      let list = all.filter(d => d.cost === c && !used.has(d.id));
      if (!list.length) list = all.filter(d => !used.has(d.id)).sort((a, b) => Math.abs(a.cost - c) - Math.abs(b.cost - c)).filter((d, _, arr) => d.cost === arr[0].cost);
      const pick = this.rng.pick(list);
      used.add(pick.id);
      const it = this.stage >= 5 ? this.randomCompleted() : this.randomComponent();
      items.push({ unitId: pick.id, item: it, takenBy: null, angle: (Math.PI * 2 * i) / costs.length });
    });
    const order = this.rng.shuffle(this.alivePlayers().slice());
    order.sort((a, b) => a.hp - b.hp);
    const cfg = CONFIG.carousel;
    const release = {};
    order.forEach((p, i) => {
      release[p.id] = cfg.firstRelease + Math.floor(i / 2) * cfg.releaseGap;
      if (this.hasAug(p, 'titan')) release[p.id] = Math.max(0, cfg.firstRelease - 2);
    });
    const lastRelease = cfg.firstRelease + Math.floor((order.length - 1) / 2) * cfg.releaseGap;
    this.carousel = { items, order, release, picked: {}, time: 0, duration: lastRelease + cfg.lastWindow, done: false };
  }

  setupGather() {
    const order = this.alivePlayers().slice();
    const release = {};
    for (const p of order) release[p.id] = 0;
    this.carousel = { items: [], order, release, picked: {}, time: 0, duration: CONFIG.encounterTime, done: false, encounter: this.encounter };
  }

  applyEncounterStart() {
    const e = this.encounter;
    for (const p of this.alivePlayers()) {
      if (e === '피카츄') this.giveRandomUnit(p, 2);
      else if (e === '이브이') this.giveRandomUnit(p, 3);
      else this.giveRandomUnit(p, 1);
      if (e === '폴리곤') {
        this.giveBox(p, 'poke-box');
        this.giveBox(p, 'poke-box');
      }
    }
  }

  encounterAfterDamage() {
    const e = this.encounter;
    for (const p of this.players) {
      if (!p.alive) continue;
      if (e === '프리져' && !p.frzUsed && p.lastDamage > 0 && p.hp <= 1) {
        p.frzUsed = true;
        p.hp = 1;
        this.notify(p, '프리져: 이번 라운드를 체력 1로 버텼습니다', 'loot');
      }
      if (e === '파이어' && !p.fireUsed && p.hp > 0 && p.hp < 30) {
        p.fireUsed = true;
        for (let i = 0; i < 3; i++) this.giveBox(p, 'great-box');
        p.gold += 20;
        this.notify(p, '파이어: 큰 모으령 상자 3개와 20골드를 받았습니다', 'loot');
      }
    }
  }

  pickDistinct(list, n) {
    const pool = list.slice();
    const out = [];
    while (out.length < n && pool.length) out.push(pool.splice(this.rng.int(pool.length), 1)[0]);
    return out;
  }

  boxChoices(id, p) {
    const d = itemDef(id);
    if (d && d.box === 'radiant') return this.pickDistinct(ITEMS.radiants, 5);
    const pool = d && d.box === 'completed' ? ITEMS.completed : d && d.box === 'treasure3' ? ITEMS.treasures[3] : ITEMS.components;
    return this.pickDistinct(pool, 4);
  }

  giveItem(p, id) {
    const d = itemDef(id);
    if (d && d.box) this.giveBox(p, id);
    else if (d && d.lucky && !p.isHuman) p.items.push(this.randomCompleted());
    else p.items.push(id);
  }

  giveBox(p, id) {
    if (p.isHuman) {
      p.items.push(id);
      return;
    }
    const ch = this.boxChoices(id, p);
    if (ch.length) p.items.push(ch[this.rng.int(ch.length)]);
  }

  openBox(p, i) {
    const id = p.items[i];
    const d = itemDef(id);
    if (!d || !d.box) return { ok: false, reason: '' };
    if (p.boxOpen) return { ok: false, reason: '먼저 열어 둔 상자에서 아이템을 고르세요' };
    p.items.splice(i, 1);
    p.boxOpen = { id, choices: this.boxChoices(id, p), left: CONFIG.boxTime };
    this.emit('update');
    return { ok: true, reason: '' };
  }

  pickBox(p, n) {
    const b = p.boxOpen;
    const it = b ? b.choices[n] : null;
    if (!it) return { ok: false, reason: '' };
    p.boxOpen = null;
    p.items.push(it);
    this.notify(p, itemDef(it).name + '을(를) 골랐습니다', 'loot');
    this.emit('update');
    return { ok: true, reason: '' };
  }

  tickBoxes(dt) {
    for (const p of this.players) {
      const b = p.boxOpen;
      if (!b) continue;
      b.left -= dt;
      if (b.left <= 0) this.pickBox(p, this.rng.int(b.choices.length));
    }
  }

  autoOpenBoxes(p) {
    if (p.boxOpen) this.pickBox(p, this.rng.int(p.boxOpen.choices.length));
    let i;
    while ((i = p.items.findIndex(x => itemDef(x) && itemDef(x).box)) >= 0) {
      if (!this.openBox(p, i).ok) break;
      this.pickBox(p, this.rng.int(p.boxOpen.choices.length));
    }
  }

  carouselReleased(p) {
    const car = this.carousel;
    return !!car && car.time >= car.release[p.id];
  }

  carouselCanPick(p, idx) {
    const car = this.carousel;
    const item = car && car.items[idx];
    if (!item || item.takenBy !== null) return false;
    if (car.picked[p.id] !== undefined) return false;
    if (!car.encounter && this.hasAug(p, 'favorable')) return false;
    const def = UNITS[item.unitId];
    return !this.lockedVariants(p).has(def.id);
  }

  carouselPick(p, idx) {
    if (!this.carouselCanPick(p, idx)) return false;
    const item = this.carousel.items[idx];
    item.takenBy = p.id;
    this.carousel.picked[p.id] = idx;
    this.notify(p, formOf(UNITS[item.unitId], 1, p).name + '을(를) 골랐습니다. 회전초밥이 끝나면 들어옵니다', 'loot');
    this.emit('carousel');
    return true;
  }

  carouselBotChoice(p) {
    let best = null;
    let bestScore = -Infinity;
    this.carousel.items.forEach((item, i) => {
      if (!this.carouselCanPick(p, i)) return;
      const owned = p.allUnits().filter(u => u.unitId === item.unitId).length;
      const s = owned * 10 + UNITS[item.unitId].cost + this.rng.next();
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    });
    return best;
  }

  carouselRandomChoice(p) {
    const options = [];
    this.carousel.items.forEach((_, i) => {
      if (this.carouselCanPick(p, i)) options.push(i);
    });
    return options.length ? this.rng.pick(options) : null;
  }

  carouselFinish() {
    const car = this.carousel;
    if (!car || car.done) return;
    for (const p of car.order) {
      if (!p.alive || car.picked[p.id] !== undefined) continue;
      const idx = this.carouselRandomChoice(p);
      if (idx !== null) this.carouselPick(p, idx);
    }
    for (const p of car.order) {
      const idx = car.picked[p.id];
      if (idx === undefined || !p.alive) continue;
      const it = car.items[idx];
      this.deliverUnit(p, it.unitId);
      if (it.item) p.items.push(it.item);
      if (!car.encounter && p.augState.efficientLeft > 0) {
        p.augState.efficientLeft -= 1;
        this.deliverUnit(p, it.unitId);
        this.notify(p, '효율적인 소비자: 복사본을 하나 더 얻었습니다', 'loot');
      }
    }
    if (!car.encounter) this.augCarouselEnd(car);
    if (car.encounter) this.applyEncounterStart();
    car.done = true;
    this.phase = 'result';
  }

  augCarouselEnd(car) {
    for (const p of car.order) {
      if (!p.alive) continue;
      const S = p.augState;
      const fav = this.hasAug(p, 'favorable');
      const crumb = S.crumbsLeft > 0;
      if (fav) {
        p.hp = Math.min(p.maxHp, p.hp + 6);
        p.gold += 8;
      }
      if (!fav && !crumb) continue;
      if (crumb) S.crumbsLeft -= 1;
      const left = car.items.map((it, i) => i).filter(i => car.items[i].takenBy === null && !this.lockedVariants(p).has(car.items[i].unitId));
      const pool = left.length ? left : car.items.map((it, i) => i).filter(i => !this.lockedVariants(p).has(car.items[i].unitId));
      if (!pool.length) continue;
      const idx = pool[this.rng.int(pool.length)];
      const it = car.items[idx];
      if (it.takenBy === null) it.takenBy = p.id;
      this.deliverUnit(p, it.unitId);
      if (it.item) p.items.push(it.item);
      this.notify(p, (fav ? '유리한 조건' : '부스러기') + ': ' + formOf(UNITS[it.unitId], 1, p).name + '와(과) 아이템을 얻었습니다', 'loot');
    }
  }

  frontCell(p) {
    const cols = [3, 2, 4, 1, 5, 0, 6];
    for (let r = 4; r < BOARD_ROWS; r++) {
      for (const c of cols) if (!p.unitAt({ zone: 'board', r, c })) return { zone: 'board', r, c };
    }
    return null;
  }

  deliverUnit(p, unitId) {
    const def = UNITS[unitId];
    const slot = p.freeBenchSlot();
    if (slot >= 0 || this.countMergeable(p, unitId, 1) >= 2 || !p.isHuman) {
      if (!this.addUnit(p, unitId, 1)) p.gold += def.cost;
      return;
    }
    const cell = this.frontCell(p);
    if (!cell) {
      p.gold += def.cost;
      return;
    }
    const inst = newInstance(unitId, 1);
    if (p.boardCount() >= p.boardLimit()) {
      inst.overflow = true;
      this.notify(p, '대기석이 가득 차서 ' + formOf(def, 1, p).name + '이(가) 필드 밖 자리에서 기다립니다. 전투 전까지 자리를 비우지 않으면 골드로 바뀝니다', 'info');
    }
    p.setAt(cell, inst);
    this.mergeAll(p);
  }

  resolveOverflow(p) {
    for (const inst of p.boardUnits()) {
      if (!inst.overflow) continue;
      const slot = p.freeBenchSlot();
      if (slot >= 0) {
        p.remove(inst);
        inst.overflow = false;
        p.setAt({ zone: 'bench', i: slot }, inst);
      } else if (p.boardCount() < p.boardLimit()) inst.overflow = false;
    }
  }

  convertOverflow(p) {
    for (const inst of p.boardUnits()) {
      if (!inst.overflow) continue;
      const def = UNITS[inst.unitId];
      p.remove(inst);
      this.returnItems(p, inst);
      const g = sellValue(def, inst.star);
      p.gold += g;
      this.notify(p, formOf(def, inst.star, p, inst).name + '이(가) 자리를 찾지 못해 ' + g + '골드로 바뀌었습니다', 'info');
    }
  }

  carouselRunBots() {
    for (const p of this.carousel.order) {
      if (this.carousel.picked[p.id] !== undefined) continue;
      const idx = p.isHuman ? this.carouselRandomChoice(p) : this.carouselBotChoice(p);
      if (idx !== null) this.carouselPick(p, idx);
    }
    this.carouselFinish();
  }

  debugAdd(p, key, amount) {
    if (key === 'gold') p.gold += amount;
    else if (key === 'xp') p.addXp(amount);
    else if (key === 'item') for (let i = 0; i < amount; i++) p.items.push(this.randomComponent());
    else if (key === 'itemdone') for (let i = 0; i < amount; i++) p.items.push(this.randomCompleted());
    else if (key === 'treasure') p.items.push(this.rng.pick(ITEMS.treasures[Math.max(0, Math.min(3, amount))]));
    else if (key === 'candy') p.items.push(['exp-s', 'exp-m', 'exp-l', 'rare-candy'][Math.max(0, Math.min(3, amount))]);
    else if (key === 'dice') p.items.push('loaded-dice');
    else if (key === 'radiant') p.items.push(this.rng.pick(ITEMS.radiants));
    else if (key === 'give') p.items.push(['golden-magnet', 'lucky-box', 'thiefs-gloves'][Math.max(0, Math.min(2, amount))]);
    else if (key === 'aug') this.makeAugOffer(p, Math.max(1, Math.min(3, amount || 1)));
    else if (key === 'pokebox') p.items.push('poke-box');
    else if (key === 'greatbox') p.items.push('great-box');
    else if (key === 'enc') {
      this.encounter = ENCOUNTER_IDS[(ENCOUNTER_IDS.indexOf(this.encounter) + 1) % ENCOUNTER_IDS.length];
      for (const q of this.players) q.encounter = this.encounter;
      this.notify(p, '조우자 변경: ' + this.encounter, 'info');
    }
    else if (key === 'mine') {
      p.mine += amount;
      if (this.phase === 'planning') this.refreshMineOffer(p);
    }
    else if (key === 'esper') {
      this.espVariant = ESPER_KEYS[(ESPER_KEYS.indexOf(this.espVariant) + 1) % ESPER_KEYS.length];
      for (const q of this.players) q.espVariant = this.espVariant;
      this.notify(p, '에스퍼 효과 변경: ' + this.espVariant, 'info');
    }
    else if (key in p.counters) p.counters[key] += amount;
    this.emit('update');
  }

  debugFreeRefresh(p) {
    this.refreshShop(p);
    this.emit('update');
  }
}
