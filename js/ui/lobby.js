const LOBBY_BORROW = ['toGame', 'showTooltip', 'hideTooltip', 'showUnitTip', 'hideUnitTip', 'showTraitTip', 'renderTraitTip', 'hideTraitTipSoon', 'toast'];
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
    this.icon = this.load('ptft-icon');
    if (!ProfileForms.get(this.icon)) {
      this.icon = ProfileForms.random();
      this.store('ptft-icon', this.icon);
    }
    this.lookPick = this.load('ptft-look-pick');
    if (!CONFIG.strategists.includes(this.lookPick)) this.lookPick = '';
    this.mapPick = this.load('ptft-map-pick');
    if (!CONFIG.maps.includes(this.mapPick)) this.mapPick = '';
    this.look = this.lookPick || this.randomLook();
    this.store('ptft-look', this.look);
    this.net.look = this.look;
    this.net.map = this.mapPick;
    this.coll = null;
    this.net.icon = this.icon;
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
    if (this.name) {
      this.show(toParty && Net.available() ? 'party' : 'main');
      if (Net.available()) this.net.connect(this.name);
    } else this.show('login');
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
    const pool = CONFIG.strategists.filter(l => l !== not);
    return pool[Math.floor(Math.random() * pool.length)];
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
      if (this.screen === 'party' && !this.room && !this.app && !m.room) this.createRoom();
    });
    n.on('room', m => {
      this.creating = false;
      this.room = m.room;
      if (this.app) return;
      if (m.room && m.room.state === 'lobby') this.buffer = [];
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
    n.on('error', m => this.flash(m.msg || '오류가 발생했습니다'));
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
    this.net.resetTicks();
    this.lobbyCurtain(() => {
      this.closeLobby();
      this.app = new App({ mode: 'mp', seed: m.seed, seats: m.seats, slot: m.slot, net: this.net });
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
      this.app = new App({ mode: 'solo', name: this.name || '나', look: this.look, map: this.mapPick });
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
    this.show('main');
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
    this.root.className = 'lb-' + this.screen;
    const keep = this.view.querySelector('.lb-join input');
    const keepVal = keep ? keep.value : '';
    const keepFocus = keep && document.activeElement === keep;
    this.view.innerHTML = '';
    this.view.appendChild(this.backdrop());
    if (this.screen === 'login') this.renderLogin();
    else if (this.screen === 'party') this.renderParty();
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

  renderLogin() {
    const wrap = this.el('div', 'lb-center');
    const logo = this.el('div', 'lb-logo');
    logo.appendChild(this.el('div', 'lb-title', '포켓몬 오토배틀'));
    logo.appendChild(this.el('div', 'lb-sub', '게스트로 시작하기'));
    wrap.appendChild(logo);
    const box = this.el('div', 'lb-box frame');
    box.appendChild(this.el('div', 'lb-h', '닉네임'));
    const inp = this.el('input', 'lb-input');
    inp.maxLength = 12;
    inp.placeholder = '2~12글자';
    inp.value = this.name || '';
    box.appendChild(inp);
    const go = () => {
      const n = this.cleanName(inp.value);
      if (n.length < 2) {
        this.flash('닉네임은 2글자 이상이어야 합니다');
        return;
      }
      this.name = n;
      this.store('ptft-name', n);
      this.show('main');
      if (Net.available()) this.net.connect(n);
    };
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') go();
    });
    box.appendChild(this.btn('게스트로 시작', 'gold', go, 'check'));
    box.appendChild(this.el('div', 'lb-note', '닉네임은 이 브라우저에만 저장됩니다. 나중에 정식 로그인이 생기면 옮길 수 있게 할 예정입니다.'));
    wrap.appendChild(box);
    this.view.appendChild(wrap);
    this.view.appendChild(this.el('div', 'lb-foot', 'Pokémon © Nintendo, Creatures, GAME FREAK · 도트: PMD Sprite Repository (CC BY-NC 4.0) · 비영리 팬게임'));
    setTimeout(() => inp.focus(), 0);
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
    const art = this.el('div', 'lb-main-art');
    art.appendChild(this.el('i', 'lb-main-bg'));
    this.view.appendChild(art);
    const rec = this.btn('전적', 'lb-record', () => this.flash('전적은 준비 중입니다'), 'trophy', 18);
    this.view.appendChild(rec);
    const quick = this.el('div', 'lb-quick');
    quick.appendChild(this.quickBtn('map', '결투장', this.mapPick ? MAPS[this.mapPick].name.split(' · ')[0] : '무작위'));
    quick.appendChild(this.quickBtn('strat', '전략가', this.lookPick ? this.stratName(this.lookPick) : '무작위'));
    this.view.appendChild(quick);
    const prof = this.el('div', 'lb-profile');
    prof.appendChild(this.profileIcon(this.icon, 92, true));
    const info = this.el('div', 'lb-pinfo');
    info.appendChild(this.el('div', 'lb-pname', this.name));
    const rank = this.el('div', 'lb-prank');
    rank.innerHTML = iconSvg('ball', 14);
    rank.appendChild(this.el('span', null, '게스트'));
    info.appendChild(rank);
    prof.appendChild(info);
    this.view.appendChild(prof);
    this.view.appendChild(this.topRight());
    const play = this.el('button', 'lb-play');
    const ic = this.el('span', 'lb-play-ic');
    ic.innerHTML = iconSvg('ball', 34);
    play.appendChild(ic);
    play.appendChild(this.el('span', 'lb-play-t', '플레이'));
    play.addEventListener('click', () => this.enterParty());
    this.view.appendChild(play);
    this.view.appendChild(this.el('div', 'lb-foot', 'Pokémon © Nintendo, Creatures, GAME FREAK · 도트: PMD Sprite Repository (CC BY-NC 4.0) · 비영리 팬게임'));
  }

  quickBtn(tab, label, sub) {
    const b = this.el('button', 'lb-quick-btn');
    const ic = this.el('span', 'lb-quick-ic');
    ic.innerHTML = iconSvg(tab === 'map' ? 'arena' : 'trainer', 26);
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
    const rnd = { key: '', name: '무작위', random: true };
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
    return tab === 'map' ? this.mapPick : this.lookPick;
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
    if (tab === 'map') {
      this.mapPick = key;
      this.store('ptft-map-pick', key);
    } else {
      this.lookPick = key;
      this.store('ptft-look-pick', key);
      this.look = key || this.randomLook(this.look);
      this.store('ptft-look', this.look);
    }
    this.net.look = this.look;
    this.net.map = this.mapPick;
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
    root.appendChild(head);
    const rail = this.el('div', 'cs-rail');
    for (const [k, label, icon] of [['strat', '전략가', 'trainer'], ['map', '결투장', 'arena']]) {
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
    for (const [v, t] of [['basic', '기본'], ['fav', '즐겨찾기 먼저'], ['name', '이름순']]) {
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
      for (const it of g.items) if (it.key === C.sel) selItem = it;
      if (!items.length) continue;
      list.appendChild(this.el('div', 'cs-gname', g.name + ' ' + g.items.length + '/' + g.items.length));
      const grid = this.el('div', 'cs-grid');
      for (const it of items) {
        const t = this.el('button', 'cs-tile' + (it.key === C.sel ? ' sel' : '') + (it.key === eq ? ' eq' : ''));
        t.appendChild(this.collThumb(tab, it, false));
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
        t.dataset.tip = it.name;
        t.addEventListener('click', () => {
          C.sel = it.key;
          this.renderCollection();
        });
        t.addEventListener('dblclick', () => this.equipColl(tab, it.key));
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
      const go = this.el('button', 'cs-equip' + (on ? ' on' : ''), on ? '장착 중' : '장착');
      go.disabled = on;
      go.addEventListener('click', () => this.equipColl(tab, selItem.key));
      row.appendChild(go);
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
    this.iconPick = false;
    this.renderSettings();
  }

  closeSettings() {
    this.settingsOpen = false;
    this.iconPick = false;
    this.overlay.innerHTML = '';
    this.overlay.classList.remove('show');
  }

  pushProfile() {
    this.net.look = this.look;
    this.net.map = this.mapPick;
    this.net.icon = this.icon;
    this.net.name = this.name;
    if (this.online()) this.net.connect(this.name);
    this.render();
  }

  renderSettings() {
    if (!this.settingsOpen) return;
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
    const saveName = () => {
      const n = this.cleanName(inp.value);
      if (n.length < 2) {
        this.flash('닉네임은 2글자 이상이어야 합니다');
        return;
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
    row2.appendChild(this.btn(this.iconPick ? '접기' : '바꾸기', null, () => {
      this.iconPick = !this.iconPick;
      this.renderSettings();
    }, this.iconPick ? 'close' : 'pencil'));
    sec2.appendChild(row2);
    if (this.iconPick) {
      ProfileForms.build();
      const grid = this.el('div', 'lb-icons');
      for (const f of ProfileForms.list) {
        const b = this.el('button', 'lb-icon' + (f.en === this.icon ? ' on' : ''));
        const spr = Sprites.portrait(f, 40, { fill: 0.9 });
        if (spr) b.appendChild(spr);
        b.dataset.tip = f.name;
        b.addEventListener('click', () => {
          this.icon = f.en;
          this.store('ptft-icon', f.en);
          this.hideTooltip();
          this.pushProfile();
          this.renderSettings();
        });
        grid.appendChild(b);
      }
      sec2.appendChild(grid);
    }
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
