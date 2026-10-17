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
const STAR_HP = [1, 1.8, 3.24];
const STAR_ATK = [1, 1.5, 2.25];
const COST_HP = { 1: [650, 580, 500], 2: [750, 700, 650], 3: [900, 820, 750], 4: [1000, 900, 850], 5: [1200, 1100, 1000] };
const COST_ATK = [50, 55, 65, 75, 90];
const ROLE_DEF = { 탱커: 40, 전사: 30, 마법사: 20 };
const ROLE_AS = { 탱커: 0.6, 전사: 0.7, 마법사: 0.8 };
const ROLE_INDEX = { 탱커: 0, 전사: 1, 마법사: 2 };
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

const PP_ROLE = { 탱커: [25, 1.5], 전사: [20, 1], 마법사: [16, 1] };
const PP_ADJUST = { '거북왕': 3, '폴리곤Z': 3, '거대코뿌리': 3, '해피너스': 3, '망나뇽': 3, '뮤': 3, '리자몽': 3, '이상해꽃': 3, '파이어': 3, '프리져': 3, '라프라스': 3, '후딘': 2, '꼬렛': -2, '레트라': -2, '콘치': -2, '왕콘치': -2, '깨비참': -2, '깨비드릴조': -2, '피츄': -2, '크랩': -2, '킹크랩': -2, '파오리': -2, '쁘사이저': -2, '핫삼': -2, '고라파덕': -2, '나옹': -2 };

function ppFor(form, cost, role) {
  const kind = (role || '').split(' ')[1] || '전사';
  const base = PP_ROLE[kind] || PP_ROLE.전사;
  const max = Math.round(base[0] + (Math.max(1, cost) - 1) * base[1] + (PP_ADJUST[form.name] || 0));
  const start = kind === '탱커' && cost >= 3 ? Math.round(max * 0.15) : 0;
  return { max: Math.max(8, max), start };
}

function computeStats(form, cost, star, bonus, opts) {
  const o = opts || {};
  const c = Math.max(1, Math.min(5, cost));
  const role = formRole(form, o.range);
  const kind = role.split(' ')[1] || '전사';
  const ri = ROLE_INDEX[kind] != null ? ROLE_INDEX[kind] : 1;
  const special = role.startsWith('특수');
  const k = bonus || 1;
  const boost = o.boost || {};
  const atk = COST_ATK[c - 1] * STAR_ATK[star - 1] * k;
  const main = Math.round(atk * (boost.pa || 1));
  const off = Math.round(atk * 0.5 * (boost.pa || 1));
  const pa = special ? off : main;
  const sa = special ? main : off;
  const range = o.range || form.range || (special ? CONFIG.combat.rangedRange : 1);
  const dfn = ROLE_DEF[kind] || 30;
  const pp = ppFor(form, c, role);
  return {
    hp: Math.round(COST_HP[c][ri] * STAR_HP[star - 1] * k * (o.hpMult || 1) * (boost.hp || 1)),
    pa,
    sa,
    basic: special ? sa : pa,
    special,
    role,
    armor: dfn,
    mr: dfn,
    as: ROLE_AS[kind] || 0.7,
    range,
    crit: CRIT_CHANCE,
    omnivamp: OMNIVAMP,
    maxMana: pp.max,
    startMana: pp.start
  };
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
  stats.pa = Math.round(stats.pa * (1 + (feast.atk || 0)));
  stats.sa = Math.round(stats.sa * (1 + (feast.spa || 0)));
  stats.armor = Math.round(stats.armor * (1 + (feast.def || 0)));
  stats.mr = Math.round(stats.mr * (1 + (feast.spd || 0)));
  stats.basic = stats.special ? stats.sa : stats.pa;
  return stats;
}

const SPECIAL_EVO = new Set(['잉어킹', '미뇽', '신뇽', '고오스', '망키', '캐이시', '핑복', '야돈']);

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
  return !!(inst && inst.items && inst.items.includes(id));
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
  for (const key of ['hp', 'pa', 'sa', 'armor', 'mr']) base[key] = Math.round(base[key] * k);
  base.basic = base.special ? base.sa : base.pa;
  const traits = allTraitsOf(def, tgt.star, owner, tgt).slice();
  if (!traits.includes('괴짜')) traits.push('괴짜');
  return { target: tgt, def, form, stats: base, traits, star: tgt.star };
}

let NEXT_IID = 1;

function newInstance(unitId, star) {
  return { iid: NEXT_IID++, unitId, star: star || 1, wins: 0, pvpWins: 0, takedowns: 0, battles: 0, feast: null, loc: null, items: [], fz: null, fzFree: false };
}
