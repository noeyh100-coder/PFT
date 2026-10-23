const NET_PROTO = 1;

class Net {
  constructor() {
    this.token = this.loadToken();
    this.name = '';
    this.look = '';
    this.icon = '';
    this.ws = null;
    this.handlers = {};
    this.wantOpen = false;
    this.retry = 0;
    this.lastTick = 0;
    this.status = 'idle';
  }

  static available() {
    return location.protocol === 'http:' || location.protocol === 'https:';
  }

  loadToken() {
    let t = null;
    try {
      t = localStorage.getItem('ptft-token');
    } catch (e) {
      t = null;
    }
    if (!t || !/^[0-9a-f]{32}$/.test(t)) {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      t = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
      try {
        localStorage.setItem('ptft-token', t);
      } catch (e) {
        t = t + '';
      }
    }
    return t;
  }

  url() {
    return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  }

  on(type, fn) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(fn);
  }

  emit(type, data) {
    for (const fn of this.handlers[type] || []) fn(data);
  }

  setStatus(s) {
    this.status = s;
    this.emit('status', s);
  }

  connect(name, look) {
    this.name = name;
    if (look !== undefined) this.look = look;
    this.wantOpen = true;
    if (this.ws && this.ws.readyState <= 1) {
      if (this.ws.readyState === 1) this.send({ t: 'hello', token: this.token, name, look: this.look, map: this.map || '', icon: this.icon, auth: this.auth || '', v: NET_PROTO });
      return;
    }
    this.openSocket();
  }

  openSocket() {
    if (!Net.available()) {
      this.setStatus('offline');
      return;
    }
    this.setStatus('connecting');
    let ws;
    try {
      ws = new WebSocket(this.url());
    } catch (e) {
      this.scheduleRetry();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.setStatus('open');
      this.send({ t: 'hello', token: this.token, name: this.name, look: this.look, map: this.map || '', icon: this.icon, auth: this.auth || '', v: NET_PROTO });
    };
    ws.onmessage = ev => {
      let m = null;
      try {
        m = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (!m || typeof m.t !== 'string') return;
      if (m.t === 'tk') this.onTick(m);
      else if (m.t === 'catchup') this.onCatchup(m);
      else this.emit(m.t, m);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.setStatus('closed');
      if (this.wantOpen) this.scheduleRetry();
    };
    ws.onerror = () => {};
  }

  scheduleRetry() {
    this.retry = Math.min(this.retry + 1, 6);
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      if (this.wantOpen) this.openSocket();
    }, 600 * this.retry);
  }

  send(o) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o));
  }

  leave() {
    this.send({ t: 'leave' });
  }

  resetTicks() {
    this.lastTick = 0;
  }

  expand(upto, acts) {
    const by = new Map();
    for (const [n, slot, a] of acts) {
      if (n <= this.lastTick || n > upto) continue;
      if (!by.has(n)) by.set(n, []);
      by.get(n).push([slot, a]);
    }
    const out = [];
    for (let n = this.lastTick + 1; n <= upto; n++) out.push(by.get(n) || []);
    if (upto > this.lastTick) this.lastTick = upto;
    return out;
  }

  onTick(m) {
    if (typeof m.n !== 'number' || m.n <= this.lastTick) return;
    const list = this.expand(m.n, Array.isArray(m.a) ? m.a : []);
    if (list.length) this.emit('ticks', list);
  }

  onCatchup(m) {
    if (typeof m.n !== 'number') return;
    const list = this.expand(m.n, Array.isArray(m.a) ? m.a : []);
    if (list.length) this.emit('ticks', list);
  }
}
