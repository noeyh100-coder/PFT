const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const MK = {
  hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 100000) / 100000;
  },

  noise(x, y, scale, seed) {
    const gx = Math.floor(x / scale);
    const gy = Math.floor(y / scale);
    const fx = x / scale - gx;
    const fy = y / scale - gy;
    const a = this.hash(gx, gy, seed);
    const b = this.hash(gx + 1, gy, seed);
    const c = this.hash(gx, gy + 1, seed);
    const d = this.hash(gx + 1, gy + 1, seed);
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  },

  fbm(x, y, scale, oct, seed) {
    let sum = 0;
    let amp = 1;
    let tot = 0;
    let s = scale;
    for (let i = 0; i < (oct || 3); i++) {
      sum += this.noise(x, y, s, (seed || 0) + i * 17) * amp;
      tot += amp;
      amp *= 0.5;
      s *= 0.5;
    }
    return sum / tot;
  },

  vor(x, y, cell, seed, jitter) {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    const j = jitter == null ? 0.9 : jitter;
    let d1 = 1e9;
    let d2 = 1e9;
    let id = 0;
    let cx = 0;
    let cy = 0;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const ix = gx + ox;
        const iy = gy + oy;
        const px = (ix + 0.5 + (this.hash(ix, iy, seed) - 0.5) * j) * cell;
        const py = (iy + 0.5 + (this.hash(ix, iy, (seed || 0) + 7) - 0.5) * j) * cell;
        const d = Math.hypot(x - px, y - py);
        if (d < d1) {
          d2 = d1;
          d1 = d;
          id = this.hash(ix, iy, (seed || 0) + 3);
          cx = px;
          cy = py;
        } else if (d < d2) d2 = d;
      }
    }
    return { d1, d2, edge: d2 - d1, id, cx, cy };
  },

  hex(s) {
    const n = parseInt(s.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },

  ramp(list) {
    return list.map(c => (typeof c === 'string' ? this.hex(c) : c));
  },

  bayer(x, y) {
    return (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  },

  q(ramp, t, x, y) {
    const n = ramp.length;
    const v = Math.max(0, Math.min(0.9999, t)) * (n - 1);
    let i = Math.floor(v);
    if (v - i > this.bayer(x, y)) i++;
    return ramp[Math.min(n - 1, i)];
  },

  mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  },

  shade(c, f) {
    return [c[0] * f, c[1] * f, c[2] * f];
  },

  clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  },

  smooth(e0, e1, x) {
    const t = this.clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  },

  rgba(c, a) {
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')';
  },

  capture: null,

  pixels(ctx, W, H, fn) {
    if (this.capture) {
      this.capture.push(fn);
      return;
    }
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = fn(x, y);
        if (!c) continue;
        const i = (y * W + x) * 4;
        const a = c.length > 3 ? c[3] / 255 : 1;
        d[i] = d[i] * (1 - a) + c[0] * a;
        d[i + 1] = d[i + 1] * (1 - a) + c[1] * a;
        d[i + 2] = d[i + 2] * (1 - a) + c[2] * a;
        d[i + 3] = Math.max(d[i + 3], a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  },

  line(ctx, x0, y0, x1, y1, color) {
    ctx.fillStyle = color;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    for (let n = 0; n < 2000; n++) {
      ctx.fillRect(x, y, 1, 1);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  },

  sphere(x, y, cx, cy, r, lx, ly) {
    const nx = (x - cx) / r;
    const ny = (y - cy) / r;
    const d = nx * nx + ny * ny;
    if (d > 1) return -1;
    const nz = Math.sqrt(1 - d);
    const L = [lx == null ? -0.55 : lx, ly == null ? -0.65 : ly, 0.55];
    const ln = Math.hypot(L[0], L[1], L[2]);
    return Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ln);
  }
};

const MapLayout = {
  hexCell(fx, fy) {
    const W = View.CELL_W;
    const H = View.CELL_H;
    let best = null;
    const r0 = Math.floor((fy - View.BOARD_Y - H / 2) / View.ROW_STEP);
    for (let r = r0 - 1; r <= r0 + 2; r++) {
      if (r < 0 || r >= BOARD_ROWS) continue;
      const c0 = Math.floor((fx - View.BOARD_X) / W - (r & 1) * 0.5);
      for (let c = c0 - 1; c <= c0 + 1; c++) {
        if (c < 0 || c >= BOARD_COLS) continue;
        const p = View.cellCenter(r, c);
        const dx = Math.abs(fx - p.x);
        const dy = Math.abs(fy - p.y);
        if (dx > W / 2) continue;
        const lim = H / 2 - (H / 4) * (dx / (W / 2));
        if (dy > lim) continue;
        const e = Math.min(W / 2 - dx, (lim - dy) * 0.86);
        if (!best || e > best.e) best = { r, c, e, lx: fx - p.x, ly: fy - p.y };
      }
    }
    return best;
  },

  classify(fx, fy) {
    for (const top of [false, true]) {
      const pad = top ? FLAT.padTop : FLAT.padBottom;
      const lx = fx - pad.x;
      const ly = fy - pad.y;
      if (Math.abs(lx) <= pad.w / 2 && Math.abs(ly) <= pad.h / 2) return { k: 'pad', lx, ly, top };
      for (let i = 0; i < 5; i++) {
        const pc = pillarCenter(i, top);
        const px = fx - pc.x;
        const py = fy - pc.y;
        if (Math.abs(px) <= FLAT.pillarHalfW && Math.abs(py) <= FLAT.pillarHalfH) return { k: 'pillar', lx: px, ly: py, i, top };
      }
    }
    const F = FLAT.field;
    const inTop = fy >= 2 && fy <= 58;
    const inBot = fy >= 444 && fy <= 500;
    if ((inTop || inBot) && fx >= F.x0 - 16 && fx <= F.x1 + 16) {
      const top = inTop;
      for (let i = 0; i < 9; i++) {
        const sc = slotCenter(i, top);
        const lx = fx - sc.x;
        const ly = fy - sc.y;
        if (Math.abs(lx) < 21 && Math.abs(ly) < 20) return { k: 'slot', lx, ly, i, top };
      }
      return { k: 'bench', top, lx: fx - (F.x0 - 16), ly: top ? fy - 2 : fy - 444 };
    }
    if (fx >= F.x0 && fx <= F.x1 && fy >= F.y0 && fy <= F.y1) {
      return { k: 'field', ex: Math.min(fx - F.x0, F.x1 - fx), ey: Math.min(fy - F.y0, F.y1 - fy) };
    }
    if (fy >= F.y0 && fy <= F.y1 && fx >= F.x0 - 10 && fx <= F.x1 + 10) return { k: 'frame', left: fx < F.x0, d: fx < F.x0 ? F.x0 - fx : fx - F.x1 };
    return { k: 'outer' };
  }
};

const Spr = {
  cache: {},

  make(key, w, h, fn, opts) {
    if (key && this.cache[key]) return this.cache[key];
    opts = opts || {};
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const mask = new Uint8Array(w * h);
    const col = new Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = fn(x, y);
        if (c) {
          mask[y * w + x] = 1;
          col[y * w + x] = c;
        }
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let c = col[i];
        let a = 255;
        if (!mask[i]) {
          if (!opts.outline) continue;
          const n = (x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1]) || (y > 0 && mask[i - w]) || (y < h - 1 && mask[i + w]);
          if (!n) continue;
          c = opts.outline;
        }
        if (c.length > 3) a = c[3];
        d[i * 4] = c[0];
        d[i * 4 + 1] = c[1];
        d[i * 4 + 2] = c[2];
        d[i * 4 + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (key) this.cache[key] = cv;
    return cv;
  }
};

class PropPainter {
  constructor(ctx) {
    this.ctx = ctx;
    this.decals = [];
    this.shadows = [];
    this.items = [];
    this.glows = [];
  }

  at(fx, fy) {
    const s = Proj.toScreen(fx, fy);
    return { x: Math.round(s.x / 2), y: Math.round(s.y / 2) };
  }

  add(fx, fy, draw) {
    this.items.push({ d: fy, fx, fy, draw });
  }

  sprite(fx, fy, cv, ax, ay, opts) {
    opts = opts || {};
    this.add(fx, fy + (opts.depth || 0), (ctx, p) => {
      ctx.save();
      if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
      if (opts.flip) {
        ctx.translate(p.x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(cv, -ax, p.y - ay);
      } else ctx.drawImage(cv, p.x - ax, p.y - ay);
      ctx.restore();
    });
  }

  shadow(fx, fy, rx, ry, a) {
    this.shadows.push({ fx, fy, rx, ry, a: a == null ? 0.28 : a });
  }

  glow(fx, fy, r, color, a, lift) {
    this.glows.push({ fx, fy, r, color, a: a == null ? 0.5 : a, lift: lift || 0 });
  }

  decal(fx, fy, draw) {
    this.decals.push({ fx, fy, draw });
  }

  flush() {
    const ctx = this.ctx;
    for (const dcl of this.decals) dcl.draw(ctx, this.at(dcl.fx, dcl.fy));
    for (const s of this.shadows) {
      const p = this.at(s.fx, s.fy);
      ctx.fillStyle = 'rgba(10, 8, 20, ' + s.a + ')';
      for (let y = -s.ry; y <= s.ry; y++) {
        const w = Math.round(s.rx * Math.sqrt(1 - (y * y) / (s.ry * s.ry + 0.01)));
        ctx.fillRect(p.x - w, p.y + y, w * 2 + 1, 1);
      }
    }
    this.items.sort((a, b) => a.d - b.d);
    for (const it of this.items) it.draw(ctx, this.at(it.fx, it.fy));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const g of this.glows) {
      const p = this.at(g.fx, g.fy);
      const grd = ctx.createRadialGradient(p.x, p.y - g.lift, 0, p.x, p.y - g.lift, g.r);
      grd.addColorStop(0, MK.rgba(g.color, g.a));
      grd.addColorStop(1, MK.rgba(g.color, 0));
      ctx.fillStyle = grd;
      ctx.fillRect(p.x - g.r, p.y - g.lift - g.r, g.r * 2, g.r * 2);
    }
    ctx.restore();
  }
}

const MapRender = {
  W: 640,
  H: 360,

  job(map) {
    const W = this.W;
    const H = this.H;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const skyCv = document.createElement('canvas');
    skyCv.width = W;
    skyCv.height = H;
    const skyCtx = skyCv.getContext('2d');
    const skyFns = [];
    if (map.sky) {
      MK.capture = skyFns;
      try {
        map.sky(skyCtx, W, H);
      } finally {
        MK.capture = null;
      }
    }
    const skyImg = skyFns.length ? skyCtx.getImageData(0, 0, W, H) : null;
    const g = document.createElement('canvas');
    g.width = W;
    g.height = H;
    const gctx = g.getContext('2d');
    const img = gctx.createImageData(W, H);
    const flat = new Float32Array(W * H * 2);
    const ground = new Uint8Array(W * H);
    const cliffH = map.cliffH || 0;
    const job = { map, canvas, done: false, phase: 0, row: 0 };
    const rowFlat = y => {
      for (let x = 0; x < W; x++) {
        const f = Proj.toFlat((x + 0.5) * 2, (y + 0.5) * 2);
        const i = y * W + x;
        flat[i * 2] = f.x;
        flat[i * 2 + 1] = f.y;
        ground[i] = !map.island || map.island(f.x, f.y) ? 1 : 0;
      }
    };
    const rowSky = y => {
      const d = skyImg.data;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        for (const fn of skyFns) {
          const c = fn(x, y);
          if (!c) continue;
          const a = c.length > 3 ? c[3] / 255 : 1;
          d[i] = d[i] * (1 - a) + c[0] * a;
          d[i + 1] = d[i + 1] * (1 - a) + c[1] * a;
          d[i + 2] = d[i + 2] * (1 - a) + c[2] * a;
          d[i + 3] = Math.max(d[i + 3], a * 255);
        }
      }
    };
    const rowGround = y => {
      const d = img.data;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const fx = flat[i * 2];
        const fy = flat[i * 2 + 1];
        let c = null;
        if (ground[i]) {
          c = map.paint(MapLayout.classify(fx, fy), fx, fy, x, y);
          if (map.rim) {
            let edge = 0;
            for (let k = 1; k <= 2 && !edge; k++) {
              if (y + k < H && !ground[i + k * W]) edge = k;
              else if (x - k >= 0 && !ground[i - k]) edge = k;
              else if (x + k < W && !ground[i + k]) edge = k;
              else if (y - k >= 0 && !ground[i - k * W]) edge = k;
            }
            if (edge) c = map.rim(c, edge, fx, fy, x, y);
          }
        } else if (cliffH) {
          for (let k = 1; k <= cliffH; k++) {
            if (y - k < 0) break;
            if (ground[i - k * W]) {
              c = map.cliff(k, cliffH, flat[(i - k * W) * 2], flat[(i - k * W) * 2 + 1], x, y);
              break;
            }
          }
        }
        if (!c) continue;
        d[i * 4] = c[0];
        d[i * 4 + 1] = c[1];
        d[i * 4 + 2] = c[2];
        d[i * 4 + 3] = c.length > 3 ? c[3] : 255;
      }
    };
    const finish = () => {
      ctx.clearRect(0, 0, W, H);
      if (skyImg) skyCtx.putImageData(skyImg, 0, 0);
      ctx.drawImage(skyCv, 0, 0);
      gctx.putImageData(img, 0, 0);
      ctx.drawImage(g, 0, 0);
      if (map.afterGround) map.afterGround(ctx, W, H);
      if (map.grid) {
        ctx.save();
        ctx.scale(0.5, 0.5);
        ctx.strokeStyle = map.grid;
        ctx.lineWidth = 2;
        for (let r = 0; r < BOARD_ROWS; r++) for (let c = 0; c < BOARD_COLS; c++) Floor.hexPath(ctx, r, c, 3);
        ctx.restore();
      }
      if (map.props) {
        const P = new PropPainter(ctx);
        map.props(P);
        P.flush();
      }
      if (map.post) map.post(ctx, W, H);
    };
    job.step = budget => {
      if (job.done) return true;
      const t0 = performance.now();
      while (performance.now() - t0 < budget) {
        if (job.phase === 0) {
          rowFlat(job.row++);
          if (job.row >= H) {
            job.phase = skyImg ? 1 : 2;
            job.row = 0;
          }
        } else if (job.phase === 1) {
          rowSky(job.row++);
          if (job.row >= H) {
            job.phase = 2;
            job.row = 0;
          }
        } else if (job.phase === 2) {
          rowGround(job.row++);
          if (job.row >= H) job.phase = 3;
        } else {
          finish();
          job.done = true;
          return true;
        }
      }
      return false;
    };
    return job;
  },

  render(canvas, map) {
    const job = this.job(map);
    job.step(1e9);
    canvas.getContext('2d').drawImage(job.canvas, 0, 0);
  }
};
