const Proj = {
  pitch: 44,
  height: 900,
  nearWidth: 740,
  nearY: 550,
  centerX: 640,

  init() {
    const t = (this.pitch * Math.PI) / 180;
    this.ct = Math.cos(t);
    this.st = Math.sin(t);
    this.camZ = 250 - this.height / Math.tan(t);
    this.k = 1;
    this.ox = 0;
    this.oy = 0;
    const L = this.raw(160, 500);
    const R = this.raw(632, 500);
    this.k = this.nearWidth / (R.x - L.x);
    this.ox = this.centerX - ((L.x + R.x) / 2) * this.k;
    this.oy = this.nearY - L.y * this.k;
  },

  raw(fx, fy) {
    const X = fx - 396;
    const dz = 500 - fy - this.camZ;
    const yc = -this.height * this.ct + dz * this.st;
    const zc = this.height * this.st + dz * this.ct;
    return { x: (X / zc) * 1000, y: (-yc / zc) * 1000 };
  },

  toScreen(fx, fy) {
    const r = this.raw(fx, fy);
    return { x: r.x * this.k + this.ox, y: r.y * this.k + this.oy };
  },

  toFlat(sx, sy) {
    const px = (sx - this.ox) / this.k / 1000;
    const py = -(sy - this.oy) / this.k / 1000;
    const dz = (this.height * (this.ct + py * this.st)) / (this.st - py * this.ct);
    const zc = this.height * this.st + dz * this.ct;
    return { x: px * zc + 396, y: 500 - (dz + this.camZ) };
  },

  depthScale(fy) {
    return 0.85 + 0.15 * Math.max(0, Math.min(1, fy / 500));
  }
};

Proj.init();

const FLAT = {
  benchTopY: 29,
  benchBottomY: 471,
  benchX0: 173,
  slotW: 46,
  slotGap: 4,
  padBottom: { x: 117, y: 467, w: 70, h: 70 },
  padTop: { x: 675, y: 33, w: 70, h: 70 },
  pillarBottomX: 117,
  pillarTopX: 675,
  pillarHalfW: 23,
  pillarHalfH: 18,
  pillarStep: 40,
  field: { x0: 176, x1: 616, y0: 56, y1: 446 }
};

function slotCenter(i, top) {
  return { x: FLAT.benchX0 + i * (FLAT.slotW + FLAT.slotGap) + FLAT.slotW / 2, y: top ? FLAT.benchTopY : FLAT.benchBottomY };
}

function pillarCenter(k, top) {
  if (top) return { x: FLAT.pillarTopX, y: FLAT.padTop.y + FLAT.padTop.h / 2 + 30 + k * FLAT.pillarStep };
  return { x: FLAT.pillarBottomX, y: FLAT.padBottom.y - FLAT.padBottom.h / 2 - 30 - k * FLAT.pillarStep };
}

function hexVerts(r, c) {
  const p = View.cellPos(r, c);
  const W = View.CELL_W;
  const H = View.CELL_H;
  return [[p.x + W / 2, p.y], [p.x + W, p.y + H / 4], [p.x + W, p.y + (3 * H) / 4], [p.x + W / 2, p.y + H], [p.x, p.y + (3 * H) / 4], [p.x, p.y + H / 4]];
}

const Floor = {
  W: 640,
  H: 360,

  hash(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 10000) / 10000;
  },

  smooth(x, y, s) {
    const gx = Math.floor(x / s);
    const gy = Math.floor(y / s);
    const fx = x / s - gx;
    const fy = y / s - gy;
    const a = this.hash(gx, gy);
    const b = this.hash(gx + 1, gy);
    const c = this.hash(gx, gy + 1);
    const d = this.hash(gx + 1, gy + 1);
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  },

  mix(c1, c2, t) {
    return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
  },

  shade(c, f) {
    return [c[0] * f, c[1] * f, c[2] * f];
  },

  grass(fx, fy, base) {
    const n = this.smooth(fx, fy, 60);
    const g = this.hash(Math.floor(fx / 4), Math.floor(fy / 4));
    let c = this.mix(base, [70, 120, 60], n * 0.5);
    if (g > 0.93) c = this.shade(c, 1.25);
    else if (g < 0.06) c = this.shade(c, 0.82);
    return c;
  },

  stone(fx, fy, tile) {
    const tx = Math.floor(fx / tile);
    const ty = Math.floor(fy / tile);
    const lx = fx - tx * tile;
    const ly = fy - ty * tile;
    if (lx < 2 || ly < 2) return [88, 82, 70];
    const v = this.hash(tx, ty);
    let c = this.mix([150, 141, 120], [176, 167, 145], v);
    if (lx < 4 || ly < 4) c = this.shade(c, 1.1);
    if (this.hash(Math.floor(fx / 3), Math.floor(fy / 3)) > 0.95) c = this.shade(c, 0.88);
    return c;
  },

  inRect(x, y, x0, y0, x1, y1) {
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  },

  material(fx, fy, carousel) {
    if (carousel) {
      const dx = fx - CAROUSEL_CENTER.x;
      const dy = fy - CAROUSEL_CENTER.y;
      const d = Math.hypot(dx, dy * 1.0);
      if (d < CAROUSEL.sand) {
        const sand = this.smooth(fx, fy, 30);
        return this.mix([196, 174, 120], [214, 194, 140], sand);
      }
      if (d < CAROUSEL.sand + 14) return this.stone(fx, fy, 14);
      for (let i = 0; i < 8; i++) {
        const sp = carouselSpawnFlat(i, 8);
        const dp = Math.hypot(fx - sp.x, fy - (sp.y - CAROUSEL.feet));
        if (dp < CAROUSEL.padR) {
          if (dp > CAROUSEL.padR - 6) return [88, 82, 70];
          return this.mix([122, 136, 168], [102, 114, 148], this.hash(Math.floor(fx / 7), Math.floor(fy / 7)) * 0.6);
        }
      }
      return this.grass(fx, fy, [58, 104, 52]);
    }
    const F = FLAT.field;
    for (const top of [false, true]) {
      const pad = top ? FLAT.padTop : FLAT.padBottom;
      const hw = pad.w / 2;
      const hh = pad.h / 2;
      if (this.inRect(fx, fy, pad.x - hw, pad.y - hh, pad.x + hw, pad.y + hh)) {
        if (Math.abs(fx - pad.x) > hw - 5 || Math.abs(fy - pad.y) > hh - 5) return [88, 82, 70];
        const t = this.hash(Math.floor(fx / 7), Math.floor(fy / 7));
        let c = this.mix([122, 136, 168], [102, 114, 148], t * 0.6);
        if (Math.abs(fx - pad.x) > hw - 10 || Math.abs(fy - pad.y) > hh - 10) c = this.shade(c, 0.85);
        return c;
      }
      for (let k = 0; k < 5; k++) {
        const pc = pillarCenter(k, top);
        const pw = FLAT.pillarHalfW;
        const ph = FLAT.pillarHalfH;
        if (this.inRect(fx, fy, pc.x - pw, pc.y - ph, pc.x + pw, pc.y + ph)) {
          if (Math.abs(fx - pc.x) > pw - 4 || Math.abs(fy - pc.y) > ph - 4) return [86, 80, 68];
          return this.stone(fx, fy, 12);
        }
      }
    }
    if (this.inRect(fx, fy, F.x0 - 16, 2, F.x1 + 16, 58) || this.inRect(fx, fy, F.x0 - 16, 444, F.x1 + 16, 500)) {
      for (const top of [true, false]) {
        for (let i = 0; i < 9; i++) {
          const sc = slotCenter(i, top);
          if (Math.abs(fx - sc.x) < 21 && Math.abs(fy - sc.y) < 20) {
            if (Math.abs(fx - sc.x) > 19 || Math.abs(fy - sc.y) > 18) return [96, 89, 76];
            return this.mix([170, 160, 136], [184, 175, 150], this.hash(Math.floor(fx / 5), Math.floor(fy / 5)) * 0.5);
          }
        }
      }
      return this.stone(fx, fy, 16);
    }
    if (this.inRect(fx, fy, F.x0 - 10, F.y0, F.x1 + 10, F.y1)) {
      if (fx < F.x0 || fx > F.x1) return this.stone(fx, fy, 10);
      const n = this.smooth(fx, fy, 40);
      let c = this.mix([104, 150, 74], [134, 156, 88], n);
      if (this.smooth(fx + 500, fy + 300, 70) > 0.72) c = this.mix(c, [168, 146, 98], 0.6);
      const g = this.hash(Math.floor(fx / 4), Math.floor(fy / 4));
      if (g > 0.94) c = this.shade(c, 1.15);
      else if (g < 0.05) c = this.shade(c, 0.88);
      if (fy < 250) c = this.shade(c, 0.95);
      return c;
    }
    const edge = Math.max(F.x0 - 40 - fx, fx - F.x1 - 40, -30 - fy, fy - 530, 0);
    const base = this.grass(fx, fy, [62, 108, 54]);
    return this.shade(base, Math.max(0.6, 1 - edge / 900));
  },

  cache: {},

  mapId: null,
  jobs: {},
  queue: [],
  pumping: false,

  mapCanvas(id) {
    const key = 'map:' + id;
    if (this.cache[key]) return this.cache[key];
    let job = this.jobs[id];
    if (!job) job = this.jobs[id] = MapRender.job(MAPS[id]);
    job.step(1e9);
    this.cache[key] = job.canvas;
    delete this.jobs[id];
    return job.canvas;
  },

  prerender(ids) {
    for (const id of ids) if (MAPS[id] && !this.cache['map:' + id] && !this.queue.includes(id)) this.queue.push(id);
    if (this.pumping) return;
    this.pumping = true;
    const pump = () => {
      const id = this.queue[0];
      if (!id) {
        this.pumping = false;
        return;
      }
      if (this.cache['map:' + id]) {
        this.queue.shift();
      } else {
        if (!this.jobs[id]) this.jobs[id] = MapRender.job(MAPS[id]);
        if (this.jobs[id].step(6)) {
          this.cache['map:' + id] = this.jobs[id].canvas;
          delete this.jobs[id];
          this.queue.shift();
        }
      }
      setTimeout(pump, 16);
    };
    setTimeout(pump, 200);
  },

  show(canvas, carousel) {
    const map = !carousel && this.mapId && typeof MAPS !== 'undefined' ? MAPS[this.mapId] : null;
    const key = carousel ? 'car' : map ? 'map:' + this.mapId : 'field';
    if (map) this.mapCanvas(this.mapId);
    if (!this.cache[key]) {
      const off = document.createElement('canvas');
      off.width = this.W;
      off.height = this.H;
      this.render(off, carousel);
      this.cache[key] = off;
    }
    canvas.getContext('2d').clearRect(0, 0, this.W, this.H);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.cache[key], 0, 0);
  },

  render(canvas, carousel) {
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(this.W, this.H);
    const d = img.data;
    const sx = 1280 / this.W;
    const sy = 720 / this.H;
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        const f = Proj.toFlat((x + 0.5) * sx, (y + 0.5) * sy);
        const c = this.material(f.x, f.y, carousel);
        const i = (y * this.W + x) * 4;
        d[i] = c[0];
        d[i + 1] = c[1];
        d[i + 2] = c[2];
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (!carousel) {
      ctx.save();
      ctx.scale(1 / sx, 1 / sy);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.lineWidth = 2;
      for (let r = 0; r < BOARD_ROWS; r++) for (let c = 0; c < BOARD_COLS; c++) this.hexPath(ctx, r, c, 3);
      ctx.restore();
    }
  },

  hexPath(ctx, r, c, inset) {
    const v = hexVerts(r, c);
    const p = View.cellCenter(r, c);
    ctx.beginPath();
    v.forEach(([x, y], i) => {
      const k = inset ? 1 - inset / 30 : 1;
      const s = Proj.toScreen(p.x + (x - p.x) * k, p.y + (y - p.y) * k);
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.stroke();
  },

  drawOverlay(canvas, opts) {
    canvas.width = this.W;
    canvas.style.visibility = opts ? 'visible' : 'hidden';
    const ctx = canvas.getContext('2d');
    if (!opts) return;
    ctx.save();
    ctx.scale(this.W / 1280, this.H / 720);
    if (opts.grid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      for (let r = 4; r < BOARD_ROWS; r++) for (let c = 0; c < BOARD_COLS; c++) this.hexPath(ctx, r, c, 3);
    }
    if (opts.cell) {
      ctx.fillStyle = 'rgba(255, 211, 77, 0.45)';
      ctx.strokeStyle = 'rgba(255, 211, 77, 0.95)';
      ctx.lineWidth = 3;
      this.hexPath(ctx, opts.cell.r, opts.cell.c, 3);
      ctx.fill();
    }
    if (opts.slot !== undefined && opts.slot !== null) {
      const sc = slotCenter(opts.slot, false);
      const pts = [[sc.x - 21, sc.y - 20], [sc.x + 21, sc.y - 20], [sc.x + 21, sc.y + 20], [sc.x - 21, sc.y + 20]].map(([x, y]) => Proj.toScreen(x, y));
      ctx.fillStyle = 'rgba(255, 211, 77, 0.45)';
      ctx.strokeStyle = 'rgba(255, 211, 77, 0.95)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (opts.red) {
      ctx.strokeStyle = 'rgba(255, 70, 70, 0.95)';
      ctx.fillStyle = 'rgba(255, 60, 60, 0.18)';
      ctx.lineWidth = 3;
      for (const cell of opts.red) {
        this.hexPath(ctx, cell.r, cell.c, 3);
        ctx.fill();
      }
    }
    if (opts.barriers) {
      for (const b of opts.barriers) {
        if (b.open) continue;
        ctx.strokeStyle = 'rgba(143, 183, 255, 0.95)';
        ctx.fillStyle = 'rgba(120, 160, 255, 0.18)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        for (let i = 0; i <= 32; i++) {
          const a = (i / 32) * Math.PI * 2;
          const s = Proj.toScreen(b.x + Math.cos(a) * (CAROUSEL.padR - 4), b.y - CAROUSEL.feet + Math.sin(a) * (CAROUSEL.padR - 4));
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }
};

const CAROUSEL = { radius: 206, padR: 64, sand: 104, feet: 12 };

function carouselSpawnFlat(index, count) {
  const a = Math.PI / 2 + (index * Math.PI * 2) / count;
  return { x: CAROUSEL_CENTER.x + Math.cos(a) * CAROUSEL.radius, y: CAROUSEL_CENTER.y + Math.sin(a) * CAROUSEL.radius + CAROUSEL.feet };
}

function placeSprite(el, fx, fy, originX, originY, extra) {
  const p = Proj.toScreen(fx, fy);
  const s = Proj.depthScale(fy) * (extra || 1);
  el.style.left = Math.round(p.x) + 'px';
  el.style.top = Math.round(p.y) + 'px';
  el.style.transform = 'translate(' + -originX + 'px, ' + -originY + 'px) scale(' + s.toFixed(3) + ')';
  el.style.transformOrigin = originX + 'px ' + originY + 'px';
  el.style.zIndex = String(100 + Math.round(p.y));
  return p;
}
