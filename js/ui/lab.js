const LAB_TABS = [['units', '기물'], ['augs', '증강'], ['items', '아이템'], ['traits', '시너지']];
const LAB_COLS = [['name', '이름'], ['sub', '구분'], ['n', '표본'], ['pick', '채용률'], ['avg', '평균 등수'], ['win', '1등률'], ['top4', '순방률'], ['delta', '기대 대비']];

class Lab {
  constructor(lobby) {
    this.lobby = lobby;
    this.el = document.createElement('div');
    this.el.className = 'lab-root';
    this.tab = 'units';
    this.sort = { key: 'avg', dir: 1 };
    this.minN = 20;
    this.query = '';
    this.workers = [];
    this.running = false;
    this.paused = false;
    this.total = 500;
    this.threads = Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 4) - 1));
    this.reset();
    this.loadLast();
  }

  reset() {
    this.done = 0;
    this.errors = [];
    this.players = 0;
    this.rounds = 0;
    this.agg = { units: {}, augs: {}, items: {}, traits: {} };
    this.queue = [];
    this.started = 0;
    this.elapsed = 0;
  }

  loadLast() {
    try {
      const v = JSON.parse(localStorage.getItem('ptft-lab-last') || 'null');
      if (v && v.agg) {
        this.agg = v.agg;
        this.done = v.done;
        this.players = v.players;
        this.rounds = v.rounds || 0;
        this.elapsed = v.elapsed || 0;
        this.savedAt = v.at;
      }
    } catch (e) {
      this.savedAt = null;
    }
  }

  saveLast() {
    try {
      localStorage.setItem('ptft-lab-last', JSON.stringify({ agg: this.agg, done: this.done, players: this.players, rounds: this.rounds, elapsed: this.elapsed, at: Date.now() }));
    } catch (e) {
      this.savedAt = null;
    }
  }

  add(tab, key, place) {
    const m = this.agg[tab];
    const s = m[key] || (m[key] = { n: 0, sum: 0, win: 0, top4: 0 });
    s.n += 1;
    s.sum += place;
    if (place === 1) s.win += 1;
    if (place <= 4) s.top4 += 1;
  }

  absorb(game) {
    this.done += 1;
    this.rounds += game.rounds;
    for (const r of game.players) {
      this.players += 1;
      const pl = r.place;
      for (const id of new Set(r.units.map(u => u.id))) this.add('units', id, pl);
      for (const id of new Set(r.augs)) this.add('augs', id, pl);
      const items = new Set();
      for (const u of r.units) for (const i of u.items) items.add(i);
      for (const id of items) this.add('items', id, pl);
      for (const t of r.traits) this.add('traits', t, pl);
    }
  }

  start() {
    if (this.running) return;
    this.reset();
    const base = Math.floor(Math.random() * 1e9);
    for (let i = 0; i < this.total; i++) this.queue.push(base + i * 7919);
    this.running = true;
    this.paused = false;
    this.started = performance.now();
    this.workers = [];
    for (let i = 0; i < this.threads; i++) {
      const w = new Worker('js/lab/worker.js');
      w.busy = false;
      w.onmessage = e => this.onWorker(w, e.data);
      w.onerror = e => {
        this.errors.push(e.message || '작업 스레드 오류');
        w.busy = false;
        this.feed();
      };
      this.workers.push(w);
    }
    this.feed();
    this.render();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.renderProgress(), 500);
  }

  feed() {
    if (!this.running) return;
    for (const w of this.workers) {
      if (w.busy || this.paused || !this.queue.length) continue;
      w.busy = true;
      w.postMessage({ t: 'run', seeds: this.queue.splice(0, 4) });
    }
    if (!this.queue.length && this.workers.every(w => !w.busy)) this.finish();
  }

  onWorker(w, m) {
    if (m.t === 'games') for (const g of m.games) this.absorb(g);
    else if (m.t === 'err') this.errors.push('시드 ' + m.seed + ': ' + m.msg);
    else if (m.t === 'done') {
      w.busy = false;
      this.feed();
    }
  }

  togglePause() {
    if (!this.running) return;
    this.paused = !this.paused;
    if (!this.paused) {
      this.started = performance.now() - this.elapsed * 1000;
      this.feed();
    } else this.elapsed = (performance.now() - this.started) / 1000;
    this.render();
  }

  stop() {
    if (!this.running) return;
    this.queue = [];
    for (const w of this.workers) w.terminate();
    this.workers = [];
    this.finish();
  }

  finish() {
    if (!this.running) return;
    for (const w of this.workers) w.terminate();
    this.workers = [];
    this.running = false;
    this.paused = false;
    this.elapsed = (performance.now() - this.started) / 1000;
    clearInterval(this.timer);
    this.saveLast();
    this.savedAt = Date.now();
    this.render();
  }

  close() {
    if (this.running && !confirm('시뮬레이션을 멈추고 나갈까요?')) return;
    this.stop();
    this.lobby.closeLab();
  }

  label(tab, key) {
    if (tab === 'units') {
      const d = UNITS[key];
      return { name: key, sub: d ? (d.region ? '리전폼 · ' : '') + d.cost + '코스트' + (d.unlockOnly ? ' · 해금' : '') : '' };
    }
    if (tab === 'augs') {
      const a = AUGMENTS.find(x => x.id === key);
      return { name: a ? a.name : key, sub: a ? AUG_TIER_NAME[a.tier] : '' };
    }
    if (tab === 'items') {
      const d = itemDef(key);
      return { name: d ? d.name : key, sub: d && d.special ? '특수' : '완성' };
    }
    const [id, tier] = key.split(':');
    const td = TRAIT_DATA.map[id];
    const need = td && td.tiers[Number(tier) - 1];
    return { name: id + (need != null ? ' (' + need + ')' : ''), sub: td ? (td.kind === 'type' ? '타입' : '직업') + ' ' + tier + '단계' : '' };
  }

  rows() {
    const m = this.agg[this.tab];
    const q = this.query.trim();
    const out = [];
    for (const key in m) {
      const s = m[key];
      if (s.n < this.minN) continue;
      const lb = this.label(this.tab, key);
      if (q && !lb.name.includes(q) && !lb.sub.includes(q)) continue;
      const avg = s.sum / s.n;
      out.push({ key, name: lb.name, sub: lb.sub, n: s.n, pick: this.players ? s.n / this.players : 0, avg, win: s.win / s.n, top4: s.top4 / s.n, delta: 4.5 - avg });
    }
    const { key, dir } = this.sort;
    out.sort((a, b) => {
      const x = a[key];
      const y = b[key];
      if (typeof x === 'string') return x.localeCompare(y, 'ko') * dir;
      return (x - y) * dir || a.name.localeCompare(b.name, 'ko');
    });
    return out;
  }

  fmt(k, v) {
    if (k === 'pick' || k === 'win' || k === 'top4') return (v * 100).toFixed(1) + '%';
    if (k === 'avg') return v.toFixed(2);
    if (k === 'delta') return (v >= 0 ? '+' : '') + v.toFixed(2);
    return String(v);
  }

  csv() {
    const rows = this.rows();
    const head = LAB_COLS.map(c => c[1]).join(',');
    const body = rows.map(r => LAB_COLS.map(([k]) => (typeof r[k] === 'string' ? '"' + r[k].replace(/"/g, '""') + '"' : this.fmt(k, r[k]))).join(',')).join('\n');
    const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ptft-lab-' + this.tab + '-' + this.done + '판.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  progressText() {
    const t = this.running ? (this.paused ? this.elapsed : (performance.now() - this.started) / 1000) : this.elapsed;
    const rate = t > 0 ? this.done / t : 0;
    const left = this.running ? this.total - this.done : 0;
    const eta = rate > 0 && left > 0 ? Math.ceil(left / rate) : 0;
    const mm = s => Math.floor(s / 60) + '분 ' + Math.round(s % 60) + '초';
    return {
      main: this.done + (this.running ? ' / ' + this.total : '') + '판',
      sub: (rate ? rate.toFixed(2) + '판/초' : '') + (this.running ? (this.paused ? ' · 일시정지' : eta ? ' · 남은 시간 약 ' + mm(eta) : '') : t ? ' · 걸린 시간 ' + mm(t) : '') + (this.done ? ' · 평균 ' + (this.rounds / this.done).toFixed(1) + '라운드' : '') + (this.errors.length ? ' · 오류 ' + this.errors.length : ''),
      pct: this.running ? this.done / this.total : this.done ? 1 : 0
    };
  }

  renderProgress() {
    const p = this.progressText();
    const box = this.el.querySelector('.lab-prog');
    if (!box) return;
    box.querySelector('b').textContent = p.main;
    box.querySelector('small').textContent = p.sub;
    box.querySelector('.lab-bar i').style.width = (p.pct * 100).toFixed(1) + '%';
    if (this.running && performance.now() - (this.lastTable || 0) > 2500) {
      this.lastTable = performance.now();
      this.renderTable();
    }
  }

  el2(tag, cls, text) {
    return View.el(tag, cls, text);
  }

  render() {
    const E = (t, c, x) => this.el2(t, c, x);
    this.el.innerHTML = '';
    const head = E('div', 'lab-head');
    const back = E('button', 'cs-back');
    back.innerHTML = iconSvg('back', 26);
    back.appendChild(E('span', null, '실험실 · 전체 게임 시뮬레이션'));
    back.addEventListener('click', () => this.close());
    head.appendChild(back);
    this.el.appendChild(head);

    const ctl = E('div', 'lab-ctl');
    const field = (label, val, min, max, fn) => {
      const w = E('label', 'lab-field');
      w.appendChild(E('span', null, label));
      const i = E('input', 'lb-input');
      i.type = 'number';
      i.min = min;
      i.max = max;
      i.value = val;
      i.disabled = this.running;
      i.addEventListener('change', () => fn(Math.max(min, Math.min(max, Math.floor(Number(i.value) || min)))));
      w.appendChild(i);
      return w;
    };
    ctl.appendChild(field('판수', this.total, 10, 20000, v => (this.total = v)));
    ctl.appendChild(field('동시 실행', this.threads, 1, 16, v => (this.threads = v)));
    const btn = (label, cls, fn, icon, off) => {
      const b = this.lobby.btn(label, cls, fn, icon, 16);
      b.disabled = !!off;
      return b;
    };
    ctl.appendChild(btn('시작', 'gold', () => this.start(), 'check', this.running));
    ctl.appendChild(btn(this.paused ? '이어서' : '일시정지', null, () => this.togglePause(), this.paused ? 'speed' : 'lock', !this.running));
    ctl.appendChild(btn('중지', null, () => this.stop(), 'close', !this.running));
    const prog = E('div', 'lab-prog');
    prog.appendChild(E('b'));
    prog.appendChild(E('small'));
    const bar = E('div', 'lab-bar');
    bar.appendChild(E('i'));
    prog.appendChild(bar);
    ctl.appendChild(prog);
    this.el.appendChild(ctl);
    this.renderProgress();

    const bar2 = E('div', 'lab-tabs');
    for (const [k, l] of LAB_TABS) {
      const b = E('button', 'lab-tab' + (k === this.tab ? ' on' : ''), l + ' ' + Object.keys(this.agg[k]).length);
      b.addEventListener('click', () => {
        this.tab = k;
        this.render();
      });
      bar2.appendChild(b);
    }
    const f = E('div', 'lab-filt');
    f.appendChild(E('span', null, '최소 표본'));
    const mn = E('input', 'lb-input');
    mn.type = 'number';
    mn.min = 1;
    mn.value = this.minN;
    mn.addEventListener('change', () => {
      this.minN = Math.max(1, Math.floor(Number(mn.value) || 1));
      this.renderTable();
    });
    f.appendChild(mn);
    const qs = E('input', 'lb-input');
    qs.placeholder = '이름 검색';
    qs.value = this.query;
    qs.addEventListener('input', () => {
      this.query = qs.value;
      this.renderTable();
    });
    f.appendChild(qs);
    f.appendChild(this.lobby.btn('CSV 저장', null, () => this.csv(), 'down', 16));
    bar2.appendChild(f);
    this.el.appendChild(bar2);
    const tbl = E('div', 'lab-table');
    this.el.appendChild(tbl);
    this.el.appendChild(E('div', 'lab-note', '봇 8명이 끝까지 하는 게임을 화면 없이 돌립니다(이 컴퓨터에서 계산). 기물은 탈락하거나 게임이 끝날 때 필드에 있던 계열, 아이템은 그 기물들이 낀 완성 아이템, 시너지는 그때 켜진 단계 기준입니다. 기대 등수는 4.5, 기대 대비가 클수록 좋습니다. 결과는 이 브라우저에 마지막 한 번만 저장됩니다.' + (this.savedAt && !this.running ? ' (저장: ' + new Date(this.savedAt).toLocaleString() + ')' : '')));
    if (this.errors.length) this.el.appendChild(E('div', 'lab-err', this.errors.slice(0, 3).join('\n')));
    this.renderTable();
  }

  renderTable() {
    const tbl = this.el.querySelector('.lab-table');
    if (!tbl) return;
    const top = tbl.scrollTop;
    tbl.innerHTML = '';
    const rows = this.rows();
    const t = document.createElement('table');
    const tr = document.createElement('tr');
    for (const [k, l] of LAB_COLS) {
      const th = document.createElement('th');
      th.textContent = l + (this.sort.key === k ? (this.sort.dir > 0 ? ' ▲' : ' ▼') : '');
      th.addEventListener('click', () => {
        if (this.sort.key === k) this.sort.dir *= -1;
        else this.sort = { key: k, dir: k === 'avg' || k === 'name' || k === 'sub' ? 1 : -1 };
        this.renderTable();
      });
      tr.appendChild(th);
    }
    t.appendChild(tr);
    for (const r of rows) {
      const row = document.createElement('tr');
      for (const [k] of LAB_COLS) {
        const td = document.createElement('td');
        td.textContent = typeof r[k] === 'string' ? r[k] : this.fmt(k, r[k]);
        if (k === 'delta') td.className = r.delta >= 0.3 ? 'good' : r.delta <= -0.3 ? 'bad' : '';
        if (k === 'avg') td.style.setProperty('--w', Math.max(0, Math.min(100, ((8 - r.avg) / 7) * 100)) + '%');
        row.appendChild(td);
      }
      t.appendChild(row);
    }
    if (!rows.length) {
      const row = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = LAB_COLS.length;
      td.className = 'empty';
      td.textContent = this.done ? '최소 표본을 넘는 항목이 없습니다' : '시작을 누르면 결과가 여기에 쌓입니다';
      row.appendChild(td);
      t.appendChild(row);
    }
    tbl.appendChild(t);
    tbl.scrollTop = top;
  }
}
