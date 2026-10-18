const ARENA_W = 792;
const ARENA_H = 500;
const HOME_BOTTOM = { x: 117, y: 482 };
const HOME_TOP = { x: 675, y: 48 };
const VISIT_SPOT = { x: 160, y: 405 };
const CAROUSEL_CENTER = { x: 396, y: 272 };
const WALK_SPEED = 90;
const ORB_RUN = 3;
const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };
const UNIT_ORIGIN = { x: 22, y: 40 };
const UNIT_SCALE = 1.3;
const STRAT_SCALE = 1.1;

class StratSprite {
  constructor(opts) {
    this.leader = !!opts.leader;
    this.el = document.createElement('div');
    this.el.className = 'strat' + (this.leader ? ' leader' : '') + (opts.me ? ' me' : '');
    this.el.style.backgroundImage = 'url("' + (this.leader ? Assets.leaderUrl(opts.leader) : Assets.playerUrl(opts.look)) + '")';
    this.plate = null;
    if (opts.player) {
      this.plate = document.createElement('div');
      this.plate.className = 'plate';
      this.plateName = document.createElement('div');
      this.plateName.className = 'pl-name';
      const bar = document.createElement('div');
      bar.className = 'pl-bar';
      this.plateLv = document.createElement('span');
      this.plateLv.className = 'pl-lv';
      const hp = document.createElement('div');
      hp.className = 'pl-hp';
      this.plateHp = document.createElement('i');
      hp.appendChild(this.plateHp);
      bar.appendChild(this.plateLv);
      bar.appendChild(hp);
      this.plate.appendChild(this.plateName);
      this.plate.appendChild(bar);
      this.el.appendChild(this.plate);
      this.setInfo(opts.player, opts.suffix);
    }
    this.carryEl = null;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.tx = this.x;
    this.ty = this.y;
    this.dir = 'down';
    this.anim = 0;
    this.moving = false;
    this.speed = opts.speed || WALK_SPEED;
    this.render();
  }

  setInfo(player, suffix) {
    if (!this.plate || !player) return;
    this.player = player;
    this.suffix = suffix || this.suffix || '';
    this.plateName.textContent = player.name + this.suffix;
    this.plateLv.textContent = player.level;
    this.plateHp.style.width = Math.max(0, Math.min(100, (player.hp / (player.maxHp || 100)) * 100)) + '%';
    this.plateHp.classList.toggle('low', player.hp <= 30);
  }

  refresh() {
    if (this.player) this.setInfo(this.player);
  }

  place(x, y) {
    this.x = x;
    this.y = y;
    this.tx = x;
    this.ty = y;
    this.moving = false;
    this.render();
  }

  moveTo(x, y) {
    this.tx = x;
    this.ty = y;
  }

  update(dt) {
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) {
      this.x = this.tx;
      this.y = this.ty;
      if (this.moving) {
        this.moving = false;
        this.render();
      }
      return;
    }
    const step = Math.min(d, this.speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.moving = true;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
    else this.dir = dy > 0 ? 'down' : 'up';
    this.anim += dt;
    this.render();
  }

  render() {
    placeSprite(this.el, this.x, this.y, 32, 60, STRAT_SCALE);
    if (this.leader) return;
    const seq = [0, 1, 2, 1];
    const col = this.moving ? seq[Math.floor(this.anim * 8) % 4] : 1;
    this.el.style.backgroundPosition = (-col * 64) + 'px ' + (-DIR_ROW[this.dir] * 64) + 'px';
  }

  carry(unitEl) {
    if (this.carryEl) this.carryEl.remove();
    this.carryEl = null;
    if (!unitEl) return;
    this.carryEl = document.createElement('div');
    this.carryEl.className = 'carry';
    this.carryEl.appendChild(unitEl);
    this.el.appendChild(this.carryEl);
  }
}

class Arena {
  constructor(app) {
    this.app = app;
    this.root = document.getElementById('arena');
    this.floor = document.getElementById('floor');
    this.overlay = document.getElementById('overlay');
    this.unitLayer = document.getElementById('unit-layer');
    this.orbLayer = document.getElementById('orb-layer');
    this.carLayer = document.getElementById('carousel-layer');
    this.stratLayer = document.getElementById('strat-layer');
    this.fx = document.getElementById('fx-layer');
    this.boardCount = document.getElementById('board-count');
    this.benchLayer = document.getElementById('bench-layer');
    this.cunits = {};
    this.serpents = {};
    this.shadowEls = { A: [], B: [] };
    this.benchPlayers = { top: null, bottom: null };
    this.sim = null;
    this.flip = false;
    this.sideSprites = [];
    this.others = {};
    this.carouselMode = null;
    this.overlayKey = '';
    this.buildPillars();
    this.setCarouselMode(false);
    const h = app.human;
    this.me = new StratSprite({ look: h.strategist, player: h, me: true, x: HOME_BOTTOM.x, y: HOME_BOTTOM.y });
    this.stratLayer.appendChild(this.me.el);
    const bc = Proj.toScreen(396, 150);
    this.boardCount.style.left = bc.x + 'px';
    this.boardCount.style.top = bc.y + 'px';
  }

  buildPillars() {
    this.pillarTop = [];
    this.pillarBottom = [];
    for (const top of [true, false]) {
      for (let k = 0; k < 5; k++) {
        const el = document.createElement('div');
        el.className = 'goldball' + (top ? '' : ' flip');
        const clip = document.createElement('div');
        clip.className = 'gb-clip';
        const ball = document.createElement('div');
        ball.className = 'gb-ball';
        ball.appendChild(document.createElement('i'));
        clip.appendChild(ball);
        el.appendChild(clip);
        const spark = document.createElement('div');
        spark.className = 'gb-spark';
        const delay = (-Math.random() * 6).toFixed(2) + 's';
        const dur = (4.5 + Math.random() * 3).toFixed(2) + 's';
        spark.style.animationDelay = delay;
        spark.style.animationDuration = dur;
        ball.firstChild.style.animationDelay = delay;
        ball.firstChild.style.animationDuration = dur;
        el.appendChild(spark);
        const pc = pillarCenter(k, top);
        placeSprite(el, pc.x, pc.y + 5, 18, 70);
        this.benchLayer.appendChild(el);
        (top ? this.pillarTop : this.pillarBottom).push(el);
      }
    }
  }

  toFlat(clientX, clientY) {
    const g = this.app.toGame(clientX, clientY);
    return Proj.toFlat(g.x, g.y);
  }

  setMap(id) {
    if (Floor.mapId === id) return;
    Floor.mapId = id;
    if (this.carouselMode === false) Floor.show(this.floor, false);
  }

  setCarouselMode(on) {
    if (this.carouselMode === on) return;
    this.carouselMode = on;
    this.root.classList.toggle('carousel-mode', on);
    Floor.show(this.floor, on);
    this.drawOverlay(null);
  }

  drawOverlay(opts) {
    const key = JSON.stringify(opts || null);
    if (key === this.overlayKey) return;
    this.overlayKey = key;
    Floor.drawOverlay(this.overlay, opts);
  }

  hitTest(clientX, clientY) {
    const f = this.toFlat(clientX, clientY);
    for (let i = 0; i < CONFIG.benchSize; i++) {
      const sc = slotCenter(i, false);
      if (Math.abs(f.x - sc.x) <= 25 && Math.abs(f.y - sc.y) <= 26) return { kind: 'bench', i };
    }
    let best = null;
    let bestD = 32;
    for (let r = 4; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const p = View.cellCenter(r, c);
        const d = Math.hypot(f.x - p.x, f.y - p.y);
        if (d < bestD) {
          bestD = d;
          best = { kind: 'board', r, c };
        }
      }
    }
    return best;
  }

  clearOthers() {
    for (const id in this.others) this.others[id].el.remove();
    this.others = {};
  }

  clearSideSprites() {
    for (const s of this.sideSprites) s.el.remove();
    this.sideSprites = [];
  }

  setPillars(list, count, animate) {
    list.forEach((p, i) => {
      const on = i < count;
      if (on === p.classList.contains('on')) return;
      p.classList.toggle('on', on);
      p.classList.remove('pop');
      if (on && animate) {
        void p.offsetWidth;
        p.classList.add('pop');
      }
    });
  }

  interestOf(side) {
    if (!side || !side.player) return 0;
    return Math.min(CONFIG.interestMax, Math.floor(side.player.gold / CONFIG.interestPer));
  }

  showCarouselLayer(on) {
    this.carLayer.style.display = on ? '' : 'none';
  }

  refreshSprites() {
    for (const s of this.sideSprites) s.refresh();
    for (const id in this.others) this.others[id].refresh();
    this.me.refresh();
  }

  renderSides(top, bottom, noSprites) {
    this.clearSideSprites();
    this.setPillars(this.pillarTop, this.interestOf(top));
    this.setPillars(this.pillarBottom, this.interestOf(bottom));
    const addSprite = (side, home) => {
      if (!side || noSprites) return;
      if (side.player && side.player === this.app.human) return;
      if (side.player && !side.ghost) return;
      let s = null;
      if (side.player) {
        s = new StratSprite({ look: side.player.strategist, player: side.player, suffix: side.ghost ? ' (복제)' : '', x: home.x, y: home.y });
      } else if (side.camp && side.camp.leader) {
        s = new StratSprite({ leader: side.camp.leader, name: '', x: home.x, y: home.y });
      }
      if (s) {
        this.stratLayer.appendChild(s.el);
        this.sideSprites.push(s);
      }
    };
    addSprite(top, HOME_TOP);
    addSprite(bottom, HOME_BOTTOM);
  }

  clearUnits() {
    this.unitLayer.innerHTML = '';
    this.fx.innerHTML = '';
    this.cunits = {};
    this.serpents = {};
    this.shadowEls = { A: [], B: [] };
    this.sim = null;
  }

  clearFieldFx() {
    this.unitLayer.querySelectorAll('.sea-tile, .fx-flood, .fx-frost, .serpent-seg, .shadow-token').forEach(el => el.remove());
    this.serpents = {};
    this.shadowEls = { A: [], B: [] };
  }

  clearShadows() {
    for (const k of ['A', 'B']) for (const el of this.shadowEls[k]) el.remove();
    this.shadowEls = { A: [], B: [] };
  }

  fieldPolygon() {
    const F = FLAT.field;
    const pts = [[F.x0, F.y0], [F.x1, F.y0], [F.x1, F.y1], [F.x0, F.y1]].map(([x, y]) => Proj.toScreen(x, y));
    return 'polygon(' + pts.map(p => Math.round(p.x) + 'px ' + Math.round(p.y) + 'px').join(', ') + ')';
  }

  fieldLayer(cls) {
    if (this.unitLayer.querySelector('.' + cls)) return;
    const el = document.createElement('div');
    el.className = cls;
    el.style.clipPath = this.fieldPolygon();
    this.unitLayer.appendChild(el);
  }

  renderSea(cells) {
    this.unitLayer.querySelectorAll('.sea-tile').forEach(el => el.remove());
    for (const [r, c] of cells) {
      const el = document.createElement('div');
      el.className = 'sea-tile';
      const p = View.cellCenter(r, c);
      placeSprite(el, p.x, p.y, 20, 12, 1);
      el.style.zIndex = '58';
      this.unitLayer.appendChild(el);
    }
  }

  combatFieldFx() {
    const sim = this.sim;
    if (!sim) return;
    const cells = [];
    for (const side of ['A', 'B']) {
      const st = sim.side[side];
      if (st.frost) this.fieldLayer('fx-frost');
      if (st.seaOn && st.sea) for (const k of st.sea) cells.push(this.mapCell(Math.floor(k / 10), k % 10));
    }
    if (cells.length) this.renderSea(cells);
    if (sim.units.some(u => u.serpent && u.alive)) this.fieldLayer('fx-flood');
  }

  placeToken(el, r, c) {
    const p = View.cellCenter(r, c);
    placeSprite(el, p.x, p.y, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE);
    if (el._spr) Sprites.face(el._spr, SPRITE_DIR.down);
    if (el._maxHp && !el.querySelector('.bars')) {
      View.unitBars(el, el._maxHp);
      el.classList.add('planbar');
      if (el._enemy) el.classList.add('enemy');
    }
    this.unitLayer.appendChild(el);
  }

  renderBench(top, player, makeToken) {
    const cls = top ? 'bench-top' : 'bench-bottom';
    for (const el of this.unitLayer.querySelectorAll('.' + cls)) el.remove();
    this.benchPlayers[top ? 'top' : 'bottom'] = player || null;
    if (!this.sim || this.sim.over) this.clearShadows();
    if (!player) return;
    for (let i = 0; i < player.bench.length; i++) {
      const inst = player.bench[i];
      if (!inst) continue;
      const el = makeToken(inst, player);
      el.classList.add(cls);
      if (el._maxHp && !el.querySelector('.bars')) {
        View.unitBars(el, el._maxHp);
        el.classList.add('planbar');
        if (el._enemy) el.classList.add('enemy');
      }
      const sc = slotCenter(i, top);
      placeSprite(el, sc.x, sc.y + 8, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE);
      this.unitLayer.appendChild(el);
    }
  }

  renderBoardCount(text, free) {
    this.boardCount.textContent = text || '';
    this.boardCount.classList.toggle('free', !!(text && free));
  }

  startCombat(sim, flip, allySide) {
    this.allySide = allySide || (flip ? 'B' : 'A');
    this.unitLayer.querySelectorAll('.unit:not(.bench-top):not(.bench-bottom)').forEach(el => el.remove());
    this.clearFieldFx();
    this.fx.innerHTML = '';
    this.cunits = {};
    this.sim = sim;
    this.flip = flip;
    for (const u of sim.units) {
      if (!u.alive) continue;
      this.createCombatUnit(u);
    }
    this.combatFieldFx();
    for (const side of ['A', 'B']) if (sim.side[side].shadows) this.drawShadows(side, sim.side[side].shadows);
    this.updateBars();
  }

  serpentFlat(x, y) {
    let col = x;
    let row = y / SERPENT.yk;
    if (this.flip) {
      col = BOARD_COLS - 0.5 - col;
      row = BOARD_ROWS - 1 - row;
    }
    return { x: View.BOARD_X + col * View.CELL_W + View.CELL_W / 2, y: View.BOARD_Y + row * View.ROW_STEP + View.CELL_H / 2 };
  }

  createSerpent(u) {
    const segs = [];
    for (let i = 1; i < SERPENT.segs; i++) {
      const el = document.createElement('div');
      el.className = 'serpent-seg' + (i === SERPENT.segs - 1 ? ' tail' : '');
      this.unitLayer.appendChild(el);
      segs.push(el);
    }
    this.serpents[u.uid] = { u, segs };
  }

  updateSerpents() {
    for (const uid in this.serpents) {
      const sp = this.serpents[uid];
      const u = sp.u;
      const e = this.cunits[uid];
      if (!u.alive || !e) {
        for (const el of sp.segs) el.remove();
        delete this.serpents[uid];
        continue;
      }
      const S = u.serpent;
      const segs = S.segs;
      const swim = S.mode === 'swim';
      for (let i = 1; i < segs.length; i++) {
        const el = sp.segs[i - 1];
        const g = segs[i];
        if (!swim || g.h <= -0.3) {
          el.style.display = 'none';
          continue;
        }
        const f = this.serpentFlat(g.x, g.y);
        const p = Proj.toScreen(f.x, f.y);
        const s = Proj.depthScale(f.y);
        const size = Math.max(16, 42 - i * 1.3) * s;
        const lift = Math.max(0, g.h) * 36 * s;
        el.style.display = '';
        el.classList.toggle('sub', g.h <= 0);
        el.style.width = size + 'px';
        el.style.height = (g.h <= 0 ? size * 0.45 : size) + 'px';
        el.style.left = (p.x - size / 2) + 'px';
        el.style.top = (p.y - lift - (g.h <= 0 ? size * 0.2 : size * 0.75)) + 'px';
        el.style.zIndex = String(100 + Math.round(p.y));
      }
      let hx = S.x;
      let hy = S.y;
      let lift = 0;
      let visible = true;
      if (swim) {
        const h0 = segs[0].h;
        lift = Math.max(0, h0) * 44;
        visible = h0 > -0.2;
      } else if (S.mode === 'dive') {
        visible = S.modeT < 0.35;
      } else if (S.mode === 'rise') {
        lift = (S.modeT / 0.6) * 320;
      } else if (S.mode === 'sky') {
        const m = hexMetric(S.impact[0], S.impact[1]);
        hx = m.x;
        hy = m.y;
        visible = S.modeT > 0.45;
        lift = Math.max(0, (0.8 - S.modeT) / 0.35) * 320;
      }
      const f = this.serpentFlat(hx, hy);
      e.el.style.transitionDuration = '0s';
      const p = placeSprite(e.el, f.x, f.y, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE * 1.35);
      if (e.el._spr) {
        const st = e.el._spr;
        if (!sp.last) sp.last = { x: p.x, y: p.y };
        else if (Math.hypot(p.x - sp.last.x, p.y - sp.last.y) > 3) {
          Sprites.face(st, Sprites.dirFrom(p.x - sp.last.x, p.y - sp.last.y));
          sp.last = { x: p.x, y: p.y };
        }
        Sprites.base(st, swim ? 'walk' : 'idle', this.app.speed || 1);
      }
      e.el.style.top = Math.round(p.y - lift) + 'px';
      e.el.style.zIndex = String(101 + Math.round(p.y));
      e.el.classList.toggle('submerged', !visible);
    }
  }

  drawShadows(side, count) {
    const top = this.isFoeSide(side);
    const player = this.benchPlayers[top ? 'top' : 'bottom'];
    const list = this.shadowEls[side];
    const caster = this.sim && this.sim.units.find(u => u.side === side && u.shadowCaster);
    if (!caster) return;
    const free = [];
    for (let i = 0; i < CONFIG.benchSize; i++) if (!player || !player.bench[i]) free.push(i);
    while (list.length < Math.min(count, free.length)) {
      const i = free[list.length];
      const el = View.unitEl({ className: 'unit shadow-token', name: '그림자', form: caster.form, types: caster.types, star: caster.star, cost: caster.cost });
      const sc = slotCenter(i, top);
      placeSprite(el, sc.x, sc.y + 8, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE);
      el._slot = { x: sc.x, y: sc.y };
      this.unitLayer.appendChild(el);
      list.push(el);
    }
  }

  mapCell(r, c) {
    return this.flip ? Hex.mirror(r, c) : [r, c];
  }

  combatFlat(r, c) {
    const [rr, cc] = this.mapCell(r, c);
    return View.cellCenter(rr, cc);
  }

  combatPos(r, c) {
    const f = this.combatFlat(r, c);
    return Proj.toScreen(f.x, f.y);
  }

  isEnemySide(u) {
    return u.side !== (this.allySide || (this.flip ? 'B' : 'A'));
  }

  createCombatUnit(u) {
    const def = u.unitId ? UNITS[u.unitId] : null;
    const el = View.unitEl({
      className: 'unit cunit' + (this.isEnemySide(u) ? ' enemy' : '') + (u.creep ? ' creep' : ''),
      name: u.name,
      form: u.form,
      types: u.types,
      star: u.star,
      cost: u.cost,
      badge: View.badgeFor(def),
      ditto: u.ditto,
      items: u.items,
      dir: this.isFoeSide(u.side) ? SPRITE_DIR.down : SPRITE_DIR.up
    });
    const barSet = View.unitBars(el, u.maxHp);
    const { hpFill, shFill, manaFill } = barSet;
    const status = document.createElement('div');
    status.className = 'status';
    el.appendChild(status);
    const f = this.combatFlat(u.r, u.c);
    el.style.transitionDuration = '0s';
    placeSprite(el, f.x, f.y, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE);
    el.addEventListener('pointerdown', e => this.app.onTokenPointerDown(e, { combat: u }, el));
    this.unitLayer.appendChild(el);
    this.cunits[u.uid] = { el, hpFill, shFill, manaFill, barSet, itemEls: [], itemKey: null, flags: '', pos: Proj.toScreen(f.x, f.y), walkUntil: 0, walkDir: null };
    this.syncItemRow(this.cunits[u.uid], u);
    if (u.serpent) {
      el.classList.add('serpent-head');
      if (el._spr) Sprites.setScale(el._spr, 0.62);
      if (!this.serpents[u.uid]) this.createSerpent(u);
    }
    if (u.egg) el.classList.add('egg');
  }

  syncItemRow(e, u) {
    const key = (u.items || []).join(',');
    if (e.itemKey === key) return;
    e.itemKey = key;
    const el = e.el;
    const old = el.querySelector('.unit-items');
    if (old) old.remove();
    e.itemEls = [];
    el.classList.toggle('has-items', !!(u.items && u.items.length));
    if (!u.items || !u.items.length) return;
    const row = document.createElement('div');
    row.className = 'unit-items';
    for (const id of u.items) {
      const ico = View.itemIcon(id, u.items.length > 3 ? 12 : 16);
      row.appendChild(ico);
      if (View.itemStack(u, id, 0) === null) continue;
      const b = document.createElement('b');
      ico.appendChild(b);
      e.itemEls.push({ id, b, v: -1 });
    }
    el.appendChild(row);
  }

  updateBars() {
    if (!this.sim) return;
    const now = this.sim.time;
    for (const u of this.sim.units) {
      const e = this.cunits[u.uid];
      if (!e) continue;
      const total = Math.max(u.maxHp, u.hp + u.shield);
      View.setTicks(e.barSet, total);
      e.hpFill.style.width = Math.max(0, (u.hp / total) * 100) + '%';
      e.shFill.style.left = Math.max(0, (u.hp / total) * 100) + '%';
      e.shFill.style.width = Math.max(0, (u.shield / total) * 100) + '%';
      e.manaFill.style.width = Math.max(0, (u.mana / u.maxMana) * 100) + '%';
      if (e.itemKey !== (u.items || []).join(',')) this.syncItemRow(e, u);
      if (e.itemEls) {
        for (const it of e.itemEls) {
          const v = View.itemStack(u, it.id, now);
          if (v === it.v) continue;
          it.v = v;
          it.b.textContent = v > 0 ? String(Math.round(v)) : '';
        }
      }
      let flags = '';
      if (u.sleep && !u.sleep.awake) flags += ' sleeping';
      if (u.egg) flags += ' egg';
      else if (u.frozenUntil > now) flags += ' frozen';
      else if (u.stunUntil > now) flags += ' stunned';
      else if (u.paraUntil > now) flags += ' paralyzed';
      else if (u.confUntil > now) flags += ' confused';
      if (u.poisonUntil > now) flags += u.toxicSince ? ' toxic poisoned' : ' poisoned';
      if (u.burnUntil > now) flags += ' burned';
      if (u.chill > 0 && u.chillUntil > now) flags += ' chilled';
      if (u.endureUntil > now) flags += ' enduring';
      if (flags !== e.flags) {
        for (const c of ['sleeping', 'egg', 'frozen', 'stunned', 'paralyzed', 'confused', 'toxic', 'poisoned', 'burned', 'chilled', 'enduring']) e.el.classList.toggle(c, flags.includes(' ' + c));
        e.flags = flags;
      }
    }
    this.updateSerpents();
    this.updateSprites();
  }

  spriteAction(uid, targetUid, key) {
    const e = this.cunits[uid];
    const u = this.sim && this.sim.byUid[uid];
    if (!e || !u || !e.el._spr) return;
    const st = e.el._spr;
    const t = targetUid != null ? this.sim.byUid[targetUid] : null;
    if (t && !u.serpent) {
      const a = this.combatPos(u.r, u.c);
      const b = this.combatPos(t.r, t.c);
      Sprites.face(st, Sprites.dirFrom(b.x - a.x, b.y - a.y));
    }
    const speed = this.app.speed || 1;
    let interval = 1;
    if (key === 'attack') {
      const as = this.sim.attackSpeed ? this.sim.attackSpeed(u) : 1;
      interval = Math.min(1, 0.9 / Math.max(0.2, as));
    } else {
      interval = 0.9;
    }
    Sprites.once(st, key, interval / speed);
  }

  updateSprites() {
    if (!this.sim) return;
    const now = performance.now();
    const time = this.sim.time;
    const speed = this.app.speed || 1;
    for (const u of this.sim.units) {
      const e = this.cunits[u.uid];
      if (!e || !e.el._spr || u.serpent) continue;
      const st = e.el._spr;
      st.paused = !!(u.alive && (u.frozenUntil > time || u.egg));
      const asleep = (u.sleep && !u.sleep.awake) || u.stunUntil > time;
      const walking = e.walkUntil > now;
      let dir = null;
      if (walking) dir = e.walkDir;
      else if (!asleep) {
        const t = u.target && u.target.alive ? u.target : null;
        if (t) {
          const a = this.combatPos(u.r, u.c);
          const b = this.combatPos(t.r, t.c);
          dir = Sprites.dirFrom(b.x - a.x, b.y - a.y);
        }
      }
      if (dir != null) Sprites.face(st, dir);
      Sprites.base(st, asleep ? 'sleep' : walking ? 'walk' : 'idle', walking ? speed : 1);
    }
  }

  flash(el, cls, ms) {
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  applyEvents(events) {
    const speed = this.app.speed;
    for (const ev of events) {
      if (ev.type === 'move') {
        const e = this.cunits[ev.uid];
        if (!e) continue;
        const f = this.combatFlat(ev.r, ev.c);
        e.el.style.transitionDuration = (ev.duration / speed) + 's';
        placeSprite(e.el, f.x, f.y, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE);
        const np = Proj.toScreen(f.x, f.y);
        const dir = Sprites.dirFrom(np.x - e.pos.x, np.y - e.pos.y);
        if (dir != null) e.walkDir = dir;
        e.pos = np;
        e.walkUntil = performance.now() + (ev.duration / speed) * 1000;
      } else if (ev.type === 'attack') {
        const e = this.cunits[ev.uid];
        if (e) this.flash(e.el, 'attack', 110 / speed);
        if (e && e.el._spr) this.spriteAction(ev.uid, ev.target, 'attack');
        if (ev.ranged) this.projectile(ev.uid, ev.target, (ev.special ? 'special' : '') + (ev.fan ? ' fan' : ''));
      } else if (ev.type === 'skill') {
        const e = this.cunits[ev.uid];
        if (e) this.flash(e.el, 'casting', 260 / speed);
        if (e && e.el._spr) this.spriteAction(ev.uid, ev.target, ev.special ? 'special' : 'physical');
        this.projectile(ev.uid, ev.target, 'skill' + (ev.special ? ' special' : '') + (ev.enhanced ? ' enhanced' : ''));
        if (ev.enhanced) this.floatText(ev.uid, '강화', 'buff');
      } else if (ev.type === 'damage') {
        const e = this.cunits[ev.target];
        if (e && (ev.kind === 'basic' || ev.kind === 'skill')) this.flash(e.el, 'hit', 90);
        if (ev.kind === 'execute') this.floatText(ev.target, '처형', 'execute');
        else this.damageNumber(ev.target, ev.amount, ev.crit, ev.special, ev.kind);
      } else if (ev.type === 'miss') {
        this.floatText(ev.target, '빗나감', 'miss');
      } else if (ev.type === 'heal') {
        if (ev.amount >= 3) this.floatText(ev.target, '+' + Math.round(ev.amount), 'heal');
      } else if (ev.type === 'stun') {
        const label = { flinch: '풀죽음', airborne: '공중', quake: '기절', stun: '기절', lightning: '기절', sleep: '잠듦', recharge: '반동', seal: '봉인' }[ev.kind];
        if (label) this.floatText(ev.target, label, 'cc');
      } else if (ev.type === 'skillfx') {
        const cells = ev.radius * 2 + 1.2;
        const el = this.cellFx(ev.r, ev.c, 'fx-skill' + (ev.heal ? ' heal' : '') + (ev.slam ? ' slam' : ''), Math.min(cells, 13), 520);
        el.style.setProperty('--fx-color', TYPE_COLORS[ev.kind] || '#ffffff');
        if (ev.slam) this.flash(this.root, 'shake', 420);
      } else if (ev.type === 'hitfx') {
        const p = this.unitPos(ev.target);
        if (p) {
          const el = document.createElement('div');
          el.className = 'fx-hit';
          el.style.left = p.x + 'px';
          el.style.top = (p.y - 20) + 'px';
          el.style.setProperty('--fx-color', TYPE_COLORS[ev.kind] || '#ffffff');
          this.fx.appendChild(el);
          setTimeout(() => el.remove(), 320);
        }
      } else if (ev.type === 'hide') {
        const e = this.cunits[ev.uid];
        if (e) e.el.classList.toggle('hiding', ev.on);
      } else if (ev.type === 'mark') {
        this.cellFx(ev.r, ev.c, 'fx-target', 1.1, 2000 / speed);
      } else if (ev.type === 'wake') {
        this.floatText(ev.uid, '기상!', 'buff');
      } else if (ev.type === 'gold') {
        this.floatText(ev.target, '+' + ev.amount + 'G', 'gold');
      } else if (ev.type === 'rocks') {
        for (const [r, c] of ev.cells) this.cellFx(r, c, 'fx-rock', 0.5, 0);
      } else if (ev.type === 'status') {
        const label = { toxic: '맹독', burn: '화상', para: '마비', confuse: '혼란' }[ev.kind];
        if (label) this.floatText(ev.target, label, 'st-' + ev.kind);
      } else if (ev.type === 'fail') {
        this.floatText(ev.target, ev.kind === 'para' ? '몸이 저림' : '혼란', 'st-' + ev.kind);
      } else if (ev.type === 'retype') {
        const txt = ev.kind === 'mew' ? ev.move : ev.kind === 'mimic' ? '흉내: ' + ev.value : ev.kind === 'suggest' ? '자기암시' : (ev.kind === 'def' ? '방어 ' : '') + ev.value;
        this.floatText(ev.uid, txt, 'retype');
      } else if (ev.type === 'egg') {
        const e = this.cunits[ev.uid];
        if (e) e.el.classList.add('egg');
        this.floatText(ev.uid, '불타는 알', 'execute');
      } else if (ev.type === 'hatch') {
        const e = this.cunits[ev.uid];
        if (e) e.el.classList.remove('egg');
        this.floatText(ev.uid, '부활', 'buff');
        const el = document.createElement('div');
        el.className = 'fx-hatch';
        el.style.clipPath = this.fieldPolygon();
        this.fx.appendChild(el);
        this.flash(this.root, 'shake', 420);
        setTimeout(() => el.remove(), 900);
      } else if (ev.type === 'shadow') {
        this.drawShadows(ev.side, ev.count);
      } else if (ev.type === 'shadowcast') {
        const el = this.shadowEls[ev.side][ev.index - 1];
        const b = this.unitPos(ev.target);
        if (el && b) {
          this.flash(el, 'casting', 200);
          const a = Proj.toScreen(el._slot.x, el._slot.y);
          this.projectileXY(a, b, 'skill shadow');
        }
      } else if (ev.type === 'psywave') {
        const el = document.createElement('div');
        el.className = 'fx-psy';
        el.style.clipPath = this.fieldPolygon();
        this.fx.appendChild(el);
        setTimeout(() => el.remove(), 2000 / speed);
        for (const uid of ev.targets) {
          const e = this.cunits[uid];
          if (e) this.flash(e.el, 'lifted', 2000 / speed);
        }
      } else if (ev.type === 'slam') {
        this.flash(this.root, 'shake', 420);
        for (const uid of ev.targets) this.unitFx(uid, 'fx-dust', 500);
      } else if (ev.type === 'heart') {
        this.floatText(ev.uid, '치유의 마음', 'heal');
        const el = document.createElement('div');
        el.className = 'fx-heart';
        el.style.clipPath = this.fieldPolygon();
        this.fx.appendChild(el);
        setTimeout(() => el.remove(), 800);
      } else if (ev.type === 'serpent') {
        if (ev.mode === 'rise') this.cellFx(ev.r, ev.c, 'fx-splash', 2.2, 700);
        if (ev.mode === 'sky') this.cellFx(ev.r, ev.c, 'fx-target', 3.2, 800 / speed);
        if (ev.mode === 'dive') {
          const u = this.sim && this.sim.byUid[ev.uid];
          if (u) this.cellFx(u.r, u.c, 'fx-splash', 1.2, 500);
        }
      } else if (ev.type === 'splash') {
        this.cellFx(ev.r, ev.c, 'fx-wave', 6.4, 650);
        this.flash(this.root, 'shake', 420);
      } else if (ev.type === 'freeze') {
        this.floatText(ev.target, '빙결', 'ice');
      } else if (ev.type === 'buff') {
        const label = { endure: '버티기', warrior: '학살자의 각오', bug: '회복', harden: '단단해지기', break: '보호막 파괴', thunder: '흡수', frenzy: '야단법석', cleanse: '정화', sash: '기합의띠', cloak: '은밀망토', policy: '약점보험', boost: '부스트 완료', tshield: '녹슨방패', lifeorb: '생명의구슬', room: '매직룸', steal: '도구 강탈', mirror: '미러코트', wish: '치유소원', bulk: '벌크업', bulkon: '벌크업 완료' }[ev.kind];
        if (label) this.floatText(ev.target, label, 'buff');
      } else if (ev.type === 'death') {
        const e = this.cunits[ev.uid];
        if (e) {
          e.el.classList.add('dead');
          const el = e.el;
          setTimeout(() => el.remove(), 400);
          delete this.cunits[ev.uid];
        }
      } else if (ev.type === 'revive') {
        const u = this.sim && this.sim.byUid[ev.uid];
        if (u) {
          if (this.cunits[ev.uid]) this.cunits[ev.uid].el.remove();
          this.createCombatUnit(u);
          this.floatText(ev.uid, '부활', 'buff');
        }
      } else if (ev.type === 'lightning') {
        for (const uid of ev.targets) this.unitFx(uid, 'fx-bolt', 450);
      } else if (ev.type === 'field' && ev.kind === 'electric') {
        if (!this.fx.querySelector('.fx-elec')) {
          const el = document.createElement('div');
          el.className = 'fx-elec';
          this.fx.appendChild(el);
        }
      } else if (ev.type === 'field' && ev.kind === 'fire') {
        if (!this.fx.querySelector('.fx-fire')) {
          const el = document.createElement('div');
          el.className = 'fx-fire';
          this.fx.appendChild(el);
        }
      } else if (ev.type === 'storm') {
        this.drawStorm(ev);
      } else if (ev.type === 'whirl') {
        this.cellFx(ev.r, ev.c, 'fx-whirl', 1.6, 600);
      } else if (ev.type === 'tsunami') {
        const el = document.createElement('div');
        el.className = 'fx-tsunami' + (this.isFoeSide(ev.side) ? ' rev' : '');
        this.fx.appendChild(el);
        setTimeout(() => el.remove(), 900);
      } else if (ev.type === 'quake') {
        this.flash(this.root, 'shake', 420);
        for (const uid of ev.targets) this.unitFx(uid, 'fx-dust', 500);
      } else if (ev.type === 'explode') {
        this.cellFx(ev.r, ev.c, 'fx-ice', 1.4, 500);
      } else if (ev.type === 'spikes') {
        for (const [r, c] of ev.cells) this.cellFx(r, c, 'fx-spike', 0.5, 0);
      } else if (ev.type === 'wave') {
        const u = this.sim && this.sim.byUid[ev.uid];
        if (u) this.cellFx(u.r, u.c, 'fx-wave', 2.6, 550);
      } else if (ev.type === 'supernova') {
        this.supernova(ev);
      } else if (ev.type === 'magicroom') {
        const el = document.createElement('div');
        el.className = 'fx-room';
        el.style.clipPath = this.fieldPolygon();
        this.fx.appendChild(el);
        setTimeout(() => el.remove(), 900);
      }
    }
  }

  supernova(ev) {
    const p = this.unitPos(ev.uid);
    if (!p) return;
    const T = 1100 / this.app.speed;
    const colors = (ev.types && ev.types.length ? ev.types : ['에스퍼']).map(t => TYPE_COLORS[t] || '#ffffff');
    const top = { x: p.x, y: p.y - 78 };
    const n = colors.length;
    colors.forEach((col, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const sx = p.x + Math.cos(a) * 36;
      const sy = p.y - 26 + Math.sin(a) * 22;
      const o = document.createElement('div');
      o.className = 'fx-nova-orb';
      o.style.setProperty('--c', col);
      o.style.left = sx + 'px';
      o.style.top = sy + 'px';
      this.fx.appendChild(o);
      const dx = top.x - sx;
      const dy = top.y - sy;
      o.animate([
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1, offset: 0.3 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(0.5)', opacity: 0.9 }
      ], { duration: T * 0.58, delay: i * T * 0.03, easing: 'ease-in', fill: 'forwards' });
      setTimeout(() => o.remove(), T * 0.62 + i * T * 0.03);
    });
    const ring = colors.concat(colors[0]).join(', ');
    const core = document.createElement('div');
    core.className = 'fx-nova-core';
    core.style.background = 'radial-gradient(circle, #ffffff 0 22%, rgba(255, 255, 255, 0) 60%), conic-gradient(' + ring + ')';
    core.style.left = top.x + 'px';
    core.style.top = top.y + 'px';
    this.fx.appendChild(core);
    const box = this.cellBox(ev.r, ev.c, 1);
    const tx = box.x - top.x;
    const ty = box.y - 16 - top.y;
    core.animate([
      { transform: 'translate(-50%, -50%) scale(0.1) rotate(0deg)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(0.2) rotate(60deg)', opacity: 0, offset: 0.45 },
      { transform: 'translate(-50%, -50%) scale(1.15) rotate(240deg)', opacity: 1, offset: 0.66 },
      { transform: 'translate(-50%, -50%) scale(1) rotate(300deg)', opacity: 1, offset: 0.74 },
      { transform: 'translate(calc(-50% + ' + tx + 'px), calc(-50% + ' + ty + 'px)) scale(1.35) rotate(520deg)', opacity: 1 }
    ], { duration: T, easing: 'linear', fill: 'forwards' });
    setTimeout(() => {
      core.remove();
      const u = this.sim && this.sim.byUid[ev.uid];
      if (!u || !u.alive) return;
      const blast = this.cellFx(ev.r, ev.c, 'fx-nova-blast', Math.min(ev.radius * 2 + 1.6, 13), 750);
      blast.style.setProperty('--ring', 'conic-gradient(' + ring + ')');
      blast.style.setProperty('--c0', colors[0]);
      this.flash(this.root, 'shake', 420);
    }, T);
  }

  goldPop(sprite) {
    if (!sprite || !sprite.el || sprite.el.style.display === 'none') return;
    const el = document.createElement('div');
    el.className = 'strat-gold';
    el.textContent = '+1G';
    sprite.el.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  isFoeSide(side) {
    const bottomSide = this.flip ? 'B' : 'A';
    return side !== bottomSide;
  }

  unitPos(uid) {
    const u = this.sim && this.sim.byUid[uid];
    return u ? this.combatPos(u.r, u.c) : null;
  }

  cellBox(r, c, cells) {
    const f = this.combatFlat(r, c);
    const R = cells * 27;
    const a = Proj.toScreen(f.x - R, f.y);
    const b = Proj.toScreen(f.x + R, f.y);
    const t = Proj.toScreen(f.x, f.y - R * 0.85);
    const d = Proj.toScreen(f.x, f.y + R * 0.85);
    const p = Proj.toScreen(f.x, f.y);
    return { x: p.x, y: p.y, w: Math.abs(b.x - a.x), h: Math.abs(d.y - t.y) };
  }

  cellFx(r, c, cls, cells, ms) {
    const box = this.cellBox(r, c, cells);
    const el = document.createElement('div');
    el.className = 'fx-cell ' + cls;
    el.style.left = box.x + 'px';
    el.style.top = box.y + 'px';
    el.style.width = box.w + 'px';
    el.style.height = box.h + 'px';
    this.fx.appendChild(el);
    if (ms) setTimeout(() => el.remove(), ms);
    return el;
  }

  unitFx(uid, cls, ms) {
    const p = this.unitPos(uid);
    if (!p) return;
    const el = document.createElement('div');
    el.className = cls;
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    this.fx.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  drawStorm(ev) {
    let el = this.fx.querySelector('.fx-storm[data-side="' + ev.side + '"]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'fx-cell fx-storm';
      el.dataset.side = ev.side;
      el.appendChild(document.createElement('i'));
      this.fx.appendChild(el);
    }
    const box = this.cellBox(ev.r, ev.c, Math.min(ev.radius, 6) + 0.5);
    el.style.left = box.x + 'px';
    el.style.top = box.y + 'px';
    el.style.width = box.w + 'px';
    el.style.height = box.h + 'px';
    if (ev.finale) {
      el.classList.add('finale');
      setTimeout(() => el.remove(), 900);
    }
  }

  projectile(fromUid, toUid, cls) {
    this.projectileXY(this.unitPos(fromUid), this.unitPos(toUid), cls);
  }

  projectileXY(a, b, cls) {
    if (!a || !b) return;
    const el = document.createElement('div');
    el.className = 'proj' + (cls ? ' ' + cls : '');
    el.style.transitionDuration = '0s';
    el.style.left = a.x + 'px';
    el.style.top = (a.y - 20) + 'px';
    this.fx.appendChild(el);
    void el.offsetWidth;
    const d = 0.18 / this.app.speed;
    el.style.transitionDuration = d + 's';
    el.style.left = b.x + 'px';
    el.style.top = (b.y - 20) + 'px';
    setTimeout(() => el.remove(), d * 1000 + 30);
  }

  damageNumber(uid, amount, crit, special, kind) {
    const p = this.unitPos(uid);
    if (!p) return;
    const el = document.createElement('div');
    el.className = 'dmg' + (crit ? ' crit' : '') + (special ? ' special' : '') + (kind && kind !== 'basic' && kind !== 'skill' ? ' k-' + kind : '') + (kind === 'skill' ? ' skill' : '');
    el.textContent = amount;
    el.style.left = (p.x + (Math.random() * 16 - 8)) + 'px';
    el.style.top = (p.y - 52) + 'px';
    this.fx.appendChild(el);
    setTimeout(() => el.remove(), 720);
  }

  floatText(uid, text, cls) {
    const p = this.unitPos(uid);
    if (!p) return;
    const el = document.createElement('div');
    el.className = 'dmg ftext ' + cls;
    el.textContent = text;
    el.style.left = (p.x + (Math.random() * 10 - 5)) + 'px';
    el.style.top = (p.y - 64) + 'px';
    this.fx.appendChild(el);
    setTimeout(() => el.remove(), 720);
  }

  renderOrbs(orbs) {
    this.orbLayer.innerHTML = '';
    this.orbEls = {};
    for (const o of orbs) {
      const el = document.createElement('div');
      el.className = 'orb-loot ' + o.tier;
      el.appendChild(document.createElement('i'));
      const p = View.cellCenter(o.r, o.c);
      o.x = p.x + (((o.id * 37) % 21) - 10);
      o.y = p.y + (((o.id * 53) % 15) - 7);
      placeSprite(el, o.x, o.y, 17, 24);
      this.orbLayer.appendChild(el);
      this.orbEls[o.id] = el;
    }
  }

  carouselSpawn(index, count) {
    return carouselSpawnFlat(index, count);
  }

  itemPos(item) {
    const R = CONFIG.carousel.ringRadius;
    return { x: CAROUSEL_CENTER.x + Math.cos(item.angle) * R, y: CAROUSEL_CENTER.y + Math.sin(item.angle) * R };
  }
}
