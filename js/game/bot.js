const BOT_DEF_ITEMS = new Set(['luminous-moss', 'rusted-shield-1', 'rusted-shield-2', 'rusted-shield-3', 'griseous-orb-1', 'griseous-orb-2', 'griseous-orb-3', 'life-orb-1', 'life-orb-2', 'life-orb-3', 'protective-pads', 'x-sp-def', 'leftovers', 'rocky-helmet', 'assault-vest', 'kings-rock', 'big-root', 'super-potion', 'weakness-policy', 'flame-orb', 'full-incense', 'lax-incense', 'soothe-bell', 'booster-energy', 'shell-armor', 'mental-herb', 'eviolite', 'black-sludge', 'everstone', 'covert-cloak']);
const BOT_PHYS_ITEMS = new Set(['rusted-sword-1', 'rusted-sword-2', 'rusted-sword-3', 'red-orb-1', 'red-orb-2', 'red-orb-3', 'muscle-band', 'choice-band', 'punching-glove', 'black-belt', 'spell-tag', 'choice-scarf', 'silver-wing']);
const BOT_SPEC_ITEMS = new Set(['blue-orb-1', 'blue-orb-2', 'blue-orb-3', 'wise-glasses', 'choice-specs', 'black-glasses', 'soul-dew', 'twisted-spoon', 'max-ether']);

const Bot = {
  targetLevel(g) {
    const s = g.stage;
    const r = g.round;
    if (s === 1) return 3;
    if (s === 2) return r >= 5 ? 5 : 4;
    if (s === 3) return r >= 2 ? 6 : 5;
    if (s === 4) return r >= 2 ? 7 : 6;
    if (s === 5) return 8;
    if (s === 6) return 9;
    return 10;
  },

  reserve(g, p) {
    if (p.hp <= 35) return 0;
    if (g.stage <= 1) return 0;
    if (g.stage === 2) return 10;
    if (g.stage === 3) return 30;
    return 50;
  },

  value(p, inst) {
    return UNITS[inst.unitId].cost * copiesForStar(inst.star);
  },

  score(g, p, def) {
    const owned = p.allUnits().filter(u => u.unitId === def.id);
    if (owned.length) {
      if (owned.some(u => u.star === 3)) return 1;
      return 6 + owned.length * 2;
    }
    const have = new Set();
    for (const u of p.boardUnits()) for (const t of allTraitsOf(UNITS[u.unitId], u.star, p, u)) have.add(t);
    let overlap = 0;
    for (const t of allTraitsOf(def, 1, p)) if (have.has(t)) overlap++;
    return def.cost + overlap * 1.5;
  },

  buyPass(g, p, reserve) {
    for (let i = 0; i < CONFIG.shopSize; i++) {
      const id = p.shop[i];
      if (!id) continue;
      const def = UNITS[id];
      const total = p.allUnits().length;
      const owned = p.allUnits().some(u => u.unitId === id);
      const threshold = total < p.level + 2 ? 0 : 5;
      if (this.score(g, p, def) < threshold) continue;
      const floor = owned ? Math.max(0, reserve - 10) : reserve;
      if (p.gold - def.cost < floor) continue;
      if (!g.canBuy(p, i).ok) continue;
      g.buy(p, i);
    }
  },

  trimBench(g, p) {
    let guard = 0;
    while (p.benchUnits().length > 6 && guard < 10) {
      guard++;
      const all = p.allUnits();
      const bench = p.benchUnits().slice().sort((a, b) => {
        const pa = all.filter(u => u.unitId === a.unitId && u.star === a.star).length >= 2 ? 1 : 0;
        const pb = all.filter(u => u.unitId === b.unitId && u.star === b.star).length >= 2 ? 1 : 0;
        return (pa - pb) || (this.value(p, a) - this.value(p, b));
      });
      g.sell(p, bench[0]);
    }
  },

  arrange(g, p) {
    const all = p.allUnits();
    for (const u of all) p.remove(u);
    const scored = all.map(u => ({ u, v: this.value(p, u) + g.rng.next() * 0.1 })).sort((a, b) => b.v - a.v);
    const n = Math.min(p.boardLimit(), scored.length);
    const chosen = scored.slice(0, n).map(x => x.u);
    const rest = scored.slice(n).map(x => x.u);
    const used = new Set();
    const place = (inst, order) => {
      const cell = order.find(([r, c]) => !used.has(r * 10 + c));
      used.add(cell[0] * 10 + cell[1]);
      p.placeBoard(inst, cell[0], cell[1]);
    };
    for (const inst of chosen) {
      const ranged = instanceStats(inst, p).range >= 3;
      place(inst, ranged ? CELL_ORDER_BACK : CELL_ORDER_FRONT);
    }
    rest.forEach((inst, i) => p.placeBench(inst, i));
  },

  itemFor(id) {
    if (BOT_DEF_ITEMS.has(id)) return 'def';
    if (BOT_PHYS_ITEMS.has(id)) return 'phys';
    if (BOT_SPEC_ITEMS.has(id)) return 'spec';
    return 'any';
  },

  recipients(g, p, id) {
    const board = p.boardUnits();
    const info = board.map(u => {
      const st = instanceStats(u, p);
      const tank = /탱커/.test(st.role || '');
      return { u, tank, special: !!st.special, v: this.value(p, u) + UNITS[u.unitId].cost * 0.01 + u.iid * 1e-6 };
    });
    const kind = this.itemFor(id);
    const score = x => {
      let s = x.v;
      if (kind === 'def') s += x.tank ? 1000 : 0;
      else {
        s += x.tank ? 0 : 1000;
        if (kind === 'phys' && !x.special) s += 500;
        if (kind === 'spec' && x.special) s += 500;
      }
      return s;
    };
    return info.sort((a, b) => score(b) - score(a)).map(x => x.u);
  },

  itemOk(g, p, inst, id) {
    const d = itemDef(id);
    if (!d) return false;
    if (d.box) return false;
    if (d.candy) return inst.star < 3 && UNITS[inst.unitId].cost <= d.maxCost;
    if (d.reforge) return false;
    if (d.dup) return inst.star < 3 && UNITS[inst.unitId].cost <= d.maxCost && g.pool.remaining(inst.unitId) > 0 && (p.freeBenchSlot() >= 0 || g.countMergeable(p, inst.unitId, 1) >= 2);
    const comp = (inst.items || []).find(x => itemDef(x) && itemDef(x).kind === 'component');
    const res = d.kind === 'component' && comp ? combineItems(comp, id) : id;
    if (res === 'everstone' && canEvolveFurther(inst, p)) return false;
    if (res === 'eviolite' && !canEvolveFurther(inst, p)) return false;
    return true;
  },

  useItems(g, p) {
    g.autoOpenBoxes(p);
    if (g.phase !== 'planning') return;
    for (const u of p.benchUnits()) {
      if (!u.items || !u.items.length) continue;
      const mi = p.items.indexOf('magnet');
      if (mi < 0) break;
      g.equipItem(p, mi, u);
    }
    if (!p.boardUnits().length) return;
    const skip = new Set();
    for (let guard = 0; guard < 40; guard++) {
      const i = p.items.findIndex((id, k) => id !== 'magnet' && !skip.has(k + ':' + id));
      if (i < 0) break;
      const id = p.items[i];
      let done = false;
      for (const inst of this.recipients(g, p, id)) {
        if (!this.itemOk(g, p, inst, id)) continue;
        if (g.equipItem(p, i, inst).ok) {
          done = true;
          break;
        }
      }
      if (!done) skip.add(i + ':' + id);
    }
  },

  plan(g, p) {
    if (g.canTakeMine(p)) g.takeMine(p);
    const reserve = this.reserve(g, p);
    const target = this.targetLevel(g);
    while (p.level < p.maxLevel() && p.level < target && p.gold - CONFIG.xpCost >= reserve) {
      if (!g.buyXp(p)) break;
    }
    const maxRolls = p.hp <= 35 ? 10 : g.stage >= 4 ? 3 : 0;
    let rolls = 0;
    for (let guard = 0; guard < 30; guard++) {
      this.buyPass(g, p, reserve);
      if (rolls < maxRolls && p.gold >= CONFIG.rerollCost && p.gold - CONFIG.rerollCost >= reserve) {
        g.reroll(p);
        rolls++;
      } else {
        break;
      }
    }
    if (g.stage >= 4) {
      while (p.level < p.maxLevel() && p.gold - CONFIG.xpCost >= reserve + 10) {
        if (!g.buyXp(p)) break;
      }
    }
    this.trimBench(g, p);
    this.arrange(g, p);
    this.useItems(g, p);
  }
};
