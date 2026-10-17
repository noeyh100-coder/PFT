class Lobby {
  constructor() {
    this.$ = id => document.getElementById(id);
    this.gameEl = this.$('game');
    this.net = new Net();
    this.app = null;
    this.room = null;
    this.buffer = [];
    this.startInfo = null;
    this.name = this.loadName();
    this.root = document.createElement('div');
    this.root.id = 'lobby';
    this.gameEl.appendChild(this.root);
    this.fit();
    window.addEventListener('resize', () => this.fit());
    this.bindNet();
    if (this.name) {
      this.show('main');
      if (Net.available()) this.net.connect(this.name);
    } else this.show('login');
  }

  fit() {
    if (this.app) return;
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    this.gameEl.style.transform = 'scale(' + (s > 0 ? s : 1) + ')';
  }

  loadName() {
    try {
      return (localStorage.getItem('ptft-name') || '').slice(0, 12);
    } catch (e) {
      return '';
    }
  }

  saveName(n) {
    try {
      localStorage.setItem('ptft-name', n);
    } catch (e) {
      return;
    }
  }

  cleanName(v) {
    return String(v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12);
  }

  bindNet() {
    const n = this.net;
    n.on('status', () => {
      if (this.screen === 'main' || this.screen === 'room') this.render();
    });
    n.on('welcome', m => {
      if (m.name) this.name = m.name;
    });
    n.on('room', m => {
      this.room = m.room;
      if (!this.app) this.show('room');
    });
    n.on('left', () => {
      this.room = null;
      if (!this.app) this.show('main');
    });
    n.on('error', m => this.flash(m.msg || '오류가 발생했습니다'));
    n.on('start', m => this.onStart(m));
    n.on('ticks', list => {
      if (this.app) this.app.pushTicks(list);
      else this.buffer.push(...list);
    });
  }

  onStart(m) {
    if (this.app) {
      if (this.startInfo && this.startInfo.seed === m.seed && this.startInfo.code === m.code) return;
      return;
    }
    this.startInfo = m;
    this.net.resetTicks();
    this.root.remove();
    this.app = new App({ mode: 'mp', seed: m.seed, seats: m.seats, slot: m.slot, net: this.net });
    window.app = this.app;
    if (this.buffer.length) {
      this.app.pushTicks(this.buffer);
      this.buffer = [];
    }
  }

  startSolo() {
    this.root.remove();
    this.net.wantOpen = false;
    if (this.net.ws) this.net.ws.close();
    this.app = new App({ mode: 'solo', name: this.name || '나' });
    window.app = this.app;
  }

  flash(msg) {
    const box = this.root.querySelector('.lb-msg');
    if (box) {
      box.textContent = msg;
      box.classList.add('show');
      clearTimeout(this.flashTimer);
      this.flashTimer = setTimeout(() => box.classList.remove('show'), 3000);
    }
  }

  show(screen) {
    this.screen = screen;
    this.render();
  }

  el(tag, cls, text) {
    return View.el(tag, cls, text);
  }

  btn(label, cls, fn, icon) {
    const b = this.el('button', 'lb-btn' + (cls ? ' ' + cls : ''));
    if (icon) b.innerHTML = iconSvg(icon, 16);
    b.appendChild(this.el('span', null, label));
    b.addEventListener('click', fn);
    return b;
  }

  frame(title) {
    this.root.innerHTML = '';
    const bg = this.el('div', 'lb-bg');
    for (let i = 0; i < 14; i++) {
      const b = this.el('i');
      b.style.left = ((i * 97) % 100) + '%';
      b.style.top = ((i * 53) % 100) + '%';
      b.style.animationDelay = (i * 0.7) + 's';
      b.innerHTML = iconSvg('ball', 24);
      bg.appendChild(b);
    }
    this.root.appendChild(bg);
    const logo = this.el('div', 'lb-logo');
    logo.appendChild(this.el('div', 'lb-title', '포켓몬 오토배틀'));
    logo.appendChild(this.el('div', 'lb-sub', title || '비공식 팬게임'));
    this.root.appendChild(logo);
    const box = this.el('div', 'lb-box frame');
    this.root.appendChild(box);
    this.root.appendChild(this.el('div', 'lb-msg'));
    this.root.appendChild(this.el('div', 'lb-foot', 'Pokémon © Nintendo, Creatures, GAME FREAK · 도트: PMD Sprite Repository (CC BY-NC 4.0) · 비영리 팬게임'));
    return box;
  }

  render() {
    if (this.app) return;
    if (this.screen === 'login') this.renderLogin();
    else if (this.screen === 'room') this.renderRoom();
    else this.renderMain();
  }

  renderLogin() {
    const box = this.frame('게스트로 시작하기');
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
      this.saveName(n);
      this.show('main');
      if (Net.available()) this.net.connect(n);
    };
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') go();
    });
    box.appendChild(this.btn('게스트로 시작', 'gold', go, 'check'));
    box.appendChild(this.el('div', 'lb-note', '닉네임은 이 브라우저에만 저장됩니다. 나중에 정식 로그인이 생기면 옮길 수 있게 할 예정입니다.'));
    setTimeout(() => inp.focus(), 0);
  }

  statusText() {
    if (!Net.available()) return ['off', '온라인 플레이는 서버 주소(https://…)로 접속했을 때만 됩니다'];
    const s = this.net.status;
    if (s === 'open') return ['on', '서버 연결됨'];
    if (s === 'connecting') return ['wait', '서버에 연결하는 중… (무료 서버는 처음 깨어날 때 30초쯤 걸릴 수 있어요)'];
    return ['off', '서버 연결이 끊겼습니다. 다시 연결하는 중…'];
  }

  renderMain() {
    const box = this.frame();
    const hi = this.el('div', 'lb-hello');
    hi.appendChild(this.el('span', null, '어서 오세요, '));
    hi.appendChild(this.el('b', null, this.name));
    hi.appendChild(this.el('span', null, ' 님'));
    const rename = this.el('button', 'lb-link', '닉네임 바꾸기');
    rename.addEventListener('click', () => this.show('login'));
    hi.appendChild(rename);
    box.appendChild(hi);
    box.appendChild(this.btn('혼자 하기 (봇 7명)', 'gold big', () => this.startSolo(), 'speed'));
    const online = Net.available() && this.net.status === 'open';
    const create = this.btn('방 만들기', 'big', () => this.net.send({ t: 'create' }), 'plus');
    create.disabled = !online;
    box.appendChild(create);
    const row = this.el('div', 'lb-row');
    const code = this.el('input', 'lb-input code');
    code.maxLength = 5;
    code.placeholder = '방 코드';
    code.addEventListener('input', () => {
      code.value = code.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
    const join = () => {
      const c = code.value.trim().toUpperCase();
      if (c.length !== 5) {
        this.flash('방 코드는 5글자입니다');
        return;
      }
      this.net.send({ t: 'join', code: c });
    };
    code.addEventListener('keydown', e => {
      if (e.key === 'Enter') join();
    });
    code.disabled = !online;
    row.appendChild(code);
    const jb = this.btn('참가', null, join, 'players');
    jb.disabled = !online;
    row.appendChild(jb);
    box.appendChild(row);
    const [cls, text] = this.statusText();
    box.appendChild(this.el('div', 'lb-status ' + cls, text));
  }

  renderRoom() {
    const r = this.room;
    if (!r) return this.show('main');
    const box = this.frame('대기실');
    const head = this.el('div', 'lb-code');
    head.appendChild(this.el('span', null, '방 코드'));
    head.appendChild(this.el('b', null, r.code));
    const copy = this.el('button', 'lb-link', '복사');
    copy.addEventListener('click', () => {
      const done = () => this.flash('방 코드를 복사했습니다');
      if (navigator.clipboard) navigator.clipboard.writeText(r.code).then(done, () => this.flash('복사하지 못했습니다. 직접 알려 주세요'));
    });
    head.appendChild(copy);
    box.appendChild(head);
    const list = this.el('div', 'lb-seats');
    for (let i = 0; i < 8; i++) {
      const m = r.members[i];
      const seat = this.el('div', 'lb-seat' + (m ? '' : ' empty') + (m && m.me ? ' me' : ''));
      seat.appendChild(this.el('span', 'lb-seat-n', i + 1));
      seat.appendChild(this.el('span', 'lb-seat-name', m ? m.name : '빈 자리 · 시작하면 봇'));
      if (m && m.host) seat.appendChild(this.el('span', 'lb-tag', '방장'));
      if (m && !m.online) seat.appendChild(this.el('span', 'lb-tag off', '연결 끊김'));
      list.appendChild(seat);
    }
    box.appendChild(list);
    const row = this.el('div', 'lb-row');
    row.appendChild(this.btn('나가기', null, () => this.net.send({ t: 'leave' }), 'back'));
    const me = r.members.find(m => m.me);
    if (me && me.host) row.appendChild(this.btn('게임 시작', 'gold', () => this.net.send({ t: 'start' }), 'check'));
    else row.appendChild(this.el('div', 'lb-note', '방장이 게임을 시작하기를 기다리는 중…'));
    box.appendChild(row);
    const [cls, text] = this.statusText();
    if (cls !== 'on') box.appendChild(this.el('div', 'lb-status ' + cls, text));
  }
}
