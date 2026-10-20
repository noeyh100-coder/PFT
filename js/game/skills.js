function skillParamsOf(form) {
  if (!form || typeof SKILL_P === 'undefined') return {};
  return SKILL_P[form.name + '·' + form.skill] || SKILL_P[form.name] || {};
}

const SKILL_P = {
  '캐터피': { m: 1.5, spe: -2 },
  '단데기': { def: 2, dur: 5, shield: 0.15, reflect: 0.2 },
  '버터플': { m: 1.2 },
  '꼬렛': { m: 1.7, extra: false },
  '레트라': { m: 2.2, extra: true },
  '모래두지': { m: 1.8, buff: 1, heal: 0.25, debuff: 1 },
  '고지': { m: 2.1, buff: 2, heal: 0.4, debuff: 2 },
  '푸푸린': { m: 1.5, ring: 0, stun: 1.5 },
  '푸린': { m: 1.7, ring: 1, stun: 1.5 },
  '푸크린': { m: 2.0, ring: 1, stun: 2 },
  '콘팡': { m: 1.8, n: 1, red: 0.2 },
  '도나리': { m: 2.2, n: 2, red: 0.25 },
  '고라파덕': { m: 1.7, line: 0 },
  '골덕': { m: 2.1, line: 2 },
  '발챙이': { m: 1.8, heal: 0.02 },
  '슈륙챙이': { m: 2.1, heal: 0.03 },
  '강챙이': { m: 2.4, heal: 0.04 },
  '왕구리': { m: 2.3 },
  '두두': { m: 1.8, behind: 1 },
  '두트리오': { m: 2.15, behind: 2 },
  '슬리프': { m: 2.0, steal: 0.4, stunMul: 1.5, guard: 1 },
  '슬리퍼': { m: 2.4, steal: 0.5, stunMul: 2, guard: 1, guardDef: 1 },
  '아라리': { m: 1.8, allies: false },
  '나시': { m: 2.15, allies: true },
  '콘치': { m: 1.7, crit: 0 },
  '왕콘치': { m: 2.2, crit: 1 },
  '핑복': { heal: 0.08 },
  '럭키': { heal: 0.1 },
  '니드런♀': { red: 0.25, dur: 2 },
  '니드리나': { red: 0.3, dur: 2 },
  '니드퀸': { red: 0.4, dur: 5 },
  '니드런♂': { m: 1.8, behind: 0 },
  '니드리노': { m: 2.1, behind: 1 },
  '니드킹': { m: 2.4, behind: 2 },
  '뽀뽀라': { m: 1.5, steal: 0.75, over: false },
  '루주라': { m: 1.8, steal: 0.75, over: true },
  '쏘드라': { m: [1.7, 1.9, 2.2] },
  '시드라': { m: [1.9, 2.1, 2.4] },
  '킹드라': { m: [2.1, 2.3, 2.6] },
  '코일': { m: 1.9, line: 3, chance: 0.1 },
  '레어코일': { m: 2.15, line: 3, chance: 0.2 },
  '자포코일': { m: 2.45, line: 4, chance: 0.3 },
  '마그비': { m: 1.7, ring: 0, chance: 0.3 },
  '마그마': { m: 1.9, ring: 1, chance: 0.3 },
  '마그마번': { m: 2.2, ring: 1, chance: 0.5 },
  '깨비참': { m: 0.6, crit: 0 },
  '깨비드릴조': { m: 0.75, crit: 1 },
  '뿔충이': { m: 1.5, spe: -2 },
  '딱충이': { def: 2, dur: 3, thorn: 0.6 },
  '독침붕': { m: 1.8 },
  '파오리': { m: 2.3, crit: 1 },
  '셀러': { def: 2, dur: 4, red: 0.2, m: 1.5 },
  '파르셀': { def: 3, dur: 5, red: 0.3, m: 2.0 },
  '크랩': { m: 2.0, splash: 0 },
  '킹크랩': { m: 2.4, splash: 0.5 },
  '내루미': { m: 1.55, sides: false, buff: 1 },
  '내룸벨트': { m: 1.9, sides: true, buff: 2 },
  '흉내내': {},
  '마임맨': { m: 2.0, red: 0.3, dur: 6, radius: 2, shield: 0.2 },
  '잉어킹': { m: 1.7, shield: 0.15 },
  '아보': { m: 1.8, chance: 0 },
  '아보크': { m: 2.1, chance: 0.3 },
  '모다피': { m: 1.7 },
  '우츠동': { m: 1.95 },
  '우츠보트': { m: 2.3 },
  '포니타': { m: 1.8, burn: 0 },
  '날쌩마': { m: 2.2, burn: 0.3 },
  '뿔카노': { m: 1.8, def: 1, shield: 0 },
  '코뿌리': { m: 2.1, def: 0, shield: 0.2 },
  '거대코뿌리': { m: 3.0 },
  '나옹': { m: 1.7, ring: 0, gold: 1 },
  '페르시온': { m: 2.1, ring: 1, gold: 2 },
  '디그다': { m: 2.2, heal: 0, air: 1.5 },
  '닥트리오': { m: 2.8, heal: 0, air: 2 },
  '피츄': { m: 1.8, splash: 0 },
  '피카츄': { m: 2.1, splash: 0 },
  '라이츄': { m: 2.5, splash: 0.5 },
  '쥬쥬': { m: 2.0, line: 0, chill: 0 },
  '쥬레곤': { m: 2.2, line: 3, chill: 2 },
  '뚜벅쵸': { m: 1.7 },
  '냄새꼬': { m: 2.0 },
  '라플레시아': { heal: 1.5 },
  '아르코': { m: 0.8, dur: 2 },
  '파라스': { chance: 0.5 },
  '파라섹트': { chance: 1 },
  '배루키': { m: 1.7 },
  '시라소몬': { m: 2.0 },
  '홍수몬': { m: 3.0 },
  '카포에라': { m: [0.6, 1.2, 1.8] },
  '캐이시': { m: 2.0, ring: 0, sleep: 0 },
  '윤겔라': { m: 2.3, ring: 1, sleep: 1.5 },
  '이상해씨': { m: 2.0, line: 2, shield: 0.15, buff: 0, charge: 1 },
  '이상해풀': { m: 2.3, line: 3, shield: 0.2, buff: 0, charge: 1 },
  '이상해꽃': { m: 2.65, line: 4, shield: 0.3, buff: 2, charge: 1 },
  '파이리': { m: 2.0, chance: 0.3 },
  '리자드': { m: 2.25, chance: 0.3 },
  '리자몽': { m: 2.6, chance: 0.5 },
  '꼬부기': { m: 2.1 },
  '어니부기': { m: 2.5 },
  '거북왕': { m: 3.0 },
  '구구': { m: 1.9, splash: 0 },
  '피죤': { m: 2.15, splash: 0 },
  '피죤투': { m: 2.5, splash: 0.5 },
  '삐': { m: 1.9, chance: 0.3 },
  '삐삐': { m: 2.15, chance: 0.3 },
  '픽시': { m: 2.5, chance: 0.5 },
  '주뱃': { m: 0.85, n: 2 },
  '골뱃': { m: 1.0, n: 2 },
  '크로뱃': { m: 0.65, n: 4 },
  '에레키드': { m: 2.1, chance: 0.3 },
  '에레브': { m: 2.3, chance: 0.3 },
  '에레키블': { m: 2.55, chance: 0.5 },
  '폴리곤': { m: 2.15 },
  '폴리곤2': { m: 2.65 },
  '폴리곤Z': { m: 3.0 },
  '암나이트': { m: 2.0, buff: 1, chance: 0 },
  '암스타': { m: 2.3, buff: 2, chance: 0.1 },
  '미뇽': { m: 1.9 },
  '신뇽': { m: 2.3 },
  '이브이': { m: 1.9 },
  '샤미드': { m: 2.3 },
  '쥬피썬더': { m: 1.8 },
  '부스터': { m: 2.3 },
  '에브이': { m: 1.9 },
  '블래키': { m: 2.15 },
  '리피아': { m: 2.75 },
  '글레이시아': { m: 2.3 },
  '님피아': { m: 2.15 },
  '꼬마돌': { m: 0.8, dur: 3, def: 1, red: 0, stun: 0, shield: 0, buff: 0 },
  '데구리': { m: 0.3, dur: 3, def: 0, red: 0.2, stun: 0, shield: 0.2, buff: 0 },
  '딱구리': { m: 1.1, dur: 4, def: 0, red: 0.3, stun: 0.5, shield: 0.25, buff: 2 },
  '별가사리': { m: 2.3, heal: 0, spd: 0, shield: 0 },
  '아쿠스타': { m: 2.9, heal: 0, spd: 0, shield: 0 },
  '고오스': { m: 2.0, hide: 0, pierce: false },
  '고우스트': { m: 2.3, hide: 0.5, pierce: true },
  '알통몬': { m: 2.0, crit: 1 },
  '근육몬': { m: 2.4, crit: 1 },
  '괴력몬': { m: 2.7, crit: 2 },
  '야돈': { m: 1.85 },
  '야도란': { kind: 'phys' },
  '야도킹': { kind: 'spec' },
  '찌리리공': { m: 1.9 },
  '붐볼': { m: 2.4 },
  '덩쿠리': { m: 2.1, ring: 0, buff: 0 },
  '덩쿠림보': { m: 2.3, ring: 1, buff: 2 },
  '쁘사이저': { m: 2.15, crit: 1 },
  '투구': { m: 1.9, n: 1 },
  '투구푸스': { m: 2.4, n: 2 },
  '왕눈해': { m: 2.0, r: 1, spd: 1, buff: 0, per: 0, chance: 0.1 },
  '독파리': { m: 2.35, r: 2, spd: 0, buff: 2, per: 0.06, chance: 0.1 },
  '캥카': { m: 1.0 },
  '탕구리': { m: 1.1 },
  '텅구리': { m: 1.3 },
  '가디': { m: 2.0, chance: 0.1, dash: false },
  '윈디': { m: 2.4, chance: 0.2, dash: true },
  '식스테일': { m: 2.0, chance: 0.1 },
  '나인테일': { m: 2.35, chance: 0.2 },
  '또가스': { m: 1.55, chance: 0.4 },
  '또도가스': { m: 1.9, chance: 0.7 },
  '질퍽이': { m: 2.3 },
  '질뻐기': { m: 2.65 },
  '켄타로스': { m: 2.65 },
  '롱스톤': { m: 1.8, def: 1, shield: 0.15 },
  '강철톤': { m: 2.2, def: 2, shield: 0.2 },
  '팬텀': { m: 2.5 },
  '망나뇽': { m: 0.3, n: [20, 30, 100], dur: 2 },
  '후딘': { m: 4.0, delay: 1.5, charm: 4 },
  '해피너스': { heal: 0.175, shield: 0.14 },
  '망키': { m: 1.8 },
  '성원숭': { m: 2.1 },
  '저승갓숭': { m: 1.8 },
  '스라크': { m: 1.9, crit: 1 },
  '스라크·벌레먹기': { m: 1.6, heal: 0.4 },
  '발챙이·거품광선': { m: 1.8, behind: 1 },
  '슈륙챙이·거품광선': { m: 2.1, behind: 1 },
  '뚜벅쵸·꽃잎댄스': { m: 0.6, dur: 2 },
  '냄새꼬·꽃잎댄스': { m: 0.7, dur: 2 },
  '라플레시아·애시드봄': { m: 2.3 },
  '배루키·로킥': { m: 1.7 },
  '배루키·판별': { m: 1.6, dur: 1.5, def: 1 },
  '홍수몬·판별': { m: 2.2, dur: 2, def: 2 },
  '카포에라·마하펀치': { m: 2.0 },
  '왕구리·거품광선': { m: 2.4, behind: 2 },
  '핫삼': { m: 0.8 },
  '사마자르': { m: 2.0, rock: 0.5 },
  '프테라': { m: 2.2 },
  '먹고자': { stock: 0.02, cap: 1, wake: 0.3, heal: 0.4, giga: 1.75, press: 1.05, air: 1.5, again: 0.6, air2: 1, as: 2.0, pp: 15 },
  '잠만보': { stock: 0.03, cap: 1, wake: 0.3, heal: 0.4, giga: 2.5, press: 1.5, air: 1.5, again: 0.6, air2: 1, as: 2.0, pp: 15 },
  '라프라스': { m: 2.3 },
  '프리져': { m: 0.4, radius: 2, dur: 5 },
  '파이어': { orb: 1.5, blast: 2.0, stun: 1.5, arm: 3, burn: 5, anti: 0.5 },
  '썬더': { dur: 5 }
};

const SKILL_NOCOPY = new Set(['포자', '잠자기', '오리진즈슈퍼노바', '폭포오르기', '번개', '사이코브레이크', '흉내내기', '불대문자', '절대영도', '용성군', '미래예지']);

const SKILL_HELPERS = {
  durMul(u) {
    return 1 + (u.hypno && u.skillCount === 3 ? u.hypno : 0);
  },

  foesOf(u) {
    return this.units.filter(o => this.canTarget(u, o));
  },

  alliesOf(u) {
    return this.units.filter(o => o.alive && o.side === u.side);
  },

  ring(u, r, c, R) {
    return this.foesOf(u).filter(o => Hex.dist(r, c, o.r, o.c) <= R);
  },

  mewTypeList(u) {
    const list = (this.side[u.side].mewTypes || []).slice();
    for (const x of u.mewExtra || []) if (!list.includes(x)) list.push(x);
    return list;
  },

  densestFoe(u, R) {
    const foes = this.foesOf(u).filter(e => !e.hidden);
    let best = null;
    let bestN = -1;
    for (const e of foes) {
      const n = foes.filter(o => Hex.dist(e.r, e.c, o.r, o.c) <= R).length;
      if (n > bestN) {
        bestN = n;
        best = e;
      }
    }
    return best;
  },

  cleanse(a) {
    a.poisonUntil = 0;
    a.toxicSince = 0;
    a.burnUntil = 0;
    a.paraUntil = 0;
    a.confUntil = 0;
    a.chill = 0;
    a.frozenUntil = 0;
    a.antiHealUntil = 0;
    a.shockUntil = 0;
    if (!a.channel && !(a.sleep && !a.sleep.awake)) a.stunUntil = Math.min(a.stunUntil, this.time);
    a.tmp = a.tmp.filter(e => e.n > 0);
  },

  supernovaHit(u, o, d, types, k, hits) {
    const has = x => types.includes(x);
    const st = this.side[u.side];
    if (!o.alive) return;
    if (has('불꽃')) {
      this.addBurn(o, u, 4 * k);
      o.antiHeal = Math.min(0.75, 0.5 * k);
      o.antiHealUntil = this.time + 4 * k;
    }
    if (has('전기')) {
      this.addPara(o, 4 * k);
      o.shockUntil = this.time + 4 * k;
      o.shockAt = this.time + 2;
      o.shockSrc = u;
      o.shockDmg = this.spaStat(u) * 0.3 * k;
    }
    if (has('얼음') && !(o.ccImmuneUntil > this.time)) {
      const fd = 1.5 * k * this.ccMul(o);
      o.frozenUntil = Math.max(o.frozenUntil, this.time + fd);
      o.frozenBy = u.side;
      o.stunUntil = Math.max(o.stunUntil, o.frozenUntil);
      this.emit({ type: 'freeze', target: o.uid, duration: fd });
    }
    if (has('독')) this.addPoison(o, u, 4 * k, true);
    if (has('땅')) {
      const n = -Math.round(1 * k);
      o.tmp.push({ k: 'def', n, until: this.time + 6 });
      o.tmp.push({ k: 'spd', n, until: this.time + 6 });
    }
    if (has('에스퍼')) this.addConfuse(o, 3 * k);
    if (has('악')) {
      o.tmp.push({ k: 'atk', n: -1, until: this.time + 99 });
      o.tmp.push({ k: 'spa', n: -1, until: this.time + 99 });
      u.darkAcc += 0.3 * k;
      while (u.darkAcc >= 1) {
        u.darkAcc -= 1;
        this.perma(u, 'atk', 1);
        this.perma(u, 'spa', 1);
      }
    }
    if (has('바위') && d > 0) this.dealDamage(u, o, d * 0.3 * k, { trueDmg: true, kind: 'true' });
    if (has('풀') && o.alive) this.dealDamage(u, o, o.maxHp * 0.04 * k, { special: true, kind: 'grass' });
    if (has('격투') && o.alive) this.dealDamage(u, o, this.atkStat(u) * 0.6 * k, { special: false, kind: 'fight' });
    if (has('에스퍼') && d > 0) {
      let from = o;
      for (let i = 0; i < 2; i++) {
        const next = this.foesOf(u).find(e => !hits.has(e) && Hex.dist(from.r, from.c, e.r, e.c) <= 1);
        if (!next) break;
        hits.add(next);
        this.emit({ type: 'hitfx', target: next.uid, kind: '에스퍼' });
        this.dealDamage(u, next, d * 0.3 * k, { special: true, kind: 'chain' });
        from = next;
      }
    }
  },

  axis(u, t) {
    const a = hexMetric(u.r, u.c);
    const b = hexMetric(t.r, t.c);
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    return { a, dx, dy, len };
  },

  project(ax, o) {
    const p = hexMetric(o.r, o.c);
    const vx = p.x - ax.a.x;
    const vy = p.y - ax.a.y;
    return { along: vx * ax.dx + vy * ax.dy, side: Math.abs(vx * ax.dy - vy * ax.dx) };
  },

  line(u, t, n) {
    const ax = this.axis(u, t);
    const L = Math.max(n, ax.len) + 0.3;
    const out = this.foesOf(u).filter(o => {
      const q = this.project(ax, o);
      return q.along > 0.3 && q.along <= L && q.side <= 0.62;
    });
    if (!out.includes(t) && this.canTarget(u, t)) out.push(t);
    return out;
  },

  cone(u, t, n) {
    const ax = this.axis(u, t);
    const L = Math.max(n, Hex.dist(u.r, u.c, t.r, t.c));
    const out = this.foesOf(u).filter(o => {
      if (Hex.dist(u.r, u.c, o.r, o.c) > L) return false;
      const q = this.project(ax, o);
      return q.along > 0.2 && Math.atan2(q.side, q.along) <= 0.68;
    });
    if (!out.includes(t) && this.canTarget(u, t)) out.push(t);
    return out;
  },

  behind(u, t, n) {
    if (!n) return [];
    const ax = this.axis(u, t);
    return this.foesOf(u).filter(o => {
      if (o === t) return false;
      const q = this.project(ax, o);
      return q.along > ax.len + 0.3 && q.along <= ax.len + n + 0.3 && q.side <= 0.62;
    });
  },

  sides(u, t) {
    const d = Hex.dist(u.r, u.c, t.r, t.c);
    return this.foesOf(u).filter(o => o !== t && Hex.dist(o.r, o.c, t.r, t.c) === 1 && Hex.dist(u.r, u.c, o.r, o.c) === d);
  },

  adjOne(u, t) {
    const list = this.foesOf(u).filter(o => o !== t && Hex.dist(o.r, o.c, t.r, t.c) === 1);
    return list.length ? [list[0]] : [];
  },

  lowestHp(u) {
    let best = null;
    for (const o of this.foesOf(u)) if (!best || o.hp < best.hp) best = o;
    return best;
  },

  lowestN(u, n) {
    return this.foesOf(u).sort((a, b) => a.hp - b.hp).slice(0, n);
  },

  nearestN(u, n) {
    return this.foesOf(u).sort((a, b) => this.distTo(u, a) - this.distTo(u, b) || a.uid - b.uid).slice(0, n);
  },

  farthestWithin(u, n) {
    let best = null;
    let bestD = -1;
    for (const o of this.foesOf(u)) {
      const d = this.distTo(u, o);
      if (d <= n && d > bestD) {
        best = o;
        bestD = d;
      }
    }
    return best;
  },

  highestRatioWithin(u, n) {
    let best = null;
    for (const o of this.foesOf(u)) {
      if (this.distTo(u, o) > n) continue;
      if (!best || o.hp / o.maxHp > best.hp / best.maxHp) best = o;
    }
    return best;
  },

  hit(u, t, mult, o) {
    const opt = o || {};
    if (!t || !t.alive || t.hidden || this.effMult(u, t) <= 0) return 0;
    const cfg = CONFIG.combat;
    const diff = this.rank(u, 'acc') + (opt.acc || 0) - this.rank(t, 'eva');
    if (!opt.sure && diff < 0) {
      const chance = 6 / (6 - Math.max(-6, diff));
      if (this.rng.next() >= chance) {
        this.emit({ type: 'miss', target: t.uid });
        u.lastMissed = true;
        this.skillMissed = true;
        return 0;
      }
    }
    const table = cfg.critTable;
    const special = opt.special != null ? opt.special : u.special;
    const cr = Math.max(0, Math.min(table.length - 1, this.rank(u, 'crit') + (opt.crit || 0) + ((special ? u.skillCritSa : u.skillCritPa) || 0)));
    const roll = this.rng.next();
    const crit = roll < table[cr];
    let raw = opt.raw != null ? opt.raw : this.offense(u) * mult * (u.pwStar || 1);
    raw *= (1 + u.skillAmp) * this.skillScale;
    if (crit) raw *= cfg.critMult + (u.critDmg || 0);
    if (diff > 0) raw *= 1 + cfg.hitBonus;
    if (u.waterSkillAmp) raw *= 1 + u.waterSkillAmp;
    const dmg = this.dealDamage(u, t, raw, { special, crit, kind: 'skill', ignoreShield: opt.ignoreShield, armor: opt.armor, ignoreUp: opt.ignoreUp });
    u.lastMissed = false;
    if (t === this.skillTarget && dmg > 0) this.lastHit = true;
    if (opt.burst !== false) this.emit({ type: 'hitfx', target: t.uid, kind: u.skillType });
    if (opt.onHit && t.alive) opt.onHit(t, dmg);
    if (opt.onKill && !t.alive) opt.onKill(t);
    return dmg;
  },

  hitAll(u, list, mult, o) {
    let total = 0;
    for (const t of list) total += this.hit(u, t, mult, o);
    return total;
  },

  chance(p) {
    return p > 0 && this.rng.next() < p;
  },

  hypnotize(u, t, dur) {
    if (!t || !t.alive) return;
    const d = this.stun(t, dur * this.durMul(u), u.side, 'sleep');
    if (d > 0 && u.form && u.form.name === '윤겔라') this.side[u.side].stats.hypno += d;
  },

  status(u, t, kind, dur, p) {
    if (!t || !t.alive || (p != null && p < 1 && !this.chance(p))) return;
    const d = (dur || 0) * this.durMul(u);
    if (kind === 'stun') this.stun(t, d, u.side, 'stun');
    else if (kind === 'sleep') this.stun(t, d, u.side, 'sleep');
    else if (kind === 'airborne') this.stun(t, d, u.side, 'airborne');
    else if (kind === 'flinch') this.stun(t, 1 * this.durMul(u), u.side, 'flinch');
    else if (kind === 'poison') this.addPoison(t, u, d || 3, false);
    else if (kind === 'burn') this.addBurn(t, u, d || 3);
    else if (kind === 'para') this.addPara(t, d || 3);
    else if (kind === 'confuse') this.addConfuse(t, d || 3);
  },

  chillN(u, t, n) {
    if (t && t.alive && n > 0) this.addChill(t, n, u.side);
  },

  debuff(u, t, k, n, dur, p) {
    if (!t || !t.alive || !n || (p != null && p < 1 && !this.chance(p))) return;
    t.tmp.push({ k, n, until: this.time + dur * this.durMul(u) });
  },

  buff(u, k, n, dur) {
    if (!n) return;
    u.tmp.push({ k, n, until: this.time + dur * this.durMul(u) });
  },

  perma(u, k, n) {
    u.rk[k] = Math.max(-6, Math.min(6, u.rk[k] + n));
  },

  shieldPct(u, pct, dur) {
    if (!pct) return;
    this.timedShield(u, u.maxHp * pct, dur);
  },

  timedShield(u, amount, dur) {
    if (amount <= 0) return;
    const before = u.shield;
    this.addShield(u, amount);
    const real = u.shield - before;
    if (dur && real > 0) u.shieldTimed.push({ amt: real, until: this.time + dur * this.durMul(u) });
  },

  healAmt(u, t, amt, overflowShield) {
    if (!t || !t.alive || amt <= 0) return;
    const missing = t.maxHp - t.hp;
    this.heal(t, amt, u);
    if (overflowShield && amt > missing) this.addShield(t, amt - Math.max(0, missing));
  },

  reduce(u, t, pct, dur, kind) {
    if (!pct) return;
    t.reduces.push({ pct, kind: kind || 'all', until: this.time + dur * this.durMul(u) });
  },

  selfStun(u, d) {
    u.stunUntil = Math.max(u.stunUntil, this.time + d);
    this.emit({ type: 'stun', target: u.uid, kind: 'recharge', duration: d });
  },

  freeNear(r, c, fromR, fromC) {
    let best = null;
    let bestD = Infinity;
    for (const [nr, nc] of Hex.neighbors(r, c)) {
      if (this.grid[nr][nc] !== 0) continue;
      const d = Hex.dist(fromR, fromC, nr, nc);
      if (d < bestD) {
        best = [nr, nc];
        bestD = d;
      }
    }
    return best;
  },

  dashTo(u, t, dur) {
    if (!t || t.gyaraFx || Hex.dist(u.r, u.c, t.r, t.c) <= 1) return;
    const cell = this.freeNear(t.r, t.c, u.r, u.c);
    if (cell) this.moveTo(u, cell[0], cell[1], dur || CONFIG.combat.dashTime);
  },

  knock(u, t, n) {
    if (!t || !t.alive || t.gyaraFx) return;
    for (let i = 0; i < n; i++) {
      let best = null;
      let bestD = Hex.dist(u.r, u.c, t.r, t.c);
      for (const [nr, nc] of Hex.neighbors(t.r, t.c)) {
        if (this.grid[nr][nc] !== 0) continue;
        const d = Hex.dist(u.r, u.c, nr, nc);
        if (d > bestD) {
          best = [nr, nc];
          bestD = d;
        }
      }
      if (!best) return;
      this.moveTo(t, best[0], best[1], 0.15);
    }
  },

  throwFar(u, t) {
    if (!t || !t.alive || t.gyaraFx) return;
    let best = null;
    let bestD = -1;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (this.grid[r][c] !== 0) continue;
        const d = Hex.dist(u.r, u.c, r, c);
        if (d > bestD) {
          best = [r, c];
          bestD = d;
        }
      }
    }
    if (best) this.moveTo(t, best[0], best[1], 0.3);
  },

  channel(u, opts) {
    const dur = (opts.dur || 0) * (opts.noHypno ? 1 : this.durMul(u));
    u.channel = { until: this.time + dur, then: opts.then || null, end: opts.end || null, tick: opts.tick || null, every: opts.every || 0.5, acc: 0, hidden: !!opts.hidden, move: !!opts.move, hitDuring: false, scale: this.skillScale, target: this.skillTarget };
    if (opts.hidden) {
      u.hidden = true;
      this.emit({ type: 'hide', uid: u.uid, on: true });
    }
  },

  runChannel(u, dt) {
    const ch = u.channel;
    if (ch.tick) {
      ch.acc += dt;
      while (ch.acc >= ch.every && u.alive) {
        ch.acc -= ch.every;
        this.withScale(ch.scale, ch.target, () => ch.tick(u));
      }
    }
    if (this.time < ch.until) return !ch.move;
    u.channel = null;
    if (ch.hidden) {
      u.hidden = false;
      this.emit({ type: 'hide', uid: u.uid, on: false });
    }
    this.withScale(ch.scale, ch.target, () => {
      if (ch.then) ch.then(u, ch);
      if (ch.end) ch.end(u, ch);
    });
    return true;
  },

  withScale(scale, target, fn) {
    const s = this.skillScale;
    const tg = this.skillTarget;
    this.skillScale = scale;
    this.skillTarget = target;
    fn();
    this.skillScale = s;
    this.skillTarget = tg;
  },

  later(dt, fn) {
    const scale = this.skillScale;
    const target = this.skillTarget;
    this.timers.push({ at: this.time + dt, fn: () => this.withScale(scale, target, fn) });
  },

  ringFx(u, r, c, R) {
    this.emit({ type: 'skillfx', uid: u.uid, r, c, radius: R, kind: u.skillType });
  },

  aliveOr(u, t) {
    if (t && t.alive && !t.hidden) return t;
    return this.nearestEnemy(u);
  },

  skillParams(u) {
    if (u.mew) return { m: 1.5, r: 2 };
    return skillParamsOf(u.form);
  },

  skillName(u) {
    if (u.mew) return '오리진즈슈퍼노바';
    if (u.sleep && u.sleep.awake) return '잠자기 각성';
    return u.form && u.form.skill;
  },

  runSkill(u, t) {
    const name = this.skillName(u);
    const fn = SKILLS[name];
    this.skillTarget = t;
    this.skillMissed = false;
    this.lastHit = false;
    if (this.shadowIndex) this.emit({ type: 'shadowcast', side: u.side, uid: u.uid, target: t.uid, index: this.shadowIndex });
    else this.emit({ type: 'skill', uid: u.uid, target: t.uid, ranged: u.ranged, special: u.special, enhanced: !!(u.hypno && u.skillCount === 3), name });
    if (!fn) {
      this.hit(u, t, CONFIG.combat.skillMult, {});
      return;
    }
    fn.call(null, this, u, t, this.skillParams(u));
  },

  mimicSource(u, t) {
    const ok = o => o && o.alive && o.form && o.form.skill && SKILLS[o.form.skill] && !SKILL_NOCOPY.has(o.form.skill) && !o.noSkill;
    if (ok(t)) return t;
    let best = null;
    let bestD = Infinity;
    for (const o of this.units) {
      if (o.side === u.side || !ok(o)) continue;
      const d = Hex.dist(u.r, u.c, o.r, o.c);
      if (d < bestD) {
        best = o;
        bestD = d;
      }
    }
    return best;
  },

  sleepWake(u) {
    const S = u.sleep;
    S.awake = true;
    const P = S.P;
    this.emit({ type: 'wake', uid: u.uid });
    u.hidden = true;
    u.untargetUntil = this.time + 2;
    this.emit({ type: 'hide', uid: u.uid, on: true });
    this.cleanse(u);
    u.stunUntil = Math.min(u.stunUntil, this.time);
    this.heal(u, u.maxHp * (P.heal || 0.4), u);
    u.role = '물리 전사';
    u.special = false;
    u.pct.as += P.as || 2;
    u.maxMana = P.pp || 15;
    u.mana = 0;
    const t = this.nearestEnemy(u);
    if (t) this.gigaCombo(u, t, 1, P.air || 1.5);
  },

  gigaCombo(u, t, k, air) {
    const P = u.sleep ? u.sleep.P : this.skillParams(u);
    this.channel(u, { dur: 1.5, noHypno: true });
    this.emit({ type: 'giga', uid: u.uid, target: t.uid });
    if (Hex.dist(u.r, u.c, t.r, t.c) > 1) {
      const cell = this.freeNear(t.r, t.c, u.r, u.c);
      if (cell) this.moveTo(u, cell[0], cell[1], 0.5);
    }
    this.later(0.5, () => {
      if (!u.alive) return;
      const tg = t.alive && !t.hidden ? t : this.nearestEnemy(u);
      if (!tg) return;
      this.skillTarget = tg;
      this.emit({ type: 'skillfx', uid: u.uid, r: tg.r, c: tg.c, radius: 1, kind: '노말', slam: true });
      this.hitAll(u, [tg].concat(this.adjOne(u, tg)), (P.giga || 2.5) * k, { special: false });
      this.emit({ type: 'leap', uid: u.uid, dur: 1 });
    });
    this.later(1.5, () => {
      if (!u.alive) return;
      this.emit({ type: 'press', uid: u.uid, r: u.r, c: u.c, radius: 2 });
      this.hitAll(u, this.ring(u, u.r, u.c, 2), (P.press || 1.5) * k, { special: false, onHit: o => this.stun(o, air, u.side, 'airborne') });
    });
  }
};

const SKILLS = {
  '실뿜기'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.debuff(u, o, 'spe', P.spe, 4) });
  },
  '단단해지기'(S, u, t, P) {
    S.buff(u, 'def', P.def, P.dur);
    S.shieldPct(u, P.shield, 0);
    u.thorns = { until: S.time + P.dur * S.durMul(u), reflect: P.reflect || 0, flat: P.thorn || 0 };
    S.emit({ type: 'buff', target: u.uid, kind: 'harden' });
  },
  '나비춤'(S, u, t, P) {
    if ((u.danceN || 0) < 2) {
      u.danceN = (u.danceN || 0) + 1;
      S.perma(u, 'spa', 1);
      S.perma(u, 'spd', 1);
      S.perma(u, 'spe', 1);
      for (const a of S.alliesOf(u)) if (a !== u && Hex.dist(u.r, u.c, a.r, a.c) <= 1) S.perma(a, 'spe', 1);
    }
    for (const o of S.nearestN(u, 3)) S.hit(u, o, P.m, {});
  },
  '전광석화'(S, u, t, P) {
    const tg = S.lowestHp(u) || t;
    S.skillTarget = tg;
    S.dashTo(u, tg);
    S.hit(u, tg, P.m, {});
    if (P.extra && tg.alive) S.strike(u, tg, false);
  },
  '브레이크클로'(S, u, t, P) {
    S.buff(u, 'def', P.buff, 5);
    S.buff(u, 'spd', P.buff, 5);
    S.healAmt(u, u, (u.maxHp - u.hp) * P.heal);
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'def', -P.debuff, 4) });
  },
  '노래하기'(S, u, t, P) {
    const list = P.ring ? S.ring(u, t.r, t.c, 1) : [t];
    if (P.ring) S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, list, P.m, { onHit: o => S.status(u, o, 'sleep', P.stun) });
  },
  '오리진즈슈퍼노바'(S, u, t, P) {
    const types = S.mewTypeList(u);
    const has = x => types.includes(x);
    const k = has('노말') ? 1.5 : 1;
    const R = (P.r || 2) + (has('드래곤') ? 1 : 0);
    const center = S.densestFoe(u, R) || S.aliveOr(u, t);
    if (!center) return;
    const cr = center.r;
    const cc = center.c;
    u.mewCasts += 1;
    const cast = u.mewCasts;
    S.emit({ type: 'supernova', uid: u.uid, r: cr, c: cc, radius: R, types: types.slice() });
    if (has('비행') && (u.flyRanks || 0) < 3) {
      u.flyRanks = (u.flyRanks || 0) + 1;
      S.perma(u, 'spe', Math.round(1 * k) || 1);
    }
    if (has('물')) {
      for (const a of S.alliesOf(u)) {
        S.cleanse(a);
        a.ccImmuneUntil = Math.max(a.ccImmuneUntil, S.time + 4 * k);
      }
      S.emit({ type: 'buff', target: u.uid, kind: 'cleanse' });
    }
    S.channel(u, {
      dur: 1.1,
      noHypno: true,
      then: () => {
        const st = S.side[u.side];
        let mult = P.m;
        if (has('드래곤')) mult += Math.min(1.5, 0.05 * (st.scales || 0) * k);
        S.emit({ type: 'skillfx', uid: u.uid, r: cr, c: cc, radius: R, kind: types[0] || '에스퍼', slam: true });
        const list = S.ring(u, cr, cc, R);
        const hits = new Set(list);
        let total = 0;
        for (const o of list) {
          const d = S.hit(u, o, mult, { burst: true });
          total += d;
          S.supernovaHit(u, o, d, types, k, hits);
        }
        if (has('벌레')) for (const e of S.foesOf(u)) e.mana = Math.max(0, e.mana * (1 - Math.min(0.6, 0.3 * k)));
        if (has('비행') && cast % 3 === 0) {
          const origin = { r: cr, c: cc };
          for (const o of list) if (o.alive && !(o.r === cr && o.c === cc)) S.knock(origin, o, Math.round(1 * k) || 1);
        }
        if (has('풀') && total > 0) {
          const big = S.alliesOf(u).sort((a, b) => b.maxHp - a.maxHp)[0];
          if (big) {
            const add = total * 0.2 * k;
            big.maxHp += add;
            big.hp += add;
          }
        }
        if (has('페어리') && total > 0) {
          const allies = S.alliesOf(u);
          for (const a of allies) S.healAmt(u, a, (total * 0.4 * k) / allies.length);
        }
        if (has('강철')) {
          const thr = Math.min(0.25, (0.12 + Math.floor(S.defense(u, false) / 10) * 0.01) * k);
          for (const o of list) if (o.alive && o.hp <= o.maxHp * thr) S.execute(o, u.side);
        }
      }
    });
  },
  '벌레의저항'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.debuff(u, o, 'spa', -P.n, 4) });
    if (P.red) S.reduce(u, u, P.red, 4, 'all');
  },
  '물대포'(S, u, t, P) {
    const list = P.line ? S.line(u, t, P.line) : [t];
    S.hitAll(u, list, P.m, { onHit: o => S.knock(u, o, 1) });
  },
  '깨뜨리다'(S, u, t, P) {
    if (t.shield > 0) {
      t.shield = 0;
      t.shieldTimed = [];
      S.emit({ type: 'buff', target: t.uid, kind: 'break' });
    }
    S.hit(u, t, P.m, {});
  },
  '폭발펀치'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.status(u, o, 'confuse', 2) });
  },
  '탁류'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.debuff(u, o, 'acc', -1, 4, 0.3) });
  },
  '회전부리'(S, u, t, P) {
    S.hitAll(u, [t].concat(S.behind(u, t, P.behind)), P.m, {});
  },
  '꿈먹기'(S, u, t, P) {
    const mul = t.stunUntil > S.time ? P.stunMul : 1;
    const d = S.hit(u, t, P.m * mul, {});
    S.healAmt(u, u, d * P.steal);
    if (P.guard) S.buff(u, 'spd', P.guard, 4);
    if (P.guardDef) S.buff(u, 'def', P.guardDef, 4);
  },
  '신통력'(S, u, t, P) {
    if (P.allies) for (const a of S.alliesOf(u)) {
      if (Hex.dist(u.r, u.c, a.r, a.c) <= 1) S.buff(a, 'spd', 1, 5);
    }
    else S.buff(u, 'spd', 1, 5);
    S.hit(u, t, P.m, { onHit: o => S.status(u, o, 'flinch', 1, 0.1) });
  },
  '뿔찌르기'(S, u, t, P) {
    S.hit(u, t, P.m, { crit: P.crit });
  },
  '치료방울'(S, u, t, P) {
    S.emit({ type: 'skillfx', uid: u.uid, r: u.r, c: u.c, radius: 6, kind: '페어리', heal: true });
    for (const a of S.alliesOf(u)) {
      a.stunUntil = Math.min(a.stunUntil, S.time);
      a.frozenUntil = Math.min(a.frozenUntil, S.time);
      a.poisonUntil = 0;
      a.toxicSince = 0;
      a.burnUntil = 0;
      a.paraUntil = 0;
      a.confUntil = 0;
      a.chill = 0;
      S.healAmt(u, a, a.maxHp * P.heal);
    }
  },
  '알낳기'(S, u, t, P) {
    let target = u;
    const low = S.lowestRatioAlly(u.side);
    if (low && low.hp / low.maxHp < u.hp / u.maxHp) target = low;
    S.healAmt(u, target, u.maxHp * P.heal);
  },
  '버티기'(S, u, t, P) {
    S.reduce(u, u, P.red, P.dur, 'all');
    u.endureUntil = Math.max(u.endureUntil, S.time + P.dur * S.durMul(u));
    S.emit({ type: 'buff', target: u.uid, kind: 'endure' });
  },
  '10만마력'(S, u, t, P) {
    S.dashTo(u, t);
    S.hit(u, t, P.m, {});
    S.hitAll(u, S.behind(u, t, P.behind), P.m * 0.5, {});
  },
  '드레인키스'(S, u, t, P) {
    const d = S.hit(u, t, P.m, {});
    S.healAmt(u, u, d * P.steal, P.over);
  },
  '회오리'(S, u, t, P) {
    const T = S.teams[u.side];
    const scales = (T && T.scales) || 0;
    if (u.strongDragon && scales > 10) {
      S.hitAll(u, S.line(u, t, 2), P.m[2], {});
    } else if (u.strongDragon && scales > 5) {
      S.hitAll(u, S.cone(u, t, 2), P.m[1], { onHit: o => S.status(u, o, 'para', 3, 0.3) });
    } else {
      S.ringFx(u, t.r, t.c, 1);
      S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m[0], { onHit: o => S.status(u, o, 'flinch', 1, 0.2) });
    }
  },
  '러스터캐논'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, P.line), P.m, { onHit: o => S.debuff(u, o, 'spd', -1, 4, P.chance) });
  },
  '불꽃세례'(S, u, t, P) {
    const list = P.ring ? S.ring(u, t.r, t.c, 1) : [t];
    if (P.ring) S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, list, P.m, { onHit: o => S.status(u, o, 'burn', 3, P.chance) });
  },
  '마구찌르기'(S, u, t, P) {
    const n = 2 + S.rng.int(4);
    for (let i = 0; i < n && t.alive; i++) S.hit(u, t, P.m, { crit: P.crit });
  },
  '마지막일침'(S, u, t, P) {
    const tg = S.lowestHp(u) || t;
    S.skillTarget = tg;
    S.dashTo(u, tg);
    S.hit(u, tg, P.m, { onKill: () => S.perma(u, 'atk', 3) });
  },
  '리프블레이드'(S, u, t, P) {
    S.hit(u, t, P.m, { crit: P.crit });
  },
  '껍질에숨기'(S, u, t, P) {
    S.buff(u, 'def', P.def, P.dur);
    S.reduce(u, u, P.red, P.dur, 'all');
    S.ringFx(u, u.r, u.c, 1);
    S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, {});
  },
  '집게해머'(S, u, t, P) {
    S.hit(u, t, P.m, { crit: 1 });
    if (P.splash) S.hitAll(u, S.ring(u, t.r, t.c, 1).filter(o => o !== t), P.m * P.splash, { crit: 1 });
  },
  '핥기'(S, u, t, P) {
    const list = P.sides ? [t].concat(S.sides(u, t)) : [t];
    S.hitAll(u, list, P.m, { onHit: o => S.status(u, o, 'para', 3, 0.3) });
    S.buff(u, 'def', P.buff, 5);
    S.buff(u, 'spd', P.buff, 5);
  },
  '흉내내기'(S, u, t, P) {
    const src = S.mimicSource(u, t);
    if (!src) {
      S.hit(u, t, CONFIG.combat.skillMult, {});
      return;
    }
    S.emit({ type: 'retype', uid: u.uid, kind: 'mimic', value: src.form.skill });
    const keepType = u.skillType;
    u.skillType = src.skillType;
    SKILLS[src.form.skill](S, u, t, skillParamsOf(src.form));
    u.skillType = keepType;
  },
  '리플렉터'(S, u, t, P) {
    for (const a of S.alliesOf(u)) if (Hex.dist(u.r, u.c, a.r, a.c) <= P.radius) S.reduce(u, a, P.red, P.dur, 'phys');
    S.shieldPct(u, P.shield, 0);
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, {});
  },
  '몸통박치기'(S, u, t, P) {
    S.hit(u, t, P.m, {});
    S.shieldPct(u, P.shield, 0);
  },
  '베놈쇼크'(S, u, t, P) {
    const mul = t.poisonUntil > S.time ? 2 : 1;
    S.hit(u, t, P.m * mul, { onHit: o => S.status(u, o, 'poison', 3, P.chance) });
  },
  '씨폭탄'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, {});
  },
  '니트로차지'(S, u, t, P) {
    S.dashTo(u, t);
    S.hit(u, t, P.m, { onHit: o => S.status(u, o, 'burn', 3, P.burn) });
    if ((u.nitroN || 0) < 3) {
      u.nitroN = (u.nitroN || 0) + 1;
      S.perma(u, 'spe', 1);
    }
  },
  '분함의발구르기'(S, u, t, P) {
    const mul = u.lastMissed ? 2 : 1;
    S.ringFx(u, u.r, u.c, 1);
    S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m * mul, {});
    S.buff(u, 'def', P.def, 5);
    S.shieldPct(u, P.shield, 0);
  },
  '암석포'(S, u, t, P) {
    S.hit(u, t, P.m, {});
    S.hitAll(u, S.ring(u, t.r, t.c, 1).filter(o => o !== t), P.m * 0.5, {});
    S.selfStun(u, 1);
    S.buff(u, 'def', 2, 5);
    S.buff(u, 'spd', 2, 5);
    S.shieldPct(u, 0.3, 0);
  },
  '고양이돈받기'(S, u, t, P) {
    const list = P.ring ? S.ring(u, t.r, t.c, 1) : [t];
    if (P.ring) S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, list, P.m, {
      onKill: () => {
        S.side[u.side].gold += P.gold;
        u.payday = (u.payday || 0) + P.gold;
        S.emit({ type: 'gold', target: u.uid, amount: P.gold });
      }
    });
  },
  '구멍파기'(S, u, t, P) {
    if (P.heal) S.healAmt(u, u, u.maxHp * P.heal);
    S.channel(u, {
      dur: 1,
      hidden: true,
      noHypno: true,
      then: () => {
        S.ringFx(u, u.r, u.c, 1);
        S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, { onHit: o => S.status(u, o, 'airborne', P.air) });
      }
    });
  },
  '10만볼트'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.status(u, o, 'para', 3, 0.3) });
    if (P.splash) S.hitAll(u, S.ring(u, t.r, t.c, 1).filter(o => o !== t), P.m * P.splash, {});
  },
  '오로라빔'(S, u, t, P) {
    const list = P.line ? S.line(u, t, P.line) : [t];
    S.hitAll(u, list, P.m, {
      onHit: o => {
        S.debuff(u, o, 'atk', -1, 4);
        S.chillN(u, o, P.chill);
      }
    });
  },
  '애시드봄'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.debuff(u, o, 'spd', -2, 4) });
  },
  '힘흡수'(S, u, t, P) {
    const cands = S.foesOf(u).filter(o => S.rank(o, 'atk') >= 0).sort(strongerFirst);
    const tg = cands[0] || t;
    S.perma(tg, 'atk', -1);
    S.emit({ type: 'hitfx', target: tg.uid, kind: '풀' });
    S.healAmt(u, u, S.atkStat(tg) * P.heal);
  },
  '꽃잎댄스'(S, u, t, P) {
    S.channel(u, {
      dur: P.dur,
      move: true,
      tick: () => {
        S.ringFx(u, u.r, u.c, 1);
        S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, {});
      },
      end: () => S.addConfuse(u, 1)
    });
  },
  '역린'(S, u, t, P) {
    SKILLS['꽃잎댄스'](S, u, t, P);
  },
  '마하펀치'(S, u, t, P) {
    const tg = S.lowestHp(u) || t;
    S.skillTarget = tg;
    S.dashTo(u, tg);
    S.hit(u, tg, P.m, {});
    if (tg.alive) S.strike(u, tg, false);
  },
  '로킥'(S, u, t, P) {
    const mul = S.rank(t, 'spe') < 0 ? 1.5 : 1;
    S.hit(u, t, P.m * mul, { onHit: o => S.debuff(u, o, 'spe', -2, 4) });
  },
  '힘껏펀치'(S, u, t, P) {
    S.buff(u, 'def', 2, 5);
    S.buff(u, 'spd', 2, 5);
    S.shieldPct(u, 0.25, 0);
    S.channel(u, {
      dur: 1.5,
      noHypno: true,
      then: () => {
        const tg = S.aliveOr(u, t);
        if (!tg) return;
        S.skillTarget = tg;
        S.dashTo(u, tg);
        S.hit(u, tg, P.m * (u.shield <= 1 ? 0.5 : 1), {});
      }
    });
  },
  '트리플킥'(S, u, t, P) {
    for (const m of P.m) {
      if (!t.alive) break;
      S.skillMissed = false;
      S.hit(u, t, m, {});
      if (S.skillMissed) break;
    }
  },
  '염동력'(S, u, t, P) {
    const list = P.ring ? S.ring(u, t.r, t.c, 1) : [t];
    if (P.ring) S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, list, P.m, { onHit: o => { if (P.sleep) S.hypnotize(u, o, P.sleep); } });
  },
  '솔라빔'(S, u, t, P) {
    S.shieldPct(u, P.shield, 0);
    S.buff(u, 'def', P.buff, 5);
    S.buff(u, 'spd', P.buff, 5);
    S.channel(u, {
      dur: P.charge || 1,
      noHypno: true,
      then: () => {
        const tg = S.aliveOr(u, t);
        if (tg) {
          S.skillTarget = tg;
          S.hitAll(u, S.line(u, tg, P.line), P.m, {});
        }
      }
    });
  },
  '불대문자'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.status(u, o, 'burn', 3, P.chance) });
  },
  '하이드로펌프'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 3), P.m, {});
  },
  '하이드로캐논'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 4), P.m, {});
    S.selfStun(u, 1);
  },
  '공중날기'(S, u, t, P) {
    S.channel(u, {
      dur: 1,
      hidden: true,
      noHypno: true,
      then: () => {
        const tg = S.lowestHp(u);
        if (!tg) return;
        S.skillTarget = tg;
        const cell = tg.gyaraFx ? null : S.freeNear(tg.r, tg.c, u.r, u.c);
        if (cell) S.moveTo(u, cell[0], cell[1], 0.12);
        S.hit(u, tg, P.m, {});
        if (P.splash) S.hitAll(u, S.ring(u, tg.r, tg.c, 1).filter(o => o !== tg), P.m * P.splash, {});
      }
    });
  },
  '문포스'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'spa', -1, 4, P.chance) });
  },
  '더블윙'(S, u, t, P) {
    for (let i = 0; i < P.n && t.alive; i++) S.hit(u, t, P.m, {});
  },
  '번개펀치'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.status(u, o, 'para', 3, P.chance) });
  },
  '트라이어택'(S, u, t, P) {
    S.hit(u, t, P.m, {
      onHit: o => {
        if (!S.chance(0.2)) return;
        const k = S.rng.int(3);
        if (k === 0) S.status(u, o, 'burn', 3);
        else if (k === 1) S.status(u, o, 'para', 3);
        else S.chillN(u, o, 3);
      }
    });
  },
  '전자포'(S, u, t, P) {
    S.hit(u, t, P.m, { acc: -2, onHit: o => S.status(u, o, 'para', 3) });
  },
  '파괴광선'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 4), P.m, {});
    S.selfStun(u, 1.5);
  },
  '대지의힘'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 0);
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'spd', -1, 4, P.chance) });
    S.buff(u, 'def', P.buff, 5);
    S.buff(u, 'spd', P.buff, 5);
  },
  '드래곤테일'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.throwFar(u, o) });
  },
  '아쿠아테일'(S, u, t, P) {
    S.hitAll(u, [t].concat(S.sides(u, t)), P.m, {});
  },
  '스피드스타'(S, u, t, P) {
    for (const o of S.lowestN(u, 2)) S.hit(u, o, P.m, { sure: true });
  },
  '파도타기'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 2);
    S.hitAll(u, S.ring(u, u.r, u.c, 2), P.m, { onHit: o => S.knock(u, o, 1) });
  },
  '일렉트릭볼'(S, u, t, P) {
    const ratio = S.attackSpeed(u) / Math.max(0.1, S.attackSpeed(t));
    S.hit(u, t, P.m * Math.max(1, Math.min(2, ratio)), {});
  },
  '화염방사'(S, u, t, P) {
    S.hitAll(u, S.cone(u, t, 2), P.m, { onHit: o => S.status(u, o, 'burn', 3, 0.3) });
  },
  '빛의장막'(S, u, t, P) {
    for (const a of S.alliesOf(u)) if (Hex.dist(u.r, u.c, a.r, a.c) <= 2) S.reduce(u, a, 0.3, 5, 'spec');
    S.hit(u, t, P.m, {});
  },
  '악의파동'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 1);
    S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, { onHit: o => S.status(u, o, 'flinch', 1, 0.2) });
  },
  '리프스톰'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, {});
    S.buff(u, 'spa', -2, 5);
  },
  '냉동빔'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 3), P.m, { onHit: o => S.chillN(u, o, 3) });
  },
  '매혹의보이스'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 2);
    S.hitAll(u, S.ring(u, u.r, u.c, 2), P.m, {
      onHit: o => {
        if (['atk', 'spa', 'def', 'spd', 'spe'].some(k => S.rank(o, k) > 0)) S.status(u, o, 'confuse', 2);
      }
    });
  },
  '구르기'(S, u, t, P) {
    const dur = P.dur;
    S.buff(u, 'def', P.def, dur);
    S.reduce(u, u, P.red, dur, 'all');
    let n = 0;
    S.channel(u, {
      dur,
      move: true,
      tick: () => {
        const list = S.ring(u, u.r, u.c, 1);
        if (!list.length) return;
        S.hitAll(u, list, P.m * (1 + 0.5 * n), { onHit: o => { if (P.stun) S.status(u, o, 'stun', P.stun); } });
        n += 1;
      },
      end: () => {
        S.shieldPct(u, P.shield, 0);
        S.buff(u, 'def', P.buff, 5);
        S.buff(u, 'spd', P.buff, 5);
      }
    });
  },
  '사이코쇼크'(S, u, t, P) {
    S.hit(u, t, P.m, { armor: true });
    if (P.heal) S.healAmt(u, u, (u.maxHp - u.hp) * P.heal);
    if (P.spd) S.buff(u, 'spd', P.spd, 5);
    if (P.shield) S.shieldPct(u, P.shield, 0);
  },
  '고스트다이브'(S, u, t, P) {
    const strike = () => {
      const tg = S.farthestWithin(u, 3) || S.aliveOr(u, t);
      if (!tg) return;
      S.skillTarget = tg;
      const cell = tg.gyaraFx ? null : S.freeNear(tg.r, tg.c, tg.r, tg.c);
      if (cell) S.moveTo(u, cell[0], cell[1], 0.05);
      S.hit(u, tg, P.m, { ignoreShield: P.pierce });
    };
    if (P.hide) S.channel(u, { dur: P.hide, hidden: true, noHypno: true, then: strike });
    else strike();
  },
  '크로스촙'(S, u, t, P) {
    S.hit(u, t, P.m, { crit: P.crit });
  },
  '머드샷'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'spe', -1, 4) });
    S.healAmt(u, u, (u.maxHp - u.hp) * 0.2);
  },
  '자기암시'(S, u, t, P) {
    let best = null;
    let bestSum = 0;
    for (const o of S.foesOf(u)) {
      const sum = ['atk', 'spa', 'def', 'spd', 'spe', 'acc', 'eva', 'crit'].reduce((s, k) => s + Math.max(0, S.rank(o, k)), 0);
      if (sum > bestSum) {
        best = o;
        bestSum = sum;
      }
    }
    if (best) {
      for (const k of ['atk', 'spa', 'def', 'spd', 'spe', 'acc', 'eva', 'crit']) {
        const n = Math.max(0, S.rank(best, k));
        if (n) S.perma(u, k, n);
      }
      S.emit({ type: 'retype', uid: u.uid, kind: 'suggest', value: best.name });
    }
    u.suggest = P.kind;
  },
  '방전'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 1);
    S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, { onHit: o => S.status(u, o, 'para', 3, 0.3) });
  },
  '기가드레인'(S, u, t, P) {
    const list = P.ring ? S.ring(u, t.r, t.c, 1) : [t];
    if (P.ring) S.ringFx(u, t.r, t.c, 1);
    const total = S.hitAll(u, list, P.m, {});
    S.healAmt(u, u, total * 0.5, true);
    S.buff(u, 'def', P.buff, 5);
    S.buff(u, 'spd', P.buff, 5);
  },
  '거품광선'(S, u, t, P) {
    const list = [t].concat(S.behind(u, t, P.behind || 1));
    S.emit({ type: 'skillfx', uid: u.uid, r: t.r, c: t.c, radius: 1, kind: '물' });
    S.hitAll(u, list, P.m, { onHit: o => S.debuff(u, o, 'spe', -1, 4) });
  },
  '판별'(S, u, t, P) {
    const dur = P.dur || 1.5;
    u.bulkUntil = S.time + dur;
    S.emit({ type: 'buff', target: u.uid, kind: 'shield' });
    S.later(dur, () => {
      if (!u.alive) return;
      const list = S.ring(u, u.r, u.c, 1);
      S.ringFx(u, u.r, u.c, 1);
      S.hitAll(u, list, P.m, {});
      S.buff(u, 'def', P.def || 1, 4);
    });
  },
  '벌레먹기'(S, u, t, P) {
    const d = S.hit(u, t, P.m, {});
    if (d > 0) S.healAmt(u, u, d * (P.heal || 0.4));
    if (t.alive) S.debuff(u, t, 'atk', -1, 4);
    S.buff(u, 'def', 1, 4);
  },
  '시저크로스'(S, u, t, P) {
    S.hit(u, t, P.m, { crit: P.crit });
  },
  '아쿠아브레이크'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'def', -P.n, 4) });
  },
  '오물웨이브'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, P.r);
    const list = S.ring(u, u.r, u.c, P.r);
    let hits = 0;
    S.hitAll(u, list, P.m, {
      onHit: o => {
        hits += 1;
        S.status(u, o, 'poison', 3, P.chance);
      }
    });
    S.buff(u, 'spd', P.spd, 5);
    S.buff(u, 'def', P.buff, 5);
    S.buff(u, 'spd', P.buff, 5);
    if (P.per) S.shieldPct(u, P.per * hits, 0);
  },
  '더블어택'(S, u, t, P) {
    for (let i = 0; i < 2 && t.alive; i++) S.hit(u, t, P.m, {});
    S.buff(u, 'def', 2, 5);
    S.buff(u, 'spd', 2, 5);
    S.shieldPct(u, 0.25, 0);
  },
  '뼈다귀부메랑'(S, u, t, P) {
    S.hit(u, t, P.m, {});
    if (t.alive) S.hit(u, t, P.m, {});
    const ax = S.axis(u, t);
    const back = S.foesOf(u).filter(o => {
      if (o === t) return false;
      const q = S.project(ax, o);
      return q.along > 0.3 && q.along < ax.len - 0.3 && q.side <= 0.62;
    });
    S.hitAll(u, back, P.m, {});
  },
  '불꽃엄니'(S, u, t, P) {
    if (P.dash) S.dashTo(u, t);
    S.hit(u, t, P.m, {
      onHit: o => {
        if (!S.chance(P.chance)) return;
        if (S.rng.next() < 0.5) S.status(u, o, 'burn', 3);
        else S.status(u, o, 'flinch', 1);
      }
    });
  },
  '열풍'(S, u, t, P) {
    S.hitAll(u, S.cone(u, t, 2), P.m, { onHit: o => S.status(u, o, 'burn', 3, P.chance) });
  },
  '스모그'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.status(u, o, 'poison', 3, P.chance) });
  },
  '더스트슈트'(S, u, t, P) {
    S.hit(u, t, P.m, { acc: -1, onHit: o => S.status(u, o, 'poison', 3, 0.3) });
  },
  '이판사판태클'(S, u, t, P) {
    S.dashTo(u, t);
    const d = S.hit(u, t, P.m, {});
    if (d > 0) S.dealDamage(null, u, d * 0.25, { trueDmg: true, kind: 'recoil' });
  },
  '철벽'(S, u, t, P) {
    S.hitAll(u, [t].concat(S.adjOne(u, t)), P.m, {});
    S.perma(u, 'def', P.def);
    S.shieldPct(u, P.shield, 6);
  },
  '섀도볼'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.debuff(u, o, 'spd', -1, 4, 0.5) });
  },
  '미래예지'(S, u, t, P) {
    if (!u.fsArmed) {
      u.fsArmed = true;
      S.emit({ type: 'buff', target: u.uid, kind: 'future' });
      return;
    }
    const pool = S.foesOf(u).filter(o => !o.gyaraFx);
    const picks = [];
    while (picks.length < 2 && pool.length) picks.push(pool.splice(S.rng.int(pool.length), 1)[0]);
    if (!picks.length) return;
    S.skillTarget = picks[0];
    const delay = P.delay || 1.5;
    S.emit({ type: 'vortex', uid: u.uid, targets: picks.map(o => o.uid), dur: delay });
    S.later(delay, () => {
      for (const o of picks) {
        if (!o.alive) continue;
        S.emit({ type: 'vortexpop', target: o.uid });
        S.hit(u, o, P.m, { sure: true, ignoreUp: true, special: true });
      }
      const [a, b] = picks;
      if (a && b && a.alive && b.alive) {
        const until = S.time + (P.charm || 4) * S.durMul(u);
        a.charmTo = b.uid;
        b.charmTo = a.uid;
        a.charmUntil = until;
        b.charmUntil = until;
        S.emit({ type: 'charm', targets: [a.uid, b.uid], dur: until - S.time });
      }
    });
  },
  '화염방사'(S, u, t, P) {
    const list = S.line(u, t, 3);
    S.emit({ type: 'flamebeam', uid: u.uid, target: t.uid, len: 3 });
    S.hitAll(u, list, P.m, { onHit: o => S.status(u, o, 'burn', 3, P.chance) });
  },
  '불대문자'(S, u, t, P) {
    const dense = S.densestFoe(u, 2) || t;
    const tr = dense.r;
    const tc = dense.c;
    const ax = S.axis(u, dense);
    const path = S.foesOf(u).filter(o => {
      const q = S.project(ax, o);
      return q.along > 0.2 && q.along <= ax.len + 0.3 && q.side <= 0.7;
    });
    const hitSet = new Set();
    const scorch = o => {
      if (!o.alive) return;
      S.addBurn(o, u, P.burn || 5);
      o.antiHeal = Math.max(o.antiHeal || 0, P.anti || 0.5);
      o.antiHealUntil = S.time + (P.burn || 5);
    };
    S.emit({ type: 'fireorb', uid: u.uid, r: tr, c: tc, dur: 1 });
    for (const o of path) {
      const q = S.project(ax, o);
      const at = Math.max(0.05, Math.min(1, q.along / Math.max(0.5, ax.len)));
      S.later(at, () => {
        if (!o.alive || o.hidden) return;
        hitSet.add(o);
        S.hit(u, o, P.orb || 1.5, { special: true, onHit: scorch });
      });
    }
    S.channel(u, { dur: 1, noHypno: true });
    const cell = S.grid[tr][tc] === 0 ? [tr, tc] : S.freeNear(tr, tc, u.r, u.c);
    if (cell) S.moveTo(u, cell[0], cell[1], 1);
    S.later(1, () => {
      if (!u.alive) return;
      const cr = u.r;
      const cc = u.c;
      S.emit({ type: 'firestar', uid: u.uid, r: cr, c: cc, arm: P.arm || 3 });
      for (const o of S.ring(u, cr, cc, 2)) S.stun(o, (P.stun || 1.5) * S.durMul(u), u.side, 'stun');
      const m0 = hexMetric(cr, cc);
      const arm = (P.arm || 3) + 0.3;
      const blast = S.foesOf(u).filter(o => {
        const m = hexMetric(o.r, o.c);
        const dx = m.x - m0.x;
        const dy = m.y - m0.y;
        const d = Math.hypot(dx, dy);
        if (d < 0.2) return true;
        if (d > arm) return false;
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          const along = dx * Math.cos(a) + dy * Math.sin(a);
          const side = Math.abs(dx * Math.sin(a) - dy * Math.cos(a));
          if (along > 0 && side <= 0.55) return true;
        }
        return false;
      });
      S.hitAll(u, blast, P.blast || 2.0, { special: true, onHit: scorch });
    });
  },
  '절대영도'(S, u, t, P) {
    const dense = S.densestFoe(u, P.radius || 2) || t;
    const st = S.side[u.side];
    const id = (st.blizzSeq = (st.blizzSeq || 0) + 1);
    const dur = (P.dur || 5) * S.durMul(u);
    st.blizzards.push({ id, src: u, r: dense.r, c: dense.c, radius: P.radius || 2, m: (P.m || 0.4) * S.skillScale, until: S.time + dur, acc: 0.5 });
    S.emit({ type: 'blizzard', side: u.side, id, r: dense.r, c: dense.c, radius: P.radius || 2, dur });
  },
  '생명의물방울'(S, u, t, P) {
    S.emit({ type: 'skillfx', uid: u.uid, r: u.r, c: u.c, radius: 6, kind: '물', heal: true });
    for (const a of S.alliesOf(u)) S.healAmt(u, a, a.maxHp * (P.heal || 0.25));
    S.buff(u, 'def', 2, 5);
    S.buff(u, 'spd', 2, 5);
    S.shieldPct(u, P.shield || 0.2, 0);
  },
  '드레인펀치'(S, u, t, P) {
    const d = S.hit(u, t, P.m, {});
    S.healAmt(u, u, d * 0.5);
  },
  '분노의주먹'(S, u, t, P) {
    S.hit(u, t, P.m * (1 + 0.05 * (u.rageHits || 0)), {});
  },
  '연속자르기'(S, u, t, P) {
    if (u.furyTarget === t.uid) u.furyN = Math.min(3, (u.furyN || 0) + 1);
    else u.furyN = 0;
    u.furyTarget = t.uid;
    S.hit(u, t, P.m * Math.pow(2, u.furyN), {});
  },
  '불릿펀치'(S, u, t, P) {
    for (let i = 0; i < 3 && t.alive; i++) S.hit(u, t, P.m, { sure: true });
  },
  '암석액스'(S, u, t, P) {
    S.hit(u, t, P.m, {});
    const cells = [[t.r, t.c]].concat(Hex.neighbors(t.r, t.c));
    const st = S.side[u.side];
    for (const [r, c] of cells) st.rocks.set(r * 10 + c, { src: u.uid, mult: P.rock });
    S.emit({ type: 'rocks', side: u.side, cells });
  },
  '원시의힘'(S, u, t, P) {
    S.hit(u, t, P.m, {});
    if ((u.ancientN || 0) < 3) {
      u.ancientN = (u.ancientN || 0) + 1;
      for (const k of ['atk', 'def', 'spd', 'spe']) S.perma(u, k, 1);
    }
  },
  '잠자기 각성'(S, u, t, P) {
    S.gigaCombo(u, t, P.again || 0.6, P.air2 || 1);
  },
  '물거품아리아'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 2);
    S.hitAll(u, S.ring(u, u.r, u.c, 2), P.m, {});
    for (const a of S.alliesOf(u)) {
      if (Hex.dist(u.r, u.c, a.r, a.c) > 2) continue;
      a.burnUntil = 0;
      a.poisonUntil = 0;
      a.toxicSince = 0;
    }
    S.buff(u, 'def', 2, 5);
    S.buff(u, 'spd', 2, 5);
    S.shieldPct(u, 0.3, 0);
  },
  '눈보라'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 2);
    S.hitAll(u, S.ring(u, t.r, t.c, 2), P.m, { onHit: o => S.chillN(u, o, 4) });
  },
  '오버히트'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, {});
    S.buff(u, 'spa', -2, 5);
  },
  '용성군'(S, u, t, P) {
    const n = Array.isArray(P.n) ? P.n[Math.min(P.n.length, u.star || 1) - 1] : P.n || 20;
    const dur = P.dur || 2;
    S.channel(u, { dur, noHypno: true, hidden: true });
    S.emit({ type: 'meteorcall', uid: u.uid, dur });
    for (let i = 0; i < n; i++) {
      S.later(0.15 + (i * (dur - 0.15)) / n, () => {
        if (!u.alive) return;
        const foes = S.foesOf(u).filter(o => !o.gyaraFx);
        if (!foes.length) return;
        const base = foes[S.rng.int(foes.length)];
        const cells = [[base.r, base.c]].concat(Hex.neighbors(base.r, base.c));
        const [r, c] = cells[S.rng.int(cells.length)];
        S.emit({ type: 'meteor', uid: u.uid, r, c });
        S.hitAll(u, S.ring(u, r, c, 1), P.m || 0.3, { special: false, burst: false });
      });
    }
  },
  '벌레의야단법석'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.debuff(u, o, 'spd', -1, 4) });
  },
  '기합구슬'(S, u, t, P) {
    S.channel(u, {
      dur: 1,
      noHypno: true,
      then: (unit, ch) => {
        const tg = S.aliveOr(u, t);
        if (!tg) return;
        S.skillTarget = tg;
        S.hit(u, tg, P.m * (ch.hitDuring ? 0.5 : 1), { onHit: o => S.debuff(u, o, 'spd', -1, 4) });
      }
    });
  },
  '스톤샤워'(S, u, t, P) {
    S.hitAll(u, S.cone(u, t, 2), P.m, { onHit: o => S.status(u, o, 'flinch', 1, 0.3) });
  },
  '폭풍'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { acc: -1, onHit: o => S.status(u, o, 'confuse', 2, 0.3) });
  },
  '번개'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.status(u, o, 'para', 3, 0.3) });
  },
  '병상첨병'(S, u, t, P) {
    const now = S.time;
    const bad = t.stunUntil > now || t.poisonUntil > now || t.burnUntil > now || (t.chill > 0 && t.chillUntil > now);
    S.hit(u, t, P.m * (bad ? 2 : 1), {});
  },
  '사이코키네시스'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'spd', -1, 4) });
  },
  '철제광선'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 4), P.m, {});
    S.dealDamage(null, u, u.maxHp * 0.25, { trueDmg: true, kind: 'recoil' });
  }
};

Object.assign(CombatSim.prototype, SKILL_HELPERS);
