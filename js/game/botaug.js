const BOT_AUG_BASE = {
  latebloom: 1, latespec: 4, efficient: 4, thrill1: 4, swordsdance: 5, calmmind: 5, cooperate: 5, onetwothree: 5, onetwofive: 6, pandora1: 4,
  bigfriend: 3, exiles1: 3, shaymin1: 5, patientblessing: 3, augpower: 5, laststand: 4, craft: 3, lunchmoney: 4, spoils1: 4, wishful: 4,
  smallbag: 6, makeshift1: 4, pallet: 2, silverspoon: 5, silverfate1: 5, silverfate2: 5, gimmiuse: 5, shellbreak1: 4, noconnect: 2, itembag: 6,
  winning: 3, survivor: 4, rerollday: 5, crumbs: 3, titan: 5, predict: 4, boxing: 4, smallcandy: 5, useful: 3, buddy1: 3, cataclysm: 3,
  lateclass: 5, thrill2: 5, chaos: 3, shellup: 5, boomlearn1: 6, boomlearn2: 6, pandora2: 6, pandorabench: 3, custom: 7, bigbag: 7,
  campaign: 5, exiles2: 4, ascend: 6, shaymin2: 6, opticshop: 6, earlyedu: 6, haste: 5, mindlink: 5, spoils2: 5, recycle1: 5, recycle2: 5,
  doublekill: 4, littlebuddies: 3, makeshift2: 5, dualtech: 6, favorable: 3, shellbreak2: 5, indecisive1: 5, polymath: 6, lastpoke: 5, savings: 5,
  bronze1: 3, cavity1: 6, cavity2: 6, cavity3: 5, energywave: 5, soulbeat: 6, clutter: 4, rocketway: 4, wootears: 5, rosaroy: 4, dealer: 5,
  epicroll: 5, birthday: 6, newera1: 6, newera2: 6, trio: 5, kindling: 3, lotus1: 5, munchkin: 6, doublebattle: 3, clearmind: 3, craftmate: 4,
  gimmihelp: 6, gildedsteel: 6, loan1: 5, loan2: 5, buddy2: 4, onecomp: 3, sololevel: 2, persist: 5, patience1: 4, goldfate1: 6, goldfate2: 6,
  exchange: 5, heartup: 4, crownweight: 4, calcloss: 3, bandmaker: 6, bumpy: 4, gold21: 6, fourplus: 5, twovalue: 3,
  timerball: 6, ringcall: 8, hedge: 7, prismticket: 6, prismfate1: 7, prismfate2: 7, pandora3: 7, silph1: 6, silph2: 6, deadlyband: 6, optimize: 8,
  shaymin3: 7, radiantrelic: 8, formation: 6, spoils3: 6, longinvest: 6, shrink: 7, oakhelp: 8, indecisive2: 6, soulawaken: 7, bronze2: 4,
  comeback: 6, achieve: 7, cram: 7, rockethelp: 7, fossil: 6, lotus2: 6, studyagain: 7, moneystorm: 7, deadlyspecs: 6, yoshhelp: 7, gardhelp: 6,
  harihelp: 6, realsnack: 6, patience2: 6, sweetcandy: 7, tradehub: 6, bigstrong: 7
};

const BOT_AUG_KIND = {
  econ: ['latespec', 'efficient', 'lunchmoney', 'survivor', 'predict', 'useful', 'savings', 'dealer', 'gimmihelp', 'loan1', 'loan2', 'gold21', 'hedge', 'silph1', 'silph2', 'longinvest', 'moneystorm', 'realsnack', 'timerball', 'calcloss', 'rocketway', 'doublekill', 'patientblessing', 'exchange', 'prismticket', 'tradehub', 'rerollday', 'epicroll', 'craft', 'winning', 'twovalue'],
  xp: ['silverspoon', 'smallcandy', 'lateclass', 'boomlearn1', 'boomlearn2', 'cavity1', 'cavity2', 'cavity3', 'newera1', 'newera2', 'persist', 'clearmind', 'clutter', 'achieve', 'cram', 'studyagain', 'sweetcandy', 'rockethelp'],
  combat: ['thrill1', 'thrill2', 'swordsdance', 'calmmind', 'shaymin1', 'shaymin2', 'shaymin3', 'wishful', 'ascend', 'haste', 'mindlink', 'energywave', 'soulbeat', 'lotus1', 'lotus2', 'shrink', 'soulawaken', 'bigstrong', 'earlyedu', 'comeback', 'polymath'],
  items: ['smallbag', 'itembag', 'bigbag', 'pandora1', 'pandora2', 'pandora3', 'custom', 'opticshop', 'bandmaker', 'radiantrelic', 'optimize', 'recycle1', 'recycle2', 'gimmiuse', 'cooperate', 'onetwofive', 'yoshhelp', 'gardhelp', 'harihelp', 'deadlyband', 'deadlyspecs', 'shellup', 'heartup', 'crownweight', 'bumpy', 'kindling', 'wootears', 'spoils1', 'spoils2', 'spoils3'],
  units: ['onetwothree', 'dualtech', 'trio', 'ringcall', 'oakhelp', 'gildedsteel', 'birthday', 'campaign', 'munchkin', 'fourplus', 'craftmate', 'patience1', 'patience2', 'lastpoke', 'fossil', 'noconnect', 'rosaroy'],
  position: ['bigfriend', 'exiles1', 'exiles2', 'laststand', 'shellbreak1', 'shellbreak2', 'boxing', 'buddy1', 'buddy2', 'formation', 'crownweight'],
  risky: ['latebloom', 'pallet', 'cataclysm', 'sololevel', 'onecomp', 'favorable', 'pandorabench', 'doublebattle', 'littlebuddies', 'chaos', 'bronze1', 'bronze2', 'makeshift1', 'makeshift2', 'titan']
};

const BOT_AUG_OF = {};
for (const k in BOT_AUG_KIND) for (const id of BOT_AUG_KIND[k]) if (!BOT_AUG_OF[id]) BOT_AUG_OF[id] = k;

const BOT_AUG_APP = {
  botAugContext(p) {
    const board = p.boardUnits();
    let special = 0;
    let tanks = 0;
    let bare = 0;
    let fire = 0;
    const cost = [0, 0, 0, 0, 0, 0, 0];
    const ids = {};
    for (const u of board) {
      const def = UNITS[u.unitId];
      const form = formOf(def, u.star, p, u);
      const role = formRole(form);
      if (role.startsWith('특수')) special += 1;
      if (role.indexOf('탱커') >= 0) tanks += 1;
      if (!u.items || !u.items.length) bare += 1;
      if (form.types.includes('불꽃')) fire += 1;
      cost[Math.min(6, def.cost)] += 1;
      ids[u.unitId] = (ids[u.unitId] || 0) + 1;
    }
    const syn = computeSynergies(p);
    const traitN = id => {
      const s = syn.find(x => x.id === id);
      return s ? s.count : 0;
    };
    const bronze = syn.filter(s => s.active && s.tier === 1 && s.kind !== 'unique').length;
    const items = (p.items || []).filter(id => {
      const d = itemDef(id);
      return d && (d.kind === 'component' || d.kind === 'completed');
    }).length + board.reduce((a, u) => a + (u.items ? u.items.length : 0), 0);
    const value = p.allUnits().reduce((a, u) => a + UNITS[u.unitId].cost * copiesForStar(u.star), 0);
    const pairs = Object.values(ids).filter(n => n === 2).length;
    return { round: this.augRoundIndex(), stage: this.stage, hp: p.hp, gold: p.gold, level: p.level, n: board.length, special, tanks, bare, fire, cost, traitN, bronze, items, value, pairs, alive: this.alivePlayers().length };
  },

  botAugScore(p, id, c) {
    let s = BOT_AUG_BASE[id] != null ? BOT_AUG_BASE[id] : 4;
    const kind = BOT_AUG_OF[id];
    const late = c.round >= 2;
    const early = c.round <= 0;
    const danger = c.hp <= 40;
    if (kind === 'econ') s += (early ? 1.5 : late ? -2 : 0) + (danger ? -2.5 : c.hp >= 80 ? 1 : 0);
    if (kind === 'xp') s += (early ? 1 : late ? -0.5 : 0.5) + (c.level >= 8 ? -2 : 0) + (danger ? -1 : 0);
    if (kind === 'combat') s += (late ? 1.5 : early ? -1 : 0.5) + (danger ? 1.5 : 0);
    if (kind === 'items') s += c.items < 4 ? 1 : c.items > 8 ? -1 : 0;
    if (kind === 'units') s += (c.n < c.level ? 1 : 0) + (danger ? -0.5 : 0);
    if (kind === 'position') s += c.n >= 6 ? 0 : -1;
    const phys = c.n - c.special;
    if (id === 'swordsdance' || id === 'harihelp' || id === 'bandmaker' || id === 'deadlyband') s += phys > c.special ? 1.5 : -2;
    if (id === 'calmmind' || id === 'gardhelp' || id === 'opticshop' || id === 'deadlyspecs' || id === 'heartup' || id === 'polymath') s += c.special > phys ? 1.5 : -2;
    if (id === 'chaos') s += c.traitN('주문술사') >= 2 ? 4 : -2;
    if (id === 'kindling') s += c.fire >= 2 ? 2.5 : -1;
    if (id === 'bronze1' || id === 'bronze2') s += Math.min(4, c.bronze * 0.8) - 1;
    if (id === 'makeshift1' || id === 'makeshift2') s += c.bare >= 4 ? 2.5 : 0;
    if (id === 'littlebuddies') s += c.cost[4] + c.cost[5] >= 2 && c.cost[1] + c.cost[2] >= 2 ? 3 : -1;
    if (id === 'lateclass' || id === 'gildedsteel') s += c.cost[5] >= 1 ? 1.5 : 0;
    if (id === 'noconnect') s += c.cost[1] >= 3 ? 3 : -1;
    if (id === 'doublebattle') s += c.pairs >= 2 ? 3.5 : 0;
    if (id === 'trio') s += c.cost[3] >= 2 ? 1.5 : 0;
    if (id === 'bigfriend' || id === 'boxing' || id === 'laststand') s += c.tanks >= 2 ? 1.5 : -0.5;
    if (id === 'formation') s += c.tanks >= 2 ? 1 : -1;
    if (id === 'latebloom') s += c.value <= 8 ? 3 : -2;
    if (id === 'pallet') s += c.value <= 14 ? 4 : -3;
    if (id === 'cataclysm') s += c.cost[1] + c.cost[2] >= 4 ? 2 : -1;
    if (id === 'sololevel' || id === 'onecomp' || id === 'favorable' || id === 'pandorabench') s += danger ? -3 : 0;
    if (id === 'titan' || id === 'comeback' || id === 'mindlink' || id === 'realsnack') s += danger ? 2.5 : c.hp < 70 ? 1 : 0;
    if (id === 'survivor' || id === 'doublekill') s += c.alive >= 7 ? 0.5 : -1;
    if (id === 'latespec' || id === 'achieve' || id === 'epicroll') s += c.level >= 7 ? 1 : 0;
    if (id === 'loan1' || id === 'loan2' || id === 'augpower') s += c.round >= 2 ? -3 : 0;
    if (id === 'predict') s += c.hp >= 70 ? 1 : -1;
    return s;
  },

  botPickAug(p) {
    const o = p.augOffer;
    if (!o || !o.choices.length) return;
    const c = this.botAugContext(p);
    let best = 0;
    let bestS = -Infinity;
    o.choices.forEach((ch, i) => {
      const sc = this.botAugScore(p, ch.id, c) + this.rng.next() * 1.5;
      if (sc > bestS) {
        bestS = sc;
        best = i;
      }
    });
    this.pickAug(p, best);
  }
};

Object.assign(Game.prototype, BOT_AUG_APP);
