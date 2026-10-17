const PLAN_KEY = 'pokemon-tft-planner';
const PLAN_SLOTS = 10;
const PLAN_SORTS = [['viewed', '최근 확인'], ['created', '최근 생성'], ['name', '이름순']];

class Planner {
  constructor(app) {
    this.app = app;
    this.state = this.load();
    this.isOpen = false;
    this.undo = [];
    this.filterOpen = false;
    this.menuFor = null;
    this.renaming = null;
    this.delConfirm = null;
    this.sortOpen = false;
    this.editName = false;
    this.drag = null;
    this.build();
    this.syncPlanned();
  }

  cleanSlots(slots) {
    const out = [];
    for (let i = 0; i < PLAN_SLOTS; i++) {
      const id = slots && slots[i];
      out.push(id && UNITS[id] && !out.includes(id) ? id : null);
    }
    return out;
  }

  load() {
    const base = { teams: [], activeId: null, nextNum: 1, sort: 'viewed', view: 'list', draft: null, filter: [] };
    let s = null;
    try {
      s = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null');
    } catch (e) {
      s = null;
    }
    if (!s || typeof s !== 'object') return base;
    const out = Object.assign(base, s);
    out.teams = (Array.isArray(out.teams) ? out.teams : []).filter(t => t && t.id).map(t => ({
      id: String(t.id),
      name: String(t.name || '팀').slice(0, 20),
      slots: this.cleanSlots(t.slots),
      created: Number(t.created) || 0,
      viewed: Number(t.viewed) || 0
    }));
    out.draft = out.draft && out.draft.id ? { id: String(out.draft.id), name: String(out.draft.name || '새 팀').slice(0, 20), slots: this.cleanSlots(out.draft.slots), isNew: !!out.draft.isNew } : null;
    if (!PLAN_SORTS.some(([k]) => k === out.sort)) out.sort = 'viewed';
    out.filter = (Array.isArray(out.filter) ? out.filter : []).filter(id => TRAIT_DATA.map[id]);
    out.nextNum = Math.max(1, Number(out.nextNum) || 1);
    if (out.view !== 'edit' || !out.draft) {
      out.view = 'list';
      out.draft = null;
    }
    if (out.activeId && !out.teams.some(t => t.id === out.activeId) && !(out.draft && out.draft.id === out.activeId)) out.activeId = null;
    return out;
  }

  save() {
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify(this.state));
    } catch (e) {
      return;
    }
  }

  build() {
    const g = this.app.gameEl;
    const btn = document.createElement('button');
    btn.id = 'btn-planner';
    btn.className = 'icon-btn';
    btn.innerHTML = iconSvg('plan', 20);
    btn.dataset.tip = '배치 도구';
    btn.addEventListener('click', () => (this.isOpen ? this.close() : this.openPanel()));
    g.appendChild(btn);
    this.btn = btn;
    this.wrap = document.createElement('div');
    this.wrap.id = 'planner-wrap';
    this.panel = document.createElement('div');
    this.panel.id = 'planner';
    this.panel.className = 'frame';
    this.wrap.appendChild(this.panel);
    g.appendChild(this.wrap);
    this.wrap.addEventListener('pointerdown', e => {
      if (e.target === this.wrap) e.stopPropagation();
      if (this.sortOpen && !e.target.closest('.pl-sort')) {
        this.sortOpen = false;
        this.render();
      } else if (this.menuFor && !e.target.closest('.pl-menu, .pl-more')) {
        this.menuFor = null;
        this.delConfirm = null;
        this.render();
      }
    });
    window.addEventListener('pointermove', e => this.onMove(e));
    window.addEventListener('pointerup', e => this.onUp(e));
  }

  destroy() {
    this.save();
    this.drag = null;
    this.btn.remove();
    this.wrap.remove();
  }

  openPanel() {
    this.isOpen = true;
    this.wrap.classList.add('show');
    this.app.hideTooltip();
    this.render();
  }

  close() {
    this.isOpen = false;
    this.filterOpen = false;
    this.menuFor = null;
    this.sortOpen = false;
    this.renaming = null;
    this.editName = false;
    this.wrap.classList.remove('show');
    this.app.hideUnitTip();
    this.app.hideTooltip();
    this.app.hideTraitTipSoon();
    this.save();
  }

  escape() {
    if (this.filterOpen) {
      this.filterOpen = false;
      this.render();
    } else this.close();
  }

  teamById(id) {
    return this.state.teams.find(t => t.id === id) || null;
  }

  activeSlots() {
    const id = this.state.activeId;
    if (!id) return [];
    const d = this.state.draft;
    if (d && d.id === id) return d.slots;
    const t = this.teamById(id);
    return t ? t.slots : [];
  }

  syncPlanned() {
    View.planned = new Set(this.activeSlots().filter(Boolean));
    if (this.app.game && this.app.human) this.app.requestRender();
  }

  toggleActive(id) {
    this.state.activeId = this.state.activeId === id ? null : id;
    this.save();
    this.syncPlanned();
    this.render();
  }

  baseForm(def) {
    return def.stageForms ? def.stageForms[0] : def.forms[0];
  }

  units() {
    if (this.unitList) return this.unitList;
    const list = UNIT_DATA.filter(d => !d.region && (d.shop || d.unlockOnly));
    list.sort((a, b) => a.cost - b.cost || this.baseForm(a).name.localeCompare(this.baseForm(b).name, 'ko'));
    this.unitList = list;
    return list;
  }

  unitTraits(def) {
    return allTraitsOf(def, 1, null).filter(t => TRAIT_DATA.map[t] && TRAIT_DATA.map[t].kind !== 'unique');
  }

  planOwner(slots) {
    const insts = slots.filter(Boolean).map((id, i) => ({ iid: 'plan' + i, unitId: id, star: 1, loc: { zone: 'plan', r: 0, c: i } }));
    const h = this.app.human;
    return {
      boardUnits: () => insts,
      branch: {},
      downloadStage: 0,
      region: h ? h.region : null,
      dragonScales: 0,
      training: 0,
      psychic: 0,
      unlockedShop: h ? h.unlockedShop : new Set()
    };
  }

  sortedTeams() {
    const list = this.state.teams.slice();
    const s = this.state.sort;
    if (s === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    else if (s === 'created') list.sort((a, b) => b.created - a.created);
    else list.sort((a, b) => b.viewed - a.viewed || b.created - a.created);
    return list;
  }

  newTeam() {
    const id = 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    this.state.draft = { id, name: '새 팀 (' + this.state.nextNum + ')', slots: new Array(PLAN_SLOTS).fill(null), isNew: true };
    this.state.view = 'edit';
    this.undo = [];
    this.editName = false;
    this.save();
    this.render();
  }

  editTeam(id) {
    const t = this.teamById(id);
    if (!t) return;
    t.viewed = Date.now();
    this.state.draft = { id: t.id, name: t.name, slots: t.slots.slice(), isNew: false };
    this.state.view = 'edit';
    this.undo = [];
    this.editName = false;
    this.menuFor = null;
    this.save();
    this.render();
  }

  back() {
    const d = this.state.draft;
    if (d) {
      const filled = d.slots.some(Boolean);
      if (d.isNew) {
        if (filled) {
          const now = Date.now();
          this.state.teams.push({ id: d.id, name: d.name, slots: d.slots.slice(), created: now, viewed: now });
          this.state.nextNum += 1;
        } else if (this.state.activeId === d.id) this.state.activeId = null;
      } else if (!filled) {
        this.state.teams = this.state.teams.filter(t => t.id !== d.id);
        if (this.state.activeId === d.id) this.state.activeId = null;
      }
    }
    this.state.draft = null;
    this.state.view = 'list';
    this.filterOpen = false;
    this.editName = false;
    this.undo = [];
    this.save();
    this.syncPlanned();
    this.app.hideTraitTipSoon();
    this.render();
  }

  commit() {
    const d = this.state.draft;
    if (!d) return;
    if (!d.isNew) {
      const t = this.teamById(d.id);
      if (t) {
        t.slots = d.slots.slice();
        t.name = d.name;
      }
    }
    this.save();
    if (this.state.activeId === d.id) this.syncPlanned();
    this.render();
  }

  pushUndo() {
    this.undo.push(this.state.draft.slots.slice());
    if (this.undo.length > 60) this.undo.shift();
  }

  addUnit(id, at) {
    const d = this.state.draft;
    const cur = d.slots.indexOf(id);
    if (at == null) {
      if (cur >= 0) return this.removeAt(cur);
      const free = d.slots.indexOf(null);
      if (free < 0) {
        this.app.toast('팀은 최대 ' + PLAN_SLOTS + '마리까지 넣을 수 있습니다', 'error');
        return;
      }
      this.pushUndo();
      d.slots[free] = id;
    } else {
      this.pushUndo();
      if (cur >= 0) {
        d.slots[cur] = d.slots[at];
        d.slots[at] = id;
      } else d.slots[at] = id;
    }
    this.commit();
  }

  removeAt(i) {
    const d = this.state.draft;
    if (!d.slots[i]) return;
    this.pushUndo();
    d.slots[i] = null;
    this.commit();
  }

  swap(a, b) {
    const d = this.state.draft;
    if (a === b) return;
    this.pushUndo();
    const t = d.slots[a];
    d.slots[a] = d.slots[b];
    d.slots[b] = t;
    this.commit();
  }

  clearAll() {
    const d = this.state.draft;
    if (!d.slots.some(Boolean)) return;
    this.pushUndo();
    d.slots = new Array(PLAN_SLOTS).fill(null);
    this.commit();
  }

  snapshot() {
    const h = this.app.human;
    const d = this.state.draft;
    if (!h || !d) return;
    const board = h.boardUnits().slice().sort((a, b) => a.loc.r - b.loc.r || a.loc.c - b.loc.c);
    const ids = [];
    for (const u of board) if (UNITS[u.unitId] && !ids.includes(u.unitId) && ids.length < PLAN_SLOTS) ids.push(u.unitId);
    if (!ids.length) return;
    this.pushUndo();
    d.slots = ids.concat(new Array(PLAN_SLOTS - ids.length).fill(null));
    this.commit();
    this.app.toast('필드의 기물 ' + ids.length + '마리를 팀에 넣었습니다', 'info');
  }

  undoLast() {
    const prev = this.undo.pop();
    if (!prev) return;
    this.state.draft.slots = prev;
    this.commit();
  }

  rename(id, name) {
    const v = String(name || '').trim().slice(0, 20);
    if (!v) return;
    const d = this.state.draft;
    if (d && d.id === id) d.name = v;
    const t = this.teamById(id);
    if (t) t.name = v;
    this.save();
  }

  deleteTeam(id) {
    this.state.teams = this.state.teams.filter(t => t.id !== id);
    if (this.state.activeId === id) this.state.activeId = null;
    this.menuFor = null;
    this.delConfirm = null;
    this.save();
    this.syncPlanned();
    this.render();
  }

  el(tag, cls, text) {
    return View.el(tag, cls, text);
  }

  button(cls, icon, label, fn, tip) {
    const b = this.el('button', cls);
    if (icon) b.innerHTML = iconSvg(icon, 14);
    if (label) b.appendChild(this.el('span', null, label));
    if (tip) b.dataset.tip = tip;
    b.addEventListener('click', e => {
      e.stopPropagation();
      fn(e);
    });
    return b;
  }

  switchEl(on, fn) {
    const s = this.el('div', 'pl-switch' + (on ? ' on' : ''));
    s.appendChild(this.el('i'));
    s.dataset.tip = on ? '상점 표시 끄기' : '이 팀 기물을 상점에 몬스터볼로 표시';
    s.addEventListener('click', e => {
      e.stopPropagation();
      fn();
    });
    return s;
  }

  portrait(def, size) {
    const form = this.baseForm(def);
    const box = this.el('div', 'pl-pic');
    box.style.setProperty('--cost-color', COST_COLORS[def.cost]);
    box.style.width = size + 'px';
    box.style.height = size + 'px';
    const spr = Sprites.portrait(form, size, { fill: 0.86, max: 3 });
    if (spr) box.appendChild(spr);
    else {
      box.style.background = View.orbBackground(form.types);
      box.appendChild(this.el('span', 'pl-pic-txt', form.name.slice(0, 2)));
    }
    return box;
  }

  traitStrip(def) {
    const strip = this.el('div', 'pl-traits');
    for (const t of this.unitTraits(def)) {
      const s = this.el('span', 'pl-ti');
      s.innerHTML = View.traitIconSvg(t, 0.5);
      strip.appendChild(s);
    }
    return strip;
  }

  render() {
    if (!this.isOpen) return;
    this.app.hideUnitTip();
    this.app.hideTooltip();
    const p = this.panel;
    p.innerHTML = '';
    p.className = 'frame view-' + this.state.view;
    if (this.state.view === 'edit' && this.state.draft) this.renderEdit(p);
    else this.renderList(p);
  }

  renderHead(p, title, back) {
    const head = this.el('div', 'pl-head');
    if (back) head.appendChild(this.button('pl-icon pl-back', 'back', null, () => this.back(), '팀 목록으로'));
    head.appendChild(this.el('div', 'pl-title', title));
    head.appendChild(this.button('pl-icon pl-x', 'close', null, () => this.close(), '닫기'));
    p.appendChild(head);
  }

  renderList(p) {
    this.renderHead(p, '내 팀', false);
    const bar = this.el('div', 'pl-bar');
    const sort = this.el('div', 'pl-sort');
    const cur = PLAN_SORTS.find(([k]) => k === this.state.sort);
    const sb = this.button('pl-sort-btn', null, cur[1], () => {
      this.sortOpen = !this.sortOpen;
      this.render();
    });
    sb.insertAdjacentHTML('beforeend', iconSvg('down', 12));
    sort.appendChild(sb);
    if (this.sortOpen) {
      const menu = this.el('div', 'pl-sort-menu');
      for (const [k, label] of PLAN_SORTS) {
        const it = this.el('div', 'pl-sort-item' + (k === this.state.sort ? ' on' : ''), label);
        it.addEventListener('click', e => {
          e.stopPropagation();
          this.state.sort = k;
          this.sortOpen = false;
          this.save();
          this.render();
        });
        menu.appendChild(it);
      }
      sort.appendChild(menu);
    }
    bar.appendChild(sort);
    bar.appendChild(this.button('pl-new', 'plus', '새 팀', () => this.newTeam()));
    p.appendChild(bar);
    const list = this.el('div', 'pl-list');
    const teams = this.sortedTeams();
    if (!teams.length) list.appendChild(this.el('div', 'pl-empty', '저장된 팀이 없습니다. "새 팀"을 눌러 배치를 만들어 보세요.'));
    for (const t of teams) list.appendChild(this.teamRow(t));
    p.appendChild(list);
    if (this.listScroll) list.scrollTop = this.listScroll;
    list.addEventListener('scroll', () => {
      this.listScroll = list.scrollTop;
    });
  }

  teamRow(t) {
    const row = this.el('div', 'pl-row' + (this.state.activeId === t.id ? ' active' : ''));
    const left = this.el('div', 'pl-row-main');
    if (this.renaming === t.id) {
      const inp = this.el('input', 'pl-input');
      inp.value = t.name;
      inp.maxLength = 20;
      const done = () => {
        if (this.renaming !== t.id) return;
        this.rename(t.id, inp.value);
        this.renaming = null;
        this.render();
      };
      inp.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') done();
        if (e.key === 'Escape') {
          this.renaming = null;
          this.render();
        }
      });
      inp.addEventListener('blur', done);
      inp.addEventListener('click', e => e.stopPropagation());
      left.appendChild(inp);
      setTimeout(() => {
        inp.focus();
        inp.select();
      }, 0);
    } else left.appendChild(this.el('div', 'pl-row-name', t.name));
    const units = this.el('div', 'pl-row-units');
    for (let i = 0; i < PLAN_SLOTS; i++) {
      const id = t.slots[i];
      if (id) {
        const pic = this.portrait(UNITS[id], 46);
        pic.dataset.unit = id;
        units.appendChild(pic);
      } else {
        const e = this.el('div', 'pl-pic empty');
        e.innerHTML = iconSvg('ball', 22);
        units.appendChild(e);
      }
    }
    left.appendChild(units);
    row.appendChild(left);
    row.appendChild(this.switchEl(this.state.activeId === t.id, () => this.toggleActive(t.id)));
    const more = this.button('pl-icon pl-more', 'more', null, () => {
      this.menuFor = this.menuFor === t.id ? null : t.id;
      this.delConfirm = null;
      this.render();
    });
    row.appendChild(more);
    if (this.menuFor === t.id) {
      const menu = this.el('div', 'pl-menu');
      const rn = this.el('div', 'pl-menu-item', '이름 바꾸기');
      rn.addEventListener('click', e => {
        e.stopPropagation();
        this.menuFor = null;
        this.renaming = t.id;
        this.render();
      });
      const del = this.el('div', 'pl-menu-item del' + (this.delConfirm === t.id ? ' confirm' : ''), this.delConfirm === t.id ? '한 번 더 누르면 삭제' : '삭제');
      del.addEventListener('click', e => {
        e.stopPropagation();
        if (this.delConfirm === t.id) this.deleteTeam(t.id);
        else {
          this.delConfirm = t.id;
          this.render();
        }
      });
      menu.appendChild(rn);
      menu.appendChild(del);
      row.appendChild(menu);
    }
    row.addEventListener('click', () => {
      if (this.renaming === t.id) return;
      this.editTeam(t.id);
    });
    return row;
  }

  renderEdit(p) {
    const d = this.state.draft;
    this.renderHead(p, '팀 구성', true);
    const body = this.el('div', 'pl-edit');
    const left = this.el('div', 'pl-left');
    const fbar = this.el('div', 'pl-filterbar');
    const fb = this.button('pl-filter-btn', 'filter', '필터' + (this.state.filter.length ? ' (' + this.state.filter.length + ')' : ''), () => {
      this.filterOpen = true;
      this.render();
    });
    fb.insertAdjacentHTML('beforeend', '<b class="pl-chev">›</b>');
    fbar.appendChild(fb);
    const chips = this.el('div', 'pl-chips');
    for (const id of this.state.filter) {
      const c = this.el('div', 'pl-chip');
      c.appendChild(View.hex(id, null, true));
      c.appendChild(this.el('span', null, id));
      c.appendChild(this.el('b', null, '×'));
      c.dataset.tip = '필터에서 빼기';
      c.addEventListener('click', e => {
        e.stopPropagation();
        this.state.filter = this.state.filter.filter(x => x !== id);
        this.save();
        this.render();
      });
      chips.appendChild(c);
    }
    fbar.appendChild(chips);
    left.appendChild(fbar);
    const scroll = this.el('div', 'pl-units');
    const human = this.app.human;
    const filter = this.state.filter;
    let shown = 0;
    for (let cost = 1; cost <= 5; cost++) {
      const defs = this.units().filter(def => def.cost === cost && (!filter.length || allTraitsOf(def, 1, null).some(t => filter.includes(t)) || (def.forms || []).some(f => f.types.some(t => filter.includes(t)))));
      if (!defs.length) continue;
      const h = this.el('div', 'pl-cost-h');
      h.innerHTML = iconSvg('coin', 14);
      h.appendChild(this.el('span', null, cost));
      h.style.setProperty('--cost-color', COST_COLORS[cost]);
      scroll.appendChild(h);
      const grid = this.el('div', 'pl-grid');
      for (const def of defs) {
        shown++;
        const card = this.el('div', 'pl-card' + (d.slots.includes(def.id) ? ' picked' : ''));
        const pic = this.portrait(def, 70);
        pic.appendChild(this.traitStrip(def));
        if (def.unlockOnly) {
          const open = human && human.unlockedShop.has(def.id);
          const lk = this.el('div', 'pl-lock' + (open ? ' open' : ''));
          lk.innerHTML = iconSvg(open ? 'unlock' : 'lock', 14);
          pic.appendChild(lk);
        }
        if (d.slots.includes(def.id)) {
          const ck = this.el('div', 'pl-check');
          ck.innerHTML = iconSvg('check', 14);
          pic.appendChild(ck);
        }
        card.appendChild(pic);
        card.appendChild(this.el('div', 'pl-card-name', this.baseForm(def).name));
        card.dataset.unit = def.id;
        card.addEventListener('pointerdown', e => this.startDrag(e, { from: 'list', id: def.id }, card));
        grid.appendChild(card);
      }
      scroll.appendChild(grid);
    }
    if (!shown) scroll.appendChild(this.el('div', 'pl-empty', '조건에 맞는 기물이 없습니다.'));
    left.appendChild(scroll);
    body.appendChild(left);
    const syn = this.el('div', 'pl-syn');
    const owner = this.planOwner(d.slots);
    const list = computeSynergies(owner).filter(s => s.count > 0);
    list.sort((a, b) => Number(b.active) - Number(a.active) || b.tier - a.tier || b.count - a.count || a.id.localeCompare(b.id, 'ko'));
    const pages = Math.max(1, Math.ceil(list.length / 9));
    const pg = Math.min(this.synPage || 0, pages - 1);
    this.synPage = pg;
    for (let i = 0; i < 9; i++) {
      const s = list[pg * 9 + i];
      const slot = this.el('div', 'pl-syn-slot');
      if (s) {
        const hx = View.hex(s.id, s);
        slot.appendChild(hx);
        slot.appendChild(this.el('span', 'pl-syn-n' + (s.active ? ' on' : ''), s.count));
        slot.addEventListener('mouseenter', () => this.app.showTraitTip(slot, s.id, 'planner', owner));
        slot.addEventListener('mouseleave', () => this.app.hideTraitTipSoon());
      } else slot.appendChild(this.el('div', 'hex pl-syn-empty'));
      syn.appendChild(slot);
    }
    if (pages > 1) {
      const shown = Math.min(9, list.length - pg * 9);
      const more = this.button('pl-syn-more', null, '+' + (list.length - shown), () => {
        this.synPage = (pg + 1) % pages;
        this.app.hideTraitTipSoon();
        this.render();
      }, '다음 시너지 보기');
      syn.appendChild(more);
    }
    body.appendChild(syn);
    const right = this.el('div', 'pl-right');
    const nameRow = this.el('div', 'pl-name-row');
    nameRow.appendChild(this.button('pl-icon pl-pencil', 'pencil', null, () => {
      this.editName = true;
      this.render();
    }, '이름 바꾸기'));
    if (this.editName) {
      const inp = this.el('input', 'pl-input');
      inp.value = d.name;
      inp.maxLength = 20;
      const done = () => {
        if (!this.editName) return;
        this.rename(d.id, inp.value);
        this.editName = false;
        this.render();
      };
      inp.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') done();
        if (e.key === 'Escape') {
          this.editName = false;
          this.render();
        }
      });
      inp.addEventListener('blur', done);
      nameRow.appendChild(inp);
      setTimeout(() => {
        inp.focus();
        inp.select();
      }, 0);
    } else nameRow.appendChild(this.el('div', 'pl-name', d.name));
    nameRow.appendChild(this.switchEl(this.state.activeId === d.id, () => this.toggleActive(d.id)));
    right.appendChild(nameRow);
    const slots = this.el('div', 'pl-slots');
    d.slots.forEach((id, i) => {
      const slot = this.el('div', 'pl-slot' + (id ? '' : ' empty'));
      slot.dataset.slot = i;
      if (id) {
        const def = UNITS[id];
        slot.style.setProperty('--cost-color', COST_COLORS[def.cost]);
        const pic = this.portrait(def, 84);
        pic.appendChild(this.traitStrip(def));
        slot.appendChild(pic);
        slot.appendChild(this.el('div', 'pl-slot-name', this.baseForm(def).name));
        slot.dataset.unit = id;
        slot.addEventListener('pointerdown', e => this.startDrag(e, { from: 'slot', index: i, id }, slot));
      } else {
        slot.innerHTML = iconSvg('ball', 40);
      }
      slots.appendChild(slot);
    });
    right.appendChild(slots);
    const count = this.el('div', 'pl-count', d.slots.filter(Boolean).length + ' / ' + PLAN_SLOTS);
    right.appendChild(count);
    const acts = this.el('div', 'pl-actions');
    const clr = this.button('pl-act', 'broom', '지우기', () => this.clearAll());
    const und = this.button('pl-act', 'undo', '되돌리기', () => this.undoLast());
    und.disabled = !this.undo.length;
    clr.disabled = !d.slots.some(Boolean);
    const group = this.el('div', 'pl-act-group');
    group.appendChild(clr);
    if (this.app.game && this.app.human) {
      const snap = this.button('pl-act', 'snap', '스냅샷', () => this.snapshot(), '지금 필드에 있는 기물로 팀을 채웁니다');
      snap.disabled = !this.app.human.boardUnits().length;
      group.appendChild(snap);
    }
    acts.appendChild(group);
    acts.appendChild(und);
    right.appendChild(acts);
    body.appendChild(right);
    if (this.filterOpen) body.appendChild(this.renderFilter());
    p.appendChild(body);
    if (this.unitScroll) scroll.scrollTop = this.unitScroll;
    scroll.addEventListener('scroll', () => {
      this.unitScroll = scroll.scrollTop;
    });
  }

  renderFilter() {
    const box = this.el('div', 'pl-filter frame');
    const head = this.el('div', 'pl-filter-head');
    head.appendChild(this.el('div', 'pl-title', '특성 필터'));
    head.appendChild(this.button('pl-clearall', null, '모두 지우기', () => {
      this.state.filter = [];
      this.save();
      this.render();
    }));
    head.appendChild(this.button('pl-icon pl-x', 'close', null, () => {
      this.filterOpen = false;
      this.render();
    }));
    box.appendChild(head);
    const grid = this.el('div', 'pl-filter-grid');
    const ids = TRAIT_DATA.list.filter(t => t.kind === 'type').map(t => t.id).concat(TRAIT_DATA.list.filter(t => t.kind === 'class').map(t => t.id));
    for (const id of ids) {
      const on = this.state.filter.includes(id);
      const it = this.el('div', 'pl-filter-item' + (on ? ' on' : ''));
      it.appendChild(View.hex(id, on ? { active: true, tier: 1, tiers: [1] } : null, true));
      it.appendChild(this.el('span', null, id));
      it.addEventListener('click', e => {
        e.stopPropagation();
        if (on) this.state.filter = this.state.filter.filter(x => x !== id);
        else this.state.filter.push(id);
        this.filterOpen = false;
        this.unitScroll = 0;
        this.save();
        this.render();
      });
      grid.appendChild(it);
    }
    box.appendChild(grid);
    return box;
  }

  startDrag(e, src, el) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    this.drag = { src, el, x: e.clientX, y: e.clientY, moved: false, ghost: null };
  }

  onMove(e) {
    const dr = this.drag;
    if (!dr) return;
    if (!dr.moved && Math.hypot(e.clientX - dr.x, e.clientY - dr.y) < 6) return;
    if (!dr.moved) {
      dr.moved = true;
      this.app.hideUnitTip();
      const g = this.el('div', 'pl-ghost');
      g.appendChild(this.portrait(UNITS[dr.src.id], 64));
      this.wrap.appendChild(g);
      dr.ghost = g;
      dr.el.classList.add('dragging');
    }
    const p = this.app.toGame(e.clientX, e.clientY);
    dr.ghost.style.left = p.x - 32 + 'px';
    dr.ghost.style.top = p.y - 32 + 'px';
    for (const s of this.panel.querySelectorAll('.pl-slot.over')) s.classList.remove('over');
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const slot = t && t.closest('.pl-slot');
    if (slot) slot.classList.add('over');
  }

  onUp(e) {
    const dr = this.drag;
    if (!dr) return;
    this.drag = null;
    if (dr.ghost) dr.ghost.remove();
    dr.el.classList.remove('dragging');
    if (!dr.moved) {
      if (dr.src.from === 'list') this.addUnit(dr.src.id);
      else this.removeAt(dr.src.index);
      return;
    }
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const slot = t && t.closest('.pl-slot');
    if (!slot) {
      if (dr.src.from === 'slot' && !(t && t.closest('#planner'))) this.removeAt(dr.src.index);
      else this.render();
      return;
    }
    const to = Number(slot.dataset.slot);
    if (dr.src.from === 'slot') this.swap(dr.src.index, to);
    else this.addUnit(dr.src.id, to);
  }
}
