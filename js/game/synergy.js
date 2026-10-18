function bestInstances(list, owner) {
  const best = new Map();
  const extra = [];
  const ditto = owner && typeof activeDitto === 'function' ? activeDitto(owner) : null;
  for (const inst of list) {
    if (ditto && inst === ditto && inst.loc && inst.loc.zone === 'board' && dittoTargetOf(owner)) {
      extra.push(inst);
      continue;
    }
    const def = UNITS[inst.unitId];
    const key = def ? def.family : inst.unitId;
    const cur = best.get(key);
    if (!cur) {
      best.set(key, inst);
      continue;
    }
    const a = def ? def.cost : 0;
    const b = UNITS[cur.unitId] ? UNITS[cur.unitId].cost : 0;
    if (a > b || (a === b && inst.star > cur.star)) best.set(key, inst);
  }
  return Array.from(best.values()).concat(extra);
}

function tierFor(def, count) {
  let tier = 0;
  for (const t of def.tiers) if (count >= t) tier += 1;
  return tier;
}

function computeSynergies(owner, insts) {
  const list = bestInstances(insts || owner.boardUnits(), insts ? null : owner);
  const groups = {};
  for (const inst of list) {
    let def = UNITS[inst.unitId];
    let form = formOf(def, inst.star, owner, inst);
    let traits = allTraitsOf(def, inst.star, owner, inst);
    let ref = inst;
    if (inst.unitId === '메타몽' && inst.loc && inst.loc.zone === 'board') {
      const cp = dittoCopy(inst, owner);
      if (cp) {
        def = cp.def;
        form = cp.form;
        traits = cp.traits;
        ref = { unitId: inst.unitId, star: cp.star, iid: inst.iid };
      }
    }
    for (const t of traits) {
      if (!TRAIT_DATA.map[t]) continue;
      if (!groups[t]) groups[t] = [];
      groups[t].push({ inst: ref, def, form });
    }
  }
  const out = [];
  let dittoBonus = null;
  if (owner && owner.encounter === '메타몽') {
    let best = null;
    for (const id in groups) {
      const td = TRAIT_DATA.map[id];
      if ((td.kind !== 'type' && td.kind !== 'class') || (td.mode !== 'count' && td.mode !== 'normal')) continue;
      const n = groups[id].length;
      const t = tierFor(td, n);
      const gap = td.tiers[t] != null ? td.tiers[t] - n : 99;
      const cand = { id, n, gap };
      if (!best || n > best.n || (n === best.n && (gap < best.gap || (gap === best.gap && id < best.id)))) best = cand;
    }
    if (best) dittoBonus = best.id;
  }
  for (const id in groups) {
    const td = TRAIT_DATA.map[id];
    const g = groups[id];
    let count = g.length + (id === dittoBonus ? 1 : 0);
    let pairCosts = [];
    let star3 = 0;
    if (td.mode === 'star3') count = g.filter(m => m.inst.star >= 3).length;
    else if (td.mode === 'bug') star3 = Math.min(5, g.filter(m => m.inst.star >= 3).length);
    else if (td.mode === 'costs') count = new Set(g.map(m => m.def.cost)).size;
    else if (td.mode === 'pairs') {
      const byCost = {};
      for (const m of g) byCost[m.def.cost] = (byCost[m.def.cost] || 0) + 1;
      pairCosts = Object.keys(byCost).filter(c => byCost[c] === 2).map(Number).sort((a, b) => a - b);
      count = pairCosts.length;
    }
    const tier = td.mode === 'bug' ? (count >= 3 ? 1 + star3 : 0) : tierFor(td, count);
    out.push({
      id,
      kind: td.kind,
      count,
      tiers: td.tiers,
      tier,
      need: td.tiers[0],
      next: td.tiers[tier] || null,
      active: tier > 0,
      members: g.map(m => m.form.name),
      unitIds: g.map(m => m.def.id),
      pairCosts,
      star3,
      bonus: id === dittoBonus ? 1 : 0
    });
  }
  const kindRank = { type: 1, class: 1, unique: 0 };
  out.sort((a, b) => (kindRank[a.kind] - kindRank[b.kind]) || (Number(b.active) - Number(a.active)) || (b.tier - a.tier) || (b.count - a.count) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return out;
}

function synergyTeam(owner) {
  const syn = computeSynergies(owner);
  const tiers = {};
  let water = [];
  let normals = [];
  for (const s of syn) {
    tiers[s.id] = s.tier;
    if (s.id === '물') water = s.pairCosts;
    if (s.id === '노말' && s.active) normals = s.unitIds.slice();
  }
  return {
    tiers,
    waterPairCosts: water,
    normals,
    scales: owner.dragonScales || 0
  };
}

function strongestDragonIid(owner) {
  let best = null;
  for (const inst of owner.boardUnits()) {
    const def = UNITS[inst.unitId];
    if (!formOf(def, inst.star, owner, inst).types.includes('드래곤')) continue;
    if (!best || def.cost > UNITS[best.unitId].cost || (def.cost === UNITS[best.unitId].cost && inst.star > best.star)) best = inst;
  }
  return best ? best.iid : null;
}

const SYNERGY_MEMBER_CACHE = {};

function unitLabel(def) {
  const forms = def.stageForms || def.forms;
  const evolves = !!def.branches || new Set(forms.map(f => f.name)).size > 1;
  return def.id + (evolves ? ' 계열' : '');
}

function traitMembers(id, region) {
  const key = id + '|' + (region || '');
  if (SYNERGY_MEMBER_CACHE[key]) return SYNERGY_MEMBER_CACHE[key];
  const td = TRAIT_DATA.map[id];
  const isType = td && td.kind === 'type';
  const out = [];
  const starText = n => (n === 1 ? '1성' : '1~' + n + '성');
  for (const def of UNIT_DATA) {
    if (def.region && def.region !== region) continue;
    const forms = def.stageForms || def.forms;
    const own = def.traits.includes(id) || def.uniques.includes(id);
    const has = forms.map(f => (isType ? f.types.includes(id) : own));
    const push = (form, note, branchKey) => out.push({ unitId: def.id, cost: def.cost, form, note, branchKey: branchKey || null, unlock: !!def.unlockOnly, label: unitLabel(def) });
    if (!def.branches) {
      const idxs = has.map((v, i) => (v ? i : -1)).filter(i => i >= 0);
      if (!idxs.length) continue;
      if (idxs.length === forms.length) push(forms[forms.length - 1], '');
      else if (idxs[0] > 0) push(forms[idxs[0]], (idxs[0] + 1) + '성부터');
      else push(forms[0], starText(idxs.length) + '만');
      continue;
    }
    const bs = def.branchStar;
    const pre = has.slice(0, bs - 1);
    const keeps = def.branches.filter(b => (isType ? b.form.types.includes(id) : (b.traits ? b.traits.includes(id) : own)));
    if (pre.length && pre.every(Boolean)) {
      if (keeps.length === def.branches.length) push(forms[bs - 2], '');
      else if (!keeps.length) push(forms[bs - 2], starText(bs - 1) + '만');
      else push(forms[bs - 2], keeps.map(b => b.form.name).join('·') + ' 분기까지');
    } else {
      for (const b of keeps) push(b.form, bs + '성 ' + b.form.name + ' 분기', b.key);
    }
  }
  out.sort((a, b) => (a.cost - b.cost) || (Number(a.unlock) - Number(b.unlock)));
  SYNERGY_MEMBER_CACHE[key] = out;
  return out;
}

function memberActive(owner, entry, id) {
  if (!owner) return false;
  for (const inst of owner.boardUnits()) {
    if (inst.unitId !== entry.unitId) continue;
    const def = UNITS[inst.unitId];
    if (entry.branchKey && owner.branch[def.id] !== entry.branchKey) continue;
    if (allTraitsOf(def, inst.star, owner, inst).includes(id)) return true;
  }
  return false;
}
