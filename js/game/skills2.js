Object.assign(SKILL_P, {
  '고라파덕·쓱쓱': { as: 1, max: 6, as6: 0.15, vamp6: 0.2 },
  '골덕·쓱쓱': { as: 1, max: 6, as6: 0.2, vamp6: 0.25 },
  '깨비참': { m: 0.75, crit: 1 },
  '깨비드릴조': { m: 0.9, crit: 1 },
  '꼬렛': { m: 1.7, range: 3 },
  '레트라': { m: 2.0, range: 3 },
  '마그비·회오리불꽃': { k: 0.25, dur: 10, buff: 1 },
  '마그마·회오리불꽃': { k: 0.3, dur: 10, buff: 1 },
  '마그마번·회오리불꽃': { k: 0.35, dur: 10, buff: 1 },
  '모래두지·웅크리기': { red: 0.2, dur: 2, def: 1 },
  '고지·웅크리기': { red: 0.3, dur: 2, def: 1 },
  '뽀뽀라·악마의키스': { sleep: 1, heal: 0.15 },
  '루주라·악마의키스': { sleep: 2, heal: 0.35 },
  '쏘드라': { m: [2.1, 2.3, 2.6] },
  '시드라': { m: [2.3, 2.5, 2.8] },
  '킹드라': { m: [2.5, 2.7, 3.0] },
  '코일': { m: 2.15, chance: 0.2 },
  '레어코일': { m: 2.4, chance: 0.2 },
  '자포코일': { m: 2.7, chance: 0.2 },
  '콘치·아쿠아링': { heal: 0.3 },
  '왕콘치·아쿠아링': { heal: 0.35 },
  '뿔충이·마지막일침': { m: 1.5 },
  '딱충이·마지막일침': { m: 1.65 },
  '파오리·바둥바둥': { min: 1.5, max: 4.0 },
  '야돈·하품': { heal: 0.3, stacks: 2, sleep: 2 },
  '잉어킹·튀어오르기': { m: 1.6, shield: 0.5, splash: 0.5 },
  '크랩': { m: 2.0, splash: 0 },
  '킹크랩': { m: 2.4, splash: 0 },
  '포니타·불꽃세례': { m: 1.7, ring: 0, chance: 0.3 },
  '날쌩마·불꽃세례': { m: 1.9, ring: 1, chance: 0.3 },
  '피츄·100만볼트': { m: 1.9, every: 4, chance: 0.2 },
  '피카츄·100만볼트': { m: 2.1, every: 4, chance: 0.2 },
  '라이츄·100만볼트': { m: 2.4, every: 4, chance: 0.2 },
  '핑복·알낳기': { heal: 0.1 },
  '흉내내·리플렉터': { m: 1.7, red: 0.25, dur: 6, radius: 2, shield: 0.15 },
  '뚜벅쵸·꽃잎댄스': { m: 0.8, dur: 2, regen: 0.03 },
  '냄새꼬·꽃잎댄스': { m: 0.9, dur: 2, regen: 0.03 },
  '아르코': { m: 1.0, dur: 2, regen: 0.03 },
  '뿔카노': { m: 1.8, def: 1 },
  '코뿌리': { m: 2.1, def: 1 },
  '거대코뿌리': { m: 2.6, stun: 1.5, root: 2 },
  '삐': { m: 1.9, chance: 0.3 },
  '삐삐': { m: 2.15, chance: 0.3 },
  '픽시': { m: 2.5, chance: 0.3 },
  '부스터·니트로차지': { m: 1.8, range: 3 },
  '블래키·맹독': { dur: 6 },
  '이상해씨': { heal: 0.7, beam: 0.2 },
  '이상해풀': { heal: 0.7, beam: 0.25 },
  '이상해꽃': { heal: 0.7, beam: 0.3 },
  '캐이시': { m: 2.3, ring: 1, sleep: 1.5 },
  '윤겔라': { m: 2.5, ring: 1, sleep: 1.5 },
  '버터플·삼중가루': { para: 10, poison: 10, sleep: 2 },
  '파이리': { m: 2.6, chance: 0.5, splash: 0.3 },
  '리자드': { m: 2.8, chance: 0.5, splash: 0.3 },
  '리자몽': { m: 3.1, chance: 0.5, splash: 0.35 },
  '야도란': { kind: 'phys' },
  '야도킹': { kind: 'spec' },
  '또가스': { m: 0.2, chance: 0.4, dur: 5, radius: 2 },
  '또도가스': { m: 0.25, chance: 0.4, dur: 5, radius: 2 },
  '시라소몬': { m: 2.0, knock: 3, crash: 0.3 },
  '배루키·로킥': { m: 1.7, knock: 3, crash: 0.25 },
  '홍수몬': { m: 1.8, dur: 1.5, dura: 0.6 },
  '배루키·카운터': { m: 1.5, dur: 1.5, dura: 0.6 },
  '카포에라': { m: 0.3, n: 11, pas: 0.5 },
  '배루키·인파이트': { m: 0.25, n: 11, pas: 0.4 },
  '쁘사이저': { m: 2.4, pas: 0.4 },
  '왕눈해': { m: 2.0, chance: 0.1, r: 3 },
  '독파리': { m: 2.3, chance: 0.1, r: 3 },
  '질퍽이·녹기': { m: 1.6, buff: 2 },
  '질뻐기·녹기': { m: 1.9, buff: 2 },
  '찌리리공·대폭발': { base: 0.5, per: 0.04 },
  '붐볼·대폭발': { base: 0.6, per: 0.05 },
  '캥카·속이기/비장의무기': { m: 1.5, buff: 3, k2: 3.0 },
  '투구': { m: 1.9, pierce: 0.5, mana: 30, dur: 3 },
  '투구푸스': { m: 2.4, pierce: 0.5, mana: 30, dur: 3 },
  '폴리곤Z': { m: 3.0, dur: 2 },
  '식스테일': { m: 2.0, radius: 2, crit: 0.2 },
  '나인테일': { m: 2.35, radius: 2, crit: 0.2 },
  '롱스톤·헤비봄버': { m: 1.0, rock: 0.5, air: 1.5, rocks: 12 },
  '강철톤·헤비봄버': { m: 1.2, rock: 0.6, air: 1.5, rocks: 12 },
  '스라크·엄습하는일격': { m: 2.2 },
  '핫삼': { m: 0.3, n: 12 },
  '사마자르': { m: 2.0, rock: 0.5 },
  '저승갓숭': { m: 1.8, per: 0.05 },
  '후딘': { m: 2.6, delay: 3, amp: 0.3, radius: 2 }
});

const SKILLS2 = {
  '쓱쓱'(S, u, t, P) {
    if ((u.aquaN || 0) < P.max) {
      u.aquaN = (u.aquaN || 0) + 1;
      S.perma(u, 'spe', P.as);
      S.emit({ type: 'buff', target: u.uid, kind: 'aquastep', value: u.aquaN });
      if (u.aquaN >= P.max) {
        u.pct.as += P.as6;
        u.vamp += P.vamp6;
      }
    } else S.perma(u, 'spe', P.as);
  },
  '전광석화'(S, u, t, P) {
    const tg = S.farthestWithin(u, P.range || 3) || t;
    S.skillTarget = tg;
    S.dashTo(u, tg);
    S.hit(u, tg, P.m, {});
  },
  '회오리불꽃'(S, u, t, P) {
    S.buff(u, 'def', P.buff, 5);
    S.buff(u, 'spd', P.buff, 5);
    const free = o => !(o.vortexUntil > S.time);
    let tg = t && free(t) ? t : S.foesOf(u).filter(free).sort((a, b) => S.distTo(u, a) - S.distTo(u, b) || a.uid - b.uid)[0];
    if (!tg) tg = t;
    if (!tg) return;
    S.skillTarget = tg;
    tg.vortexUntil = S.time + P.dur;
    S.emit({ type: 'status', target: tg.uid, kind: 'burn' });
    const ticks = Math.round(P.dur);
    for (let i = 1; i <= ticks; i++) {
      S.later(i, () => {
        if (!tg.alive || !u.alive) return;
        const raw = (S.defense(u, false) + S.defense(u, true)) * P.k * (u.pwStar || 1);
        S.hit(u, tg, 1, { raw, special: true, sure: true, burst: i % 2 === 1 });
      });
    }
  },
  '웅크리기'(S, u, t, P) {
    S.reduce(u, u, P.red, P.dur, 'all');
    S.perma(u, 'def', P.def);
    S.emit({ type: 'buff', target: u.uid, kind: 'curl' });
  },
  '악마의키스'(S, u, t, P) {
    if (t && t.alive) {
      S.emit({ type: 'hitfx', target: t.uid, kind: '노말' });
      S.status(u, t, 'sleep', P.sleep);
    }
    S.healAmt(u, u, u.maxHp * P.heal);
  },
  '회오리'(S, u, t, P) {
    const T = S.teams[u.side];
    const scales = (T && T.scales) || 0;
    let splash = 2;
    if (scales > 6) {
      S.hitAll(u, S.line(u, t, 2), P.m[2], {});
      splash = 3;
    } else if (scales > 3) {
      S.hitAll(u, S.cone(u, t, 2), P.m[1], { onHit: o => S.status(u, o, 'para', 3, 0.3) });
    } else {
      S.ringFx(u, t.r, t.c, 1);
      S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m[0], { onHit: o => S.status(u, o, 'flinch', 1, 0.2) });
    }
    u.splashUntil = S.time + 5;
    u.splashN = splash;
  },
  '러스터캐논'(S, u, t, P) {
    let tg = t;
    let best = -1;
    for (const o of S.foesOf(u)) {
      const d = S.distTo(u, o);
      if (d > best) {
        best = d;
        tg = o;
      }
    }
    if (!tg) return;
    S.skillTarget = tg;
    S.hitAll(u, S.line(u, tg, Math.max(2, best)), P.m, { onHit: o => { if (S.chance(P.chance)) S.perma(o, 'spd', -1); } });
  },
  '아쿠아링'(S, u, t, P) {
    S.emit({ type: 'buff', target: u.uid, kind: 'aquaring' });
    for (let i = 1; i <= 4; i++) S.later(i * 0.5, () => { if (u.alive) S.healAmt(u, u, u.maxHp * P.heal / 4); });
  },
  '바둥바둥'(S, u, t, P) {
    const lost = 1 - Math.max(0, u.hp) / u.maxHp;
    S.hit(u, t, P.min + (P.max - P.min) * lost, {});
  },
  '하품'(S, u, t, P) {
    S.healAmt(u, u, (u.maxHp - u.hp) * P.heal);
    S.ringFx(u, u.r, u.c, 1);
    for (const o of S.ring(u, u.r, u.c, 1)) {
      o.yawn = (o.yawn || 0) + 1;
      S.emit({ type: 'status', target: o.uid, kind: 'yawn', value: o.yawn });
      if (o.yawn >= P.stacks) {
        o.yawn = 0;
        S.status(u, o, 'sleep', P.sleep);
      }
    }
  },
  '튀어오르기'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 1);
    S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, {});
    S.shieldPct(u, P.shield, 0);
  },
  '100만볼트'(S, u, t, P) {
    S.hit(u, t, P.m, { special: true, onHit: o => S.status(u, o, 'para', 3, P.chance) });
  },
  '하이드로캐논'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 4), P.m, {});
  },
  '꽃잎댄스'(S, u, t, P) {
    if (P.regen) u.danceRegen = Math.max(u.danceRegen || 0, P.regen);
    S.channel(u, {
      dur: P.dur,
      move: true,
      tick: () => {
        S.ringFx(u, u.r, u.c, 1);
        S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, {});
      },
      end: () => { if (!P.regen) S.addConfuse(u, 1); }
    });
  },
  '분함의발구르기'(S, u, t, P) {
    const mul = u.missFlag ? 3.5 : 1;
    u.missFlag = false;
    S.perma(u, 'def', P.def);
    S.perma(u, 'spd', P.def);
    S.ringFx(u, u.r, u.c, 1);
    const raw = S.defense(u, false) * P.m * mul * (u.pwStar || 1);
    for (const o of S.ring(u, u.r, u.c, 1)) S.hit(u, o, 1, { raw, special: false });
  },
  '암석포'(S, u, t, P) {
    if (!t) return;
    const raw = S.defense(u, false) * P.m * (u.pwStar || 1);
    let n = 0;
    const list = [t].concat(S.ring(u, t.r, t.c, 1).filter(o => o !== t));
    S.ringFx(u, t.r, t.c, 1);
    for (const o of list) {
      const d = S.hit(u, o, 1, { raw: o === t ? raw : raw * 0.5, special: false });
      if (d > 0 && o.alive && S.stun(o, P.stun, u.side, 'stun') !== 0) n += 1;
    }
    if (n) {
      S.buff(u, 'def', n, 5);
      S.buff(u, 'spd', n, 5);
    }
    u.rootUntil = S.time + P.root;
  },
  '문포스'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => { if (S.chance(P.chance)) S.perma(o, 'spa', -1); } });
  },
  '파도타기'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, S.distTo(u, t) + 2), P.m, {});
  },
  '니트로차지'(S, u, t, P) {
    let tg = null;
    for (const o of S.foesOf(u)) if (S.distTo(u, o) <= (P.range || 3) && (!tg || o.hp < tg.hp)) tg = o;
    tg = tg || t;
    S.skillTarget = tg;
    S.dashTo(u, tg);
    S.hit(u, tg, P.m, { onHit: o => { if (P.burn) S.status(u, o, 'burn', 3, P.burn); } });
    if (P.range) S.perma(u, 'spe', 1);
    else if ((u.nitroN || 0) < 3) {
      u.nitroN = (u.nitroN || 0) + 1;
      S.perma(u, 'spe', 1);
    }
  },
  '맹독'(S, u, t, P) {
    if (t && t.alive) S.addPoison(t, u, P.dur, true);
    const n = S.foesOf(u).filter(o => o.toxicSince && o.poisonUntil > S.time).length;
    if (n) {
      S.buff(u, 'def', n, 5);
      S.buff(u, 'spd', n, 5);
    }
  },
  '매혹의보이스'(S, u, t, P) {
    const list = [t].concat(S.foesOf(u).filter(o => o !== t).sort((a, b) => Hex.dist(a.r, a.c, t.r, t.c) - Hex.dist(b.r, b.c, t.r, t.c) || a.uid - b.uid).slice(0, 2));
    S.hitAll(u, list, P.m, {
      onHit: o => {
        if (['atk', 'spa', 'def', 'spd', 'spe'].some(k => S.rank(o, k) > 0)) S.status(u, o, 'confuse', 2);
      }
    });
  },
  '솔라빔'(S, u, t, P) {
    if (u.skillCount % 2 === 1) {
      S.emit({ type: 'buff', target: u.uid, kind: 'sun' });
      S.healAmt(u, u, (u.maxHp - u.hp) * P.heal);
      return;
    }
    const tg = S.densestFoe(u, 1) || t;
    if (!tg) return;
    S.skillTarget = tg;
    const raw = u.maxHp * P.beam;
    S.hitAll(u, S.line(u, tg, 8), 1, { raw, special: true });
  },
  '더블윙'(S, u, t, P) {
    u.wingN = P.n;
    u.wingM = P.m;
    S.emit({ type: 'buff', target: u.uid, kind: 'wing' });
  },
  '삼중가루'(S, u, t, P) {
    const foes = S.foesOf(u);
    const used = new Set();
    const pick = score => {
      let src = foes.filter(o => !used.has(o) && !(o.powderUntil > S.time));
      if (!src.length) src = foes.filter(o => !used.has(o));
      if (!src.length) src = foes;
      let best = null;
      for (const o of src) if (!best || score(o) > score(best)) best = o;
      if (best) used.add(best);
      return best;
    };
    const a = pick(o => S.attackSpeed(o));
    const b = pick(o => o.hp);
    const c = pick(o => o.damageDealt || 0);
    const mark = o => { o.powderUntil = S.time + 3; };
    if (a) {
      mark(a);
      S.emit({ type: 'hitfx', target: a.uid, kind: '전기' });
      S.status(u, a, 'para', P.para);
    }
    if (b) {
      mark(b);
      S.emit({ type: 'hitfx', target: b.uid, kind: '독' });
      S.status(u, b, 'poison', P.poison);
    }
    if (c) {
      mark(c);
      S.emit({ type: 'hitfx', target: c.uid, kind: '에스퍼' });
      S.status(u, c, 'sleep', P.sleep);
    }
  },
  '화염방사'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 8), P.m, { onHit: o => S.status(u, o, 'burn', 3, P.chance != null ? P.chance : 0.3) });
  },
  '자기암시'(S, u, t, P) {
    let best = null;
    let bestSum = 0;
    for (const o of S.units) {
      if (o === u || !o.alive) continue;
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
  '스모그'(S, u, t, P) {
    const c0 = S.densestFoe(u, P.radius) || t;
    if (!c0) return;
    const r = c0.r;
    const c = c0.c;
    const n = Math.round(P.dur / 0.5);
    const gen = (u.smogGen || 0) + 1;
    u.smogGen = gen;
    S.emit({ type: 'smog', uid: u.uid, r, c, radius: P.radius, dur: P.dur });
    for (let i = 0; i < n; i++) {
      S.later(i * 0.5, () => {
        if (u.smogGen !== gen || (!u.alive && i > 0)) return;
        for (const o of S.ring(u, r, c, P.radius)) {
          const poisoned = o.poisonUntil > S.time;
          S.hit(u, o, P.m * (poisoned ? 1.5 : 1), { burst: false, onHit: x => S.status(u, x, 'poison', 3, P.chance) });
        }
      });
    }
  },
  '로킥'(S, u, t, P) {
    if (!t) return;
    S.hit(u, t, P.m, {});
    if (!t.alive) return;
    const before = [t.r, t.c];
    S.knock(u, t, P.knock);
    if (t.r === before[0] && t.c === before[1]) return;
    const crash = t.maxHp * P.crash;
    for (const o of S.foesOf(u)) {
      if (o === t || Hex.dist(o.r, o.c, t.r, t.c) > 1) continue;
      S.hit(u, o, 1, { raw: crash, special: false, burst: false });
    }
  },
  '카운터'(S, u, t, P) {
    S.reduce(u, u, P.dura, P.dur, 'all');
    S.emit({ type: 'buff', target: u.uid, kind: 'shield' });
    S.later(P.dur, () => {
      if (!u.alive) return;
      const tg = S.aliveOr(u, t);
      if (!tg) return;
      S.skillTarget = tg;
      const hitSet = new Set([tg]);
      S.hit(u, tg, P.m, {});
      for (const o of S.behind(u, tg, 8)) hitSet.add(o);
      for (const o of S.ring(u, u.r, u.c, 2)) hitSet.add(o);
      S.ringFx(u, u.r, u.c, 2);
      for (const o of hitSet) if (o !== tg) S.hit(u, o, P.m, { burst: false });
    });
  },
  '인파이트'(S, u, t, P) {
    const targets = S.nearestN(u, 2);
    if (!targets.length) return;
    for (let i = 0; i < P.n; i++) {
      const o = targets[i % targets.length];
      S.later(0.06 * i, () => {
        if (!o.alive || !u.alive) return;
        S.hit(u, o, P.m, { burst: i % 3 === 0, onHit: x => S.debuff(u, x, 'def', -1, 4) });
      });
    }
  },
  '사이코쇼크'(S, u, t, P) {
    S.hit(u, t, P.m, { armor: true });
    for (const o of [t].concat(S.ring(u, t.r, t.c, 1).filter(x => x !== t))) S.debuff(u, o, 'def', -1, 4);
  },
  '시저크로스'(S, u, t, P) {
    if (u.form && u.form.name === '쁘사이저') {
      u.xCross = true;
      S.emit({ type: 'buff', target: u.uid, kind: 'xcross' });
      return;
    }
    S.hit(u, t, P.m, { crit: P.crit });
  },
  '오물웨이브'(S, u, t, P) {
    const R = P.r || 1;
    S.ringFx(u, u.r, u.c, R);
    S.hitAll(u, S.ring(u, u.r, u.c, R), P.m, { onHit: o => S.status(u, o, 'poison', 3, P.chance) });
    if (P.spd) S.buff(u, 'spd', P.spd, 5);
    if (P.buff) {
      S.buff(u, 'def', P.buff, 5);
      S.buff(u, 'spd', P.buff, 5);
    }
  },
  '녹기'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 1);
    S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, {});
    S.perma(u, 'def', P.buff);
    S.perma(u, 'spd', P.buff);
  },
  '속이기/비장의무기'(S, u, t, P) {
    if (!t) return;
    if (u.skillCount % 2 === 1) {
      u.tmp = u.tmp.filter(b => b.feint !== true);
      u.tmp.push({ k: 'def', n: P.buff, until: S.time + 999, feint: true });
      u.tmp.push({ k: 'spd', n: P.buff, until: S.time + 999, feint: true });
      S.hit(u, t, P.m, { special: false, onHit: o => S.status(u, o, 'flinch', 1) });
      return;
    }
    u.tmp = u.tmp.filter(b => b.feint !== true);
    S.dashTo(u, t);
    const raw = (S.defense(u, false) + S.defense(u, true)) * P.k2 * (u.pwStar || 1);
    S.hit(u, t, 1, { raw, special: false });
  },
  '이판사판태클'(S, u, t, P) {
    S.dashTo(u, t);
    const d = S.hit(u, t, P.m, {});
    if (d > 0) S.dealDamage(null, u, d * 0.25, { trueDmg: true, kind: 'recoil' });
    if (u.alive) S.timedShield(u, (u.maxHp - u.hp) * 0.7, 0);
  },
  '아쿠아브레이크'(S, u, t, P) {
    const kill = !!t && t.alive;
    S.hit(u, t, P.m, {
      onHit: o => {
        S.debuff(u, o, 'def', -2, P.dur || 3);
        if (P.pierce) {
          o.aquaUntil = S.time + (P.dur || 3);
          o.aquaBy = u.uid;
        }
      }
    });
    if (P.mana && kill && t && !t.alive) u.mana = Math.min(u.maxMana, u.mana + P.mana);
  },
  '파괴광선'(S, u, t, P) {
    if (!t) return;
    const ticks = 4;
    S.channel(u, {
      dur: P.dur,
      every: P.dur / ticks,
      tick: () => {
        const tg = t.alive ? t : S.aliveOr(u, t);
        if (!tg) return;
        S.hitAll(u, S.line(u, tg, 4), P.m / ticks, {});
      }
    });
  },
  '열풍'(S, u, t, P) {
    if (!P.radius) {
      S.hitAll(u, S.cone(u, t, 2), P.m, { onHit: o => S.status(u, o, 'burn', 3, P.chance) });
      return;
    }
    const c0 = S.densestFoe(u, P.radius) || t;
    if (!c0) return;
    S.skillTarget = c0;
    S.ringFx(u, c0.r, c0.c, P.radius);
    S.hitAll(u, S.ring(u, c0.r, c0.c, P.radius), P.m, {
      onHit: o => {
        o.stormUntil = S.time + 5;
        const live = o.burnUntil > S.time;
        S.addBurn(o, u, 4);
        o.burnStacks = Math.min(5, (live ? o.burnStacks || 1 : 0) + 1);
      }
    });
  },
  '불꽃엄니'(S, u, t, P) {
    let tg = t;
    for (let n = 0; n < 3 && tg; n++) {
      if (P.dash) S.dashTo(u, tg);
      S.skillTarget = tg;
      S.hit(u, tg, P.m, {
        onHit: o => {
          if (!S.chance(P.chance)) return;
          if (S.rng.next() < 0.5) S.status(u, o, 'burn', 3);
          else S.status(u, o, 'flinch', 1);
        }
      });
      if (tg.alive || !u.alive) break;
      S.emit({ type: 'buff', target: u.uid, kind: 'again' });
      tg = S.nearestEnemy(u);
    }
  },
  '헤비봄버'(S, u, t, P) {
    const c0 = S.densestFoe(u, 1) || t;
    if (!c0) return;
    S.dashTo(u, c0, 0.4);
    const raw = S.defense(u, false) * P.m * (u.pwStar || 1);
    S.later(0.4, () => {
      if (!u.alive) return;
      S.ringFx(u, u.r, u.c, 2);
      for (const o of S.foesOf(u)) S.hit(u, o, 1, { raw, special: false, burst: false, onHit: x => S.status(u, x, 'airborne', P.air) });
      const rraw = S.defense(u, true) * P.rock * (u.pwStar || 1);
      const foes = S.foesOf(u);
      for (let i = 0; i < P.rocks && foes.length; i++) {
        const o = foes[S.rng.int(foes.length)];
        S.later(0.15 + i * 0.08, () => {
          if (!o.alive) return;
          S.emit({ type: 'hitfx', target: o.uid, kind: '바위' });
          S.hit(u, o, 1, { raw: rraw, special: false, burst: false });
        });
      }
    });
  },
  '엄습하는일격'(S, u, t, P) {
    if (!t) return;
    let best = null;
    let bestD = -1;
    for (const [nr, nc] of Hex.neighbors(t.r, t.c)) {
      if (S.grid[nr][nc] !== 0) continue;
      const d = Hex.dist(u.r, u.c, nr, nc);
      if (d > bestD) {
        best = [nr, nc];
        bestD = d;
      }
    }
    if (best && !t.gyaraFx) S.moveTo(u, best[0], best[1], 0.1);
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'spa', -1, 6) });
  },
  '불릿펀치'(S, u, t, P) {
    if (!t) return;
    const raw = S.defense(u, false) * P.m * (u.pwStar || 1);
    for (let i = 0; i < (P.n || 3) && t.alive; i++) S.hit(u, t, 1, { raw, special: false, sure: true, burst: i % 4 === 0 });
  },
  '암석액스'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 2);
    S.hitAll(u, S.ring(u, u.r, u.c, 2), P.m, {});
    if (!t) return;
    const cells = [[t.r, t.c]].concat(Hex.neighbors(t.r, t.c));
    const st = S.side[u.side];
    for (const [r, c] of cells) st.rocks.set(r * 10 + c, { src: u.uid, mult: P.rock });
    S.emit({ type: 'rocks', side: u.side, cells });
  },
  '분노의주먹'(S, u, t, P) {
    if (!t) return;
    const m = P.m * (1 + (P.per || 0.05) * (u.rageHits || 0));
    const d0 = Hex.dist(u.r, u.c, t.r, t.c);
    const back = S.foesOf(u).filter(o => o !== t && Hex.dist(o.r, o.c, t.r, t.c) <= 1 && Hex.dist(u.r, u.c, o.r, o.c) >= d0);
    S.hit(u, t, m, {});
    S.hitAll(u, back, m, { burst: false });
  },
  '원시의힘'(S, u, t, P) {
    if (!t) return;
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, [t].concat(S.ring(u, t.r, t.c, 1).filter(o => o !== t)), P.m, {});
    if ((u.ancientN || 0) < 3) {
      u.ancientN = (u.ancientN || 0) + 1;
      for (const k of ['atk', 'def', 'spd', 'spe']) S.perma(u, k, 1);
    }
  },
  '미래예지'(S, u, t, P) {
    if (!t) return;
    const list = [t].concat(S.ring(u, t.r, t.c, P.radius).filter(o => o !== t && !o.gyaraFx));
    const until = S.time + P.delay;
    for (const o of list) o.fsMark = { by: u.uid, until, acc: 0, amp: P.amp, m: P.m, done: false };
    S.ringFx(u, t.r, t.c, P.radius);
    S.later(P.delay, () => {
      for (const o of list) S.futurePop(o);
    });
  }
};

Object.assign(SKILLS, SKILLS2);

const SKILL_PASSIVE = {
  initPassive(u, sk, P0) {
    if (sk === '100만볼트') {
      u.noSkill = true;
      u.voltN = 0;
    }
    if (sk === '대폭발') {
      u.noSkill = true;
      u.charge = 0;
      u.decoy = true;
    }
    if (sk === '튀어오르기') u.hopSplash = P0.splash || 0.5;
    if (sk === '화염방사' && P0.splash) u.flameSplash = P0.splash;
    if (sk === '시저크로스' && u.form && u.form.name === '쁘사이저') u.claws = P0.pas || 0.4;
    if (sk === '인파이트') u.closeCombat = P0.pas || 0.4;
    if (sk === '헤비봄버') u.ccImmuneUntil = Infinity;
    if (sk === '솔라빔') u.thickFat = true;
    if (sk === '열풍' && P0.radius) this.side[u.side].sunny = true;
    if (sk === '아쿠아브레이크' && P0.pierce) u.aquaPierce = P0.pierce;
  },

  targetersOf(u) {
    let n = 0;
    for (const o of this.units) if (o.alive && o.side !== u.side && o.target === u) n += 1;
    return n;
  },

  basicPassive(u, t, raw, o, dmg) {
    const P = u.voltN != null || u.splashUntil || u.wingN || u.xCross || u.claws || u.closeCombat || u.hopSplash || u.flameSplash || u.aquaPierce ? skillParamsOf(u.form) : null;
    if (!P) return;
    if (u.voltN != null) {
      u.voltN += 1;
      if (u.voltN >= (P.every || 4) && t.alive) {
        u.voltN = 0;
        this.emit({ type: 'skill', uid: u.uid, target: t.uid, ranged: u.ranged, special: true, name: '100만볼트' });
        this.emit({ type: 'cast', uid: u.uid, target: t.uid });
        this.skillTarget = t;
        this.hit(u, t, P.m, { special: true, onHit: x => this.status(u, x, 'para', 3, P.chance) });
      }
    }
    if (u.wingN > 0 && t.alive) {
      u.wingN -= 1;
      this.hit(u, t, u.wingM || 0.8, { special: false, burst: false });
    }
    if (u.xCross && t.alive) {
      u.xCross = false;
      this.emit({ type: 'skillfx', uid: u.uid, r: t.r, c: t.c, radius: 1, kind: '벌레' });
      this.hit(u, t, P.m, { special: false });
      for (const e of this.foesOf(u)) if (e !== t && Hex.dist(e.r, e.c, t.r, t.c) === 1) this.hit(u, e, P.m * 0.5, { special: false, burst: false });
    }
    if (u.claws && t.alive) this.dealDamage(u, t, raw * u.claws, { special: false, kind: 'basic2' });
    if (u.splashUntil > this.time) {
      const near = this.foesOf(u).filter(e => e !== t && Hex.dist(e.r, e.c, t.r, t.c) <= 2).sort((a, b) => Hex.dist(a.r, a.c, t.r, t.c) - Hex.dist(b.r, b.c, t.r, t.c) || a.uid - b.uid).slice(0, u.splashN || 2);
      for (const e of near) this.dealDamage(u, e, raw * 0.5, { special: u.special, kind: 'basic2' });
    }
    if (u.hopSplash) for (const e of this.foesOf(u)) if (e !== t && Hex.dist(e.r, e.c, u.r, u.c) <= 1) this.dealDamage(u, e, raw * u.hopSplash, { special: false, kind: 'basic2' });
    if (u.flameSplash) for (const e of this.foesOf(u)) if (e !== t && Hex.dist(e.r, e.c, t.r, t.c) === 1) this.dealDamage(u, e, raw * u.flameSplash, { special: true, kind: 'basic2' });
    if (u.closeCombat) {
      const extra = this.defense(u, false) * u.closeCombat;
      for (const e of this.foesOf(u)) if (Hex.dist(e.r, e.c, u.r, u.c) <= 1) this.dealDamage(u, e, extra, { special: false, kind: 'basic2' });
    }
    if (u.aquaPierce && t.aquaUntil > this.time && t.aquaBy === u.uid) {
      for (const e of this.behind(u, t, 1)) this.dealDamage(u, e, raw * u.aquaPierce, { special: false, kind: 'basic2' });
    }
  },

  deathPassive(t) {
    if (t.charge != null && !t.boomDone) {
      t.boomDone = true;
      const P = skillParamsOf(t.form);
      const raw = this.spaStat(t) * ((P.base || 0.5) + (P.per || 0.04) * t.charge);
      this.emit({ type: 'skillfx', uid: t.uid, r: t.deathR, c: t.deathC, radius: 8, kind: '노말' });
      this.emit({ type: 'cast', uid: t.uid, target: null });
      for (const e of this.units) if (e.alive && e.side !== t.side) this.dealDamage(t, e, raw, { special: true, kind: 'boom' });
    }
    if (t.fsMark && !t.fsMark.done && t.fsMark.until > this.time) {
      const mark = t.fsMark;
      mark.done = true;
      const src = this.byUid[mark.by];
      let best = null;
      for (const e of this.units) {
        if (!e.alive || e.side !== t.side || (e.fsMark && !e.fsMark.done && e.fsMark.until > this.time)) continue;
        if (!best || Hex.dist(e.r, e.c, t.deathR, t.deathC) < Hex.dist(best.r, best.c, t.deathR, t.deathC)) best = e;
      }
      if (best && src) {
        best.fsMark = { by: mark.by, until: this.time, acc: mark.acc, amp: mark.amp, m: mark.m, done: false };
        this.futurePop(best);
      }
    }
  },

  futurePop(o) {
    const mark = o.fsMark;
    if (!mark || mark.done || !o.alive) return;
    mark.done = true;
    const u = this.byUid[mark.by];
    if (!u) return;
    this.emit({ type: 'vortexpop', target: o.uid });
    this.hit(u, o, mark.m, { sure: true, special: true });
    if (o.alive && mark.acc > 0) this.dealDamage(u, o, mark.acc, { special: true, kind: 'skill' });
  }
};

Object.assign(CombatSim.prototype, SKILL_PASSIVE);
