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

  sushi(fx, fy) {
    const dx = fx - CAROUSEL_CENTER.x;
    const dy = fy - CAROUSEL_CENTER.y;
    const d = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const ring = CONFIG.carousel.ringRadius;
    const sand = CAROUSEL.sand;
    if (d < sand + 12) {
      if (d >= sand + 4) return this.shade([132, 120, 104], 0.8 + this.hash(Math.floor(ang * 40), 3) * 0.2);
      if (d >= sand) return [214, 202, 176];
      if (d >= ring + 12) {
        const t = this.hash(Math.floor((ang + Math.PI) * 30), Math.floor(d / 6));
        return this.mix([184, 172, 146], [204, 192, 166], t * 0.6);
      }
      if (d >= ring - 12) {
        const edge = Math.min(Math.abs(d - (ring - 12)), Math.abs(d - (ring + 12)));
        if (edge < 2) return [126, 236, 255];
        if (edge < 4) return [58, 150, 186];
        const tie = Math.abs(((ang + Math.PI) * 36 / Math.PI) % 2 - 1) < 0.18;
        if (tie) return [30, 70, 96];
        const sh = Math.abs(d - ring) < 2 ? 1.25 : 1;
        return this.shade([40, 96, 128], sh);
      }
      if (d >= ring - 16) return [92, 70, 34];
      const n = this.smooth(fx, fy, 22);
      let c = this.mix([214, 178, 92], [232, 202, 118], n);
      const rr = d % 18;
      if (rr < 1.6) c = this.shade(c, 0.84);
      if (d < 20) {
        c = this.mix([246, 226, 156], [255, 240, 186], n);
        if (d > 17) c = [176, 132, 60];
      }
      const spoke = Math.abs(((ang + Math.PI) * 4 / Math.PI) % 1 - 0.5) < 0.04 && d > 20;
      if (spoke) c = this.shade(c, 0.88);
      return c;
    }
    for (let i = 0; i < 8; i++) {
      const sp = carouselSpawnFlat(i, 8);
      const px = sp.x;
      const py = sp.y - CAROUSEL.feet;
      const u = fx - px;
      const v = fy - py;
      const R = CAROUSEL.padR * 0.93;
      const oct = Math.max(Math.abs(u), Math.abs(v), (Math.abs(u) + Math.abs(v)) * 0.7071);
      if (oct < R) {
        if (oct > R - 3) return [74, 66, 56];
        if (oct > R - 9) {
          const lit = (u + v < 0) ? 1.12 : 0.86;
          return this.shade([168, 156, 128], lit);
        }
        const r = Math.hypot(u, v);
        const t = this.hash(Math.floor((fx + 300) / 9), Math.floor((fy + 300) / 9));
        let c = this.mix([196, 186, 154], [212, 204, 174], t * 0.7);
        const gx = ((fx + 300) % 18 + 18) % 18;
        const gy = ((fy + 300) % 18 + 18) % 18;
        if (gx < 1 || gy < 1) c = this.shade(c, 0.86);
        if (r > 28 && r < 33) c = [150, 138, 108];
        if (r > 33 && r < 35) c = [226, 218, 190];
        if (r < 28) {
          const a = Math.atan2(v, u);
          const petal = Math.abs(Math.cos(a * 3)) * 18 + 6;
          if (r < petal && r > petal - 2.5) c = [150, 138, 108];
          if (r < 5) c = [236, 148, 186];
        }
        if (this.smooth(fx + 900, fy + 400, 26) > 0.74) c = this.mix(c, [118, 156, 84], 0.45);
        return c;
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 2 + (i * Math.PI * 2) / 8;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const along = dx * ca + dy * sa;
      const perp = -dx * sa + dy * ca;
      const end = CAROUSEL.radius - CAROUSEL.padR * 0.85;
      if (along > sand + 6 && along < end && Math.abs(perp) < 20) {
        if (Math.abs(perp) > 16) return this.shade([132, 96, 60], Math.abs(perp) > 18 ? 0.7 : 1);
        const step = (along - sand) % 9;
        if (step < 1.5) return [96, 70, 44];
        const t = this.hash(Math.floor(perp / 6) + 40, Math.floor(along / 9));
        return this.mix([178, 134, 86], [196, 152, 100], t);
      }
    }
    const isl = 312 + (this.smooth(Math.cos(ang) * 60 + 500, Math.sin(ang) * 60 + 500, 22) - 0.5) * 34;
    if (d < isl) {
      for (let i = 0; i < 8; i++) {
        const a = Math.PI / 2 + ((i + 0.5) * Math.PI * 2) / 8;
        const tx = CAROUSEL_CENTER.x + Math.cos(a) * 278;
        const ty = CAROUSEL_CENTER.y + Math.sin(a) * 278;
        const ux = fx - tx;
        const uy = fy - ty;
        const tr = Math.hypot(ux, uy);
        const ta = Math.atan2(uy, ux);
        const rad = 40 + (this.smooth(Math.cos(ta) * 30 + i * 97, Math.sin(ta) * 30 + 50, 8) - 0.5) * 16;
        if (tr < rad) {
          if (tr > rad - 3) return [150, 64, 108];
          const n = this.smooth(fx + 1000, fy, 9);
          const lit = (-ux - uy) / (rad * 1.4);
          let c = this.mix([214, 112, 160], [250, 176, 208], Math.max(0, Math.min(1, n * 0.6 + lit * 0.6 + 0.2)));
          if (this.hash(Math.floor(fx / 3), Math.floor(fy / 3)) > 0.93) c = [255, 222, 236];
          return c;
        }
        if (tr < rad + 10 && ux > -6 && uy > -6) return this.shade(this.grass(fx, fy, [92, 146, 68]), 0.72);
      }
      let c = this.grass(fx, fy, [96, 150, 70]);
      c = this.mix(c, [120, 168, 82], this.smooth(fx, fy, 50) * 0.4);
      const h = this.hash(Math.floor(fx / 3), Math.floor(fy / 3));
      if (h > 0.986) c = [250, 178, 210];
      else if (h > 0.978) c = [255, 226, 238];
      if (d > isl - 3) c = this.shade(c, 0.7);
      return c;
    }
    if (dy > -40 && d < isl + 36) {
      const k = d - isl;
      const band = Math.floor((k + this.smooth(fx, 0, 14) * 6) / 7);
      const base = [[120, 86, 58], [104, 74, 50], [132, 96, 64], [92, 66, 46], [84, 60, 42], [70, 52, 38]][Math.min(5, band)];
      const fade = Math.min(1, (dy + 40) / 60);
      const sky = this.sky(fx, fy);
      return this.mix(sky, this.shade(base, 0.9 + this.hash(Math.floor(fx / 4), Math.floor(fy / 4)) * 0.2), fade);
    }
    return this.sky(fx, fy);
  },

  sky(fx, fy) {
    const t = Math.max(0, Math.min(1, (fy + 200) / 900));
    let c = this.mix([124, 178, 230], [176, 214, 244], t);
    const cl = this.smooth(fx * 0.8 + 2000, fy * 1.6, 70) * 0.65 + this.smooth(fx + 3000, fy * 2, 24) * 0.35;
    if (cl > 0.6) c = this.mix(c, [250, 240, 248], Math.min(1, (cl - 0.6) * 4));
    if (cl > 0.72) c = this.mix(c, [255, 222, 236], 0.25);
    return c;
  },

  inRect(x, y, x0, y0, x1, y1) {
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  },

  material(fx, fy, carousel) {
    if (carousel) return this.sushi(fx, fy);
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
