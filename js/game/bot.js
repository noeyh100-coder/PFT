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
    for (const u of p.boardUnits()) for (const t of allTraitsOf(UNITS[u.unitId], u.star, p)) have.add(t);
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
    const n = Math.min(p.level, scored.length);
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

  plan(g, p) {
    const reserve = this.reserve(g, p);
    const target = this.targetLevel(g);
    while (p.level < CONFIG.maxLevel && p.level < target && p.gold - CONFIG.xpCost >= reserve) {
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
      while (p.level < CONFIG.maxLevel && p.gold - CONFIG.xpCost >= reserve + 10) {
        if (!g.buyXp(p)) break;
      }
    }
    this.trimBench(g, p);
    this.arrange(g, p);
  }
};
