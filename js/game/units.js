const UNITS = {};
const FAMILIES = {};
const FORM_INDEX = {};

const REGION_FAMILIES = new Set();

(function buildRegistry() {
  if (typeof REGIONAL_DATA !== 'undefined') {
    for (const u of REGIONAL_DATA) if (!UNIT_DATA.includes(u)) UNIT_DATA.push(u);
  }
  for (const u of UNIT_DATA) if (u.region) REGION_FAMILIES.add(u.family);
  if (typeof PP_UNIT !== 'undefined') {
    for (const u of UNIT_DATA) {
      const base = u.region ? u.id.split(' ').slice(1).join(' ') : u.id;
      const pp = PP_UNIT[u.id] != null ? PP_UNIT[u.id] : PP_UNIT[base] != null ? PP_UNIT[base] : PP_UNIT[u.family];
      const all = (u.stageForms || u.forms).concat(u.branches ? u.branches.map(b => b.form) : []);
      for (const f of all) {
        const own = PP_FORM[f.name + '·' + f.skill] != null ? PP_FORM[f.name + '·' + f.skill] : PP_FORM[f.name];
        if (own != null) f.pp = own;
        else if (pp != null) f.pp = pp;
      }
    }
  }
  for (const u of UNIT_DATA) {
    UNITS[u.id] = u;
    if (!FAMILIES[u.family]) FAMILIES[u.family] = [];
    FAMILIES[u.family].push(u);
    const forms = u.forms.slice();
    if (u.stageForms) forms.push(...u.stageForms);
    if (u.branches) for (const b of u.branches) forms.push(b.form);
    for (const f of forms) {
      if (!FORM_INDEX[f.name] && u.variant === '원종') FORM_INDEX[f.name] = f;
    }
  }
  for (const u of UNIT_DATA) {
    for (const f of u.forms) if (!FORM_INDEX[f.name]) FORM_INDEX[f.name] = f;
  }
  for (const name in CREEP_FORMS) if (!FORM_INDEX[name]) FORM_INDEX[name] = CREEP_FORMS[name];
})();

const UNLOCK_STAT_BONUS = 1.25;
const STAR_HP = [1, 1.8, 3.24];
const STAR_ATK = [1, 1.5, 2.25];
const COST_ATK = [50, 55, 65, 75, 90];
const ROLE_KEY = { 탱커: 'tank', 전사: 'warrior', 마법사: 'mage' };
const COST_STATS = {
  1: {
    physical: { hp: { warrior: 650, mage: 500, tank: 650 }, atk: { warrior: 55, mage: 55, tank: 50 }, def: { warrior: 40, mage: 15, tank: 40 }, spe: { warrior: 0.7, mage: 0.7, tank: 0.6 } },
    special: { hp: { warrior: 650, mage: 500, tank: 650 }, atk: { warrior: 30, mage: 30, tank: 45 }, def: { warrior: 40, mage: 15, tank: 40 }, spe: { warrior: 0.7, mage: 0.7, tank: 0.6 } }
  },
  2: {
    physical: { hp: { warrior: 700, mage: 600, tank: 800 }, atk: { warrior: 55, mage: 55, tank: 55 }, def: { warrior: 45, mage: 20, tank: 50 }, spe: { warrior: 0.75, mage: 0.7, tank: 0.6 } },
    special: { hp: { warrior: 700, mage: 600, tank: 650 }, atk: { warrior: 35, mage: 35, tank: 45 }, def: { warrior: 45, mage: 20, tank: 40 }, spe: { warrior: 0.7, mage: 0.7, tank: 0.6 } }
  },
  3: {
    physical: { hp: { warrior: 800, mage: 700, tank: 950 }, atk: { warrior: 60, mage: 60, tank: 60 }, def: { warrior: 50, mage: 25, tank: 60 }, spe: { warrior: 0.75, mage: 0.75, tank: 0.6 } },
    special: { hp: { warrior: 800, mage: 700, tank: 800 }, atk: { warrior: 40, mage: 40, tank: 50 }, def: { warrior: 50, mage: 25, tank: 45 }, spe: { warrior: 0.75, mage: 0.7, tank: 0.6 } }
  },
  4: {
    physical: { hp: { warrior: 950, mage: 850, tank: 1150 }, atk: { warrior: 70, mage: 70, tank: 70 }, def: { warrior: 55, mage: 30, tank: 70 }, spe: { warrior: 0.8, mage: 0.75, tank: 0.65 } },
    special: { hp: { warrior: 950, mage: 850, tank: 950 }, atk: { warrior: 45, mage: 45, tank: 55 }, def: { warrior: 55, mage: 30, tank: 50 }, spe: { warrior: 0.8, mage: 0.75, tank: 0.6 } }
  },
  5: {
    physical: { hp: { warrior: 1100, mage: 1000, tank: 1400 }, atk: { warrior: 80, mage: 80, tank: 80 }, def: { warrior: 60, mage: 35, tank: 80 }, spe: { warrior: 0.8, mage: 0.8, tank: 0.65 } },
    special: { hp: { warrior: 1100, mage: 1000, tank: 1150 }, atk: { warrior: 55, mage: 55, tank: 65 }, def: { warrior: 60, mage: 35, tank: 60 }, spe: { warrior: 0.8, mage: 0.75, tank: 0.6 } }
  }
};
const BASE_SPA = 100;
const STAR_SKILL = [1, 2, 3.5];
const CRIT_CHANCE = 0.25;
const OMNIVAMP = 0;

const STAT_MODIFIER_PER_POINT = { atk: 0.15, spa: 15, def: 20, spd: 20, spe: 0.15, acc: 0.1, eva: 0.1, crit: 0.1 };

function statModifierDelta(key, amount) {
  return (STAT_MODIFIER_PER_POINT[key] || 0) * amount;
}

function addStatModifier(unit, key, amount) {
  if (unit && unit.statMods && Object.prototype.hasOwnProperty.call(unit.statMods, key)) {
    const perPoint = STAT_MODIFIER_PER_POINT[key];
    if (!perPoint) return;
    const points = unit.statMods[key] / perPoint + amount;
    unit.statMods[key] = Math.max(-6, Math.min(6, points)) * perPoint;
  }
}

function copiesForStar(star) {
  return star === 1 ? 1 : star === 2 ? 3 : 9;
}

function sellValue(def, star) {
  let v = def.cost * copiesForStar(star);
  if (def.cost > 1 && star > 1) v -= 1;
  return v;
}

function branchOf(def, star, owner) {
  if (!def.branches || star < def.branchStar || !owner) return null;
  const key = owner.branch[def.id];
  if (!key) return null;
  return def.branches.find(b => b.key === key) || null;
}

function frozenForm(def, name) {
  if (def.stageForms) {
    const f = def.stageForms.find(x => x.name === name);
    if (f) return f;
  }
  const f = def.forms.find(x => x.name === name);
  if (f) return f;
  const b = def.branches ? def.branches.find(x => x.form.name === name) : null;
  return b ? b.form : null;
}

function formOf(def, star, owner, inst) {
  if (inst && inst.fz) {
    const f = frozenForm(def, inst.fz);
    if (f) return f;
  }
  if (def.stageForms) {
    const stage = owner ? owner.downloadStage : 0;
    return def.stageForms[Math.min(stage, def.stageForms.length - 1)];
  }
  const b = branchOf(def, star, owner);
  if (b) return b.form;
  return def.forms[Math.min(star, def.forms.length) - 1];
}

function classTraitsOf(def, star, owner, inst) {
  if (inst && inst.fz) {
    const fb = def.branches ? def.branches.find(x => x.form.name === inst.fz) : null;
    return fb && fb.traits ? fb.traits : def.traits;
  }
  const b = branchOf(def, star, owner);
  if (b && b.traits) return b.traits;
  return def.traits;
}

function allTraitsOf(def, star, owner, inst) {
  const form = formOf(def, star, owner, inst);
  const set = [];
  for (const t of form.types) if (!set.includes(t)) set.push(t);
  for (const t of classTraitsOf(def, star, owner, inst)) if (!set.includes(t)) set.push(t);
  if (!def.uniqueStar || star >= def.uniqueStar) for (const t of def.uniques) if (!set.includes(t)) set.push(t);
  return set;
}

function formRole(form, range) {
  if (form.role) return form.role;
  const s = form.stats;
  const special = form.special != null ? form.special : s.spa > s.atk;
  const kind = special ? '특수' : '물리';
  const bulk = (s.hp + s.def + s.spd) / 3;
  if (bulk >= Math.max(s.atk, s.spa) * 1.1) return kind + ' 탱커';
  if ((range || form.range || 1) >= 3) return kind + ' 마법사';
  return kind + ' 전사';
}

const PP_ROLE = { 탱커: 90, 전사: 70, 마법사: 60 };

function ppFor(cost, role, form) {
  const kind = (role || '').split(' ')[1] || '전사';
  const max = form && Number.isFinite(form.pp) ? form.pp : PP_ROLE[kind] || PP_ROLE.전사;
  const start = kind === '탱커' && cost >= 3 ? Math.round(max * 0.15) : 0;
  return { max, start };
}

function computeStats(form, cost, star, bonus, opts) {
  const o = opts || {};
  const c = Math.max(1, Math.min(5, cost));
  const role = formRole(form, o.range);
  const kind = role.split(' ')[1] || '전사';
  const roleKey = ROLE_KEY[kind] || 'warrior';
  const special = role.startsWith('특수');
  const classStats = COST_STATS[c][special ? 'special' : 'physical'];
  const k = bonus || 1;
  const boost = o.boost || {};
  const range = o.range || form.range || (special ? CONFIG.combat.rangedRange : 1);
  const pp = ppFor(c, role, form);
  let atkV, spaV, defV, pwP, pwS, pwD, pwStar;
  if (o.legacy) {
    const atk = COST_ATK[c - 1] * STAR_ATK[star - 1] * k;
    const main = Math.round(atk * (boost.atk || 1));
    const off = Math.round(atk * 0.5 * (boost.atk || 1));
    atkV = Math.round(atk * (boost.atk || 1));
    spaV = special ? main : off;
    defV = classStats.def[roleKey];
    pwD = 1;
    pwP = 1;
    pwS = 1;
    pwStar = 1;
  } else {
    const atk = COST_ATK[c - 1] * k * (boost.atk || 1);
    atkV = Math.round((classStats.atk[roleKey] + (boost.basic || 0)) * STAR_ATK[star - 1] * k * (boost.atk || 1));
    spaV = BASE_SPA;
    defV = classStats.def[roleKey];
    pwD = 1;
    pwP = 1;
    pwS = (special ? atk : atk * 0.5) / BASE_SPA;
    pwStar = STAR_SKILL[Math.max(1, Math.min(3, star)) - 1];
  }
  return {
    hp: Math.round(classStats.hp[roleKey] * STAR_HP[star - 1] * k * (o.hpMult || 1) * (boost.hp || 1)),
    atk: atkV,
    spa: spaV,
    pwP,
    pwS,
    pwD,
    pwStar,
    basic: atkV,
    special,
    role,
    def: defV,
    spd: defV,
    spe: classStats.spe[roleKey],
    range,
    crit: CRIT_CHANCE,
    omnivamp: OMNIVAMP,
    maxPP: pp.max,
    startPP: pp.start
  };
}

const ADAPT = {
  '발챙이': {
    cmp: 'atkspa',
    tie: 'atk',
    modes: {
      atk: { skill: '깨뜨리다', role: '물리 전사', range: 1, special: false, skillType: '격투' },
      spa: { skill: '거품광선', role: '특수 마법사', range: 4, special: true, skillType: '물' }
    },
    evo: { atk: '강챙이', spa: '왕구리' }
  },
  '뚜벅쵸': {
    cmp: 'dmgtank',
    tie: 'dmg',
    modes: {
      dmg: { skill: '애시드봄', role: '특수 마법사', range: 4, special: true, skillType: '독' },
      tank: { skill: '꽃잎댄스', role: '특수 탱커', range: 1, special: true, skillType: '풀' }
    },
    evo: { dmg: '라플레시아', tank: '아르코' }
  },
  '배루키': {
    cmp: 'dmgtank',
    tie: 'eq',
    modes: {
      dmg: { skill: '로킥', role: '물리 전사', range: 1, special: false, skillType: '격투' },
      tank: { skill: '카운터', role: '물리 탱커', range: 1, special: false, skillType: '격투' },
      eq: { skill: '인파이트', role: '물리 전사', range: 1, special: false, skillType: '격투' }
    },
    evo: { dmg: '시라소몬', tank: '홍수몬', eq: '카포에라' }
  },
  '스라크': {
    cmp: 'dmgtank',
    tie: 'dmg',
    modes: {
      tank: { skill: '벌레먹기', role: '물리 탱커', range: 1, special: false, skillType: '벌레' },
      dmg: { skill: '엄습하는일격', role: '물리 전사', range: 1, special: false, skillType: '악' }
    },
    evo: { tank: '핫삼', dmg: '사마자르' }
  }
};

const ADAPT_CACHE = {};

function adaptMode(defId, v) {
  const A = ADAPT[defId];
  if (!A) return null;
  if (A.cmp === 'atkspa') {
    if (v.atk > v.spa) return 'atk';
    if (v.spa > v.atk) return 'spa';
    return A.tie;
  }
  const dmg = Math.max(v.atk, v.spa);
  const tank = Math.max(v.def, v.spd);
  if (dmg > tank) return 'dmg';
  if (tank > dmg) return 'tank';
  return A.tie;
}

function isAdaptBase(def, form) {
  return !!ADAPT[def.id] && def.forms.some(f => f === form);
}

function adaptForm(def, form, mode) {
  const A = ADAPT[def.id];
  if (!A || !mode || !A.modes[mode] || !isAdaptBase(def, form)) return form;
  const key = form.name + '|' + def.forms.indexOf(form) + '|' + mode;
  if (!ADAPT_CACHE[key]) ADAPT_CACHE[key] = Object.assign({}, form, A.modes[mode], { adaptMode: mode });
  return ADAPT_CACHE[key];
}

function itemStatBonuses(items) {
  const mods = { atk: 0, spa: 0, def: 0, spd: 0 };
  for (const id of items || []) {
    const d = typeof itemDef === 'function' ? itemDef(id) : null;
    const st = (d && d.stats) || {};
    for (const k in mods) mods[k] += st[k] || 0;
  }
  return mods;
}

function plannedView(inst) {
  const def = UNITS[inst.unitId];
  const form = formOf(def, inst.star, null, inst);
  const stats = applyFeast(computeStats(form, def.cost, inst.star, def.unlockOnly ? UNLOCK_STAT_BONUS : 1, { boost: def.boost }), inst.feast);
  const mods = itemStatBonuses(inst.items);
  return {
    atk: stats.atk * (1 + mods.atk),
    spa: stats.spa * (1 + mods.spa / 100) * stats.pwS,
    def: stats.def + mods.def,
    spd: stats.spd + mods.spd
  };
}

function plannedAdaptMode(inst) {
  return adaptMode(inst.unitId, plannedView(inst));
}

function shownForm(def, star, owner, inst) {
  const form = formOf(def, star, owner, inst);
  if (!inst || !ADAPT[def.id] || !isAdaptBase(def, form)) return form;
  return adaptForm(def, form, plannedAdaptMode(inst));
}

function skillTextOf(form) {
  if (typeof SKILL_TEXT === 'undefined' || !form) return null;
  return SKILL_TEXT[form.name + '·' + form.skill] || SKILL_TEXT[form.name] || null;
}

function roleOf(form, stats) {
  if (form.role) return form.role;
  if (stats && stats.role) return stats.role;
  const s = form.stats;
  const off = Math.max(s.atk, s.spa);
  const bulk = (s.hp + s.def + s.spd) / 3;
  const kind = stats.special ? '특수' : '물리';
  if (bulk >= off * 1.1 && bulk >= 65) return kind + ' 탱커';
  if (stats.range >= 3) {
    if (!stats.special) return '물리 원거리 딜러';
    if (s.spe >= 100 && bulk < off * 0.75) return '특수 암살자';
    if (s.spe >= 80) return '특수 원거리 딜러';
    return '특수 마법사';
  }
  if (stats.special) return '특수 전사';
  if (s.spe >= 90 && bulk < off * 0.85) return '물리 암살자';
  return '물리 전사';
}

function positionOf(stats) {
  return stats.range <= 2 ? '전방' : '후방';
}

const FEAST_STAT = { '물리 탱커': 'def', '특수 탱커': 'spd', '물리 마법사': 'atk', '물리 전사': 'atk', '특수 마법사': 'spa', '특수 전사': 'spa' };

function applyFeast(stats, feast) {
  if (!feast) return stats;
  stats.atk = Math.round(stats.atk * (1 + (feast.atk || 0)));
  stats.spa = Math.round(stats.spa * (1 + (feast.spa || 0)));
  stats.def = Math.round(stats.def * (1 + (feast.def || 0)));
  stats.spd = Math.round(stats.spd * (1 + (feast.spd || 0)));
  stats.basic = stats.atk;
  return stats;
}

const SPECIAL_EVO = new Set(['잉어킹', '미뇽', '신뇽', '고오스', '망키', '캐이시', '핑복', '야돈', '가라르 야돈']);

function regionVisible(def, regional) {
  if (def.region) return !!regional;
  return !(regional && REGION_FAMILIES.has(def.family));
}

function canEvolveFurther(inst, owner) {
  const def = UNITS[inst.unitId];
  if (!def) return false;
  const form = formOf(def, inst.star, owner, inst);
  if (SPECIAL_EVO.has(def.id)) return true;
  if (def.stageForms) return def.stageForms.findIndex(f => f.name === form.name) < def.stageForms.length - 1;
  if (def.branches && !def.branches.some(b => b.form.name === form.name)) return true;
  const names = def.forms.map(f => f.name);
  const i = names.indexOf(form.name);
  return i >= 0 && names.slice(i + 1).some(n => n !== form.name);
}

function hasItem(inst, id) {
  return !!(inst && inst.items && inst.items.some(x => itemBase(x) === id));
}

function instanceStats(inst, owner) {
  const def = UNITS[inst.unitId];
  const form = formOf(def, inst.star, owner, inst);
  return applyFeast(computeStats(form, def.cost, inst.star, def.unlockOnly ? UNLOCK_STAT_BONUS : 1, { boost: def.boost }), inst.feast);
}

function dittoTargetOf(owner) {
  if (!owner) return null;
  const board = owner.boardUnits().filter(u => u.unitId !== '메타몽');
  if (owner.dittoLink) {
    const linked = board.find(u => u.iid === owner.dittoLink);
    if (linked) return linked;
  }
  let best = null;
  for (const u of board) {
    if (!best || UNITS[u.unitId].cost > UNITS[best.unitId].cost || (UNITS[u.unitId].cost === UNITS[best.unitId].cost && u.star > best.star)) best = u;
  }
  return best;
}

const DITTO_MULT = [0.5, 0.7, 10];

function activeDitto(owner) {
  if (!owner) return null;
  let best = null;
  for (const u of owner.boardUnits()) {
    if (u.unitId !== '메타몽') continue;
    if (!best || u.star > best.star || (u.star === best.star && u.iid < best.iid)) best = u;
  }
  return best;
}

function dittoCopy(ditto, owner) {
  if (!ditto || activeDitto(owner) !== ditto) return null;
  const tgt = dittoTargetOf(owner);
  if (!tgt) return null;
  const def = UNITS[tgt.unitId];
  const form = formOf(def, tgt.star, owner, tgt);
  const base = computeStats(form, def.cost, tgt.star, def.unlockOnly ? UNLOCK_STAT_BONUS : 1, { boost: def.boost });
  const k = DITTO_MULT[Math.min(3, ditto.star) - 1];
  for (const key of ['hp', 'atk', 'spa', 'def', 'spd']) base[key] = Math.round(base[key] * k);
  base.basic = base.atk;
  const traits = allTraitsOf(def, tgt.star, owner, tgt).slice();
  if (!traits.includes('괴짜')) traits.push('괴짜');
  return { target: tgt, def, form, stats: base, traits, star: tgt.star };
}

let NEXT_IID = 1;

const SHINY_ODDS = 2048;

function shinyRoll(seed, pid, n, charm) {
  let h = (seed ^ Math.imul(pid + 1, 0x9e3779b1) ^ Math.imul(n + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h = (h ^ (h >>> 16)) >>> 0;
  return h % SHINY_ODDS < (charm ? 2 : 1);
}

function newInstance(unitId, star) {
  return { iid: NEXT_IID++, unitId, star: star || 1, wins: 0, pvpWins: 0, takedowns: 0, battles: 0, feast: null, loc: null, items: [], fz: null, fzFree: false };
}
