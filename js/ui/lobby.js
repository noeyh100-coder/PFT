const LOBBY_BORROW = ['toGame', 'showTooltip', 'hideTooltip', 'showUnitTip', 'hideUnitTip', 'showTraitTip', 'renderTraitTip', 'hideTraitTipSoon', 'toast'];
const RANK_TIER_NAMES = ['몬스터볼', '슈퍼볼', '하이퍼볼', '마스터볼'];
const RANK_BALLS = ['poke-ball', 'great-ball', 'ultra-ball', 'master-ball'];
const RANK_DELTA_TABLE = [40, 30, 20, 10, -10, -20, -30, -40];
const FIELD_ACTORS = [
  { en: 'Pikachu', area: 'meadow' }, { en: 'Bulbasaur', area: 'meadow' }, { en: 'Charmander', area: 'meadow' }, { en: 'Squirtle', area: 'pond' },
  { en: 'Eevee', area: 'meadow' }, { en: 'Jigglypuff', area: 'meadow' }, { en: 'Psyduck', area: 'pond' }, { en: 'Growlithe', area: 'meadow' },
  { en: 'Clefairy', area: 'meadow' }, { en: 'Oddish', area: 'grass' }, { en: 'Meowth', area: 'meadow' }, { en: 'Snorlax', area: 'sleep' },
  { en: 'Pidgey', area: 'sky' }, { en: 'Butterfree', area: 'sky' }
];

function rankLabel(r) {
  if (!r) return '배치 전';
  return RANK_TIER_NAMES[r.tier] + ' ' + r.div + ' · ' + r.lp + ' LP';
}

function rankBallSrc(tier) {
  return 'img/aug/' + RANK_BALLS[Math.max(0, Math.min(3, tier || 0))] + '.png';
}

class FieldScene {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'fs-root';
    this.el.appendChild(Object.assign(document.createElement('i'), { className: 'fs-field' }));
    this.el.appendChild(Object.assign(document.createElement('i'), { className: 'fs-clouds' }));
    this.layer = document.createElement('div');
    this.layer.className = 'fs-actors';
    this.el.appendChild(this.layer);
    this.actors = [];
    for (const a of FIELD_ACTORS) {
      const form = ProfileForms.get(a.en);
      if (!form) continue;
      const box = document.createElement('div');
      box.className = 'fs-actor' + (a.area === 'sky' ? ' fly' : '');
      const spr = Sprites.make(form, { scale: 2 });
      if (!spr) continue;
      box.appendChild(spr);
      this.layer.appendChild(box);
      const act = { a, box, st: spr._spr, x: 0, y: 0, tx: 0, ty: 0, wait: Math.random() * 3, speed: a.area === 'sky' ? 34 : 22 + Math.random() * 14, phase: Math.random() * 6 };
      const p = this.pick(a.area);
      act.x = p[0];
      act.y = p[1];
      act.tx = act.x;
      act.ty = act.y;
      if (a.area === 'sleep') Sprites.base(act.st, 'sleep');
      this.actors.push(act);
      this.place(act);
    }
    this.last = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  pick(area) {
    const r = (a, b) => a + Math.random() * (b - a);
    if (area === 'pond') return Math.random() < 0.5 ? [r(140, 330), r(548, 566)] : [r(380, 420), r(500, 550)];
    if (area === 'grass') return [r(440, 560), r(470, 500)];
    if (area === 'sleep') return [1060, 470];
    if (area === 'sky') return [r(60, 1220), r(150, 330)];
    for (;;) {
      const x = r(330, 1150);
      const y = r(452, 600);
      if (Math.abs(x - 700 - (600 - y) * 0.05) > 70) return [x, y];
    }
  }

  place(act) {
    const fly = act.a.area === 'sky';
    const k = fly ? 1 : 0.72 + ((act.y - 440) / 200) * 0.28;
    const bob = fly ? Math.sin(act.phase) * 6 : 0;
    act.box.style.transform = 'translate(' + (act.x - 22 * k).toFixed(1) + 'px,' + (act.y - 39 * k + bob).toFixed(1) + 'px) scale(' + k.toFixed(3) + ')';
    act.box.style.zIndex = String(Math.round(act.y));
  }

  loop(t) {
    if (!this.el.isConnected && this.last) {
      this.last = 0;
      setTimeout(() => requestAnimationFrame(this.loop), 400);
      return;
    }
    const dt = this.last ? Math.min(0.1, (t - this.last) / 1000) : 0;
    this.last = t;
    for (const act of this.actors) {
      act.phase += dt * 3;
      if (act.a.area === 'sleep') continue;
      const dx = act.tx - act.x;
      const dy = act.ty - act.y;
      const d = Math.hypot(dx, dy);
      if (d < 2) {
        if (act.wait > 0) {
          if (act.st.base !== 'idle') Sprites.base(act.st, 'idle');
          act.wait -= dt;
        } else {
          const p = this.pick(act.a.area);
          act.tx = p[0];
          act.ty = p[1];
          act.wait = act.a.area === 'sky' ? 0.3 : 1.5 + Math.random() * 4;
          Sprites.base(act.st, 'walk');
          Sprites.face(act.st, Sprites.dirFrom(act.tx - act.x, act.ty - act.y));
        }
      } else {
        const step = Math.min(d, act.speed * dt);
        act.x += (dx / d) * step;
        act.y += (dy / d) * step;
      }
      this.place(act);
    }
    requestAnimationFrame(this.loop);
  }
}

const LOBBY_SLOTS = [[800, 250], [1010, 250], [700, 400], [905, 400], [1110, 400], [800, 550], [1010, 550]];

const ProfileForms = {
  list: null,
  map: null,
  build() {
    if (this.list) return;
    this.list = [];
    this.map = {};
    for (const d of UNIT_DATA) {
      if (d.region) continue;
      for (const f of (d.forms || []).concat(d.stageForms || [])) {
        if (!f || !SPRITE_DATA[f.en] || this.map[f.en]) continue;
        this.map[f.en] = f;
        this.list.push(f);
      }
    }
  },
  get(en) {
    this.build();
    return this.map[en] || null;
  },
  random(not) {
    this.build();
    const pool = this.list.filter(f => f.en !== not);
    return pool[Math.floor(Math.random() * pool.length)].en;
  }
};

class Lobby {
  constructor() {
    this.$ = id => document.getElementById(id);
    this.gameEl = this.$('game');
    for (const k of LOBBY_BORROW) this[k] = App.prototype[k];
    this.game = null;
    this.human = null;
    this.dragging = false;
    this.tipTimer = null;
    this.tipTrait = null;
    this.scale = 1;
    this.net = new Net();
    this.app = null;
    this.room = null;
    this.buffer = [];
    this.startInfo = null;
    this.creating = false;
    this.joinOpen = false;
    this.settingsOpen = false;
    this.iconPick = false;
    this.name = this.load('ptft-name').slice(0, 12);
    Wallet.load(null, null);
    this.applyWallet();
    this.coll = null;
    this.root = document.createElement('div');
    this.root.id = 'lobby';
    this.view = document.createElement('div');
    this.view.className = 'lb-view';
    this.overlay = document.createElement('div');
    this.overlay.className = 'lb-overlay';
    this.msg = document.createElement('div');
    this.msg.className = 'lb-msg';
    this.root.appendChild(this.view);
    this.root.appendChild(this.overlay);
    this.root.appendChild(this.msg);
    this.gameEl.appendChild(this.root);
    this.gameEl.classList.add('in-lobby');
    this.fit();
    window.addEventListener('resize', () => this.fit());
    this.bindNet();
    this.bindInput();
    this.planner = new Planner(this);
    let toParty = false;
    try {
      toParty = sessionStorage.getItem('ptft-party') === '1';
      sessionStorage.removeItem('ptft-party');
    } catch (e) {
      toParty = false;
    }
    this.authToken = this.load('ptft-auth');
    this.account = null;
    this.queue = null;
    this.loginTab = 'login';
    this.busy = false;
    this.net.auth = this.authToken;
    this.scene = null;
    this.guest = this.load('ptft-guest') === '1';
    if (this.authToken && Net.available()) {
      this.show('boot');
      this.api('me').then(r => {
        if (r.account) {
          this.setAccount(r.account);
          this.show(toParty ? 'party' : 'main');
          this.net.connect(this.name);
        } else {
          this.logout(true);
          this.show('login');
        }
      });
    } else if (this.guest && this.name) {
      this.show(toParty && Net.available() ? 'party' : 'main');
      if (Net.available()) this.net.connect(this.name);
    } else this.show('login');
  }

  async api(path, body) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.authToken) headers.Authorization = 'Bearer ' + this.authToken;
      const res = await fetch('api/' + path, { method: 'POST', headers, body: JSON.stringify(body || {}) });
      const j = await res.json().catch(() => null);
      return j || { error: '서버 응답을 읽지 못했습니다' };
    } catch (e) {
      return { error: '서버에 연결하지 못했습니다' };
    }
  }

  applyWallet() {
    const own = (kind, v) => !!v && Wallet.owns(kind, v);
    this.icon = this.load('ptft-icon');
    if (!ProfileForms.get(this.icon) || !own('icon', this.icon)) this.icon = WALLET_DEFAULT.icon;
    this.store('ptft-icon', this.icon);
    this.lookPick = this.load('ptft-look-pick');
    if (!CONFIG.strategists.includes(this.lookPick) || !own('look', this.lookPick)) this.lookPick = '';
    this.mapPick = this.load('ptft-map-pick');
    if (!CONFIG.maps.includes(this.mapPick) || !own('map', this.mapPick)) this.mapPick = '';
    const last = this.load('ptft-look');
    this.look = this.lookPick || (own('look', last) ? last : this.randomLook());
    this.store('ptft-look', this.look);
    this.net.look = this.look;
    this.net.map = this.gameMap();
    this.net.icon = this.icon;
    this.net.charm = Wallet.get().shinyCharm;
  }

  gameMap() {
    if (this.mapPick) return this.mapPick;
    const pool = Wallet.get().owned.map.filter(m => CONFIG.maps.includes(m));
    return pool[Math.floor(Math.random() * pool.length)] || WALLET_DEFAULT.map;
  }

  setAccount(acc, token) {
    this.account = acc;
    if (token) {
      this.authToken = token;
      this.store('ptft-auth', token);
    }
    this.net.auth = this.authToken;
    Wallet.api = (path, body) => this.api(path, body);
    Wallet.load(acc.id, acc.wallet);
    this.applyWallet();
    this.name = acc.name;
    this.guest = false;
    this.store('ptft-guest', '');
  }

  logout(silent) {
    this.authToken = '';
    this.account = null;
    Wallet.api = null;
    Wallet.load(null, null);
    this.applyWallet();
    this.store('ptft-auth', '');
    this.net.auth = '';
    this.guest = false;
    this.store('ptft-guest', '');
    if (this.queue && this.queue.on) this.net.send({ t: 'rankCancel' });
    this.queue = null;
    if (this.room) this.net.send({ t: 'leave' });
    this.room = null;
    this.net.wantOpen = false;
    if (this.net.ws) this.net.ws.close();
    if (!silent) {
      this.closeSettings();
      this.show('login');
    }
  }

  async submitAuth(kind, vals) {
    if (this.busy) return;
    if (!Net.available()) {
      this.flash('로그인은 서버 주소(https://…)로 접속했을 때만 됩니다');
      return;
    }
    if (kind === 'register' && vals.pw !== vals.pw2) {
      this.flash('비밀번호 확인이 맞지 않습니다');
      return;
    }
    this.busy = true;
    this.render();
    const r = await this.api(kind, vals);
    this.busy = false;
    if (r.error || !r.token) {
      this.render();
      this.flash(r.error || '실패했습니다');
      return;
    }
    this.setAccount(r.account, r.token);
    this.show('main');
    this.net.connect(this.name);
    this.flash(kind === 'register' ? '가입을 환영합니다, ' + this.name + '!' : this.name + '님, 어서 오세요');
  }

  startGuest(n) {
    const name = this.cleanName(n);
    if (name.length < 2) {
      this.flash('닉네임은 2글자 이상이어야 합니다');
      return;
    }
    this.name = name;
    this.guest = true;
    this.store('ptft-name', name);
    this.store('ptft-guest', '1');
    this.show('main');
    if (Net.available()) this.net.connect(name);
  }

  viewed() {
    return null;
  }

  requestRender() {}

  load(key) {
    try {
      return localStorage.getItem(key) || '';
    } catch (e) {
      return '';
    }
  }

  store(key, v) {
    try {
      localStorage.setItem(key, v);
    } catch (e) {
      return;
    }
  }

  randomLook(not) {
    const owned = Wallet.get().owned.look.filter(l => CONFIG.strategists.includes(l));
    const pool = owned.length > 1 ? owned.filter(l => l !== not) : owned;
    return pool[Math.floor(Math.random() * pool.length)] || WALLET_DEFAULT.look;
  }

  fit() {
    if (this.app) return;
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    this.scale = s > 0 ? s : 1;
    this.gameEl.style.transform = 'scale(' + this.scale + ')';
  }

  cleanName(v) {
    return String(v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12);
  }

  online() {
    return Net.available() && this.net.status === 'open';
  }

  bindInput() {
    const g = this.gameEl;
    g.addEventListener('mouseover', e => {
      if (this.app) return;
      const t = e.target.closest('[data-tip]');
      if (t) this.showTooltip(t, t.dataset.tip);
      const u = e.target.closest('[data-unit]');
      if (u && !(this.planner && this.planner.drag)) this.showUnitTip(u);
    });
    g.addEventListener('mouseout', e => {
      if (this.app) return;
      const t = e.target.closest('[data-tip]');
      if (t && (!e.relatedTarget || !t.contains(e.relatedTarget))) this.hideTooltip();
      const u = e.target.closest('[data-unit]');
      if (u && (!e.relatedTarget || !u.contains(e.relatedTarget))) this.hideUnitTip();
    });
    const tip = this.$('trait-tip');
    tip.addEventListener('mouseenter', () => {
      if (!this.app) clearTimeout(this.tipTimer);
    });
    tip.addEventListener('mouseleave', () => {
      if (!this.app) this.hideTraitTipSoon();
    });
    window.addEventListener('keydown', e => {
      if (this.app || e.code !== 'Escape') return;
      if (this.planner && this.planner.isOpen) this.planner.escape();
      else if (this.settingsOpen) this.closeSettings();
      else if (this.joinOpen) {
        this.joinOpen = false;
        this.render();
      } else if (this.screen === 'party' && !this.coll) this.leaveParty();
    });
    this.root.addEventListener('click', e => {
      if (this.joinOpen && !e.target.closest('.lb-join')) {
        this.joinOpen = false;
        this.render();
      }
    });
  }

  bindNet() {
    const n = this.net;
    n.on('status', s => {
      if (s !== 'open') {
        this.room = null;
        this.creating = false;
      }
      this.render();
      if (this.settingsOpen) this.renderSettings();
    });
    n.on('welcome', m => {
      if (m.name) this.name = m.name;
      if (m.rankSize) this.welcomeSize = m.rankSize;
      if (this.screen === 'queue' && !m.rankQueued && this.queue) this.net.send({ t: 'rankQueue' });
      if (this.screen === 'party' && !this.room && !this.app && !m.room) this.createRoom();
    });
    n.on('room', m => {
      this.creating = false;
      this.room = m.room;
      if (this.app) return;
      if (m.room && m.room.state === 'lobby') this.buffer = [];
      if (m.room && m.room.ranked) return;
      if (this.screen !== 'party') {
        this.net.send({ t: 'leave' });
        this.room = null;
        return;
      }
      this.render();
    });
    n.on('left', () => {
      this.room = null;
      this.render();
    });
    n.on('error', m => {
      if (this.queue && !this.queue.on) this.queue = null;
      this.flash(m.msg || '오류가 발생했습니다');
      this.render();
    });
    n.on('queue', m => {
      if (this.app) return;
      if (m.on) this.queue = Object.assign(this.queue || { since: Date.now() }, { on: true, n: m.n, size: m.size });
      else this.queue = null;
      if (this.screen === 'queue' && !this.queue) this.show('main');
      else if (this.screen === 'queue') this.render();
    });
    n.on('start', m => this.onStart(m));
    n.on('ticks', list => {
      if (this.app) this.app.pushTicks(list);
      else this.buffer.push(...list);
    });
  }

  createRoom() {
    if (this.creating || this.room || !this.online()) return;
    this.creating = true;
    this.net.send({ t: 'create' });
  }

  closeLobby() {
    this.coll = null;
    this.gameEl.classList.remove('cs-open');
    if (this.planner) this.planner.destroy();
    this.planner = null;
    this.hideTooltip();
    this.hideUnitTip();
    this.$('trait-tip').classList.remove('show');
    this.root.remove();
    this.gameEl.classList.remove('in-lobby');
    delete this.gameEl.dataset.lb;
  }

  onStart(m) {
    if (this.app) {
      if (this.app.game.phase === 'over') this.app.backToParty(true);
      return;
    }
    this.startInfo = m;
    this.queue = null;
    clearInterval(this.queueTimer);
    this.net.resetTicks();
    this.lobbyCurtain(() => {
      this.closeLobby();
      this.app = new App({ mode: 'mp', seed: m.seed, seats: m.seats, slot: m.slot, net: this.net, ranked: !!m.ranked });
      window.app = this.app;
      if (this.buffer.length) {
        this.app.pushTicks(this.buffer);
        this.buffer = [];
      }
    });
  }

  lobbyCurtain(fn) {
    if (this.curtainBusy) return;
    this.curtainBusy = true;
    const c = document.createElement('div');
    c.className = 'lb-curtain';
    document.body.appendChild(c);
    requestAnimationFrame(() => c.classList.add('on'));
    setTimeout(() => {
      fn();
      this.curtainBusy = false;
      setTimeout(() => {
        c.classList.remove('on');
        setTimeout(() => c.remove(), 600);
      }, 300);
    }, 380);
  }

  startSolo() {
    if (this.room) this.net.send({ t: 'leave' });
    this.room = null;
    this.net.wantOpen = false;
    if (this.net.ws) this.net.ws.close();
    this.lobbyCurtain(() => {
      this.closeLobby();
      this.app = new App({ mode: 'solo', name: this.name || '나', look: this.look, map: this.gameMap() });
      window.app = this.app;
    });
  }

  pressStart() {
    const r = this.room;
    if (r && r.members.length > 1) {
      const me = r.members.find(m => m.me);
      if (me && me.host) this.net.send({ t: 'start' });
      return;
    }
    this.startSolo();
  }

  enterParty() {
    this.joinOpen = false;
    this.show('party');
    this.createRoom();
  }

  leaveParty() {
    if (this.room) this.net.send({ t: 'leave' });
    this.room = null;
    this.creating = false;
    this.joinOpen = false;
    this.show('mode');
  }

  joinCode(code) {
    const c = String(code || '').trim().toUpperCase();
    if (c.length !== 5) {
      this.flash('방 코드는 5글자입니다');
      return false;
    }
    if (this.room && this.room.code === c) {
      this.flash('이미 이 파티에 있습니다');
      return false;
    }
    if (!this.online()) {
      this.flash('서버에 연결된 뒤에 참여할 수 있습니다');
      return false;
    }
    this.net.send({ t: 'join', code: c });
    return true;
  }

  flash(text) {
    this.msg.textContent = text;
    this.msg.classList.add('show');
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.msg.classList.remove('show'), 3000);
  }

  show(screen) {
    this.screen = screen;
    this.render();
  }

  el(tag, cls, text) {
    return View.el(tag, cls, text);
  }

  btn(label, cls, fn, icon, size) {
    const b = this.el('button', 'lb-btn' + (cls ? ' ' + cls : ''));
    if (icon) b.innerHTML = iconSvg(icon, size || 16);
    if (label !== null && label !== undefined) b.appendChild(this.el('span', null, label));
    if (fn) b.addEventListener('click', fn);
    return b;
  }

  statusText() {
    if (!Net.available()) return ['off', '온라인 파티는 서버 주소(https://…)로 접속했을 때만 됩니다'];
    const s = this.net.status;
    if (s === 'open') return ['on', '서버 연결됨'];
    if (s === 'connecting') return ['wait', '서버에 연결하는 중… (무료 서버는 처음 깨어날 때 1분쯤 걸릴 수 있어요)'];
    return ['off', '서버 연결이 끊겼습니다. 다시 연결하는 중…'];
  }

  render() {
    if (this.app) return;
    this.gameEl.dataset.lb = this.screen;
    this.root.className = 'lb-' + this.screen + ((this.screen === 'login' && this.loginTab !== 'login') ? ' lg-compact' : '');
    const keep = this.view.querySelector('.lb-join input');
    const keepVal = keep ? keep.value : '';
    const keepFocus = keep && document.activeElement === keep;
    const authVals = {};
    let authFocus = null;
    for (const i of this.view.querySelectorAll('.lg-panel input')) {
      authVals[i.name] = i.value;
      if (document.activeElement === i) authFocus = i.name;
    }
    this.authVals = authVals;
    this.authFocus = authFocus;
    this.view.innerHTML = '';
    if (['login', 'boot', 'main', 'mode', 'queue'].includes(this.screen)) {
      if (!this.scene) this.scene = new FieldScene();
      this.view.appendChild(this.scene.el);
    } else this.view.appendChild(this.backdrop());
    if (this.screen === 'login' || this.screen === 'boot') this.renderLogin();
    else if (this.screen === 'party') this.renderParty();
    else if (this.screen === 'mode') this.renderMode();
    else if (this.screen === 'queue') this.renderQueue();
    else this.renderMain();
    const inp = this.view.querySelector('.lb-join input');
    if (inp) {
      inp.value = keepVal;
      if (keepFocus) inp.focus();
    }
  }

  backdrop() {
    const bg = this.el('div', 'lb-bg');
    for (let i = 0; i < 14; i++) {
      const b = this.el('i');
      b.style.left = ((i * 97) % 100) + '%';
      b.style.top = ((i * 53) % 100) + '%';
      b.style.animationDelay = (i * 0.7) + 's';
      b.innerHTML = iconSvg('ball', 24);
      bg.appendChild(b);
    }
    return bg;
  }

  logoEl(big) {
    const logo = this.el('div', 'lg-logo' + (big ? ' big' : ''));
    logo.appendChild(this.el('div', 'lg-logo-main', 'PokéFight'));
    const top = this.el('div', 'lg-logo-top');
    top.appendChild(this.el('i', 'lg-ball'));
    top.appendChild(this.el('span', null, 'Tactics'));
    logo.appendChild(top);
    logo.appendChild(this.el('div', 'lg-logo-sub', '포켓몬 오토배틀'));
    return logo;
  }

  renderLogin() {
    this.view.appendChild(this.el('i', 'lg-tint'));
    this.view.appendChild(this.el('div', 'lg-ver', 'pokemon-tft_39 · ' + (Net.available() ? this.statusLine() : '오프라인 (게스트만 가능)')));
    this.view.appendChild(this.logoEl(true));
    const panel = this.el('div', 'lg-panel');
    if (this.screen === 'boot') {
      panel.appendChild(this.el('div', 'lg-wait', '로그인 정보를 확인하는 중…'));
      this.view.appendChild(panel);
      return;
    }
    const tab = this.loginTab;
    const vals = this.authVals || {};
    const field = (name, ph, type, max) => {
      const i = this.el('input', 'lg-input');
      i.name = name;
      i.placeholder = ph;
      i.type = type || 'text';
      i.maxLength = max || 16;
      i.autocomplete = type === 'password' ? (tab === 'register' ? 'new-password' : 'current-password') : 'off';
      i.value = vals[name] != null ? vals[name] : name === 'gname' ? this.name || '' : '';
      i.disabled = this.busy;
      panel.appendChild(i);
      return i;
    };
    const get = () => {
      const o = {};
      for (const i of panel.querySelectorAll('input')) o[i.name] = i.value;
      return o;
    };
    let main;
    if (tab === 'register') {
      panel.appendChild(this.el('div', 'lg-h', '회원가입'));
      field('id', '아이디 (영어 소문자·숫자 4~16)', 'text', 16);
      field('name', '닉네임 (2~12글자)', 'text', 12);
      field('pw', '비밀번호 (6글자 이상)', 'password', 64);
      field('pw2', '비밀번호 확인', 'password', 64);
      main = () => this.submitAuth('register', get());
      panel.appendChild(this.lgBtn(this.busy ? '가입하는 중…' : '가입하고 시작', 'gold', main));
      panel.appendChild(this.lgBtn('로그인으로 돌아가기', 'ghost', () => this.setLoginTab('login')));
    } else if (tab === 'guest') {
      panel.appendChild(this.el('div', 'lg-h', '게스트로 시작'));
      field('gname', '닉네임 (2~12글자)', 'text', 12);
      main = () => this.startGuest(get().gname);
      panel.appendChild(this.lgBtn('게스트로 시작', 'gold', main));
      panel.appendChild(this.el('div', 'lg-note', '게스트는 일반 게임만 할 수 있고, 랭크와 전적은 저장되지 않습니다.'));
      panel.appendChild(this.lgBtn('로그인으로 돌아가기', 'ghost', () => this.setLoginTab('login')));
    } else {
      field('id', '아이디', 'text', 16);
      field('pw', '비밀번호', 'password', 64);
      main = () => this.submitAuth('login', get());
      panel.appendChild(this.lgBtn(this.busy ? '로그인하는 중…' : '로그인', 'gold', main));
      const row = this.el('div', 'lg-row');
      row.appendChild(this.lgBtn('게스트로그인', null, () => this.setLoginTab('guest')));
      row.appendChild(this.lgBtn('회원가입', null, () => this.setLoginTab('register')));
      panel.appendChild(row);
    }
    for (const i of panel.querySelectorAll('input')) {
      i.addEventListener('keydown', e => {
        if (e.key === 'Enter') main();
      });
    }
    this.view.appendChild(panel);
    this.view.appendChild(this.el('div', 'lg-brand', 'Pokémon © Nintendo, Creatures, GAME FREAK · 도트: PMD Sprite Repository (CC BY-NC 4.0) · 비영리 팬게임'));
    setTimeout(() => {
      const f = (this.authFocus && panel.querySelector('input[name="' + this.authFocus + '"]')) || panel.querySelector('input');
      if (f && !this.busy) f.focus();
    }, 0);
  }

  setLoginTab(t) {
    this.loginTab = t;
    this.authVals = {};
    this.view.querySelectorAll('.lg-panel input').forEach(i => (i.value = ''));
    this.render();
  }

  lgBtn(label, cls, fn) {
    const b = this.el('button', 'lg-btn' + (cls ? ' ' + cls : ''), label);
    b.disabled = this.busy;
    b.addEventListener('click', fn);
    return b;
  }

  statusLine() {
    const s = this.net.status;
    return s === 'open' ? '서버 연결됨' : s === 'connecting' ? '서버에 연결하는 중' : '서버 준비됨';
  }

  rankBadge(size) {
    const box = this.el('div', 'lb-prank');
    if (!this.account) {
      box.innerHTML = iconSvg('ball', 14);
      box.appendChild(this.el('span', null, '게스트'));
      return box;
    }
    const r = this.account.rank;
    const img = this.el('img', 'rank-ball');
    img.src = rankBallSrc(r.tier);
    img.style.width = img.style.height = (size || 18) + 'px';
    box.appendChild(img);
    box.appendChild(this.el('span', 'rk-t' + r.tier, rankLabel(r)));
    return box;
  }

  renderMode() {
    this.view.appendChild(this.el('i', 'md-dim'));
    const top = this.el('div', 'lb-topl');
    top.appendChild(this.btn('플레이', 'lb-back', () => this.show('main'), 'back', 20));
    this.view.appendChild(top);
    this.view.appendChild(this.topRight());
    const wrap = this.el('div', 'md-wrap');
    const card = (cls, title, sub, lines, fn, disabled, art) => {
      const c = this.el('button', 'md-card ' + cls + (disabled ? ' off' : ''));
      const a = this.el('div', 'md-art');
      a.appendChild(art);
      c.appendChild(a);
      c.appendChild(this.el('div', 'md-t', title));
      c.appendChild(this.el('div', 'md-s', sub));
      const ul = this.el('div', 'md-lines');
      for (const l of lines) ul.appendChild(this.el('div', null, l));
      c.appendChild(ul);
      if (disabled) c.dataset.tip = disabled;
      c.addEventListener('click', () => (disabled ? this.flash(disabled) : fn()));
      return c;
    };
    const normArt = this.el('div', 'md-balls');
    for (const k of ['poke-ball', 'great-ball', 'poke-ball']) normArt.appendChild(Object.assign(this.el('img'), { src: 'img/aug/' + k + '.png' }));
    wrap.appendChild(card('normal', '일반 게임', '친구와 파티 · 빈자리는 봇', ['방 코드로 친구 초대', '혼자서 봇 7명과도 가능', '랭크 점수 변화 없음'], () => this.enterParty(), null, normArt));
    const rankArt = this.el('div', 'md-balls rank');
    RANK_BALLS.forEach((k, i) => {
      const im = Object.assign(this.el('img'), { src: 'img/aug/' + k + '.png' });
      im.style.setProperty('--i', i);
      rankArt.appendChild(im);
    });
    const size = (this.welcomeSize || 8);
    const why = !Net.available() ? '랭크 게임은 서버에 접속했을 때만 됩니다' : !this.account ? '랭크 게임은 로그인한 계정만 할 수 있습니다' : null;
    const lines = this.account ? ['내 등급: ' + rankLabel(this.account.rank), '실제 플레이어 ' + size + '명이 모이면 시작', '1등 +40 · 4등 +10 · 5등 -10 · 8등 -40 LP'] : ['몬스터볼 → 슈퍼볼 → 하이퍼볼 → 마스터볼', '단계마다 4 → 1, 100 LP마다 승급', '게스트는 할 수 없습니다'];
    wrap.appendChild(card('ranked', '랭크 게임', '몬스터볼 · 슈퍼볼 · 하이퍼볼 · 마스터볼', lines, () => this.joinQueue(), why, rankArt));
    this.view.appendChild(wrap);
  }

  joinQueue() {
    if (!this.online()) {
      this.flash('서버에 연결된 뒤에 할 수 있습니다');
      return;
    }
    if (this.room) this.net.send({ t: 'leave' });
    this.room = null;
    this.queue = { on: false, n: 0, size: this.welcomeSize || 8, since: Date.now() };
    this.net.send({ t: 'rankQueue' });
    this.show('queue');
    clearInterval(this.queueTimer);
    this.queueTimer = setInterval(() => {
      if (this.screen !== 'queue' || this.app) {
        clearInterval(this.queueTimer);
        return;
      }
      const t = this.view.querySelector('.qu-time');
      if (t && this.queue) t.textContent = this.queueClock();
    }, 500);
  }

  cancelQueue() {
    this.net.send({ t: 'rankCancel' });
    this.queue = null;
    clearInterval(this.queueTimer);
    this.show('mode');
  }

  queueClock() {
    const s = Math.floor((Date.now() - ((this.queue && this.queue.since) || Date.now())) / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  renderQueue() {
    this.view.appendChild(this.el('i', 'md-dim'));
    const q = this.queue || { n: 0, size: 8 };
    const box = this.el('div', 'qu-box frame');
    const balls = this.el('div', 'qu-balls');
    for (let i = 0; i < q.size; i++) {
      const im = Object.assign(this.el('img', i < q.n ? 'on' : ''), { src: rankBallSrc(this.account ? this.account.rank.tier : 0) });
      im.style.animationDelay = i * 0.12 + 's';
      balls.appendChild(im);
    }
    box.appendChild(this.el('div', 'qu-t', '랭크 게임 찾는 중'));
    box.appendChild(balls);
    box.appendChild(this.el('div', 'qu-n', (q.on ? q.n : '…') + ' / ' + q.size + '명'));
    box.appendChild(this.el('div', 'qu-time', this.queueClock()));
    if (this.account) box.appendChild(this.rankBadge(20));
    box.appendChild(this.btn('취소', 'qu-cancel', () => this.cancelQueue(), 'close', 16));
    this.view.appendChild(box);
  }

  openLab() {
    if (!this.lab) this.lab = new Lab(this);
    this.labOpen = true;
    this.overlay.innerHTML = '';
    this.overlay.appendChild(this.lab.el);
    this.overlay.classList.add('show');
    this.gameEl.classList.add('cs-open');
    this.lab.render();
  }

  closeLab() {
    this.labOpen = false;
    this.overlay.innerHTML = '';
    this.overlay.classList.remove('show');
    this.gameEl.classList.remove('cs-open');
    this.render();
  }

  openRecord() {
    const bg = this.el('div', 'lb-modal-bg');
    bg.addEventListener('pointerdown', e => {
      if (e.target === bg) this.closeSettings();
    });
    const box = this.el('div', 'lb-modal frame rec-modal');
    const head = this.el('div', 'lb-modal-h');
    head.appendChild(this.el('span', null, '전적'));
    const x = this.el('button', 'icon-btn small');
    x.innerHTML = iconSvg('close', 16);
    x.addEventListener('click', () => this.closeSettings());
    head.appendChild(x);
    box.appendChild(head);
    const charms = this.el('div', 'rec-charms');
    for (const c of this.charmList()) {
      const r = this.el('div', 'rec-charm' + (c.on ? ' on' : ''));
      r.appendChild(Object.assign(this.el('img'), { src: c.src }));
      const t = this.el('div', 'rec-charm-t');
      t.appendChild(this.el('b', null, c.name + (c.on ? ' · 보유' : '')));
      t.appendChild(this.el('span', null, c.desc));
      t.appendChild(this.el('small', null, c.prog));
      r.appendChild(t);
      charms.appendChild(r);
    }
    box.appendChild(charms);
    if (!this.account) {
      box.appendChild(this.el('div', 'lb-set-v', '게스트는 전적이 저장되지 않습니다. 회원가입하면 랭크 게임 전적이 쌓입니다. 게스트의 VP와 부적은 이 기기에만 저장됩니다.'));
    } else {
      const a = this.account;
      const top = this.el('div', 'rec-top');
      const img = this.el('img', 'rec-ball');
      img.src = rankBallSrc(a.rank.tier);
      top.appendChild(img);
      const t = this.el('div', 'rec-tt');
      t.appendChild(this.el('b', 'rk-t' + a.rank.tier, RANK_TIER_NAMES[a.rank.tier] + ' ' + a.rank.div));
      t.appendChild(this.el('span', null, a.rank.lp + ' LP'));
      const bar = this.el('div', 'rec-bar');
      const fill = this.el('i');
      fill.style.width = Math.min(100, a.rank.lp) + '%';
      bar.appendChild(fill);
      t.appendChild(bar);
      top.appendChild(t);
      box.appendChild(top);
      const g = Math.max(1, a.games);
      const stats = this.el('div', 'rec-stats');
      for (const [l, v] of [['랭크 게임', a.games + '판'], ['1등', a.wins + '번 (' + Math.round((a.wins / g) * 100) + '%)'], ['순방 (4등 이내)', a.top4 + '번 (' + Math.round((a.top4 / g) * 100) + '%)']]) {
        const r = this.el('div', 'rec-row');
        r.appendChild(this.el('span', null, l));
        r.appendChild(this.el('b', null, a.games ? v : '-'));
        stats.appendChild(r);
      }
      box.appendChild(stats);
      const tiers = this.el('div', 'rec-tiers');
      RANK_TIER_NAMES.forEach((n, i) => {
        const c = this.el('div', 'rec-tier' + (i === a.rank.tier ? ' on' : ''));
        c.appendChild(Object.assign(this.el('img'), { src: rankBallSrc(i) }));
        c.appendChild(this.el('span', null, n));
        tiers.appendChild(c);
      });
      box.appendChild(tiers);
      box.appendChild(this.el('div', 'lb-note', '등수별 LP: ' + RANK_DELTA_TABLE.map((d, i) => i + 1 + '등 ' + (d > 0 ? '+' : '') + d).join(' · ')));
    }
    bg.appendChild(box);
    this.settingsOpen = true;
    this.recordOpen = true;
    this.overlay.innerHTML = '';
    this.overlay.appendChild(bg);
    this.overlay.classList.add('show');
  }

  profileIcon(en, size, animate) {
    const ring = this.el('div', 'lb-ava');
    ring.style.width = size + 'px';
    ring.style.height = size + 'px';
    const form = ProfileForms.get(en);
    const spr = form ? Sprites.portrait(form, Math.round(size * 0.86), { fill: 0.9, animate: !!animate }) : null;
    if (spr) ring.appendChild(spr);
    else ring.innerHTML = iconSvg('ball', Math.round(size * 0.6));
    return ring;
  }

  topRight() {
    const box = this.el('div', 'lb-topr');
    const gear = this.el('button', 'icon-btn lb-round');
    gear.innerHTML = iconSvg('gear', 22);
    gear.dataset.tip = '설정';
    gear.addEventListener('click', () => this.openSettings());
    box.appendChild(gear);
    return box;
  }

  renderMain() {
    this.view.appendChild(this.logoEl(false));
    const rec = this.btn('전적', 'lb-record', () => this.openRecord(), 'trophy', 18);
    if (this.account && this.account.dev) this.view.appendChild(this.btn('실험실', 'lb-lab', () => this.openLab(), 'chart', 18));
    this.view.appendChild(rec);
    const quick = this.el('div', 'lb-quick');
    quick.appendChild(this.quickBtn('map', '결투장', this.mapPick ? MAPS[this.mapPick].name.split(' · ')[0] : '무작위'));
    quick.appendChild(this.quickBtn('strat', '전략가', this.lookPick ? this.stratName(this.lookPick) : '무작위'));
    const cur = ProfileForms.get(this.icon);
    quick.appendChild(this.quickBtn('icon', '프로필', cur ? cur.name : ''));
    this.view.appendChild(quick);
    const prof = this.el('div', 'lb-profile');
    const ava = this.profileIcon(this.icon, 92, true);
    ava.classList.add('click');
    ava.dataset.tip = '프로필 바꾸기';
    ava.addEventListener('click', () => this.openCollection('icon'));
    prof.appendChild(ava);
    const info = this.el('div', 'lb-pinfo');
    info.appendChild(this.el('div', 'lb-pname', this.name));
    info.appendChild(this.rankBadge(18));
    const row = this.el('div', 'lb-wallet');
    row.appendChild(this.vpChip());
    for (const c of this.charmList()) {
      const im = this.el('img', 'lb-charm' + (c.on ? ' on' : ''));
      im.src = c.src;
      im.dataset.tip = c.name + (c.on ? ' (보유)' : ' (미보유)') + '\n' + c.desc + '\n' + c.prog;
      row.appendChild(im);
    }
    info.appendChild(row);
    prof.appendChild(info);
    this.view.appendChild(prof);
    this.view.appendChild(this.topRight());
    const play = this.el('button', 'lb-play');
    const ic = this.el('span', 'lb-play-ic');
    ic.innerHTML = iconSvg('ball', 34);
    play.appendChild(ic);
    play.appendChild(this.el('span', 'lb-play-t', '플레이'));
    play.addEventListener('click', () => this.show('mode'));
    this.view.appendChild(play);
    this.view.appendChild(this.el('div', 'lb-foot', 'Pokémon © Nintendo, Creatures, GAME FREAK · 도트: PMD Sprite Repository (CC BY-NC 4.0) · 비영리 팬게임'));
  }

  vpChip() {
    const c = this.el('div', 'lb-vp');
    c.appendChild(this.el('b', null, 'VP'));
    c.appendChild(this.el('span', null, Wallet.get().vp.toLocaleString()));
    c.dataset.tip = '1등 1000 · 2등 500 · 3등 400 · 4등 300 · 5~8등 100 VP\n프로필 250 · 전략가 500 · 결투장 1500 VP';
    return c;
  }

  charmList() {
    const w = Wallet.get();
    const need = Wallet.requiredUnits().length;
    return [
      { key: 'shiny', name: '빛나는부적', src: 'img/aug/shiny-charm.png', on: w.shinyCharm, desc: '포켓몬을 살 때 이로치가 나올 확률 2배 (1/2048 → 1/1024)', prog: '모든 포켓몬 한 번씩 전투에 쓰기: ' + Wallet.usedCount() + ' / ' + need },
      { key: 'coin', name: '부적금화', src: 'img/aug/amulet-coin.png', on: w.amuletCoin, desc: '게임이 끝나면 얻는 VP 2배', prog: '누적 골드 획득: ' + Math.min(w.gold, COIN_GOLD).toLocaleString() + ' / ' + COIN_GOLD.toLocaleString() }
    ];
  }

  quickBtn(tab, label, sub) {
    const b = this.el('button', 'lb-quick-btn');
    const ic = this.el('span', 'lb-quick-ic');
    ic.innerHTML = iconSvg(tab === 'map' ? 'arena' : tab === 'icon' ? 'ball' : 'trainer', 26);
    b.appendChild(ic);
    const t = this.el('span', 'lb-quick-t');
    t.appendChild(this.el('b', null, label));
    t.appendChild(this.el('small', null, sub));
    b.appendChild(t);
    b.addEventListener('click', () => this.openCollection(tab));
    return b;
  }

  stratName(look) {
    return '트레이너 No.' + String(CONFIG.strategists.indexOf(look) + 1).padStart(2, '0');
  }

  collGroups(tab) {
    const rnd = { key: '', name: '무작위 (보유한 것 중)', random: true };
    if (tab === 'icon') {
      ProfileForms.build();
      const base = ProfileForms.get(WALLET_DEFAULT.icon);
      return [
        { name: '기본', items: [{ key: base.en, name: base.name }] },
        { name: '포켓몬', items: ProfileForms.list.filter(f => f.en !== base.en).map(f => ({ key: f.en, name: f.name })) }
      ];
    }
    if (tab === 'map') {
      return [
        { name: '기본', items: [rnd] },
        { name: '포켓몬 지방', items: CONFIG.maps.map(id => ({ key: id, name: MAPS[id].name })) }
      ];
    }
    const all = CONFIG.strategists;
    const pick = list => list.filter(l => all.includes(l)).map(l => ({ key: l, name: this.stratName(l) }));
    const hats = STRAT_GROUPS.hat;
    const elders = STRAT_GROUPS.elder;
    return [
      { name: '기본', items: [rnd] },
      { name: '모자 쓴 트레이너', items: pick(hats) },
      { name: '트레이너', items: pick(all.filter(l => !hats.includes(l) && !elders.includes(l))) },
      { name: '어르신 트레이너', items: pick(elders) }
    ];
  }

  collFavs(tab) {
    try {
      const v = JSON.parse(this.load('ptft-fav-' + tab) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  collEquipped(tab) {
    return tab === 'map' ? this.mapPick : tab === 'icon' ? this.icon : this.lookPick;
  }

  collKind(tab) {
    return tab === 'strat' ? 'look' : tab;
  }

  collOwned(tab, it) {
    return it.random || Wallet.owns(this.collKind(tab), it.key);
  }

  buyColl(tab, it) {
    const r = Wallet.buy(this.collKind(tab), it.key);
    if (!r.ok) {
      this.flash(r.reason);
      return;
    }
    this.flash(it.name + '을(를) 샀습니다!');
    this.equipColl(tab, it.key);
  }

  openCollection(tab) {
    this.coll = { tab, sel: this.collEquipped(tab), sort: 'basic', query: '', search: false };
    this.renderCollection();
  }

  closeCollection() {
    this.coll = null;
    this.gameEl.classList.remove('cs-open');
    this.overlay.innerHTML = '';
    this.overlay.classList.remove('show');
    this.render();
  }

  equipColl(tab, key) {
    if (key && !Wallet.owns(this.collKind(tab), key)) return;
    if (tab === 'icon') {
      this.icon = key;
      this.store('ptft-icon', key);
    } else if (tab === 'map') {
      this.mapPick = key;
      this.store('ptft-map-pick', key);
    } else {
      this.lookPick = key;
      this.store('ptft-look-pick', key);
      this.look = key || this.randomLook(this.look);
      this.store('ptft-look', this.look);
    }
    this.net.look = this.look;
    this.net.map = this.gameMap();
    this.net.icon = this.icon;
    if (this.online()) this.net.connect(this.name);
    this.renderCollection();
  }

  collThumb(tab, it, big) {
    const box = this.el('div', 'cs-thumb' + (big ? ' big' : ''));
    if (it.random) {
      box.classList.add('rnd');
      const q = this.el('span', 'cs-rnd');
      q.innerHTML = iconSvg('dice', big ? 96 : 40);
      box.appendChild(q);
      return box;
    }
    if (tab === 'icon') {
      box.classList.add('icon');
      const form = ProfileForms.get(it.key);
      const spr = form ? Sprites.portrait(form, big ? 200 : 72, { fill: 0.9, animate: !!big }) : null;
      if (spr) box.appendChild(spr);
      return box;
    }
    if (tab === 'map') {
      const img = this.el('img');
      img.src = 'img/map/' + it.key + '.jpg';
      img.alt = '';
      img.draggable = false;
      box.appendChild(img);
      return box;
    }
    box.classList.add('trainer');
    const F = STRAT_FRAME;
    const k = big ? 9 : 3.4;
    const sp = this.el('i', 'cs-strat' + (big ? ' walk' : ''));
    sp.style.width = F.w * k + 'px';
    sp.style.height = F.h * k + 'px';
    sp.style.backgroundImage = 'url("' + Assets.playerUrl(it.key) + '")';
    sp.style.backgroundSize = F.w * 3 * k + 'px ' + F.h * 4 * k + 'px';
    sp.style.backgroundPosition = -F.w * k + 'px 0px';
    sp.style.setProperty('--fw', F.w * k + 'px');
    if (big) {
      const map = this.mapPick || 'kanto';
      box.style.backgroundImage = 'url("img/map/' + map + '.jpg")';
    }
    box.appendChild(sp);
    return box;
  }

  renderCollection() {
    const C = this.coll;
    if (!C) return;
    const tab = C.tab;
    const favs = this.collFavs(tab);
    const eq = this.collEquipped(tab);
    const root = this.el('div', 'cs-root');
    const head = this.el('div', 'cs-head');
    const back = this.el('button', 'cs-back');
    back.innerHTML = iconSvg('back', 26);
    back.appendChild(this.el('span', null, '개인 설정'));
    back.addEventListener('click', () => this.closeCollection());
    head.appendChild(back);
    const vp = this.vpChip();
    vp.classList.add('cs-vp');
    head.appendChild(vp);
    root.appendChild(head);
    const rail = this.el('div', 'cs-rail');
    for (const [k, label, icon] of [['strat', '전략가', 'trainer'], ['map', '결투장', 'arena'], ['icon', '프로필', 'ball']]) {
      const b = this.el('button', 'cs-tab' + (k === tab ? ' on' : ''));
      const ic = this.el('span', 'cs-tab-ic');
      ic.innerHTML = iconSvg(icon, 30);
      b.appendChild(ic);
      b.appendChild(this.el('span', null, label));
      b.addEventListener('click', () => {
        if (k === tab) return;
        this.coll = { tab: k, sel: this.collEquipped(k), sort: C.sort, query: '', search: false };
        this.renderCollection();
      });
      rail.appendChild(b);
    }
    root.appendChild(rail);
    const mid = this.el('div', 'cs-mid');
    const tools = this.el('div', 'cs-tools');
    const sel = this.el('select', 'cs-sort');
    for (const [v, t] of [['basic', '기본'], ['own', '보유 먼저'], ['fav', '즐겨찾기 먼저'], ['name', '이름순']]) {
      const o = this.el('option', null, t);
      o.value = v;
      if (C.sort === v) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      C.sort = sel.value;
      this.renderCollection();
    });
    tools.appendChild(sel);
    const sb = this.el('button', 'cs-search' + (C.search ? ' on' : ''));
    sb.innerHTML = iconSvg('search', 24);
    sb.addEventListener('click', () => {
      C.search = !C.search;
      if (!C.search) C.query = '';
      this.renderCollection();
    });
    tools.appendChild(sb);
    let inp = null;
    if (C.search) {
      inp = this.el('input', 'cs-query');
      inp.placeholder = '이름 검색';
      inp.value = C.query;
      inp.addEventListener('input', () => {
        C.query = inp.value;
        C.caret = inp.selectionStart;
        this.renderCollection();
      });
      tools.appendChild(inp);
    }
    mid.appendChild(tools);
    const list = this.el('div', 'cs-list');
    const q = C.query.trim();
    let selItem = null;
    for (const g of this.collGroups(tab)) {
      let items = g.items.filter(it => !q || it.name.includes(q));
      if (C.sort === 'name') items = items.slice().sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      if (C.sort === 'fav') items = items.slice().sort((a, b) => (favs.includes(b.key) ? 1 : 0) - (favs.includes(a.key) ? 1 : 0));
      if (C.sort === 'own') items = items.slice().sort((a, b) => (this.collOwned(tab, b) ? 1 : 0) - (this.collOwned(tab, a) ? 1 : 0));
      for (const it of g.items) if (it.key === C.sel) selItem = it;
      if (!items.length) continue;
      list.appendChild(this.el('div', 'cs-gname', g.name + ' ' + g.items.filter(it => this.collOwned(tab, it)).length + '/' + g.items.length));
      const grid = this.el('div', 'cs-grid');
      for (const it of items) {
        const owned = this.collOwned(tab, it);
        const t = this.el('button', 'cs-tile' + (it.key === C.sel ? ' sel' : '') + (it.key === eq ? ' eq' : '') + (owned ? '' : ' locked'));
        t.appendChild(this.collThumb(tab, it, false));
        if (!owned) {
          const lk = this.el('span', 'cs-price');
          lk.innerHTML = iconSvg('lock', 14);
          lk.appendChild(this.el('span', null, String(VP_PRICE[this.collKind(tab)])));
          t.appendChild(lk);
        }
        if (it.key === eq) {
          const c = this.el('span', 'cs-eq');
          c.innerHTML = iconSvg('check', 16);
          t.appendChild(c);
        }
        if (favs.includes(it.key)) {
          const h = this.el('span', 'cs-fav');
          h.innerHTML = iconSvg('heart', 14);
          t.appendChild(h);
        }
        t.dataset.tip = it.name + (owned ? '' : ' · ' + VP_PRICE[this.collKind(tab)] + ' VP');
        t.addEventListener('click', () => {
          C.sel = it.key;
          this.renderCollection();
        });
        t.addEventListener('dblclick', () => owned && this.equipColl(tab, it.key));
        grid.appendChild(t);
      }
      list.appendChild(grid);
    }
    mid.appendChild(list);
    root.appendChild(mid);
    const side = this.el('div', 'cs-side');
    if (selItem) {
      const card = this.el('div', 'cs-card');
      card.appendChild(this.collThumb(tab, selItem, true));
      side.appendChild(card);
      side.appendChild(this.el('div', 'cs-name', selItem.name));
      const row = this.el('div', 'cs-acts');
      const fav = this.el('button', 'cs-heart' + (favs.includes(selItem.key) ? ' on' : ''));
      fav.innerHTML = iconSvg('heart', 26);
      fav.dataset.tip = favs.includes(selItem.key) ? '즐겨찾기 해제' : '즐겨찾기';
      fav.addEventListener('click', () => {
        const f = this.collFavs(tab);
        const i = f.indexOf(selItem.key);
        if (i >= 0) f.splice(i, 1);
        else f.push(selItem.key);
        this.store('ptft-fav-' + tab, JSON.stringify(f));
        this.renderCollection();
      });
      row.appendChild(fav);
      const on = selItem.key === eq;
      if (this.collOwned(tab, selItem)) {
        const go = this.el('button', 'cs-equip' + (on ? ' on' : ''), on ? '장착 중' : '장착');
        go.disabled = on;
        go.addEventListener('click', () => this.equipColl(tab, selItem.key));
        row.appendChild(go);
      } else {
        const price = VP_PRICE[this.collKind(tab)];
        const go = this.el('button', 'cs-equip buy' + (Wallet.get().vp < price ? ' poor' : ''), '구매 · ' + price + ' VP');
        go.addEventListener('click', () => this.buyColl(tab, selItem));
        row.appendChild(go);
      }
      side.appendChild(row);
    }
    root.appendChild(side);
    const keepScroll = this.overlay.querySelector('.cs-list');
    const top = keepScroll ? keepScroll.scrollTop : 0;
    this.overlay.innerHTML = '';
    this.overlay.appendChild(root);
    this.overlay.classList.add('show');
    this.gameEl.classList.add('cs-open');
    list.scrollTop = top;
    if (inp) {
      inp.focus();
      const c = C.caret != null ? C.caret : inp.value.length;
      inp.setSelectionRange(c, c);
    }
  }

  hexSvg(w, h, cls) {
    const pts = [[w / 2, 2], [w - 2, h * 0.27], [w - 2, h * 0.73], [w / 2, h - 2], [2, h * 0.73], [2, h * 0.27]].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const inner = [[w / 2, 12], [w - 14, h * 0.3], [w - 14, h * 0.7], [w / 2, h - 12], [14, h * 0.7], [14, h * 0.3]].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const box = this.el('div', 'lb-hex ' + (cls || ''));
    box.style.width = w + 'px';
    box.style.height = h + 'px';
    box.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><polygon class="hx-o" points="' + pts + '"/><polygon class="hx-i" points="' + inner + '"/></svg>';
    return box;
  }

  stratEl(look, scale) {
    const s = this.el('div', 'lb-strat');
    const k = scale * 1.25;
    const F = STRAT_FRAME;
    s.style.width = F.w * k + 'px';
    s.style.height = F.h * k + 'px';
    s.style.marginLeft = (32 * scale - F.w * k) / 2 + 'px';
    s.style.marginTop = 32 * scale - F.h * k + 'px';
    s.style.backgroundImage = 'url("' + Assets.playerUrl(look) + '")';
    s.style.backgroundSize = F.w * 3 * k + 'px ' + F.h * 4 * k + 'px';
    s.style.backgroundPosition = -F.w * k + 'px 0px';
    return s;
  }

  plate(m, withIcon) {
    const p = this.el('div', 'lb-plate' + (m.me ? ' me' : ''));
    if (withIcon) p.appendChild(this.profileIcon(m.icon, 34, false));
    p.appendChild(this.el('span', 'lb-plate-n', m.name));
    if (m.host) {
      const c = this.el('span', 'lb-crown');
      c.innerHTML = iconSvg('crown', 18);
      c.dataset.tip = '방장';
      p.appendChild(c);
    }
    return p;
  }

  seat(m, cx, cy, w, h, scale, big) {
    const box = this.el('div', 'lb-seat2' + (big ? ' big' : '') + (m ? '' : ' empty'));
    box.style.left = cx - w / 2 + 'px';
    box.style.top = cy - h / 2 + 'px';
    box.style.width = w + 'px';
    box.style.height = h + 'px';
    box.appendChild(this.hexSvg(w, h, big ? 'gold' : m ? 'on' : ''));
    if (!m) return box;
    const sp = this.stratEl(m.look && CONFIG.strategists.includes(m.look) ? m.look : CONFIG.strategists[0], scale);
    const sw = 32 * scale;
    sp.style.left = (w - sw) / 2 + 'px';
    sp.style.top = h * 0.56 - sw + 'px';
    box.appendChild(sp);
    const pl = this.plate(m, true);
    pl.style.bottom = h * 0.44 + sw + (big ? 4 : 0) + 'px';
    box.appendChild(pl);
    return box;
  }

  renderParty() {
    const online = this.online();
    const r = this.room;
    const top = this.el('div', 'lb-topl');
    top.appendChild(this.btn('파티', 'lb-back', () => this.leaveParty(), 'back', 20));
    this.view.appendChild(top);
    this.view.appendChild(this.topRight());
    const stage = this.el('div', 'lb-stage' + (online && r ? '' : ' dim'));
    const meRow = r ? r.members.find(m => m.me) : null;
    const me = meRow || { name: this.name, look: this.look, icon: this.icon, me: true, host: false };
    me.icon = this.icon;
    me.look = this.look;
    stage.appendChild(this.seat(me, 330, 480, 320, 196, 6, true));
    const others = r ? r.members.filter(m => !m.me) : [];
    LOBBY_SLOTS.forEach(([x, y], i) => stage.appendChild(this.seat(others[i] || null, x, y, 190, 118, 3.5, false)));
    this.view.appendChild(stage);
    if (!(online && r)) {
      const [cls, text] = this.statusText();
      const note = this.el('div', 'lb-notice lb-status ' + cls, online ? '파티를 만드는 중…' : text);
      this.view.appendChild(note);
    }
    const bar = this.el('div', 'lb-codebar');
    const codeBox = this.el('div', 'lb-codebox');
    codeBox.appendChild(this.el('span', 'lb-code-l', '방 코드'));
    codeBox.appendChild(this.el('b', 'lb-code-v', online && r ? r.code : '-----'));
    const copy = this.el('button', 'icon-btn small lb-copy');
    copy.innerHTML = iconSvg('copy', 16);
    copy.dataset.tip = '코드 복사';
    copy.disabled = !(online && r);
    copy.addEventListener('click', () => {
      if (!this.room) return;
      const done = () => this.flash('방 코드를 복사했습니다');
      const fail = () => this.flash('복사하지 못했습니다. 코드를 직접 알려 주세요');
      if (navigator.clipboard) navigator.clipboard.writeText(this.room.code).then(done, fail);
      else fail();
    });
    codeBox.appendChild(copy);
    bar.appendChild(codeBox);
    const joinWrap = this.el('div', 'lb-join');
    const jb = this.btn('참여하기', 'lb-joinbtn', () => {
      this.joinOpen = !this.joinOpen;
      this.render();
      const i = this.view.querySelector('.lb-join input');
      if (i) i.focus();
    }, 'players', 18);
    jb.disabled = !online;
    joinWrap.appendChild(jb);
    if (this.joinOpen && online) {
      const pop = this.el('div', 'lb-joinpop frame');
      pop.appendChild(this.el('div', 'lb-h', '친구의 방 코드'));
      const row = this.el('div', 'lb-row');
      const inp = this.el('input', 'lb-input code');
      inp.maxLength = 5;
      inp.placeholder = 'ABCDE';
      inp.addEventListener('input', () => {
        inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      });
      const go = () => {
        if (this.joinCode(inp.value)) {
          this.joinOpen = false;
          this.render();
        }
      };
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') go();
      });
      row.appendChild(inp);
      row.appendChild(this.btn('참가', 'gold', go, 'check'));
      pop.appendChild(row);
      joinWrap.appendChild(pop);
    }
    bar.appendChild(joinWrap);
    this.view.appendChild(bar);
    const multi = online && r && r.members.length > 1;
    const playing = !!(online && r && r.state === 'playing');
    const host = !playing && (!multi || (meRow && meRow.host));
    const start = this.el('button', 'lb-play start' + (host ? '' : ' wait'));
    const ic = this.el('span', 'lb-play-ic');
    ic.innerHTML = iconSvg(host ? 'ball' : 'players', 34);
    start.appendChild(ic);
    start.appendChild(this.el('span', 'lb-play-t', playing ? '게임 진행 중' : host ? '시작' : '방장을 기다리는 중'));
    start.disabled = !host;
    start.dataset.tip = playing ? '파티원들의 게임이 끝나면 다시 시작할 수 있습니다' : host ? (multi ? '빈자리는 봇이 채웁니다' : '혼자서 봇 7명과 합니다') : '';
    start.addEventListener('click', () => this.pressStart());
    this.view.appendChild(start);
  }

  openSettings() {
    this.settingsOpen = true;
    this.recordOpen = false;
    this.iconPick = false;
    this.renderSettings();
  }

  closeSettings() {
    this.settingsOpen = false;
    this.recordOpen = false;
    this.iconPick = false;
    this.overlay.innerHTML = '';
    this.overlay.classList.remove('show');
  }

  pushProfile() {
    this.net.look = this.look;
    this.net.map = this.gameMap();
    this.net.icon = this.icon;
    this.net.name = this.name;
    if (this.online()) this.net.connect(this.name);
    this.render();
  }

  renderSettings() {
    if (!this.settingsOpen || this.recordOpen) return;
    const prevInp = this.overlay.querySelector('.lb-set-name');
    const prevVal = prevInp ? prevInp.value : null;
    const scroll = this.overlay.querySelector('.lb-icons');
    const prevScroll = scroll ? scroll.scrollTop : 0;
    this.overlay.innerHTML = '';
    this.overlay.classList.add('show');
    const bg = this.el('div', 'lb-modal-bg');
    bg.addEventListener('pointerdown', e => {
      if (e.target === bg) this.closeSettings();
    });
    const box = this.el('div', 'lb-modal frame');
    const head = this.el('div', 'lb-modal-h');
    head.appendChild(this.el('span', null, '설정'));
    const x = this.el('button', 'icon-btn small');
    x.innerHTML = iconSvg('close', 16);
    x.addEventListener('click', () => this.closeSettings());
    head.appendChild(x);
    box.appendChild(head);

    const sec1 = this.el('div', 'lb-set');
    sec1.appendChild(this.el('div', 'lb-set-l', '닉네임'));
    const row1 = this.el('div', 'lb-row');
    const inp = this.el('input', 'lb-input lb-set-name');
    inp.maxLength = 12;
    inp.value = prevVal !== null ? prevVal : this.name;
    const saveName = async () => {
      const n = this.cleanName(inp.value);
      if (n.length < 2) {
        this.flash('닉네임은 2글자 이상이어야 합니다');
        return;
      }
      if (this.account) {
        const r = await this.api('rename', { name: n });
        if (r.error) {
          this.flash(r.error);
          return;
        }
        this.account = r.account;
      }
      this.name = n;
      this.store('ptft-name', n);
      inp.value = n;
      this.pushProfile();
      this.flash('닉네임을 바꿨습니다');
    };
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveName();
    });
    row1.appendChild(inp);
    row1.appendChild(this.btn('저장', 'gold', saveName, 'check'));
    sec1.appendChild(row1);
    box.appendChild(sec1);

    const sec2 = this.el('div', 'lb-set');
    sec2.appendChild(this.el('div', 'lb-set-l', '프로필 포켓몬'));
    const row2 = this.el('div', 'lb-row');
    row2.appendChild(this.profileIcon(this.icon, 56, true));
    const cur = ProfileForms.get(this.icon);
    row2.appendChild(this.el('span', 'lb-set-v', cur ? cur.name : ''));
    row2.appendChild(this.btn('바꾸기', null, () => {
      this.closeSettings();
      this.openCollection('icon');
    }, 'pencil'));
    sec2.appendChild(row2);
    box.appendChild(sec2);

    const sec3 = this.el('div', 'lb-set');
    sec3.appendChild(this.el('div', 'lb-set-l', '전략가'));
    const row3 = this.el('div', 'lb-row');
    const pv = this.el('div', 'lb-set-strat');
    pv.appendChild(this.stratEl(this.look, 2));
    row3.appendChild(pv);
    row3.appendChild(this.el('span', 'lb-set-v', '게임과 파티에서 이 모습으로 나옵니다'));
    row3.appendChild(this.btn('다시 뽑기', null, () => {
      this.look = this.randomLook(this.look);
      this.lookPick = '';
      this.store('ptft-look', this.look);
      this.store('ptft-look-pick', '');
      this.pushProfile();
      this.renderSettings();
    }, 'dice'));
    sec3.appendChild(row3);
    box.appendChild(sec3);

    const sec5 = this.el('div', 'lb-set');
    sec5.appendChild(this.el('div', 'lb-set-l', '계정'));
    const row5 = this.el('div', 'lb-row');
    row5.appendChild(this.el('span', 'lb-set-v', this.account ? this.account.id + ' (' + rankLabel(this.account.rank) + ')' : '게스트'));
    row5.appendChild(this.btn(this.account ? '로그아웃' : '로그인 화면으로', null, () => this.logout(false), 'back'));
    sec5.appendChild(row5);
    box.appendChild(sec5);

    const sec4 = this.el('div', 'lb-set');
    sec4.appendChild(this.el('div', 'lb-set-l', '서버'));
    const [cls, text] = this.statusText();
    sec4.appendChild(this.el('div', 'lb-status ' + cls, text));
    box.appendChild(sec4);

    bg.appendChild(box);
    this.overlay.appendChild(bg);
    const grid = this.overlay.querySelector('.lb-icons');
    if (grid) grid.scrollTop = prevScroll;
  }
}
