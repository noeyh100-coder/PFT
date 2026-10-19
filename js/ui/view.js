const CLASS_COLORS = {
  '최면술사': '#c77dff', '난동꾼': '#ff7b54', '감시자': '#5ec4b6', '타격대': '#e05252', '파수꾼': '#7f9cf5',
  '매복자': '#6b8f71', '주문술사': '#5fa8ff', '선도자': '#f2e394', '도전자': '#ff9f43',
  '학살자': '#b0413e', '화석': '#a68a64', '약탈자': '#8e5bb5', '전쟁기계': '#8d99ae'
};

const ROUND_ICON = { encounter: 'encounter', pve: 'ball', pvp: 'sword', carousel: 'sushi' };
const HOVER_COLORS = { 1: '#f2f2f2', 2: '#86ffa2', 3: '#8fd0ff', 4: '#eaa8ff', 5: '#ffe486', 6: '#a99bff' };
const TIER_COLORS = ['#101014', '#d08a4c', '#e4e9f2', '#ffd75a'];

const View = {
  planned: new Set(),
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

  traitKind(id) {
    const td = TRAIT_DATA.map[id];
    if (td) return td.kind;
    return TYPE_COLORS[id] ? 'type' : 'class';
  },

  tierLook(id, entry) {
    if (!entry) return 'base';
    if (!entry.active || !entry.tier) return 'off';
    const td = TRAIT_DATA.map[id];
    const total = td && td.stepLabels ? td.stepLabels.length : (entry.tiers || [1]).length;
    const t = entry.tier;
    if (total <= 1) return 'gold';
    if (total === 2) return t >= 2 ? 'gold' : 'bronze';
    if (total === 3) return ['bronze', 'silver', 'gold'][Math.min(t, 3) - 1];
    if (t >= total) return 'prism';
    return ['bronze', 'silver', 'gold'][Math.min(t, 3) - 1];
  },

  uniqueForm(id) {
    this.uniqueForms = this.uniqueForms || {};
    if (id in this.uniqueForms) return this.uniqueForms[id];
    let form = null;
    for (const key in UNITS) {
      const def = UNITS[key];
      if (def.uniques && def.uniques.includes(id)) {
        form = formOf(def, Math.max(1, def.uniqueStar || 1), null);
        break;
      }
    }
    this.uniqueForms[id] = form;
    return form;
  },

  traitIconSvg(id, scale) {
    this.iconCache = this.iconCache || {};
    const key = id + '|' + scale;
    if (this.iconCache[key]) return this.iconCache[key];
    const g = TRAIT_ICONS[id];
    const w = g[0].length;
    const h = g.length;
    let full = '';
    let half = '';
    g.forEach((row, y) => {
      let x = 0;
      while (x < w) {
        const ch = row[x];
        let n = 1;
        while (x + n < w && row[x + n] === ch) n++;
        const d = 'M' + x + ' ' + y + 'h' + n + 'v1h-' + n + 'z';
        if (ch === '#') full += d;
        else if (ch === '+') half += d;
        x += n;
      }
    });
    const crisp = scale % 1 === 0;
    const svg = '<svg class="hex-ico" width="' + w * scale + '" height="' + h * scale + '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="' + (crisp ? 'crispEdges' : 'geometricPrecision') + '">' +
      (half ? '<path d="' + half + '" fill="currentColor" fill-opacity="0.5"/>' : '') +
      '<path d="' + full + '" fill="currentColor"/></svg>';
    this.iconCache[key] = svg;
    return svg;
  },

  hex(id, entry, mini) {
    const kind = this.traitKind(id);
    const h = this.el('div', 'hex k-' + kind + ' t-' + this.tierLook(id, entry));
    if (kind === 'type' && TYPE_COLORS[id]) h.style.setProperty('--type-color', TYPE_COLORS[id]);
    if (kind === 'unique') {
      const form = this.uniqueForm(id);
      const size = mini ? 16 : 30;
      const spr = form ? Sprites.portrait(form, size, { fill: 0.95 }) : null;
      if (spr) {
        const box = this.el('div', 'hex-face');
        box.style.width = size + 'px';
        box.style.height = size + 'px';
        box.appendChild(spr);
        h.appendChild(box);
      } else h.appendChild(this.el('span', 'hex-txt', id.slice(0, 2)));
    } else if (typeof TRAIT_ICONS !== 'undefined' && TRAIT_ICONS[id]) {
      h.insertAdjacentHTML('beforeend', this.traitIconSvg(id, mini ? 0.5 : 1));
    } else {
      h.appendChild(this.el('span', 'hex-txt', id.slice(0, 2)));
    }
    return h;
  },

  miniTrait(id) {
    const row = this.el('div', 'mini-trait');
    row.appendChild(this.hex(id, null, true));
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
    el.classList.add('s' + Math.min(3, opts.star || 1));
    el.style.setProperty('--hover-col', HOVER_COLORS[opts.cost] || HOVER_COLORS[1]);
    if (opts.cost >= 6) el.classList.add('c6');
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
    if (opts.items && opts.items.length) {
      const row = this.el('div', 'unit-items');
      for (const id of opts.items) row.appendChild(this.itemIcon(id, 16));
      el.appendChild(row);
      el.classList.add('has-items');
    }
    return el;
  },

  itemStack(u, id, time) {
    if (id === 'booster-energy') return u.boostStacks || 0;
    if (id === 'soul-dew') return u.dewPct || 0;
    if (id === 'choice-scarf') return u.scarfPct || 0;
    if (id === 'assault-vest') return u.vestRanks || 0;
    if (id === 'metronome') return u.metroTarget != null ? 30 * u.it.metronome * Math.floor((time - u.metroSince) / 3) : 0;
    if (id === 'absorb-bulb') return u.bulbPct || 0;
    if (/^griseous-orb-/.test(id)) return u.grisStacks || 0;
    if (id === 'red-orb-3') return u.redAs || 0;
    if (/^blue-orb-/.test(id)) return u.blueSa || 0;
    return null;
  },

  itemIcon(id, size) {
    const d = itemDef(id);
    const el = this.el('div', 'item-ico' + (d ? ' k-' + d.kind : ''));
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    if (d && d.kind === 'treasure') {
      el.classList.add('tier' + d.tier);
      el.style.setProperty('--tier-col', TIER_COLORS[d.tier]);
    }
    if (d && d.glyph) {
      el.classList.add('glyph');
      el.textContent = d.glyph;
      el.style.fontSize = Math.max(8, Math.round(size * 0.62)) + 'px';
      el.style.lineHeight = size + 'px';
    } else {
      el.style.backgroundImage = 'url("img/item/' + itemIconName(id) + '.png")';
    }
    return el;
  },

  itemKindLabel(d) {
    if (!d) return '';
    if (d.kind === 'component') return '조합 아이템';
    if (d.kind === 'completed') return d.unique ? '완성 아이템 · 고유' : '완성 아이템';
    if (d.kind === 'treasure') return '채굴 보물 · ' + TREASURE_TIER_NAME[d.tier];
    if (d.box) return '아이템 상자';
    if (d.label) return '소모품 · ' + d.label;
    return '소모품';
  },

  renderItemTip(box, id, mode, hooks) {
    box.innerHTML = '';
    const d = itemDef(id);
    if (!d) return;
    const h = hooks || {};
    const icon = (x, size) => {
      const el = this.itemIcon(x, size);
      if (h.pick) {
        el.classList.add('pick');
        el.dataset.pick = x;
      }
      return el;
    };
    const head = this.el('div', 'it-head');
    head.appendChild(this.itemIcon(id, 40));
    const titles = this.el('div', 'it-titles');
    titles.appendChild(this.el('b', 'it-name', d.name));
    titles.appendChild(this.el('div', 'it-kind' + (d.kind === 'treasure' ? ' tier' + d.tier : ''), this.itemKindLabel(d)));
    const st = itemStatText(id);
    if (st) titles.appendChild(this.el('div', 'it-stat', st));
    head.appendChild(titles);
    box.appendChild(head);
    if (d.kind === 'component' && mode === 'recipe') {
      const list = this.el('div', 'it-recipe');
      for (const other of ITEMS.components) {
        const out = combineItems(id, other);
        if (!out) continue;
        const row = this.el('div', 'it-row');
        row.appendChild(this.el('span', 'it-op', '+'));
        row.appendChild(icon(other, 24));
        row.appendChild(this.el('span', 'it-op', '>'));
        row.appendChild(icon(out, 24));
        row.appendChild(this.el('span', 'it-rname', itemDef(out).name));
        list.appendChild(row);
      }
      box.appendChild(list);
      if (!h.preview) box.appendChild(this.el('div', 'it-hint', '오른쪽 클릭으로 돌아가기'));
      return;
    }
    if (d.kind === 'component') {
      box.appendChild(this.el('div', 'it-desc', st || ''));
      if (!h.preview) box.appendChild(this.el('div', 'it-hint', '오른쪽 클릭으로 조합표 확인'));
      return;
    }
    if (d.desc) box.appendChild(this.el('div', 'it-desc', d.desc));
    if (d.kind === 'completed') {
      const from = this.el('div', 'it-from');
      from.appendChild(icon(d.from[0], 26));
      from.appendChild(this.el('span', 'it-op', '+'));
      from.appendChild(icon(d.from[1], 26));
      box.appendChild(from);
    }
  },

  augIcon(id, size) {
    const d = augDef(id);
    const el = this.el('div', 'aug-ico t' + (d ? d.tier : 1));
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    const img = this.el('i');
    if (d) img.style.backgroundImage = 'url("img/aug/' + d.icon + '.png")';
    el.appendChild(img);
    return el;
  },

  renderAugPick(box, offer, hooks) {
    box.innerHTML = '';
    box.className = 'show t' + offer.tier;
    const title = this.el('div', 'augp-title');
    title.appendChild(this.el('small', null, AUG_TIER_NAME[offer.tier] + ' 증강'));
    title.appendChild(this.el('b', null, '증강 선택'));
    title.appendChild(this.el('span', 'augp-timer', ''));
    box.appendChild(title);
    const row = this.el('div', 'augp-row');
    offer.choices.forEach((c, n) => {
      const d = augDef(c.id);
      const col = this.el('div', 'augp-col');
      const card = this.el('button', 'augc t' + offer.tier);
      const medal = this.el('div', 'augc-medal');
      medal.appendChild(this.el('div', 'augc-teeth'));
      medal.appendChild(this.el('div', 'augc-ring'));
      const core = this.el('div', 'augc-core');
      const ico = this.el('i');
      if (d) ico.style.backgroundImage = 'url("img/aug/' + d.icon + '.png")';
      core.appendChild(ico);
      medal.appendChild(core);
      medal.appendChild(this.el('span', 'augc-gem'));
      card.appendChild(medal);
      const body = this.el('div', 'augc-body');
      body.appendChild(this.el('div', 'augc-name', augLabel(c)));
      body.appendChild(this.el('div', 'augc-sep'));
      body.appendChild(this.el('div', 'augc-desc', augText(c)));
      card.appendChild(body);
      card.addEventListener('click', () => hooks.pick(n));
      col.appendChild(card);
      const used = !!(offer.rerolls && offer.rerolls[n]);
      const rr = this.el('button', 'augc-reroll' + (used ? ' used' : ''));
      rr.innerHTML = iconSvg('refresh', 16) + '<span>' + (used ? 0 : 1) + '</span>';
      rr.disabled = used;
      rr.dataset.tip = used ? '이미 새로고침했습니다' : '이 증강 새로고침 (1회)';
      rr.addEventListener('click', () => hooks.reroll(n));
      col.appendChild(rr);
      row.appendChild(col);
    });
    box.appendChild(row);
  },

  renderBoxPick(box, b, pick) {
    box.innerHTML = '';
    const d = itemDef(b.id);
    const head = this.el('div', 'box-head');
    head.appendChild(this.itemIcon(b.id, 24));
    head.appendChild(this.el('b', null, d ? d.name : '아이템 상자'));
    head.appendChild(this.el('span', 'box-timer', ''));
    box.appendChild(head);
    box.appendChild(this.el('div', 'box-sub', '아이템 하나를 고르세요'));
    const row = this.el('div', 'box-row');
    if (b.choices.length > 4) row.classList.add('six');
    b.choices.forEach((id, n) => {
      const it = itemDef(id);
      const card = this.el('button', 'box-card');
      const ico = this.itemIcon(id, 40);
      ico.dataset.item = id;
      card.appendChild(ico);
      card.appendChild(this.el('div', 'box-name', it ? it.name : id));
      const st = itemStatText(id);
      if (st) card.appendChild(this.el('div', 'box-stat', st));
      card.addEventListener('click', () => pick(n));
      row.appendChild(card);
    });
    box.appendChild(row);
  },

  renderMine(box, game, p, hooks) {
    box.innerHTML = '';
    const offer = p.mineOffer;
    if (!offer) return;
    const head = this.el('div', 'mine-head');
    head.appendChild(this.el('b', null, '채굴장'));
    head.appendChild(this.el('span', 'mine-cost', '채굴 스택 ' + Math.floor(p.mine) + ' · 받으면 -' + offer.th));
    box.appendChild(head);
    const row = this.el('div', 'mine-rewards');
    for (const e of offer.list) {
      const cell = this.el('div', 'mine-cell');
      const pic = this.el('div', 'mine-pic');
      let label = '';
      if (e.k === 'item') {
        const ico = this.itemIcon(e.id, 44);
        pic.appendChild(ico);
        pic.dataset.item = e.id;
        label = itemDef(e.id).name;
      } else if (e.k === 'gold') {
        pic.classList.add('gold');
        pic.innerHTML = iconSvg('coin', 34);
        label = e.n + '골드';
      } else {
        const def = UNITS[e.id];
        const form = formOf(def, e.star, p);
        paintCost(pic, def.cost);
        pic.classList.add('unit-pic');
        const spr = Sprites.portrait(form, 44, { fill: 0.9, max: 2 });
        if (spr) pic.appendChild(spr);
        pic.dataset.unit = def.id;
        pic.dataset.form = form.name;
        label = (e.star > 1 ? e.star + '성 ' : '') + form.name;
      }
      cell.appendChild(pic);
      cell.appendChild(this.el('div', 'mine-label', label));
      row.appendChild(cell);
    }
    box.appendChild(row);
    const actions = this.el('div', 'mine-actions');
    const take = this.el('button', 'mine-take');
    take.innerHTML = iconSvg('check', 16);
    take.appendChild(this.el('span', null, '모두 받기'));
    take.addEventListener('click', () => hooks.take());
    const skip = this.el('button', 'mine-skip', '받지 않기');
    skip.addEventListener('click', () => hooks.skip());
    actions.appendChild(take);
    actions.appendChild(skip);
    box.appendChild(actions);
  },

  itemPreview(stats, items, evolvable) {
    const out = Object.assign({}, stats);
    const list = (items || []).filter(id => id !== 'magnet' && itemDef(id));
    if (!list.length) return out;
    const n = id => list.filter(x => x === id).length;
    const rk = { atk: 0, spa: 0, def: 0, spd: 0, spe: 0, crit: 0 };
    let hp = 0;
    let pp = 0;
    for (const id of list) {
      const st = itemDef(id).stats || {};
      for (const k in rk) rk[k] += st[k] || 0;
      hp += st.hp || 0;
      pp += st.pp || 0;
    }
    const evo = evolvable && n('eviolite') ? 1.2 : 1;
    const mult = k => rankMult(Math.max(-6, Math.min(6, k)));
    out.hp = Math.round(stats.hp * evo * (1 + 0.2 * n('big-root')) + hp);
    out.pa = Math.round(stats.pa * evo * (1 + 0.3 * n('choice-band')) * mult(rk.atk));
    out.sa = Math.round(stats.sa * evo * (1 + 0.25 * n('choice-specs')) * mult(rk.spa));
    out.armor = Math.round(stats.armor * evo * mult(rk.def));
    out.mr = Math.round(stats.mr * evo * mult(rk.spd));
    out.as = Math.round(stats.as * mult(rk.spe) * 100) / 100;
    out.basic = out.special ? out.sa : out.pa;
    const table = CONFIG.combat.critTable;
    out.crit = table[Math.max(0, Math.min(table.length - 1, rk.crit))];
    out.omnivamp = (stats.omnivamp || 0) + 0.4 * n('shell-bell');
    out.range = stats.range + n('zoom-lens');
    out.startMana = Math.min(stats.maxMana, (stats.startMana || 0) + pp);
    return out;
  },

  unitBars(el, maxHp) {
    const bars = this.el('div', 'bars');
    const hp = this.el('div', 'bar hp');
    const hpFill = this.el('i');
    const shFill = this.el('i', 'sh');
    const tk = this.el('b', 'tk');
    hp.appendChild(hpFill);
    hp.appendChild(shFill);
    hp.appendChild(tk);
    const mana = this.el('div', 'bar mana');
    const manaFill = this.el('i');
    mana.appendChild(manaFill);
    bars.appendChild(hp);
    bars.appendChild(mana);
    el.appendChild(bars);
    hpFill.style.width = '100%';
    manaFill.style.width = '0%';
    const out = { bars, hpFill, shFill, manaFill, tk, tkTotal: 0 };
    this.setTicks(out, maxHp);
    return out;
  },

  setTicks(b, total) {
    const t = Math.max(1, Math.round(total));
    if (b.tkTotal === t) return;
    b.tkTotal = t;
    b.tk.style.setProperty('--tk', Math.min(100, (100 / t) * 100) + '%');
    b.tk.style.setProperty('--tk2', Math.min(100, (1000 / t) * 100) + '%');
  },

  instanceView(inst, owner) {
    const def = UNITS[inst.unitId];
    const form = formOf(def, inst.star, owner, inst);
    return { name: form.name, form, types: form.types, star: inst.star, cost: def.cost, badge: this.badgeFor(def), items: inst.items || [] };
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

  renderItems(container, owner, page, hooks) {
    container.innerHTML = '';
    const raw = (owner && owner.items) || [];
    const list = [];
    const groups = {};
    raw.forEach((id, idx) => {
      if (isConsumable(id)) {
        if (groups[id]) {
          groups[id].count++;
          return;
        }
        groups[id] = { id, idx, count: 1 };
        list.push(groups[id]);
        return;
      }
      list.push({ id, idx, count: 1 });
    });
    const per = 10;
    const pages = Math.max(1, Math.ceil(list.length / per));
    const pg = Math.min(page || 0, pages - 1);
    for (let i = 0; i < per; i++) {
      const entry = list[pg * per + i];
      const slot = this.el('div', 'item-slot');
      if (entry) {
        slot.appendChild(this.itemIcon(entry.id, 33));
        if (entry.count > 1) slot.appendChild(this.el('div', 'item-count', entry.count));
        slot.dataset.item = entry.id;
        slot.dataset.idx = entry.idx;
        slot.classList.add('filled');
        if (hooks && hooks.down) slot.addEventListener('pointerdown', e => hooks.down(e, entry.idx, slot));
      }
      container.appendChild(slot);
    }
    if (pages > 1) {
      const rest = list.length - Math.min(per, list.length - pg * per);
      const more = this.el('button', 'item-more', '+' + rest);
      more.dataset.tip = (pg + 1) + ' / ' + pages + ' 페이지';
      more.addEventListener('click', () => hooks && hooks.more && hooks.more((pg + 1) % pages));
      container.appendChild(more);
    }
    return pg;
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
      row.appendChild(this.hex(t.id, t));
      row.appendChild(this.el('div', 'trait-count', t.count));
      const text = this.el('div', 'trait-text');
      const name = this.el('div', 'trait-name', t.id);
      if (t.id === '땅' && owner && (owner.mine || t.active)) name.appendChild(this.el('span', 'mine-stack', '채굴 ' + Math.floor(owner.mine || 0)));
      if (t.id === '에스퍼' && owner && owner.espVariant) name.appendChild(this.el('span', 'esp-var', owner.espVariant));
      if (t.bonus) name.appendChild(this.el('span', 'ditto-bonus', '+' + t.bonus));
      text.appendChild(name);
      const steps = this.el('div', 'trait-steps');
      const td = TRAIT_DATA.map[t.id];
      if (t.kind === 'unique') {
        const st = hooks && hooks.stack ? hooks.stack(t.id) : '';
        if (st) steps.appendChild(this.el('span', 'stack', st));
      } else if (td && td.mode === 'bug') {
        if (t.active) {
          steps.appendChild(this.el('span', t.tier === 1 ? 'cur' : 'got', 3));
          steps.appendChild(this.el('i', null, '›'));
          steps.appendChild(this.el('span', t.tier > 1 ? 'cur' : null, '3성 ' + (t.star3 || 0) + '/5'));
        } else steps.textContent = t.count + ' / 3';
      } else if (t.active && t.tiers.length > 1) {
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
    if (id === '땅') lines.push('채굴 스택: ' + Math.floor(owner.mine || 0));
    if (id === '물') lines.push(entry && entry.pairCosts.length ? '짝을 이룬 가격: ' + entry.pairCosts.map(c => c + '코').join(', ') : '짝을 이룬 가격이 없습니다');
    if (id === '벌레') lines.push('필드의 3성 벌레: ' + (entry ? entry.count : 0) + '마리');
    if (entry && entry.bonus) lines.push('조우자 메타몽: 기물 수 +' + entry.bonus);
    return lines;
  },

  traitPortrait(m, id, owner) {
    const on = memberActive(owner, m, id);
    const el = this.el('div', 'tt-unit' + (on ? ' on' : ''));
    paintCost(el, m.cost);
    const card = Assets.cardUrl(m.form);
    const spr = Assets.ready(card) ? null : Sprites.portrait(m.form, 48, { fill: 0.85, max: 2 });
    if (Assets.ready(card)) {
      const pic = this.el('div', 'tt-art');
      pic.style.backgroundImage = 'url("' + card + '")';
      el.classList.add('art');
      el.appendChild(pic);
    } else if (spr) {
      el.classList.add('dot');
      el.appendChild(spr);
    } else {
      el.style.background = this.orbBackground(m.form.types);
      el.appendChild(this.el('span', null, m.form.name.slice(0, 2)));
    }
    el.dataset.unit = m.unitId;
    el.dataset.form = m.form.name;
    if (m.note) el.dataset.note = m.note;
    return el;
  },

  unlockHow(id) {
    const u = CONFIG.unlock;
    const m = {
      '투구': '암나이트 2성 이상을 필드에 두고 연속 ' + u.kabutoWins + '번 승리',
      '프테라': '투구 2성 이상을 필드에 두고 연속 ' + u.aerodactylLosses + '번 패배',
      '신뇽': '미뇽 2성 이상으로 ' + u.dratiniWins + '번 승리하면 진화',
      '망나뇽': '신뇽 2성 이상으로 ' + u.dragonairWins + '번 승리하면 진화',
      '야도란': '야돈 뒤 칸에 셀러를 두고 전투 시작 (셀러를 소모하고, 둘 중 낮은 별로 진화)',
      '야도킹': '야돈 앞 칸에 셀러를 두고 전투 시작 (셀러를 소모하고, 둘 중 낮은 별로 진화)',
      '저승갓숭': '성원숭(망키 2성 이상)이 PvP 전투에서 쓰러지면 진화',
      '갸라도스': '잉어킹 3성으로 전투에 ' + u.magikarpBattles + '번 참여하면 진화',
      '해피너스': '치유 스택 ' + u.healStack + ' 이상에서 럭키가 전투에 참여하면 진화 (럭키 3성이면 스택 2배)',
      '팬텀': '고우스트(고오스 2성 이상)로 처치 관여 ' + u.gastlyTakedowns + '번이면 진화',
      '후딘': '윤겔라가 스킬로 적을 재운 시간 합계 ' + u.hypnosisSeconds + '초를 채운 뒤 윤겔라가 전투에 참여하면 진화',
      '뮤': '한 전투에서 서로 다른 타입 시너지 ' + u.mewTypes + '개 켜기',
      '뮤츠': '뮤가 참여한 PvP 전투로 유전자 ' + u.geneStack + ' 모으기',
      '프리져': '필드의 얼음 타입 포켓몬 별 합계 ' + u.iceStarTotal + ' 이상으로 전투 시작',
      '썬더': '전기 시너지 낙뢰를 적에게 누적 ' + u.electricBolts + '번 맞히기',
      '파이어': '불꽃 시너지 화염 피해 누적 ' + u.burnDamage
    };
    return m[id] || '특별한 조건으로 해금됩니다';
  },

  renderUnitTip(container, unitId, formName, note, owner) {
    container.innerHTML = '';
    const def = UNITS[unitId];
    if (!def) return;
    const base = def.stageForms ? def.stageForms[0] : def.forms[0];
    const form = formName && FORM_INDEX[formName] ? FORM_INDEX[formName] : base;
    const br = def.branches ? def.branches.find(b => b.form.name === form.name) : null;
    const head = this.el('div', 'ut-head');
    const pic = this.el('div', 'ut-pic');
    paintCost(pic, def.cost);
    const spr = Sprites.portrait(form, 40, { fill: 0.9, max: 2 });
    if (spr) pic.appendChild(spr);
    head.appendChild(pic);
    const info = this.el('div', 'ut-info');
    info.appendChild(this.el('b', null, form.name + (form.name !== def.id ? ' (' + def.id + ' 계열)' : '')));
    const sub = this.el('div', 'ut-sub');
    sub.innerHTML = iconSvg('coin', 11);
    sub.appendChild(document.createTextNode(def.cost + '코스트'));
    if (def.unlockOnly) {
      const open = owner && owner.unlockedShop && owner.unlockedShop.has(def.id);
      const chip = this.el('span', 'ut-chip' + (open ? ' open' : ''));
      chip.innerHTML = iconSvg(open ? 'unlock' : 'lock', 11);
      chip.appendChild(document.createTextNode(open ? '해금됨' : '잠김'));
      sub.appendChild(chip);
    }
    if (note) sub.appendChild(this.el('span', 'ut-note', note));
    info.appendChild(sub);
    head.appendChild(info);
    container.appendChild(head);
    const role = this.el('div', 'ut-row');
    role.innerHTML = iconSvg('role', 12);
    role.appendChild(this.el('span', 'ut-k', '역할군'));
    role.appendChild(this.el('span', null, form.role || roleOf(form, computeStats(form, def.cost, 1, 1))));
    container.appendChild(role);
    const tr = [];
    for (const x of form.types.concat(br && br.traits ? br.traits : def.traits, def.uniques)) if (!tr.includes(x)) tr.push(x);
    const traits = this.el('div', 'ut-traits');
    for (const t of tr) {
      const mt = this.miniTrait(t);
      if (def.uniqueStar && def.uniques.includes(t)) mt.appendChild(this.el('small', null, def.uniqueStar + '성부터'));
      traits.appendChild(mt);
    }
    container.appendChild(traits);
    if (NORMAL_EFFECTS[def.id] && form.types.includes('노말')) container.appendChild(this.el('div', 'ut-line', '노말 효과: ' + NORMAL_EFFECTS[def.id].text));
    const evo = this.el('div', 'ut-evo');
    this.renderEvo(evo, def, owner, { size: 26 });
    container.appendChild(evo);
    const g = typeof app !== 'undefined' && app && app.game ? app.game : null;
    if (g && g.pool && g.pool.max[def.id] != null) {
      const stock = this.el('div', 'ut-row');
      stock.innerHTML = iconSvg('ball', 12);
      stock.appendChild(this.el('span', 'ut-k', '창고'));
      stock.appendChild(this.el('span', null, '남은 수 ' + g.pool.remaining(def.id) + '/' + g.pool.max[def.id]));
      container.appendChild(stock);
    }
    if (def.unlockOnly) {
      const how = this.el('div', 'ut-unlock');
      how.appendChild(this.el('span', 'ut-k', '해금 조건'));
      how.appendChild(this.el('span', null, this.unlockHow(def.id)));
      container.appendChild(how);
    }
  },

  renderTraitTip(container, id, owner, region) {
    container.innerHTML = '';
    const td = TRAIT_DATA.map[id];
    if (!td) return;
    const entry = owner ? computeSynergies(owner).find(s => s.id === id) : null;
    const tier = entry ? entry.tier : 0;
    const head = this.el('div', 'tt-head');
    head.appendChild(this.hex(id, entry || { active: false }));
    const esp = id === '에스퍼' ? (owner && owner.espVariant) || null : null;
    const vd = esp ? ESPER_VARIANTS[esp] : null;
    head.appendChild(this.el('b', null, esp ? id + ' · ' + esp : id));
    head.appendChild(this.el('span', 'tt-kind', td.kind === 'type' ? '타입' : td.kind === 'class' ? '직업' : '고유'));
    container.appendChild(head);
    container.appendChild(this.el('div', 'tt-desc', vd ? '에스퍼의 효과는 게임마다 바뀝니다. 이번 게임: ' + esp + '. ' + vd.desc : td.desc));
    for (const line of this.traitExtra(id, owner, entry)) container.appendChild(this.el('div', 'tt-extra', line));
    if (id === '에스퍼' && !vd) {
      const list = this.el('div', 'tt-steps');
      for (const k of ESPER_KEYS) {
        const row = this.el('div', 'tt-step');
        row.appendChild(this.el('span', 'tt-n', k));
        row.appendChild(this.el('span', null, ESPER_VARIANTS[k].desc));
        list.appendChild(row);
      }
      container.appendChild(list);
    } else {
      const stepText = vd ? vd.steps : td.steps;
      const steps = this.el('div', 'tt-steps');
      (td.stepLabels || td.tiers).forEach((n, i) => {
        const row = this.el('div', 'tt-step' + (i + 1 === tier ? ' on' : i + 1 < tier ? ' got' : ''));
        const label = td.stepLabels ? n : td.countLabel === '짝' ? n + '짝' : td.countLabel === '가격 종류' ? n + '종류' : n;
        row.appendChild(this.el('span', 'tt-n', '(' + label + ')'));
        row.appendChild(this.el('span', null, stepText[i] || ''));
        steps.appendChild(row);
      });
      container.appendChild(steps);
    }
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
      if (p === human) cls += ' me';
      if (human && human.alive && human.currentOpponent === p.id && p !== human) cls += ' vs';
      if (p.id === viewId) cls += ' viewing';
      if (!p.alive) cls += ' dead';
      if (shownHp(p) <= 30) cls += ' low';
      const row = this.el('div', cls);
      const name = this.el('div', 'pname', p.alive ? p.name : p.name + ' · ' + p.placement + '등');
      const por = this.portrait(p.strategist, p === human ? 36 : 31);
      por.appendChild(this.el('div', 'hp', p.alive ? shownHp(p) : '✕'));
      if (human && human.alive && human.currentOpponent === p.id && p !== human) {
        const sw = this.el('div', 'vs-sword');
        sw.innerHTML = iconSvg('sword', 14);
        sw.dataset.tip = human.currentGhost ? '다음 상대 (복제)' : '다음 상대';
        por.appendChild(sw);
      }
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
    paintCost(card, def.cost);
    Assets.setCardArt(card, form, 90, true);
    if (card._spr) {
      card.addEventListener('mouseenter', () => Sprites.hoverPlay(card._spr, true));
      card.addEventListener('mouseleave', () => Sprites.hoverPlay(card._spr, false));
    }
    const traits = this.el('div', 'card-traits');
    for (const t of allTraitsOf(def, 1, p)) traits.appendChild(this.miniTrait(t));
    card.appendChild(traits);
    if (game.pool) card.dataset.tip = '창고에 남은 수 ' + game.pool.remaining(id) + '/' + game.pool.max[id];
    const mine = p.allUnits().filter(u => u.unitId === id);
    const n1 = mine.filter(u => u.star === 1).length;
    const n2 = mine.filter(u => u.star === 2).length;
    const up = n1 >= 2 ? (n2 >= 2 ? 3 : 2) : 0;
    if (up || this.planned.has(id)) {
      const corner = this.el('div', 'card-corner');
      if (this.planned.has(id)) {
        const ball = this.el('div', 'card-plan');
        ball.innerHTML = iconSvg('ball', 14);
        ball.dataset.tip = '배치 도구에서 켠 팀의 기물';
        corner.appendChild(ball);
      }
      if (up) corner.appendChild(this.el('div', 'card-badge s' + up, '★'.repeat(up)));
      card.appendChild(corner);
    }
    if (up || mine.length) {
      card.classList.add('glint', up === 3 ? 'glint-gold' : up === 2 ? 'glint-silver' : 'glint-white');
      const fx = this.el('div', 'card-glint');
      for (let i = 0; i < 6; i++) {
        const sp = this.el('i');
        sp.style.left = (12 + ((i * 37) % 80)) + '%';
        sp.style.top = (10 + ((i * 53) % 70)) + '%';
        sp.style.animationDelay = (i * 0.37).toFixed(2) + 's';
        fx.appendChild(sp);
      }
      card.appendChild(fx);
    }
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
    paintCost(card, def.cost);
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
    const form = formOf(def, inst.star, owner, inst);
    const raw = instanceStats(inst, owner);
    const items = inst.items || [];
    const stats = this.itemPreview(raw, items, canEvolveFurther(inst, owner));
    const base = computeStats(form, def.cost, inst.star, def.unlockOnly ? UNLOCK_STAT_BONUS : 1, { boost: def.boost });
    return { form, star: inst.star, cost: def.cost, sell: sellValue(def, inst.star), def, traits: allTraitsOf(def, inst.star, owner, inst), stats, base, hp: stats.hp, maxHp: stats.hp, mana: stats.startMana || 0, maxMana: stats.maxMana, inst, owner, items };
  },

  infoFromCombat(cu) {
    const form = cu.form || FORM_INDEX[cu.name];
    const def = cu.unitId ? UNITS[cu.unitId] : null;
    const stats = cu.eff ? Object.assign({}, cu.stats, cu.eff) : cu.stats;
    const base = def && !cu.ditto ? computeStats(form, def.cost, cu.star, def.unlockOnly ? UNLOCK_STAT_BONUS : 1, { boost: def.boost }) : cu.stats;
    const sell = def && cu.iid && !cu.ditto ? sellValue(def, cu.star) : cu.cost;
    return { form, star: cu.star, cost: cu.cost, sell, def, traits: cu.traits, stats, base, hp: cu.hp, maxHp: Math.round(cu.maxHp), shield: cu.shield, mana: cu.mana, maxMana: cu.maxMana, combat: cu, creep: cu.creep, items: cu.items || [] };
  },

  infoFromCreep(spec) {
    return { form: spec.form, star: spec.star, cost: spec.cost, def: null, traits: spec.form.types.slice(), stats: spec.stats, hp: spec.stats.hp, maxHp: spec.stats.hp, mana: 0, maxMana: spec.stats.maxMana, creep: true };
  },

  statParts(t) {
    const s = t.stats;
    const b = t.base || s;
    const pct = v => (v < 0.1 && v > 0 ? (v * 100).toFixed(1) : Math.round(v * 100)) + '%';
    return [
      ['pa', '물리공격력', s.pa, b.pa, v => Math.round(v)],
      ['sa', '특수공격력', s.sa, b.sa, v => Math.round(v)],
      ['armor', '물리방어력', s.armor, b.armor, v => Math.round(v)],
      ['mr', '특수방어력', s.mr, b.mr, v => Math.round(v)],
      ['as', '공격속도 (초당 기본 공격 횟수)', s.as, b.as, v => v.toFixed(2)],
      ['crit', '급소율', s.crit, b.crit, pct],
      ['vamp', '모든 피해 흡혈', s.omnivamp || 0, b.omnivamp || 0, pct],
      ['amp', '피해증폭', s.amp || 0, 0, pct],
      ['dura', '내구력 (받는 피해 감소)', s.dura || 0, 0, pct],
      ['basic', '기본공격 (' + (s.special ? '특수' : '물리') + ')', s.basic, b.basic, v => Math.round(v)]
    ];
  },

  renderInfo(container, t, hooks) {
    container.innerHTML = '';
    if (!t) return;
    const s = t.stats;
    hooks = hooks || {};
    container.appendChild(this.el('div', 'ip-stars s' + Math.min(3, t.star), '★'.repeat(t.star)));
    if (t.def && hooks.evo) {
      const evo = this.el('button', 'ip-evo');
      evo.innerHTML = iconSvg('evo', 16);
      evo.dataset.tip = '진화 계보';
      evo.addEventListener('click', e => {
        e.stopPropagation();
        hooks.evo(t, evo);
      });
      container.appendChild(evo);
    }
    const art = this.el('div', 'ip-art');
    if (t.creep) art.style.setProperty('--cost-color', '#b0b0b0');
    else paintCost(art, t.cost);
    Assets.setCardArt(art, t.form, 100);
    const traits = this.el('div', 'ip-traits');
    for (const id of t.traits) {
      const mt = this.miniTrait(id);
      if (hooks.traitEnter) {
        mt.addEventListener('mouseenter', () => hooks.traitEnter(mt, id, t));
        mt.addEventListener('mouseleave', () => hooks.traitLeave());
      }
      traits.appendChild(mt);
    }
    art.appendChild(traits);
    const name = this.el('div', 'ip-name');
    const nm = this.el('b', null, t.form.name);
    name.appendChild(nm);
    if (!t.creep) {
      const cost = this.el('div', 'ip-cost');
      cost.innerHTML = iconSvg('coin', 12);
      const price = t.sell != null ? t.sell : t.cost;
      cost.appendChild(document.createTextNode(price));
      cost.dataset.tip = '판매 가격 ' + price + '골드';
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
    if (st) skill.dataset.tip = st.name + ' (' + st.type + ')\n' + st.text + (hooks.skillNote ? hooks.skillNote(t) : '');
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
    const held = t.items || [];
    for (let i = 0; i < 3; i++) {
      const slot = this.el('div');
      if (held[i]) {
        slot.appendChild(this.itemIcon(held[i], 40));
        slot.dataset.item = held[i];
      }
      items.appendChild(slot);
    }
    container.appendChild(items);
    const role = this.el('div', 'ip-role');
    role.innerHTML = iconSvg('role', 12);
    role.appendChild(this.el('span', null, roleOf(t.form, s)));
    container.appendChild(role);
    const grid = this.el('div', 'ip-stats');
    for (const [ico, label, value, base, fmt] of this.statParts(t)) {
      const cell = this.el('div', 'ip-stat');
      const diff = value - base;
      const eps = ico === 'as' ? 0.005 : ico === 'crit' || ico === 'vamp' || ico === 'amp' || ico === 'dura' ? 0.0005 : 0.5;
      const up = diff > eps;
      const down = diff < -eps;
      let tip = label + ' ' + fmt(value);
      if (up) tip += ' (' + fmt(base) + ' + ⟦' + fmt(diff) + '⟧)';
      else if (down) tip += ' (' + fmt(base) + ' - ' + fmt(-diff) + ')';
      cell.dataset.tip = tip;
      cell.innerHTML = iconSvg(ico, 16);
      cell.appendChild(this.el('b', up ? 'up' : down ? 'down' : null, fmt(value)));
      grid.appendChild(cell);
    }
    container.appendChild(grid);
  },

  evoLinks() {
    const u = CONFIG.unlock;
    return [
      ['잉어킹', '갸라도스', '잉어킹 3성으로 전투 ' + u.magikarpBattles + '번 참여'],
      ['미뇽', '신뇽', '2성 이상으로 승리 ' + u.dratiniWins + '번'],
      ['신뇽', '망나뇽', '2성 이상으로 승리 ' + u.dragonairWins + '번'],
      ['고오스', '팬텀', '2성 이상으로 처치 관여 ' + u.gastlyTakedowns + '번'],
      ['캐이시', '후딘', '윤겔라가 재운 시간 ' + u.hypnosisSeconds + '초 + 윤겔라 전투 참여'],
      ['핑복', '해피너스', '치유 스택 ' + u.healStack + ' + 럭키 전투 참여'],
      ['망키', '저승갓숭', '2성 이상이 PvP 전투에서 쓰러짐'],
      ['야돈', '야도란', '야돈 뒤 칸에 셀러 (낮은 별로)'],
      ['야돈', '야도킹', '야돈 앞 칸에 셀러 (낮은 별로)'],
      ['암나이트', '투구', '해금: 2성으로 연속 승리 ' + u.kabutoWins + '번'],
      ['투구', '프테라', '해금: 2성으로 연속 패배 ' + u.aerodactylLosses + '번'],
      ['뮤', '뮤츠', '해금: 유전자 ' + u.geneStack]
    ];
  },

  renderEvo(container, def, owner, opts) {
    container.innerHTML = '';
    const pic = (opts && opts.size) || 34;
    const links = this.evoLinks();
    const chain = [def.id];
    for (let i = 0; i < chain.length; i++) {
      for (const [a, b] of links) {
        if (a === chain[i] && !chain.includes(b)) chain.push(b);
        if (b === chain[i] && !chain.includes(a)) chain.push(a);
      }
    }
    const order = [];
    const visit = id => {
      if (order.includes(id)) return;
      for (const [a, b] of links) if (b === id && chain.includes(a)) visit(a);
      order.push(id);
    };
    for (const id of chain) visit(id);
    container.appendChild(this.el('div', 'evo-title', '진화 계보'));
    let prevForm = null;
    const evoCell = (f, label, prev, cls) => {
      const cell = this.el('div', 'evo-form' + (cls ? ' ' + cls : ''));
      const box2 = this.el('div', 'evo-pic');
      const spr = Sprites.portrait(f, pic, { fill: 0.9, max: 2 });
      if (spr) box2.appendChild(spr);
      cell.appendChild(box2);
      cell.appendChild(this.el('div', null, f.name));
      if (label) cell.appendChild(this.el('small', null, label));
      const st = typeof SKILL_TEXT !== 'undefined' ? SKILL_TEXT[f.name] : null;
      const skill = (st && st.name) || f.skill || '';
      const types = this.el('div', 'evo-types' + (prev && prev.types.join() !== f.types.join() ? ' chg' : ''));
      for (const t of f.types) types.appendChild(this.hex(t, null, true));
      cell.appendChild(types);
      if (skill) {
        const sk = this.el('div', 'evo-skill' + (prev && ((SKILL_TEXT[prev.name] && SKILL_TEXT[prev.name].name) || prev.skill) !== skill ? ' chg' : ''), skill);
        if (st && st.text) sk.dataset.tip = skill + (st.type ? ' (' + st.type + ')' : '') + '\n' + st.text.replace(/\[|\]/g, '');
        cell.appendChild(sk);
      }
      return cell;
    };
    order.forEach((id, idx) => {
      const d = UNITS[id];
      if (!d) return;
      if (idx) {
        const via = links.filter(([a, b]) => b === id && order.includes(a));
        for (const [a, , text] of via) container.appendChild(this.el('div', 'evo-link', '↓ ' + (a !== order[idx - 1] ? a + ' → ' : '') + text));
      }
      const box = this.el('div', 'evo-unit' + (id === def.id ? ' cur' : ''));
      box.appendChild(this.el('div', 'evo-name', id + ' · ' + d.cost + '코스트' + (d.unlockOnly ? ' · 해금' : '')));
      const row = this.el('div', 'evo-forms');
      const stages = [];
      if (d.stageForms) d.stageForms.forEach((f, i) => stages.push([f, i === 0 ? '기본' : '다운로드 ' + (i === 1 ? CONFIG.unlock.downloadStage1 : CONFIG.unlock.downloadStage2)]));
      else {
        d.forms.forEach((f, i) => {
          const last = stages[stages.length - 1];
          if (last && last[0].name === f.name) last[1] = last[1].replace(/성$/, '') + '·' + (i + 1) + '성';
          else stages.push([f, (i + 1) + '성']);
        });
      }
      let rowLast = prevForm;
      stages.forEach(([f, label], i) => {
        if (i) row.appendChild(this.el('span', 'evo-arrow', '›'));
        row.appendChild(evoCell(f, label, rowLast));
        rowLast = f;
      });
      box.appendChild(row);
      if (d.branches) {
        const br = this.el('div', 'evo-forms branch');
        br.appendChild(this.el('span', 'evo-arrow', d.branchStar + '성 갈래'));
        const baseF = stages.length ? stages[Math.min(stages.length - 1, Math.max(0, d.branchStar - 2))][0] : null;
        for (const b of d.branches) br.appendChild(evoCell(b.form, '', baseF, owner && owner.branch && owner.branch[d.id] === b.key ? 'pick' : ''));
        box.appendChild(br);
      }
      prevForm = rowLast;
      container.appendChild(box);
    });
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
    const synRows = groups.map(g => state.tab === 'dealt' ? Object.keys(g.syn || {}).map(id => ({ id, p: g.syn[id].p, s: g.syn[id].s, total: g.syn[id].p + g.syn[id].s })).filter(r => r.total >= 1).sort((a, b) => (b.total - a.total) || (a.id < b.id ? -1 : 1)) : []);
    let max = 1;
    for (const rows of allRows) for (const r of rows) max = Math.max(max, r.total);
    for (const rows of synRows) for (const r of rows) max = Math.max(max, r.total);
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
      if (synRows[gi].length) col.appendChild(this.el('div', 'dmg-syn-title', '시너지 피해'));
      for (const r of synRows[gi]) {
        const row = this.el('div', 'dmg-row syn');
        const face = this.el('div', 'dmg-face dmg-syn');
        face.appendChild(this.hex(r.id, null, true));
        const wrap = this.el('div', 'dmg-bar-wrap');
        const num = this.el('div', 'dmg-num', Math.round(r.total));
        num.appendChild(this.el('span', 'dmg-syn-name', r.id));
        row.dataset.tip = r.id + ' 시너지';
        const bar = this.el('div', 'dmg-bar');
        const p = this.el('i', 'p');
        p.style.width = (r.p / max) * 100 + '%';
        const sp = this.el('i', 's');
        sp.style.width = (r.s / max) * 100 + '%';
        bar.appendChild(p);
        bar.appendChild(sp);
        wrap.appendChild(num);
        wrap.appendChild(bar);
        row.appendChild(face);
        row.appendChild(wrap);
        col.appendChild(row);
      }
      cols.appendChild(col);
    });
    container.appendChild(cols);
    container.appendChild(legend);
  }
};
