const R = list => MK.ramp(list);

const SprLib = {
  blobTree(key, w, h, blobs, leaf, trunk, outline, opts) {
    opts = opts || {};
    const main = blobs[0];
    return Spr.make(key, w, h, (x, y) => {
      let inside = false;
      for (const b of blobs) if ((x - b[0]) ** 2 + ((y - b[1]) * (b[3] || 1)) ** 2 <= b[2] * b[2]) inside = true;
      if (inside) {
        const s = MK.sphere(x, y, main[0], main[1], main[2] * 1.25);
        let t = s < 0 ? 0.25 : s;
        const clump = MK.vor(x, y, opts.clump || 5, w * 7 + h);
        t += (0.5 - clump.d1 / (opts.clump || 5)) * 0.35;
        if (y > main[1] + main[2] * 0.4) t -= 0.15;
        if (opts.dots && MK.hash(x, y, 5) > 0.93) return opts.dots[Math.floor(MK.hash(x, y, 9) * opts.dots.length)];
        return MK.q(leaf, t, x, y);
      }
      if (trunk && x >= trunk[0] && x < trunk[0] + trunk[2] && y >= trunk[1] && y < trunk[1] + trunk[3]) {
        const u = (x - trunk[0]) / trunk[2];
        return MK.q(trunk[4], 0.8 - u * 0.7 + (MK.hash(x, y, 3) - 0.5) * 0.2, x, y);
      }
      return null;
    }, { outline });
  },

  pine(key, w, h, leaf, trunk, outline, snow) {
    const cx = w / 2;
    return Spr.make(key, w, h, (x, y) => {
      const tiers = 4;
      const top = 2;
      const bot = h - 7;
      if (y >= top && y <= bot) {
        const t = (y - top) / (bot - top);
        const tier = Math.floor(t * tiers);
        const tt = t * tiers - tier;
        const half = (2 + (tier + 1) * (w / 2 - 2) / tiers) * (0.45 + 0.55 * tt);
        const dx = x - cx + 0.5;
        if (Math.abs(dx) <= half) {
          let v = 0.55 - dx / (half + 1) * 0.35 + (tt < 0.35 ? -0.12 : 0.05);
          if (snow && tt < 0.3 + MK.hash(x, tier, 4) * 0.25 && dx < half * 0.6) return MK.q(snow, 0.4 + (0.5 - dx / (half + 1)) * 0.6, x, y);
          if (snow && tt > 0.8 && MK.hash(x, y, 2) > 0.7) return MK.q(snow, 0.2, x, y);
          return MK.q(leaf, v + (MK.hash(x, y, 7) - 0.5) * 0.18, x, y);
        }
      }
      if (y > bot && y < h - 1 && Math.abs(x - cx + 0.5) < 1.6) return MK.q(trunk, 0.4 + (x < cx ? 0.3 : 0), x, y);
      return null;
    }, { outline });
  },

  palm(key, w, h, leaf, trunk, outline, lean) {
    const baseX = w / 2;
    const topY = 12;
    const L = lean || 6;
    const trunkX = y => baseX + L * Math.pow((h - 1 - y) / (h - 1 - topY), 1.6);
    return Spr.make(key, w, h, (x, y) => {
      const tx = trunkX(topY);
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI * 0.95 + k * (Math.PI * 1.15 / 6) + (k > 3 ? 0.3 : 0);
        const len = 13 + (k % 2) * 3;
        for (let s = 0; s <= len; s++) {
          const px = tx + Math.cos(a) * s;
          const py = topY + Math.sin(a) * s * 0.65 + (s * s) / (len * 2.4);
          const wd = 2.4 * Math.sin((s / len) * Math.PI) + 0.4;
          if (Math.abs(x - px) <= wd * 0.6 && Math.abs(y - py) <= wd) {
            return MK.q(leaf, 0.75 - s / len * 0.5 + (Math.sin(a) < -0.3 ? 0.15 : -0.05) + (MK.hash(x, y, 1) - 0.5) * 0.2, x, y);
          }
        }
      }
      if ((x - tx) ** 2 + (y - topY - 1) ** 2 <= 5) return MK.q(trunk, 0.2 + MK.hash(x, y) * 0.3, x, y);
      if (y > topY && y < h) {
        const cx = trunkX(y);
        if (Math.abs(x - cx) <= 1.8) {
          const ring = (y % 3 === 0) ? -0.2 : 0;
          return MK.q(trunk, 0.6 - (x - cx) * 0.15 + ring, x, y);
        }
      }
      return null;
    }, { outline });
  }
};


const MapFx = {
  rectDist(x, y, x0, y0, x1, y1) {
    const dx = Math.max(x0 - x, 0, x - x1);
    const dy = Math.max(y0 - y, 0, y - y1);
    return Math.hypot(dx, dy);
  },

  platformDist(x, y, noPillars) {
    let d = this.rectDist(x, y, 160, 2, 632, 500);
    for (const pad of [FLAT.padTop, FLAT.padBottom]) d = Math.min(d, this.rectDist(x, y, pad.x - 35, pad.y - 35, pad.x + 35, pad.y + 35));
    if (noPillars) return d;
    for (const top of [true, false]) {
      for (let i = 0; i < 5; i++) {
        const pc = pillarCenter(i, top);
        d = Math.min(d, this.rectDist(x, y, pc.x - FLAT.pillarHalfW, pc.y - FLAT.pillarHalfH, pc.x + FLAT.pillarHalfW, pc.y + FLAT.pillarHalfH));
      }
    }
    return d;
  },

  ao(fx, fy, strength, reach, noPillars) {
    const d = this.platformDist(fx - 4, fy - 7, noPillars);
    return 1 - (strength == null ? 0.4 : strength) * Math.exp(-d / (reach || 7));
  },

  segDist(px, py, ax, ay, bx, by) {
    const vx = bx - ax;
    const vy = by - ay;
    const t = MK.clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1);
    return Math.hypot(px - ax - vx * t, py - ay - vy * t);
  },

  polyDist(px, py, pts) {
    let d = 1e9;
    for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, this.segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
    return d;
  },

  blob(fx, fy, list, wob, seed) {
    let best = -9;
    for (const b of list) {
      const v = 1 - ((fx - b[0]) / b[2]) ** 2 - ((fy - b[1]) / b[3]) ** 2;
      if (v > best) best = v;
    }
    return best + (MK.noise(fx, fy, 9, seed || 5) - 0.5) * (wob == null ? 0.5 : wob);
  },

  tallGrass(fx, fy, x, y, ramp, edge) {
    const row = Math.floor(fy / 9);
    const off = (row & 1) * 5;
    const col = Math.floor((fx + off) / 10);
    const u = fx + off - col * 10 - 5;
    const v = fy - row * 9;
    const tip = 0.5 + MK.hash(col, row, 3) * 1.5;
    const w = (v - tip) * 0.5;
    let t;
    if (v > tip && (Math.abs(u + 2.4) < w || Math.abs(u - 2.4) < w)) t = 1 - ((v - tip) / 9) * 0.6;
    else t = 0.1 + (v / 9) * 0.15;
    if (edge < 0.12) t -= 0.25;
    return MK.q(ramp, t, x, y);
  },

  grade(ctx, W, H, opts) {
    ctx.save();
    if (opts.light) {
      ctx.globalCompositeOperation = 'soft-light';
      const g = ctx.createRadialGradient(opts.light[0], opts.light[1], 0, opts.light[0], opts.light[1], opts.light[2]);
      g.addColorStop(0, opts.lightColor || 'rgba(255, 236, 190, 0.9)');
      g.addColorStop(1, 'rgba(255, 236, 190, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (opts.tint) {
      ctx.globalCompositeOperation = opts.tintMode || 'soft-light';
      ctx.fillStyle = opts.tint;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(W / 2, H * 0.52, H * (opts.vin0 || 0.38), W / 2, H * 0.52, W * (opts.vin1 || 0.62));
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, opts.vignette || 'rgba(16, 20, 34, 0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  },

  island(fx, fy, o) {
    const wob = (o.wob == null ? 4 : o.wob) * (MK.noise(fx, fy * 0.3, 18, o.seed || 3) - 0.5) * 2;
    let top = o.top + wob;
    if (fx < o.l) top += Math.pow(o.l - fx, 1.3) * (o.kl || 0.12);
    if (fx > o.r) top += Math.pow(fx - o.r, 1.3) * (o.kr || 0.12);
    if (fx > 600 && fx < 760) top = Math.min(top, -12);
    return fy > top;
  },

  fence(P, pts, step, post, colors, h) {
    const hi = colors[0];
    const lo = colors[1];
    const top = h || 7;
    for (let s = 0; s < pts.length - 1; s++) {
      const [ax, ay] = pts[s];
      const [bx, by] = pts[s + 1];
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
      for (let i = 0; i <= n; i++) {
        if (i === n && s < pts.length - 2) continue;
        const fx = ax + ((bx - ax) * i) / n;
        const fy = ay + ((by - ay) * i) / n;
        const nfx = ax + ((bx - ax) * (i + 1)) / n;
        const nfy = ay + ((by - ay) * (i + 1)) / n;
        const last = i === n;
        P.add(fx, fy, (ctx, p) => {
          if (!last) {
            const q = P.at(nfx, nfy);
            MK.line(ctx, p.x, p.y - top, q.x, q.y - top, hi);
            MK.line(ctx, p.x, p.y - top + 1, q.x, q.y - top + 1, lo);
            MK.line(ctx, p.x, p.y - top + 4, q.x, q.y - top + 4, hi);
            MK.line(ctx, p.x, p.y - top + 5, q.x, q.y - top + 5, lo);
          }
          ctx.drawImage(post, p.x - Math.floor(post.width / 2), p.y - post.height + 1);
        });
      }
    }
  }
};

const MAPS = {};

MAPS.kanto = (() => {
  const grass = R(['#3b873b', '#4d9c41', '#61b24a', '#79c655', '#98d868', '#bce783']);
  const meadow = R(['#2a6436', '#347a3a', '#468f41', '#5aa549', '#71b955', '#8fcb66']);
  const tall = R(['#143a28', '#1c522f', '#286c36', '#3a8a3e', '#58a94c', '#86cb68', '#b2e486']);
  const dirt = R(['#6a462c', '#875c38', '#a5784a', '#c0915c', '#d8b078', '#e9cf9b']);
  const stone = R(['#363847', '#4f5265', '#6b6f84', '#8b8fa2', '#adb1c1', '#d2d5df']);
  const wood = R(['#432918', '#633e26', '#845733', '#a67646', '#c69a64', '#e0bd88']);
  const red = R(['#651620', '#90222a', '#bd3733', '#de5844', '#f28a6c']);
  const white = R(['#8f96a6', '#bcc1cd', '#e0e3ea', '#fbfbf8']);
  const ink = [28, 26, 40];
  const skyR = R(['#3d8fd4', '#549fdd', '#6fb2e6', '#8dc5ee', '#acd7f3', '#cce8f7']);
  const mtnFar = R(['#93b2d2', '#a8c3de', '#bfd4e8', '#d5e3f0']);
  const mtnNear = R(['#5f84ad', '#7395bb', '#88a8c9', '#a1bcd8', '#e9f1f7']);
  const leaf = R(['#163d25', '#20562e', '#2c7237', '#409042', '#5eac51', '#88ca6a']);
  const leaf2 = R(['#1a3f2c', '#245a36', '#33774a', '#4b955a', '#6fb46d', '#9ed28a']);
  const bark = R(['#3a2416', '#563620', '#734c2e', '#8e623d']);
  const flowers = [[[236, 72, 80], [255, 140, 140]], [[255, 206, 64], [255, 240, 150]], [[248, 248, 240], [255, 255, 255]], [[240, 120, 190], [255, 180, 220]], [[130, 140, 240], [180, 190, 255]]];

  const pathY = fx => 251 + 13 * Math.sin(fx / 47) + 7 * Math.sin(fx / 19 + 2);
  const sidePaths = [
    [[52, 134], [56, 170], [48, 205], [52, pathY(52)]],
    [[735, 380], [728, 350], [740, 318], [732, pathY(732)]],
    [[690, pathY(690)], [700, 300], [690, 360], [700, 430], [690, 520]]
  ];
  const tallPatches = [[-60, 420, 70, 40], [-20, 360, 40, 26], [830, 210, 60, 34], [870, 280, 40, 26], [70, 520, 60, 26], [760, 540, 70, 30]];
  const beds = [[52, 152, 26, 7, 0], [20, 152, 10, 6, 1], [735, 402, 26, 7, 3], [790, 402, 12, 6, 1], [612, 520, 40, 10, 2], [200, 520, 40, 10, 4]];

  function grassBase(fx, fy, x, y, ramp, base, tufts) {
    let t = base + (MK.fbm(fx, fy, 70, 3, 2) - 0.5) * 0.4 + (MK.noise(fx, fy, 24, 8) - 0.5) * 0.12;
    const cx = Math.floor(fx / 10);
    const cy = Math.floor(fy / 9);
    const h = MK.hash(cx, cy, 11);
    if (h > 1 - (tufts || 0.35)) {
      const u = fx - (cx * 10 + 2 + MK.hash(cx, cy, 12) * 6);
      const v = fy - (cy * 9 + 2 + MK.hash(cx, cy, 13) * 5);
      if (Math.abs(Math.abs(u) - 1.4) < 0.75 && v > -2.8 && v < 0.3) t += v < -1.7 ? 0.25 : -0.25;
    }
    if (h > 0.993) {
      const u = fx - (cx * 10 + 5);
      const v = fy - (cy * 9 + 4);
      if (Math.abs(u) < 1.5 && Math.abs(v) < 1.5) return flowers[Math.floor(MK.hash(cx, cy, 14) * 4)][Math.abs(u) < 0.6 && Math.abs(v) < 0.6 ? 1 : 0];
    }
    return MK.q(ramp, t, x, y);
  }

  function dirtAt(fx, fy, x, y, dp, pw) {
    let t = 0.6 + (MK.fbm(fx, fy, 16, 2, 4) - 0.5) * 0.45 - Math.pow(dp / pw, 2) * 0.3;
    const pv = MK.vor(fx, fy, 6, 21);
    if (pv.d1 < 1.2 && pv.id > 0.7) t += pv.id > 0.85 ? 0.34 : -0.32;
    return MK.q(dirt, t, x, y);
  }

  function mainPath(fx, fy) {
    const pw = 12 + 4 * MK.noise(fx, 0, 34, 5);
    const dp = Math.abs(fy - pathY(fx)) + (MK.noise(fx, fy, 5, 9) - 0.5) * 5;
    return { dp, pw };
  }

  function cobble(fx, fy, x, y, cell, light) {
    const v = MK.vor(fx, fy, cell, 31, 0.8);
    if (v.edge < 1.2) return MK.q(stone, 0.06 + v.edge * 0.08, x, y);
    let t = 0.42 + v.id * 0.28 + (light || 0);
    t += -((fy - v.cy) / cell) * 0.4 - ((fx - v.cx) / cell) * 0.18;
    if (v.edge < 2.2) t += 0.1;
    if (MK.noise(fx, fy, 8, 44) > 0.76 && v.edge < 2.6) return MK.q(meadow, 0.45, x, y);
    return MK.q(stone, t, x, y);
  }

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.45, 8, true) * (1 - 0.12 * MK.smooth(0.55, 0.7, MK.fbm(fx + 50, fy * 1.3, 120, 2, 77)));
    const mp = mainPath(fx, fy);
    const pd = Math.hypot((fx - 760) / 60, (fy - 560) / 26) + (MK.noise(fx, fy, 14, 4) - 0.5) * 0.3;
    if (pd < 1) {
      if (pd > 0.86) return MK.q(R(['#6a5a44', '#8c7a5c', '#b9a77c', '#d8c89c']), 0.3 + (fy < 560 ? 0.5 : 0), x, y);
      const lily = MK.vor(fx, fy, 16, 61);
      if (lily.d1 < 4 && lily.id > 0.6) return MK.q(leaf, lily.d1 < 1 && lily.id > 0.85 ? 0.95 : 0.55, x, y);
      const wave = Math.sin(fx * 0.35 + Math.sin(fy * 0.7) * 2 + fy * 0.2);
      return MK.q(R(['#1f5f8c', '#2a76a6', '#3a90bf', '#5aaed6', '#9ad6ef']), 0.45 - pd * 0.35 + (wave > 0.85 ? 0.45 : 0), x, y);
    }
    if (mp.dp < mp.pw * 0.92) return MK.shade(dirtAt(fx, fy, x, y, mp.dp, mp.pw), ao);
    for (const sp of sidePaths) {
      const d = MapFx.polyDist(fx, fy, sp) + (MK.noise(fx, fy, 5, 3) - 0.5) * 4;
      if (d < 8) return MK.shade(dirtAt(fx, fy, x, y, d, 8), ao);
      if (d < 10) return MK.shade(MK.q(meadow, 0.2, x, y), ao);
    }
    if (mp.dp < mp.pw + 2.5) return MK.shade(MK.q(meadow, 0.2, x, y), ao);
    for (const b of beds) {
      const v = MapFx.blob(fx, fy, [b], 0.4, 17);
      if (v > 0) {
        if (v < 0.12) return MK.shade(MK.q(leaf, 0.25, x, y), ao);
        const cx = Math.floor(fx / 4);
        const cy = Math.floor(fy / 3.4);
        const u = fx - cx * 4 - 2;
        const w = fy - cy * 3.4 - 1.7;
        const pal = flowers[(b[4] + (MK.hash(cx, cy, 2) > 0.8 ? 1 : 0)) % flowers.length];
        if (Math.abs(u) < 1.3 && Math.abs(w) < 1.2) return MK.shade(pal[Math.abs(u) < 0.5 && Math.abs(w) < 0.5 ? 1 : 0], ao);
        return MK.shade(MK.q(leaf, 0.45 + (MK.hash(Math.floor(fx), Math.floor(fy), 3) - 0.5) * 0.4, x, y), ao);
      }
    }
    const tg = MapFx.blob(fx, fy, tallPatches, 0.6, 23);
    if (tg > 0) return MK.shade(MapFx.tallGrass(fx, fy, x, y, tall, tg), ao);
    const sun = MK.fbm(fx + 900, fy, 80, 2, 40);
    return MK.shade(grassBase(fx, fy, x, y, meadow, 0.42 + (sun - 0.5) * 0.5, 0.3), ao);
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      const { dp, pw } = mainPath(fx, fy);
      if (dp < pw) return dirtAt(fx, fy, x, y, dp, pw);
      const cell = MapLayout.hexCell(fx, fy);
      let base = 0.52;
      if (cell) base += (cell.r + cell.c) % 2 ? 0.07 : -0.05;
      if (dp < pw + 3) base -= 0.25;
      if (info.ey < 7 && fy < 250) base -= 0.3 * (1 - info.ey / 7);
      if (info.ex < 5) base -= 0.2 * (1 - info.ex / 5);
      return grassBase(fx, fy, x, y, grass, base, 0.3);
    }
    if (k === 'frame') {
      const { dp, pw } = mainPath(fx, fy);
      if (dp < pw) return dirtAt(fx, fy, x, y, dp, pw);
      return cobble(fx, fy, x, y, 6, 0.08 - info.d * 0.01);
    }
    if (k === 'bench') {
      const ly = info.ly;
      const edge = info.top ? ly < 3 : ly > 53;
      return cobble(fx, fy, x, y, edge ? 5 : 8, edge ? -0.2 : 0);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      if (Math.abs(lx) > 18.5 || Math.abs(ly) > 17.5) return MK.q(wood, Math.abs(ly) > 17.5 && ly > 0 ? 0 : 0.08, x, y);
      const plank = Math.floor((ly + 18) / 7);
      const pl = ly + 18 - plank * 7;
      if (pl < 1) return MK.q(wood, 0.1, x, y);
      let t = 0.5 + MK.hash(plank, info.i + (info.top ? 50 : 0), 7) * 0.2 + (MK.noise(fx * 0.25, fy * 3, 3, plank) - 0.5) * 0.3;
      if (pl < 2) t += 0.22;
      if (Math.abs(Math.abs(lx) - 15) < 1 && pl > 2.5 && pl < 4) return MK.q(stone, 0.85, x, y);
      t -= (ly + 18) / 36 * 0.2;
      return MK.q(wood, t, x, y);
    }
    if (k === 'pad') {
      const r = Math.hypot(info.lx, info.ly);
      if (r < 31) {
        if (r > 28.5) return ink;
        if (Math.abs(info.ly) < 3.2) return ink;
        if (r < 9) {
          if (r > 6.5) return ink;
          return MK.q(white, 0.95 - ((info.ly + 6) / 14) * 0.5, x, y);
        }
        const s = MK.sphere(info.lx, info.ly, -6, -8, 40);
        if (info.ly < 0) return MK.q(red, 0.2 + s * 0.9, x, y);
        return MK.q(white, 0.1 + s * 1.0, x, y);
      }
      if (r < 34) return MK.q(stone, 0.2, x, y);
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const r = Math.hypot(info.lx, info.ly * 1.15);
      if (r < 16) {
        if (r > 13.5) return MK.q(bark, 0.25 + (info.lx < 0 ? 0.25 : 0) + (MK.hash(Math.floor(fx), Math.floor(fy), 2) - 0.5) * 0.3, x, y);
        const ring = Math.sin(r * 1.5 + MK.noise(fx, fy, 4, 2) * 2);
        return MK.q(wood, 0.62 + ring * 0.12 - r / 14 * 0.15 + (info.ly < 0 ? 0.08 : 0), x, y);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function island(fx, fy) {
    const top = -9 + 3 * Math.sin(fx / 33) + 4 * MK.noise(fx, 0, 18, 3) - (fx > 600 && fx < 760 ? 8 : 0) - (fx < 150 ? (150 - fx) * 0.25 : 0);
    if (fy < top) return false;
    const side = 30 * MK.noise(0, fy, 30, 8);
    if (fx < -110 + side + Math.max(0, -fy + 40) * 0.7) return false;
    if (fx > 900 - side - Math.max(0, -fy + 40) * 0.7) return false;
    return true;
  }

  const clouds = [[30, 6, 0.9], [96, 2, 0.7], [232, 7, 1], [330, 3, 0.6], [470, 6, 0.9], [560, 2, 0.8], [622, 8, 0.9]];

  function sky(ctx, W, H) {
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MK.q(skyR, y / 44 + (MK.noise(x, y, 30, 5) - 0.5) * 0.06, x, y);
      for (const [cx, cy, s] of clouds) {
        const dx = (x - cx) / s;
        const dy = (y - cy) / s;
        let inside = false;
        let shadeY = 0;
        for (const [ox, oy, r] of [[-12, 2, 5], [-5, -1, 7], [4, -2, 8], [12, 1, 6], [0, 3, 6], [-17, 4, 3.5], [18, 4, 3.5]]) {
          const d = (dx - ox) ** 2 + (dy - oy) ** 2;
          if (d <= r * r) {
            inside = true;
            shadeY = Math.max(shadeY, 1 - (dy - oy + r) / (2 * r));
          }
        }
        if (inside) {
          if (dy > 4) c = MK.q(R(['#b7d5ee', '#d4e6f6']), 0.4 + shadeY * 0.4, x, y);
          else c = MK.q(R(['#c9def2', '#e6f0fa', '#ffffff']), 0.3 + shadeY * 0.9, x, y);
        }
      }
      const far = 8 + 9 * MK.fbm(x, 0, 30, 3, 20) - 4 * Math.exp(-((x - 170) ** 2) / 600);
      if (y > far) {
        const slope = MK.fbm(x + 1, 0, 30, 3, 20) - MK.fbm(x - 1, 0, 30, 3, 20);
        c = y < far + 2.5 && far < 12 ? [236, 243, 250] : MK.q(mtnFar, 0.75 - (y - far) / 22 + slope * 8, x, y);
      }
      const mid = 17 + 6 * MK.fbm(x + 300, 0, 26, 3, 22);
      if (y > mid) c = MK.q(R(['#4f8a8e', '#5f9c98', '#74ae9f', '#8fc0a8']), 0.7 - (y - mid) / 12 + (MK.noise(x, y, 5, 3) - 0.5) * 0.25, x, y);
      const trees = 24 + 2.5 * Math.abs(Math.sin(x * 0.45)) + 2 * MK.noise(x, 0, 7, 9);
      if (y > trees) c = MK.q(R(['#1f4a34', '#2a5e3c', '#377246', '#4a8a50']), 0.75 - (y - trees) / 6 + (MK.hash(x, y, 4) - 0.5) * 0.3, x, y);
      const bx = x - 170;
      const base = Math.round(8 + 9 * MK.fbm(170, 0, 30, 3, 20) - 4) + 6;
      const by = base - y;
      const wall = R(['#9aaec6', '#c6d3e2', '#eef2f7']);
      if (by >= 0 && by < 5 && Math.abs(bx) < 15) c = by === 4 ? [230, 234, 242] : MK.q(wall, 0.9 - ((bx + 15) / 30) * 0.6, x, y);
      if (by === 2 && Math.abs(bx) < 15 && Math.abs(bx) % 4 === 1) c = [255, 226, 140];
      if (by >= 5 && by < 11 && Math.abs(bx) < 6) c = MK.q(wall, 0.9 - ((bx + 6) / 12) * 0.6, x, y);
      if (by === 8 && Math.abs(bx) < 2) c = [255, 226, 140];
      if (by >= 11 && by < 15 && Math.abs(bx) <= 14 - by) c = by === 11 ? [150, 40, 46] : [210, 72, 64];
      if (bx === 0 && by >= 15 && by < 19) c = [90, 90, 110];
      if (by >= 17 && by < 19 && bx > 0 && bx < 4) c = [236, 80, 80];
      for (const [cx, cy] of [[300, 15], [306, 13], [430, 20], [436, 18]]) {
        if ((y === cy && Math.abs(x - cx) === 1) || (y === cy - 1 && Math.abs(x - cx) === 2)) c = [60, 70, 100];
      }
      return c;
    });
  }

  function rim(c, edge) {
    return edge === 1 ? MK.shade(c, 1.2) : c;
  }

  function cliff(k, H, fx, fy, x, y) {
    if (k <= 2) return MK.q(meadow, 0.25 - k * 0.1, x, y);
    const strata = Math.sin((y + MK.noise(x, 0, 12, 2) * 6) * 1.1);
    return MK.q(R(['#2e1e14', '#4a301f', '#654229', '#835a37', '#a07549']), 0.75 - (k / H) * 0.7 + strata * 0.1 + (MK.hash(x, y, 2) - 0.5) * 0.12, x, y);
  }

  const outline = [22, 34, 28];

  function props(P) {
    const tree = SprLib.blobTree('k-tree', 30, 40, [[15, 14, 11], [8, 19, 8], [22, 19, 8], [15, 22, 9]], leaf, [13, 26, 5, 12, bark], outline);
    const tree2 = SprLib.blobTree('k-tree2', 24, 34, [[12, 12, 9], [7, 17, 7], [17, 17, 7]], leaf2, [10, 22, 4, 11, bark], outline);
    const bush = SprLib.blobTree('k-bush', 20, 14, [[10, 8, 7, 1.3], [5, 9, 5, 1.3], [15, 9, 5, 1.3]], leaf, null, outline, { dots: [[240, 90, 90], [255, 220, 90], [255, 255, 245]] });
    const house = Spr.make('k-house', 58, 52, (x, y) => {
      const cx = 29;
      if (y >= 2 && y < 26) {
        const half = 18 + (y - 2) * 0.45;
        if (Math.abs(x - cx + 0.5) <= half) {
          const row = Math.floor((y - 2) / 4);
          const off = row % 2 ? 2 : 0;
          const tl = (x + off) % 5 === 0 || (y - 2) % 4 === 3;
          let t = 0.78 - ((y - 2) / 24) * 0.4 + (x < cx ? 0.08 : -0.1);
          if (tl) t -= 0.3;
          if (y > 23) t -= 0.4;
          return MK.q(red, t, x, y);
        }
      }
      if (x >= 40 && x < 45 && y >= 0 && y < 10) return MK.q(stone, 0.45 + (x < 42 ? 0.25 : 0) + (y < 2 ? 0.2 : 0), x, y);
      if (y >= 26 && y < 51 && x >= 8 && x < 50) {
        if (y < 28) return MK.q(wood, 0.12, x, y);
        if (x >= 24 && x < 34 && y >= 35) {
          if (x === 24 || x === 33 || y === 35) return MK.q(wood, 0.1, x, y);
          return MK.q(wood, 0.55 + (x === 31 && y === 43 ? 0.5 : 0) - (x - 24) * 0.02, x, y);
        }
        for (const wx of [12, 38]) {
          if (x >= wx && x < wx + 8 && y >= 32 && y < 40) {
            if (x === wx || x === wx + 7 || y === 32 || y === 39 || x === wx + 4 || y === 35) return [70, 58, 66];
            return (x - wx + y) % 5 === 0 ? [224, 244, 255] : [118, 182, 228];
          }
        }
        if (y >= 48) return MK.q(stone, 0.35, x, y);
        return MK.q(R(['#c4ae84', '#ddc99c', '#efe0b6', '#fbf3da']), 0.68 - ((x - 8) / 42) * 0.45 + (MK.hash(x, y, 3) - 0.5) * 0.1, x, y);
      }
      return null;
    }, { outline: [40, 26, 30] });
    const pot = Spr.make('k-pot', 14, 18, (x, y) => {
      const s = MK.sphere(x, y, 7, 12, 6);
      if (y >= 7 && s >= 0) {
        if (Math.abs(y - 12) < 1) return ink;
        if ((x - 7) ** 2 + (y - 12) ** 2 < 3) return [250, 250, 245];
        return y < 12 ? MK.q(red, 0.3 + s * 0.8, x, y) : MK.q(white, 0.2 + s * 0.9, x, y);
      }
      if (y < 8) {
        for (const [px, py, col] of [[4, 3, [255, 214, 74]], [10, 2, [255, 120, 150]], [7, 1, [250, 250, 240]]]) {
          const d = (x - px) ** 2 + (y - py) ** 2;
          if (d <= 2) return d === 0 ? [255, 236, 140] : col;
        }
        if (y > 3 && (x + y) % 3 !== 0 && x > 2 && x < 12) return MK.q(leaf, 0.5 + (x < 7 ? 0.2 : 0), x, y);
      }
      return null;
    }, { outline });
    const sign = Spr.make('k-sign', 18, 20, (x, y) => {
      if (y < 11 && x >= 1 && x < 17) {
        if (y === 0 || y === 10 || x === 1 || x === 16) return MK.q(wood, 0.1, x, y);
        if ((y === 4 || y === 7) && x > 4 && x < 14) return MK.q(wood, 0.25, x, y);
        return MK.q(wood, 0.62 - y * 0.02, x, y);
      }
      if (x >= 8 && x < 10 && y >= 11) return MK.q(wood, 0.35 + (x === 8 ? 0.15 : 0), x, y);
      return null;
    }, { outline: [40, 26, 20] });
    const mail = Spr.make('k-mail', 10, 16, (x, y) => {
      if (y < 8 && x >= 1 && x < 9) {
        if (y < 2 && (x < 2 || x > 7)) return null;
        return MK.q(red, 0.75 - x * 0.06 - (y > 5 ? 0.15 : 0), x, y);
      }
      if (x >= 4 && x < 6 && y >= 8) return MK.q(wood, 0.4, x, y);
      return null;
    }, { outline: [40, 20, 24] });
    const post = Spr.make('k-post', 3, 10, (x, y) => MK.q(R(['#7a5a3a', '#b08a5a', '#e8d4a8', '#fff6dc']), y === 0 ? 1 : 0.75 - x * 0.25, x, y), { outline: [60, 40, 28] });
    const fenceC = ['rgb(240, 226, 194)', 'rgb(146, 112, 76)'];
    const T = (fx, fy, flip, alt) => {
      P.shadow(fx + 3, fy + 2, alt ? 9 : 12, 4, 0.32);
      P.sprite(fx, fy, alt ? tree2 : tree, alt ? 12 : 15, alt ? 32 : 38, { flip });
    };
    const B = (fx, fy, flip) => {
      P.shadow(fx + 1, fy + 1, 8, 2, 0.25);
      P.sprite(fx, fy, bush, 10, 13, { flip });
    };
    P.shadow(58, 130, 28, 6, 0.32);
    P.sprite(52, 128, house, 29, 50);
    MapFx.fence(P, [[2, 162], [36, 162]], 11, post, fenceC);
    MapFx.fence(P, [[68, 162], [104, 162], [104, 96]], 11, post, fenceC);
    P.sprite(122, 214, sign, 9, 19);
    P.shadow(122, 215, 5, 2, 0.25);
    P.sprite(84, 168, mail, 5, 15);
    T(10, 64, false, true); T(-28, 100, true); T(-40, 184, false, true); T(-18, 258); T(-50, 330, true, true); T(130, 70, true, true);
    B(118, 120); B(-8, 168, true); B(140, 236);
    P.shadow(741, 382, 28, 6, 0.32);
    P.sprite(735, 380, house, 29, 50, { flip: true });
    MapFx.fence(P, [[652, 470], [652, 302], [712, 302]], 11, post, fenceC);
    MapFx.fence(P, [[758, 302], [820, 302], [820, 470]], 11, post, fenceC);
    P.sprite(760, 408, mail, 5, 15);
    T(812, 250, false, true); T(860, 330, true); T(870, 440, false, true); T(790, 492); T(680, 262, true, true);
    B(672, 448); B(704, 452, true); B(778, 316); B(700, 316, true);
    for (const [fx, fy] of [[152, 24], [640, 482], [152, 480], [156, 296], [636, 296]]) {
      P.shadow(fx, fy + 1, 5, 2, 0.28);
      P.sprite(fx, fy, pot, 7, 17);
    }
    MapFx.fence(P, [[176, -1], [616, -1]], 12, post, fenceC);
    B(156, -2); B(600, -3, true);
    T(842, 140, false, true); T(800, 60, true);
    T(-70, 420); T(-80, 500, true, true); T(10, 560); T(880, 520, true); T(840, 600, false, true); T(100, 600, true, true);
    for (const [fx, fy, r] of [[180, 306, 0], [180, 160, 1], [612, 300, 2]]) P.sprite(fx, fy, bush, 10, 13, { flip: !!r, alpha: 0 });
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [120, 30, 520], lightColor: 'rgba(255, 238, 190, 0.85)', tint: 'rgba(255, 246, 220, 0.12)', vignette: 'rgba(18, 30, 40, 0.38)' });
  }

  return { id: 'kanto', name: '관동 · 태초마을', paint, island, sky, cliff, cliffH: 16, rim, props, post, grid: 'rgba(255, 255, 255, 0.14)' };
})();

const MapSky = {
  gradient(ramp, y, H0, x, jit) {
    return MK.q(ramp, y / H0 + (MK.noise(x, y, 30, 5) - 0.5) * (jit || 0.06), x, y);
  },

  pagoda(x, y, cx, baseY, s, cols) {
    const dx = x - cx;
    const tiers = 5;
    const tierH = 9 * s;
    for (let t = 0; t < tiers; t++) {
      const yb = baseY - t * tierH;
      const bodyW = (7 - t * 0.8) * s;
      const eave = bodyW + 5 * s;
      const roofTop = yb - tierH * 0.45;
      if (y <= yb && y > roofTop) {
        if (Math.abs(dx) <= bodyW) {
          const win = Math.abs(dx) < bodyW * 0.5 && (Math.floor(dx / (2 * s)) & 1) === 0 && y > yb - tierH * 0.35;
          if (win) return cols.win;
          return dx < -bodyW + 1.5 ? cols.rim : cols.body;
        }
      }
      const ry = roofTop;
      if (y <= ry + 1 && y > ry - 3 * s) {
        const k = (ry + 1 - y) / (3 * s + 1);
        const half = eave * (1 - k * 0.65) + (k < 0.25 ? (1 - k / 0.25) * 2.2 * s : 0) * (Math.abs(dx) > eave - 3 * s ? 1 : 0);
        if (Math.abs(dx) <= half) return y >= ry ? cols.eave : dx < 0 ? cols.roofLit : cols.roof;
      }
    }
    const top = baseY - tiers * tierH - 1 * s;
    if (Math.abs(dx) < 1 && y <= top && y > top - 10 * s) return (Math.round(y) % 3 === 0) ? cols.rim : cols.body;
    return null;
  }
};

MAPS.johto = (() => {
  const plank = R(['#3a1712', '#55211a', '#702d20', '#8c3c28', '#a74f33', '#c26a45', '#d98a5e']);
  const lacquer = R(['#1a0d10', '#2c1316', '#43191b', '#5e2220', '#7a2e24']);
  const gold = R(['#6e4b16', '#9a6c1e', '#c99a2e', '#e8c45a', '#fbe7a0']);
  const slate = R(['#1c1d26', '#2a2c38', '#3a3d4c', '#4d5163', '#646a7e', '#868ca0']);
  const tatami = R(['#5e5a2e', '#77723a', '#908a48', '#aaa35a', '#c4bd76', '#dcd69a']);
  const moss = R(['#1d2a1c', '#283923', '#35492b', '#465c33', '#5b7140', '#73884f']);
  const earth = R(['#2a1d18', '#3c2a20', '#523a2a', '#6a4c36']);
  const gravel = R(['#6f6a68', '#8a8481', '#a59f9a', '#c2bbb3', '#ddd6cb']);
  const stoneL = R(['#3a3a40', '#53535b', '#6e6d74', '#8c8a8f', '#aaa7aa', '#cbc7c6']);
  const maple = R(['#4a0f14', '#6f1717', '#981f1a', '#c2321c', '#e0521f', '#f27b2c', '#f8a94a']);
  const ginkgo = R(['#5a3a0c', '#80540f', '#a87414', '#d09a1e', '#ecc23a', '#f8de78']);
  const bark = R(['#1e1214', '#30191a', '#462322', '#5c302a']);
  const leafCols = [[214, 52, 32], [240, 104, 40], [250, 168, 60], [180, 36, 30], [236, 196, 70]];
  const skyR = R(['#1b1538', '#2a1c4a', '#43235a', '#682b62', '#93365e', '#c04a52', '#e0703f', '#f39a46', '#f8c26a']);

  const treeSpots = [[60, 130], [-40, 230], [-10, 310], [-60, 390], [-30, 480], [820, 240], [760, 300], [870, 340], [850, 460], [780, 510], [700, 570]];

  function leaves(fx, fy, x, y, density) {
    const c = MK.vor(fx, fy, 5, 88, 1);
    if (c.id < 1 - density) return null;
    const ang = c.id * 9;
    const u = (fx - c.cx) * Math.cos(ang) - (fy - c.cy) * Math.sin(ang);
    const v = (fx - c.cx) * Math.sin(ang) + (fy - c.cy) * Math.cos(ang);
    if (Math.abs(u) < 1.6 && Math.abs(v) < 1.1) return MK.shade(leafCols[Math.floor(c.id * 977) % leafCols.length], 0.85 + MK.hash(c.cx | 0, c.cy | 0, 3) * 0.3);
    return null;
  }

  function planks(fx, fy, x, y, ramp, base) {
    const row = Math.floor(fy / 11);
    const ly = fy - row * 11;
    const off = MK.hash(row, 0, 41) * 60;
    const col = Math.floor((fx + off) / 62);
    const lx = fx + off - col * 62;
    if (ly < 1.1 || lx < 1) return MK.q(ramp, base - 0.42, x, y);
    let t = base + (MK.hash(col, row, 42) - 0.5) * 0.18;
    t += (MK.noise(fx * 0.12, fy * 2.4, 2, row * 7 + col) - 0.5) * 0.28;
    if (ly < 2.2) t += 0.12;
    if (ly > 9.5) t -= 0.12;
    return MK.q(ramp, t, x, y);
  }

  function tiles(fx, fy, x, y, base) {
    const row = Math.floor(fy / 7);
    const off = (row & 1) * 5;
    const col = Math.floor((fx + off) / 10);
    const u = fx + off - col * 10 - 5;
    const v = fy - row * 7;
    const arc = 7 - Math.sqrt(Math.max(0, 25 - u * u)) * 1.3;
    if (v < arc + 0.9 && v > arc - 0.2) return MK.q(slate, base - 0.35, x, y);
    let t = base + (v - arc) / 7 * -0.35 + 0.2 + (MK.hash(col, row, 6) - 0.5) * 0.15 - u / 5 * 0.08;
    return MK.q(slate, t, x, y);
  }

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.5, 9, true);
    const pd = MapFx.platformDist(fx, fy, true);
    if (pd < 30 + MK.noise(fx, fy, 20, 6) * 14) {
      const row = Math.floor(fy / 16);
      const off = (row & 1) * 12;
      const col = Math.floor((fx + off) / 24);
      const lx = fx + off - col * 24;
      const ly = fy - row * 16;
      const lf = leaves(fx, fy, x, y, 0.12 + Math.max(0, pd - 18) / 40);
      if (lf) return MK.shade(lf, ao);
      if (lx < 1.2 || ly < 1.2) return MK.shade(MK.q(moss, 0.2, x, y), ao);
      let t = 0.45 + (MK.hash(col, row, 9) - 0.5) * 0.25 - ly / 16 * 0.2 + (MK.noise(fx, fy, 4, col) - 0.5) * 0.15;
      if (ly < 2.4) t += 0.12;
      return MK.shade(MK.q(stoneL, t, x, y), ao);
    }
    const sd = MapFx.polyDist(fx, fy, [[-60, 150], [40, 200], [100, 260], [160, 258]]);
    const sd2 = MapFx.polyDist(fx, fy, [[632, 258], [700, 262], [760, 320], [800, 420], [790, 520]]);
    for (const d of [sd, sd2]) {
      if (d < 13) {
        const st = MK.vor(fx, fy, 15, 12, 0.6);
        if (st.d1 < 6.5) {
          let t = 0.55 + st.id * 0.25 - (fy - st.cy) / 6.5 * 0.35 - (fx - st.cx) / 6.5 * 0.1;
          if (st.d1 > 5.5) t -= 0.3;
          return MK.shade(MK.q(stoneL, t, x, y), ao);
        }
      }
    }
    const gv = Math.hypot((fx - 760) / 90, (fy - 160) / 70) + (MK.noise(fx, fy, 16, 2) - 0.5) * 0.15;
    if (gv < 1) {
      if (gv > 0.93) return MK.shade(MK.q(stoneL, 0.35, x, y), ao);
      const rk = [[740, 150, 10], [786, 180, 7]];
      for (const [rx, ry, rr] of rk) {
        const d = Math.hypot(fx - rx, (fy - ry) * 1.2);
        if (d < rr) return MK.shade(MK.q(stoneL, 0.35 + (1 - d / rr) * 0.4 - (fy - ry) / rr * 0.3, x, y), ao);
      }
      let ring = 1e9;
      for (const [rx, ry] of rk) ring = Math.min(ring, Math.hypot(fx - rx, (fy - ry) * 1.2));
      const line = ring < 26 ? Math.sin(ring * 1.3) : Math.sin(fy * 1.3);
      return MK.shade(MK.q(gravel, 0.55 + line * 0.18 + (MK.hash(Math.floor(fx * 2), Math.floor(fy * 2), 1) - 0.5) * 0.2, x, y), ao);
    }
    let dens = 0.08 + 0.5 * MK.smooth(0.5, 0.75, MK.fbm(fx, fy, 34, 2, 9));
    for (const [tx, ty] of treeSpots) {
      const d = Math.hypot(fx - tx, (fy - ty) * 1.4);
      if (d < 46) dens = Math.max(dens, 0.75 * (1 - d / 46) + 0.1);
    }
    const lf = leaves(fx, fy, x, y, dens);
    if (lf) return MK.shade(lf, ao);
    const n = MK.fbm(fx, fy, 50, 3, 3);
    if (n < 0.38) return MK.shade(MK.q(earth, 0.5 + (n - 0.3) * 3, x, y), ao);
    return MK.shade(MK.q(moss, 0.35 + (n - 0.5) * 0.9 + (MK.hash(Math.floor(fx / 2), Math.floor(fy / 2), 7) - 0.5) * 0.2, x, y), ao);
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      let base = 0.55;
      const cx = fx - 396;
      const cy = (fy - 251) * 1.0;
      const r = Math.hypot(cx, cy);
      if (Math.abs(r - 70) < 1.6 || Math.abs(r - 62) < 0.9) return MK.q(gold, 0.55 + (cy < 0 ? 0.2 : 0) - cx / 300, x, y);
      if (r < 62) base += 0.06;
      if (info.ey < 8) base -= 0.3 * (1 - info.ey / 8);
      if (info.ex < 6) base -= 0.25 * (1 - info.ex / 6);
      const sheen = Math.exp(-(((fx - 300) - (fy - 120) * 0.6) ** 2) / 4000) * 0.15;
      return planks(fx, fy, x, y, plank, base + sheen);
    }
    if (k === 'frame') {
      if (info.d > 8.5) return MK.q(gold, 0.5, x, y);
      return MK.q(lacquer, 0.6 - info.d * 0.03 + (MK.noise(fx, fy * 0.2, 3, 2) - 0.5) * 0.2, x, y);
    }
    if (k === 'bench') {
      const ly = info.ly;
      if (info.top ? ly > 53.5 : ly < 2.5) return MK.q(gold, 0.6, x, y);
      if (info.top ? ly < 3 : ly > 53) return MK.q(lacquer, 0.4, x, y);
      return tiles(fx, fy, x, y, 0.55);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      if (Math.abs(lx) > 18.5 || Math.abs(ly) > 17.5) {
        if (Math.abs(lx) > 19.5 || Math.abs(ly) > 18.5) return MK.q(lacquer, 0.2, x, y);
        return MK.q(R(['#16222a', '#203440', '#2d4a58']), 0.6 + ((Math.floor(lx) + Math.floor(ly)) & 1) * 0.3, x, y);
      }
      const weave = (Math.floor(fy * 1.6) & 1) ? 0.06 : -0.06;
      return MK.q(tatami, 0.6 + weave - (ly + 18) / 36 * 0.25 + (MK.noise(fx, fy, 6, info.i) - 0.5) * 0.15, x, y);
    }
    if (k === 'pad') {
      const r = Math.hypot(info.lx, info.ly);
      if (r < 33) {
        if (r > 31) return MK.q(lacquer, 0.1, x, y);
        if (r > 27.5) return MK.q(gold, 0.45 + (info.ly < 0 ? 0.3 : 0) - info.lx / 120, x, y);
        if (r > 25.5) return MK.q(lacquer, 0.2, x, y);
        const ang = Math.atan2(info.ly, info.lx);
        const rays = Math.cos(ang * 9) > 0.6 && r > 9 && r < 22;
        if (rays) return MK.q(gold, 0.35 + (1 - r / 22) * 0.4, x, y);
        if (r < 7) return MK.q(gold, 0.85 - r * 0.05, x, y);
        return MK.q(R(['#4a1416', '#6c1c1c', '#902620', '#b03426']), 0.6 - r / 26 * 0.4 + (info.ly < 0 ? 0.15 : 0), x, y);
      }
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const ax = Math.abs(info.lx);
      const ay = Math.abs(info.ly);
      if (ax < 15 && ay < 12) {
        if (ax > 13 || ay > 10) return MK.q(stoneL, 0.15, x, y);
        return MK.q(stoneL, 0.55 + (info.ly < 0 ? 0.15 : -0.05) + (MK.noise(fx, fy, 4, 3) - 0.5) * 0.3, x, y);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function island(fx, fy) {
    return MapFx.island(fx, fy, { top: -6, l: 150, r: 790, kl: 0.16, kr: 0.14, seed: 4 });
  }

  const pcols = { body: [40, 20, 34], rim: [150, 70, 60], win: [255, 196, 110], eave: [24, 12, 24], roof: [34, 20, 38], roofLit: [92, 46, 54] };

  function sky(ctx, W, H) {
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MapSky.gradient(skyR, y / 56 * 0.9 + 0.05, 1, x, 0.05);
      const sunD = Math.hypot(x - 470, (y - 30) * 1.2);
      if (sunD < 9) c = sunD < 7 ? [255, 236, 170] : [255, 206, 120];
      else if (sunD < 26) c = MK.mix(c, [255, 190, 110], (1 - sunD / 26) * 0.5);
      const cl = MK.fbm(x * 0.5, y * 2.2, 30, 3, 31);
      if (cl > 0.58 && y < 40) c = MK.mix(c, cl > 0.64 ? [255, 170, 120] : [186, 90, 110], 0.6);
      const r = Math.hypot(x - 560, (y - 60) * 1.0);
      if (r > 44 && r < 50 && y < 40) {
        const band = Math.floor((r - 44) / 1.2);
        const rb = [[230, 80, 80], [240, 160, 70], [240, 220, 90], [100, 200, 120], [90, 140, 230]][Math.min(4, band)];
        c = MK.mix(c, rb, 0.35);
      }
      const far = 16 + 8 * MK.fbm(x, 0, 36, 3, 50);
      if (y > far) c = MK.q(R(['#3a2448', '#4c2c52', '#653a5c', '#8a4d62']), 0.7 - (y - far) / 25, x, y);
      const mid = 24 + 5 * MK.fbm(x + 99, 0, 18, 3, 51) + 2 * Math.abs(Math.sin(x * 0.5));
      if (y > mid) c = MK.q(R(['#2a1424', '#3e1a2a', '#5a2230', '#7a2c32', '#a03a30']), 0.65 - (y - mid) / 10 + (MK.hash(x, y, 3) - 0.5) * 0.3, x, y);
      const valley = 34 + 4 * MK.fbm(x + 40, 0, 14, 2, 52);
      if (y > valley) {
        const treeline = MK.noise(x, y * 2, 4, 9) > 0.45;
        c = MK.q(R(['#1a0c1a', '#2a1222', '#3e1a2a', '#5a2430', '#7a3032']), 0.55 - (y - valley) / 40 + (treeline ? 0.18 : 0), x, y);
      }
      const mist = (Math.exp(-((y - 26) ** 2) / 18) * 0.35 + Math.exp(-((y - 52) ** 2) / 60) * 0.4) * MK.fbm(x, y, 24, 2, 4);
      c = MK.mix(c, [240, 160, 150], mist);
      const pg = MapSky.pagoda(x, y, 62, 74, 1.75, pcols);
      if (pg) c = pg;
      const pg2 = MapSky.pagoda(x, y, 604, 44, 0.85, { body: [52, 28, 44], rim: [130, 70, 70], win: [240, 170, 100], eave: [40, 20, 34], roof: [48, 26, 44], roofLit: [96, 52, 60] });
      if (pg2) c = pg2;
      for (const [bx, by] of [[380, 12], [386, 10], [392, 13], [300, 18]]) {
        if ((y === by && Math.abs(x - bx) === 1) || (y === by - 1 && Math.abs(x - bx) === 2)) c = [40, 20, 40];
      }
      return c;
    });
  }

  function rim(c, edge) {
    return edge === 1 ? MK.mix(c, [255, 170, 110], 0.35) : c;
  }

  function cliff(k, H, fx, fy, x, y) {
    if (k <= 2) return MK.q(moss, 0.2, x, y);
    return MK.q(R(['#140c10', '#22141a', '#331e22', '#4a2a2a', '#5f3a32']), 0.75 - (k / H) * 0.75 + Math.sin(y * 1.3 + MK.noise(x, 0, 9, 2) * 5) * 0.1, x, y);
  }

  function props(P) {
    const out = [26, 10, 14];
    const mapleT = SprLib.blobTree('j-maple', 36, 44, [[18, 15, 13], [9, 20, 9], [27, 20, 9], [18, 24, 10], [12, 10, 7], [25, 10, 7]], maple, [16, 30, 5, 13, bark], out, { dots: [[255, 210, 120], [140, 20, 24]], clump: 4 });
    const mapleS = SprLib.blobTree('j-maple2', 26, 34, [[13, 12, 10], [7, 16, 7], [19, 16, 7]], maple, [11, 22, 4, 11, bark], out, { dots: [[255, 210, 120]], clump: 4 });
    const ginkgoT = SprLib.blobTree('j-ginkgo', 28, 40, [[14, 13, 10, 0.8], [14, 22, 9, 0.9]], ginkgo, [12, 28, 4, 11, bark], [40, 24, 10], { clump: 4, dots: [[255, 246, 190]] });
    const toro = Spr.make('j-toro', 16, 28, (x, y) => {
      const cx = 7.5;
      const dx = Math.abs(x - cx);
      const lit = x < cx ? 0.2 : -0.1;
      if (y >= 24 && dx < 6) return MK.q(stoneL, 0.45 + lit, x, y);
      if (y >= 15 && y < 24 && dx < 2) return MK.q(stoneL, 0.5 + lit, x, y);
      if (y >= 13 && y < 15 && dx < 5) return MK.q(stoneL, 0.55 + lit, x, y);
      if (y >= 8 && y < 13 && dx < 4) {
        if (dx < 2 && y > 8 && y < 12) return [255, 214, 130];
        return MK.q(stoneL, 0.5 + lit, x, y);
      }
      if (y >= 4 && y < 8 && dx < 3 + (8 - y) * 1.3) return MK.q(stoneL, 0.65 + lit - (y === 7 ? 0.3 : 0), x, y);
      if (y >= 1 && y < 4 && dx < 1.5) return MK.q(stoneL, 0.6 + lit, x, y);
      return null;
    }, { outline: [20, 16, 22] });
    const lantern = Spr.make('j-lantern', 12, 34, (x, y) => {
      const cx = 5.5;
      if (x >= 5 && x < 7 && y >= 10) return MK.q(lacquer, 0.4 + (x === 5 ? 0.3 : 0), x, y);
      if (y >= 0 && y < 2 && x >= 1 && x < 11) return MK.q(lacquer, 0.3, x, y);
      const s = MK.sphere(x, y, cx, 6, 5);
      if (y >= 2 && y < 11 && Math.abs(x - cx) < 4.6 - Math.abs(y - 6.5) * 0.3) {
        if (y === 2 || y === 10) return MK.q(lacquer, 0.2, x, y);
        if (y % 3 === 0) return [196, 60, 40];
        return MK.q(R(['#c2401f', '#e46a2a', '#f8a24a', '#ffd88a']), 0.4 + (1 - Math.abs(x - cx) / 4.6) * 0.6, x, y);
      }
      return s >= 10 ? null : null;
    }, { outline: [30, 10, 12] });
    const post = Spr.make('j-post', 3, 11, (x, y) => (y < 2 ? MK.q(gold, 0.7, x, y) : MK.q(R(['#3a0e0e', '#6a1818', '#9a2620']), 0.8 - x * 0.35, x, y)), { outline: [20, 6, 8] });
    const railC = ['rgb(176, 46, 34)', 'rgb(70, 16, 16)'];
    const tree = (cv, ax, ay) => (fx, fy, flip) => {
      P.shadow(fx + 3, fy + 2, Math.round(cv.width * 0.38), 4, 0.35);
      P.sprite(fx, fy, cv, ax, ay, { flip });
    };
    const M = tree(mapleT, 18, 42);
    const Ms = tree(mapleS, 13, 32);
    const G = tree(ginkgoT, 14, 38);
    const Tr = (fx, fy) => {
      P.shadow(fx + 1, fy + 1, 6, 2, 0.35);
      P.sprite(fx, fy, toro, 8, 27);
      P.glow(fx, fy, 22, [255, 170, 80], 0.35, 18);
    };
    const L = (fx, fy) => {
      P.shadow(fx, fy + 1, 3, 1, 0.3);
      P.sprite(fx, fy, lantern, 6, 33);
      P.glow(fx, fy, 26, [255, 130, 60], 0.45, 27);
    };
    M(150, 110, true); Ms(110, 60); M(30, 160, true); Ms(5, 200); M(-80, 270, true); Ms(-40, 420); M(10, 560, true);
    M(900, 160); Ms(840, 120, true); M(720, 260, true); Ms(900, 260); M(930, 400, true); Ms(860, 560);
    M(60, 130); M(-40, 230); G(110, 190, true); Ms(-10, 310, true); M(-60, 390); G(-30, 480, true); Ms(60, 520);
    M(820, 240, true); G(760, 300); Ms(870, 340); M(850, 460, true); Ms(780, 510); G(700, 570, true);
    Tr(150, 230); Tr(150, 300); Tr(642, 300); Tr(642, 230);
    L(150, 28); L(150, 476); L(642, 476); L(612, -4); L(180, -4);
    for (const fx of [260, 340, 452, 532]) L(fx, -4);
    MapFx.fence(P, [[176, -1], [616, -1]], 14, post, railC, 8);
    MapFx.fence(P, [[650, 520], [650, 330]], 14, post, railC, 8);
    MapFx.fence(P, [[142, 520], [142, 440]], 14, post, railC, 8);
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [470, 10, 520], lightColor: 'rgba(255, 170, 110, 0.9)', tint: 'rgba(120, 60, 110, 0.18)', vignette: 'rgba(30, 10, 30, 0.55)' });
  }

  return { id: 'johto', name: '성도 · 인주시티', paint, island, sky, cliff, cliffH: 18, rim, props, post, grid: 'rgba(255, 220, 170, 0.12)' };
})();

MAPS.hoenn = (() => {
  const sand = R(['#a8875a', '#c29f6c', '#d8b884', '#e8cc98', '#f3dfb0', '#fbefcf']);
  const wet = R(['#7f6c4f', '#97815c', '#ad966c', '#c2ab80']);
  const sea = R(['#0b4f7a', '#0e6592', '#1680a8', '#22a0bf', '#3fbfcf', '#6fd8da', '#a8ecdf']);
  const foam = [240, 252, 250];
  const rope = R(['#8a6a3a', '#b8925a', '#e0c28a']);
  const wood = R(['#4a2e1c', '#6b4329', '#8c5d38', '#ad7d4e', '#c99d6a', '#e2c08e']);
  const rock = R(['#2e3a40', '#43525a', '#5b6c73', '#76898e', '#97a9aa']);
  const leaf = R(['#123a2a', '#1a5232', '#256c3a', '#368a42', '#55a84c', '#86c866']);
  const trunk = R(['#4a3220', '#6a4a2e', '#8e6a42', '#b08a5a']);
  const skyR = R(['#2f8fe0', '#43a2ea', '#5cb6f0', '#7ac8f4', '#9dd8f6', '#c4e9f7']);
  const towels = [[[226, 70, 70], [250, 246, 236]], [[46, 140, 214], [250, 246, 236]], [[250, 196, 60], [40, 170, 170]], [[240, 120, 170], [250, 246, 236]], [[60, 180, 120], [250, 230, 120]]];

  const shoreR = fy => 700 + 30 * Math.sin(fy / 40) + 14 * Math.sin(fy / 13 + 1);
  const shoreT = fx => -22 + 6 * Math.sin(fx / 37) + 4 * Math.sin(fx / 11);

  function waterAt(fx, fy, x, y, depth) {
    const wave = Math.sin(fx * 0.22 + Math.sin(fy * 0.3) * 1.6 + fy * 0.12);
    const caust = MK.vor(fx * 1.3, fy * 1.8, 9, 55).edge;
    let t = 0.75 - depth * 0.7 + (caust < 0.8 ? 0.18 : 0) + (wave > 0.9 ? 0.12 : 0);
    if (MK.hash(Math.floor(fx / 3), Math.floor(fy / 3), 77) > 0.996) return [255, 255, 255];
    return MK.q(sea, t, x, y);
  }

  function shore(fx, fy, x, y, ao) {
    const dR = fx - shoreR(fy);
    const dT = shoreT(fx) - fy;
    const d = Math.max(dR, dT * 1.6);
    if (d > 0) {
      if (d < 3 + Math.sin(fx * 0.3 + fy * 0.2) * 1.5) return foam;
      if (d > 9 && d < 11 + Math.sin(fy * 0.25 + fx * 0.1) * 2) return MK.mix(foam, [160, 220, 220], 0.4);
      return waterAt(fx, fy, x, y, MK.clamp(d / 160, 0, 1));
    }
    if (d > -10) return MK.shade(MK.q(wet, 0.5 + d / 20 + (MK.noise(fx, fy, 6, 2) - 0.5) * 0.3, x, y), ao);
    return null;
  }

  function sandAt(fx, fy, x, y, base) {
    const rip = Math.sin(fy * 0.9 + Math.sin(fx * 0.05) * 3 + MK.noise(fx, fy, 30, 3) * 4);
    let t = base + rip * 0.07 + (MK.fbm(fx, fy, 50, 3, 7) - 0.5) * 0.3;
    const h = MK.hash(Math.floor(fx / 2), Math.floor(fy / 2), 4);
    if (h > 0.985) t += 0.3;
    else if (h < 0.012) t -= 0.35;
    return MK.q(sand, t, x, y);
  }

  function shell(fx, fy) {
    const c = MK.vor(fx, fy, 38, 91, 1);
    if (c.id > 0.18) return null;
    const dx = fx - c.cx;
    const dy = fy - c.cy;
    if (c.id < 0.07) {
      const a = Math.atan2(dy, dx);
      const r = Math.hypot(dx, dy);
      const arm = 2.6 + 1.6 * Math.cos(a * 5 + c.id * 40);
      if (r < arm) return r < 1 ? [255, 200, 140] : [238, 120, 80];
    } else if (Math.hypot(dx, dy * 1.3) < 1.8) return dy < 0 ? [255, 236, 226] : [236, 184, 170];
    return null;
  }

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.35, 8, true);
    const s = shore(fx, fy, x, y, ao);
    if (s) return s;
    const rk = MK.vor(fx, fy, 60, 3, 0.7);
    if (fx < 130 && rk.id > 0.82 && rk.d1 < 9 + rk.id * 6) {
      const t = 0.5 - (fy - rk.cy) / 14 * 0.4 - (fx - rk.cx) / 14 * 0.2 + (MK.noise(fx, fy, 3, 1) - 0.5) * 0.3;
      return MK.shade(MK.q(rock, t, x, y), ao);
    }
    const sh = shell(fx, fy);
    if (sh) return MK.shade(sh, ao);
    const grassy = fx < 40 ? MK.smooth(0.45, 0.6, MK.fbm(fx, fy, 30, 3, 8) + (40 - fx) / 200) : 0;
    if (grassy > 0.5) return MK.shade(MK.q(leaf, 0.4 + (MK.hash(Math.floor(fx / 2), Math.floor(fy / 2), 3) - 0.5) * 0.5 + (grassy - 0.5), x, y), ao);
    return MK.shade(sandAt(fx, fy, x, y, 0.62), ao);
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      if (info.ex < 2.2 || info.ey < 2.2) return MK.q(R(['#d9d6cc', '#f6f4ee', '#ffffff']), info.ex < 1 || info.ey < 1 ? 0.6 : 1, x, y);
      const sh = shell(fx, fy);
      if (sh) return sh;
      const cell = MapLayout.hexCell(fx, fy);
      let base = 0.66;
      if (cell) base += (cell.r + cell.c) % 2 ? 0.05 : -0.03;
      if (info.ey < 8) base -= 0.15 * (1 - info.ey / 8);
      return sandAt(fx, fy, x, y, base);
    }
    if (k === 'frame') {
      if (info.d < 3) return MK.q(rope, 0.5 + ((Math.floor(fy / 2) & 1) ? 0.3 : -0.1), x, y);
      return sandAt(fx, fy, x, y, 0.5);
    }
    if (k === 'bench') {
      const fp = MK.vor(fx, fy, 14, 9, 0.8);
      let base = 0.52;
      if (fp.d1 < 2.6 && fp.id > 0.55) base -= 0.18;
      return sandAt(fx, fy, x, y, base);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      const tw = towels[(info.i + (info.top ? 2 : 0)) % towels.length];
      if (Math.abs(lx) > 17 || Math.abs(ly) > 18) {
        if (Math.abs(ly) > 18 && Math.abs(ly) < 19.5 && (Math.floor(lx) & 1)) return tw[1];
        return sandAt(fx, fy, x, y, 0.42);
      }
      const stripe = Math.floor((ly + 18) / 5) & 1;
      const c = stripe ? tw[0] : tw[1];
      const fold = (MK.noise(fx, fy, 10, info.i) - 0.5) * 0.18 - (ly + 18) / 36 * 0.12;
      return MK.shade(c, 0.95 + fold);
    }
    if (k === 'pad') {
      const r = Math.hypot(info.lx, info.ly);
      const ao = MapFx.ao(fx, fy, 0.3, 6, true);
      if (r < 31 && r > 15) {
        const ang = Math.atan2(info.ly, info.lx);
        const seg = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 8);
        const s = MK.sphere(r - 23, 0, -2, -2, 9);
        const base = seg % 2 ? [228, 56, 56] : [250, 248, 240];
        const lit = 0.6 + (s < 0 ? 0 : s) * 0.5 - info.ly / 120;
        if (Math.abs(r - 23) > 7) return MK.shade(base, lit * 0.8);
        return MK.shade(base, lit);
      }
      if (r <= 15) return waterAt(fx, fy, x, y, 0.1);
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const r = Math.hypot(info.lx, info.ly * 1.1);
      if (r < 15) {
        const tier = r < 7 ? 2 : r < 11 ? 1 : 0;
        let t = 0.45 + tier * 0.15 - info.ly / 40 + (MK.noise(fx, fy, 2, 1) - 0.5) * 0.25;
        if (Math.abs(r - 7) < 0.8 || Math.abs(r - 11) < 0.8) t -= 0.3;
        return MK.q(sand, t, x, y);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function island(fx, fy) {
    return fy > -44 + 3 * Math.sin(fx / 30);
  }

  function sky(ctx, W, H) {
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MapSky.gradient(skyR, y / 30, 1, x, 0.05);
      for (const [cx, cy, s] of [[60, 6, 1], [250, 3, 0.7], [420, 7, 1.1], [600, 4, 0.8]]) {
        const v = MK.fbm((x - cx) / s, (y - cy) / s * 2.4, 6, 2, cx) - Math.hypot((x - cx) / (28 * s), (y - cy) / (5 * s));
        if (v > 0.05) c = v > 0.18 ? [255, 255, 255] : [218, 236, 248];
      }
      const hz = 16;
      const vx = x - 120;
      const volc = hz - Math.max(0, 15 - Math.abs(vx) * 0.55) + (Math.abs(vx) < 5 ? 2 : 0);
      if (y > volc && y <= hz) c = MK.q(R(['#4f6a80', '#64819a', '#7a97ae', '#93afc2']), 0.4 + (vx < 0 ? 0.3 : 0) + (y - volc) * -0.02, x, y);
      const smoke = Math.hypot((x - 120 - (6 - y) * 0.8) / 7, (y - 3) / 4);
      if (y < volc && smoke < 1.4 + MK.noise(x, y, 4, 2) * 0.5) c = MK.q(R(['#9aa6b4', '#c2cad4', '#e2e8ee']), 0.9 - smoke * 0.4, x, y);
      for (const [ix, iw] of [[300, 18], [330, 9], [520, 24]]) {
        const ih = hz - Math.max(0, 4 - Math.abs(x - ix) / iw * 4);
        if (y > ih && y <= hz) c = MK.q(R(['#3f6a5a', '#56806a']), 0.5, x, y);
      }
      if (y > hz) {
        c = MK.q(sea, 0.55 + (y - hz) / 30 * -0.3 + (Math.sin(x * 0.4 + y * 2) > 0.92 ? 0.3 : 0), x, y);
        if (MK.hash(x, y, 9) > 0.985) c = [255, 255, 255];
      }
      for (const [bx, by] of [[200, 10], [208, 13], [460, 14], [470, 12]]) {
        if ((y === by && Math.abs(x - bx) <= 1) || (y === by - 1 && Math.abs(x - bx) === 2)) c = [250, 250, 250];
      }
      return c;
    });
  }

  function props(P) {
    const out = [20, 34, 28];
    const palm = SprLib.palm('h-palm', 40, 52, leaf, trunk, out, 7);
    const palm2 = SprLib.palm('h-palm2', 36, 44, leaf, trunk, out, -6);
    const umb = Spr.make('h-umb', 34, 38, (x, y) => {
      const cx = 17;
      if (y <= 12) {
        const half = 3 + y * 1.15;
        const dx = x - cx;
        if (Math.abs(dx) <= half && y >= 1) {
          const seg = Math.floor(((Math.atan2(y + 2, dx) / Math.PI) * 8)) & 1;
          const col = seg ? [236, 64, 70] : [252, 246, 236];
          return MK.shade(col, 1.05 - (dx + half) / (2 * half) * 0.3 - (y === 12 ? 0.2 : 0));
        }
      }
      if (x === 17 && y > 12 && y < 37) return [220, 220, 220];
      if (x === 16 && y > 12 && y < 37) return [150, 150, 160];
      return null;
    }, { outline: [40, 30, 36] });
    const board = (key, col) => Spr.make(key, 9, 30, (x, y) => {
      const half = 4 * Math.sin(Math.min(1, (y + 1) / 6) * Math.PI / 2) * (y > 24 ? (30 - y) / 6 : 1);
      if (Math.abs(x - 4) <= half) {
        if (Math.abs(x - 4) < 0.6) return [250, 250, 250];
        return MK.shade(col, 1.05 - (x - 4 + half) / (2 * half + 0.01) * 0.3);
      }
      return null;
    }, { outline: [30, 30, 40] });
    const b1 = board('h-board1', [250, 160, 50]);
    const b2 = board('h-board2', [60, 170, 220]);
    const ball = Spr.make('h-ball', 10, 10, (x, y) => {
      const s = MK.sphere(x, y, 4.5, 4.5, 4.5);
      if (s < 0) return null;
      const a = Math.atan2(y - 4.5, x - 4.5);
      const col = [[236, 64, 70], [252, 246, 236], [60, 140, 230], [252, 210, 60]][Math.floor(((a + Math.PI) / (Math.PI * 2)) * 4) % 4];
      return MK.shade(col, 0.55 + s * 0.6);
    }, { outline: [30, 30, 40] });
    const castle = Spr.make('h-castle', 24, 20, (x, y) => {
      const towers = [[4, 8], [19, 8], [11.5, 3]];
      for (const [tx, ty] of towers) {
        if (Math.abs(x - tx) <= 3 && y >= ty && y < 19) {
          if (y === ty && (x & 1)) return null;
          return MK.q(sand, 0.75 - (x - tx + 3) / 7 * 0.4 - (y - ty) / 30, x, y);
        }
      }
      if (y >= 11 && y < 19 && x >= 2 && x < 22) {
        if (x >= 10 && x < 14 && y >= 15) return MK.q(sand, 0.15, x, y);
        return MK.q(sand, 0.6 - (x - 2) / 20 * 0.3, x, y);
      }
      if (x === 11 && y < 3 && y >= 0) return [240, 80, 80];
      return null;
    }, { outline: [120, 90, 54] });
    const hut = Spr.make('h-hut', 50, 46, (x, y) => {
      const cx = 25;
      if (y < 20) {
        const half = 6 + y * 1.0;
        if (Math.abs(x - cx) <= half) {
          const strand = (x * 3 + y * 7) % 5 === 0;
          return MK.q(R(['#7a5a24', '#a07a34', '#c4a04a', '#e2c46c']), 0.75 - y / 20 * 0.3 + (x < cx ? 0.1 : -0.15) - (strand ? 0.2 : 0) - (y > 17 ? 0.3 : 0), x, y);
        }
      }
      if (y >= 20 && y < 45 && x >= 9 && x < 41) {
        if ((x === 10 || x === 39) && y > 20) return MK.q(wood, 0.3, x, y);
        if (x >= 19 && x < 31 && y >= 26 && y < 34) return y === 26 ? MK.q(wood, 0.2, x, y) : [40, 30, 30];
        if (y >= 34 && y < 36) return MK.q(wood, 0.7, x, y);
        return MK.q(wood, 0.55 + ((x % 4) === 0 ? -0.2 : 0) - (x - 9) / 32 * 0.2, x, y);
      }
      return null;
    }, { outline: [40, 26, 16] });
    const Palm = (fx, fy, alt, flip) => {
      P.shadow(fx + 10, fy + 2, 14, 4, 0.25);
      P.sprite(fx, fy, alt ? palm2 : palm, alt ? 18 : 20, alt ? 43 : 51, { flip });
    };
    Palm(40, 90); Palm(-10, 150, true); Palm(60, 210, false, true); Palm(-30, 290); Palm(20, 360, true, true); Palm(-40, 450); Palm(60, 520, true);
    Palm(140, -12, true);
    const shrub = SprLib.blobTree('h-shrub', 22, 16, [[11, 9, 8, 1.3], [5, 10, 5, 1.3], [17, 10, 5, 1.3]], leaf, null, out, { dots: [[236, 50, 70], [255, 120, 150], [255, 236, 120]] });
    for (const [fx, fy, f] of [[70, 40, 0], [100, 150, 1], [10, 230, 0], [70, 300, 1], [-20, 380, 0], [30, 470, 1], [40, 540, 0], [0, 110, 1]]) {
      P.shadow(fx + 1, fy + 1, 9, 2, 0.25);
      P.sprite(fx, fy, shrub, 11, 15, { flip: !!f });
    }
    const pier = Spr.make('h-pier', 1, 1, () => null);
    P.decal(760, 470, (ctx) => {
      for (let i = 0; i < 14; i++) {
        const a = P.at(735 + i * 9, 452);
        const b = P.at(735 + i * 9, 482);
        const w = Math.max(3, P.at(744 + i * 9, 452).x - a.x);
        ctx.fillStyle = i % 2 ? 'rgb(150, 104, 62)' : 'rgb(172, 124, 76)';
        ctx.fillRect(a.x, a.y, w - 1, b.y - a.y);
        ctx.fillStyle = 'rgb(96, 64, 38)';
        ctx.fillRect(a.x + w - 1, a.y, 1, b.y - a.y);
      }
      for (const px of [735, 790, 850]) for (const py of [452, 482]) {
        const q = P.at(px, py);
        ctx.fillStyle = 'rgb(70, 46, 28)';
        ctx.fillRect(q.x, q.y, 2, 4);
      }
    });
    P.shadow(-10, 74, 26, 6, 0.3);
    P.sprite(-10, 70, hut, 25, 45);
    P.shadow(700, 120, 12, 3, 0.25);
    P.sprite(690, 116, umb, 17, 37);
    P.shadow(110, 405, 12, 3, 0.25);
    P.sprite(102, 400, umb, 17, 37, { flip: true });
    P.sprite(650, 160, b1, 4, 29);
    P.sprite(660, 168, b2, 4, 29);
    P.shadow(655, 168, 8, 2, 0.25);
    P.shadow(112, 252, 5, 2, 0.25);
    P.sprite(112, 250, ball, 5, 9);
    P.shadow(660, 470, 12, 3, 0.25);
    P.sprite(660, 468, castle, 12, 19);
    P.shadow(132, 120, 12, 3, 0.25);
    P.sprite(132, 118, castle, 12, 19);
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [160, 0, 520], lightColor: 'rgba(255, 250, 220, 0.9)', tint: 'rgba(120, 220, 230, 0.1)', vignette: 'rgba(10, 40, 60, 0.32)' });
  }

  return { id: 'hoenn', name: '호연 · 해변', paint, island, sky, props, post, grid: 'rgba(140, 100, 60, 0.16)' };
})();

MAPS.sinnoh = (() => {
  const snow = R(['#6f7fa8', '#8a9cc4', '#a8b8dc', '#c4d2ec', '#dde7f6', '#f2f6fc', '#ffffff']);
  const ice = R(['#2d5a8c', '#3d74a8', '#5592c4', '#79b2dc', '#a6d2ee', '#d4ecfa']);
  const stoneB = R(['#1e2234', '#2c3148', '#3d435e', '#525a78', '#6c7594', '#8f98b4']);
  const glow = R(['#2fa6c8', '#56d0e6', '#8cf0f6', '#d2fffc']);
  const pineL = R(['#0e2430', '#14323e', '#1c4450', '#285a62', '#3a7276']);
  const bark = R(['#1a1418', '#2a2026', '#3a2c30']);
  const skyR = R(['#050816', '#08102a', '#0c1838', '#122248', '#1a2e5a', '#24406c']);

  function rune(fx, fy, cx, cy, sz, seed) {
    const u = (fx - cx) / sz;
    const v = (fy - cy) / sz;
    if (Math.abs(u) > 1 || Math.abs(v) > 1) return false;
    const segs = [[-1, -1, 1, -1], [-1, 1, 1, 1], [-1, -1, -1, 1], [1, -1, 1, 1], [0, -1, 0, 1], [-1, 0, 1, 0], [-1, -1, 1, 1], [-1, 1, 1, -1], [-1, -1, 0, 0], [1, -1, 0, 0]];
    for (let i = 0; i < segs.length; i++) {
      if (MK.hash(seed, i, 7) > 0.62) continue;
      const [a, b, c, d] = segs[i];
      if (MapFx.segDist(u, v, a * 0.8, b * 0.8, c * 0.8, d * 0.8) < 0.16) return true;
    }
    if (MK.hash(seed, 99, 7) > 0.5 && Math.abs(Math.hypot(u, v) - 0.55) < 0.12) return true;
    return false;
  }

  function snowAt(fx, fy, x, y, base) {
    const drift = MK.fbm(fx * 0.7, fy * 1.6, 46, 3, 5);
    let t = base + (drift - 0.5) * 0.4;
    const dn = MK.noise(fx, fy, 30, 2);
    const dl = MK.noise(fx - 3, fy - 4, 30, 2);
    t += (dn - dl) * 1.6;
    if (MK.hash(Math.floor(fx / 2), Math.floor(fy / 2), 8) > 0.992) return [255, 255, 255];
    return MK.q(snow, t, x, y);
  }

  function blocks(fx, fy, x, y, w, h, base, snowTop) {
    const row = Math.floor(fy / h);
    const off = (row & 1) * w * 0.5;
    const col = Math.floor((fx + off) / w);
    const lx = fx + off - col * w;
    const ly = fy - row * h;
    if (lx < 1.4 || ly < 1.4) return MK.q(stoneB, 0.05, x, y);
    let t = base + (MK.hash(col, row, 4) - 0.5) * 0.2 - ly / h * 0.25 + (MK.noise(fx, fy, 3, col) - 0.5) * 0.2;
    if (ly < 2.6) t += 0.15;
    if (snowTop && MK.noise(fx, fy, 7, row + 9) > 0.55 && ly < h * 0.5) return MK.q(snow, 0.75 + (MK.hash(Math.floor(fx), Math.floor(fy), 3) - 0.5) * 0.2, x, y);
    const cr = MK.vor(fx, fy, 9, col * 3 + row);
    if (cr.edge < 0.35 && MK.hash(col, row, 11) > 0.6) t -= 0.25;
    return MK.q(stoneB, t, x, y);
  }

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.45, 9, true);
    const ip = MapFx.blob(fx, fy, [[750, 400, 60, 30], [40, 120, 50, 26]], 0.5, 41);
    if (ip > 0) {
      const crack = MK.vor(fx, fy, 14, 3).edge < 0.6;
      return MK.shade(MK.q(ice, 0.55 + ip * 0.4 + (crack ? 0.35 : 0) + (MK.noise(fx * 0.3, fy * 2, 6, 1) - 0.5) * 0.3, x, y), ao);
    }
    if (ip > -0.12) return MK.shade(MK.q(snow, 0.85, x, y), ao);
    const rk = MK.vor(fx, fy, 90, 13, 0.7);
    if (rk.id > 0.86 && rk.d1 < 6 + rk.id * 5) {
      const ny = (fy - rk.cy) / (6 + rk.id * 5);
      const nx = (fx - rk.cx) / (6 + rk.id * 5);
      const facet = MK.vor(fx, fy, 4, 3).id;
      if (ny < -0.2 + MK.noise(fx, fy, 3, 2) * 0.3) return MK.shade(MK.q(snow, 0.8 - nx * 0.3, x, y), ao);
      return MK.shade(MK.q(stoneB, 0.5 - nx * 0.35 - ny * 0.2 + facet * 0.2, x, y), ao);
    }
    return MK.shade(snowAt(fx, fy, x, y, 0.58), ao);
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      const cx = fx - 396;
      const cy = fy - 251;
      const r = Math.hypot(cx, cy * 1.0);
      if (Math.abs(r - 92) < 1.2 || Math.abs(r - 112) < 1.2) return MK.q(glow, 0.55, x, y);
      if (r > 94 && r < 110) {
        const a = Math.atan2(cy, cx);
        const n = 22;
        const ai = Math.floor(((a + Math.PI) / (Math.PI * 2)) * n);
        const ac = (ai + 0.5) / n * Math.PI * 2 - Math.PI;
        if (rune(fx, fy, 396 + Math.cos(ac) * 102, 251 + Math.sin(ac) * 102, 5.5, ai)) return MK.q(glow, 0.8, x, y);
        return snowAt(fx, fy, x, y, 0.42);
      }
      const cell = MapLayout.hexCell(fx, fy);
      if (cell && MK.hash(cell.r, cell.c, 5) > 0.82 && r > 118) {
        const p = View.cellCenter(cell.r, cell.c);
        if (rune(fx, fy, p.x, p.y, 7, cell.r * 10 + cell.c)) return MK.q(glow, 0.45, x, y);
      }
      if (r < 20) {
        if (Math.abs(r - 18) < 1.2) return MK.q(glow, 0.6, x, y);
        if (rune(fx, fy, 396, 251, 11, 777)) return MK.q(glow, 0.9, x, y);
      }
      let base = 0.62;
      if (cell) base += (cell.r + cell.c) % 2 ? 0.04 : -0.03;
      if (info.ey < 8 && fy < 250) base -= 0.3 * (1 - info.ey / 8);
      if (info.ex < 6) base -= 0.2 * (1 - info.ex / 6);
      return snowAt(fx, fy, x, y, base);
    }
    if (k === 'frame') return blocks(fx, fy, x, y, 10, 14, 0.5, true);
    if (k === 'bench') {
      const ly = info.ly;
      if (info.top ? ly < 4 : ly > 52) return blocks(fx, fy, x, y, 12, 6, 0.3, false);
      return blocks(fx, fy, x, y, 24, 18, 0.45, true);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      if (Math.abs(lx) > 18 || Math.abs(ly) > 17) return MK.q(ice, Math.abs(ly) > 17 && ly > 0 ? 0.05 : 0.3, x, y);
      const fac = MK.vor(fx, fy, 12, info.i * 5 + (info.top ? 1 : 0), 0.9);
      let t = 0.55 + fac.id * 0.25 - (ly + 17) / 34 * 0.3 + ((fx - fac.cx) * -0.02);
      if (fac.edge < 0.6) t += 0.3;
      if (Math.abs(lx + ly * 0.7 + 4) < 2) t += 0.25;
      return MK.q(ice, t, x, y);
    }
    if (k === 'pad') {
      const r = Math.hypot(info.lx, info.ly);
      if (r < 33) {
        if (r > 30.5) return MK.q(stoneB, 0.1, x, y);
        if (r > 22 && r < 28) {
          const a = Math.atan2(info.ly, info.lx);
          const n = 10;
          const ai = Math.floor(((a + Math.PI) / (Math.PI * 2)) * n);
          const ac = (ai + 0.5) / n * Math.PI * 2 - Math.PI;
          const p = pad(info);
          if (rune(fx, fy, p.x + Math.cos(ac) * 25, p.y + Math.sin(ac) * 25, 2.6, ai + 40)) return MK.q(glow, 0.85, x, y);
        }
        if (Math.abs(r - 21) < 1 || Math.abs(r - 29) < 0.8) return MK.q(glow, 0.5, x, y);
        if (r < 10) return MK.q(glow, 0.3 + (1 - r / 10) * 0.6, x, y);
        return MK.q(stoneB, 0.55 - r / 33 * 0.3 + (info.ly < 0 ? 0.1 : 0) + (MK.noise(fx, fy, 3, 1) - 0.5) * 0.2, x, y);
      }
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const r = Math.hypot(info.lx, info.ly * 1.15);
      if (r < 15) {
        if (r > 13.2) return MK.q(stoneB, 0.15, x, y);
        const flute = Math.cos(Math.atan2(info.ly, info.lx) * 10) > 0.6 && r > 10;
        if (MK.noise(fx, fy, 5, 3) > 0.5 && r < 10) return MK.q(snow, 0.85, x, y);
        return MK.q(stoneB, 0.6 - (flute ? 0.15 : 0) + (info.ly < 0 ? 0.1 : -0.05), x, y);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function pad(info) {
    return info.top ? FLAT.padTop : FLAT.padBottom;
  }

  function island(fx, fy) {
    return MapFx.island(fx, fy, { top: -8, l: 140, r: 780, kl: 0.15, kr: 0.15, seed: 6 });
  }

  function sky(ctx, W, H) {
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MapSky.gradient(skyR, y / 90, 1, x, 0.04);
      if (MK.hash(x, y, 3) > 0.985) c = MK.mix(c, [220, 230, 255], 0.5 + MK.hash(x, y, 4) * 0.5);
      if (MK.hash(x, y, 5) > 0.9985) c = [255, 255, 255];
      for (const [base, amp, freq, col, w] of [[18, 7, 0.018, [80, 255, 170], 7], [12, 5, 0.026, [90, 220, 255], 5], [26, 6, 0.014, [170, 120, 255], 5]]) {
        const cy = base + Math.sin(x * freq + base) * amp + Math.sin(x * freq * 2.7) * amp * 0.4;
        const d = y - cy;
        if (d > -w * 2.5 && d < w) {
          const curtain = 0.5 + 0.5 * Math.sin(x * 0.35 + Math.sin(x * 0.05) * 4);
          const fall = d < 0 ? Math.exp(d / (w * 1.2)) : Math.exp(-d * d / (w * 0.8));
          const a = fall * (0.35 + curtain * 0.45) * (0.6 + MK.noise(x, 0, 20, base) * 0.6);
          c = MK.mix(c, col, Math.min(0.85, a));
        }
      }
      const peaks = 30 + 14 * MK.fbm(x, 0, 40, 3, 61) - 10 * Math.exp(-((x - 80) ** 2) / 500) - 8 * Math.exp(-((x - 590) ** 2) / 400);
      if (y > peaks) {
        const sl = MK.fbm(x + 1, 0, 40, 3, 61) - MK.fbm(x - 1, 0, 40, 3, 61);
        const lit = sl < 0;
        c = MK.q(R(['#141c36', '#1e2a4a', '#2c3c62', '#4a5e88', '#8ea4c8', '#d4e0f2']), (lit ? 0.65 : 0.35) - (y - peaks) / 40 + (y - peaks < 3 ? 0.3 : 0), x, y);
      }
      const near = 46 + 8 * MK.fbm(x + 500, 0, 22, 3, 62);
      if (y > near) c = MK.q(R(['#0c1226', '#141c36', '#1e2a4a', '#2c3c62']), 0.6 - (y - near) / 30, x, y);
      const mist = Math.exp(-((y - 44) ** 2) / 90) * 0.3;
      c = MK.mix(c, [120, 160, 220], mist);
      return c;
    });
  }

  function rim(c, edge) {
    return edge === 1 ? MK.mix(c, [200, 255, 230], 0.35) : c;
  }

  function cliff(k, H, fx, fy, x, y) {
    if (k <= 3) return MK.q(snow, 0.7 - k * 0.1, x, y);
    const facet = MK.vor(x * 1.2, y * 0.6, 6, 2);
    return MK.q(R(['#0e1428', '#18213c', '#24304e', '#344466', '#5e7aa0']), 0.75 - (k / H) * 0.7 + facet.id * 0.2 - (facet.edge < 0.5 ? 0.2 : 0), x, y);
  }

  function props(P) {
    const out = [10, 16, 26];
    const pine = SprLib.pine('s-pine', 22, 40, pineL, bark, out, snow);
    const pineS = SprLib.pine('s-pine2', 16, 30, pineL, bark, out, snow);
    const column = (key, h, broken) => Spr.make(key, 18, h, (x, y) => {
      const cx = 8.5;
      const dx = x - cx;
      const lit = dx < 0 ? 0.15 : -0.12;
      const breakY = broken ? 4 + Math.abs(Math.sin(x * 1.7)) * 4 : 0;
      if (y >= h - 4) return Math.abs(dx) < 8.5 ? MK.q(stoneB, 0.45 + lit - (y === h - 4 ? -0.2 : 0), x, y) : null;
      if (!broken && y < 4) {
        if (Math.abs(dx) < 8.5) return y === 0 ? MK.q(snow, 0.9, x, y) : MK.q(stoneB, 0.55 + lit, x, y);
        return null;
      }
      if (y >= breakY && Math.abs(dx) < 6) {
        if (broken && y < breakY + 2) return MK.q(snow, 0.85, x, y);
        const flute = Math.floor(x) % 3 === 0;
        const g = Math.abs(dx) < 1.2 && y > h * 0.3 && y < h * 0.7 && Math.floor(y / 3) % 2 === 0;
        if (g) return MK.q(glow, 0.6, x, y);
        return MK.q(stoneB, 0.55 + lit - (flute ? 0.1 : 0) + (MK.noise(x, y, 3, 1) - 0.5) * 0.15, x, y);
      }
      return null;
    }, { outline: out });
    const colT = column('s-col', 64, false);
    const colB = column('s-colb', 40, true);
    const slab = Spr.make('s-slab', 20, 30, (x, y) => {
      if (y < 2 && (x < 2 || x > 17)) return null;
      if (x < 1 || x > 18) return null;
      if (y < 3) return MK.q(snow, 0.9, x, y);
      if (x > 4 && x < 15 && y > 7 && y < 24 && (y % 4 === 0) && MK.hash(x, y, 3) > 0.3) return MK.q(glow, 0.5, x, y);
      return MK.q(stoneB, 0.6 - x / 20 * 0.35 + (MK.noise(x, y, 4, 2) - 0.5) * 0.2, x, y);
    }, { outline: out });
    const Pn = (fx, fy, small, flip) => {
      P.shadow(fx + 3, fy + 2, small ? 6 : 8, 3, 0.35);
      P.sprite(fx, fy, small ? pineS : pine, small ? 8 : 11, small ? 29 : 39, { flip });
    };
    const Col = (fx, fy, broken) => {
      P.shadow(fx + 4, fy + 2, 10, 3, 0.4);
      P.sprite(fx, fy, broken ? colB : colT, 9, broken ? 39 : 63);
      if (!broken) P.glow(fx, fy, 18, [90, 230, 255], 0.25, 30);
    };
    Col(150, 140); Col(150, 330, true); Col(642, 380); Col(642, 120, true); Col(100, 10); Col(700, 460, true); Col(40, 440);
    P.shadow(70, 260, 9, 3, 0.35);
    P.sprite(70, 258, slab, 10, 29);
    P.shadow(730, 300, 9, 3, 0.35);
    P.sprite(730, 298, slab, 10, 29, { flip: true });
    Pn(20, 60); Pn(-20, 100, true, true); Pn(40, 180, false, true); Pn(-40, 230, true); Pn(10, 330); Pn(-50, 380, true, true); Pn(30, 520, false);
    Pn(-10, 450, true);
    Pn(780, 220, false, true); Pn(820, 260, true); Pn(760, 330); Pn(850, 380, false, true); Pn(800, 470, true); Pn(860, 520); Pn(730, 540, true, true);
    Pn(800, 120); Pn(760, 60, true);
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [320, -40, 520], lightColor: 'rgba(120, 255, 200, 0.55)', tint: 'rgba(50, 80, 170, 0.32)', vignette: 'rgba(4, 8, 24, 0.6)' });
  }

  return { id: 'sinnoh', name: '신오 · 창기둥', paint, island, sky, cliff, cliffH: 22, rim, props, post, grid: 'rgba(120, 200, 255, 0.16)' };
})();

MAPS.unova = (() => {
  const steel = R(['#14161e', '#1d2029', '#272b36', '#323745', '#404656', '#535a6c', '#6e7689']);
  const steelL = R(['#2a2e38', '#3a404c', '#4e5564', '#666e7e', '#828a9a', '#a4abb8']);
  const asphalt = R(['#141519', '#1b1c21', '#23252b', '#2c2e35', '#363841']);
  const cyan = R(['#0a6a8a', '#14a0c4', '#3ad0f0', '#9af2ff', '#e6fdff']);
  const mag = R(['#7a1a6a', '#b02a94', '#e040c0', '#ff9ae8']);
  const hazard = [[240, 190, 40], [26, 26, 30]];
  const skyR = R(['#0c0a22', '#1a1236', '#2c1848', '#481e58', '#6c2660', '#963460', '#c24a58', '#e8744e']);

  function plate(fx, fy, x, y, base) {
    const cell = MapLayout.hexCell(fx, fy);
    if (!cell) return MK.q(steel, base - 0.2, x, y);
    const dark = (cell.r + cell.c) % 2 === 0;
    let t = base + (dark ? -0.12 : 0.08);
    if (cell.e < 1.6) return MK.q(steel, 0.02, x, y);
    if (cell.e < 3.2) t += cell.ly < 0 || cell.lx < 0 ? 0.22 : -0.15;
    const brush = MK.noise(fx * 3, fy * 0.2, 4, cell.r * 9 + cell.c) - 0.5;
    t += brush * 0.12;
    const rv = Math.hypot(Math.abs(cell.lx) - 17, Math.abs(cell.ly) - 10);
    if (rv < 1.6) return MK.q(steelL, 0.85, x, y);
    return MK.q(steel, t, x, y);
  }

  function diamond(fx, fy, x, y, base) {
    const u = ((fx + fy) % 8 + 8) % 8;
    const v = ((fx - fy) % 8 + 8) % 8;
    const bump = Math.abs(u - 4) < 1.2 && Math.abs(v - 4) < 3 ? 0.25 : Math.abs(u - 4) < 1.8 && Math.abs(v - 4) < 3.6 ? -0.12 : 0;
    return MK.q(steelL, base + bump + (MK.noise(fx, fy, 30, 4) - 0.5) * 0.2, x, y);
  }

  function road(fx, fy, x, y, ao) {
    let t = 0.5 + (MK.hash(Math.floor(fx * 1.5), Math.floor(fy * 1.5), 2) - 0.5) * 0.4 + (MK.fbm(fx, fy, 40, 2, 6) - 0.5) * 0.3;
    return MK.shade(MK.q(asphalt, t, x, y), ao);
  }

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.5, 9, true);
    const pd = MapFx.platformDist(fx, fy, true);
    if (pd < 20) {
      if (pd > 17) return MK.shade(MK.q(cyan, 0.5 + (MK.hash(Math.floor(fx / 6), Math.floor(fy / 6), 1) > 0.2 ? 0.2 : -0.3), x, y), ao);
      return MK.shade(diamond(fx, fy, x, y, 0.3), ao);
    }
    const sw = Math.abs(fx - 760) < 60 || fx < 30;
    if (fx > 690 && fx < 830) {
      const lx = fx - 760;
      if (Math.abs(lx) < 1.4 && (Math.floor(fy / 18) & 1)) return MK.shade([236, 190, 60], ao);
      if (Math.abs(Math.abs(lx) - 64) < 1.2) return MK.shade([220, 220, 225], ao);
      if (fy > 330 && fy < 400 && Math.abs(lx) < 62 && (Math.floor(fx / 9) & 1)) return MK.shade([214, 214, 220], ao * 0.95);
      const mh = Math.hypot(fx - 735, (fy - 200) * 1.1);
      if (mh < 9) return MK.shade(MK.q(steelL, mh > 7.5 ? 0.1 : 0.35 + ((Math.floor(fx) + Math.floor(fy)) & 1) * 0.15, x, y), ao);
      return road(fx, fy, x, y, ao);
    }
    if (fx < 40 && fx > -110) {
      const lx = fx + 35;
      if (Math.abs(lx) < 1.4 && (Math.floor(fy / 18) & 1)) return MK.shade([236, 190, 60], ao);
      if (Math.abs(Math.abs(lx) - 60) < 1.2) return MK.shade([220, 220, 225], ao);
      return road(fx, fy, x, y, ao);
    }
    const tile = (Math.floor(fx / 16) + Math.floor(fy / 12)) & 1;
    const gl = (fx % 16 + 16) % 16 < 1 || (fy % 12 + 12) % 12 < 1;
    if (gl) return MK.shade(MK.q(steelL, 0.1, x, y), ao);
    return MK.shade(MK.q(steelL, 0.38 + tile * 0.08 + (MK.noise(fx, fy, 20, 3) - 0.5) * 0.15 + (sw ? 0 : 0), x, y), ao);
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      if (info.ex < 2 || info.ey < 2) return MK.q(cyan, 0.75, x, y);
      if (info.ex < 4 || info.ey < 4) return MK.q(cyan, 0.25, x, y);
      if (Math.abs(fy - 251) < 1.1) return MK.q(mag, 0.65, x, y);
      if (Math.abs(fy - 251) < 2.6) return MK.q(mag, 0.15, x, y);
      const r = Math.hypot(fx - 396, fy - 251);
      if (Math.abs(r - 40) < 1.1) return MK.q(mag, 0.6, x, y);
      return plate(fx, fy, x, y, 0.5);
    }
    if (k === 'frame') {
      const d = info.d;
      if (d > 2 && d < 8) return hazard[Math.floor((fy + d * 2) / 6) & 1];
      return MK.q(steelL, 0.5 - (d < 2 ? 0.2 : 0), x, y);
    }
    if (k === 'bench') {
      const ly = info.ly;
      if (info.top ? ly < 3 : ly > 53) return hazard[Math.floor((fx + ly * 2) / 6) & 1];
      return diamond(fx, fy, x, y, 0.42);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      if (Math.abs(lx) > 18.5 || Math.abs(ly) > 17.5) {
        if (Math.abs(lx) > 19.5 || Math.abs(ly) > 18.5) return MK.q(steel, 0.05, x, y);
        return MK.q(cyan, 0.7, x, y);
      }
      const vent = Math.abs(ly) < 10 && ((Math.floor(fy * 1.2) & 1) === 0) && Math.abs(lx) < 12;
      return MK.q(steel, (vent ? 0.15 : 0.42) - (ly + 18) / 36 * 0.15, x, y);
    }
    if (k === 'pad') {
      const r = Math.hypot(info.lx, info.ly);
      if (r < 34) {
        const a = Math.atan2(info.ly, info.lx);
        const teeth = r > 29 && Math.cos(a * 16) > 0;
        if (r > 29) return teeth ? MK.q(steelL, 0.55 - info.lx / 100, x, y) : outer(fx, fy, x, y);
        if (r > 26.5) return MK.q(cyan, 0.75, x, y);
        if (r > 24) return MK.q(steel, 0.1, x, y);
        const spoke = Math.abs(Math.sin(a * 3)) < 0.22 && r > 8;
        if (r < 8) return MK.q(mag, 0.6 - r / 16, x, y);
        return MK.q(steelL, (spoke ? 0.6 : 0.3) - info.ly / 120, x, y);
      }
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const ax = Math.abs(info.lx);
      const ay = Math.abs(info.ly);
      if (ax < 16 && ay < 13) {
        if (ax > 14 || ay > 11) return MK.q(steel, 0.08, x, y);
        if (ay < 1.2) return MK.q(cyan, 0.6, x, y);
        return MK.q(steelL, 0.45 + (info.ly < 0 ? 0.12 : -0.05), x, y);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function island(fx, fy) {
    return MapFx.island(fx, fy, { top: -10, l: 150, r: 760, kl: 0.18, kr: 0.16, seed: 8, wob: 0 });
  }

  function sky(ctx, W, H) {
    const blds = [];
    for (let i = 0; i < 70; i++) {
      const bx = MK.hash(i, 1, 3) * 660 - 10;
      const bw = 8 + MK.hash(i, 2, 3) * 18;
      const bh = 22 + MK.hash(i, 3, 3) * 50 + (Math.abs(bx - 330) > 200 ? 20 : 0);
      blds.push([bx, bw, bh, MK.hash(i, 4, 3), i]);
    }
    blds.sort((a, b) => a[3] - b[3]);
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MapSky.gradient(skyR, y / 80, 1, x, 0.04);
      if (MK.hash(x, y, 3) > 0.995 && y < 30) c = [240, 220, 255];
      const castle = (() => {
        const cx = 600;
        const dx = x - cx;
        const towers = [[-14, 30, 3], [-6, 44, 4], [4, 52, 5], [14, 38, 3], [22, 28, 2.5]];
        for (const [ox, h, w] of towers) {
          const top = 80 - h;
          if (Math.abs(dx - ox) <= w && y >= top) return y < top + 2 ? [120, 90, 160] : (dx - ox) < 0 ? [70, 52, 100] : [48, 36, 72];
          if (y < top && y >= top - w * 3 && Math.abs(dx - ox) <= w * (1 - (top - y) / (w * 3))) return [58, 42, 86];
        }
        if (Math.abs(dx) < 26 && y > 58) return [44, 32, 66];
        return null;
      })();
      for (const [bx, bw, bh, depth, i] of blds) {
        const top = 90 - bh * (0.6 + depth * 0.4);
        if (x >= bx && x < bx + bw && y >= top) {
          const fog = 1 - depth;
          const base = MK.mix([20, 16, 40], [90, 56, 100], fog * 0.6);
          c = base;
          if (y < top + 1) c = MK.mix(base, [255, 150, 120], 0.4);
          const wx = Math.floor((x - bx) / 3);
          const wy = Math.floor((y - top) / 3);
          if ((x - bx) % 3 === 1 && (y - top) % 3 === 1 && MK.hash(wx + i * 31, wy, 7) > 0.55) c = MK.mix([255, 214, 140], [120, 230, 255], MK.hash(i, wx, 2) > 0.7 ? 1 : 0);
          if (MK.hash(i, 9, 1) > 0.7 && Math.abs(x - bx - bw / 2) < 0.6 && y < top && y > top - 6) c = [200, 60, 60];
        }
      }
      if (castle) c = castle;
      return c;
    });
  }

  function cliff(k, H, fx, fy, x, y) {
    const beam = (Math.floor(x / 6) % 3 === 0) || ((y + x) % 8 < 1.5) || ((y - x) % 8 + 8) % 8 < 1.5;
    if (k <= 2) return [236, 190, 60];
    return MK.q(steel, (beam ? 0.45 : 0.12) - (k / H) * 0.15, x, y);
  }

  function rim(c, edge) {
    return edge === 1 ? MK.q(cyan, 0.7, 0, 0) : c;
  }

  function props(P) {
    const out = [8, 8, 14];
    const lamp = Spr.make('u-lamp', 14, 46, (x, y) => {
      if (x >= 6 && x < 8 && y >= 6) return MK.q(steelL, x === 6 ? 0.7 : 0.35, x, y);
      if (y >= 3 && y < 6 && x >= 1 && x < 10) return MK.q(steelL, 0.5, x, y);
      if (y >= 6 && y < 8 && x >= 1 && x < 6) return [200, 250, 255];
      if (y >= 42 && x >= 4 && x < 10) return MK.q(steelL, 0.4, x, y);
      return null;
    }, { outline: out });
    const gear = (key, R0, n) => Spr.make(key, R0 * 2 + 4, R0 * 2 + 4, (x, y) => {
      const cx = R0 + 2;
      const cy = R0 + 2;
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const tooth = Math.cos(a * n) > 0.2;
      const outerR = R0 - (tooth ? 0 : 3);
      if (r > outerR) return null;
      if (r < R0 * 0.22) return r < R0 * 0.12 ? null : MK.q(steelL, 0.8, x, y);
      const spoke = r < R0 * 0.72 && r > R0 * 0.3 && Math.abs(Math.sin(a * 2.5)) > 0.35;
      if (spoke) return null;
      const lit = 0.5 - (dx + dy) / (R0 * 4);
      return MK.q(R(['#3a2a1a', '#6a4a24', '#9a6c2a', '#c49440', '#e8c070']), lit + (r > outerR - 1.5 ? -0.2 : 0), x, y);
    }, { outline: out });
    const g1 = gear('u-gear1', 22, 12);
    const g2 = gear('u-gear2', 14, 9);
    const stand = Spr.make('u-stand', 10, 30, (x, y) => (x > 2 && x < 7 ? MK.q(steelL, 0.3 + (x === 3 ? 0.3 : 0), x, y) : null), { outline: out });
    const cone = Spr.make('u-cone', 8, 10, (x, y) => {
      const half = 1 + y * 0.35;
      if (Math.abs(x - 3.5) <= half && y < 9) return (y === 4 || y === 5) ? [250, 250, 250] : [250, 120, 40];
      if (y === 9) return [30, 30, 30];
      return null;
    }, { outline: out });
    const L = (fx, fy, flip) => {
      P.shadow(fx, fy + 1, 4, 1, 0.4);
      P.sprite(fx, fy, lamp, 7, 45, { flip });
      P.glow(fx + (flip ? 3 : -3), fy, 34, [140, 230, 255], 0.35, 40);
      P.glow(fx + (flip ? 3 : -3), fy, 14, [140, 230, 255], 0.25, 0);
    };
    const G = (fx, fy, big) => {
      P.shadow(fx + 3, fy + 2, big ? 14 : 9, 3, 0.45);
      P.sprite(fx, fy, stand, 5, 29);
      P.sprite(fx, fy - 0.1, big ? g1 : g2, big ? 24 : 16, (big ? 24 : 16) + 26);
    };
    for (const fy of [90, 210, 330, 450]) L(838, fy, true);
    L(706, 330); L(706, 450);
    for (const fy of [100, 240, 380]) { L(30, fy, true); L(-100, fy); }
    G(100, 150, true); G(70, 190); G(110, 30); G(700, 470, true);
    for (const [fx, fy] of [[690, 250], [700, 262], [-60, 300], [150, 520]]) P.sprite(fx, fy, cone, 4, 9);
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [600, 0, 420], lightColor: 'rgba(255, 120, 160, 0.5)', tint: 'rgba(60, 40, 120, 0.25)', vignette: 'rgba(6, 4, 20, 0.55)' });
  }

  return { id: 'unova', name: '하나 · 구름시티', paint, island, sky, cliff, cliffH: 20, rim, props, post, grid: 'rgba(80, 220, 255, 0.18)' };
})();

MAPS.kalos = (() => {
  const marble = R(['#8e8a90', '#aaa6aa', '#c4c0c0', '#d9d6d2', '#ebe8e2', '#f8f6f0']);
  const marbleD = R(['#1a1c22', '#262a32', '#353a44', '#4a505c', '#636a78']);
  const gold = R(['#6a4a14', '#9a6e1e', '#c99a30', '#e8c45c', '#fbe9a4']);
  const gravel = R(['#9a8c76', '#b4a68e', '#cbbea6', '#ded3bd', '#efe6d4']);
  const lawn = R(['#2a4a24', '#36602c', '#467634', '#5a8c40', '#73a24e', '#90b860']);
  const hedge = R(['#132a1a', '#1a3a22', '#244e2c', '#306236', '#407a44']);
  const water = R(['#2a5e86', '#3a7aa4', '#5498c0', '#7cb8da', '#b4def0', '#ffffff']);
  const rose = [[200, 30, 50], [230, 60, 80], [250, 120, 140]];
  const autumn = R(['#5a2a10', '#844014', '#b0601c', '#d48a2c', '#ecb44a', '#f8d880']);
  const bark = R(['#2a1a14', '#3e2a20', '#56382a']);
  const skyR = R(['#f6d8a8', '#f4c696', '#ecb08a', '#d89a8c', '#b68a9a', '#8e7aa2']);

  function veins(fx, fy, seed) {
    const n = MK.fbm(fx, fy, 30, 3, seed);
    const v = Math.abs(Math.sin(fx * 0.04 + fy * 0.025 + n * 9));
    return v < 0.05 ? 0.35 : v < 0.12 ? 0.12 : 0;
  }

  function marbleAt(fx, fy, x, y, base, seed) {
    let t = base - veins(fx, fy, seed || 3) + (MK.fbm(fx, fy, 22, 2, 7) - 0.5) * 0.15;
    return MK.q(marble, t, x, y);
  }

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.4, 9, true);
    const pd = MapFx.platformDist(fx, fy, true);
    if (pd < 26) {
      if (pd < 3) return MK.shade(MK.q(marble, 0.3, x, y), ao);
      return MK.shade(MK.q(gravel, 0.55 + (MK.hash(Math.floor(fx * 1.3), Math.floor(fy * 1.3), 2) - 0.5) * 0.45, x, y), ao);
    }
    const beds = [[40, 110, 80, 50], [40, 380, 80, 60], [770, 330, 70, 70], [800, 100, 60, 40], [250, 590, 90, 40], [560, 590, 90, 40], [-20, 590, 70, 40], [820, 560, 60, 40]];
    for (const b of beds) {
      const ex = Math.abs(fx - b[0]) / b[2];
      const ey = Math.abs(fy - b[1]) / b[3];
      const e = Math.max(ex, ey);
      if (e < 1) {
        if (e > 0.86) return MK.shade(MK.q(hedge, 0.6 - (fy > b[1] ? 0.25 : 0) + (MK.hash(Math.floor(fx), Math.floor(fy), 4) - 0.5) * 0.3, x, y), ao);
        const rr = Math.hypot((fx - b[0]) / b[2], (fy - b[1]) / b[3]);
        if (Math.abs(rr - 0.45) < 0.09) {
          const rc = MK.vor(fx, fy, 3.2, 5, 1);
          if (rc.d1 < 1.2) return MK.shade(rose[Math.floor(rc.id * 3)], ao);
          return MK.shade(MK.q(hedge, 0.5, x, y), ao);
        }
        if (rr < 0.18) return MK.shade(MK.q(gravel, 0.7, x, y), ao);
        const stripe = (Math.floor((fx - b[0]) / 8) & 1) ? 0.07 : -0.05;
        return MK.shade(MK.q(lawn, 0.55 + stripe + (MK.fbm(fx, fy, 30, 2, 3) - 0.5) * 0.25, x, y), ao);
      }
    }
    return MK.shade(MK.q(gravel, 0.5 + (MK.hash(Math.floor(fx * 1.3), Math.floor(fy * 1.3), 2) - 0.5) * 0.4 + (MK.fbm(fx, fy, 50, 2, 5) - 0.5) * 0.2, x, y), ao);
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      const cx = fx - 396;
      const cy = fy - 251;
      const r = Math.hypot(cx, cy);
      if (r < 74) {
        if (r > 71.5 || Math.abs(r - 64) < 0.9) return MK.q(gold, 0.6 + (cy < 0 ? 0.2 : 0), x, y);
        if (r > 64) return MK.q(marbleD, 0.55 + (MK.fbm(fx, fy, 10, 2, 3) - 0.5) * 0.3, x, y);
        const a = Math.atan2(cy, cx);
        const petal = 38 + 16 * Math.abs(Math.cos(a * 4));
        if (Math.abs(r - petal) < 1) return MK.q(gold, 0.55, x, y);
        if (r < petal && r > 14) return MK.q(R(['#7a8ca4', '#98a8bc', '#b6c2d2', '#d2dae4']), 0.65 - r / petal * 0.3 - veins(fx, fy, 8) * 0.8, x, y);
        if (r <= 14) return Math.abs(r - 12) < 0.9 ? MK.q(gold, 0.7, x, y) : MK.q(gold, 0.45 + (1 - r / 14) * 0.3, x, y);
        return marbleAt(fx, fy, x, y, 0.8, 9);
      }
      const cell = MapLayout.hexCell(fx, fy);
      if (cell && cell.e < 1.2) return MK.q(gold, 0.45, x, y);
      let base = 0.7;
      if (cell) base += (cell.r + cell.c) % 2 ? 0.1 : -0.04;
      if (info.ey < 7 && fy < 250) base -= 0.25 * (1 - info.ey / 7);
      return marbleAt(fx, fy, x, y, base, cell ? cell.r * 7 + cell.c : 1);
    }
    if (k === 'frame') {
      if (info.d < 1.5 || info.d > 8.5) return MK.q(gold, 0.6, x, y);
      return MK.q(marbleD, 0.5 - veins(fx, fy, 4) + (MK.noise(fx, fy, 6, 2) - 0.5) * 0.2, x, y);
    }
    if (k === 'bench') {
      const ly = info.ly;
      if (info.top ? ly < 2 || ly > 54.5 : ly > 54 || ly < 1.5) return MK.q(gold, 0.6, x, y);
      const u = Math.floor((fx + fy) / 9);
      const v = Math.floor((fx - fy) / 9);
      const dark = (u + v) & 1;
      return dark ? MK.q(marbleD, 0.45 - veins(fx, fy, 6) * 0.5, x, y) : marbleAt(fx, fy, x, y, 0.78, 5);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      if (Math.abs(lx) > 18 || Math.abs(ly) > 17) {
        if (Math.abs(lx) > 19.5 || Math.abs(ly) > 18.5) return MK.q(marbleD, 0.2, x, y);
        return MK.q(gold, 0.55 + (ly < -16 ? 0.25 : 0), x, y);
      }
      const tuft = Math.hypot(((lx % 9) + 13.5) % 9 - 4.5, ((ly % 9) + 13.5) % 9 - 4.5) < 1;
      return MK.q(R(['#4a0e1c', '#6a1424', '#8c1c2e', '#ae2a3c', '#cc4a58']), (tuft ? 0.15 : 0.6) - (ly + 17) / 34 * 0.3 + (MK.noise(fx, fy, 8, info.i) - 0.5) * 0.15, x, y);
    }
    if (k === 'pad') {
      const r = Math.hypot(info.lx, info.ly);
      if (r < 33) {
        if (r > 30) return MK.q(gold, 0.5 + (info.ly < 0 ? 0.3 : 0), x, y);
        if (r > 24) return marbleAt(fx, fy, x, y, 0.82 - (info.ly > 0 ? 0.2 : 0) + (r > 29 ? 0.1 : 0), 2);
        if (r > 23) return MK.q(marble, 0.2, x, y);
        const rip = Math.sin(r * 1.2 - 1);
        if (r < 4) return MK.q(water, 0.95, x, y);
        return MK.q(water, 0.45 + rip * 0.15 + (info.ly < 0 ? -0.1 : 0.05) + (r < 8 ? 0.25 : 0), x, y);
      }
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const ax = Math.abs(info.lx);
      const ay = Math.abs(info.ly);
      if (ax < 16 && ay < 13) {
        if (ax > 14.5 || ay > 11.5) return MK.q(gold, 0.5, x, y);
        return marbleAt(fx, fy, x, y, 0.8 + (info.ly < 0 ? 0.08 : -0.08), 11);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function island(fx, fy) {
    return MapFx.island(fx, fy, { top: -8, l: 150, r: 780, kl: 0.14, kr: 0.14, seed: 9, wob: 2 });
  }

  function tower(x, y, cx, base, s) {
    const dx = Math.abs(x - cx);
    const h = 70 * s;
    const yy = base - y;
    if (yy < 0 || yy > h + 10 * s) return null;
    if (yy > h) return dx < 0.6 ? (yy % 2 < 1 ? [255, 240, 200] : [60, 40, 70]) : null;
    const t = yy / h;
    const half = 16 * s * Math.pow(1 - t, 1.8) + 1.2;
    if (dx > half) return null;
    if (t < 0.22) {
      const archR = 10 * s * (1 - t / 0.22);
      if (dx < archR * 0.9 && yy < 12 * s) return null;
    }
    const legs = dx > half - 2.2 || (t > 0.22 && Math.abs(dx - half * 0.5) < 0.7);
    const cross = (Math.floor(yy / 2.5) + Math.floor(dx / 2.5)) % 2 === 0;
    if (Math.abs(t - 0.22) < 0.025 || Math.abs(t - 0.5) < 0.02) return [255, 220, 150];
    if (legs || cross) return MK.mix([70, 50, 80], [120, 90, 120], t);
    return null;
  }

  function sky(ctx, W, H) {
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MapSky.gradient(skyR, 1 - y / 60, 1, x, 0.04);
      const sunD = Math.hypot(x - 140, (y - 34) * 1.2);
      if (sunD < 30) c = MK.mix(c, [255, 236, 190], (1 - sunD / 30) * 0.6);
      const cl = MK.fbm(x * 0.4, y * 2.5, 30, 3, 15);
      if (cl > 0.6 && y < 26) c = MK.mix(c, [255, 226, 200], 0.55);
      const roof = 40 - (Math.floor(x / 14) % 3 === 0 ? 6 : 3) - (x % 14 < 2 ? 2 : 0) + (MK.hash(Math.floor(x / 14), 0, 3) * 5);
      if (y > roof) {
        const win = (x % 4 === 1) && (y % 4 === 2) && y > roof + 3 && MK.hash(x, y, 5) > 0.5;
        c = win ? [255, 214, 150] : MK.q(R(['#4a3a5a', '#5c4a6a', '#725c7a', '#8a7088']), 0.6 - (y - roof) / 30 + (x % 14 < 7 ? 0.1 : 0), x, y);
      }
      const tw = tower(x, y, 520, 52, 0.9);
      if (tw) c = tw;
      return c;
    });
  }

  function rim(c, edge) {
    return edge === 1 ? MK.mix(c, [255, 230, 180], 0.4) : c;
  }

  function cliff(k, H, fx, fy, x, y) {
    if (k <= 3) return MK.q(marble, 0.7 - k * 0.12, x, y);
    const course = Math.floor(y / 4) % 2;
    return MK.q(R(['#5a4a52', '#726068', '#8c7a7e', '#a89696']), 0.6 - (k / H) * 0.5 + course * 0.1 + ((x + course * 5) % 10 < 1 ? -0.3 : 0), x, y);
  }

  function props(P) {
    const out = [20, 24, 20];
    const cone = Spr.make('ka-cone', 14, 30, (x, y) => {
      const half = (y / 26) * 6.5;
      if (y < 26 && Math.abs(x - 6.5) <= half) {
        const s = 0.6 - (x - 6.5) / (half + 1) * 0.3 + (MK.vor(x, y, 3, 2).d1 < 0.8 ? 0.15 : 0) - y / 80;
        return MK.q(hedge, s + 0.15, x, y);
      }
      if (y >= 26 && x >= 3 && x < 11) return MK.q(R(['#7a3a24', '#a4502c', '#c8704a']), 0.6 - (x - 3) / 8 * 0.4, x, y);
      return null;
    }, { outline: out });
    const ball = Spr.make('ka-ball', 16, 26, (x, y) => {
      const s = MK.sphere(x, y, 7.5, 8, 7.5);
      if (s >= 0) return MK.q(hedge, 0.2 + s * 0.85 + (MK.vor(x, y, 3, 4).d1 < 0.8 ? 0.1 : 0), x, y);
      if (x === 7 && y >= 15 && y < 20) return MK.q(bark, 0.6, x, y);
      if (y >= 20 && x >= 3 && x < 13) return MK.q(marble, 0.85 - (x - 3) / 10 * 0.4 - (y === 20 ? -0.1 : 0), x, y);
      return null;
    }, { outline: out });
    const lamp = Spr.make('ka-lamp', 12, 40, (x, y) => {
      if (x >= 5 && x < 7 && y >= 8 && y < 37) return [30, 30, 36];
      if (y >= 37 && x >= 3 && x < 9) return [26, 26, 30];
      if (y >= 2 && y < 9 && x >= 2 && x < 10 && Math.abs(x - 5.5) < 2 + (y - 2) * 0.4) return y < 4 ? [30, 30, 36] : [255, 230, 160];
      if (y < 2 && x === 5) return [30, 30, 36];
      return null;
    }, { outline: [10, 10, 14] });
    const tree = SprLib.blobTree('ka-tree', 32, 44, [[16, 15, 12, 0.9], [10, 21, 8], [22, 21, 8]], autumn, [14, 29, 5, 14, bark], [40, 20, 10], { clump: 4, dots: [[255, 240, 180]] });
    const bench = Spr.make('ka-bench', 24, 12, (x, y) => {
      if (y < 4 && x >= 1 && x < 23) return y === 1 ? [40, 30, 24] : [120, 80, 48];
      if (y >= 5 && y < 8 && x >= 0 && x < 24) return y === 5 ? [170, 120, 70] : [130, 88, 50];
      if (y >= 8 && (x === 2 || x === 21)) return [30, 30, 34];
      return null;
    }, { outline: [20, 14, 10] });
    const C = (fx, fy) => {
      P.shadow(fx + 2, fy + 1, 6, 2, 0.32);
      P.sprite(fx, fy, cone, 7, 29);
    };
    const Bl = (fx, fy) => {
      P.shadow(fx + 2, fy + 1, 7, 2, 0.32);
      P.sprite(fx, fy, ball, 8, 25);
    };
    const Lp = (fx, fy) => {
      P.shadow(fx + 1, fy + 1, 3, 1, 0.35);
      P.sprite(fx, fy, lamp, 6, 39);
      P.glow(fx, fy, 22, [255, 210, 140], 0.4, 34);
    };
    const T = (fx, fy, flip) => {
      P.shadow(fx + 3, fy + 2, 12, 4, 0.32);
      P.sprite(fx, fy, tree, 16, 42, { flip });
    };
    for (const fy of [60, 160]) { C(-40, fy); C(120, fy); }
    for (const fy of [330, 430]) { C(-40, fy); C(120, fy); }
    C(700, 260); C(840, 260); C(700, 400); C(840, 400);
    Bl(40, 60); Bl(40, 160); Bl(40, 330); Bl(40, 430); Bl(770, 260); Bl(770, 400);
    Lp(150, 24); Lp(150, 478); Lp(642, 478); Lp(150, 250); Lp(642, 250); Lp(612, -4); Lp(180, -4);
    T(-70, 240); T(-80, 520, true); T(860, 180, true); T(880, 480); T(730, 560, true); T(60, 560);
    const rb = SprLib.blobTree('ka-rose', 20, 14, [[10, 8, 7, 1.3], [5, 9, 5, 1.3], [15, 9, 5, 1.3]], hedge, null, out, { dots: [[214, 30, 50], [240, 70, 90], [250, 130, 150]] });
    for (const [fx, fy] of [[-10, 200], [90, 196], [-10, 300], [90, 304], [660, 330], [660, 470], [860, 330], [722, 180], [860, 180], [210, 520], [580, 520], [400, 530]]) {
      P.shadow(fx + 1, fy + 1, 8, 2, 0.28);
      P.sprite(fx, fy, rb, 10, 13);
    }
    P.shadow(40, 250, 10, 2, 0.3);
    P.sprite(40, 248, bench, 12, 11);
    P.shadow(770, 470, 10, 2, 0.3);
    P.sprite(770, 468, bench, 12, 11);
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [140, 20, 560], lightColor: 'rgba(255, 220, 160, 0.9)', tint: 'rgba(255, 200, 170, 0.12)', vignette: 'rgba(40, 24, 40, 0.42)' });
  }

  return { id: 'kalos', name: '칼로스 · 미림시티', paint, island, sky, cliff, cliffH: 16, rim, props, post, grid: 'rgba(150, 110, 40, 0.18)' };
})();

MAPS.alola = (() => {
  const deck = R(['#5a3420', '#7a4a2c', '#9a623a', '#b87c4a', '#d09a62', '#e4b882']);
  const sand = R(['#8a5a5a', '#a86e62', '#c88a6e', '#e0a678', '#f0c08a', '#f8d8a2']);
  const mat = R(['#8a6a3a', '#a8864c', '#c4a262', '#dcbe7e', '#eed69a']);
  const lava = R(['#1a1418', '#2a2026', '#3a2c32', '#4e3a40', '#664a4c']);
  const sea = R(['#1a1240', '#261a58', '#36246e', '#4c2e7e', '#6e3a84', '#a24a7a', '#e07a5a', '#ffd080']);
  const leaf = R(['#0e2a20', '#143a28', '#1c4e30', '#286638', '#3a8040', '#58a050']);
  const trunk = R(['#3a2418', '#5a3a26', '#7a5236', '#9a6c48']);
  const sun = R(['#c04a1a', '#e06a1e', '#f49a2a', '#fcc84a', '#fff0a0']);
  const skyR = R(['#2a1a5a', '#4a2270', '#7a2c7a', '#b03a7a', '#e05a6a', '#f4844e', '#fab048', '#fdd468']);
  const hib = [[236, 40, 70], [250, 120, 60], [255, 214, 80], [250, 250, 240]];

  function hibiscus(fx, fy, cx, cy, sz) {
    const dx = fx - cx;
    const dy = fy - cy;
    const r = Math.hypot(dx, dy) / sz;
    if (r > 1) return 0;
    const a = Math.atan2(dy, dx);
    const petal = 0.55 + 0.45 * Math.abs(Math.cos(a * 2.5));
    if (r < 0.15) return 3;
    if (r < petal) return r < petal * 0.45 ? 2 : 1;
    return 0;
  }

  function seaAt(fx, fy, x, y, depth) {
    const wave = Math.sin(fx * 0.25 + Math.sin(fy * 0.5) * 2 + fy * 0.15);
    const path = Math.exp(-(((x - 560) * 1.0) ** 2) / (300 + y * 6));
    let t = 0.42 - depth * 0.3 + (wave > 0.8 ? 0.12 : wave < -0.85 ? -0.08 : 0);
    if (path > 0.15 && (wave > 0.2 || MK.hash(x, y, 4) > 0.6)) t = 0.7 + path * 0.3;
    return MK.q(sea, t, x, y);
  }

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.45, 9, true);
    const shore = fx - (760 + 40 * Math.sin(fy / 50)) + (fy < 30 ? (30 - fy) * 2.5 : 0);
    if (shore > 0) {
      if (shore < 4) return [255, 240, 220];
      return seaAt(fx, fy, x, y, MK.clamp(shore / 200, 0, 1));
    }
    const rk = MK.vor(fx, fy, 90, 9, 0.7);
    if (fx < 80 && rk.id > 0.9 && rk.d1 < 7 + rk.id * 4) {
      const t = 0.5 - (fy - rk.cy) / 13 * 0.4 + (MK.vor(fx, fy, 3, 2).id - 0.5) * 0.3;
      return MK.shade(MK.q(lava, t, x, y), ao);
    }
    const pet = MK.vor(fx, fy, 22, 61, 1);
    if (pet.id > 0.9 && pet.d1 < 2) return MK.shade(hib[Math.floor(pet.id * 77) % 3], ao);
    const t = 0.62 + Math.sin(fy * 0.7 + MK.noise(fx, fy, 40, 2) * 6) * 0.06 + (MK.fbm(fx, fy, 50, 3, 2) - 0.5) * 0.3 + (shore > -14 ? (shore + 14) / -40 : 0);
    return MK.shade(MK.q(sand, t, x, y), ao);
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      const h = hibiscus(fx, fy, 396, 251, 74);
      const he = hibiscus(fx, fy, 396, 251, 77);
      if (he && !h) return MK.q(deck, 0.05, x, y);
      if (h === 1) return MK.q(R(['#8a2a2a', '#b23a32', '#d4523c', '#ec7450']), 0.55 + (MK.noise(fx, fy, 6, 2) - 0.5) * 0.3 - (fy - 251) / 200, x, y);
      if (h === 2) return MK.q(R(['#c8582c', '#e88438', '#f8b050']), 0.6 - Math.hypot(fx - 396, fy - 251) / 60, x, y);
      const row = Math.floor((fx + fy * 0.0) / 12);
      const lx = fx - row * 12;
      if (lx < 1) return MK.q(deck, 0.08, x, y);
      let t = 0.55 + (MK.hash(row, Math.floor((fy + MK.hash(row, 1, 2) * 90) / 90), 3) - 0.5) * 0.2 + (MK.noise(fx * 2.5, fy * 0.15, 3, row) - 0.5) * 0.25;
      if (lx < 2.2) t += 0.12;
      if (h === 3) return MK.q(sun, 0.85, x, y);
      if (info.ey < 8 && fy < 250) t -= 0.3 * (1 - info.ey / 8);
      if (info.ex < 5) t -= 0.2 * (1 - info.ex / 5);
      const warm = Math.exp(-(((fx - 600) + (fy - 100) * 0.5) ** 2) / 30000) * 0.1;
      return MK.q(deck, t + warm, x, y);
    }
    if (k === 'frame') {
      if (info.d < 3) return MK.q(R(['#6a4a24', '#9a7038', '#c89a54', '#e8c27a']), 0.5 + ((Math.floor(fy / 2.5) & 1) ? 0.25 : -0.1), x, y);
      return MK.q(R(['#4a6a20', '#6a8a2c', '#8aaa3c', '#aac458']), 0.5 + ((Math.floor(fy / 12) & 1) ? 0 : 0.15) - (info.d > 8 ? 0.2 : 0), x, y);
    }
    if (k === 'bench') {
      const pet = MK.vor(fx, fy, 12, 21, 1);
      if (pet.id > 0.86 && pet.d1 < 1.8) return hib[Math.floor(pet.id * 97) % 4];
      const row = Math.floor(info.ly / 7);
      const ly = info.ly - row * 7;
      if (ly < 1) return MK.q(deck, 0.1, x, y);
      return MK.q(deck, 0.68 + (MK.hash(row, Math.floor((fx + row * 37) / 70), 5) - 0.5) * 0.15 + (ly < 2 ? 0.12 : 0) + (MK.noise(fx * 0.15, fy * 2, 3, row) - 0.5) * 0.2, x, y);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      const r = Math.hypot(lx, ly * 1.05);
      if (r > 19) return MK.q(sand, 0.45, x, y);
      if (r > 17.5) return MK.q(mat, 0.15, x, y);
      const ring = Math.floor(r / 3) & 1;
      const weave = ((Math.floor(Math.atan2(ly, lx) * 6) + Math.floor(r / 3)) & 1) ? 0.08 : -0.08;
      return MK.q(mat, 0.6 + weave + ring * 0.05 - (ly + 18) / 36 * 0.2, x, y);
    }
    if (k === 'pad') {
      const r = Math.hypot(info.lx, info.ly);
      if (r < 33) {
        if (r > 30.5) return MK.q(lava, 0.2, x, y);
        const a = Math.atan2(info.ly, info.lx);
        if (r > 22) {
          const ray = Math.cos(a * 12) > 0.3;
          return ray ? MK.q(sun, 0.55 + (info.ly < 0 ? 0.25 : 0), x, y) : MK.q(lava, 0.45 + (info.ly < 0 ? 0.15 : 0), x, y);
        }
        if (r > 20) return MK.q(lava, 0.1, x, y);
        return MK.q(sun, 0.95 - r / 20 * 0.7 + (info.ly < 0 ? 0.1 : -0.05), x, y);
      }
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const r = Math.hypot(info.lx, info.ly * 1.15);
      if (r < 15) {
        if (r > 13) return MK.q(lava, 0.1, x, y);
        return MK.q(lava, 0.55 - info.ly / 40 + (MK.vor(fx, fy, 3, 5).id - 0.5) * 0.35, x, y);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function island(fx, fy) {
    return fy > -40 + 3 * Math.sin(fx / 25);
  }

  function sky(ctx, W, H) {
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MapSky.gradient(skyR, y / 26, 1, x, 0.05);
      const sd = Math.hypot(x - 560, (y - 19) * 1.0);
      if (sd < 12 && y < 19) c = MK.q(sun, 1 - sd / 14 + (Math.floor(y) % 3 === 0 && y > 12 ? -0.3 : 0), x, y);
      else if (sd < 46) c = MK.mix(c, [255, 200, 120], (1 - sd / 46) * 0.45);
      const cl = MK.fbm(x * 0.35, y * 2.6, 26, 3, 19);
      if (cl > 0.6 && y < 14) c = MK.mix(c, cl > 0.66 ? [255, 190, 150] : [200, 90, 120], 0.65);
      if (y >= 19) {
        const refl = Math.exp(-((x - 560) ** 2) / 160) * (Math.sin(y * 3 + x) > 0 ? 1 : 0.4);
        c = MK.q(sea, 0.35 + refl * 0.6 - (y - 19) / 40 + (Math.sin(x * 0.5 + y * 3) > 0.9 ? 0.2 : 0), x, y);
      }
      for (const [ix, iw, ih] of [[90, 50, 10], [150, 24, 6], [330, 30, 5]]) {
        const top = 19 - ih * Math.max(0, 1 - ((x - ix) / iw) ** 2);
        if (y > top && y <= 19 && Math.abs(x - ix) < iw) c = MK.q(R(['#2a1430', '#3a1c3a', '#4e2644']), 0.5 + (x < ix ? 0.2 : 0), x, y);
      }
      return c;
    });
  }

  function props(P) {
    const out = [20, 10, 14];
    const palm = SprLib.palm('a-palm', 40, 54, leaf, trunk, out, 8);
    const palm2 = SprLib.palm('a-palm2', 36, 46, leaf, trunk, out, -7);
    const torch = Spr.make('a-torch', 8, 34, (x, y) => {
      if (y < 8) {
        const f = Math.abs(x - 3.5) < 3.2 - (8 - y) * 0.35 + Math.sin(y * 2) * 0.5;
        if (f) return y < 3 ? [255, 236, 140] : y < 5 ? [255, 170, 60] : [240, 90, 30];
        return null;
      }
      if (y < 11 && x >= 1 && x < 7) return MK.q(mat, 0.5 - (y === 10 ? 0.3 : 0), x, y);
      if (x >= 3 && x < 5 && y >= 11) return MK.q(R(['#3a2410', '#6a4420', '#9a6a34']), x === 3 ? 0.8 : 0.3, x, y);
      return null;
    }, { outline: [26, 12, 8] });
    const totem = Spr.make('a-totem', 16, 44, (x, y) => {
      const cx = 7.5;
      const dx = x - cx;
      if (Math.abs(dx) > 6) return null;
      const seg = Math.floor(y / 11);
      const ly = y % 11;
      const cols = [R(['#5a2a1a', '#8a4a2a', '#b06a3a']), R(['#2a4a3a', '#3a6a4a', '#5a8a5a']), R(['#6a3a1a', '#9a5a2a', '#c87a3a']), R(['#3a2a1a', '#5a4026', '#7a5a36'])][seg % 4];
      if ((ly === 3 || ly === 4) && (Math.abs(dx - 2.5) < 1 || Math.abs(dx + 2.5) < 1)) return [250, 240, 220];
      if (ly === 4 && (Math.abs(dx - 2.5) < 0.5 || Math.abs(dx + 2.5) < 0.5)) return [20, 10, 10];
      if (ly >= 6 && ly <= 8 && Math.abs(dx) < 3) return ly === 7 ? [240, 220, 200] : [30, 14, 14];
      if (ly === 0) return MK.q(cols, 0.1, x, y);
      return MK.q(cols, 0.7 - (dx + 6) / 12 * 0.6, x, y);
    }, { outline: [20, 10, 8] });
    const flower = SprLib.blobTree('a-flower', 22, 16, [[11, 9, 8, 1.3], [5, 10, 5, 1.3], [17, 10, 5, 1.3]], leaf, null, out, { dots: [[236, 40, 70], [255, 120, 60], [255, 230, 90], [250, 250, 240]] });
    const lei = Spr.make('a-lei', 60, 40, (x, y) => {
      if ((x < 3 || x > 56) && y > 4) return MK.q(R(['#3a2410', '#6a4420', '#9a6a34']), x < 2 || x > 57 ? 0.3 : 0.7, x, y);
      const arcY = 6 + Math.sin((x / 59) * Math.PI) * -4 + 4;
      if (y < 6 && x >= 0) return y < 5 && y > 1 ? MK.q(R(['#3a2410', '#6a4420', '#9a6a34']), 0.6, x, y) : null;
      const sag = 8 + Math.sin((x / 59) * Math.PI) * 10;
      if (Math.abs(y - sag) < 2.2 && x > 2 && x < 57) return hib[Math.floor(x / 3) % 4];
      return arcY > 99 ? null : null;
    }, { outline: [30, 14, 10] });
    const Palm = (fx, fy, alt, flip) => {
      P.shadow(fx + 12, fy + 2, 14, 4, 0.3);
      P.sprite(fx, fy, alt ? palm2 : palm, alt ? 18 : 20, alt ? 45 : 53, { flip });
    };
    const Tc = (fx, fy) => {
      P.shadow(fx, fy + 1, 3, 1, 0.3);
      P.sprite(fx, fy, torch, 4, 33);
      P.glow(fx, fy, 30, [255, 140, 50], 0.5, 30);
    };
    Palm(40, 80); Palm(-20, 150, true); Palm(70, 220, false, true); Palm(-40, 300); Palm(10, 380, true, true); Palm(-50, 460); Palm(60, 540, true);
    Palm(700, 520, true, true); Palm(140, -12, true);
    Tc(150, 24); Tc(150, 478); Tc(642, 478); Tc(150, 160); Tc(150, 330); Tc(642, 330); Tc(612, -4); Tc(180, -4); Tc(396, -6);
    for (const [fx, fy] of [[100, 120], [710, 300], [40, 300]]) {
      P.shadow(fx + 2, fy + 1, 7, 2, 0.4);
      P.sprite(fx, fy, totem, 8, 43);
    }
    for (const [fx, fy, f] of [[60, 30, 0], [110, 260, 1], [20, 470, 0], [110, 420, 1], [690, 420, 0], [720, 360, 1], [-10, 200, 0], [60, 160, 1], [-30, 400, 1], [700, 200, 0], [740, 460, 1], [100, 560, 0]]) {
      P.shadow(fx + 1, fy + 1, 9, 2, 0.28);
      P.sprite(fx, fy, flower, 11, 15, { flip: !!f });
    }
    P.sprite(396, 500, lei, 30, 39, { alpha: 0 });
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [560, 10, 600], lightColor: 'rgba(255, 160, 70, 1)', tint: 'rgba(210, 90, 140, 0.22)', vignette: 'rgba(40, 8, 50, 0.55)' });
  }

  return { id: 'alola', name: '알로라 · 리조트', paint, island, sky, props, post, grid: 'rgba(255, 220, 170, 0.14)' };
})();

MAPS.galar = (() => {
  const pitch = R(['#1e5a22', '#2a7028', '#368632', '#46983c', '#5aaa48', '#74bc5a']);
  const line = [244, 246, 240];
  const track = R(['#5a1e1a', '#7a2a22', '#98382a', '#b44a34']);
  const conc = R(['#26282e', '#33363e', '#42464f', '#555a64', '#6c7280', '#8a909c']);
  const seat = R(['#0e2a5a', '#163c7a', '#20509a', '#3068b8']);
  const brass = R(['#4a2e12', '#7a5020', '#a8762e', '#d0a048', '#f0d080']);
  const skyR = R(['#04060e', '#080c1a', '#0e1428', '#161e38']);

  const crowdCols = [[230, 60, 70], [250, 210, 70], [70, 140, 240], [240, 240, 240], [120, 200, 120], [240, 140, 60], [180, 90, 220]];

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.45, 8, true);
    const pd = MapFx.platformDist(fx, fy, true);
    if (pd < 22) {
      const lane = Math.floor(pd / 5.5);
      if (pd % 5.5 < 0.7) return MK.shade(line, ao * 0.95);
      return MK.shade(MK.q(track, 0.5 + (lane & 1) * 0.08 + (MK.hash(Math.floor(fx * 2), Math.floor(fy * 2), 1) - 0.5) * 0.3, x, y), ao);
    }
    if (pd < 26) return MK.shade(MK.q(conc, 0.7, x, y), ao);
    if (pd < 40) {
      const grate = Math.hypot(((fx % 60) + 60) % 60 - 30, ((fy % 60) + 60) % 60 - 30) < 5;
      if (grate) return MK.shade(MK.q(conc, ((Math.floor(fx) + Math.floor(fy)) & 1) ? 0.1 : 0.35, x, y), ao);
      return MK.shade(MK.q(conc, 0.45 + (MK.fbm(fx, fy, 30, 2, 3) - 0.5) * 0.2, x, y), ao);
    }
    if (pd < 44) return MK.shade(MK.q(conc, pd < 41.5 ? 0.85 : 0.15, x, y), ao);
    const dxp = Math.max(160 - fx, fx - 632, 0);
    const dyp = Math.max(2 - fy, fy - 500, 0);
    const side = dxp > dyp;
    const rowH = side ? 8 : 9;
    const row = Math.floor((pd - 44) / rowH);
    const ry = pd - 44 - row * rowH;
    const lit = 1 - Math.min(0.5, row * 0.035);
    if (ry < 1.6) return MK.shade(MK.q(conc, 0.25, x, y), lit);
    const along = side ? fy * 1.4 : fx;
    const sect = Math.floor(along / 110);
    const aisle = ((along % 110) + 110) % 110 < 5;
    if (aisle) return MK.shade(MK.q(conc, 0.5 + (ry < 4 ? 0.1 : 0), x, y), lit);
    const sc = Math.floor(along / 4);
    const h = MK.hash(sc, row, 13);
    const seatCol = [[150, 30, 40], [24, 56, 130]][sect & 1];
    const full = MK.noise(along, row * 30, 60, 4) * 0.5 + 0.55;
    if (h < full) {
      if (ry < rowH * 0.45) return MK.shade(MK.mix([226, 186, 150], [100, 64, 46], MK.hash(sc, row, 2)), lit * 0.92);
      const cc = MK.hash(sect, 0, 9) > 0.5 && MK.hash(sc, row, 8) > 0.35 ? seatCol.map(v => Math.min(255, v * 1.6)) : crowdCols[Math.floor(h * 700) % crowdCols.length];
      return MK.shade(cc, lit * 0.8);
    }
    return MK.shade(seatCol, lit * (ry < rowH * 0.5 ? 0.95 : 0.7));
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      const F = FLAT.field;
      const cx = fx - 396;
      const cy = fy - 251;
      const r = Math.hypot(cx, cy);
      if (info.ex < 2 || info.ey < 2) return line;
      if (Math.abs(cy) < 1.1 && r > 4) return line;
      if (Math.abs(r - 46) < 1.1) return line;
      if (r < 30) {
        if (r > 27.5) return [30, 30, 36];
        if (Math.abs(cy) < 3.2) return [30, 30, 36];
        if (r < 9) return r > 6.5 ? [30, 30, 36] : [244, 244, 240];
        return cy < 0 ? MK.q(R(['#a01e22', '#c8302c', '#e44a3a']), 0.6 - cy / 60, x, y) : MK.q(R(['#c4c8d0', '#e6e8ec', '#ffffff']), 0.7 - cy / 60, x, y);
      }
      for (const top of [true, false]) {
        const by = top ? F.y0 : F.y1;
        const bx = Math.abs(fx - 396);
        const dy = Math.abs(fy - by);
        if ((Math.abs(bx - 90) < 1.1 && dy < 56) || (bx < 90 && Math.abs(dy - 56) < 1.1)) return line;
        if ((Math.abs(bx - 40) < 1.1 && dy < 22) || (bx < 40 && Math.abs(dy - 22) < 1.1)) return line;
      }
      const stripe = Math.floor((fx - F.x0) / 31.4) & 1;
      let t = 0.55 + (stripe ? 0.12 : -0.06) + (MK.noise(fx, fy, 8, 3) - 0.5) * 0.1;
      const lit = Math.max(Math.exp(-(((fx - 200) ** 2) + ((fy - 80) ** 2)) / 30000), Math.exp(-(((fx - 600) ** 2) + ((fy - 80) ** 2)) / 30000));
      t += lit * 0.12;
      return MK.q(pitch, t, x, y);
    }
    if (k === 'frame') {
      const seg = Math.floor(fy / 40);
      const ly = ((fy % 40) + 40) % 40;
      if (info.d > 8.5 || info.d < 1) return MK.q(conc, 0.2, x, y);
      const adCols = [[230, 40, 60], [40, 120, 230], [250, 200, 40], [140, 60, 200]];
      const ac = adCols[seg % 4];
      const glyph = ly > 6 && ly < 34 && info.d > 3 && info.d < 6.5 && MK.hash(Math.floor(ly / 3), seg, 4) > 0.45;
      return glyph ? [250, 250, 250] : MK.shade(ac, 0.6 + (MK.hash(Math.floor(ly), seg, 2) > 0.95 ? 0.4 : 0));
    }
    if (k === 'bench') {
      const ly = info.ly;
      const inner = info.top ? ly > 50 : ly < 6;
      if (inner) {
        const seg = Math.floor(fx / 50);
        const adCols = [[230, 40, 60], [40, 120, 230], [250, 200, 40], [140, 60, 200]];
        const lx = ((fx % 50) + 50) % 50;
        const glyph = lx > 5 && lx < 45 && MK.hash(Math.floor(lx / 3), seg, 4) > 0.45 && Math.abs((info.top ? ly - 53 : ly - 3)) < 1.5;
        return glyph ? [250, 250, 250] : MK.shade(adCols[seg % 4], 0.62);
      }
      return MK.q(conc, 0.45 + (MK.noise(fx, fy, 12, 3) - 0.5) * 0.2, x, y);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      if (Math.abs(lx) > 18.5 || Math.abs(ly) > 17.5) return MK.q(conc, 0.15, x, y);
      const rowS = Math.floor((ly + 17.5) / 11.7);
      const ry = ly + 17.5 - rowS * 11.7;
      if (ry < 2) return MK.q(conc, 0.25, x, y);
      const colS = Math.floor((lx + 18.5) / 9.25);
      const rx = lx + 18.5 - colS * 9.25;
      if (rx < 1) return MK.q(seat, 0.05, x, y);
      return MK.q(seat, 0.75 - ry / 11.7 * 0.5 + (rx < 2.5 ? 0.15 : 0), x, y);
    }
    if (k === 'pad') {
      const r = Math.hypot(info.lx, info.ly);
      if (r < 33) {
        if (r > 30.5) return MK.q(brass, 0.4 + (info.ly < 0 ? 0.3 : 0), x, y);
        if (r > 27) return [24, 24, 30];
        const a = Math.atan2(info.ly, info.lx);
        const crown = r > 10 && r < 22 && Math.cos(a * 5) > 0.55;
        if (crown) return MK.q(brass, 0.85 - r / 40, x, y);
        if (r < 8) return MK.q(R(['#a01e22', '#d03a2c', '#f06a4a']), 0.8 - r / 10, x, y);
        return MK.q(R(['#1a1a40', '#24245a', '#303078']), 0.5 - info.ly / 80, x, y);
      }
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const ax = Math.abs(info.lx);
      const ay = Math.abs(info.ly);
      if (ax < 16 && ay < 13) {
        if (ax > 14 || ay > 11) return MK.q(brass, 0.3, x, y);
        return MK.q(conc, 0.6 + (info.ly < 0 ? 0.1 : -0.08) + ((Math.floor(fx + fy) & 3) === 0 ? -0.1 : 0), x, y);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function island(fx, fy) {
    return fy > -26;
  }

  function sky(ctx, W, H) {
    const crowdCols = [[230, 60, 70], [250, 210, 70], [70, 140, 240], [240, 240, 240], [120, 200, 120], [240, 140, 60], [180, 90, 220]];
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MapSky.gradient(skyR, y / 20, 1, x, 0.03);
      const roofY = 8 + Math.abs(Math.sin(x / 90)) * 2;
      if (y < roofY) {
        const truss = (x % 12 < 1) || ((x + y * 2) % 12 < 1);
        return truss ? [60, 66, 80] : MK.q(conc, 0.15, x, y);
      }
      const tier = Math.floor((y - roofY) / 3.2);
      const ty = (y - roofY) - tier * 3.2;
      if (ty < 0.8) return MK.q(conc, 0.35, x, y);
      const col = Math.floor(x / 2);
      const h = MK.hash(col, tier, 13);
      if (h > 0.18) {
        const cc = crowdCols[Math.floor(h * 700) % crowdCols.length];
        const head = ty < 1.8;
        c = head ? MK.mix([240, 200, 170], [120, 80, 60], MK.hash(col, tier, 2)) : MK.shade(cc, 0.7 + MK.hash(col, tier, 5) * 0.3);
      } else c = MK.q(seat, 0.4, x, y);
      if (MK.hash(x, y, 77) > 0.996) c = [255, 255, 255];
      const scr = x > 230 && x < 410 && y > roofY + 1 && y < roofY + 19;
      if (scr) {
        const ex = x - 230;
        const ey = y - roofY - 1;
        if (ex < 1 || ex > 178 || ey < 1 || ey > 16.5) return [40, 40, 50];
        const ball = Math.hypot(ex - 90, (ey - 9) * 1.3);
        if (ball < 7) return ball > 6 ? [20, 20, 24] : Math.abs(ey - 9) < 0.8 ? [20, 20, 24] : ey < 9 ? [230, 50, 50] : [240, 240, 240];
        const txt = ((ex > 20 && ex < 70) || (ex > 110 && ex < 160)) && ey > 6 && ey < 12 && MK.hash(Math.floor(ex / 2), Math.floor(ey / 2), 3) > 0.35;
        return txt ? [255, 230, 120] : MK.q(R(['#081830', '#0c2448', '#123060']), 0.6 + Math.sin(ex * 0.1) * 0.2, x, y);
      }
      return c;
    });
  }

  function props(P) {
    const out = [10, 10, 14];
    const tower = Spr.make('g-light', 20, 60, (x, y) => {
      if (y < 12 && x >= 1 && x < 19) {
        if (y < 1 || y > 10 || x < 2 || x > 17) return [40, 44, 54];
        return ((x - 2) % 4 < 3 && (y - 1) % 3 < 2) ? [255, 252, 230] : [60, 66, 80];
      }
      if (x >= 8 && x < 12 && y >= 12) return MK.q(conc, x < 10 ? 0.6 : 0.3, x, y);
      if (y >= 12 && ((x + y) % 6 < 1) && x > 6 && x < 14) return [70, 76, 90];
      return null;
    }, { outline: out });
    const pipe = Spr.make('g-pipe', 16, 34, (x, y) => {
      const dx = Math.abs(x - 7.5);
      if (dx < 5 && y > 6) return MK.q(brass, 0.8 - (x - 2.5) / 10 * 0.6 + (y % 8 < 1 ? -0.3 : 0), x, y);
      if (dx < 6.5 && y > 3 && y <= 6) return MK.q(brass, 0.6, x, y);
      return null;
    }, { outline: [30, 18, 8] });
    const L = (fx, fy) => {
      P.shadow(fx + 2, fy + 1, 6, 2, 0.4);
      P.sprite(fx, fy, tower, 10, 59);
      P.glow(fx, fy, 60, [255, 250, 220], 0.35, 54);
    };
    L(150, -8); L(642, -8); L(110, 250); L(700, 300); L(150, 530); L(642, 540);
    for (const [fx, fy] of [[118, 130], [118, 440], [690, 120], [700, 440]]) {
      P.shadow(fx + 2, fy + 1, 7, 2, 0.4);
      P.sprite(fx, fy, pipe, 8, 33);
      P.glow(fx, fy, 22, [220, 220, 230], 0.25, 40);
      for (let i = 0; i < 4; i++) P.glow(fx + i * 3, fy, 10 + i * 3, [200, 200, 210], 0.18, 40 + i * 9);
    }
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [320, 120, 420], lightColor: 'rgba(255, 255, 235, 0.6)', tint: 'rgba(40, 60, 120, 0.18)', vignette: 'rgba(0, 4, 16, 0.6)' });
  }

  return { id: 'galar', name: '가라르 · 슛스타디움', paint, island, sky, props, post, grid: 'rgba(255, 255, 255, 0.10)' };
})();

MAPS.paldea = (() => {
  const crys = R(['#1a0e3a', '#2a1660', '#3e2290', '#5a36b8', '#7a5ad8', '#9a86ec', '#c4b8f8', '#ecf0ff']);
  const crysC = R(['#082a40', '#0c4060', '#14608a', '#2088b0', '#40b0d0', '#80d8ec', '#c8f4ff']);
  const rock = R(['#0c0a16', '#151220', '#1e1a2e', '#2a2440', '#3a3254', '#4e4468']);
  const glowM = R(['#1a6a5a', '#24a084', '#40d0a8', '#9af8d8']);
  const skyR = R(['#02020a', '#060616', '#0c0a24', '#160e34', '#221446', '#301a58']);
  const tera = [[255, 120, 120], [255, 200, 100], [255, 250, 140], [140, 240, 160], [120, 200, 255], [180, 140, 255], [255, 140, 220]];

  function facet(fx, fy, x, y, ramp, base, seed, cell, edgeK) {
    const v = MK.vor(fx, fy, cell || 14, seed, 0.9);
    const nx = (fx - v.cx) / (cell || 14);
    const ny = (fy - v.cy) / (cell || 14);
    let t = base + (v.id - 0.5) * 0.35 - ny * 0.3 - nx * 0.15;
    if (v.edge < 0.6 && v.id > (edgeK == null ? 0 : edgeK)) t += 0.28;
    return MK.q(ramp, t, x, y);
  }

  function outer(fx, fy, x, y) {
    const ao = MapFx.ao(fx, fy, 0.5, 9, true);
    const gm = MK.fbm(fx, fy, 28, 3, 12);
    const shard = MK.vor(fx, fy, 40, 33, 0.8);
    if (shard.id > 0.9 && shard.d1 < 4.5) return MK.shade(facet(fx, fy, x, y, shard.id > 0.95 ? crysC : crys, 0.6, 3, 4), ao);
    if (gm > 0.64) {
      const h = MK.hash(Math.floor(fx / 1.5), Math.floor(fy / 1.5), 3);
      if (h > 0.55) return MK.shade(MK.q(glowM, 0.2 + (gm - 0.64) * 5 + (h > 0.9 ? 0.5 : 0), x, y), ao);
      return MK.shade(MK.q(rock, 0.55, x, y), ao);
    }
    const cr = MK.vor(fx, fy, 26, 7);
    if (cr.edge < 0.8 && gm > 0.45) return MK.shade(MK.q(crys, 0.55, x, y), ao);
    return MK.shade(MK.q(rock, 0.4 + (cr.id - 0.5) * 0.3 - (fy - cr.cy) / 26 * 0.25 + (MK.noise(fx, fy, 4, 1) - 0.5) * 0.15, x, y), ao);
  }

  function paint(info, fx, fy, x, y) {
    const k = info.k;
    if (k === 'field') {
      const cell = MapLayout.hexCell(fx, fy);
      if (!cell) return MK.q(rock, 0.2, x, y);
      if (cell.e < 1.4) return MK.q(crys, 0.9, x, y);
      const r = Math.hypot(fx - 396, fy - 251);
      const hue = (cell.r * 3 + cell.c * 5) % 7;
      const ramp = (cell.r + cell.c) % 3 === 0 ? crysC : crys;
      let base = 0.45 + (cell.ly < 0 ? 0.1 : 0);
      if (cell.e < 3.5) base += 0.15;
      const c = facet(fx, fy, x, y, ramp, base, cell.r * 13 + cell.c, 20, 0.55);
      const rainbow = Math.exp(-((r - 60) ** 2) / 120);
      if (rainbow > 0.05) return MK.mix(c, tera[Math.floor((Math.atan2(fy - 251, fx - 396) + Math.PI) / (Math.PI * 2) * 7) % 7], rainbow * 0.55);
      if (r < 20) return MK.mix(c, [255, 255, 255], (1 - r / 20) * 0.35);
      return info.ey < 6 && fy < 250 ? MK.shade(c, 0.75) : c;
    }
    if (k === 'frame') {
      const vein = Math.abs(Math.sin(fy * 0.08 + MK.noise(fx, fy, 10, 3) * 4)) < 0.12;
      return vein ? MK.q(crysC, 0.8, x, y) : MK.q(rock, 0.35 + (MK.noise(fx, fy, 3, 2) - 0.5) * 0.3, x, y);
    }
    if (k === 'bench') {
      const cr = MK.vor(fx, fy, 16, 41);
      if (cr.edge < 0.7) return MK.q(glowM, 0.6, x, y);
      return MK.q(rock, 0.4 + (cr.id - 0.5) * 0.25 - (fy - cr.cy) / 16 * 0.2, x, y);
    }
    if (k === 'slot') {
      const lx = info.lx;
      const ly = info.ly;
      if (Math.abs(lx) > 18 || Math.abs(ly) > 17) return MK.q(crys, Math.abs(lx) > 19.5 || Math.abs(ly) > 18.5 ? 0.15 : 0.75, x, y);
      return facet(fx, fy, x, y, crysC, 0.42 - (ly + 17) / 34 * 0.15, info.i * 7 + (info.top ? 3 : 0), 10);
    }
    if (k === 'pad') {
      const ax = Math.abs(info.lx);
      const ay = Math.abs(info.ly);
      const hexd = Math.max(ax * 0.866 + ay * 0.5, ay);
      if (hexd < 31) {
        if (hexd > 28.5) return MK.q(crys, 0.95, x, y);
        const seg = Math.floor((Math.atan2(info.ly, info.lx) + Math.PI) / (Math.PI * 2) * 6);
        const c = MK.shade(tera[seg % 7], 0.55 + (1 - hexd / 28) * 0.5 + (info.ly < 0 ? 0.1 : -0.05));
        if (Math.abs(info.lx * Math.sin(seg) ) < 0) return c;
        return hexd < 8 ? [255, 255, 255] : c;
      }
      return outer(fx, fy, x, y);
    }
    if (k === 'pillar') {
      const ax = Math.abs(info.lx);
      const ay = Math.abs(info.ly);
      const hexd = Math.max(ax * 0.866 + ay * 0.5, ay * 1.1);
      if (hexd < 14) {
        if (hexd > 12.5) return MK.q(crys, 0.9, x, y);
        return facet(fx, fy, x, y, crys, 0.5 + (info.ly < 0 ? 0.12 : 0), info.i + (info.top ? 9 : 0), 6);
      }
      return outer(fx, fy, x, y);
    }
    return outer(fx, fy, x, y);
  }

  function island(fx, fy) {
    return MapFx.island(fx, fy, { top: -10, l: 160, r: 760, kl: 0.17, kr: 0.17, seed: 13, wob: 6 });
  }

  function sky(ctx, W, H) {
    MK.pixels(ctx, W, H, (x, y) => {
      let c = MapSky.gradient(skyR, y / 100, 1, x, 0.04);
      const fog = MK.fbm(x * 0.6, y, 40, 3, 21);
      c = MK.mix(c, [80, 60, 160], Math.max(0, fog - 0.45) * 0.9);
      const beam = Math.exp(-((x - 320 + y * 0.6) ** 2) / 900) * Math.max(0, 1 - y / 80);
      c = MK.mix(c, [180, 200, 255], beam * 0.25);
      const wallL = 30 + 40 * Math.max(0, 1 - x / 120) + 6 * MK.fbm(x, y, 10, 2, 3);
      const wallR = 30 + 40 * Math.max(0, (x - 520) / 120) + 6 * MK.fbm(x, y, 10, 2, 4);
      if (y > 90 - Math.max(wallL, wallR) && (x < 140 || x > 500)) {
        const lit = MK.vor(x * 1.2, y * 0.8, 7, 5);
        c = MK.q(rock, 0.25 + lit.id * 0.2 + (lit.edge < 0.5 ? 0.15 : 0), x, y);
      }
      for (let i = 0; i < 9; i++) {
        const cx = 40 + i * 70 + MK.hash(i, 1, 2) * 30;
        const base = 50 + MK.hash(i, 2, 2) * 30;
        const h = 18 + MK.hash(i, 3, 2) * 30;
        const w = 3 + MK.hash(i, 4, 2) * 4;
        const lean = (MK.hash(i, 5, 2) - 0.5) * 0.6;
        const yy = base - y;
        const dx = x - cx - yy * lean;
        if (yy >= 0 && yy < h && Math.abs(dx) < w * (yy > h - w ? (h - yy) / w : 1)) {
          const col = tera[i % 7];
          c = MK.mix(MK.mix([40, 30, 80], col, 0.5), [255, 255, 255], dx < 0 ? 0.25 : 0);
        }
      }
      if (MK.hash(x, y, 5) > 0.993) c = MK.mix(c, tera[Math.floor(MK.hash(x, y, 6) * 7)], 0.8);
      return c;
    });
  }

  function rim(c, edge) {
    return edge === 1 ? MK.mix(c, [160, 140, 255], 0.5) : c;
  }

  function cliff(k, H, fx, fy, x, y) {
    const f = MK.vor(x * 1.4, y * 0.7, 6, 9);
    if (f.edge < 0.4 && f.id > 0.6) return MK.q(crysC, 0.7, x, y);
    return MK.q(rock, 0.45 - (k / H) * 0.4 + f.id * 0.15, x, y);
  }

  function props(P) {
    const out = [10, 6, 24];
    const crystal = (key, w, h, ramp, n) => Spr.make(key, w, h, (x, y) => {
      const shards = [];
      for (let i = 0; i < n; i++) {
        const side = i === 0 ? 0 : (i % 2 ? -1 : 1) * (0.25 + MK.hash(i, 1, w) * 0.3);
        shards.push({ cx: w / 2 + side * w * 0.45, hh: h * (i === 0 ? 0.98 : 0.4 + MK.hash(i, 2, w) * 0.35), ww: i === 0 ? w * 0.17 : 1.6 + MK.hash(i, 3, w) * w * 0.09, lean: side * 0.55 });
      }
      for (let i = shards.length - 1; i >= 0; i--) {
        const sh = shards[i];
        const yy = h - 1 - y;
        if (yy < 0 || yy >= sh.hh) continue;
        const dx = x - sh.cx - yy * sh.lean;
        const tipH = sh.ww * 1.8;
        const half = yy > sh.hh - tipH ? sh.ww * (sh.hh - yy) / tipH : sh.ww;
        if (Math.abs(dx) > half) continue;
        let t = dx < -half * 0.2 ? 0.78 : dx < half * 0.35 ? 0.55 : 0.3;
        if (yy > sh.hh - tipH) t += 0.12;
        if (Math.abs(dx + half * 0.2) < 0.6) t += 0.25;
        t += (yy / sh.hh) * 0.1;
        return MK.q(ramp, t, x, y);
      }
      return null;
    }, { outline: out });
    const big = crystal('p-big', 34, 66, crys, 5);
    const bigC = crystal('p-bigc', 30, 56, crysC, 4);
    const small = crystal('p-small', 20, 28, crysC, 4);
    const smallM = crystal('p-smallm', 18, 24, crys, 3);
    const plant = Spr.make('p-plant', 16, 30, (x, y) => {
      for (const [sx, top, bulb] of [[5, 6, 3], [10, 2, 3.5], [8, 12, 2.5]]) {
        const bend = Math.sin((30 - y) * 0.2) * 1.5;
        if (y > top + bulb && Math.abs(x - sx - bend) < 0.8) return MK.q(glowM, 0.3, x, y);
        if ((x - sx - Math.sin((30 - top) * 0.2) * 1.5) ** 2 + (y - top) ** 2 <= bulb * bulb) return MK.q(glowM, 0.7 + (x < sx ? 0.3 : 0), x, y);
      }
      return null;
    }, { outline: [6, 20, 16] });
    const debris = Spr.make('p-debris', 22, 12, (x, y) => {
      if (y > 3 && x > 1 && x < 21 && y < 11 && (x + y * 2) % 13 > 1) {
        const panel = (x % 7 === 0) || y === 4;
        return panel ? [90, 220, 255] : MK.q(R(['#3a4250', '#566070', '#7a8494']), 0.6 - x / 30, x, y);
      }
      return null;
    }, { outline: out });
    const C = (fx, fy, cv, ax, ay, col, flip) => {
      P.shadow(fx + 3, fy + 2, Math.round(cv.width * 0.35), 3, 0.45);
      P.sprite(fx, fy, cv, ax, ay, { flip });
      P.glow(fx, fy, Math.round(cv.height * 0.6), col, 0.3, Math.round(cv.height * 0.45));
    };
    C(60, 120, big, 17, 65, [140, 110, 255]);
    C(-20, 240, bigC, 15, 55, [80, 200, 255], true);
    C(40, 420, big, 17, 65, [140, 110, 255], true);
    C(780, 220, bigC, 15, 55, [80, 200, 255]);
    C(840, 380, big, 17, 65, [140, 110, 255]);
    C(720, 500, bigC, 15, 55, [80, 200, 255], true);
    C(120, 40, small, 10, 27, [80, 200, 255]);
    C(150, 230, smallM, 9, 23, [140, 110, 255]);
    C(150, 330, small, 10, 27, [80, 200, 255], true);
    C(642, 330, smallM, 9, 23, [140, 110, 255]);
    C(660, 480, small, 10, 27, [80, 200, 255]);
    C(620, -8, smallM, 9, 23, [140, 110, 255]);
    C(170, -8, small, 10, 27, [80, 200, 255], true);
    for (const [fx, fy] of [[100, 300], [-40, 360], [740, 300], [800, 470], [20, 180], [90, 500]]) {
      P.shadow(fx, fy + 1, 5, 2, 0.4);
      P.sprite(fx, fy, plant, 8, 29);
      P.glow(fx, fy, 18, [80, 255, 190], 0.35, 20);
    }
    P.shadow(730, 140, 10, 2, 0.4);
    P.sprite(730, 138, debris, 11, 11);
    P.shadow(-60, 470, 10, 2, 0.4);
    P.sprite(-60, 468, debris, 11, 11, { flip: true });
  }

  function post(ctx, W, H) {
    MapFx.grade(ctx, W, H, { light: [320, 180, 300], lightColor: 'rgba(200, 160, 255, 0.55)', tint: 'rgba(70, 40, 160, 0.22)', vignette: 'rgba(4, 0, 16, 0.65)' });
  }

  return { id: 'paldea', name: '팔데아 · 에리어 제로', paint, island, sky, cliff, cliffH: 24, rim, props, post, grid: 'rgba(200, 180, 255, 0.16)' };
})();
