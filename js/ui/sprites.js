const SPRITE_SCALE = 1.5;
const SPRITE_GROUND = 39;
const SPRITE_FOOT = 5;
const SPRITE_STAR = { 1: 1, 2: 1.15, 3: 1.3 };
const SPRITE_DIR = { down: 0, downRight: 1, right: 2, upRight: 3, up: 4, upLeft: 5, left: 6, downLeft: 7 };
const SPRITE_SECTOR = [2, 1, 0, 7, 6, 5, 4, 3];

const Sprites = {
  live: new Set(),
  running: false,
  last: 0,

  data(form) {
    return (form && SPRITE_DATA[form.en]) || null;
  },

  url(en, file) {
    return 'img/dot/pokemon/' + en + '/' + file + '.png';
  },

  dirFrom(dx, dy) {
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;
    const k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    return SPRITE_SECTOR[(k + 8) % 8];
  },

  make(form, opts) {
    const d = this.data(form);
    if (!d) return null;
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'orb spr';
    const img = document.createElement('i');
    wrap.appendChild(img);
    const st = {
      wrap,
      img,
      en: form.en,
      d,
      scale: SPRITE_SCALE * (opts.scale || 1),
      star: SPRITE_STAR[opts.star] || 1,
      dir: opts.dir || 0,
      base: 'idle',
      key: null,
      once: false,
      rate: 1,
      paused: false,
      frame: -1,
      gone: 0
    };
    wrap._spr = st;
    this.setAnim(st, 'idle', { offset: Math.random() });
    this.render(st, performance.now());
    this.track(st);
    return wrap;
  },

  headY(st) {
    const an = st.d.a[st.d.p.idle];
    const s = st.scale;
    const foot = (an.h / 2 + SPRITE_FOOT) * s;
    const top = SPRITE_GROUND - foot + st.d.t * s;
    return SPRITE_GROUND - (SPRITE_GROUND - top) * st.star;
  },

  portrait(form, size, opts) {
    const d = this.data(form);
    if (!d) return null;
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'spr-fit';
    const img = document.createElement('i');
    wrap.appendChild(img);
    const b = d.b;
    const bw = b[2] - b[0];
    const bh = b[3] - b[1];
    const s = Math.min((size * (opts.fill || 0.8)) / bw, (size * (opts.fill || 0.8)) / bh, opts.max || 99);
    const st = { wrap, img, en: form.en, d, scale: s, star: 1, dir: 0, base: 'idle', key: null, once: false, rate: 1, paused: false, frame: -1, gone: 0, fit: { size, b, s, bottom: opts.bottom } };
    wrap._spr = st;
    this.setAnim(st, 'idle', { offset: 0, clock: true });
    this.render(st, opts.still ? 0 : performance.now());
    if (opts.animate) this.track(st);
    return wrap;
  },

  hoverPlay(st, on) {
    if (!st) return;
    st.start = performance.now();
    if (on) this.track(st);
    else {
      this.live.delete(st);
      st.frame = -1;
      this.render(st, st.start);
    }
  },

  track(st) {
    this.live.add(st);
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },

  setAnim(st, key, opts) {
    opts = opts || {};
    const file = st.d.p[key] || st.d.p.idle;
    const an = st.d.a[file];
    const now = performance.now();
    st.key = key;
    st.file = file;
    st.an = an;
    st.total = an.d.reduce((a, b) => a + b, 0);
    st.once = !!opts.once;
    st.rate = opts.rate || 1;
    st.start = opts.clock ? 0 : now - (opts.offset || 0) * (st.total / 60) * 1000;
    st.frame = -1;
    st.row = -1;
    const s = st.scale;
    const img = st.img;
    img.style.width = an.w * s + 'px';
    img.style.height = an.h * s + 'px';
    img.style.backgroundImage = 'url("' + this.url(st.en, file) + '")';
    img.style.backgroundSize = an.n * an.w * s + 'px ' + an.r * an.h * s + 'px';
    if (st.fit) {
      const f = st.fit;
      const idle = st.d.a[st.d.p.idle];
      const cx = (f.b[0] + f.b[2]) / 2 + (an.w - idle.w) / 2;
      const cy = (f.b[1] + f.b[3]) / 2 + (an.h - idle.h) / 2;
      img.style.left = f.size / 2 - cx * s + 'px';
      img.style.top = (f.bottom ? f.size * f.bottom - (f.b[3] + (an.h - idle.h) / 2) * s : f.size / 2 - cy * s) + 'px';
      return;
    }
    const foot = (an.h / 2 + SPRITE_FOOT) * s;
    img.style.left = 22 - (an.w * s) / 2 + 'px';
    img.style.top = SPRITE_GROUND - foot + 'px';
    img.style.transformOrigin = (an.w * s) / 2 + 'px ' + foot + 'px';
    img.style.transform = st.star !== 1 ? 'scale(' + st.star + ')' : '';
  },

  setScale(st, k) {
    st.scale = SPRITE_SCALE * k;
    this.setAnim(st, st.key, { once: st.once, rate: st.rate });
  },

  face(st, dir) {
    if (dir == null || st.dir === dir) return;
    st.dir = dir;
    this.render(st, performance.now());
  },

  base(st, key, rate) {
    const force = key === 'sleep' && st.key !== 'sleep';
    st.base = key;
    if (st.once && !force) return;
    if (st.key !== key || force) this.setAnim(st, key, { rate, offset: key === 'idle' ? Math.random() : 0 });
    else if (rate && st.rate !== rate) st.rate = rate;
  },

  once(st, key, maxSec) {
    if (st.base === 'sleep') return;
    const file = st.d.p[key] || st.d.p.idle;
    const natural = st.d.a[file].d.reduce((a, b) => a + b, 0) / 60;
    const rate = maxSec && natural > maxSec ? natural / maxSec : 1;
    this.setAnim(st, key, { once: true, rate });
    this.render(st, performance.now());
  },

  render(st, now) {
    const an = st.an;
    let ticks = ((now - st.start) / 1000) * 60 * st.rate;
    if (st.once && ticks >= st.total) {
      this.setAnim(st, st.base, { offset: st.base === 'idle' ? Math.random() : 0 });
      return this.render(st, now);
    }
    ticks = ((ticks % st.total) + st.total) % st.total;
    let f = 0;
    let acc = an.d[0];
    while (acc <= ticks && f < an.n - 1) {
      f++;
      acc += an.d[f];
    }
    const row = an.r > 1 ? Math.min(st.dir, an.r - 1) : 0;
    if (f === st.frame && row === st.row) return;
    st.frame = f;
    st.row = row;
    const s = st.scale;
    st.img.style.backgroundPosition = -f * an.w * s + 'px ' + -row * an.h * s + 'px';
  },

  loop(t) {
    const dt = t - this.last;
    this.last = t;
    for (const st of this.live) {
      if (!st.wrap.isConnected) {
        st.gone++;
        if (st.gone > 240) this.live.delete(st);
        continue;
      }
      st.gone = 0;
      if (st.paused) {
        st.start += dt;
        continue;
      }
      this.render(st, t);
    }
    if (!this.live.size) {
      this.running = false;
      return;
    }
    requestAnimationFrame(n => this.loop(n));
  }
};
