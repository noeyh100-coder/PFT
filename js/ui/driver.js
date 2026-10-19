const DRIVER_TICK = 0.05;

function orbFlatPos(o) {
  const p = View.cellCenter(o.r, o.c);
  return { x: p.x + (((o.id * 37) % 21) - 10), y: p.y + (((o.id * 53) % 15) - 7) };
}

function carouselItemFlat(item) {
  const R = CONFIG.carousel.ringRadius;
  return { x: CAROUSEL_CENTER.x + Math.cos(item.angle) * R, y: CAROUSEL_CENTER.y + Math.sin(item.angle) * R };
}

class Driver {
  constructor(game, opts) {
    this.game = game;
    this.mp = !!(opts && opts.mp);
    this.speed = 1;
    this.tickNo = 0;
    this.state = 'idle';
    this.wait = 0;
    this.timeLeft = 0;
    this.timerTotal = 1;
    this.ready = new Set();
    this.carTargets = {};
    this.listeners = {};
    this.strats = {};
    for (const p of game.players) this.strats[p.id] = { x: HOME_BOTTOM.x, y: HOME_BOTTOM.y, tx: HOME_BOTTOM.x, ty: HOME_BOTTOM.y, speed: WALK_SPEED, carry: null, at: p.id, hx: HOME_BOTTOM.x, hy: HOME_BOTTOM.y };
    game.on('round', info => this.onRound(info));
  }

  on(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  emit(type, data) {
    for (const fn of this.listeners[type] || []) fn(data);
  }

  start() {
    this.game.start();
  }

  onRound() {
    const g = this.game;
    this.ready.clear();
    if (g.phase === 'planning') {
      for (const id of this.awayIds || []) this.homeSlot(id);
      this.awayIds = [];
      this.state = 'planning';
      this.timerTotal = g.planningTime();
      this.timeLeft = this.timerTotal;
    } else if (g.phase === 'carousel') {
      this.homeAll();
      this.state = 'carousel';
      this.carTargets = {};
      const n = g.players.length;
      for (const p of g.players) {
        const sp = carouselSpawnFlat(p.id, n);
        const s = this.strats[p.id];
        s.x = s.tx = sp.x;
        s.y = s.ty = sp.y;
        s.carry = null;
        s.speed = p.isHuman && !p.afk ? WALK_SPEED : CONFIG.carousel.moveSpeed;
      }
    }
  }

  homeSlot(id) {
    const s = this.strats[id];
    if (!s) return;
    s.at = id;
    s.x = s.tx = s.hx = HOME_BOTTOM.x;
    s.y = s.ty = s.hy = HOME_BOTTOM.y;
    s.speed = WALK_SPEED;
  }

  homeAll() {
    for (const id in this.strats) {
      const s = this.strats[id];
      if (s.at === Number(id)) continue;
      s.at = Number(id);
      s.x = s.tx = s.hx;
      s.y = s.ty = s.hy;
      s.speed = WALK_SPEED;
    }
  }

  humans() {
    return this.game.players.filter(p => p.isHuman && p.alive && !p.afk);
  }

  allReady() {
    const hs = this.humans();
    return hs.length > 0 && hs.every(p => this.ready.has(p.id));
  }

  step(actions) {
    this.tickNo += 1;
    if (actions) for (const [pid, a] of actions) this.apply(pid, a);
    const g = this.game;
    const T = DRIVER_TICK;
    g.tickBoxes(T);
    if (this.state === 'planning') {
      this.timeLeft -= T;
      if (this.timeLeft <= CONFIG.augAuto && g.players.some(p => p.augOffer)) g.autoPickAugs();
      if (this.timeLeft <= 0 || this.allReady()) this.beginCombat();
    } else if (this.state === 'precombat') {
      this.wait -= T;
      if (this.wait <= 0) this.state = 'combat';
    } else if (this.state === 'combat') {
      const n = this.mp ? 1 : this.speed;
      for (let i = 0; i < n && !g.allCombatOver(); i++) g.stepCombat(T);
      if (g.allCombatOver()) {
        this.state = 'ending';
        this.wait = 0.7;
        this.emit('combatOver');
      }
    } else if (this.state === 'ending') {
      this.wait -= T;
      if (this.wait <= 0) this.finishCombat();
    } else if (this.state === 'result') {
      this.wait -= T;
      if (this.wait <= 0) this.afterResult();
    } else if (this.state === 'carousel') {
      this.stepCarousel(T * (this.mp ? 1 : this.speed));
    } else if (this.state === 'carouselEnd') {
      this.wait -= T;
      if (this.wait <= 0) this.endCarousel();
    }
    this.moveStrats(T * (this.state === 'carousel' && !this.mp ? this.speed : 1));
    this.checkOrbs();
  }

  autoBranches() {
    const g = this.game;
    for (const p of g.players) {
      if (!p.isHuman || !p.pendingBranch || !p.pendingBranch.length) continue;
      for (const unitId of p.pendingBranch.slice()) {
        const def = UNITS[unitId];
        if (def && def.branches) g.chooseBranch(p, unitId, g.rng.pick(def.branches).key);
      }
    }
  }

  beginCombat() {
    const g = this.game;
    if (g.phase !== 'planning') return;
    this.homeAll();
    this.autoBranches();
    g.startCombat();
    if (!g.matches.length) {
      g.finishCombat();
      this.state = 'result';
      this.wait = 0;
      this.emit('combatStart', { pre: 0, none: true });
      return;
    }
    this.awayIds = [];
    for (const m of g.matches) {
      if (m.kind !== 'pvp' || m.ghost || !m.b) continue;
      this.awayIds.push(m.b.id);
      this.homeSlot(m.b.id);
    }
    const pre = g.matches.some(m => m.kind === 'pvp') ? CONFIG.preCombat : 0;
    this.state = pre > 0 ? 'precombat' : 'combat';
    this.wait = pre;
    this.emit('combatStart', { pre });
  }

  finishCombat() {
    const pvp = this.game.matches.some(m => m.kind === 'pvp');
    this.game.finishCombat();
    this.state = 'result';
    this.wait = pvp ? 2.9 : 1.4;
    this.emit('combatEnd');
  }

  afterResult() {
    const g = this.game;
    if (g.phase === 'over') {
      this.state = 'over';
      this.emit('over');
      return;
    }
    this.state = 'between';
    g.nextRound();
  }

  stepCarousel(dt) {
    const g = this.game;
    const car = g.carousel;
    const cfg = CONFIG.carousel;
    car.time += dt;
    for (const item of car.items) item.angle += cfg.spin * dt;
    const pos = car.items.map(carouselItemFlat);
    for (const p of car.order) {
      if (!p.alive || !g.carouselReleased(p) || car.picked[p.id] !== undefined) continue;
      const s = this.strats[p.id];
      if (p.isHuman && !p.afk) {
        for (let i = 0; i < car.items.length; i++) {
          if (!g.carouselCanPick(p, i)) continue;
          if (Math.hypot(pos[i].x - s.x, pos[i].y - (s.y - 10)) < cfg.pickRadius) {
            g.carouselPick(p, i);
            s.carry = car.items[i].unitId;
            this.emit('carry', p.id);
            break;
          }
        }
        continue;
      }
      let target = this.carTargets[p.id];
      if (target === undefined || target === null || !g.carouselCanPick(p, target)) target = g.carouselBotChoice(p);
      this.carTargets[p.id] = target;
      if (target === null) continue;
      const tp = pos[target];
      s.tx = tp.x;
      s.ty = tp.y + 10;
      if (Math.hypot(tp.x - s.x, tp.y - (s.y - 10)) < cfg.pickRadius) {
        g.carouselPick(p, target);
        s.carry = car.items[target].unitId;
        const sp = carouselSpawnFlat(p.id, g.players.length);
        s.tx = sp.x;
        s.ty = sp.y;
        this.emit('carry', p.id);
      }
    }
    if (car.time >= car.duration) {
      g.carouselFinish();
      for (const p of car.order) {
        const s = this.strats[p.id];
        if (car.picked[p.id] !== undefined && !s.carry) {
          s.carry = car.items[car.picked[p.id]].unitId;
          this.emit('carry', p.id);
        }
      }
      this.state = 'carouselEnd';
      this.wait = car.encounter ? 0.9 : 1.7;
      this.emit('carouselDone');
    }
  }

  endCarousel() {
    for (const p of this.game.players) {
      const s = this.strats[p.id];
      s.x = s.tx = s.hx = HOME_BOTTOM.x;
      s.y = s.ty = s.hy = HOME_BOTTOM.y;
      s.at = p.id;
      s.carry = null;
      s.speed = WALK_SPEED;
    }
    this.emit('carouselEnd');
    this.afterResult();
  }

  moveStrats(dt) {
    for (const id in this.strats) {
      const s = this.strats[id];
      const dx = s.tx - s.x;
      const dy = s.ty - s.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) {
        s.x = s.tx;
        s.y = s.ty;
        continue;
      }
      const st = Math.min(d, s.speed * dt);
      s.x += (dx / d) * st;
      s.y += (dy / d) * st;
    }
  }

  checkOrbs() {
    const g = this.game;
    for (const p of g.players) {
      if (!p.isHuman || !p.alive || !p.orbs || !p.orbs.length) continue;
      const s = this.strats[p.id];
      if (s.at !== p.id) continue;
      for (const o of p.orbs.slice()) {
        const op = orbFlatPos(o);
        if (Math.hypot(op.x - s.x, op.y - s.y) < 39) {
          g.pickOrb(p, o.id);
          this.emit('orb', { pid: p.id, id: o.id });
        }
      }
    }
  }

  num(v, lo, hi) {
    const n = Number(v);
    if (!isFinite(n)) return null;
    return Math.max(lo, Math.min(hi, n));
  }

  apply(pid, a) {
    const g = this.game;
    const p = g.players[pid];
    if (!p || !a || typeof a !== 'object') return;
    if (a.t === 'afk') {
      p.afk = !!a.on;
      return;
    }
    if (!p.isHuman || !p.alive) return;
    let res = { ok: true, reason: '' };
    const ph = g.phase;
    const shopPhase = ph === 'planning' || ph === 'combat' || ph === 'result';
    const inst = iid => p.findInstance(Number(iid));
    switch (a.t) {
      case 'buy': {
        const slot = this.num(a.s, 0, CONFIG.shopSize - 1);
        if (!shopPhase || slot === null) return;
        res = g.canBuy(p, slot);
        if (res.ok) {
          res.unitId = p.shop[slot];
          g.buy(p, slot);
        }
        break;
      }
      case 'sell':
        if (!shopPhase) return;
        res = g.sell(p, inst(a.iid)) ? res : { ok: false, reason: '전투 중에는 필드의 기물을 팔 수 없습니다' };
        break;
      case 'reroll':
        if (!shopPhase) return;
        res = g.reroll(p) ? res : { ok: false, reason: '골드가 부족합니다' };
        break;
      case 'xp':
        if (!shopPhase) return;
        res = g.buyXp(p) ? res : { ok: false, reason: p.level >= p.maxLevel() ? '최대 레벨입니다' : '골드가 부족합니다' };
        break;
      case 'lock':
        p.shopLocked = !!a.v;
        break;
      case 'move': {
        const u = inst(a.iid);
        let to = null;
        if (a.z === 'board') {
          const r = this.num(a.r, 0, BOARD_ROWS - 1);
          const c = this.num(a.c, 0, BOARD_COLS - 1);
          if (r === null || c === null) return;
          to = { zone: 'board', r: Math.floor(r), c: Math.floor(c) };
        } else if (a.z === 'bench') {
          const i = this.num(a.i, 0, CONFIG.benchSize - 1);
          if (i === null) return;
          to = { zone: 'bench', i: Math.floor(i) };
        } else return;
        if (!(ph === 'planning' || ((ph === 'combat' || ph === 'result') && u && u.loc && u.loc.zone === 'bench' && to.zone === 'bench'))) return;
        res = g.moveUnit(p, u, to);
        break;
      }
      case 'branch':
        g.chooseBranch(p, String(a.u), String(a.k));
        break;
      case 'ditto':
        if (!g.linkDitto(p, inst(a.d), inst(a.x))) return;
        break;
      case 'feed':
        res = g.feed(p, inst(a.f), inst(a.e));
        break;
      case 'item': {
        if (ph === 'over') return;
        let i = Math.floor(Number(a.i));
        if (typeof a.id === 'string' && p.items[i] !== a.id) i = p.items.indexOf(a.id);
        if (i < 0) return;
        res = g.equipItem(p, i, inst(a.iid));
        break;
      }
      case 'combine': {
        if (ph === 'over') return;
        let i = Math.floor(Number(a.i));
        let j = Math.floor(Number(a.j));
        if (typeof a.id === 'string' && p.items[i] !== a.id) i = p.items.indexOf(a.id);
        if (typeof a.jd === 'string' && p.items[j] !== a.jd) j = p.items.findIndex((x, k) => x === a.jd && k !== i);
        if (i < 0 || j < 0) return;
        res = g.combineBench(p, i, j);
        break;
      }
      case 'iswap': {
        if (ph === 'over') return;
        let i = Math.floor(Number(a.i));
        let j = Math.floor(Number(a.j));
        if (typeof a.id === 'string' && p.items[i] !== a.id) i = p.items.indexOf(a.id);
        if (typeof a.jd === 'string' && p.items[j] !== a.jd) j = p.items.findIndex((x, k) => x === a.jd && k !== i);
        if (i < 0 || j < 0 || i === j) return;
        res = g.swapItemEntries(p, i, j);
        break;
      }
      case 'box': {
        if (ph === 'over') return;
        if (a.k === 'open') {
          let i = Math.floor(Number(a.i));
          if (typeof a.id === 'string' && p.items[i] !== a.id) i = p.items.indexOf(a.id);
          if (i < 0) return;
          res = g.openBox(p, i);
        } else {
          const n = this.num(a.n, 0, 5);
          if (n === null) return;
          res = g.pickBox(p, Math.floor(n));
        }
        break;
      }
      case 'aug':
        if (ph === 'over' || !p.augOffer) return;
        {
          const n = this.num(a.n, 0, 2);
          if (n === null) return;
          res = a.k === 'reroll' ? g.rerollAug(p, Math.floor(n)) : g.pickAug(p, Math.floor(n));
        }
        break;
      case 'mine':
        if (ph !== 'planning') return;
        res = a.k === 'take' ? g.takeMine(p) : g.skipMine(p);
        break;
      case 'ready':
        if (this.state !== 'planning') return;
        this.ready.add(pid);
        break;
      case 'strat': {
        let x = this.num(a.x, -40, ARENA_W + 40);
        let y = this.num(a.y, -30, ARENA_H + 30);
        if (x === null || y === null) return;
        const s = this.strats[pid];
        if (this.state === 'carousel' && !g.carouselReleased(p)) {
          const sp = carouselSpawnFlat(p.id, g.players.length);
          const dx = x - sp.x;
          const dy = y - sp.y;
          const d = Math.hypot(dx, dy);
          const R = CAROUSEL.padR - 30;
          if (d > R) {
            x = sp.x + (dx / d) * R;
            y = sp.y + (dy / d) * R;
          }
        }
        s.tx = x;
        s.ty = y;
        s.speed = (this.state === 'carousel' ? WALK_SPEED : WALK_SPEED * (a.run ? ORB_RUN : 1));
        break;
      }
      case 'visit': {
        const planVisit = this.state === 'planning' && ph === 'planning';
        const fightVisit = (ph === 'combat' || ph === 'result') && ['precombat', 'combat', 'ending', 'result'].includes(this.state);
        if (!planVisit && !fightVisit) return;
        const to = Math.floor(Number(a.to));
        const tp = g.players[to];
        if (!tp || !tp.alive) return;
        const s = this.strats[pid];
        if (s.at === to) return;
        if (s.at === pid) {
          s.hx = s.x;
          s.hy = s.y;
        }
        s.at = to;
        const spot = to === pid ? { x: s.hx, y: s.hy } : VISIT_SPOT;
        s.x = s.tx = spot.x;
        s.y = s.ty = spot.y;
        s.speed = WALK_SPEED;
        break;
      }
      case 'dbg':
        if (this.mp) return;
        if (a.k === 'refresh') g.debugFreeRefresh(p);
        else g.debugAdd(p, String(a.k), Number(a.n) || 0);
        break;
      case 'region':
        if (this.mp) return;
        g.setRegion(a.r || null);
        break;
      default:
        return;
    }
    this.emit('applied', { pid, a, res });
  }

  hash() {
    const g = this.game;
    let h = 2166136261 >>> 0;
    const mix = v => {
      const str = String(v);
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
    };
    mix(g.stage + '-' + g.round + g.phase + this.state);
    for (const p of g.players) {
      mix(p.hp + '|' + p.gold + '|' + p.level + '|' + p.xp + '|' + p.alive + '|' + p.mine + '|' + p.shop.join(',') + '|' + p.items.join(',') + '|' + (p.boxOpen ? p.boxOpen.choices.join(',') : '') + '|' + p.augs.map(x => x.id + (x.trait || '')).join(',') + '|' + (p.augOffer ? p.augOffer.choices.map(x => x.id).join(',') : ''));
      for (const u of p.allUnits()) mix(u.iid + u.unitId + u.star + (u.loc ? u.loc.zone + (u.loc.r != null ? u.loc.r + ',' + u.loc.c : u.loc.i) : '') + (u.items || []).join(','));
    }
    return h.toString(16);
  }
}
