// Pixel-art combat VFX: two canvases on the floor's 2x pixel grid (ground under units, top over units).
// Everything is drawn as integer rects; fades use 4x4 ordered dithering instead of alpha blending.
const PixelFX = (() => {
  const W = 640;
  const H = 360;
  const S = 2;
  const MAX_PARTS = 3200;

  // dark -> mid -> light -> highlight
  const PAL = {
    '노말': ['#6b6b75', '#b5b5be', '#e9e9f0', '#ffffff'],
    '불꽃': ['#8a1e0e', '#e5481c', '#ff9a2a', '#ffe36a'],
    '물': ['#1a3f8a', '#2f7be0', '#6cc0ff', '#d8f4ff'],
    '풀': ['#1f5a1e', '#3f9a2e', '#84d84a', '#d8ff8a'],
    '전기': ['#8a6a00', '#f0b400', '#ffe640', '#ffffd0'],
    '얼음': ['#2a6a9a', '#5cc0e8', '#aef0ff', '#ffffff'],
    '격투': ['#7a2a10', '#d0601e', '#ffaa3a', '#fff0b0'],
    '독': ['#3a1250', '#7a36b0', '#c06ae8', '#f0c0ff'],
    '땅': ['#4a3014', '#8a6230', '#c8a060', '#f0dca8'],
    '비행': ['#4a6a9a', '#8ab0e8', '#cfe4ff', '#ffffff'],
    '에스퍼': ['#7a1a4a', '#e0407a', '#ff8ab8', '#ffe0f0'],
    '벌레': ['#3e4a0a', '#8a9a1e', '#c8d840', '#f0ffa0'],
    '바위': ['#4a4028', '#8a7a50', '#c8b888', '#f0e8c8'],
    '고스트': ['#1e0e30', '#5a3088', '#9a6ad0', '#e0c8ff'],
    '드래곤': ['#1e1a6a', '#4a4ad0', '#8a7aff', '#ffb08a'],
    '악': ['#0e0a12', '#3a2a44', '#7a5a8a', '#c8a8d8'],
    '강철': ['#3a4a5a', '#7a98b0', '#c0d8e8', '#ffffff'],
    '페어리': ['#8a3a6a', '#e870b0', '#ffb0e0', '#fff0fa']
  };
  const GOLD = ['#7a4a00', '#e0a010', '#ffd84a', '#fffbe0'];
  const WHITE = ['#8890a8', '#c8d0e8', '#f0f4ff', '#ffffff'];
  const HUES = 12;
  const PRISM = [];
  for (let h = 0; h < HUES; h++) {
    const d = (h * 360) / HUES;
    PRISM.push(['hsl(' + d + ',80%,30%)', 'hsl(' + d + ',95%,55%)', 'hsl(' + d + ',100%,72%)', 'hsl(' + d + ',100%,92%)']);
  }
  const MYTH = ['#2a1a7a', '#6c62d8', '#b8a8ff', '#ffffff'];

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  let arena = null;
  let ground = null;
  let top = null;
  let gctx = null;
  let tctx = null;
  let raf = 0;
  let last = 0;
  let T = 0;
  let parts = [];
  let prims = [];
  let timers = [];
  let dim = null;
  const pats = new Map();

  const rnd = (a, b) => a + Math.random() * (b - a);
  const irnd = (a, b) => Math.floor(rnd(a, b + 1));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pal = ty => PAL[ty] || PAL['노말'];
  const speed = () => (arena && arena.app && arena.app.speed) || 1;
  const toC = p => ({ x: p.x / S, y: p.y / S });
  const ramp = (P, off) => (P === 'prism' ? PRISM[(Math.floor(T * 16) + (off || 0)) % HUES] : P);

  function makeCanvas(z) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    c.className = 'pixfx';
    c.style.zIndex = String(z);
    return c;
  }

  function init(a) {
    arena = a;
    if (ground) return;
    ground = makeCanvas(1);
    top = makeCanvas(1500);
    a.root.insertBefore(ground, a.unitLayer);
    a.root.insertBefore(top, a.fx);
    gctx = ground.getContext('2d');
    tctx = top.getContext('2d');
  }

  function clear() {
    parts = [];
    prims = [];
    timers = [];
    dim = null;
    if (gctx) gctx.clearRect(0, 0, W, H);
    if (tctx) tctx.clearRect(0, 0, W, H);
  }

  function kick() {
    if (raf || !gctx) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function later(sec, fn) {
    timers.push({ at: T + sec, fn });
    kick();
  }

  // ---------- drawing primitives ----------

  function pat(ctx, color, level) {
    const key = (ctx === gctx ? 'g' : 't') + color + level;
    let p = pats.get(key);
    if (!p) {
      const c = document.createElement('canvas');
      c.width = 4;
      c.height = 4;
      const x = c.getContext('2d');
      x.fillStyle = color;
      for (let i = 0; i < 16; i++) if (BAYER[i] < level) x.fillRect(i & 3, i >> 2, 1, 1);
      p = ctx.createPattern(c, 'repeat');
      pats.set(key, p);
    }
    return p;
  }

  function fill(ctx, color, alpha) {
    const lv = Math.round(clamp(alpha, 0, 1) * 16);
    if (lv <= 0) return false;
    ctx.fillStyle = lv >= 16 ? color : pat(ctx, color, lv);
    return true;
  }

  function disc(ctx, cx, cy, rx, ry, color, alpha) {
    if (rx < 0.5 || !fill(ctx, color, alpha)) return;
    cx = Math.round(cx);
    cy = Math.round(cy);
    const R = Math.max(1, Math.round(ry));
    for (let dy = -R; dy <= R; dy++) {
      const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy / R) * (dy / R))));
      ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }

  function ring(ctx, cx, cy, rx, ry, th, color, alpha) {
    if (rx < 1 || !fill(ctx, color, alpha)) return;
    const n = Math.max(16, Math.ceil((rx + ry) * 3.3));
    const o = th >> 1;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(cx + Math.cos(a) * rx) - o, Math.round(cy + Math.sin(a) * ry) - o, th, th);
    }
  }

  function line(ctx, x0, y0, x1, y1, th, color, alpha) {
    if (!fill(ctx, color, alpha)) return;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
    const o = th >> 1;
    for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (dx * i) / n) - o, Math.round(y0 + (dy * i) / n) - o, th, th);
  }

  function star(ctx, x, y, len, color, alpha) {
    if (!fill(ctx, color, alpha)) return;
    x = Math.round(x);
    y = Math.round(y);
    ctx.fillRect(x - len, y, len * 2 + 1, 1);
    ctx.fillRect(x, y - len, 1, len * 2 + 1);
    const d = Math.floor(len / 3);
    for (let i = 1; i <= d; i++) {
      ctx.fillRect(x - i, y - i, 1, 1);
      ctx.fillRect(x + i, y - i, 1, 1);
      ctx.fillRect(x - i, y + i, 1, 1);
      ctx.fillRect(x + i, y + i, 1, 1);
    }
  }

  // ---------- particles ----------

  // p: x,y,vx,vy,ax,ay,drag,life,size,shape,pal,layer,delay,trail,orbit,jitter,sway,hue,flick
  function part(p) {
    if (parts.length >= MAX_PARTS) return null;
    p.t = 0;
    p.life = p.life || 0.5;
    p.size = p.size || 1;
    p.shape = p.shape || 'p';
    p.vx = p.vx || 0;
    p.vy = p.vy || 0;
    p.ax = p.ax || 0;
    p.ay = p.ay || 0;
    p.drag = p.drag || 0;
    p.delay = p.delay || 0;
    p.layer = p.layer || 1;
    p.px = p.x;
    p.py = p.y;
    parts.push(p);
    kick();
    return p;
  }

  function colorOf(p, f) {
    const idx = clamp(3 - Math.floor(Math.pow(f, p.hold || 1) * 4), 0, 3);
    if (p.pal === 'prism') return PRISM[((p.hue || 0) + Math.floor(T * 14)) % HUES][idx];
    return p.pal[idx];
  }

  function updatePart(p, dt) {
    if (p.delay > 0) {
      p.delay -= dt;
      return true;
    }
    p.t += dt;
    if (p.t >= p.life) return false;
    p.px = p.x;
    p.py = p.y;
    if (p.orbit) {
      const o = p.orbit;
      o.a += o.w * dt;
      o.r += o.vr * dt;
      o.cy += (o.vy || 0) * dt;
      p.x = o.cx + Math.cos(o.a) * o.r;
      p.y = o.cy + Math.sin(o.a) * o.r * (o.sq || 0.55);
      return true;
    }
    if (p.home) {
      const k = Math.min(1, dt * p.home.k);
      p.x += (p.home.x - p.x) * k;
      p.y += (p.home.y - p.y) * k;
      return true;
    }
    p.vx += p.ax * dt;
    p.vy += p.ay * dt;
    if (p.drag) {
      const k = Math.max(0, 1 - p.drag * dt);
      p.vx *= k;
      p.vy *= k;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.jitter) {
      p.x += rnd(-p.jitter, p.jitter);
      p.y += rnd(-p.jitter, p.jitter);
    }
    if (p.sway) p.x += Math.sin(p.t * 9 + (p.hue || 0)) * p.sway * dt * 10;
    if (p.floor != null && p.y > p.floor) {
      p.y = p.floor;
      p.vy *= -0.35;
      p.vx *= 0.6;
    }
    return true;
  }

  function drawPart(p) {
    if (p.delay > 0) return;
    const f = p.t / p.life;
    if (f > 0.65 && p.flick !== false && BAYER[((Math.round(p.x) & 3) + ((Math.round(p.y) & 3) << 2))] / 16 < (f - 0.65) / 0.35) return;
    const ctx = p.layer === 0 ? gctx : tctx;
    const c = colorOf(p, f);
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const s = Math.max(1, Math.round(p.size * (p.shrink ? 1 - f * 0.7 : 1)));
    if (p.trail) {
      const tc = p.pal === 'prism' ? PRISM[((p.hue || 0) + 3) % HUES][1] : p.pal[1];
      const tl = p.trail;
      line(ctx, p.x - p.vx * tl, p.y - p.vy * tl, p.x, p.y, 1, tc, 0.7);
    }
    ctx.fillStyle = c;
    switch (p.shape) {
      case '+':
        ctx.fillRect(x - s, y, s * 2 + 1, 1);
        ctx.fillRect(x, y - s, 1, s * 2 + 1);
        break;
      case '*':
        star(ctx, x, y, s + 1, c, 1);
        break;
      case 'd':
        for (let i = 0; i < s; i++) {
          const w = s - 1 - i;
          ctx.fillRect(x - w, y - i, w * 2 + 1, 1);
          ctx.fillRect(x - w, y + i, w * 2 + 1, 1);
        }
        break;
      case 'o':
        ctx.fillRect(x - s, y - s - 1, s * 2 + 1, 1);
        ctx.fillRect(x - s, y + s + 1, s * 2 + 1, 1);
        ctx.fillRect(x - s - 1, y - s, 1, s * 2 + 1);
        ctx.fillRect(x + s + 1, y - s, 1, s * 2 + 1);
        break;
      case 'l':
        if ((Math.floor(p.t * 12) + (p.hue || 0)) & 1) ctx.fillRect(x - s, y, s * 2, Math.max(1, s >> 1));
        else ctx.fillRect(x, y - s, Math.max(1, s >> 1), s * 2);
        break;
      default:
        ctx.fillRect(x - (s >> 1), y - (s >> 1), s, s);
    }
  }

  // ---------- primitives with lifetime ----------

  function prim(life, draw, opt) {
    prims.push({ t: 0, life, draw, delay: (opt && opt.delay) || 0, layer: opt && opt.layer === 0 ? 0 : 1 });
    kick();
  }

  function shock(x, y, r0, r1, P, opt) {
    const o = opt || {};
    const sq = o.sq || 0.55;
    const th0 = o.th || 3;
    prim(o.life || 0.45, (ctx, f) => {
      const e = 1 - Math.pow(1 - f, 3);
      const r = r0 + (r1 - r0) * e;
      const th = Math.max(1, Math.round(th0 * (1 - f)));
      const c = ramp(P, o.hue);
      ring(ctx, x, y, r, r * sq, th + 1, c[1], 1 - f);
      ring(ctx, x, y, r, r * sq, th, c[f < 0.4 ? 3 : 2], 1 - f * 0.8);
    }, o);
  }

  function flash(x, y, r, color, opt) {
    const o = opt || {};
    prim(o.life || 0.16, (ctx, f) => {
      disc(ctx, x, y, r * (0.6 + f * 0.6), r * (0.6 + f * 0.6) * (o.sq || 0.8), color, (o.a || 1) * (1 - f));
      disc(ctx, x, y, r * 0.4 * (1 - f), r * 0.4 * (1 - f) * (o.sq || 0.8), '#ffffff', 1 - f);
    }, o);
  }

  function screenFlash(color, a, life) {
    prim(life, (ctx, f) => {
      ctx.globalAlpha = a * (1 - f);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    });
  }

  function dimBoard(color, level, dur) {
    const until = T + dur;
    if (dim && dim.until > T) {
      dim.until = Math.max(dim.until, until);
      dim.level = Math.max(dim.level, level);
      dim.color = color;
      return;
    }
    dim = { from: T, until, level, color };
    kick();
  }

  function pillar(x, y, w, P, opt) {
    const o = opt || {};
    const h = o.h || y;
    prim(o.life || 0.5, (ctx, f) => {
      const k = f < 0.15 ? f / 0.15 : 1 - (f - 0.15) / 0.85;
      const ww = Math.max(1, Math.round(w * (o.grow ? Math.min(1, f * 6) : 1) * (0.4 + 0.6 * k)));
      const c = ramp(P);
      const x0 = Math.round(x);
      const y0 = Math.round(y - h);
      if (fill(ctx, c[1], k * 0.85)) ctx.fillRect(x0 - ww - 2, y0, ww * 2 + 5, h);
      if (fill(ctx, c[2], k)) ctx.fillRect(x0 - ww, y0, ww * 2 + 1, h);
      if (fill(ctx, c[3], 1)) ctx.fillRect(x0 - (ww >> 1), y0, (ww >> 1) * 2 + 1, h);
      disc(ctx, x, y, ww * 2.2, ww * 1.1, c[3], k);
    }, o);
  }

  function beam(x0, y0, x1, y1, w, P, opt) {
    const o = opt || {};
    prim(o.life || 0.3, (ctx, f) => {
      const k = 1 - f;
      const c = ramp(P);
      const ww = Math.max(1, Math.round(w * k));
      line(ctx, x0, y0, x1, y1, ww + 2, c[1], k);
      line(ctx, x0, y0, x1, y1, ww, c[2], 1);
      line(ctx, x0, y0, x1, y1, Math.max(1, ww >> 1), c[3], 1);
    }, o);
  }

  function bolt(x0, y0, x1, y1, P, opt) {
    const o = opt || {};
    let pts = null;
    let seed = -1;
    const gen = () => {
      const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 9));
      pts = [];
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const j = i === 0 || i === n ? 0 : rnd(-1, 1) * (o.amp || 7);
        pts.push([x0 + (x1 - x0) * k + j, y0 + (y1 - y0) * k + j * 0.3]);
      }
    };
    prim(o.life || 0.22, (ctx, f) => {
      const s = Math.floor(f * 6);
      if (s !== seed) {
        seed = s;
        gen();
      }
      const c = ramp(P);
      for (let i = 1; i < pts.length; i++) {
        line(ctx, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 3, c[1], 1 - f);
        line(ctx, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 1, c[3], 1);
      }
    }, o);
  }

  function slash(x, y, r, a0, sweep, PP, opt) {
    const o = opt || {};
    prim(o.life || 0.24, (ctx, f) => {
      const P = ramp(PP);
      const head = Math.min(1, f * 2.2);
      const tail = Math.max(0, f * 2.2 - 1);
      const n = Math.ceil(r * Math.abs(sweep));
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        if (k > head || k < tail) continue;
        const a = a0 + sweep * k;
        const rel = (k - tail) / Math.max(0.01, head - tail);
        const th = Math.max(1, Math.round((o.th || 3) * rel));
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.6;
        if (fill(ctx, rel > 0.7 ? P[3] : rel > 0.35 ? P[2] : P[1], 1)) ctx.fillRect(Math.round(px) - (th >> 1), Math.round(py) - (th >> 1), th, th);
      }
    }, o);
  }

  function flare(x, y, len, P, opt) {
    const o = opt || {};
    prim(o.life || 0.35, (ctx, f) => {
      const k = f < 0.2 ? f / 0.2 : 1 - (f - 0.2) / 0.8;
      const L = Math.round(len * k);
      const c = ramp(P);
      if (L < 1) return;
      if (fill(ctx, c[1], k)) {
        ctx.fillRect(Math.round(x) - L, Math.round(y) - 1, L * 2 + 1, 3);
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - Math.round(L * 0.7), 3, Math.round(L * 1.4) + 1);
      }
      star(ctx, x, y, L, c[3], 1);
      disc(ctx, x, y, L * 0.25 + 1, L * 0.25 + 1, '#ffffff', 1);
    }, o);
  }

  function magicCircle(x, y, R, P, opt) {
    const o = opt || {};
    const dir = o.dir || 1;
    prim(o.life || 1, (ctx, f) => {
      const grow = Math.min(1, f / 0.18);
      const fade = f > 0.75 ? 1 - (f - 0.75) / 0.25 : 1;
      const r = R * (0.3 + 0.7 * (1 - Math.pow(1 - grow, 3)));
      const rot = T * 1.6 * dir;
      const c = ramp(P);
      const sq = 0.5;
      disc(ctx, x, y, r * 0.9, r * 0.9 * sq, c[0], 0.35 * fade);
      ring(ctx, x, y, r, r * sq, 2, c[2], fade);
      ring(ctx, x, y, r * 0.84, r * 0.84 * sq, 1, c[1], fade);
      ring(ctx, x, y, r * 0.5, r * 0.5 * sq, 1, c[3], fade * 0.8);
      const pt = k => [x + Math.cos(rot + (k * Math.PI) / 3) * r * 0.82, y + Math.sin(rot + (k * Math.PI) / 3) * r * 0.82 * sq];
      for (let t = 0; t < 2; t++) {
        for (let k = 0; k < 3; k++) {
          const a = pt(t + k * 2);
          const b = pt(t + ((k + 1) % 3) * 2);
          line(ctx, a[0], a[1], b[0], b[1], 1, c[3], fade);
        }
      }
      const runes = o.runes || 12;
      if (fill(ctx, c[3], fade)) {
        for (let k = 0; k < runes; k++) {
          const a = -rot * 1.5 + (k / runes) * Math.PI * 2;
          const rx = Math.round(x + Math.cos(a) * r * 0.92);
          const ry = Math.round(y + Math.sin(a) * r * 0.92 * sq);
          ctx.fillRect(rx - 1, ry - 1, 2 + (k % 2), 2);
        }
      }
    }, Object.assign({ layer: 0 }, o));
  }

  function starfield(dur, n) {
    const stars = [];
    for (let i = 0; i < n; i++) stars.push({ x: irnd(0, W - 1), y: irnd(0, H - 1), p: rnd(0, 6.28), s: Math.random() < 0.15 ? 2 : 1, h: irnd(0, HUES - 1) });
    prim(dur, (ctx, f) => {
      const fade = f < 0.15 ? f / 0.15 : f > 0.8 ? 1 - (f - 0.8) / 0.2 : 1;
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(T * 8 + s.p);
        if (tw * fade < 0.25) continue;
        const c = tw > 0.8 ? '#ffffff' : PRISM[s.h][2];
        if (s.s > 1 && tw > 0.7) star(ctx, s.x, s.y, 2, c, fade);
        else if (fill(ctx, c, fade)) ctx.fillRect(s.x, s.y, 1, 1);
      }
    }, { layer: 0 });
  }

  function speedLines(x, y, r0, r1, n, PP, opt) {
    const o = opt || {};
    const angs = [];
    for (let i = 0; i < n; i++) angs.push((i / n) * Math.PI * 2 + rnd(-0.2, 0.2));
    prim(o.life || 0.22, (ctx, f) => {
      const P = ramp(PP);
      const a0 = r0 + (r1 - r0) * f;
      const a1 = a0 + (r1 - r0) * 0.45 * (1 - f);
      for (const a of angs) {
        const cs = Math.cos(a);
        const sn = Math.sin(a) * 0.6;
        line(ctx, x + cs * a0, y + sn * a0, x + cs * a1, y + sn * a1, 1, f < 0.5 ? P[3] : P[2], 1 - f * 0.6);
      }
    }, o);
  }

  // ---------- emitters ----------

  function burst(x, y, n, P, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-0.3, 0.3);
      const v = (o.v || 60) * rnd(0.5, 1.2);
      part({
        x: x + Math.cos(a) * (o.r0 || 0),
        y: y + Math.sin(a) * (o.r0 || 0) * 0.6,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v * (o.flat || 0.7) + (o.up || 0),
        ay: o.grav || 0,
        drag: o.drag == null ? 2.5 : o.drag,
        life: (o.life || 0.45) * rnd(0.7, 1.2),
        size: o.size ? irnd(o.size[0], o.size[1]) : 1,
        shape: o.shape,
        pal: P,
        hue: P === 'prism' ? irnd(0, HUES - 1) : irnd(0, 3),
        trail: o.trail,
        jitter: o.jitter,
        floor: o.grav > 0 ? y + rnd(4, 10) : null,
        delay: o.delay ? rnd(0, o.delay) : 0,
        shrink: o.shrink,
        hold: o.hold,
        layer: o.layer
      });
    }
  }

  function rise(x, y, n, P, o) {
    o = o || {};
    const sp = o.spread || 10;
    for (let i = 0; i < n; i++) {
      part({
        x: x + rnd(-sp, sp),
        y: y + rnd(-3, 5),
        vx: rnd(-8, 8),
        vy: -(o.v || 40) * rnd(0.6, 1.3),
        ay: o.ay || 0,
        life: (o.life || 0.6) * rnd(0.7, 1.2),
        size: o.size ? irnd(o.size[0], o.size[1]) : 1,
        shape: o.shape,
        pal: P,
        hue: irnd(0, HUES - 1),
        sway: o.sway,
        delay: o.delay ? rnd(0, o.delay) : 0,
        shrink: o.shrink,
        hold: o.hold
      });
    }
  }

  function swirl(x, y, n, P, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      part({
        x,
        y,
        orbit: { cx: x, cy: y, a: (i / n) * Math.PI * 2, w: (o.w || 7) * (o.dir || 1), r: o.r0 || 4, vr: o.vr || 30, vy: o.vy || 0, sq: 0.55 },
        life: (o.life || 0.6) * rnd(0.8, 1.15),
        size: o.size ? irnd(o.size[0], o.size[1]) : 1,
        shape: o.shape,
        pal: P,
        hue: irnd(0, HUES - 1),
        delay: o.delay ? rnd(0, o.delay) : 0
      });
    }
  }

  function implode(x, y, n, P, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2);
      const r = (o.r || 40) * rnd(0.7, 1.2);
      part({
        x: x + Math.cos(a) * r,
        y: y + Math.sin(a) * r * 0.6,
        home: { x, y, k: o.k || 6 },
        life: (o.life || 0.4) * rnd(0.8, 1.1),
        size: o.size ? irnd(o.size[0], o.size[1]) : 1,
        shape: o.shape,
        pal: P,
        hue: irnd(0, HUES - 1),
        hold: 2,
        flick: false,
        delay: o.delay ? rnd(0, o.delay) : 0
      });
    }
  }

  function fallFrom(x, y, n, P, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const tx = x + rnd(-(o.spread || 14), o.spread || 14);
      const ty = y + rnd(-4, 4);
      const h = o.h || 90;
      const v = o.v || 380;
      part({
        x: tx - h * 0.25,
        y: ty - h,
        vx: v * 0.25,
        vy: v,
        life: h / v,
        size: o.size ? irnd(o.size[0], o.size[1]) : 2,
        shape: o.shape,
        pal: P,
        trail: o.trail == null ? 0.03 : o.trail,
        hold: 3,
        flick: false,
        delay: (o.delay || 0) + rnd(0, o.stagger || 0.2)
      });
    }
  }

  // ---------- type motifs (used by skills at cost >= 1, intensity k) ----------

  const MOTIF = {
    '노말': (x, y, P, k) => {
      burst(x, y, Math.round(10 * k), P, { shape: '*', v: 75, size: [1, 2] });
      speedLines(x, y, 4, 26 * k, Math.round(6 * k), P);
    },
    '불꽃': (x, y, P, k) => {
      rise(x, y + 4, Math.round(24 * k), P, { v: 55, size: [1, 3], spread: 9 * k, shrink: true, sway: 0.6 });
      burst(x, y, Math.round(10 * k), P, { v: 90, grav: 60, trail: 0.03, life: 0.5 });
    },
    '물': (x, y, P, k) => {
      burst(x, y, Math.round(18 * k), P, { v: 95, grav: 260, up: -70, size: [1, 2], drag: 0.5, life: 0.6 });
      rise(x, y, Math.round(6 * k), P, { shape: 'o', v: 22, life: 0.7, sway: 0.8 });
    },
    '풀': (x, y, P, k) => {
      swirl(x, y, Math.round(14 * k), P, { shape: 'l', size: [2, 3], vr: 40 * k, w: 6, life: 0.7 });
      burst(x, y, Math.round(6 * k), P, { shape: 'd', size: [1, 2], v: 50 });
    },
    '전기': (x, y, P, k) => {
      const n = Math.max(1, Math.round(2 * k));
      for (let i = 0; i < n; i++) bolt(x + rnd(-14, 14) * k, y - 110, x + rnd(-6, 6), y, P, { delay: i * 0.05, life: 0.18 });
      burst(x, y, Math.round(10 * k), P, { shape: '+', v: 110, drag: 5, jitter: 1 });
    },
    '얼음': (x, y, P, k) => {
      burst(x, y, Math.round(14 * k), P, { shape: 'd', size: [2, 3], v: 85, drag: 3, life: 0.6, hold: 2 });
      fallFrom(x, y, Math.round(8 * k), P, { size: [1, 1], h: 50, v: 90, spread: 22 * k, trail: 0, stagger: 0.3 });
    },
    '격투': (x, y, P, k) => {
      speedLines(x, y, 6, 34 * k, Math.round(12 * k), P);
      burst(x, y, Math.round(8 * k), P, { shape: '*', v: 120, drag: 6, size: [1, 2] });
    },
    '독': (x, y, P, k) => {
      rise(x, y, Math.round(14 * k), P, { shape: 'o', v: 28, size: [1, 2], life: 0.8, sway: 0.5, spread: 12 * k });
      burst(x, y, Math.round(10 * k), P, { v: 50, grav: -20, size: [1, 2] });
    },
    '땅': (x, y, P, k) => {
      burst(x, y + 6, Math.round(16 * k), P, { v: 80, grav: 280, up: -80, size: [2, 3], drag: 0.5, life: 0.6 });
      shock(x, y + 8, 4, 30 * k, P, { layer: 0, sq: 0.45, th: 2 });
    },
    '비행': (x, y, P, k) => {
      for (let i = 0; i < Math.round(9 * k); i++) part({ x: x - 26, y: y + rnd(-14, 14), vx: rnd(140, 220), vy: rnd(-10, 10), drag: 2, life: 0.35, shape: 'p', size: 1, pal: P, trail: 0.06, delay: rnd(0, 0.12) });
      swirl(x, y, Math.round(6 * k), P, { shape: 'l', size: [2, 2], vr: 35, w: 9 });
    },
    '에스퍼': (x, y, P, k) => {
      for (let i = 0; i < Math.max(1, Math.round(3 * k)); i++) shock(x, y, 2, 26 * k, P, { delay: i * 0.08, th: 2, sq: 0.7 });
      swirl(x, y, Math.round(10 * k), P, { shape: '+', vr: 25, w: 10, life: 0.7 });
    },
    '벌레': (x, y, P, k) => {
      for (let i = 0; i < Math.round(18 * k); i++) part({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-50, 50), vy: rnd(-40, 30), drag: 1.5, jitter: 1.6, life: rnd(0.4, 0.7), size: 1, pal: P });
    },
    '바위': (x, y, P, k) => {
      fallFrom(x, y, Math.max(1, Math.round(4 * k)), P, { size: [3, 5], h: 110, v: 420, spread: 12 * k, stagger: 0.18 });
      burst(x, y + 4, Math.round(12 * k), P, { v: 80, grav: 260, up: -60, size: [1, 3], delay: 0.2, drag: 0.5 });
    },
    '고스트': (x, y, P, k) => {
      rise(x, y, Math.round(14 * k), P, { size: [2, 3], v: 30, life: 0.9, sway: 1.6, spread: 12 * k });
      implode(x, y, Math.round(10 * k), P, { r: 34 * k, size: [1, 2] });
    },
    '드래곤': (x, y, P, k) => {
      swirl(x, y + 10, Math.round(14 * k), P, { size: [1, 2], vr: 12, w: 10, vy: -60, life: 0.7 });
      swirl(x, y + 10, Math.round(14 * k), P, { size: [1, 2], vr: 12, w: -10, vy: -60, life: 0.7 });
      burst(x, y, Math.round(10 * k), P, { v: 100, size: [1, 2], trail: 0.03 });
    },
    '악': (x, y, P, k) => {
      implode(x, y, Math.round(18 * k), P, { r: 40 * k, size: [1, 2], life: 0.3 });
      later(0.18, () => burst(x, y, Math.round(12 * k), P, { shape: 'd', size: [1, 2], v: 110, drag: 4 }));
    },
    '강철': (x, y, P, k) => {
      speedLines(x, y, 4, 30 * k, Math.round(8 * k), P);
      burst(x, y, Math.round(8 * k), P, { shape: '+', v: 100, drag: 5, size: [1, 2] });
      flare(x, y, 8 * k, P, { life: 0.25 });
    },
    '페어리': (x, y, P, k) => {
      burst(x, y, Math.round(12 * k), P, { shape: '*', v: 60, drag: 3, size: [1, 2], life: 0.7 });
      rise(x, y, Math.round(8 * k), P, { shape: '+', v: 30, life: 0.8, spread: 12 * k });
    }
  };

  function motif(ty, x, y, k, P) {
    (MOTIF[ty] || MOTIF['노말'])(x, y, P || pal(ty), k);
  }

  // ---------- public effects ----------

  // Basic attack. a/b are arena screen coords at the unit's feet.
  function basic(a, b, cost, ty, ranged, star) {
    if (!gctx || !b) return;
    const A = toC(a || b);
    const B = toC(b);
    A.y -= 10;
    B.y -= 10;
    const c = clamp(cost || 1, 1, 6);
    const P = c >= 6 ? 'prism' : pal(ty);
    const sk = 1 + ((star || 1) - 1) * 0.15;
    const impact = () => basicImpact(B.x, B.y, c, ty, P, sk, A);
    if (ranged && a) {
      const travel = 0.18;
      const head = [1, 2, 2, 3, 3, 4][c - 1];
      const rate = [0, 40, 70, 110, 160, 230][c - 1];
      const HP = c >= 5 ? (c >= 6 ? 'prism' : GOLD) : pal(ty);
      projectile(A, B, travel, head, HP, rate, c);
      later(travel, impact);
    } else impact();
  }

  function projectile(A, B, travel, head, P, rate, c) {
    let acc = 0;
    let lastX = A.x;
    let lastY = A.y;
    prim(travel, (ctx, f, dt) => {
      const x = A.x + (B.x - A.x) * f;
      const y = A.y + (B.y - A.y) * f;
      const col = ramp(P);
      line(ctx, lastX, lastY, x, y, Math.max(1, head - 1), col[1], 1);
      disc(ctx, x, y, head, head, col[2], 1);
      if (fill(ctx, col[3], 1)) ctx.fillRect(Math.round(x) - (head >> 1), Math.round(y) - (head >> 1), Math.max(1, head - 1), Math.max(1, head - 1));
      if (c >= 5) star(ctx, x, y, head + 2, col[3], 0.8);
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        part({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-12, 12), vy: rnd(-12, 12), life: rnd(0.15, 0.35) + c * 0.03, size: c >= 4 && Math.random() < 0.3 ? 2 : 1, shape: c >= 6 && Math.random() < 0.3 ? '+' : 'p', pal: P, hue: irnd(0, HUES - 1) });
      }
      lastX = x;
      lastY = y;
    });
  }

  function basicImpact(x, y, c, ty, P, k, from) {
    const TP = pal(ty);
    const n = Math.round([4, 6, 9, 12, 16, 22][c - 1] * k);
    burst(x, y, n, P, { v: 40 + c * 12, life: 0.25 + c * 0.04, size: c >= 4 ? [1, 2] : [1, 1], drag: 4 });
    if (c >= 2) flash(x, y, 3 + c, TP[3], { life: 0.1, a: 0.9 });
    if (c >= 3) {
      const base = from ? Math.atan2(y - from.y, x - from.x) : rnd(0, 6.28);
      slash(x, y, 7 + c, base - 1.9, 2.2, c >= 5 ? GOLD : TP, { th: 2 + (c >= 5 ? 1 : 0), life: 0.2 });
    }
    if (c >= 4) shock(x, y, 2, 10 + c * 2, c >= 6 ? 'prism' : TP, { th: 2, life: 0.3 });
    if (c >= 5) {
      flare(x, y, 6 + (c - 5) * 3, c >= 6 ? 'prism' : GOLD, { life: 0.22 });
      burst(x, y, 6, GOLD, { shape: '+', v: 70, drag: 5, life: 0.35 });
    }
    if (c >= 6) {
      for (let i = 0; i < 2; i++) {
        const a = rnd(0, 6.28);
        bolt(x, y, x + Math.cos(a) * 16, y + Math.sin(a) * 10, 'prism', { amp: 3, life: 0.14 });
      }
      burst(x, y, 6, 'prism', { shape: '*', v: 45, drag: 3, life: 0.5 });
    }
  }

  // Skill cast. a = caster feet, b = target feet (may equal a for self-casts).
  function skill(a, b, cost, ty, ranged, star) {
    if (!gctx || !a) return;
    const A = toC(a);
    const B = toC(b || a);
    const AB = { x: A.x, y: A.y - 10 };
    const BB = { x: B.x, y: B.y - 10 };
    const c = clamp(cost || 1, 1, 6);
    const P = pal(ty);
    const k = [0.6, 0.8, 1, 1.35, 1.9, 2.4][c - 1] * (1 + ((star || 1) - 1) * 0.12);
    const self = Math.hypot(A.x - B.x, A.y - B.y) < 2;
    if (c >= 6) return mythic(A, B, AB, BB, P, ty, k, ranged, self);
    if (c >= 5) return legendary(A, B, AB, BB, P, ty, k, ranged, self);
    // caster charge
    rise(A.x, A.y, 4 + c * 3, P, { v: 35 + c * 6, spread: 7, life: 0.45, shape: c >= 3 ? '+' : 'p' });
    if (c >= 2) shock(A.x, A.y, 3, 10 + c * 3, P, { layer: 0, sq: 0.5, th: 1, life: 0.4 });
    if (c >= 4) {
      magicCircle(A.x, A.y, 18, P, { life: 0.7, runes: 8 });
      pillar(A.x, A.y, 4, P, { h: 120, life: 0.45, grow: true });
      flash(AB.x, AB.y, 12, P[3], { life: 0.14 });
    }
    const travel = ranged && !self && c >= 3 ? 0.16 : 0;
    if (travel) {
      if (c >= 4) beam(AB.x, AB.y, BB.x, BB.y, 4, P, { life: 0.28 });
      else projectile(AB, BB, travel, 3, P, 90, c);
    }
    const impact = () => {
      motif(ty, BB.x, BB.y, k, P);
      shock(BB.x, BB.y, 2, 14 + c * 4, P, { th: 2 + (c >> 1) });
      if (c >= 2) flash(BB.x, BB.y, 6 + c * 2, P[2], { life: 0.15 });
      if (c >= 3) shock(B.x, B.y, 4, 18 + c * 5, P, { layer: 0, sq: 0.45, th: 2, delay: 0.06 });
      if (c >= 4) {
        shock(BB.x, BB.y, 4, 36, WHITE, { th: 2, delay: 0.1, life: 0.4 });
        flare(BB.x, BB.y, 14, P, { life: 0.3 });
        burst(BB.x, BB.y, 14, P, { v: 120, grav: 160, up: -50, drag: 1, trail: 0.025, life: 0.6 });
      }
    };
    if (travel && c < 4) later(travel, impact);
    else impact();
  }

  // 5-cost: golden summoning circle, light pillar, sky lance onto target, triple shockwave, gold rain.
  function legendary(A, B, AB, BB, P, ty, k, ranged, self) {
    dimBoard('#0a0612', 7, 1.2);
    magicCircle(A.x, A.y, 30, GOLD, { life: 1.15, runes: 12 });
    magicCircle(A.x, A.y, 20, P, { life: 1.0, dir: -1, runes: 6 });
    implode(AB.x, AB.y, 28, GOLD, { r: 48, size: [1, 2], life: 0.32 });
    pillar(A.x, A.y, 7, GOLD, { h: A.y + 10, life: 0.65, grow: true });
    flash(AB.x, AB.y, 18, GOLD[3], { life: 0.2 });
    rise(A.x, A.y, 26, GOLD, { shape: '+', v: 80, spread: 16, life: 0.8, delay: 0.25 });
    if (ranged && !self) beam(AB.x, AB.y, BB.x, BB.y, 6, P, { life: 0.35, delay: 0.08 });
    pillar(B.x, B.y, 9, P, { h: B.y + 10, life: 0.5, delay: 0.06, grow: true });
    pillar(B.x, B.y, 4, GOLD, { h: B.y + 10, life: 0.4, delay: 0.1 });
    later(0.12, () => {
      screenFlash('#fff6d0', 0.55, 0.14);
      motif(ty, BB.x, BB.y, k, P);
      motif(ty, BB.x, BB.y - 6, k * 0.6, GOLD);
      shock(BB.x, BB.y, 3, 46, GOLD, { th: 4, life: 0.5 });
      shock(BB.x, BB.y, 3, 64, P, { th: 3, life: 0.55, delay: 0.07 });
      shock(B.x, B.y, 6, 80, WHITE, { th: 2, life: 0.6, delay: 0.14, layer: 0, sq: 0.45 });
      flare(BB.x, BB.y, 30, GOLD, { life: 0.45 });
      speedLines(BB.x, BB.y, 8, 70, 18, GOLD, { life: 0.3 });
      burst(BB.x, BB.y, 30, P, { v: 150, grav: 200, up: -80, drag: 0.8, trail: 0.03, size: [1, 2], life: 0.75 });
      burst(BB.x, BB.y, 20, GOLD, { shape: '*', v: 90, drag: 2.5, life: 0.9 });
      fallFrom(B.x, B.y, 16, GOLD, { size: [1, 2], h: 120, v: 260, spread: 46, stagger: 0.6, delay: 0.2, shape: '+' });
      if (arena) arena.flash(arena.root, 'shake', 420);
    });
  }

  // 6-cost: the board turns to space, prismatic double circle, converging cosmic lances,
  // black-hole implosion then a supernova, with lingering falling stars.
  function mythic(A, B, AB, BB, P, ty, k, ranged, self) {
    dimBoard('#06041a', 10, 1.9);
    starfield(1.9, 140);
    magicCircle(A.x, A.y, 40, 'prism', { life: 1.6, runes: 16 });
    magicCircle(A.x, A.y, 28, MYTH, { life: 1.5, dir: -1, runes: 8 });
    magicCircle(B.x, B.y, 34, 'prism', { life: 1.3, dir: -1, runes: 12, delay: 0.05 });
    implode(AB.x, AB.y, 50, 'prism', { r: 80, size: [1, 2], life: 0.4, shape: '+' });
    pillar(A.x, A.y, 10, 'prism', { h: A.y + 10, life: 0.8, grow: true });
    flash(AB.x, AB.y, 24, '#ffffff', { life: 0.22 });
    swirl(A.x, A.y, 30, 'prism', { shape: '*', r0: 30, vr: -20, w: 5, life: 1, vy: -20 });
    if (ranged && !self) {
      beam(AB.x, AB.y, BB.x, BB.y, 8, 'prism', { life: 0.45, delay: 0.06 });
      bolt(AB.x, AB.y, BB.x, BB.y, 'prism', { amp: 8, life: 0.3, delay: 0.06 });
    }
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 70;
      beam(BB.x + ox, 0, BB.x, BB.y, 5, 'prism', { life: 0.3, delay: 0.04 + i * 0.04 });
    }
    implode(BB.x, BB.y, 60, MYTH, { r: 70, size: [1, 2], life: 0.2, k: 10 });
    later(0.16, () => {
      screenFlash('#ffffff', 0.75, 0.2);
      pillar(B.x, B.y, 14, 'prism', { h: B.y + 10, life: 0.6, grow: true });
      motif(ty, BB.x, BB.y, k, P);
      motif(ty, BB.x, BB.y, k * 0.7, 'prism');
      for (let i = 0; i < 5; i++) shock(BB.x, BB.y, 3, 40 + i * 18, 'prism', { th: 4 - (i >> 1), life: 0.55 + i * 0.05, delay: i * 0.06, hue: i * 2 });
      shock(B.x, B.y, 8, 120, WHITE, { th: 3, life: 0.7, delay: 0.1, layer: 0, sq: 0.42 });
      flare(BB.x, BB.y, 52, 'prism', { life: 0.6 });
      flare(BB.x, BB.y, 24, WHITE, { life: 0.4, delay: 0.1 });
      speedLines(BB.x, BB.y, 10, 110, 28, WHITE, { life: 0.35 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + rnd(-0.3, 0.3);
        bolt(BB.x, BB.y, BB.x + Math.cos(a) * 60, BB.y + Math.sin(a) * 36, 'prism', { amp: 6, life: 0.25, delay: rnd(0, 0.2) });
      }
      burst(BB.x, BB.y, 70, 'prism', { v: 190, grav: 160, up: -60, drag: 0.9, trail: 0.03, size: [1, 2], life: 0.9 });
      burst(BB.x, BB.y, 30, 'prism', { shape: '*', v: 110, drag: 2.2, life: 1.1 });
      if (arena) arena.flash(arena.root, 'shake', 520);
    });
    later(0.5, () => {
      shock(BB.x, BB.y, 10, 150, 'prism', { th: 3, life: 0.6, sq: 0.5 });
      burst(BB.x, BB.y, 24, WHITE, { shape: '+', v: 140, drag: 2, life: 0.6 });
      fallFrom(B.x, B.y, 26, 'prism', { size: [1, 2], h: 160, v: 280, spread: 90, stagger: 0.9, shape: '*', trail: 0.05 });
    });
  }

  // Area skill marker (skillfx events). rx/ry in arena screen px.
  function area(x, y, rx, cost, ty, heal) {
    if (!gctx) return;
    const C = toC({ x, y });
    const R = rx / S;
    const c = clamp(cost || 1, 1, 6);
    const P = c >= 6 ? 'prism' : pal(ty);
    shock(C.x, C.y, R * 0.2, R, P, { layer: 0, sq: 0.5, th: 1 + (c >> 1), life: 0.5 });
    const n = Math.round(R * (0.25 + c * 0.12));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = C.x + Math.cos(a) * R * rnd(0.6, 1);
      const py = C.y + Math.sin(a) * R * 0.5 * rnd(0.6, 1);
      part({ x: px, y: py, vx: 0, vy: heal ? -rnd(20, 40) : -rnd(30, 70), drag: 1.5, life: rnd(0.35, 0.6) + c * 0.04, size: c >= 4 ? irnd(1, 2) : 1, shape: heal ? '+' : c >= 5 ? '*' : 'p', pal: P === 'prism' ? 'prism' : c >= 5 ? GOLD : P, hue: irnd(0, HUES - 1), delay: rnd(0, 0.12) });
    }
    if (c >= 4) shock(C.x, C.y, R * 0.1, R * 1.15, c >= 6 ? 'prism' : c >= 5 ? GOLD : WHITE, { layer: 0, sq: 0.5, th: 2, life: 0.6, delay: 0.08 });
  }

  function hit(p, ty) {
    if (!gctx || !p) return;
    const C = toC(p);
    burst(C.x, C.y - 10, 6, pal(ty), { v: 60, life: 0.3, drag: 4 });
  }

  // ---------- loop ----------

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000) * speed();
    last = now;
    T += dt;
    if (timers.length) {
      const due = timers.filter(t => t.at <= T);
      if (due.length) {
        timers = timers.filter(t => t.at > T);
        for (const t of due) t.fn();
      }
    }
    gctx.clearRect(0, 0, W, H);
    tctx.clearRect(0, 0, W, H);
    if (dim) {
      if (T >= dim.until + 0.25) dim = null;
      else {
        const fin = Math.min(1, (T - dim.from) / 0.12);
        const fout = T > dim.until ? 1 - (T - dim.until) / 0.25 : 1;
        gctx.globalAlpha = (dim.level / 16) * fin * fout;
        gctx.fillStyle = dim.color;
        gctx.fillRect(0, 0, W, H);
        gctx.globalAlpha = 1;
      }
    }
    for (let i = prims.length - 1; i >= 0; i--) {
      const p = prims[i];
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      p.t += dt;
      if (p.t >= p.life) {
        prims.splice(i, 1);
        continue;
      }
    }
    for (const p of prims) if (p.delay <= 0) p.draw(p.layer === 0 ? gctx : tctx, p.t / p.life, dt);
    let w = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (updatePart(p, dt)) {
        drawPart(p);
        parts[w++] = p;
      }
    }
    parts.length = w;
    if (parts.length || prims.length || timers.length || dim) raf = requestAnimationFrame(frame);
  }

  return { init, clear, basic, skill, area, hit, PAL };
})();
