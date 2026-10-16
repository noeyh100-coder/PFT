const CLASS_COLORS = {
  '최면술사': '#c77dff', '난동꾼': '#ff7b54', '감시자': '#5ec4b6', '타격대': '#e05252', '파수꾼': '#7f9cf5',
  '기병대': '#d9a441', '매복자': '#6b8f71', '주문술사': '#5fa8ff', '선도자': '#f2e394', '도전자': '#ff9f43',
  '학살자': '#b0413e', '화석': '#a68a64', '흡수자': '#8e5bb5', '전쟁기계': '#8d99ae'
};

const ROUND_ICON = { encounter: 'encounter', pve: 'ball', pvp: 'sword', carousel: 'sushi' };

const View = {
  CELL_W: 54,
  CELL_H: 62,
  ROW_STEP: 46,
  BOARD_X: 194,
  BOARD_Y: 58,

  cellPos(r, c) {
    return { x: this.BOARD_X + (c + (r & 1) * 0.5) * this.CELL_W, y: this.BOARD_Y + r * this.ROW_STEP };
  },

  cellCenter(r, c) {
    const p = this.cellPos(r, c);
    return { x: p.x + this.CELL_W / 2, y: p.y + this.CELL_H / 2 };
  },

  esc(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  },

  el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  },

  orbBackground(types) {
    const a = TYPE_COLORS[types[0]] || '#888';
    if (types.length < 2) return a;
    const b = TYPE_COLORS[types[1]] || a;
    return 'linear-gradient(135deg, ' + a + ' 0 50%, ' + b + ' 50% 100%)';
  },

  traitColor(id) {
    if (TYPE_COLORS[id]) return TYPE_COLORS[id];
    if (CLASS_COLORS[id]) return CLASS_COLORS[id];
    return '#f6c945';
  },

  traitAbbr(id) {
    return id.length <= 2 ? id : id.slice(0, 2);
  },

  hex(id) {
    const h = this.el('div', 'hex');
    h.style.setProperty('--hex-color', this.traitColor(id));
    h.appendChild(this.el('span', null, this.traitAbbr(id)));
    return h;
  },

  miniTrait(id) {
    const row = this.el('div', 'mini-trait');
    const h = this.hex(id);
    h.firstChild.textContent = '';
    row.appendChild(h);
    row.appendChild(this.el('span', null, id));
    return row;
  },

  badgeFor(def) {
    if (!def) return '';
    const m = { '알로라': '알', '가라르': '가', '히스이': '히', '컴뱃종': '팔', '블레이즈종': '팔', '워터종': '팔' };
    return m[def.variant] || '';
  },

  variantLabel(def) {
    if (!def || def.variant === '원종') return '';
    if (def.variant.endsWith('종')) return def.variant;
    return def.variant + ' 폼';
  },

  unitEl(opts) {
    const el = this.el('div', opts.className || 'unit');
    const ring = this.el('div', 'cost-ring');
    ring.style.boxShadow = '0 0 0 2px ' + (COST_COLORS[opts.cost] || '#888');
    let orb = opts.form ? Sprites.make(opts.form, { star: opts.star, dir: opts.dir }) : null;
    if (orb) {
      ring.style.display = 'none';
      el.classList.add('has-spr', 'spr-s' + orb._spr.d.s);
      el._spr = orb._spr;
      el.style.setProperty('--head', Math.min(6, Math.round(Sprites.headY(orb._spr))) + 'px');
      if (opts.ditto) el.classList.add('ditto-copy');
    } else {
      orb = this.el('div', 'orb');
      orb.style.background = this.orbBackground(opts.types);
    }
    el.appendChild(ring);
    el.appendChild(orb);
    el.appendChild(this.el('div', 'stars', '★'.repeat(opts.star || 1)));
    el.appendChild(this.el('div', 'label', opts.name));
    if (opts.badge) el.appendChild(this.el('div', 'badge', opts.badge));
    return el;
  },

  instanceView(inst, owner) {
    const def = UNITS[inst.unitId];
    const form = formOf(def, inst.star, owner);
    return { name: form.name, form, types: form.types, star: inst.star, cost: def.cost, badge: this.badgeFor(def) };
  },

  portrait(name, size) {
    const wrap = this.el('div', 'portrait');
    const face = this.el('div', 'face');
    const s = size / 16;
    face.style.backgroundImage = 'url("' + Assets.playerUrl(name) + '")';
    face.style.backgroundSize = (96 * s) + 'px ' + (128 * s) + 'px';
    face.style.backgroundPosition = (-(32 + 8) * s) + 'px ' + (-7 * s) + 'px';
    wrap.appendChild(face);
    return wrap;
  },

  renderItems(container) {
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) container.appendChild(this.el('div', 'item-slot'));
  },

  renderTraits(container, owner, page, onMore, hooks) {
    container.innerHTML = '';
    const list = computeSynergies(owner);
    const per = 9;
    const pages = Math.max(1, Math.ceil(list.length / per));
    const pg = Math.min(page || 0, pages - 1);
    for (const t of list.slice(pg * per, pg * per + per)) {
      const row = this.el('div', 'trait' + (t.active ? ' active' : ''));
      row.dataset.trait = t.id;
      row.appendChild(this.hex(t.id));
      row.appendChild(this.el('div', 'trait-count', t.count));
      const text = this.el('div', 'trait-text');
      text.appendChild(this.el('div', 'trait-name', t.id));
      const steps = this.el('div', 'trait-steps');
      if (t.active && t.tiers.length > 1) {
        t.tiers.forEach((n, i) => {
          if (i) steps.appendChild(this.el('i', null, '›'));
          steps.appendChild(this.el('span', i + 1 === t.tier ? 'cur' : i < t.tier ? 'got' : null, n));
        });
      } else if (t.active) {
        steps.appendChild(this.el('span', 'cur', t.tiers[0]));
      } else {
        steps.textContent = t.count + ' / ' + t.need;
      }
      text.appendChild(steps);
      row.appendChild(text);
      if (hooks) {
        row.addEventListener('mouseenter', () => hooks.enter(row, t.id));
        row.addEventListener('mouseleave', () => hooks.leave());
      }
      container.appendChild(row);
    }
    if (pages > 1) {
      const more = this.el('button', 'trait-more', '+' + (list.length - Math.min(per, list.length - pg * per)));
      more.dataset.tip = (pg + 1) + ' / ' + pages + ' 페이지';
      more.style.top = (per * 42) + 'px';
      more.addEventListener('click', () => onMore((pg + 1) % pages));
      container.appendChild(more);
    }
    return pg;
  },

  traitExtra(id, owner, entry) {
    const lines = [];
    if (!owner) return lines;
    if (id === '드래곤') lines.push('보유한 용의 비늘: ' + (owner.dragonScales || 0) + '개');
    if (id === '격투') lines.push('수련 스택: ' + Math.floor(owner.training || 0));
    if (id === '에스퍼') lines.push('서로 다른 가격: ' + (entry ? entry.count : 0) + '종류 · 사이킥 에너지: ' + Math.round(owner.psychic || 0));
    if (id === '물') lines.push(entry && entry.pairCosts.length ? '짝을 이룬 가격: ' + entry.pairCosts.map(c => c + '코').join(', ') : '짝을 이룬 가격이 없습니다');
    if (id === '벌레') lines.push('필드의 3성 벌레: ' + (entry ? entry.count : 0) + '마리');
    return lines;
  },

  traitPortrait(m, id, owner) {
    const on = memberActive(owner, m, id);
    const el = this.el('div', 'tt-unit' + (on ? ' on' : ''));
    el.style.setProperty('--cost-color', COST_COLORS[m.cost]);
    const card = Assets.cardUrl(m.form);
    const spr = Assets.ready(card) ? null : Sprites.portrait(m.form, 48, { fill: 0.85, max: 2 });
    if (Assets.ready(card)) {
      el.style.backgroundImage = 'url("' + card + '")';
      el.classList.add('art');
    } else if (spr) {
      el.classList.add('dot');
      el.appendChild(spr);
    } else {
      el.style.background = this.orbBackground(m.form.types);
      el.appendChild(this.el('span', null, m.form.name.slice(0, 2)));
    }
    let tip = m.label;
    if (m.form.name !== m.unitId) tip += ' (' + m.form.name + ')';
    if (m.note) tip += ' · ' + m.note;
    if (m.unlock) tip += ' · 해금';
    if (id === '노말' && NORMAL_EFFECTS[m.unitId]) tip += ' — ' + NORMAL_EFFECTS[m.unitId].text;
    el.dataset.tip = tip;
    return el;
  },

  renderTraitTip(container, id, owner, region) {
    container.innerHTML = '';
    const td = TRAIT_DATA.map[id];
    if (!td) return;
    const entry = owner ? computeSynergies(owner).find(s => s.id === id) : null;
    const tier = entry ? entry.tier : 0;
    const head = this.el('div', 'tt-head');
    head.appendChild(this.hex(id));
    head.appendChild(this.el('b', null, id));
    head.appendChild(this.el('span', 'tt-kind', td.kind === 'type' ? '타입' : td.kind === 'class' ? '직업' : '고유'));
    container.appendChild(head);
    container.appendChild(this.el('div', 'tt-desc', td.desc));
    for (const line of this.traitExtra(id, owner, entry)) container.appendChild(this.el('div', 'tt-extra', line));
    const steps = this.el('div', 'tt-steps');
    td.tiers.forEach((n, i) => {
      const row = this.el('div', 'tt-step' + (i + 1 === tier ? ' on' : i + 1 < tier ? ' got' : ''));
      const label = td.countLabel === '짝' ? n + '짝' : td.countLabel === '3성 벌레' ? '3성 ' + n + '마리' : td.countLabel === '가격 종류' ? n + '종류' : n;
      row.appendChild(this.el('span', 'tt-n', '(' + label + ')'));
      row.appendChild(this.el('span', null, td.steps[i] || ''));
      steps.appendChild(row);
    });
    container.appendChild(steps);
    if (id === '노말') {
      const list = this.el('div', 'tt-normal');
      const active = entry && entry.active ? entry.unitIds : [];
      const ids = entry ? entry.unitIds : [];
      if (!ids.length) list.appendChild(this.el('div', 'tt-step', '필드에 노말 타입 포켓몬이 없습니다'));
      for (const uid of ids) {
        const e = NORMAL_EFFECTS[uid];
        if (!e) continue;
        list.appendChild(this.el('div', 'tt-step' + (active.includes(uid) ? ' on' : ''), uid + ': ' + e.text));
      }
      container.appendChild(list);
    }
    const grid = this.el('div', 'tt-units');
    for (const m of traitMembers(id, region)) grid.appendChild(this.traitPortrait(m, id, owner));
    container.appendChild(grid);
  },

  renderPlayers(container, game, viewId, onClick) {
    container.innerHTML = '';
    const human = game.human;
    const list = game.players.slice().sort((a, b) => (Number(b.alive) - Number(a.alive)) || (b.hp - a.hp) || ((a.placement || 9) - (b.placement || 9)));
    for (const p of list) {
      let cls = 'prow';
      if (p.isHuman) cls += ' me';
      if (human && human.alive && human.currentOpponent === p.id && !p.isHuman) cls += ' vs';
      if (p.id === viewId) cls += ' viewing';
      if (!p.alive) cls += ' dead';
      if (p.hp <= 30) cls += ' low';
      const row = this.el('div', cls);
      const name = this.el('div', 'pname', p.alive ? p.name : p.name + ' · ' + p.placement + '등');
      const por = this.portrait(p.strategist, p.isHuman ? 36 : 31);
      por.appendChild(this.el('div', 'hp', p.alive ? p.hp : '✕'));
      row.appendChild(name);
      row.appendChild(por);
      if (p.alive) row.addEventListener('click', () => onClick(p));
      container.appendChild(row);
    }
  },

  shopCard(game, p, slot, enabled) {
    const id = p.shop[slot];
    const card = this.el('div', 'card');
    card.dataset.slot = slot;
    if (!id) {
      card.classList.add('empty');
      return card;
    }
    const def = UNITS[id];
    const form = formOf(def, 1, p);
    card.style.setProperty('--cost-color', COST_COLORS[def.cost]);
    Assets.setCardArt(card, form);
    const traits = this.el('div', 'card-traits');
    for (const t of allTraitsOf(def, 1, p)) traits.appendChild(this.miniTrait(t));
    card.appendChild(traits);
    const owned = p.allUnits().filter(u => u.unitId === id && u.star === 1).length;
    if (owned >= 2) card.appendChild(this.el('div', 'card-badge', '★★'));
    else if (p.allUnits().some(u => u.unitId === id)) card.appendChild(this.el('div', 'card-badge', '보유'));
    const variant = this.variantLabel(def);
    if (variant) card.appendChild(this.el('div', 'card-variant', variant));
    const bottom = this.el('div', 'card-bottom');
    bottom.appendChild(this.el('div', 'card-name', form.name));
    const cost = this.el('div', 'card-cost');
    cost.innerHTML = iconSvg('coin', 12);
    cost.appendChild(document.createTextNode(def.cost));
    bottom.appendChild(cost);
    card.appendChild(bottom);
    if (!enabled || !game.canBuy(p, slot).ok) card.classList.add('disabled');
    return card;
  },

  pickCard(def, owner, form, extraTraits) {
    const card = this.el('div', 'card');
    card.style.setProperty('--cost-color', COST_COLORS[def.cost]);
    Assets.setCardArt(card, form);
    const traits = this.el('div', 'card-traits');
    for (const t of form.types.concat(extraTraits || [])) traits.appendChild(this.miniTrait(t));
    card.appendChild(traits);
    const bottom = this.el('div', 'card-bottom');
    bottom.appendChild(this.el('div', 'card-name', form.name));
    card.appendChild(bottom);
    return card;
  },

  infoFromInstance(inst, owner) {
    const def = UNITS[inst.unitId];
    const form = formOf(def, inst.star, owner);
    const stats = instanceStats(inst, owner);
    return { form, star: inst.star, cost: def.cost, def, traits: allTraitsOf(def, inst.star, owner), stats, hp: stats.hp, maxHp: stats.hp, mana: 0, maxMana: stats.maxMana, inst, owner };
  },

  infoFromCombat(cu) {
    const form = cu.form || FORM_INDEX[cu.name];
    const def = cu.unitId ? UNITS[cu.unitId] : null;
    const stats = cu.eff ? Object.assign({}, cu.stats, cu.eff) : cu.stats;
    return { form, star: cu.star, cost: cu.cost, def, traits: cu.traits, stats, hp: cu.hp, maxHp: Math.round(cu.maxHp), shield: cu.shield, mana: cu.mana, maxMana: cu.maxMana, combat: cu, creep: cu.creep };
  },

  infoFromCreep(spec) {
    return { form: spec.form, star: spec.star, cost: spec.cost, def: null, traits: spec.form.types.slice(), stats: spec.stats, hp: spec.stats.hp, maxHp: spec.stats.hp, mana: 0, maxMana: spec.stats.maxMana, creep: true };
  },

  renderInfo(container, t) {
    container.innerHTML = '';
    if (!t) return;
    const s = t.stats;
    container.appendChild(this.el('div', 'ip-stars', '★'.repeat(t.star)));
    const art = this.el('div', 'ip-art');
    art.style.setProperty('--cost-color', t.creep ? '#b0b0b0' : COST_COLORS[t.cost]);
    Assets.setCardArt(art, t.form, 100);
    const traits = this.el('div', 'ip-traits');
    for (const id of t.traits) traits.appendChild(this.miniTrait(id));
    art.appendChild(traits);
    const name = this.el('div', 'ip-name');
    const nm = this.el('b', null, t.form.name);
    name.appendChild(nm);
    if (!t.creep) {
      const cost = this.el('div', 'ip-cost');
      cost.innerHTML = iconSvg('coin', 12);
      cost.appendChild(document.createTextNode(t.cost));
      name.appendChild(cost);
    } else {
      name.appendChild(this.el('span', 'chip', '야생'));
    }
    art.appendChild(name);
    container.appendChild(art);
    const hp = this.el('div', 'ip-bar hp');
    const hpFill = this.el('i');
    hpFill.style.width = Math.max(0, (t.hp / t.maxHp) * 100) + '%';
    hp.appendChild(hpFill);
    hp.appendChild(this.el('span', null, Math.max(0, Math.round(t.hp)) + ' / ' + t.maxHp + (t.shield >= 1 ? ' (+' + Math.round(t.shield) + ')' : '')));
    const pp = this.el('div', 'ip-bar pp');
    const ppFill = this.el('i');
    ppFill.style.width = Math.max(0, (t.mana / t.maxMana) * 100) + '%';
    pp.appendChild(ppFill);
    pp.appendChild(this.el('span', null, 'PP ' + Math.floor(t.mana) + ' / ' + t.maxMana));
    container.appendChild(hp);
    container.appendChild(pp);
    const row = this.el('div', 'ip-row');
    const st = !t.creep && t.form ? SKILL_TEXT[t.form.name] : null;
    const skill = this.el('div', 'ip-skill', st ? st.name : t.creep ? '야생' : '스킬');
    if (st) skill.dataset.tip = st.name + ' (' + st.type + ')\n' + st.text;
    const skillUrl = Assets.skillUrl(t.form);
    if (Assets.ready(skillUrl)) {
      skill.style.backgroundImage = 'url("' + skillUrl + '")';
      skill.classList.add('has-art');
    }
    row.appendChild(skill);
    const pos = this.el('div', 'ip-cell');
    const front = positionOf(s) === '전방';
    pos.innerHTML = iconSvg(front ? 'shield' : 'arrow', 14);
    pos.appendChild(this.el('span', null, positionOf(s)));
    const rng = this.el('div', 'ip-cell');
    rng.innerHTML = iconSvg('target', 14);
    rng.appendChild(this.el('span', null, s.range + '칸'));
    row.appendChild(pos);
    row.appendChild(rng);
    container.appendChild(row);
    const items = this.el('div', 'ip-items');
    for (let i = 0; i < 3; i++) items.appendChild(this.el('div'));
    container.appendChild(items);
    const role = this.el('div', 'ip-role');
    role.innerHTML = iconSvg('role', 12);
    role.appendChild(this.el('span', null, roleOf(t.form, s)));
    container.appendChild(role);
    const grid = this.el('div', 'ip-stats');
    const rows = [
      ['pa', '물리공격력', s.pa],
      ['sa', '특수공격력', s.sa],
      ['armor', '물리방어력', s.armor],
      ['mr', '특수방어력', s.mr],
      ['basic', '기본공격 (' + (s.special ? '특수' : '물리') + ')', s.basic],
      ['as', '공격속도', s.as.toFixed(2)],
      ['crit', '급소율', (s.crit < 0.1 ? (s.crit * 100).toFixed(1) : Math.round(s.crit * 100)) + '%'],
      ['vamp', '모든 피해 흡혈', Math.round(s.omnivamp * 100) + '%']
    ];
    for (const [ico, label, value] of rows) {
      const cell = this.el('div', 'ip-stat');
      cell.dataset.tip = label;
      cell.innerHTML = iconSvg(ico, 16);
      cell.appendChild(this.el('b', null, value));
      grid.appendChild(cell);
    }
    container.appendChild(grid);
  },

  damageRows(units, tab) {
    const rows = units.map(u => {
      let p = 0;
      let sp = 0;
      let h = 0;
      if (tab === 'dealt') {
        p = u.dealtP;
        sp = u.dealtS;
      } else if (tab === 'taken') {
        p = u.takenP;
        sp = u.takenS;
      } else {
        h = u.healed;
      }
      return { u, p, s: sp, h, total: p + sp + h };
    });
    rows.sort((a, b) => b.total - a.total);
    return rows;
  },

  renderDamage(container, data, state, handlers) {
    container.innerHTML = '';
    container.classList.toggle('wide', !!state.expanded);
    const expand = this.el('button', 'dmg-expand', state.expanded ? '>' : '<');
    expand.title = state.expanded ? '상대 딜량 숨기기' : '상대 딜량 보기';
    expand.addEventListener('click', handlers.toggleExpand);
    container.appendChild(expand);
    const head = this.el('div', 'dmg-head');
    const tabs = [['dealt', 'sword', '가한 피해'], ['taken', 'shield', '받은 피해'], ['heal', 'heart', '회복량']];
    const metric = tabs.find(t => t[0] === state.tab)[2];
    for (const [key, ico, label] of tabs) {
      const b = this.el('button', 'tab' + (state.tab === key ? ' on' : ''));
      b.innerHTML = iconSvg(ico, 12);
      b.dataset.tip = label;
      b.addEventListener('click', () => handlers.setTab(key));
      head.appendChild(b);
    }
    container.appendChild(head);
    const legend = this.el('div', 'dmg-legend');
    if (state.tab === 'heal') legend.innerHTML = '<span><i style="background:var(--good)"></i>회복</span>';
    else legend.innerHTML = '<span><i style="background:var(--phys)"></i>물리</span><span><i style="background:var(--spec)"></i>특수</span>';
    if (!data) {
      container.appendChild(this.el('div', 'dmg-empty', '아직 전투 기록이 없습니다'));
      return;
    }
    const cols = this.el('div', 'dmg-cols');
    const groups = state.expanded ? [data.opp, data.mine] : [data.mine];
    const allRows = groups.map(g => this.damageRows(g.units, state.tab));
    let max = 1;
    for (const rows of allRows) for (const r of rows) max = Math.max(max, r.total);
    groups.forEach((g, gi) => {
      const col = this.el('div', 'dmg-col');
      const title = this.el('div', 'dmg-col-title', g.title);
      title.appendChild(this.el('small', null, metric));
      col.appendChild(title);
      for (const r of allRows[gi]) {
        const row = this.el('div', 'dmg-row');
        const face = this.el('div', 'dmg-face' + (r.u.alive ? '' : ' dead'));
        const form = r.u.form;
        const spr = form ? Sprites.portrait(form, 26, { fill: 0.9, max: 1.5 }) : null;
        if (spr) {
          face.classList.add('has-spr');
          face.appendChild(spr);
        } else face.style.background = this.orbBackground(r.u.types);
        face.appendChild(this.el('small', null, '★'.repeat(r.u.star)));
        const wrap = this.el('div', 'dmg-bar-wrap');
        const num = this.el('div', 'dmg-num', Math.round(r.total));
        row.dataset.tip = r.u.name;
        const bar = this.el('div', 'dmg-bar');
        if (state.tab === 'heal') {
          const h = this.el('i', 'h');
          h.style.width = (r.h / max) * 100 + '%';
          bar.appendChild(h);
        } else {
          const p = this.el('i', 'p');
          p.style.width = (r.p / max) * 100 + '%';
          const sp = this.el('i', 's');
          sp.style.width = (r.s / max) * 100 + '%';
          bar.appendChild(p);
          bar.appendChild(sp);
        }
        wrap.appendChild(num);
        wrap.appendChild(bar);
        row.appendChild(face);
        row.appendChild(wrap);
        row.addEventListener('click', () => handlers.select(r.u));
        col.appendChild(row);
      }
      if (!allRows[gi].length) col.appendChild(this.el('div', 'dmg-empty', '기물 없음'));
      cols.appendChild(col);
    });
    container.appendChild(cols);
    container.appendChild(legend);
  }
};
