const PHASE_LABEL = { planning: '준비', combat: '전투', carousel: '회전초밥', result: '결과', over: '종료' };

class App {
  constructor(opts) {
    const o = opts || { mode: 'solo' };
    this.mode = o.mode === 'mp' ? 'mp' : 'solo';
    this.net = o.net || null;
    this.ranked = !!o.ranked;
    this.game = this.mode === 'mp'
      ? new Game({ seed: o.seed, seats: o.seats, localSlot: o.slot, realtime: true })
      : new Game({ humanName: o.name || '나', look: o.look, map: o.map, realtime: true });
    this.human = this.game.human;
    this.driver = new Driver(this.game, { mp: this.mode === 'mp' });
    this.pending = [];
    this.netQueue = [];
    this.replaying = false;
    this.tickAcc = 0;
    this.branchSent = new Set();
    this.speed = 1;
    this.viewId = this.human.id;
    this.rightMode = 'players';
    this.dmgState = { tab: 'dealt', expanded: false };
    this.selected = null;
    this.hoverInst = null;
    this.dragging = false;
    this.timeLeft = 0;
    this.timerTotal = 1;
    this.modalKind = null;
    this.combatRunning = false;
    this.ending = false;
    this.acc = 0;
    this.lastMatches = [];
    this.campCache = { label: null, specs: [] };
    this.carouselScene = null;
    this.arenaKey = null;
    this.simSeq = 1;
    this.dmgTimer = 0;
    this.infoTimer = 0;
    this.renderQueued = false;
    this.traitPage = 0;
    this.viewCarousel = false;
    this.tipTrait = null;
    this.tipTop = 0;
    this.tipTimer = null;
    this.$ = id => document.getElementById(id);
    this.gameEl = this.$('game');
    Floor.mapId = this.human.mapId;
    this.arena = new Arena(this);
    Floor.prerender([this.human.mapId].concat(this.game.players.map(p => p.mapId), CONFIG.maps));
    this.setupStatic();
    this.setupItemTip();
    this.bindControls();
    this.bindGameEvents();
    this.planner = new Planner(this);
    Assets.onLoad(() => this.requestRender());
    this.fitScreen();
    window.addEventListener('resize', () => this.fitScreen());
    this.last = performance.now();
    if (this.mode === 'mp') {
      this.$('btn-speed').style.display = 'none';
      this.$('btn-debug').style.display = 'none';
    }
    requestAnimationFrame(t => this.loop(t));
    this.driver.start();
  }

  act(a) {
    if (!this.human) return;
    if (this.mode === 'mp') {
      if (this.net) this.net.send({ t: 'act', a });
    } else this.pending.push([this.human.id, a]);
  }

  pushTicks(list) {
    for (const t of list) this.netQueue.push(t);
  }

  fitScreen() {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    this.scale = s > 0 ? s : 1;
    this.gameEl.style.transform = 'scale(' + this.scale + ')';
  }

  toGame(x, y) {
    const r = this.gameEl.getBoundingClientRect();
    return { x: (x - r.left) / this.scale, y: (y - r.top) / this.scale };
  }

  setupStatic() {
    View.renderItems(this.$('items'));
    this.$('btn-ready').innerHTML = iconSvg('check', 20);
    this.$('btn-speed').insertAdjacentHTML('afterbegin', iconSvg('speed', 20));
    this.$('btn-debug').innerHTML = iconSvg('gear', 20);
    this.$('btn-credit').innerHTML = iconSvg('info', 20);
    this.$('btn-sound').classList.toggle('muted', Sound.muted);
    this.$('encounter-icon').innerHTML = iconSvg('encounter', 16);
    this.$('gold-icon').innerHTML = iconSvg('coin', 16);
    this.$('btn-xp').innerHTML = iconSvg('xpup', 20) + '<span class="lbl">경험치 구매<small>' + iconSvg('coin', 10) + CONFIG.xpCost + '</small></span>';
    this.$('btn-reroll').innerHTML = iconSvg('refresh', 20) + '<span class="lbl">새로고침<small>' + iconSvg('coin', 10) + CONFIG.rerollCost + '</small></span>';
  }

  setupItemTip() {
    const tip = this.$('item-tip');
    const tip2 = this.$('item-tip2');
    this.itemTip = null;
    this.mouse = { x: 0, y: 0 };
    for (const el of [tip, tip2]) {
      el.addEventListener('mouseenter', () => clearTimeout(this.itemTipTimer));
      el.addEventListener('mouseleave', () => this.hideItemTipSoon());
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-pick]');
        if (!t || !this.itemTip || this.itemTip.preview) return;
        this.itemTip.side = t.dataset.pick;
        this.renderItemTip();
      });
    }
    tip.addEventListener('pointerdown', e => {
      if (e.button !== 2) return;
      e.preventDefault();
      e.stopPropagation();
      this.toggleItemRecipe(null);
    });
    tip2.addEventListener('pointerdown', e => {
      if (e.button !== 2) return;
      e.preventDefault();
      e.stopPropagation();
    });
    this.gameEl.addEventListener('pointermove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }

  inItemTipZone() {
    const t = this.itemTip;
    if (!t) return false;
    const els = [this.$('item-tip'), this.$('item-tip2')];
    if (t.anchor && document.contains(t.anchor)) els.push(t.anchor);
    const m = 8 * (this.scale || 1);
    const { x, y } = this.mouse;
    for (const el of els) {
      if (el.id && !el.classList.contains('show')) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m) return true;
    }
    return false;
  }

  showItemTip(anchor, id) {
    clearTimeout(this.itemTipTimer);
    this.hideTooltip();
    const t = this.itemTip;
    if (!t || t.preview || t.anchor !== anchor || t.anchorId !== id) this.itemTip = { id, anchorId: id, mode: 'info', anchor, side: null };
    this.placeItemTip();
  }

  placeItemTip() {
    const t = this.itemTip;
    if (!t || !t.anchor) return;
    const r = t.anchor.getBoundingClientRect();
    t.rect = { l: this.toGame(r.left, r.top), r: this.toGame(r.right, r.bottom) };
    this.renderItemTip();
  }

  renderItemTip() {
    const t = this.itemTip;
    const tip = this.$('item-tip');
    const tip2 = this.$('item-tip2');
    if (!t) {
      tip.classList.remove('show');
      tip2.classList.remove('show');
      return;
    }
    View.renderItemTip(tip, t.id, t.mode, { pick: !t.preview, preview: !!t.preview });
    tip.classList.add('show');
    tip.classList.toggle('preview', !!t.preview);
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let x;
    let y;
    let flip = false;
    if (t.preview) {
      x = t.at.x + 26;
      y = t.at.y - h / 2;
      if (x + w > 1276) x = t.at.x - w - 26;
    } else {
      x = t.rect.r.x + 8;
      y = t.rect.l.y - 4;
      if (x + w > 1276) {
        x = t.rect.l.x - w - 8;
        flip = true;
      }
    }
    x = Math.max(4, x);
    y = Math.max(4, Math.min(716 - h, y));
    if (t.side && !t.preview) {
      View.renderItemTip(tip2, t.side, 'info', { pick: true });
      tip2.classList.add('show');
      const w2 = tip2.offsetWidth;
      const h2 = tip2.offsetHeight;
      let x2 = flip ? x - w2 + 2 : x + w - 2;
      if (!flip && x2 + w2 > 1276) {
        if (x - w2 + 2 >= 4) x2 = x - w2 + 2;
        else {
          x = Math.max(4, 1276 - w - w2 + 2);
          x2 = x + w - 2;
        }
      }
      if (flip && x2 < 4) {
        x2 = 4;
        x = x2 + w2 - 2;
      }
      tip2.style.left = x2 + 'px';
      tip2.style.top = Math.max(4, Math.min(716 - h2, y)) + 'px';
    } else tip2.classList.remove('show');
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  hideItemTipSoon() {
    if (this.itemTip && this.itemTip.preview) return;
    clearTimeout(this.itemTipTimer);
    this.itemTipTimer = setTimeout(() => {
      if (this.itemTip && this.itemTip.preview) return;
      if (this.inItemTipZone()) this.hideItemTipSoon();
      else this.hideItemTip();
    }, 300);
  }

  hideItemTip() {
    clearTimeout(this.itemTipTimer);
    this.itemTip = null;
    this.$('item-tip').classList.remove('show');
    this.$('item-tip2').classList.remove('show');
  }

  toggleItemRecipe(anchor) {
    if (anchor) {
      const id = anchor.dataset.item;
      if (!this.itemTip || this.itemTip.anchor !== anchor) this.showItemTip(anchor, id);
    }
    const t = this.itemTip;
    if (!t || t.preview) return;
    const d = itemDef(t.id);
    if (d && d.kind === 'component') t.mode = t.mode === 'recipe' ? 'info' : 'recipe';
    this.renderItemTip();
  }

  showItemPreview(id, x, y) {
    clearTimeout(this.itemTipTimer);
    if (!id) {
      this.hideItemPreview();
      return;
    }
    const t = this.itemTip;
    if (t && t.preview && t.id === id) {
      t.at = { x, y };
      this.renderItemTip();
      return;
    }
    this.itemTip = { id, mode: 'info', preview: true, at: { x, y } };
    this.renderItemTip();
  }

  hideItemPreview() {
    if (this.itemTip && this.itemTip.preview) this.hideItemTip();
  }

  reanchorItemTip() {
    const t = this.itemTip;
    if (!t || t.preview || !t.anchor || document.contains(t.anchor)) return;
    const el = document.elementFromPoint(this.mouse.x, this.mouse.y);
    const tipEl = this.$('item-tip');
    const tip2 = this.$('item-tip2');
    if (el && (tipEl.contains(el) || tip2.contains(el))) return;
    const a = el ? el.closest('[data-item]') : null;
    if (a && !tipEl.contains(a) && !tip2.contains(a)) {
      t.anchor = a;
      if (a.dataset.item !== t.anchorId) {
        t.id = a.dataset.item;
        t.anchorId = t.id;
        t.mode = 'info';
        t.side = null;
      }
      this.placeItemTip();
    } else this.hideItemTip();
  }

  bindControls() {
    this.$('btn-ready').addEventListener('click', () => this.pressReady());
    this.$('return-btn').innerHTML = iconSvg('home', 24);
    this.$('return-btn').addEventListener('click', () => this.pressReturn());
    this.$('btn-speed').addEventListener('click', () => {
      if (this.mode === 'mp') return;
      this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 4 : 1;
      this.driver.speed = this.speed;
      this.$('speed-num').textContent = 'x' + this.speed;
    });
    this.$('btn-debug').addEventListener('click', () => this.toggleDebug());
    this.$('btn-credit').addEventListener('click', () => this.showCredits());
    this.$('btn-sound').addEventListener('click', e => {
      e.stopPropagation();
      this.toggleSoundPop();
    });
    this.$('btn-xp').addEventListener('click', () => this.buyXp());
    this.$('btn-reroll').addEventListener('click', () => this.reroll());
    this.$('btn-lock').addEventListener('click', () => {
      this.act({ t: 'lock', v: !this.human.shopLocked });
    });
    this.$('tab-toggle').addEventListener('click', () => {
      if (this.selected) {
        this.selected = null;
        this.closeEvo();
      }
      this.setRightMode(this.rightMode === 'players' ? 'damage' : 'players');
    });
    this.gameEl.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-tip]');
      if (t && !this.dragging) this.showTooltip(t, t.dataset.tip);
    });
    this.gameEl.addEventListener('mouseout', e => {
      const t = e.target.closest('[data-tip]');
      if (t && (!e.relatedTarget || !t.contains(e.relatedTarget))) this.hideTooltip();
    });
    this.gameEl.addEventListener('mouseover', e => {
      const u = e.target.closest('[data-unit]');
      if (u && !this.dragging && !(this.planner && this.planner.drag)) this.showUnitTip(u);
      const it = e.target.closest('[data-item]');
      if (it && !this.dragging && !it.closest('#item-tip, #item-tip2')) this.showItemTip(it, it.dataset.item);
    });
    this.gameEl.addEventListener('mouseout', e => {
      const it = e.target.closest('[data-item]');
      if (it && !it.closest('#item-tip, #item-tip2') && (!e.relatedTarget || !it.contains(e.relatedTarget))) this.hideItemTipSoon();
    });
    this.gameEl.addEventListener('pointerdown', e => {
      if (e.button !== 2) return;
      const it = e.target.closest('[data-item]');
      if (!it || it.closest('#item-tip, #item-tip2')) return;
      e.stopPropagation();
      this.toggleItemRecipe(it);
    }, true);
    this.gameEl.addEventListener('mouseout', e => {
      const u = e.target.closest('[data-unit]');
      if (u && (!e.relatedTarget || !u.contains(e.relatedTarget))) this.hideUnitTip();
    });
    for (const b of document.querySelectorAll('[data-dbg]')) {
      b.addEventListener('click', () => {
        this.act({ t: 'dbg', k: b.dataset.dbg, n: Number(b.dataset.amt) || 0 });
      });
    }
    const mapRow = document.createElement('div');
    mapRow.className = 'dbg-maps';
    for (const id of CONFIG.maps) {
      const b = document.createElement('button');
      b.textContent = MAPS[id].name.split(' · ')[0];
      b.dataset.tip = MAPS[id].name;
      b.addEventListener('click', () => {
        this.human.mapId = id;
        this.arenaKey = null;
        this.render();
      });
      mapRow.appendChild(b);
    }
    this.$('debug').insertBefore(mapRow, this.$('dbg-state'));
    for (const b of document.querySelectorAll('[data-region]')) {
      b.addEventListener('click', () => {
        this.act({ t: 'region', r: b.dataset.region || null });
      });
    }
    const tip = this.$('trait-tip');
    tip.addEventListener('mouseenter', () => clearTimeout(this.tipTimer));
    tip.addEventListener('mouseleave', () => this.hideTraitTipSoon());
    this.gameEl.addEventListener('contextmenu', e => e.preventDefault());
    this.$('arena').addEventListener('pointerdown', e => {
      if (e.button === 2) this.moveStrategist(e.clientX, e.clientY);
    });
    this.setupTouchMove();
    this.$('aug-toggle').addEventListener('click', () => {
      this.augHidden = !this.augHidden;
      this.renderAugPick();
    });
    this.gameEl.addEventListener('pointerdown', e => {
      if (this.augListFor && !e.target.closest('#aug-list, #aug-desc, .aug-ball')) this.closeAugList();
      if (!e.target.closest('#sound-pop, #btn-sound')) this.$('sound-pop').classList.remove('show');
    });
    this.gameEl.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !this.selected) return;
      if (e.target.closest('#info-panel, #evo-pop, .unit, button, .card, .dmg-row, .prow, #modal, #damage, #shop, #planner-wrap')) return;
      this.closeInfo();
    });
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (this.planner && this.planner.isOpen) {
        if (e.code === 'Escape') this.planner.escape();
        if (e.code === 'Space') e.preventDefault();
        return;
      }
      if (e.code === 'KeyD') this.reroll();
      else if (e.code === 'KeyF') this.buyXp();
      else if (e.code === 'KeyE') this.sellHovered();
      else if (e.code === 'KeyW') this.moveHovered();
      else if (e.code === 'Digit1' || e.code === 'Numpad1') this.cycleView(-1);
      else if (e.code === 'Digit3' || e.code === 'Numpad3') this.cycleView(1);
      else if (e.code === 'Backquote') this.toggleDebug();
      else if (e.code === 'Space') {
        e.preventDefault();
        this.pressSpace();
      }
    });
  }

  bindGameEvents() {
    this.game.on('round', info => this.onRound(info));
    this.game.on('starup', e => this.onStarUpEvent(e));
    this.game.on('notify', n => {
      if (n.p === this.human && !this.replaying && n.kind !== 'unlock') this.toast(n.msg, n.kind);
    });
    this.game.on('unlocked', d => {
      if (!d || d.p !== this.human || this.replaying) return;
      if (this.game.phase === 'planning') this.showUnlockCard(d.id, d.sub);
      else (this.unlockHold = this.unlockHold || []).push(d);
    });
    this.game.on('branch', d => {
      if (d && d.p === this.human) this.maybeShowBranch();
    });
    this.game.on('update', () => this.requestRender());
    this.game.on('orbs', () => this.requestRender());
    this.game.on('wingold', p => {
      if (p !== this.human || this.replaying) return;
      this.arena.goldPop(this.arena.me);
      this.requestRender();
    });
    this.game.on('eliminated', p => {
      if (p === this.human && this.mode === 'mp' && this.game.phase !== 'over') this.showEliminated();
    });
    const d = this.driver;
    d.on('combatStart', e => this.onCombatStart(e));
    d.on('combatOver', () => {
      this.ending = true;
    });
    d.on('combatEnd', () => this.onCombatEnd());
    d.on('over', () => {
      this.render();
      this.showGameOver();
    });
    d.on('carry', pid => this.onCarry(pid));
    d.on('carouselEnd', () => this.curtain(() => this.endCarousel()));
    d.on('carouselDone', () => {
      if (!this.replaying) this.taxiCarouselDone();
    });
    d.on('orb', e => {
      if (e.pid !== this.human.id || this.replaying) return;
      Sound.sfx(e.tier === 'item' ? 'loot-item' : e.grade === 'gold' ? 'loot3' : e.grade === 'blue' ? 'loot2' : 'loot1');
      const el = this.arena.orbEls && this.arena.orbEls[e.id];
      if (el) el.remove();
      this.renderHud();
      if (this.scene().mode === 'planning') {
        this.arenaKey = null;
        this.renderArena();
      }
    });
    d.on('applied', e => {
      if (this.replaying) return;
      if (e.pid === this.human.id) {
        if (e.res && !e.res.ok && e.res.reason) this.toast(e.res.reason, 'error');
        if (e.a.t === 'buy' && e.res && e.res.ok && e.res.unitId && UNITS[e.res.unitId]) Sound.cry(formOf(UNITS[e.res.unitId], 1, this.human).en);
        if (e.a.t === 'branch') {
          this.closeModal();
          this.arenaKey = null;
          this.maybeShowBranch();
        }
        if (e.a.t === 'region') this.toast(this.game.isRegional() ? '리전폼 모드: 리전폼이 있는 포켓몬은 리전폼으로 나옵니다' : '리전폼 모드 꺼짐', 'info');
      }
      this.requestRender();
    });
  }

  requestRender() {
    if (this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      this.render();
    });
  }

  viewed() {
    let v = this.game.players[this.viewId];
    if (!v || !v.alive) {
      this.viewId = this.human.id;
      v = this.human;
    }
    return v;
  }

  pressReturn() {
    if (this.carouselScene) {
      if (this.viewCarousel) this.viewCarousel = false;
      else this.viewCarousel = true;
      this.viewId = this.human.id;
      this.arenaKey = null;
      this.hideTooltip();
      this.render();
      return;
    }
    this.setView(this.human.id);
  }

  pressSpace() {
    if (this.carouselScene) {
      if (!this.viewCarousel) {
        this.viewCarousel = true;
        this.viewId = this.human.id;
        this.arenaKey = null;
        this.render();
      }
      return;
    }
    this.setView(this.human.id);
  }

  scouting() {
    return !!this.carouselScene || this.viewId !== this.human.id;
  }

  setView(id) {
    const p = this.game.players[id];
    if (!p || !p.alive) {
      if (id !== this.human.id) return;
    }
    if (this.carouselScene) {
      this.viewCarousel = false;
      this.viewId = id;
      this.arenaKey = null;
      this.hoverInst = null;
      this.render();
      return;
    }
    if (this.viewId === id) return;
    this.sendVisit(id);
    this.viewId = id;
    this.arenaKey = null;
    this.hoverInst = null;
    this.render();
  }

  sendVisit(id) {
    const g = this.game;
    const d = this.driver;
    const h = this.human;
    if (!h.alive) return;
    if (g.phase === 'planning' && d.state === 'planning') {
      this.act({ t: 'visit', to: id });
      return;
    }
    if (g.phase !== 'combat' && g.phase !== 'result') return;
    const m = g.matchFor(h);
    const mine = id === h.id || (m && (m.a.id === id || (m.b && !m.ghost && m.b.id === id)));
    if (mine) {
      if (d.strats[h.id].at !== h.id) this.act({ t: 'visit', to: h.id });
    } else this.act({ t: 'visit', to: id });
  }

  setRightMode(mode) {
    this.rightMode = mode;
    this.renderHud();
  }

  canShop() {
    const ph = this.game.phase;
    return this.human.alive && !this.scouting() && (ph === 'planning' || ph === 'combat' || ph === 'result');
  }

  buyXp() {
    if (!this.canShop()) return;
    const h = this.human;
    if (h.level >= h.maxLevel() || h.gold < CONFIG.xpCost) {
      this.toast(h.level >= h.maxLevel() ? '최대 레벨입니다' : '골드가 부족합니다', 'error');
      return;
    }
    this.act({ t: 'xp' });
  }

  reroll() {
    if (!this.canShop()) return;
    const chk = this.game.rerollCheck(this.human);
    if (!chk.ok) {
      this.toast(chk.reason, 'error');
      return;
    }
    this.act({ t: 'reroll' });
    Sound.sfx('reroll');
  }

  onShopPointerDown(e, slot, card) {
    if (e.button !== 0) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const id = this.human.shop[slot];
    let ghost = null;
    const shopRect = () => this.$('shop').getBoundingClientRect();
    const outside = ev => {
      const r = shopRect();
      return ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
    };
    const move = ev => {
      if (!ghost) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        const r = card.getBoundingClientRect();
        const g0 = this.toGame(r.left, r.top);
        ghost = card.cloneNode(true);
        ghost.classList.add('shop-ghost');
        ghost.style.width = card.offsetWidth + 'px';
        ghost.style.height = card.offsetHeight + 'px';
        ghost._dx = this.toGame(sx, sy).x - g0.x;
        ghost._dy = this.toGame(sx, sy).y - g0.y;
        this.gameEl.appendChild(ghost);
        card.classList.add('drag-src');
        this.dragging = true;
        this.hideTooltip();
      }
      const g = this.toGame(ev.clientX, ev.clientY);
      ghost.style.left = (g.x - ghost._dx) + 'px';
      ghost.style.top = (g.y - ghost._dy) + 'px';
      ghost.classList.toggle('out', outside(ev));
    };
    const up = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!ghost) {
        this.buySlot(slot);
        return;
      }
      ghost.remove();
      card.classList.remove('drag-src');
      this.dragging = false;
      if (outside(ev) && this.human.shop[slot] === id) this.buySlot(slot);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  buySlot(slot) {
    if (!this.canShop()) return;
    const check = this.game.canBuy(this.human, slot);
    if (!check.ok) {
      if (check.reason) this.toast(check.reason, 'error');
      return;
    }
    this.act({ t: 'buy', s: slot });
    Sound.sfx('buy');
  }

  toggleSoundPop() {
    const pop = this.$('sound-pop');
    if (pop.classList.contains('show')) {
      pop.classList.remove('show');
      return;
    }
    pop.innerHTML = '';
    pop.appendChild(View.el('b', null, '효과음'));
    const row = View.el('div', 'snd-row');
    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.value = String(Math.round(Sound.vol * 100));
    const num = View.el('span', 'snd-num', range.value);
    range.addEventListener('input', () => {
      Sound.vol = Number(range.value) / 100;
      num.textContent = range.value;
      Sound.save();
    });
    row.appendChild(range);
    row.appendChild(num);
    pop.appendChild(row);
    const mute = View.el('label', 'snd-mute');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = Sound.muted;
    cb.addEventListener('change', () => {
      Sound.muted = cb.checked;
      Sound.save();
      this.$('btn-sound').classList.toggle('muted', Sound.muted);
    });
    mute.appendChild(cb);
    mute.appendChild(document.createTextNode(' 음소거'));
    pop.appendChild(mute);
    pop.appendChild(View.el('b', null, '배경음악'));
    const row2 = View.el('div', 'snd-row');
    const range2 = document.createElement('input');
    range2.type = 'range';
    range2.min = '0';
    range2.max = '100';
    range2.value = String(Math.round(Bgm.vol * 100));
    const num2 = View.el('span', 'snd-num', range2.value);
    range2.addEventListener('input', () => {
      Bgm.vol = Number(range2.value) / 100;
      num2.textContent = range2.value;
      Bgm.save();
    });
    row2.appendChild(range2);
    row2.appendChild(num2);
    pop.appendChild(row2);
    const off = View.el('label', 'snd-mute');
    const cb2 = document.createElement('input');
    cb2.type = 'checkbox';
    cb2.checked = Bgm.off;
    cb2.addEventListener('change', () => {
      Bgm.off = cb2.checked;
      Bgm.save();
    });
    off.appendChild(cb2);
    off.appendChild(document.createTextNode(' 배경음악 끄기'));
    pop.appendChild(off);
    pop.appendChild(View.el('b', null, '화면'));
    const nm = View.el('label', 'snd-mute');
    const cb3 = document.createElement('input');
    cb3.type = 'checkbox';
    cb3.checked = NameLabels.on;
    cb3.addEventListener('change', () => NameLabels.set(cb3.checked));
    nm.appendChild(cb3);
    nm.appendChild(document.createTextNode(' 기물 이름 표시'));
    pop.appendChild(nm);
    pop.classList.add('show');
  }

  moveHovered() {
    const h = this.human;
    const inst = this.hoverInst;
    if (!inst || !inst.loc || !h.alive || this.viewId !== h.id || this.dragging) return;
    if (this.game.phase !== 'planning') {
      this.toast('전투 중에는 필드를 바꿀 수 없습니다', 'error');
      return;
    }
    if (inst.loc.zone === 'bench') {
      if (h.boardCount() >= h.boardLimit()) {
        this.toast('필드에 놓을 수 있는 기물은 ' + h.boardLimit() + '개입니다', 'error');
        return;
      }
      const cell = this.game.frontCell(h);
      if (!cell) return;
      this.act({ t: 'move', iid: inst.iid, z: 'board', r: cell.r, c: cell.c });
      Sound.sfx('place');
    } else {
      const slot = h.freeBenchSlot();
      if (slot < 0) {
        this.toast('대기석이 가득 찼습니다', 'error');
        return;
      }
      this.act({ t: 'move', iid: inst.iid, z: 'bench', i: slot });
      Sound.sfx('place');
    }
    this.hoverInst = null;
  }

  cycleView(dir) {
    const list = this.game.players.filter(p => p.alive).sort((a, b) => (b.hp - a.hp) || ((a.placement || 9) - (b.placement || 9)) || (a.id - b.id));
    if (!list.length) return;
    let i = list.findIndex(p => p.id === this.viewId);
    if (i < 0) i = 0;
    const next = list[(i + dir + list.length) % list.length];
    this.setView(next.id);
  }

  sellHovered() {
    if (!this.canShop() || !this.hoverInst || this.viewId !== this.human.id) return;
    const inst = this.hoverInst;
    if (this.game.phase === 'combat' && inst.loc && inst.loc.zone === 'board') {
      this.toast('전투 중에는 필드의 기물을 팔 수 없습니다', 'error');
      return;
    }
    this.act({ t: 'sell', iid: inst.iid });
    Sound.sfx('sell');
    this.hoverInst = null;
  }

  pressReady() {
    if (this.game.phase !== 'planning' || !this.human.alive) return;
    this.act({ t: 'ready' });
    if (this.mode === 'mp') {
      this.readySent = this.game.roundLabel();
      this.toast('준비 완료! 다른 플레이어를 기다립니다', 'info');
      this.renderHud();
    }
  }

  toggleDebug() {
    this.$('debug').classList.toggle('show');
    this.renderHud();
  }

  bgmKey() {
    const g = this.game;
    const d = this.driver;
    if (g.phase === 'over' || !this.human || !this.human.alive) return null;
    if (g.phase === 'carousel' || d.state === 'carousel' || d.state === 'carouselEnd') return g.carousel && g.carousel.encounter ? 'encounter' : 'carousel';
    if (['precombat', 'combat', 'ending', 'result', 'between'].includes(d.state)) return 'battle';
    return 'planning';
  }

  curtain(fn) {
    if (this.replaying || !this._taxi) {
      fn();
      return;
    }
    const fx = this.taxiFx();
    if (fx.fadeVal >= 0.999 && !(fx.fadeAnim && fx.fadeAnim.to < 1)) {
      fn();
      return;
    }
    this.holdScene = true;
    this.curtainQ = (this.curtainQ || []).concat([fn]);
    if (!(fx.fadeAnim && fx.fadeAnim.to === 1)) fx.fadeTo(1, 0.25);
  }

  flushCurtain() {
    const fx = this.taxiFx();
    if (!this.curtainQ || !this.curtainQ.length || fx.fadeVal < 0.999) return;
    const q = this.curtainQ;
    this.curtainQ = [];
    this.holdScene = false;
    for (const f of q) f();
    this.arenaKey = null;
    this.render();
    if (!fx.fadeAnim || fx.fadeAnim.to !== 0) fx.fadeTo(0, 0.5);
  }

  onRound(info) {
    if (this.curtainQ && this.curtainQ.length && !this.replaying) {
      this.curtainQ.push(() => this.onRound(info));
      return;
    }
    this.arenaKey = null;
    this.combatRunning = false;
    this.ending = false;
    if (this.replaying) {
      if (this._taxi) this.taxiReset();
      if (this.game.phase === 'carousel') this.startCarousel();
      return;
    }
    this.taxiRoundStart();
    if (this.rightMode === 'damage') this.rightMode = 'players';
    if (this.game.phase === 'planning' && this.unlockHold && this.unlockHold.length) {
      const list = this.unlockHold;
      this.unlockHold = [];
      for (const d of list) this.showUnlockCard(d.id, d.sub);
    }
    if (this.game.phase === 'planning') {
      const inc = this.game.lastIncome;
      if (inc && info.type !== 'encounter') {
        let msg = '수입 +' + inc.base;
        if (inc.interest) msg += ' · 이자 +' + inc.interest;
        if (inc.streak) msg += ' · ' + (this.human.streak > 0 ? '연승' : '연패') + ' +' + inc.streak;
        this.toast(msg, 'info');
      }
      this.render();
      this.maybeShowBranch();
    } else if (this.game.phase === 'carousel') {
      this.startCarousel();
    }
  }

  scene() {
    const g = this.game;
    const V = this.viewed();
    if (g.phase !== 'carousel' && this.carouselScene && this.viewCarousel) return { mode: 'carousel' };
    if (g.phase === 'carousel') {
      if (this.viewCarousel || !this.carouselScene) return { mode: 'carousel' };
      if (V === this.human) return { mode: 'planning', bottom: { player: V }, top: null, carouselField: true };
      return { mode: 'planning', top: { player: V }, bottom: null, carouselField: true };
    }
    if (g.matches.length) {
      const m = g.matchFor(V);
      if (m) {
        if (!m.sim.uiId) m.sim.uiId = this.simSeq++;
        const side = g.sideOf(m, V);
        if (m.kind === 'pve') {
          if (V === this.human) return { mode: 'combat', sim: m.sim, flip: false, bottom: { player: V }, top: { camp: m.camp }, match: m, allySide: 'A', mapId: V.mapId };
          return { mode: 'combat', sim: m.sim, flip: true, top: { player: V }, bottom: { camp: m.camp }, match: m, allySide: 'A', mapId: V.mapId };
        }
        const hostRole = { player: m.a };
        const visitRole = { player: m.b, ghost: m.ghost };
        const flip = V === this.human ? side === 'B' : side === 'A';
        return { mode: 'combat', sim: m.sim, flip, bottom: flip ? visitRole : hostRole, top: flip ? hostRole : visitRole, match: m, allySide: side, mapId: m.a.mapId };
      }
    }
    if (V === this.human) {
      const info = g.roundInfo();
      return { mode: 'planning', bottom: { player: V }, top: info.type === 'pve' ? { camp: g.currentCamp() } : null };
    }
    return { mode: 'planning', top: { player: V }, bottom: null };
  }

  campSpecs() {
    const label = this.game.roundLabel();
    if (this.campCache.label !== label) {
      this.campCache = { label, specs: this.game.creepSpecs(this.game.currentCamp()) };
    }
    return this.campCache.specs;
  }

  render() {
    this.renderHud();
    this.renderArena();
  }

  renderArena() {
    if (this.holdScene && !this.replaying) return;
    if (this.travelHold) return;
    const a = this.arena;
    const sc = this.scene();
    if (sc.mode === 'carousel') {
      this.curScene = sc;
      a.setCarouselMode(true);
      a.showCarouselLayer(true);
      a.me.el.style.display = '';
      a.clearUnits();
      a.clearSideSprites();
      a.renderBench(false, null);
      a.renderBench(true, null);
      a.renderOrbs([]);
      this.$('scout-label').classList.remove('show');
      a.renderBoardCount('');
      a.setRedCells(null);
      this.arenaKey = 'carousel';
      return;
    }
    a.setCarouselMode(false);
    a.setMap(sc.mapId || this.viewed().mapId);
    a.showCarouselLayer(false);
    this.curScene = sc;
    const key = sc.mode + '|' + this.viewId + '|' + (sc.sim ? sc.sim.uiId : '');
    const viewMe = this.viewId === this.human.id;
    const fresh = key !== this.arenaKey;
    if (fresh) a.renderSides(sc.top, sc.bottom, sc.carouselField);
    else {
      a.setPillars(a.pillarTop, a.interestOf(sc.top), true);
      a.setPillars(a.pillarBottom, a.interestOf(sc.bottom), true);
    }
    if (sc.mode === 'planning') {
      a.clearUnits();
      if (sc.bottom && sc.bottom.player) {
        for (const inst of sc.bottom.player.boardUnits()) a.placeToken(this.makeToken(inst, sc.bottom.player), inst.loc.r, inst.loc.c);
      }
      if (sc.top && sc.top.player) {
        for (const inst of sc.top.player.boardUnits()) {
          const [r, c] = Hex.mirror(inst.loc.r, inst.loc.c);
          a.placeToken(this.makeToken(inst, sc.top.player), r, c);
        }
      }
      const seaCells = [];
      const seaOf = (player, mirror) => {
        if (!player || !synergyTeam(player).tiers['바다의 음유시인']) return;
        for (const k of player.seaTiles || []) seaCells.push(mirror ? Hex.mirror(Math.floor(k / 10), k % 10) : [Math.floor(k / 10), k % 10]);
      };
      seaOf(sc.bottom && sc.bottom.player, false);
      seaOf(sc.top && sc.top.player, true);
      if (seaCells.length) a.renderSea(seaCells);
      if (sc.top && sc.top.camp) {
        for (const spec of this.campSpecs()) a.placeToken(this.makeCreepToken(spec), spec.r, spec.c);
      }
    } else if (fresh) {
      a.startCombat(sc.sim, sc.flip, sc.allySide);
    }
    a.renderBench(false, sc.bottom && sc.bottom.player, (inst, owner) => this.makeToken(inst, owner));
    a.renderBench(true, sc.top && sc.top.player, (inst, owner) => this.makeToken(inst, owner));
    const bp = sc.mode === 'planning' && sc.bottom && sc.bottom.player;
    a.setRedCells(bp ? bp.boardUnits().filter(u => u.overflow).map(u => ({ r: u.loc.r, c: u.loc.c })) : null);
    a.renderBoardCount(viewMe && sc.mode === 'planning' && this.game.phase === 'planning' ? this.human.boardCount() + ' / ' + this.human.boardLimit() : '', this.human.boardCount() < this.human.boardLimit());
    a.renderOrbs(viewMe && !sc.carouselField ? this.human.orbs || [] : []);
    this.renderFruit(viewMe && !sc.carouselField && sc.mode === 'planning' && this.game.phase === 'planning' ? this.human.fruit : null);
    a.refreshSprites();
    this.applyBallHide();
    const scout = this.$('scout-label');
    if (sc.carouselField) {
      scout.textContent = (viewMe ? '내 필드' : this.viewed().name + ' 필드') + ' · 스페이스바: 회전초밥으로';
      scout.classList.add('show');
    } else if (!viewMe) {
      scout.textContent = this.viewed().name + ' 관전 중 · 스페이스바: 내 필드';
      scout.classList.add('show');
    } else {
      scout.classList.remove('show');
    }
    this.arenaKey = key;
  }

  makeToken(inst, owner) {
    const v = View.instanceView(inst, owner);
    const sel = this.selected && this.selected.inst === inst;
    v.className = 'unit' + (sel ? ' selected' : '');
    const el = View.unitEl(v);
    if (this.evoHidden(inst, owner)) el.classList.add('evo-hide');
    el._inst = inst;
    el._owner = owner;
    el._maxHp = instanceStats(inst, owner).hp;
    el._enemy = owner !== this.human;
    el.addEventListener('pointerdown', e => this.onTokenPointerDown(e, { inst, owner }, el));
    if (owner === this.human) {
      el.addEventListener('mouseenter', () => { this.hoverInst = inst; });
      el.addEventListener('mouseleave', () => { if (this.hoverInst === inst) this.hoverInst = null; });
    }
    return el;
  }

  makeCreepToken(spec) {
    const el = View.unitEl({ className: 'unit creep', name: spec.name, form: spec.form, types: spec.types, star: spec.star, cost: spec.cost });
    el._maxHp = spec.stats.hp;
    el._enemy = true;
    el.addEventListener('pointerdown', e => this.onTokenPointerDown(e, { creep: spec }, el));
    return el;
  }

  renderHud() {
    const g = this.game;
    const h = this.human;
    this.renderTracker();
    this.$('btn-ready').disabled = g.phase !== 'planning';
    this.renderShop();
    const scouting = this.scouting();
    this.$('shop').style.display = scouting || h.augOffer ? 'none' : '';
    const ret = this.$('return-btn');
    ret.classList.toggle('show', scouting && this.human.alive);
    if (this.carouselScene) ret.dataset.tip = this.viewCarousel ? '내 필드 보기' : '회전초밥으로 (스페이스바)';
    else ret.dataset.tip = '내 필드로 (스페이스바)';
    this.arena.me.refresh();
    this.renderTraitPanel();
    this.renderItemBench();
    const playersEl = this.$('players');
    const dmgEl = this.$('damage');
    playersEl.style.display = this.rightMode === 'players' ? 'flex' : 'none';
    dmgEl.classList.toggle('show', this.rightMode === 'damage');
    const toggle = this.$('tab-toggle');
    toggle.innerHTML = iconSvg(this.rightMode === 'players' ? 'chart' : 'players', 16);
    toggle.dataset.tip = this.rightMode === 'players' ? '딜량표 보기' : '플레이어 목록 보기';
    if (this.rightMode === 'players') View.renderPlayers(playersEl, g, this.viewId, p => this.setView(p.id));
    else this.renderDamage();
    this.renderInfo();
    this.renderMine();
    this.renderBox();
    this.renderAugPick();
    this.renderAugBalls();
    this.renderDrills();
    this.renderDebug();
    if (h.pendingBranch.length) this.maybeShowBranch();
    const rb = this.$('btn-ready');
    rb.classList.toggle('on', this.mode === 'mp' && this.readySent === this.game.roundLabel() && this.game.phase === 'planning');
  }

  renderTracker() {
    const g = this.game;
    const h = this.human;
    this.$('stage-label').textContent = g.roundLabel();
    const icons = this.$('round-icons');
    icons.innerHTML = '';
    const n = g.roundsInStage(g.stage);
    for (let r = 1; r <= n; r++) {
      const type = g.roundInfo(g.stage, r).type;
      const res = h.history[g.stage + '-' + r];
      let cls = 'round-ico';
      if (r === g.round) cls += ' now';
      else if (res) cls += ' ' + res;
      const d = View.el('div', cls);
      d.innerHTML = iconSvg(ROUND_ICON[type], 14);
      icons.appendChild(d);
    }
    this.$('timer-num').dataset.tip = PHASE_LABEL[g.phase] || '';
    const enc = encounterDef(g.encounter);
    const ei = this.$('encounter-icon');
    ei.dataset.tip = enc ? '조우자 · ' + enc.id + '\n' + enc.desc + (enc.sub ? '\n(' + enc.sub + ')' : '') + (enc.more ? '\n\n' + enc.more : '') : '조우자: 없음';
    if (ei.dataset.enc !== (g.encounter || '')) {
      ei.dataset.enc = g.encounter || '';
      const por = enc ? Sprites.portrait({ en: enc.en }, 24, { fill: 0.95 }) : null;
      ei.innerHTML = '';
      if (por) ei.appendChild(por);
      else ei.innerHTML = iconSvg('encounter', 16);
    }
  }

  renderTraitPanel() {
    this.traitPage = View.renderTraits(this.$('traits'), this.viewed(), this.traitPage, pg => {
      this.traitPage = pg;
      this.renderHud();
    }, {
      enter: (row, id) => this.showTraitTip(row, id),
      leave: () => this.hideTraitTipSoon(),
      stack: id => this.uniqueStack(id)
    });
    if (this.tipTrait) this.renderTraitTip();
  }

  renderItemBench() {
    const owner = this.viewed();
    const mine = owner === this.human && this.human.alive;
    this.itemPage = View.renderItems(this.$('items'), owner, this.itemPage || 0, {
      more: pg => {
        this.itemPage = pg;
        this.renderItemBench();
      },
      down: mine ? (e, idx, el) => this.onItemPointerDown(e, idx, el) : null
    });
    this.gameEl.classList.toggle('items-two', this.$('items').classList.contains('two'));
    this.reanchorItemTip();
  }

  renderMine() {
    const box = this.$('mine-box');
    const h = this.human;
    const show = !this.scouting() && !this.replaying && this.driver.state === 'planning' && this.game.canTakeMine(h);
    this.gameEl.classList.toggle('mine-open', show);
    if (!show) {
      if (this.mineKey !== null) {
        box.classList.remove('show');
        this.mineKey = null;
        clearTimeout(this.mineClear);
        this.mineClear = setTimeout(() => {
          if (this.mineKey === null) box.innerHTML = '';
        }, 450);
      }
      return;
    }
    const key = h.mine + '|' + JSON.stringify(h.mineOffer);
    if (key !== this.mineKey) {
      View.renderMine(box, this.game, h, {
        take: () => this.act({ t: 'mine', k: 'take' }),
        skip: () => this.act({ t: 'mine', k: 'skip' })
      });
      this.mineKey = key;
    }
    box.classList.add('show');
  }

  renderAugPick() {
    const box = this.$('aug-pick');
    const btn = this.$('aug-toggle');
    const o = this.human.augOffer;
    const home = !!o && this.human.alive && !this.scouting() && !this.replaying;
    if (!o) this.augHidden = false;
    const show = home && !this.augHidden;
    btn.classList.toggle('show', home);
    btn.classList.toggle('closed', home && this.augHidden);
    if (!show) {
      if (this.augKey) {
        box.className = '';
        box.innerHTML = '';
        this.augKey = null;
      }
      if (home) this.updateAugTimer();
      return;
    }
    const key = o.tier + '|' + o.choices.map(c => c.id + (c.trait || '') + (c.traits || []).join('')).join(',') + '|' + (o.rerolls || []).join(',');
    if (key !== this.augKey) {
      const fresh = this.augAnimFor !== o;
      this.augAnimFor = o;
      View.renderAugPick(box, o, {
        pick: n => this.act({ t: 'aug', k: 'pick', n }),
        reroll: n => this.act({ t: 'aug', k: 'reroll', n }),
        animate: fresh
      });
      this.augKey = key;
    }
    this.updateAugTimer();
  }

  updateAugTimer() {
    const left = Math.max(0, Math.ceil(this.driver.timeLeft - CONFIG.augAuto));
    const el = this.augKey ? this.$('aug-pick').querySelector('.augp-timer') : null;
    if (el) el.textContent = left + '초 뒤 자동 선택';
    const btn = this.$('aug-toggle');
    if (!btn.classList.contains('show')) return;
    const label = this.augHidden ? '증강 선택 · ' + left + '초' : '필드 보기';
    if (btn.dataset.label !== label) {
      btn.dataset.label = label;
      btn.innerHTML = iconSvg(this.augHidden ? 'crown' : 'home', 14) + '<span>' + label + '</span>';
    }
  }

  augBallPlayers() {
    const sc = this.curScene;
    if (!sc || this.carouselScene || sc.mode === 'carousel') return [null, null];
    const bot = sc.bottom && sc.bottom.player ? sc.bottom.player : null;
    const top = sc.top && sc.top.player ? sc.top.player : null;
    return [bot, top];
  }

  renderAugBalls() {
    const [bot, top] = this.augBallPlayers();
    const balls = this.$('aug-balls').children;
    const key = [bot, top].map(p => (p ? p.id + ':' + p.augs.map(a => a.id + (a.trait || '')).join(',') : '-')).join('|');
    if (key === this.augBallKey) return;
    this.augBallKey = key;
    [bot, top].forEach((p, i) => {
      const el = balls[i];
      el.innerHTML = '';
      el.classList.toggle('show', !!p);
      if (!p) return;
      const row = View.el('div', 'aug-ball-icons');
      for (const a of p.augs) row.appendChild(View.augIcon(a.id, 24));
      el.appendChild(row);
      el.classList.toggle('holo', p.augs.length > 0);
      el.appendChild(View.el('i', 'aug-holo-beam'));
      el.appendChild(View.el('i', 'aug-ball-img'));
      el.dataset.tip = p.augs.length ? '' : '선택한 증강 없음';
      el.onclick = e => {
        e.stopPropagation();
        this.toggleAugList(p, el);
      };
    });
    if (this.augListFor && ![bot, top].includes(this.augListFor)) this.closeAugList();
  }

  toggleAugList(p, anchor) {
    if (this.augListFor === p) {
      this.closeAugList();
      return;
    }
    const box = this.$('aug-list');
    box.innerHTML = '';
    box.appendChild(View.el('div', 'augl-title', '증강'));
    if (!p.augs.length) box.appendChild(View.el('div', 'augl-empty', '아직 선택한 증강이 없습니다'));
    for (const a of p.augs) {
      const row = View.el('div', 'augl-row');
      row.appendChild(View.augIcon(a.id, 34));
      row.appendChild(View.el('span', 'augl-name', augLabel(a)));
      row.addEventListener('mouseenter', () => this.showAugDesc(a, row, p));
      row.addEventListener('mouseleave', () => this.$('aug-desc').classList.remove('show'));
      box.appendChild(row);
    }
    box.classList.add('show');
    const r = anchor.getBoundingClientRect();
    const g = this.toGame(r.left, r.top);
    const g2 = this.toGame(r.right, r.bottom);
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    let x = anchor.classList.contains('right') ? g.x - w - 8 : g2.x + 8;
    let y = Math.max(8, Math.min(712 - h, (g.y + g2.y) / 2 - h / 2));
    box.style.left = Math.max(8, x) + 'px';
    box.style.top = y + 'px';
    box.dataset.side = anchor.classList.contains('right') ? 'right' : 'left';
    this.augListFor = p;
  }

  showAugDesc(a, row, p) {
    const box = this.$('aug-desc');
    box.innerHTML = '';
    const d = augDef(a.id);
    const head = View.el('div', 'augd-head');
    head.appendChild(View.augIcon(a.id, 34));
    const tt = View.el('div', 'augd-titles');
    tt.appendChild(View.el('b', null, augLabel(a)));
    tt.appendChild(View.el('small', 't' + (d ? d.tier : 1), d ? AUG_TIER_NAME[d.tier] + ' 증강' : ''));
    head.appendChild(tt);
    box.appendChild(head);
    box.appendChild(View.el('div', 'augd-text', augText(a)));
    const status = p ? this.game.augStatus(p, a) : '';
    if (status) box.appendChild(View.el('div', 'augd-status', status));
    box.classList.add('show');
    const list = this.$('aug-list');
    const lx = parseFloat(list.style.left) || 0;
    const w = box.offsetWidth;
    const rr = row.getBoundingClientRect();
    const gy = this.toGame(rr.left, rr.top).y;
    const x = list.dataset.side === 'right' ? lx - w + 2 : lx + list.offsetWidth - 2;
    box.style.left = Math.max(8, Math.min(1272 - w, x)) + 'px';
    box.style.top = Math.max(8, Math.min(712 - box.offsetHeight, gy - 6)) + 'px';
  }

  closeAugList() {
    this.augListFor = null;
    this.$('aug-list').classList.remove('show');
    this.$('aug-desc').classList.remove('show');
  }

  showUnlockCard(id, sub) {
    this.unlockQueue = this.unlockQueue || [];
    this.unlockQueue.push({ id, sub });
    if (!this.unlockBusy) this.nextUnlockCard();
  }

  nextUnlockCard() {
    const box = this.$('unlock-card');
    const next = this.unlockQueue.shift();
    const id = next && next.id;
    if (!id || !UNITS[id]) {
      this.unlockBusy = false;
      box.className = '';
      box.innerHTML = '';
      return;
    }
    this.unlockBusy = true;
    const def = UNITS[id];
    const form = formOf(def, 1, this.human);
    box.innerHTML = '';
    box.className = '';
    const card = View.el('div', 'uc-card');
    paintCost(card, def.cost);
    const art = View.el('div', 'uc-art');
    art.appendChild(View.el('i', 'uc-rays'));
    const pic = View.el('div', 'uc-pic');
    const spr = Sprites.portrait(form, 128, { fill: 0.82, max: 4, animate: true });
    if (spr) pic.appendChild(spr);
    art.appendChild(pic);
    art.appendChild(View.el('i', 'uc-shine'));
    card.appendChild(art);
    const plate = View.el('div', 'uc-plate');
    plate.appendChild(View.el('b', 'uc-name', form.name));
    plate.appendChild(View.el('span', 'uc-msg', '해금했습니다!'));
    if (next.sub) plate.appendChild(View.el('small', 'uc-sub', next.sub));
    const badge = View.el('div', 'uc-badge');
    badge.innerHTML = '<i class="uc-lock">' + iconSvg('lock', 18) + '</i><i class="uc-open">' + iconSvg('unlock', 18) + '</i>';
    plate.appendChild(badge);
    card.appendChild(plate);
    for (let k = 0; k < 10; k++) {
      const sp = View.el('i', 'uc-spark');
      const a = (k / 10) * Math.PI * 2;
      sp.style.setProperty('--dx', Math.round(Math.cos(a) * (110 + (k % 3) * 18)) + 'px');
      sp.style.setProperty('--dy', Math.round(Math.sin(a) * (120 + (k % 2) * 20)) + 'px');
      sp.style.animationDelay = (0.45 + (k % 4) * 0.05).toFixed(2) + 's';
      card.appendChild(sp);
    }
    box.appendChild(card);
    void box.offsetWidth;
    box.className = 'show';
    try {
      Sound.cry(form.en);
    } catch (e) {
      void e;
    }
    clearTimeout(this.unlockTimer);
    this.unlockTimer = setTimeout(() => {
      box.className = 'show out';
      this.unlockTimer = setTimeout(() => this.nextUnlockCard(), 380);
    }, 2700);
  }

  renderDrills() {
    const [bot, top] = this.augBallPlayers();
    const els = this.$('drills').children;
    [bot, top].forEach((p, i) => {
      const el = els[i];
      const on = !!p && p.alive && !this.replaying && ((p.mine || 0) > 0 || this.game.groundTier(p) >= 1);
      el.classList.toggle('show', on);
      if (!on) return;
      const m = Math.floor(p.mine || 0);
      const full = m >= 700;
      const k = full ? 1 : (m % 100) / 100;
      el.querySelector('.drill-liq').style.setProperty('--lv', k.toFixed(3));
      el.classList.toggle('ready', m >= 100);
      el.querySelector('.drill-n').textContent = m;
      const next = Math.min(700, (Math.floor(m / 100) + 1) * 100);
      el.dataset.tip = '다크엘릭서 정제소\n채굴 중첩 ' + m + (m >= 100 ? '\n채굴 보상 ' + Math.min(700, Math.floor(m / 100) * 100) + ' 받을 수 있음' : '') + (m < 700 ? '\n다음 보상까지 ' + (next - m) : '');
    });
  }

  placeDrills() {
    const els = this.$('drills').children;
    const a = Proj.toScreen(DRILL_FLAT.x, DRILL_FLAT.y);
    const b = Proj.toScreen(ARENA_W - DRILL_FLAT.x, 530 - DRILL_FLAT.y);
    const sa = Proj.depthScale(DRILL_FLAT.y);
    const sb = Proj.depthScale(530 - DRILL_FLAT.y);
    const k = Math.round(a.x) + ',' + Math.round(a.y) + ',' + Math.round(b.x) + ',' + Math.round(b.y);
    if (k === this.drillPos) return;
    this.drillPos = k;
    [[els[0], a, sa], [els[1], b, sb]].forEach(([el, pt, sc]) => {
      el.style.left = pt.x + 'px';
      el.style.top = pt.y + 'px';
      el.style.setProperty('--ds', sc.toFixed(3));
    });
  }

  placeAugBalls() {
    const balls = this.$('aug-balls').children;
    const midY = View.BOARD_Y + 3.5 * View.ROW_STEP + View.CELL_H / 2;
    const L = Proj.toScreen(View.BOARD_X - 4, midY);
    const R = Proj.toScreen(View.BOARD_X + 7.5 * View.CELL_W + 4, midY);
    const k = Math.round(L.x) + ',' + Math.round(L.y) + ',' + Math.round(R.x) + ',' + Math.round(R.y);
    if (k === this.augBallPos) return;
    this.augBallPos = k;
    balls[0].style.left = L.x + 'px';
    balls[0].style.top = L.y + 'px';
    balls[1].style.left = R.x + 'px';
    balls[1].style.top = R.y + 'px';
  }

  renderBox() {
    const box = this.$('box-pick');
    const b = this.human.boxOpen;
    const show = !!b && this.human.alive && !this.scouting() && !this.replaying;
    if (!show) {
      if (this.boxKey) {
        box.classList.remove('show');
        box.innerHTML = '';
        this.boxKey = null;
      }
      return;
    }
    const key = b.id + '|' + b.choices.join(',');
    if (key !== this.boxKey) {
      View.renderBoxPick(box, b, n => this.act({ t: 'box', k: 'pick', n }));
      this.boxKey = key;
    }
    box.classList.add('show');
    this.updateBoxTimer();
  }

  updateBoxTimer() {
    const b = this.human.boxOpen;
    const el = this.boxKey && b ? this.$('box-pick').querySelector('.box-timer') : null;
    if (el) el.textContent = Math.max(0, Math.ceil(b.left)) + '초 뒤 자동 선택';
  }

  itemSlotAt(x, y, srcEl) {
    for (const el of document.elementsFromPoint(x, y)) {
      const slot = el.closest('#items .item-slot.filled');
      if (slot && slot !== srcEl) return slot;
    }
    return null;
  }

  itemTargetAt(x, y) {
    for (const el of document.elementsFromPoint(x, y)) {
      const u = el.closest('.unit');
      if (!u || u.classList.contains('ghost')) continue;
      if (u._inst && u._owner === this.human && u._inst.loc) return { el: u, inst: u._inst };
      const cu = u._cu;
      if (cu && cu.alive && cu.iid) {
        const m = this.game.matchFor(this.human);
        if (m && m.sim === this.arena.sim && cu.side === this.game.sideOf(m, this.human)) {
          const inst = this.human.findInstance(cu.iid);
          if (inst) return { el: u, inst };
        }
      }
    }
    return null;
  }

  overItemPanel(x, y) {
    const r = this.$('items').getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  setSwapHover(el) {
    if (this.swapHoverEl === el) return;
    if (this.swapHoverEl) this.swapHoverEl.classList.remove('swap-target');
    this.swapHoverEl = el || null;
    if (el) el.classList.add('swap-target');
  }

  setItemHover(el) {
    if (this.itemHoverEl === el) return;
    if (this.itemHoverEl) this.itemHoverEl.classList.remove('item-target');
    this.itemHoverEl = el || null;
    if (el) el.classList.add('item-target');
  }

  renderFruit(fruit) {
    const layer = this.arena.orbLayer;
    if (this.fruitEl && this.fruitEl.parentNode !== layer) this.fruitEl = null;
    if (!fruit) {
      if (this.fruitEl) this.fruitEl.remove();
      this.fruitEl = null;
      return;
    }
    if (this.fruitEl && this.fruitEl.dataset.item === fruit.item) return;
    if (this.fruitEl) this.fruitEl.remove();
    const d = itemDef(fruit.item);
    const el = View.el('div', 'gim-fruit');
    el.dataset.item = fruit.item;
    el.appendChild(View.el('div', 'gim-glow'));
    const ico = View.itemIcon(fruit.item, 36);
    ico.classList.add('gim-ico');
    el.appendChild(ico);
    el.dataset.tip = d.name + '\n기물에 끌어다 놓으면 바로 장착, 클릭하면 아이템 칸으로 가져옵니다. 전투가 시작되면 자동으로 아이템 칸에 들어갑니다.';
    const p = View.cellCenter(1, 3);
    placeSprite(el, p.x, p.y, 24, 40);
    el.addEventListener('pointerdown', e => this.onFruitPointerDown(e, el, fruit.item));
    el.addEventListener('mouseenter', () => this.showTooltip(el, el.dataset.tip));
    el.addEventListener('mouseleave', () => this.hideTooltip());
    layer.appendChild(el);
    this.fruitEl = el;
  }

  onFruitPointerDown(e, el, id) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    let ghost = null;
    const move = ev => {
      if (!ghost) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        this.dragging = true;
        this.hideTooltip();
        ghost = View.itemIcon(id, 33);
        ghost.classList.add('item-ghost');
        this.gameEl.appendChild(ghost);
        el.classList.add('dragging');
      }
      const g = this.toGame(ev.clientX, ev.clientY);
      ghost.style.left = (g.x - 16) + 'px';
      ghost.style.top = (g.y - 16) + 'px';
      const hit = this.itemTargetAt(ev.clientX, ev.clientY);
      this.setItemHover(hit ? hit.el : null);
    };
    const up = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this.setItemHover(null);
      if (!ghost) {
        this.act({ t: 'fruit' });
        Sound.sfx('loot-gim');
        return;
      }
      ghost.remove();
      el.classList.remove('dragging');
      this.dragging = false;
      const hit = this.itemTargetAt(ev.clientX, ev.clientY);
      if (hit) {
        this.act({ t: 'fruit', iid: hit.inst.iid });
        Sound.sfx('loot-gim');
      } else if (this.overItemPanel(ev.clientX, ev.clientY)) {
        this.act({ t: 'fruit' });
        Sound.sfx('loot-gim');
      }
      this.render();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  onItemPointerDown(e, idx, srcEl) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const id = this.human.items[idx];
    if (!id) return;
    const isComp = itemDef(id).kind === 'component';
    const sx = e.clientX;
    const sy = e.clientY;
    let ghost = null;
    const hold = { slot: null, timer: null, done: false };
    const resetHold = () => {
      clearTimeout(hold.timer);
      hold.timer = null;
      hold.slot = null;
      hold.done = false;
      if (ghost) ghost.classList.remove('holding', 'hold-done');
    };
    const move = ev => {
      if (!ghost) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        this.dragging = true;
        this.hideTooltip();
        this.hideItemTip();
        ghost = View.itemIcon(id, 33);
        ghost.classList.add('item-ghost');
        this.gameEl.appendChild(ghost);
        srcEl.classList.add('dragging');
      }
      const g = this.toGame(ev.clientX, ev.clientY);
      ghost.style.left = (g.x - 16) + 'px';
      ghost.style.top = (g.y - 16) + 'px';
      const slot = this.itemSlotAt(ev.clientX, ev.clientY, srcEl);
      const other = slot ? slot.dataset.item : null;
      this.setSwapHover(slot && Number(slot.dataset.idx) !== idx ? slot : null);
      if (isComp && slot && Number(slot.dataset.idx) !== idx && itemDef(other) && itemDef(other).kind === 'component') {
        this.setItemHover(null);
        if (hold.slot !== slot.dataset.idx) {
          resetHold();
          hold.slot = slot.dataset.idx;
          ghost.classList.add('holding');
          hold.timer = setTimeout(() => {
            hold.done = true;
            if (ghost) {
              ghost.classList.remove('holding');
              ghost.classList.add('hold-done');
            }
          }, 1000);
        }
        this.showItemPreview(combineItems(id, other), g.x, g.y);
        return;
      }
      if (hold.slot !== null) resetHold();
      if (slot || this.overItemPanel(ev.clientX, ev.clientY)) {
        this.setItemHover(null);
        this.hideItemPreview();
        return;
      }
      const hit = this.itemTargetAt(ev.clientX, ev.clientY);
      this.setItemHover(hit ? hit.el : null);
      const comp = hit && isComp ? (hit.inst.items || []).find(x => itemDef(x) && itemDef(x).kind === 'component') : null;
      if (comp) this.showItemPreview(combineItems(comp, id), g.x, g.y);
      else this.hideItemPreview();
    };
    const up = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!ghost) {
        if (itemDef(id) && itemDef(id).box) this.act({ t: 'box', k: 'open', i: idx, id });
        return;
      }
      ghost.remove();
      srcEl.classList.remove('dragging');
      this.setItemHover(null);
      this.dragging = false;
      this.hideItemPreview();
      clearTimeout(hold.timer);
      this.setSwapHover(null);
      const slot = this.itemSlotAt(ev.clientX, ev.clientY, srcEl);
      if (isComp && hold.done && slot && slot.dataset.idx === hold.slot) {
        this.act({ t: 'combine', i: idx, id, j: Number(slot.dataset.idx), jd: slot.dataset.item });
      } else if (slot) {
        if (Number(slot.dataset.idx) !== idx) this.act({ t: 'iswap', i: idx, id, j: Number(slot.dataset.idx), jd: slot.dataset.item });
      } else if (!this.overItemPanel(ev.clientX, ev.clientY)) {
        const hit = this.itemTargetAt(ev.clientX, ev.clientY);
        if (hit) this.act({ t: 'item', i: idx, id, iid: hit.inst.iid });
      }
      this.render();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  uniqueStack(id) {
    const p = this.viewed();
    const g = this.game;
    const cfg = CONFIG.unlock;
    const m = g.phase === 'combat' && g.matches.length ? g.matchFor(p) : null;
    const side = m ? g.sideOf(m, p) : null;
    const live = fn => (m && side ? fn(m.sim, side) : 0);
    if (id === '치유의 마음') return '회복 중첩 ' + Math.floor(p.counters.heal + live((s, sd) => s.side[sd].stats.heal));
    if (id === '유전자') return '유전자 ' + Math.floor(p.counters.gene) + ' / ' + cfg.geneStack;
    if (id === '다운로드') {
      const next = p.downloadStage === 0 ? cfg.downloadStage1 : p.downloadStage === 1 ? cfg.downloadStage2 : null;
      return '다운로드 ' + Math.floor(p.counters.download + live(s => s.casts)) + (next ? ' / ' + next : ' (완료)');
    }
    if (id === '최하위 포식자') {
      const k = p.allUnits().find(u => u.unitId === '잉어킹' && u.star === 3);
      return k ? '전투 참여 ' + (k.battles || 0) + ' / ' + cfg.magikarpBattles : '3성 잉어킹 필요';
    }
    if (id === '저주받은 그림자') return '그림자 ' + live((s, sd) => s.side[sd].shadows || 0);
    if (id === '대식가') {
      const f = p.allUnits().filter(u => u.unitId === '먹고자' && u.feast).reduce((sum, u) => sum + Object.values(u.feast).reduce((a, b) => a + b, 0), 0);
      return '삼킨 능력치 +' + Math.round(f * 100) + '%';
    }
    if (id === '괴짜') {
      const tgt = dittoTargetOf(p);
      return tgt ? '연결: ' + formOf(UNITS[tgt.unitId], tgt.star, p).name : '';
    }
    if (id === '천둥의 화신') return '';
    if (id === '열기의 화신') return '화상 피해 ' + Math.floor(p.counters.burn);
    return '';
  }

  showTraitTip(row, id, where, owner) {
    clearTimeout(this.tipTimer);
    if (this.dragging) return;
    this.hideTooltip();
    const r = row.getBoundingClientRect();
    this.tipTrait = id;
    this.tipWhere = where || 'left';
    this.tipOwner = owner || null;
    this.tipTop = this.toGame(r.left, r.top).y;
    this.tipRight = this.toGame(r.right, r.top).x;
    this.renderTraitTip();
  }

  renderTraitTip() {
    const tip = this.$('trait-tip');
    if (!this.tipTrait) return;
    View.renderTraitTip(tip, this.tipTrait, this.tipOwner || this.viewed(), this.game ? this.game.isRegional() : false);
    tip.classList.add('show');
    tip.style.left = this.tipWhere === 'info' ? (1096 - tip.offsetWidth - 10) + 'px' : this.tipWhere === 'planner' ? (this.tipRight + 8) + 'px' : '';
    const h = tip.offsetHeight;
    tip.style.top = Math.max(8, Math.min(712 - h, this.tipTop - 6)) + 'px';
  }

  skillNote(t) {
    if (!t.form || (t.form.skill !== '고양이돈받기' && t.form.skill !== '도둑질')) return '';
    let inst = t.inst || null;
    if (!inst && t.combat && t.combat.iid) inst = this.human.findInstance(t.combat.iid) || this.viewed().findInstance(t.combat.iid);
    const total = ((inst && inst.payday) || 0) + ((t.combat && t.combat.payday) || 0);
    return '\n\n지금까지 번 골드: ' + total + '골드';
  }

  toggleEvo(t) {
    let pop = this.$('evo-pop');
    if (!pop) {
      pop = View.el('div', 'frame');
      pop.id = 'evo-pop';
      this.gameEl.appendChild(pop);
    }
    if (pop.classList.contains('show') && pop.dataset.unit === t.def.id) {
      this.closeEvo();
      return;
    }
    pop.dataset.unit = t.def.id;
    View.renderEvo(pop, t.def, t.owner || this.viewed());
    pop.classList.add('show');
    pop.style.left = (1096 - pop.offsetWidth - 10) + 'px';
  }

  closeEvo() {
    const pop = this.$('evo-pop');
    if (pop) pop.classList.remove('show');
  }

  hideTraitTipSoon() {
    clearTimeout(this.tipTimer);
    this.tipTimer = setTimeout(() => {
      this.tipTrait = null;
      this.$('trait-tip').classList.remove('show');
    }, 140);
  }

  setTimer(left, total) {
    this.$('timer-bar').style.width = Math.max(0, Math.min(100, total > 0 ? (left / total) * 100 : 0)) + '%';
    this.$('timer-num').textContent = Math.max(0, Math.ceil(left));
  }

  renderShop() {
    const h = this.human;
    const can = this.canShop();
    this.$('level-text').textContent = h.level + '레벨';
    const need = h.xpNeeded();
    this.$('xp-text').textContent = h.level >= h.maxLevel() ? 'MAX' : h.xp + '/' + need;
    this.$('xp-bar').style.width = (h.level >= h.maxLevel() ? 100 : (h.xp / need) * 100) + '%';
    this.$('btn-xp').disabled = !can || h.gold < CONFIG.xpCost || h.level >= h.maxLevel();
    const rc = this.game.rerollCost(h);
    const off = this.game.shopOff(h);
    this.$('btn-reroll').disabled = !can || h.gold < rc || off;
    const rk = rc + '|' + h.freeRolls;
    if (this.rerollKey !== rk) {
      this.rerollKey = rk;
      const free = h.freeRolls;
      this.$('btn-reroll').innerHTML = iconSvg('refresh', 20) + '<span class="lbl">새로고침<small>' + (rc ? iconSvg('coin', 10) + rc : '무료' + (free ? ' ' + free : '')) + '</small></span>';
    }
    const odds = CONFIG.shopOdds[Math.min(h.level, CONFIG.maxLevel)];
    const oddsEl = this.$('odds');
    oddsEl.innerHTML = '';
    odds.forEach((v, i) => {
      const s = View.el('span');
      const sw = View.el('i');
      sw.style.background = COST_COLORS[i + 1];
      s.appendChild(sw);
      s.appendChild(document.createTextNode(v + '%'));
      oddsEl.appendChild(s);
    });
    this.$('gold-num').textContent = h.gold;
    const st = this.$('streak-box');
    st.innerHTML = '';
    if (Math.abs(h.streak) >= 1) {
      st.innerHTML = iconSvg(h.streak > 0 ? 'flame' : 'drop', 14);
      st.appendChild(document.createTextNode(Math.abs(h.streak)));
      st.title = Math.abs(h.streak) + (h.streak > 0 ? '연승' : '연패');
    }
    const lock = this.$('btn-lock');
    lock.innerHTML = iconSvg(h.shopLocked ? 'lock' : 'unlock', 16);
    lock.classList.toggle('on', h.shopLocked);
    const cards = this.$('shop-cards');
    cards.innerHTML = '';
    cards.classList.toggle('off', off);
    for (let i = 0; i < CONFIG.shopSize; i++) {
      const card = View.shopCard(this.game, h, i, can);
      if (h.shop[i]) card.addEventListener('pointerdown', e => this.onShopPointerDown(e, i, card));
      cards.appendChild(card);
    }
  }

  chartMatch() {
    const V = this.viewed();
    const g = this.game;
    if (g.matches.length) return g.matchFor(V);
    return this.lastMatches.find(m => m.a === V || (m.b === V && !m.ghost)) || null;
  }

  damageData() {
    const m = this.chartMatch();
    if (!m) return null;
    const V = this.viewed();
    const side = m.a === V ? 'A' : 'B';
    const other = side === 'A' ? 'B' : 'A';
    let oppTitle;
    if (m.kind === 'pve') oppTitle = m.camp.leader ? '체육관' : (m.camp === CONFIG.pve.default ? '아르세우스' : 'PvE 포켓몬');
    else oppTitle = side === 'A' ? m.b.name + (m.ghost ? ' (복제)' : '') : m.a.name;
    const pick = s => m.sim.units.filter(u => u.side === s);
    const syn = s => m.sim.side[s].synDmg || {};
    return { mine: { title: V.name, units: pick(side), syn: syn(side) }, opp: { title: oppTitle, units: pick(other), syn: syn(other) } };
  }

  renderDamage() {
    View.renderDamage(this.$('damage'), this.damageData(), this.dmgState, {
      toggleExpand: () => {
        this.dmgState.expanded = !this.dmgState.expanded;
        this.renderDamage();
      },
      setTab: t => {
        this.dmgState.tab = t;
        this.renderDamage();
      },
      select: cu => this.select({ combat: cu })
    });
  }

  select(src) {
    this.selected = src;
    this.renderInfo();
    if (this.scene().mode === 'planning') this.renderArena();
  }

  closeInfo() {
    this.selected = null;
    this.renderInfo();
    if (this.scene().mode === 'planning') this.renderArena();
  }

  infoTarget() {
    const s = this.selected;
    if (!s) return null;
    if (s.inst) {
      if (!s.inst.loc && !s.preview) return null;
      return View.infoFromInstance(s.inst, s.owner);
    }
    if (s.creep) return View.infoFromCreep(s.creep);
    if (s.combat) return View.infoFromCombat(s.combat);
    return null;
  }

  renderInfo() {
    const panel = this.$('info-panel');
    const t = this.infoTarget();
    if (!t) {
      if (this.selected) this.selected = null;
      panel.classList.remove('show');
      panel.innerHTML = '';
      this.closeEvo();
      return;
    }
    View.renderInfo(panel, t, {
      traitEnter: (el, id) => this.showTraitTip(el, id, 'info'),
      traitLeave: () => this.hideTraitTipSoon(),
      evo: tt => this.toggleEvo(tt),
      skillNote: tt => this.skillNote(tt)
    });
    const pop = this.$('evo-pop');
    if (pop && pop.classList.contains('show') && t.def && pop.dataset.unit !== t.def.id) this.closeEvo();
    if (t.inst && t.owner && !this.selected.preview) {
      const note = Unlocks.progressText(t.inst, t.owner, this.game);
      if (note) panel.appendChild(View.el('div', 'ip-note', note));
    }
    panel.classList.add('show');
  }

  canDrag(inst) {
    const ph = this.game.phase;
    if (this.viewId !== this.human.id || !this.human.alive || !inst.loc) return false;
    if (ph === 'planning') return true;
    if (ph === 'combat' || ph === 'result') return inst.loc.zone === 'bench';
    return false;
  }

  onTokenPointerDown(e, src, srcEl) {
    if (e.button !== 0) return;
    if (srcEl && srcEl.classList.contains('evo-hide')) {
      srcEl.classList.remove('evo-hide');
      srcEl._evoGrab = true;
    }
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const inst = src.inst;
    const draggable = inst && src.owner && src.owner === this.human && !src.preview && this.canDrag(inst);
    let ghost = null;
    const hold = { target: null, timer: null, done: false, used: false };
    const holdKind = other => {
      if (!other || other === inst) return null;
      if (inst.unitId === '메타몽' && other.unitId !== '메타몽') return 'link';
      if (other.unitId === '먹고자' && this.game.canFeed(this.human, inst, other).ok) return 'feed';
      return null;
    };
    const resetHold = () => {
      clearTimeout(hold.timer);
      hold.timer = null;
      hold.target = null;
      hold.done = false;
      if (ghost) ghost.classList.remove('holding', 'hold-done');
    };
    const trackHold = t => {
      const other = t && (t.kind === 'board' || t.kind === 'bench') ? this.human.unitAt(t.kind === 'board' ? { zone: 'board', r: t.r, c: t.c } : { zone: 'bench', i: t.i }) : null;
      const kind = holdKind(other);
      if (!kind) {
        if (hold.target) resetHold();
        return;
      }
      if (hold.target === other) return;
      resetHold();
      hold.target = other;
      ghost.classList.add('holding');
      hold.timer = setTimeout(() => {
        hold.done = true;
        if (ghost) {
          ghost.classList.remove('holding');
          ghost.classList.add('hold-done');
        }
        if (kind === 'link') {
          hold.used = true;
          this.act({ t: 'ditto', d: inst.iid, x: other.iid });
        }
      }, 1000);
    };
    const move = ev => {
      if (!draggable) return;
      if (!ghost) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        this.dragging = true;
        this.hideTooltip();
        const v = View.instanceView(inst, this.human);
        v.className = 'unit ghost';
        ghost = View.unitEl(v);
        View.unitBars(ghost, instanceStats(inst, this.human).hp);
        ghost.classList.add('planbar');
        ghost.style.transform = srcEl.style.transform || '';
        ghost.style.transformOrigin = srcEl.style.transformOrigin || '';
        this.gameEl.appendChild(ghost);
        srcEl.classList.add('dragging');
        if (this.canShop()) {
          this.$('sell-hint').textContent = '판매 +' + sellValue(UNITS[inst.unitId], inst.star) + 'G';
          this.$('shop').classList.add('sell-target');
        }
      }
      const g = this.toGame(ev.clientX, ev.clientY);
      ghost.style.left = g.x + 'px';
      ghost.style.top = (g.y + 16) + 'px';
      const tgt = this.dropTargetAt(ev.clientX, ev.clientY, srcEl);
      this.highlight(tgt);
      trackHold(tgt);
    };
    const up = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!ghost) {
        this.select(src);
        return;
      }
      ghost.remove();
      this.arena.drawOverlay(null);
      this.$('shop').classList.remove('sell-target');
      this.dragging = false;
      const t = this.dropTargetAt(ev.clientX, ev.clientY, srcEl);
      const eater = hold.target;
      const fed = hold.done && eater && holdKind(eater) === 'feed' && t && this.human.unitAt(t.kind === 'board' ? { zone: 'board', r: t.r, c: t.c } : { zone: 'bench', i: t.i }) === eater;
      clearTimeout(hold.timer);
      if (fed) {
        this.act({ t: 'feed', f: inst.iid, e: eater.iid });
        this.hoverInst = null;
      } else if (!hold.used && t) this.dropOn(inst, t);
      this.render();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  dropTargetAt(x, y, srcEl) {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      if (el.closest('#shop')) return { kind: 'sell' };
      const u = el.closest('.unit');
      if (u && u !== srcEl && u._inst && u._owner && u._owner === this.human && u._inst.loc && !u.classList.contains('ghost')) {
        const loc = u._inst.loc;
        if (loc.zone === 'board') return { kind: 'board', r: loc.r, c: loc.c };
        return { kind: 'bench', i: loc.i };
      }
    }
    return this.arena.hitTest(x, y);
  }

  highlight(t) {
    const opts = { grid: this.game.phase === 'planning' };
    if (t && t.kind === 'board') opts.cell = { r: t.r, c: t.c };
    if (t && t.kind === 'bench') opts.slot = t.i;
    this.arena.drawOverlay(opts);
  }

  dropOn(inst, t) {
    const g = this.game;
    if (t.kind === 'sell') {
      if (!this.canShop()) return;
      if (g.phase === 'combat' && inst.loc && inst.loc.zone === 'board') {
        this.toast('전투 중에는 필드의 기물을 팔 수 없습니다', 'error');
        return;
      }
      this.act({ t: 'sell', iid: inst.iid });
      Sound.sfx('sell');
      this.hoverInst = null;
      return;
    }
    if (t.kind === 'board') {
      if (g.phase !== 'planning') {
        this.toast('전투 중에는 필드를 바꿀 수 없습니다', 'error');
        return;
      }
      if (inst.loc && inst.loc.zone === 'bench' && !this.human.unitAt({ zone: 'board', r: t.r, c: t.c }) && this.human.boardCount() >= this.human.boardLimit()) {
        this.toast('필드에 놓을 수 있는 기물은 ' + this.human.boardLimit() + '개입니다', 'error');
        return;
      }
      this.act({ t: 'move', iid: inst.iid, z: 'board', r: t.r, c: t.c });
      Sound.sfx('place');
    } else if (t.kind === 'bench') {
      this.act({ t: 'move', iid: inst.iid, z: 'bench', i: t.i });
      Sound.sfx('place');
    }
  }

  setupTouchMove() {
    let tap = null;
    this.$('arena').addEventListener('pointerdown', e => {
      tap = null;
      if (e.pointerType === 'mouse' || !e.isPrimary) return;
      if (!this.carouselScene && e.target.closest('.unit')) return;
      tap = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
    }, true);
    window.addEventListener('pointerup', e => {
      const t = tap;
      tap = null;
      if (!t || e.pointerId !== t.id) return;
      if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 16 || performance.now() - t.t > 600) return;
      this.moveStrategist(e.clientX, e.clientY);
    });
    window.addEventListener('pointercancel', () => {
      tap = null;
    });
  }  

  moveStrategist(cx, cy) {
    if (!this.human.alive) return;
    if (this.carouselScene && !this.viewCarousel) return;
    const st = this.driver.strats[this.human.id];
    const csc = this.curScene;
    const ownFight = csc && csc.mode === 'combat' && csc.bottom && csc.bottom.player === this.human && st.at === this.human.id;
    if (!this.carouselScene && this.viewId !== this.human.id && st.at !== this.viewId && !ownFight) return;
    const p = this.arena.toFlat(cx, cy);
    let x = Math.max(-20, Math.min(ARENA_W + 20, p.x));
    let y = Math.max(-10, Math.min(ARENA_H + 10, p.y + 8));
    const sc = this.carouselScene;
    if (sc && !this.game.carouselReleased(this.human)) {
      const sp = sc.spawn[this.human.id];
      const dx = x - sp.x;
      const dy = y - sp.y;
      const d = Math.hypot(dx, dy);
      const R = CAROUSEL.padR - 30;
      if (d > R) {
        x = sp.x + (dx / d) * R;
        y = sp.y + (dy / d) * R;
      }
    }
    const orbs = !sc && this.viewId === this.human.id ? this.human.orbs || [] : [];
    for (const o of orbs) {
      const op = orbFlatPos(o);
      if (Math.hypot(op.x - p.x, op.y - p.y) < 68) {
        x = op.x;
        y = op.y;
        break;
      }
    }
    this.act({ t: 'strat', x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  loop(t) {
    const dt = Math.min(0.1, Math.max(0, (t - this.last) / 1000));
    this.last = t;
    try {
      this.frame(dt);
    } catch (err) {
      console.error(err);
    }
    requestAnimationFrame(n => this.loop(n));
  }

  frame(dt) {
    this.checkTooltip();
    if (this.mode === 'solo') {
      this.tickAcc += dt;
      let n = 0;
      while (this.tickAcc >= DRIVER_TICK && n < 8) {
        this.stepDriver(this.pending.splice(0));
        this.tickAcc -= DRIVER_TICK;
        n++;
      }
      if (n >= 8) this.tickAcc = 0;
    } else {
      const backlog = this.netQueue.length;
      if (backlog > 60 && !this.replaying) this.replaying = true;
      let n = 0;
      if (this.replaying) {
        while (this.netQueue.length && n < 3000) {
          this.stepDriver(this.netQueue.shift());
          n++;
        }
      } else {
        this.netAcc = (this.netAcc || 0) + dt;
        while (this.netQueue.length && n < 4 && (this.netAcc >= DRIVER_TICK || this.netQueue.length > 3)) {
          this.stepDriver(this.netQueue.shift());
          this.netAcc = Math.max(0, this.netAcc - DRIVER_TICK);
          n++;
        }
        if (!this.netQueue.length) this.netAcc = Math.min(this.netAcc, DRIVER_TICK);
      }
      if (this.replaying && this.netQueue.length < 3) {
        this.replaying = false;
        this.afterReplay();
      }
    }
    if (!this.replaying) this.updateVisuals(dt);
  }

  afterReplay() {
    const g = this.game;
    if (this._taxi) this.taxiReset();
    this.closeModal();
    if (this.carouselScene && g.phase !== 'carousel') {
      this.carouselScene = null;
      this.arena.setCarouselMode(false);
    }
    if (g.phase === 'carousel' && !this.carouselScene) this.startCarousel();
    this.combatRunning = g.phase === 'combat';
    this.arenaKey = null;
    this.render();
    if (!this.human.alive && g.phase !== 'over') this.showEliminated();
    if (g.phase === 'over' && this.driver.state === 'over') this.showGameOver();
  }

  stepDriver(actions) {
    this.driver.step(actions);
    const viewSim = this.arena.sim;
    for (const m of this.game.matches) {
      if (!m.sim) continue;
      const evs = m.sim.drainEvents();
      if (!this.replaying && m.sim === viewSim && evs.length) this.arena.applyEvents(evs);
    }
  }

  updateVisuals(dt) {
    const d = this.driver;
    const g = this.game;
    const tn = this.$('timer-num');
    if (d.state === 'planning') {
      this.setTimer(d.timeLeft, d.timerTotal);
      tn.dataset.tip = PHASE_LABEL.planning;
    } else if (d.state === 'precombat') {
      this.setTimer(d.wait, CONFIG.preCombat);
      tn.dataset.tip = '전투 시작까지';
    } else if (d.state === 'combat' || d.state === 'ending') {
      const viewSim = this.arena.sim;
      if (viewSim) this.setTimer(CONFIG.combat.timeLimit - viewSim.time, CONFIG.combat.timeLimit);
      tn.dataset.tip = PHASE_LABEL.combat;
    } else if (d.state === 'carousel' && g.carousel) {
      this.setTimer(g.carousel.duration - g.carousel.time, g.carousel.duration);
      tn.dataset.tip = g.carousel.encounter ? '조우자' : PHASE_LABEL.carousel;
    }
    if (d.state === 'combat' && this.lastDrvState !== 'combat' && !this.replaying && this.rightMode !== 'damage') this.setRightMode('damage');
    this.lastDrvState = d.state;
    Bgm.play(this.bgmKey());
    this.evoUpdate(dt);
    if (this.human.level !== this.sfxLevel) {
      if (this.sfxLevel && this.human.level > this.sfxLevel && !this.replaying) Sound.sfx('levelup');
      this.sfxLevel = this.human.level;
    }
    this.taxiFx().update(dt);
    if (this.curtainQ && this.curtainQ.length) this.flushCurtain();
    this.taxiPlanTick();
    if (this.boxKey) this.updateBoxTimer();
    if (this.augKey || this.$('aug-toggle').classList.contains('show')) this.updateAugTimer();
    this.placeAugBalls();
    this.placeDrills();
    this.syncMe(dt);
    if (this.combatRunning) {
      this.arena.updateBars();
      this.dmgTimer += dt;
      if (this.dmgTimer > 0.3) {
        this.dmgTimer = 0;
        if (this.rightMode === 'damage') this.renderDamage();
        if (this.selected && this.selected.combat) this.renderInfo();
        this.renderTraitPanel();
      }
    }
    if (this.carouselScene) this.updateCarousel(dt);
  }

  syncMe(dt) {
    const me = this.arena.me;
    this.taxiFx();
    if (this.tx.freezeMe) {
      this.applyTaxiVis(me, this.human.id);
      me.update(dt);
      this.syncOthers(dt);
      return;
    }
    const s = this.driver.strats[this.human.id];
    const sc = this.curScene;
    let show = false;
    if (this.carouselScene) show = this.viewCarousel;
    else if (!sc || sc.carouselField || sc.mode === 'carousel') show = false;
    else if (sc.mode === 'planning') show = this.human.alive && s.at === this.viewId;
    else if (s.at !== this.human.id) show = this.human.alive && s.at === this.viewId;
    else show = !!(sc.bottom && sc.bottom.player === this.human);
    const disp = show ? '' : 'none';
    if (me.el.style.display !== disp) {
      me.el.style.display = disp;
      if (show) me.place(s.x, s.y);
    }
    if (show) {
      const d = Math.hypot(s.x - me.x, s.y - me.y);
      if (d > 150) me.place(s.x, s.y);
      else {
        me.speed = Math.max(60, s.v || s.speed) * 1.3;
        me.moveTo(s.x, s.y);
      }
      me.busy = Math.hypot(s.tx - s.x, s.ty - s.y) > 1;
    }
    this.applyTaxiVis(me, this.human.id);
    me.update(dt);
    this.syncOthers(dt);
  }

  syncOthers(dt) {
    const a = this.arena;
    const d = this.driver;
    const sc = this.curScene;
    const want = new Map();
    const mir = s => ({ x: 792 - s.x, y: 530 - s.y });
    if (sc && !this.carouselScene && sc.mode !== 'carousel' && !sc.carouselField) {
      if (sc.mode === 'planning') {
        const V = this.viewed();
        const hostBottom = V === this.human;
        for (const p of this.game.players) {
          if (p === this.human || !p.alive) continue;
          const s = d.strats[p.id];
          if (s.at !== V.id) continue;
          want.set(p.id, (p === V) !== hostBottom ? mir(s) : { x: s.x, y: s.y });
        }
      } else {
        for (const [role, top] of [[sc.top, true], [sc.bottom, false]]) {
          if (!role || !role.player || role.ghost || role.player === this.human || !role.player.alive) continue;
          const s = d.strats[role.player.id];
          if (s.at !== role.player.id) continue;
          want.set(role.player.id, top ? mir(s) : { x: s.x, y: s.y });
        }
        const topP = sc.top && sc.top.player && !sc.top.ghost ? sc.top.player : null;
        const botP = sc.bottom && sc.bottom.player && !sc.bottom.ghost ? sc.bottom.player : null;
        for (const p of this.game.players) {
          if (p === this.human || !p.alive) continue;
          const s = d.strats[p.id];
          if (s.at === p.id) continue;
          if (topP && s.at === topP.id) want.set(p.id, { x: s.x, y: s.y });
          else if (botP && s.at === botP.id) want.set(p.id, mir(s));
        }
      }
    }
    for (const id in a.others) {
      if (!want.has(Number(id))) {
        a.others[id].el.remove();
        delete a.others[id];
      }
    }
    for (const [id, pos] of want) {
      const p = this.game.players[id];
      let sp = a.others[id];
      if (!sp) {
        sp = new StratSprite({ look: p.strategist, player: p, x: pos.x, y: pos.y });
        a.stratLayer.appendChild(sp.el);
        a.others[id] = sp;
      }
      const dist = Math.hypot(pos.x - sp.x, pos.y - sp.y);
      if (dist > 150) sp.place(pos.x, pos.y);
      else {
        sp.speed = Math.max(60, d.strats[id].v || d.strats[id].speed) * 1.3;
        sp.moveTo(pos.x, pos.y);
      }
      const ds = d.strats[id];
      sp.busy = Math.hypot(ds.tx - ds.x, ds.ty - ds.y) > 1;
      this.applyTaxiVis(sp, id);
      sp.update(dt);
    }
  }

  onCombatStart(e) {
    if (this.modalKind === 'branch') this.closeModal();
    if (e.none) {
      if (!this.replaying) this.render();
      return;
    }
    this.combatRunning = true;
    this.ending = false;
    this.arenaKey = null;
    if (this.replaying) return;
    this.taxiCombatStart(e);
    this.render();
    if (e.pre > 0) this.toast('매칭 완료! ' + CONFIG.preCombat + '초 뒤 전투가 시작됩니다', 'info');
  }

  onCombatEnd() {
    const g = this.game;
    this.combatRunning = false;
    this.lastMatches = g.matches.slice();
    if (this.replaying) return;
    const h = this.human;
    const banner = this.$('banner');
    if (h.lastResult && h.alive) {
      const res = h.lastResult;
      banner.className = 'show ' + res;
      banner.innerHTML = (res === 'win' ? '승리!' : res === 'draw' ? '무승부' : '패배') + (h.lastDamage ? '<small>체력 -' + h.lastDamage + '</small>' : '');
    }
    this.render();
    this.taxiCombatEnd();
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      banner.className = '';
    }, 1400);
  }

  startCarousel() {
    if (this.taxiCarouselStart()) return;
    this.buildCarousel();
  }

  buildCarousel() {
    const g = this.game;
    const car = g.carousel;
    const a = this.arena;
    this.closeInfo();
    a.clearUnits();
    a.clearSideSprites();
    a.renderOrbs([]);
    a.setCarouselMode(true);
    a.carLayer.innerHTML = '';
    const sc = { sprites: {}, spawn: {}, items: [], ended: false };
    for (const p of car.order) {
      const sp = a.carouselSpawn(p.id, g.players.length);
      sc.spawn[p.id] = sp;
      if (p === this.human) {
        a.me.place(sp.x, sp.y);
      } else {
        const s = new StratSprite({ look: p.strategist, player: p, x: sp.x, y: sp.y, speed: CONFIG.carousel.moveSpeed });
        a.carLayer.appendChild(s.el);
        sc.sprites[p.id] = s;
      }
    }
    car.items.forEach((item, idx) => {
      const def = UNITS[item.unitId];
      const form = formOf(def, 1, this.human);
      const el = View.unitEl({ className: 'unit', name: form.name, form, types: form.types, star: 1, cost: def.cost, badge: View.badgeFor(def), items: item.item ? [item.item] : [] });
      el.classList.add('car-item');
      paintCost(el, def.cost);
      el.addEventListener('pointerdown', e => this.onTokenPointerDown(e, { inst: { unitId: item.unitId, star: 1 }, owner: this.human, preview: true }, el));
      a.carLayer.appendChild(el);
      sc.items[idx] = el;
    });
    const enc = car.encounter ? encounterDef(car.encounter) : null;
    if (enc) {
      const el = View.unitEl({ className: 'unit', name: enc.id, form: { en: enc.en }, types: [], star: 3, cost: 5 });
      el.classList.add('car-item', 'enc-mon');
      a.carLayer.appendChild(el);
      placeSprite(el, CAROUSEL_CENTER.x, CAROUSEL_CENTER.y, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE * 1.5);
      sc.enc = el;
      const card = this.$('enc-card');
      card.innerHTML = '';
      card.appendChild(View.el('div', 'enc-kicker', '조우자'));
      card.appendChild(View.el('b', 'enc-name', enc.id));
      card.appendChild(View.el('div', 'enc-desc', enc.desc));
      if (enc.sub) card.appendChild(View.el('div', 'enc-sub', enc.sub));
      card.classList.add('show');
    }
    this.carouselScene = sc;
    this.viewId = this.human.id;
    this.viewCarousel = true;
    this.arenaKey = null;
    for (const p of car.order) if (this.driver.strats[p.id].carry) this.onCarry(p.id);
    if (this.replaying) return;
    this.render();
    if (!enc) this.toast('회전초밥! 체력이 낮은 순서로 두 명씩 결계가 풀립니다', 'info');
  }

  carriedToken(unitId) {
    const def = UNITS[unitId];
    const form = formOf(def, 1, this.human);
    return View.unitEl({ className: 'unit', name: '', form, types: form.types, star: 1, cost: def.cost });
  }

  onCarry(pid) {
    const sc = this.carouselScene;
    if (!sc) return;
    const s = this.driver.strats[pid];
    const sprite = pid === this.human.id ? this.arena.me : sc.sprites[pid];
    if (!sprite) return;
    sprite.carry(s.carry ? this.carriedToken(s.carry) : null);
    if (pid === this.human.id && !this.replaying) this.renderHud();
  }

  updateCarousel(dt) {
    const g = this.game;
    const car = g.carousel;
    const sc = this.carouselScene;
    const a = this.arena;
    if (!car) return;
    car.items.forEach((item, idx) => {
      const p = carouselItemFlat(item);
      const el = sc.items[idx];
      el.style.display = item.takenBy === null ? '' : 'none';
      placeSprite(el, p.x, p.y, UNIT_ORIGIN.x, UNIT_ORIGIN.y, UNIT_SCALE);
    });
    if (this.viewCarousel) {
      const closed = car.order.filter(p => !g.carouselReleased(p)).map(p => ({ x: sc.spawn[p.id].x, y: sc.spawn[p.id].y, open: false }));
      a.drawOverlay(closed.length ? { barriers: closed } : null);
    }
    for (const id in sc.sprites) {
      const sp = sc.sprites[id];
      const s = this.driver.strats[id];
      const d = Math.hypot(s.x - sp.x, s.y - sp.y);
      if (d > 150) sp.place(s.x, s.y);
      else {
        sp.speed = Math.max(60, s.v || s.speed) * 1.3;
        sp.moveTo(s.x, s.y);
      }
      this.applyTaxiVis(sp, Number(id));
      sp.update(dt);
    }
  }

  endCarousel() {
    const a = this.arena;
    const sc = this.carouselScene;
    if (!sc) return;
    for (const id in sc.sprites) sc.sprites[id].el.remove();
    a.carLayer.innerHTML = '';
    this.$('enc-card').classList.remove('show', 'enc-fade');
    a.drawOverlay(null);
    a.me.carry(null);
    a.me.place(HOME_BOTTOM.x, HOME_BOTTOM.y);
    a.me.el.style.display = '';
    a.setCarouselMode(false);
    a.showCarouselLayer(true);
    this.carouselScene = null;
    this.viewCarousel = false;
    this.viewId = this.human.id;
    this.arenaKey = null;
  }

  toast(msg, kind) {
    const box = this.$('toasts');
    const el = View.el('div', 'toast ' + (kind || 'info'), msg);
    box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => el.remove(), 3000);
  }

  showTooltip(anchor, text) {
    if (!text) return;
    this.tipAnchor = anchor;
    const tip = this.$('tooltip');
    if (text.includes('⟦')) tip.innerHTML = View.esc(text).replace(/⟦(.*?)⟧/g, '<span class="up">$1</span>');
    else tip.textContent = text;
    tip.classList.toggle('long', text.includes('\n'));
    tip.classList.add('show');
    const r = anchor.getBoundingClientRect();
    const g = this.toGame(r.left + r.width / 2, r.bottom);
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let x = g.x - w / 2;
    x = Math.max(4, Math.min(1280 - w - 4, x));
    let y = g.y + 6;
    if (y + h > 716) y = Math.max(4, this.toGame(0, r.top).y - h - 6);
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  hideTooltip() {
    this.$('tooltip').classList.remove('show');
    this.tipAnchor = null;
  }

  checkTooltip() {
    const a = this.tipAnchor;
    if (!a) return;
    let hovered = false;
    try {
      hovered = a.isConnected && a.matches(':hover');
    } catch (e) {
      hovered = false;
    }
    if (!hovered) this.hideTooltip();
  }

  showUnitTip(anchor) {
    let tip = this.$('unit-tip');
    if (!tip) {
      tip = View.el('div', 'frame');
      tip.id = 'unit-tip';
      this.gameEl.appendChild(tip);
    }
    View.renderUnitTip(tip, anchor.dataset.unit, anchor.dataset.form, anchor.dataset.note, this.human);
    tip.classList.add('show');
    const r = anchor.getBoundingClientRect();
    const host = anchor.closest('#trait-tip');
    const hr = host ? host.getBoundingClientRect() : r;
    const a = this.toGame(hr.left, r.top);
    const b = this.toGame(hr.right, r.bottom);
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let x = b.x + 8;
    if (x + w > 1276) x = a.x - w - 8;
    x = Math.max(4, x);
    const y = Math.max(4, Math.min(716 - h, a.y - 4));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  hideUnitTip() {
    const tip = this.$('unit-tip');
    if (tip) tip.classList.remove('show');
  }

  openModal(kind, content) {
    const m = this.$('modal');
    m.innerHTML = '';
    m.appendChild(content);
    m.classList.add('show');
    this.modalKind = kind;
  }

  closeModal() {
    const m = this.$('modal');
    m.classList.remove('show');
    m.innerHTML = '';
    this.modalKind = null;
  }

  maybeShowBranch() {
    if (this.modalKind || this.replaying) return;
    const h = this.human;
    const unitId = h.pendingBranch.find(id => !this.branchSent.has(id + '|' + this.game.roundLabel()));
    if (!unitId) return;
    const def = UNITS[unitId];
    const box = View.el('div', 'modal-box');
    box.appendChild(View.el('div', 'modal-title', formOf(def, 1, h).name + ' 진화 갈래 선택'));
    box.appendChild(View.el('div', 'modal-sub', def.branchStar + '성부터 이 모습이 됩니다. 이 계열의 기물은 모두 같은 갈래를 따릅니다.'));
    const grid = View.el('div', 'pick-grid' + (def.branches.length > 3 ? ' wide' : ''));
    for (const b of def.branches) {
      const card = View.pickCard(def, h, b.form, b.traits);
      card.addEventListener('click', () => {
        this.branchSent.add(unitId + '|' + this.game.roundLabel());
        this.act({ t: 'branch', u: unitId, k: b.key });
        this.closeModal();
      });
      grid.appendChild(card);
    }
    box.appendChild(grid);
    this.openModal('branch', box);
  }

  showCredits() {
    if (this.modalKind) return;
    const box = View.el('div', 'modal-box credit-box');
    box.appendChild(View.el('div', 'modal-title', '크레딧'));
    const body = View.el('div', 'credit-body');
    const ko = {};
    for (const name in FORM_INDEX) if (!ko[FORM_INDEX[name].en]) ko[FORM_INDEX[name].en] = name;
    const byAuthor = {};
    for (const en in SPRITE_CREDITS) {
      for (const who of SPRITE_CREDITS[en].by) {
        if (!byAuthor[who]) byAuthor[who] = [];
        byAuthor[who].push(ko[en] || SPRITE_CREDITS[en].name);
      }
    }
    const sec = (title, lines) => {
      body.appendChild(View.el('div', 'credit-head', title));
      for (const l of lines) body.appendChild(View.el('div', 'credit-line', l));
    };
    sec('포켓몬 도트', [
      'PMD Sprite Repository (sprites.pmdcollab.org · github.com/PMDCollab/SpriteCollab)',
      '라이선스: CC BY-NC 4.0 (비상업적 이용, 출처 표기)',
      'CHUNSOFT: 포켓몬 불가사의 던전 공식 도트 ' + (byAuthor.CHUNSOFT || []).length + '종'
    ]);
    const authors = Object.keys(byAuthor).filter(a => a !== 'CHUNSOFT').sort((a, b) => a.localeCompare(b));
    sec('도트 제작·수정', authors.map(a => a + ': ' + byAuthor[a].join(', ')));
    sec('전략가 도트', ['포켓몬 필드 캐릭터 도트 시트 (The Spriters Resource) · 57명']);
    sec('그 밖의 그림', ['두드리짱의 망치 · 스마트로토무: 사용자 제공 그림을 도트로 축소', '아머까오택시 · 정면 몬스터볼·슈퍼볼 · 다크엘릭서 정제소: Claude가 그린 도트']);
    sec('폰트', ['Galmuri (quiple) · SIL Open Font License 1.1']);
    sec('원작', ['Pokémon © Nintendo, Creatures, GAME FREAK. 이 게임은 비공식 팬 게임입니다.']);
    box.appendChild(body);
    const actions = View.el('div', 'modal-actions');
    const close = View.el('button', null, '닫기');
    close.addEventListener('click', () => this.closeModal());
    actions.appendChild(close);
    box.appendChild(actions);
    this.openModal('credit', box);
  }

  showGameOver() {
    const g = this.game;
    const h = this.human;
    const box = View.el('div', 'modal-box');
    box.appendChild(View.el('div', 'modal-title', h.placement === 1 ? '우승!' : '게임 종료'));
    box.appendChild(View.el('div', 'modal-sub', '최종 순위 ' + h.placement + '등 · ' + g.roundLabel() + '에서 끝났습니다'));
    const list = View.el('div', 'order-list');
    const ranked = g.players.slice().sort((a, b) => (a.placement || 99) - (b.placement || 99));
    for (const p of ranked) list.appendChild(View.el('span', 'chip', (p.placement ? p.placement + '등 ' : '생존 ') + p.name));
    box.appendChild(list);
    if (this.ranked) box.appendChild(this.rankResultBox());
    const actions = View.el('div', 'modal-actions');
    if (this.net && !this.replaying) this.net.send({ t: 'over', ranks: g.players.map(p => p.placement || 0) });
    if (this.mode === 'mp' && !this.ranked) {
      const party = View.el('button', 'gold', '파티로 돌아가기');
      party.addEventListener('click', () => this.backToParty());
      actions.appendChild(party);
    }
    const again = View.el('button', null, '메인으로');
    again.addEventListener('click', () => this.leaveToMain());
    actions.appendChild(again);
    box.appendChild(actions);
    this.closeModal();
    this.openModal('over', box);
  }

  showEliminated() {
    if (this.modalKind === 'over' || this.modalKind === 'out') return;
    const h = this.human;
    const box = View.el('div', 'modal-box');
    box.appendChild(View.el('div', 'modal-title', '탈락'));
    box.appendChild(View.el('div', 'modal-sub', '최종 순위 ' + (h.placement || '-') + '등 · 남은 플레이어의 게임을 계속 볼 수 있습니다'));
    const actions = View.el('div', 'modal-actions');
    const watch = View.el('button', null, '계속 관전');
    watch.addEventListener('click', () => this.closeModal());
    const party = View.el('button', 'gold', '파티로 돌아가기');
    party.addEventListener('click', () => this.backToParty());
    const leave = View.el('button', null, '메인으로');
    leave.addEventListener('click', () => this.leaveToMain());
    actions.appendChild(watch);
    if (!this.ranked) actions.appendChild(party);
    else box.appendChild(View.el('div', 'modal-sub', '랭크 점수는 게임이 모두 끝나면 반영됩니다'));
    actions.appendChild(leave);
    box.appendChild(actions);
    this.closeModal();
    this.openModal('out', box);
  }

  rankResultBox() {
    const box = View.el('div', 'rank-result');
    const fill = m => {
      box.innerHTML = '';
      const a = m.after;
      const img = View.el('img', 'rank-ball');
      img.src = rankBallSrc(a.tier);
      box.appendChild(img);
      const t = View.el('div', 'rank-res-t');
      t.appendChild(View.el('b', null, rankLabel(a)));
      const d = View.el('span', 'rank-delta ' + (m.delta >= 0 ? 'up' : 'down'), (m.delta >= 0 ? '+' : '') + m.delta + ' LP');
      t.appendChild(d);
      if (a.tier !== m.before.tier || a.div !== m.before.div) t.appendChild(View.el('span', 'rank-move', (a.total > m.before.total ? '승급! ' : '강등 · ') + rankLabel(m.before) + ' → ' + rankLabel(a)));
      box.appendChild(t);
    };
    box.appendChild(View.el('span', 'rank-wait', '랭크 점수 계산 중…'));
    if (this.rankRes) fill(this.rankRes);
    else if (this.net) this.net.on('rankResult', m => {
      this.rankRes = m;
      fill(m);
    });
    return box;
  }

  leaveToMain() {
    if (this.net) this.net.leave();
    window.location.reload();
  }

  backToParty(stay) {
    if (this.net && !stay && this.game.phase !== 'over') this.net.send({ t: 'park' });
    try {
      sessionStorage.setItem('ptft-party', '1');
    } catch (e) {
      this.leaveToMain();
      return;
    }
    setTimeout(() => window.location.reload(), 150);
  }

  renderDebug() {
    const panel = this.$('debug');
    if (!panel.classList.contains('show')) return;
    const h = this.human;
    const u = CONFIG.unlock;
    const c = h.counters;
    const lines = [
      '윤겔라가 기절시킨 시간 ' + Math.floor(c.hypnosis) + ' / ' + u.hypnosisSeconds + '초 (후딘)',
      '회복 중첩 ' + Math.floor(c.heal) + ' / ' + u.healStack + ' (해피너스)',
      '유전자 ' + Math.floor(c.gene) + ' / ' + u.geneStack + ' (뮤츠)',
      '다운로드 ' + Math.floor(c.download) + ' / ' + u.downloadStage1 + ', ' + u.downloadStage2 + ' (현재 ' + UNITS['폴리곤'].stageForms[h.downloadStage].name + ')',
      '낙뢰 적중 ' + Math.floor(c.bolt) + ' / ' + u.electricBolts + ' (썬더)',
      '화상 피해 ' + Math.floor(c.burn) + ' / ' + u.burnDamage + ' (파이어)',
      '서로 다른 얼음 포켓몬 성 합계 ' + u.iceStarTotal + ' 이상으로 전투 시작 (프리져)',
      '화석 연승 ' + h.fossilWins + ' / ' + u.kabutoWins + ' (투구) · 연패 ' + h.fossilLosses + ' / ' + u.aerodactylLosses + ' (프테라)',
      '용의 비늘 ' + h.dragonScales + ' · 에스퍼 효과 ' + this.game.espVariant,
      '리전폼: ' + (this.game.isRegional() ? '켜짐' : '꺼짐'),
      '해금: ' + (h.unlockedShop.size ? Array.from(h.unlockedShop).join(', ') : '없음'),
      '상점 제외: ' + (h.excluded.size ? Array.from(h.excluded).join(', ') : '없음'),
      '카운터는 전투가 끝날 때 확인됩니다'
    ];
    this.$('dbg-state').innerHTML = lines.map(l => View.esc(l)).join('<br>');
  }
}

function setupMobile() {
  const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  document.body.classList.toggle('touch', touch);
  if (!touch) return;
  const block = e => e.preventDefault();
  document.addEventListener('gesturestart', block);
  document.addEventListener('touchmove', e => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  const full = () => {
    const el = document.documentElement;
    if (document.fullscreenElement || !el.requestFullscreen) return;
    el.requestFullscreen({ navigationUI: 'hide' }).then(() => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    }).catch(() => {});
  };
  document.addEventListener('pointerup', full);
  const refit = () => window.dispatchEvent(new Event('resize'));
  window.addEventListener('orientationchange', () => setTimeout(refit, 250));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', refit);
}

window.addEventListener('DOMContentLoaded', () => {
  setupMobile();
  window.lobby = new Lobby();
});
