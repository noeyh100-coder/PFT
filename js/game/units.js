const UNITS = {};
const FAMILIES = {};
const FORM_INDEX = {};

(function buildRegistry() {
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
const STAR_MULT = [1, 1.8, 3.24];
const COST_POWER = [1, 1.18, 1.36, 1.56, 1.8];
const CRIT_CHANCE = 0.0417;
const OMNIVAMP = 0;

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

function formOf(def, star, owner) {
  if (def.stageForms) {
    const stage = owner ? owner.downloadStage : 0;
    return def.stageForms[Math.min(stage, def.stageForms.length - 1)];
  }
  const b = branchOf(def, star, owner);
  if (b) return b.form;
  return def.forms[Math.min(star, def.forms.length) - 1];
}

function classTraitsOf(def, star, owner) {
  const b = branchOf(def, star, owner);
  if (b && b.traits) return b.traits;
  return def.traits;
}

function allTraitsOf(def, star, owner) {
  const form = formOf(def, star, owner);
  const set = [];
  for (const t of form.types) if (!set.includes(t)) set.push(t);
  for (const t of classTraitsOf(def, star, owner)) if (!set.includes(t)) set.push(t);
  for (const t of def.uniques) if (!set.includes(t)) set.push(t);
  return set;
}

function computeStats(form, cost, star, bonus, opts) {
  const s = form.stats;
  const o = opts || {};
  const total = s.hp + s.atk + s.spa + s.def + s.spd + s.spe;
  const avg = total / 6;
  const ratio = v => Math.max(0.4, Math.min(2.2, v / avg));
  const k = COST_POWER[Math.max(1, Math.min(5, cost)) - 1] * STAR_MULT[star - 1] * (bonus || 1);
  const special = form.special != null ? form.special : s.spa > s.atk;
  const costDef = 0.9 + 0.05 * cost;
  const speed = Math.max(0, Math.min(1, (s.spe - 20) / 130));
  const pa = Math.round(45 * k * (0.5 + 0.5 * ratio(s.atk)));
  const sa = Math.round(45 * k * (0.5 + 0.5 * ratio(s.spa)));
  const range = o.range || form.range || (special ? CONFIG.combat.rangedRange : 1);
  return {
    hp: Math.round(500 * k * (0.55 + 0.45 * ratio(s.hp)) * (o.hpMult || 1)),
    pa,
    sa,
    basic: special ? sa : pa,
    special,
    armor: Math.round(30 * (0.35 + 0.65 * ratio(s.def)) * costDef),
    mr: Math.round(30 * (0.35 + 0.65 * ratio(s.spd)) * costDef),
    as: Math.round((0.55 + 0.3 * speed) * 100) / 100,
    range,
    crit: CRIT_CHANCE,
    omnivamp: OMNIVAMP,
    maxMana: CONFIG.combat.maxMana
  };
}

function roleOf(form, stats) {
  if (form.role) return form.role;
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
  stats.pa = Math.round(stats.pa * (1 + (feast.atk || 0)));
  stats.sa = Math.round(stats.sa * (1 + (feast.spa || 0)));
  stats.armor = Math.round(stats.armor * (1 + (feast.def || 0)));
  stats.mr = Math.round(stats.mr * (1 + (feast.spd || 0)));
  stats.basic = stats.special ? stats.sa : stats.pa;
  return stats;
}

function instanceStats(inst, owner) {
  const def = UNITS[inst.unitId];
  const form = formOf(def, inst.star, owner);
  return applyFeast(computeStats(form, def.cost, inst.star, def.unlockOnly ? UNLOCK_STAT_BONUS : 1), inst.feast);
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

const DITTO_MULT = [0.7, 0.9, 10];

function dittoCopy(ditto, owner) {
  const tgt = dittoTargetOf(owner);
  if (!tgt) return null;
  const def = UNITS[tgt.unitId];
  const form = formOf(def, tgt.star, owner);
  const base = computeStats(form, def.cost, tgt.star, def.unlockOnly ? UNLOCK_STAT_BONUS : 1);
  const k = DITTO_MULT[Math.min(3, ditto.star) - 1];
  for (const key of ['hp', 'pa', 'sa', 'armor', 'mr']) base[key] = Math.round(base[key] * k);
  base.basic = base.special ? base.sa : base.pa;
  const traits = allTraitsOf(def, tgt.star, owner).slice();
  if (!traits.includes('괴짜')) traits.push('괴짜');
  return { target: tgt, def, form, stats: base, traits, star: tgt.star };
}

let NEXT_IID = 1;

function newInstance(unitId, star) {
  return { iid: NEXT_IID++, unitId, star: star || 1, wins: 0, pvpWins: 0, takedowns: 0, battles: 0, feast: null, loc: null };
}
