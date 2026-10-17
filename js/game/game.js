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
    const free = looks.filter(l => !want.includes(l));
    let k = 0;
    this.players.forEach((p, i) => {
      p.strategist = want[i] || (free.length ? free[k++ % free.length] : looks[i % looks.length]);
      p.mapId = maps[i % maps.length];
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
    const amount = def.cost * food.star * 0.01;
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
    this.region = CONFIG.regions.includes(region) ? region : null;
    this.emit('update');
  }

  regionAllowed(def) {
    return !def.region || def.region === this.region;
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
    if (info.type === 'pve') return CONFIG.planningTime.pve;
    if (this.stage === 1) return CONFIG.planningTime.early;
    return CONFIG.planningTime.normal;
  }

  start() {
    this.stage = 1;
    this.round = 1;
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
    if (info.type === 'carousel') {
      this.setupCarousel();
      this.phase = 'carousel';
      this.emit('round', info);
      return;
    }
    for (const p of alive) {
      if (this.bugTier(p) >= 1) {
        p.bugRounds = (p.bugRounds || 0) + 1;
        p.bugShop = p.bugRounds % 3 === 0;
        if (p.bugShop) this.notify(p, '벌레 시너지: 이번 라운드 상점에는 벌레 포켓몬만 나옵니다', 'info');
      } else {
        p.bugRounds = 0;
        p.bugShop = false;
      }
      if (info.type === 'encounter') {
        this.giveRandomUnit(p, 1);
      } else if (!(this.stage === 1 && this.round === 2)) {
        const inc = this.grantIncome(p, this.stage === 1 ? CONFIG.earlyIncome : CONFIG.baseIncome);
        if (!(this.stage === 1 && this.round <= 2)) p.addXp(CONFIG.passiveXp);
        p.lastIncome = inc;
        if (p === this.human) this.lastIncome = inc;
      }
      if (!p.shopLocked) this.refreshShop(p);
      else p.shopLocked = false;
    }
    if (info.type === 'pvp') this.makePairings();
    this.phase = 'planning';
    for (const p of alive) if (!p.isHuman || p.afk) Bot.plan(this, p);
    this.emit('round', info);
  }

  grantIncome(p, base) {
    const interest = Math.min(CONFIG.interestMax, Math.floor(p.gold / CONFIG.interestPer));
    const streak = CONFIG.streakBonus(Math.abs(p.streak));
    p.gold += base + interest + streak;
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

  rollShopUnit(p, locked, wanted) {
    const odds = CONFIG.shopOdds[p.level];
    const byCost = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    const bugOnly = p.bugShop && UNIT_DATA.some(def => this.isBugDef(def) && this.isEligible(p, def) && !locked.has(def.id) && this.pool.remaining(def.id) > 0);
    for (const def of UNIT_DATA) {
      if (!this.isEligible(p, def) || locked.has(def.id) || this.pool.remaining(def.id) <= 0) continue;
      if (bugOnly && !this.isBugDef(def)) continue;
      byCost[def.cost].push(def);
    }
    let costs = [1, 2, 3, 4, 5].filter(c => byCost[c].length > 0 && odds[c - 1] > 0);
    let cost = this.rng.weighted(costs, c => odds[c - 1]);
    if (cost == null) {
      costs = [1, 2, 3, 4, 5].filter(c => byCost[c].length > 0);
      if (!costs.length) return null;
      cost = costs[0];
    }
    const boost = 1 + CONFIG.pityStep * (p.pity || 0);
    const def = this.rng.weighted(byCost[cost], d => this.pool.remaining(d.id) * (wanted && wanted.has(d.id) ? boost : 1));
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

  reroll(p) {
    if (p.gold < CONFIG.rerollCost) return false;
    p.gold -= CONFIG.rerollCost;
    const bt = this.bugTier(p);
    if (bt >= 3) p.addXp(bt >= 6 ? 2 : 1);
    if (bt >= 2 && this.rng.next() < (bt >= 6 ? 0.6 : 0.3)) {
      p.gold += CONFIG.rerollCost;
      this.notify(p, '벌레 시너지: 무료 새로고침!', 'loot');
    }
    this.refreshShop(p);
    return true;
  }

  buyXp(p) {
    if (p.level >= CONFIG.maxLevel || p.gold < CONFIG.xpCost) return false;
    p.gold -= CONFIG.xpCost;
    p.addXp(CONFIG.xpAmount);
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
    p.gold -= UNITS[id].cost;
    p.shop[slot] = null;
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
        const onBoard = placed.filter(u => u.loc.zone === 'board');
        const onBench = placed.filter(u => u.loc.zone === 'bench').sort((a, b) => a.loc.i - b.loc.i);
        const keep = onBoard[0] || onBench[0];
        if (!keep) continue;
        const others = g.filter(u => u !== keep).sort((a, b) => rank(a) - rank(b)).slice(0, 2);
        for (const o of others) {
          if (o === floating) floating = null;
          else p.remove(o);
        }
        const preForm = formOf(UNITS[keep.unitId], keep.star, p, keep).name;
        const pool = (keep.items || []).concat(...others.map(o => o.items || []));
        keep.items = [];
        for (const x of pool) {
          const d = itemDef(x);
          const ci = d && d.kind === 'component' ? keep.items.findIndex(y => itemDef(y) && itemDef(y).kind === 'component') : -1;
          const res = ci >= 0 ? combineItems(keep.items[ci], x) : null;
          if (res && !(itemDef(res).unique && keep.items.includes(res))) keep.items[ci] = res;
          else if (keep.items.length < 3 && !(d && d.unique && keep.items.includes(x))) keep.items.push(x);
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
        keep.payday = (keep.payday || 0) + others.reduce((s, o) => s + (o.payday || 0), 0);
        for (const o of others) {
          if (!o.feast) continue;
          keep.feast = keep.feast || { atk: 0, spa: 0, def: 0, spd: 0 };
          for (const k in o.feast) keep.feast[k] += o.feast[k];
          if (p.dittoLink === o.iid) p.dittoLink = keep.iid;
        }
        this.onStarUp(p, keep);
        merged = true;
        break;
      }
      if (!merged) break;
    }
  }

  onStarUp(p, inst, silent) {
    const def = UNITS[inst.unitId];
    if (def.branches && inst.star >= def.branchStar && !p.branch[def.id] && !inst.fz) {
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

  sell(p, inst) {
    if (!inst || !inst.loc) return false;
    if (this.phase === 'combat' && inst.loc.zone === 'board') return false;
    const def = UNITS[inst.unitId];
    p.remove(inst);
    this.returnItems(p, inst);
    p.gold += sellValue(def, inst.star);
    this.pool.give(inst.unitId, copiesForStar(inst.star));
    if (def.branches && !p.allUnits().some(u => u.unitId === def.id && u.star >= def.branchStar)) {
      delete p.branch[def.id];
      p.pendingBranch = p.pendingBranch.filter(x => x !== def.id);
    }
    return true;
  }

  moveUnit(p, inst, to) {
    if (!inst || !inst.loc) return { ok: false, reason: '' };
    if (to.zone === 'board' && (!Hex.inBounds(to.r, to.c) || !Hex.isHome(to.r))) return { ok: false, reason: '' };
    if (to.zone === 'bench' && (to.i < 0 || to.i >= CONFIG.benchSize)) return { ok: false, reason: '' };
    if (this.phase === 'combat' && (inst.loc.zone === 'board' || to.zone === 'board')) {
      return { ok: false, reason: '전투 중에는 필드를 바꿀 수 없습니다' };
    }
    const from = Object.assign({}, inst.loc);
    const other = p.unitAt(to);
    if (other === inst) return { ok: true, reason: '' };
    if (from.zone === 'bench' && to.zone === 'board' && !other && p.boardCount() >= p.level) {
      return { ok: false, reason: '필드에 놓을 수 있는 기물은 ' + p.level + '개입니다' };
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
    for (let guard = 0; guard < 40 && p.boardCount() < p.level; guard++) {
      const bench = p.benchUnits();
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

  boardSpecs(p, mirror, ghost) {
    const specs = [];
    const strong = strongestDragonIid(p);
    for (const inst of p.boardUnits()) {
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
          strongDragon: false,
          ditto: true,
          items: (inst.items || []).slice(),
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
        strongDragon: inst.iid === strong,
        items: (inst.items || []).slice(),
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
      const stats = computeStats(form, u.cost, u.star, u.mult * CONFIG.pveScale, { hpMult: u.hpMult, range: u.range });
      return { iid: null, unitId: null, creep: true, name: form.name, form, types: form.types, star: u.star, cost: u.cost, stats, r, c, drops: u.drops || 1 };
    });
  }

  currentCamp() {
    return CONFIG.pve[this.roundLabel()] || CONFIG.pve.default;
  }

  startCombat() {
    const info = this.roundInfo();
    this.phase = 'combat';
    this.matches = [];
    this.humanSim = null;
    if (info.type === 'encounter') {
      this.emit('combat');
      return null;
    }
    const alive = this.alivePlayers();
    for (const p of alive) {
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
    return out;
  }

  equipItem(p, index, inst) {
    const fail = reason => ({ ok: false, reason });
    const i = Math.floor(Number(index));
    const id = p.items[i];
    if (!id || !itemDef(id)) return fail('');
    if (!inst || !inst.loc || p.findInstance(inst.iid) !== inst) return fail('');
    if (inst.loc.zone === 'board' && this.phase !== 'planning') return fail('전투 중에는 필드의 기물에 아이템을 쓸 수 없습니다');
    const d = itemDef(id);
    inst.items = inst.items || [];
    if (id === 'magnet') {
      if (!inst.items.length) return fail('아이템이 없는 기물입니다');
      p.items.splice(i, 1);
      const out = inst.items.splice(0);
      for (const x of out) p.items.push(x);
      this.notify(p, '자석: 아이템 ' + out.length + '개를 뺐습니다', 'info');
      this.emit('update');
      return { ok: true, reason: '' };
    }
    if (d.kind === 'component') {
      const ci = inst.items.findIndex(x => itemDef(x) && itemDef(x).kind === 'component');
      if (ci >= 0) {
        const res = combineItems(inst.items[ci], id);
        if (!res) return fail('');
        if (itemDef(res).unique && inst.items.some((x, j) => j !== ci && x === res)) return fail(itemDef(res).name + '은(는) 한 기물에 하나만 장착할 수 있습니다');
        inst.items[ci] = res;
        p.items.splice(i, 1);
        this.notify(p, itemDef(res).name + ' 완성!', 'merge');
        this.onItemsChanged(p, inst);
        return { ok: true, reason: '' };
      }
    }
    if (inst.items.length >= 3) return fail('아이템은 3개까지 장착할 수 있습니다');
    if (d.unique && inst.items.includes(id)) return fail(d.name + '은(는) 한 기물에 하나만 장착할 수 있습니다');
    inst.items.push(id);
    p.items.splice(i, 1);
    this.onItemsChanged(p, inst);
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
      p.items.push(orb.item);
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
    if (!team) return;
    const tier = id => team.tiers[id] || 0;
    if (tier('치유의 마음')) p.counters.heal += st.heal * (p.boardUnits().some(u => u.unitId === '핑복' && u.star >= 3) ? 2 : 1);
    if (tier('다운로드')) p.counters.download += sim.casts;
    if (tier('유전자') && pvp) {
      p.counters.gene += sim.units.length;
      this.notify(p, '유전자 +' + sim.units.length + ' (총 ' + p.counters.gene + ')', 'loot');
    }
    if (tier('격투')) p.training += Math.round(st.training);
    if (tier('드래곤') && won) {
      const n = sim.survivors(side).filter(u => u.types.includes('드래곤')).length;
      if (n) {
        p.dragonScales += n;
        this.notify(p, '용의 비늘 +' + n + ' (총 ' + p.dragonScales + '개)', 'loot');
      }
    }
    const et = tier('에스퍼');
    if (et) {
      if (won) {
        if (p.psychic > 0) this.notify(p, '사이킥 에너지 ' + Math.round(p.psychic) + '로 보상을 얻었습니다 (보상은 준비 중)', 'loot');
        p.psychic = 0;
        p.psychicLosses = 0;
      } else {
        p.psychicLosses += 1;
        p.psychic += p.psychicLosses * traitVal('에스퍼', 'energyMult', et);
        this.notify(p, '사이킥 에너지 ' + Math.round(p.psychic) + ' 충전', 'info');
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
    if (!g) return;
    p.gold += g;
    this.notify(p, '고양이돈받기: ' + g + '골드', 'loot');
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
        this.payGold(a, sim, 'A');
        Unlocks.onCombatEnd(this, a, sim, 'A', true);
        this.markStoneFree(a);
        this.afterSynergy(a, m.teamA, sim, 'A', sim.winner === 'A', true);
        a.lastOpponent = b.id;
        if (!m.ghost) {
          this.applyPvp(b, resB, sim.survivors('A'));
          this.payGold(b, sim, 'B');
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
    const alive = this.alivePlayers();
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
    order.forEach((p, i) => { release[p.id] = cfg.firstRelease + Math.floor(i / 2) * cfg.releaseGap; });
    const lastRelease = cfg.firstRelease + Math.floor((order.length - 1) / 2) * cfg.releaseGap;
    this.carousel = { items, order, release, picked: {}, time: 0, duration: lastRelease + cfg.lastWindow, done: false };
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
    const def = UNITS[item.unitId];
    return !this.lockedVariants(p).has(def.id);
  }

  carouselPick(p, idx) {
    if (!this.carouselCanPick(p, idx)) return false;
    const item = this.carousel.items[idx];
    item.takenBy = p.id;
    this.carousel.picked[p.id] = idx;
    const inst = this.addUnit(p, item.unitId, 1);
    if (!inst) p.gold += UNITS[item.unitId].cost;
    if (item.item) p.items.push(item.item);
    this.notify(p, formOf(UNITS[item.unitId], 1, p).name + '을(를) 골랐습니다', 'loot');
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
    car.done = true;
    this.phase = 'result';
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
    else if (key in p.counters) p.counters[key] += amount;
    this.emit('update');
  }

  debugFreeRefresh(p) {
    this.refreshShop(p);
    this.emit('update');
  }
}
