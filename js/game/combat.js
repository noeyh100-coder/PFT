const TYPE_CHART = (function () {
  const T = {};
  const set = (atk, mult, list) => {
    if (!T[atk]) T[atk] = {};
    for (const d of list) T[atk][d] = mult;
  };
  set('노말', 0.5, ['바위', '강철']); set('노말', 0, ['고스트']);
  set('불꽃', 2, ['풀', '얼음', '벌레', '강철']); set('불꽃', 0.5, ['불꽃', '물', '바위', '드래곤']);
  set('물', 2, ['불꽃', '땅', '바위']); set('물', 0.5, ['물', '풀', '드래곤']);
  set('풀', 2, ['물', '땅', '바위']); set('풀', 0.5, ['불꽃', '풀', '독', '비행', '벌레', '드래곤', '강철']);
  set('전기', 2, ['물', '비행']); set('전기', 0.5, ['전기', '풀', '드래곤']); set('전기', 0, ['땅']);
  set('얼음', 2, ['풀', '땅', '비행', '드래곤']); set('얼음', 0.5, ['불꽃', '물', '얼음', '강철']);
  set('격투', 2, ['노말', '얼음', '바위', '악', '강철']); set('격투', 0.5, ['독', '비행', '에스퍼', '벌레', '페어리']); set('격투', 0, ['고스트']);
  set('독', 2, ['풀', '페어리']); set('독', 0.5, ['독', '땅', '바위', '고스트']); set('독', 0, ['강철']);
  set('땅', 2, ['불꽃', '전기', '독', '바위', '강철']); set('땅', 0.5, ['풀', '벌레']); set('땅', 0, ['비행']);
  set('비행', 2, ['풀', '격투', '벌레']); set('비행', 0.5, ['전기', '바위', '강철']);
  set('에스퍼', 2, ['격투', '독']); set('에스퍼', 0.5, ['에스퍼', '강철']); set('에스퍼', 0, ['악']);
  set('벌레', 2, ['풀', '에스퍼', '악']); set('벌레', 0.5, ['불꽃', '격투', '독', '비행', '고스트', '강철', '페어리']);
  set('바위', 2, ['불꽃', '얼음', '비행', '벌레']); set('바위', 0.5, ['격투', '땅', '강철']);
  set('고스트', 2, ['에스퍼', '고스트']); set('고스트', 0.5, ['악']); set('고스트', 0, ['노말']);
  set('드래곤', 2, ['드래곤']); set('드래곤', 0.5, ['강철']); set('드래곤', 0, ['페어리']);
  set('악', 2, ['에스퍼', '고스트']); set('악', 0.5, ['격투', '악', '페어리']);
  set('강철', 2, ['얼음', '바위', '페어리']); set('강철', 0.5, ['불꽃', '물', '전기', '강철']);
  set('페어리', 2, ['격투', '드래곤', '악']); set('페어리', 0.5, ['불꽃', '독', '강철']);
  return T;
})();

const TYPE_IMMUNE = { '노말': ['고스트'], '고스트': ['노말'], '땅': ['비행'], '전기': ['땅'] };

const MEW_MOVES = {
  '노말': '파괴광선', '드래곤': '용성군', '벌레': '벌레의야단법석', '불꽃': '불대문자', '물': '파도타기', '격투': '기합구슬',
  '바위': '스톤샤워', '땅': '대지의힘', '페어리': '문포스', '풀': '솔라빔', '비행': '폭풍', '전기': '번개',
  '고스트': '병상첨병', '에스퍼': '사이코키네시스', '악': '악의파동', '독': '오물웨이브', '강철': '철제광선', '얼음': '눈보라'
};

const ALL_TYPES = Object.keys(MEW_MOVES);

const SERPENT = { segs: 18, gap: 0.32, speed: 1.9, turn: 2.8, wave: 4.2, phase: 0.5, reach: 0.78, tick: 0.5, ratio: 0.6, yk: 0.852 };

function typeMult(atk, defTypes) {
  if (!atk) return 1;
  const row = TYPE_CHART[atk] || {};
  const immune = TYPE_IMMUNE[atk] || [];
  let m = 1;
  for (const d of defTypes) {
    if (immune.includes(d)) return 0;
    const v = d in row ? row[d] : 1;
    if (v > 1) m *= 1.2;
    else if (v < 1) m *= 5 / 6;
  }
  return m;
}

function hexMetric(r, c) {
  return { x: c + 0.5 * (r & 1), y: r * SERPENT.yk };
}

function metricCell(x, y) {
  const r = Math.max(0, Math.min(BOARD_ROWS - 1, Math.round(y / SERPENT.yk)));
  const c = Math.max(0, Math.min(BOARD_COLS - 1, Math.round(x - 0.5 * (r & 1))));
  return [r, c];
}

function rankMult(n) {
  const s = CONFIG.combat.rankStep;
  return n >= 0 ? 1 + s * n : 1 / (1 + s * -n);
}

function strongerFirst(a, b) {
  return (b.cost - a.cost) || (b.star - a.star) || (b.maxHp - a.maxHp) || (a.uid - b.uid);
}

class CombatSim {
  constructor(specsA, specsB, seed, record, teamA, teamB) {
    this.rng = new Rng(seed);
    this.record = !!record;
    this.time = 0;
    this.over = false;
    this.winner = null;
    this.units = [];
    this.byUid = {};
    this.events = [];
    this.grid = [];
    for (let r = 0; r < BOARD_ROWS; r++) this.grid.push(new Array(BOARD_COLS).fill(0));
    this.teams = { A: teamA || null, B: teamB || null };
    this.casts = 0;
    this.lastHit = false;
    this.timers = [];
    this.skillScale = 1;
    this.skillTarget = null;
    this.skillMissed = false;
    this.shadowIndex = 0;
    this.side = { A: this.newSideState(), B: this.newSideState() };
    let uid = 1;
    for (const s of specsA) this.addUnit(s, 'A', uid++);
    for (const s of specsB) this.addUnit(s, 'B', uid++);
    this.initSide('A');
    this.initSide('B');
    for (const u of this.units) this.snapshot(u);
    this.started = false;
    this.snapAcc = 0;
    this.cleanAcc = 0;
    this.checkEnd();
  }

  newSideState() {
    return {
      stats: { heal: 0, stun: 0, burn: 0, training: 0 },
      cc: 0,
      regen: 0,
      regenAcc: 0,
      fireOn: false,
      fireAcc: 0,
      seedAcc: 0,
      lightAt: 0,
      quake: 0,
      storm: null,
      stormDone: false,
      tsunamiAt: 0,
      spikes: new Set(),
      frost: false,
      shadows: 0,
      benchFree: 0,
      heartBase: 0,
      sea: null,
      seaOn: false,
      seaAcc: 0,
      slam: null,
      gold: 0,
      rocks: new Map()
    };
  }

  tier(side, id) {
    const t = this.teams[side];
    return (t && t.tiers && t.tiers[id]) || 0;
  }

  enemyOf(side) {
    return side === 'A' ? 'B' : 'A';
  }

  addUnit(spec, side, uid) {
    let r = spec.r;
    let c = spec.c;
    if (!Hex.inBounds(r, c) || this.grid[r][c] !== 0) {
      const free = this.findFreeCell(side);
      if (!free) return;
      r = free[0];
      c = free[1];
    }
    const st = spec.stats;
    const u = {
      uid,
      side,
      iid: spec.iid || null,
      unitId: spec.unitId || null,
      name: spec.name,
      types: spec.types || [],
      defTypes: (spec.types || []).slice(),
      skillType: spec.skillType || (spec.form && spec.form.skillType) || (spec.types || [])[0] || null,
      star: spec.star || 1,
      cost: spec.cost || 1,
      base: { hp: st.hp, pa: st.pa, sa: st.sa, armor: st.armor, mr: st.mr, as: st.as },
      maxHp: st.hp,
      hp: st.hp,
      special: st.special,
      range: st.range,
      ranged: st.range > 1,
      stats: st,
      creep: !!spec.creep,
      drops: spec.drops || 1,
      form: spec.form || null,
      traits: spec.traits || (spec.types || []).slice(),
      unlockOnly: !!spec.unlockOnly,
      strongDragon: !!spec.strongDragon,
      ditto: !!spec.ditto,
      mana: 0,
      maxMana: st.maxMana,
      r,
      c,
      alive: true,
      moving: false,
      moveRemain: 0,
      atkTimer: this.rng.next() * 0.3,
      target: null,
      damagers: new Set(),
      takedowns: 0,
      damageDealt: 0,
      dealtP: 0,
      dealtS: 0,
      takenP: 0,
      takenS: 0,
      healed: 0,
      deathR: r,
      deathC: c,
      rk: { atk: 0, spa: 0, def: 0, spd: 0, spe: 0, acc: 0, eva: 0, crit: 0 },
      tmp: [],
      pct: { hp: 0, pa: 0, sa: 0, armor: 0, mr: 0, as: 0 },
      flatHp: 0,
      vamp: st.omnivamp || 0,
      taken: 1,
      amp: 0,
      healMod: 0,
      shieldMod: 0,
      ppBonus: 0,
      ppRefund: 0,
      shield: 0,
      shieldPeak: 0,
      stunUntil: 0,
      frozenUntil: 0,
      frozenBy: null,
      freezeCdUntil: 0,
      chill: 0,
      chillUntil: 0,
      chillPer: 0,
      poisonUntil: 0,
      poisonSince: 0,
      toxicSince: 0,
      poisonAcc: 0,
      poisonSrc: null,
      burnUntil: 0,
      burnAcc: 0,
      burnSrc: null,
      paraUntil: 0,
      confUntil: 0,
      ppFreezeUntil: 0,
      skillAmp: 0,
      hidden: false,
      egg: false,
      eggUntil: 0,
      eggUsed: false,
      phoenix: false,
      fan: false,
      thunder: false,
      thunderAcc: -1,
      experiment: false,
      mew: false,
      mewUsed: null,
      download: false,
      heart: false,
      shadowCaster: false,
      frostExec: false,
      serpent: null,
      reduces: [],
      shieldTimed: [],
      channel: null,
      thorns: null,
      lastMissed: false,
      rageHits: 0,
      sleep: null,
      basicHeal: 0,
      spore: 0,
      sporeCd: {},
      noSkill: false,
      suggest: null,
      revivePct: 0,
      reviveUsed: false,
      reviving: false,
      reviveAt: 0,
      endure: 0,
      endureUsed: false,
      endureUntil: 0,
      bugHeal: 0,
      bugHealed: false,
      warriorShield: 0,
      warriorAmp: 0,
      warriorUsed: false,
      warriorOn: false,
      chalPer: 0,
      chalMax: 0,
      chalRank: 0,
      chal: 0,
      cavalryStun: 0,
      lastDash: null,
      skillCount: 0,
      hypno: 0,
      reflect: 0,
      chillOn: false,
      dodgePP: 0,
      flyingSkill: false,
      fairyHeal: 0,
      fairyBonus: 0,
      fairyImmune: false,
      darkGuard: 0,
      poisoner: 0,
      training: 0,
      waterPP: 0,
      waterHeal: 0,
      waterSkillAmp: 0,
      waterRefund: 0,
      waterPaired: false,
      whirlAcc: 0,
      groundDown: false,
      groundUp: false,
      eff: null
    };
    const tr = u.traits;
    if (tr.includes('실험체')) {
      u.experiment = true;
      u.maxMana = 8;
    }
    if (tr.includes('천둥의 화신')) u.thunder = true;
    if (tr.includes('열기의 화신')) u.phoenix = true;
    if (tr.includes('냉기의 화신')) u.frostExec = true;
    if (tr.includes('저주받은 그림자')) u.shadowCaster = true;
    if (tr.includes('치유의 마음')) u.heart = true;
    if (tr.includes('다운로드')) u.download = true;
    if (tr.includes('최상위 포식자')) u.serpent = {};
    if (u.form && u.form.skill === '모든 기술') {
      u.mew = true;
      u.mewUsed = new Set();
    }
    const sk = u.form && u.form.skill;
    const P0 = (u.form && typeof SKILL_P !== 'undefined' && SKILL_P[u.form.name]) || {};
    if ((sk === '깨뜨리다' || sk === '폭발펀치') && P0.heal) u.basicHeal = P0.heal;
    if (sk === '포자') {
      u.spore = P0.chance || 0.5;
      u.noSkill = true;
    }
    if (sk === '잠자기') u.sleep = { stock: 0, awake: false, P: P0 };
    this.units.push(u);
    this.byUid[uid] = u;
    this.grid[r][c] = uid;
  }

  initSide(side) {
    const T = this.teams[side];
    const units = this.units.filter(u => u.side === side);
    if (T) {
      const st = this.side[side];
      const t = id => this.tier(side, id);
      const v = (id, key) => traitVal(id, key, t(id));
      for (const id of T.normals || []) {
        const e = NORMAL_EFFECTS[id];
        if (!e) continue;
        if (e.cc) st.cc += e.cc;
        if (e.regen) st.regen += e.regen;
        for (const u of units) {
          if (e.rank) for (const k in e.rank) u.rk[k] += e.rank[k];
          if (e.healMod) u.healMod += e.healMod;
          if (e.vamp) u.vamp += e.vamp;
          if (e.pp) u.ppBonus += e.pp;
          if (e.allPct) for (const k in u.pct) u.pct[k] += e.allPct;
          if (e.hpPct) u.pct.hp += e.hpPct;
          if (e.shieldMod) u.shieldMod += e.shieldMod;
        }
      }
      const scales = T.scales || 0;
      for (const u of units) {
        const ty = id => u.types.includes(id);
        const cl = id => u.traits.includes(id);
        if (ty('강철') && t('강철')) {
          u.rk.def += v('강철', 'def');
          u.endure = v('강철', 'endure');
        }
        if (ty('바위') && t('바위')) {
          u.rk.def += v('바위', 'def');
          u.reflect = v('바위', 'reflect');
        }
        if (ty('페어리') && t('페어리')) {
          u.rk.spa += 1;
          u.fairyHeal = v('페어리', 'healPerPP');
          u.fairyBonus = v('페어리', 'healBonus');
          u.fairyImmune = t('페어리') >= 2;
        }
        if (t('얼음') && (ty('얼음') || t('얼음') >= 3)) u.chillOn = true;
        if (ty('얼음') && t('얼음')) u.rk.spd += 1;
        if (ty('전기') && t('전기')) u.rk.spe += 1;
        if (ty('풀') && t('풀') >= 2) {
          u.rk.def += 1;
          u.rk.spd += 1;
        }
        if (ty('풀')) u.pct.hp += v('풀', 'hp');
        if (ty('불꽃') && t('불꽃') >= 2) {
          u.rk.atk += 1;
          u.rk.spa += 1;
        }
        if (t('비행')) u.rk.spe += 1;
        if (ty('비행') && t('비행')) u.flyingSkill = true;
        if (ty('비행') && t('비행') >= 2) {
          u.rk.acc += 1;
          u.rk.eva += 1;
          u.dodgePP = 2;
        }
        if (ty('벌레')) {
          const bt = t('벌레');
          if (bt >= 1) {
            u.rk.atk += 1;
            u.rk.spa += 1;
            u.rk.spe += 1;
          }
          if (bt >= 2) {
            u.rk.def += 1;
            u.rk.spd += 1;
          }
          u.bugHeal = v('벌레', 'heal');
          u.pct.hp += v('벌레', 'hp');
        }
        if (t('드래곤')) u.amp += v('드래곤', 'amp') + v('드래곤', 'ampPerScale') * scales;
        if (ty('드래곤') && t('드래곤') >= 2) {
          u.rk.atk += 1;
          u.rk.spe += 1;
        }
        if (u.strongDragon && t('드래곤')) {
          const k = v('드래곤', 'strongPerScale') * scales;
          u.pct.hp += k;
          u.pct.pa += k;
          u.pct.sa += k;
        }
        if (ty('고스트') && t('고스트')) u.revivePct = v('고스트', 'hp');
        if (t('악')) u.taken *= 1 - v('악', 'reduce');
        if (ty('악') && t('악')) u.darkGuard = v('악', 'superEffective');
        if (ty('독') && t('독')) u.poisoner = t('독');
        if (ty('격투') && t('격투')) u.training = v('격투', 'gain');
        if (ty('물') && t('물')) {
          u.waterPP = 1;
          u.waterHeal = v('물', 'heal');
          u.waterSkillAmp = v('물', 'skillAmp');
          u.waterRefund = v('물', 'refund');
          u.waterPaired = t('물') >= 3 && (T.waterPairCosts || []).includes(u.cost);
        }
        if (t('전쟁기계')) u.taken *= 1 - (cl('전쟁기계') ? v('전쟁기계', 'self') : v('전쟁기계', 'all'));
        if (cl('흡수자')) u.vamp += v('흡수자', 'vamp');
        if (cl('주문술사')) u.rk.spa += v('주문술사', 'rank');
        if (cl('타격대')) u.rk.atk += v('타격대', 'rank');
        if (cl('감시자')) u.rk.spd += v('감시자', 'rank');
        if (cl('파수꾼')) u.rk.def += v('파수꾼', 'rank');
        if (cl('매복자')) u.rk.crit += v('매복자', 'rank');
        if (cl('화석')) {
          const n = v('화석', 'rank');
          u.rk.atk += n;
          u.rk.spa += n;
          u.rk.def += n;
          u.rk.spd += n;
          u.rk.spe += n;
        }
        if (cl('학살자') && t('학살자')) {
          u.warriorShield = v('학살자', 'shield');
          u.warriorAmp = v('학살자', 'amp');
        }
        if (cl('도전자') && t('도전자')) {
          u.chalPer = v('도전자', 'per');
          u.chalMax = v('도전자', 'max');
          u.chalRank = v('도전자', 'rank');
        }
        if (t('난동꾼')) {
          if (cl('난동꾼')) u.pct.hp += v('난동꾼', 'pct');
          else u.flatHp += v('난동꾼', 'flat');
        }
        if (cl('기병대')) u.cavalryStun = v('기병대', 'stun');
        if (t('선도자')) {
          u.ppBonus += v('선도자', 'pp');
          u.ppRefund += v('선도자', 'refund');
        }
        if (cl('최면술사')) u.hypno = v('최면술사', 'duration');
      }
    }
    const sst = this.side[side];
    sst.frost = units.some(u => u.frostExec);
    for (const u of units) {
      if (u.traits.includes('가족')) {
        u.rk.def += 1;
        u.rk.spd += 1;
      }
    }
    if (T) {
      sst.benchFree = T.benchFree || 0;
      sst.heartBase = T.healStack || 0;
      sst.sea = T.sea && T.sea.length ? new Set(T.sea) : null;
      sst.seaOn = !!(T.tiers && T.tiers['바다의 음유시인']);
    }
    for (const u of units) {
      u.maxHp = Math.max(1, Math.round(u.base.hp * (1 + u.pct.hp) + u.flatHp));
      u.hp = u.maxHp;
    }
    for (const u of units) if (u.serpent) this.initSerpent(u);
    if (sst.frost) this.emit({ type: 'field', side, kind: 'frost', on: true });
    if (sst.seaOn && sst.sea) this.emit({ type: 'sea', side, cells: Array.from(sst.sea) });
    if (T && this.tier(side, '물')) {
      for (const u of units) if (u.types.includes('물')) this.addShield(u, u.maxHp * traitVal('물', 'shield', this.tier(side, '물')));
    }
  }

  findFreeCell(side) {
    const rows = side === 'A' ? [7, 6, 5, 4] : [0, 1, 2, 3];
    for (const r of rows) {
      for (let c = 0; c < BOARD_COLS; c++) if (this.grid[r][c] === 0) return [r, c];
    }
    return null;
  }

  nearestFree(r, c) {
    if (this.grid[r][c] === 0) return [r, c];
    const seen = new Set([r * 10 + c]);
    const queue = [[r, c]];
    while (queue.length) {
      const [cr, cc] = queue.shift();
      for (const [nr, nc] of Hex.neighbors(cr, cc)) {
        const k = nr * 10 + nc;
        if (seen.has(k)) continue;
        seen.add(k);
        if (this.grid[nr][nc] === 0) return [nr, nc];
        queue.push([nr, nc]);
      }
    }
    return null;
  }

  emit(ev) {
    if (this.record) this.events.push(ev);
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  aliveOf(side) {
    return this.units.filter(u => u.alive && u.side === side);
  }

  canTarget(u, o) {
    return !!o && o.alive && o.side !== u.side && !o.hidden && typeMult(u.skillType, o.defTypes) > 0;
  }

  distTo(u, t) {
    if (t.serpent) return this.serpentNear(u, t)[0];
    return Hex.dist(u.r, u.c, t.r, t.c);
  }

  aimCell(u, t) {
    if (t.serpent) {
      const n = this.serpentNear(u, t);
      return [n[1], n[2]];
    }
    return [t.r, t.c];
  }

  nearestEnemy(u) {
    let best = null;
    let bestD = Infinity;
    for (const o of this.units) {
      if (!this.canTarget(u, o)) continue;
      const d = this.distTo(u, o);
      if (d < bestD || (d === bestD && best && o.uid < best.uid)) {
        best = o;
        bestD = d;
      }
    }
    return best;
  }

  setTarget(u, t) {
    const prev = u.target;
    u.target = t;
    if (!t || t === prev) return;
    if (u.download) {
      const good = ALL_TYPES.filter(ty => typeMult(ty, t.defTypes) > 1);
      const pick = good.length ? this.rng.pick(good) : this.rng.pick(ALL_TYPES);
      if (pick !== u.skillType) {
        u.skillType = pick;
        this.emit({ type: 'retype', uid: u.uid, kind: 'atk', value: pick });
      }
    }
    if (t.download && u.skillType) {
      const row = TYPE_CHART[u.skillType] || {};
      const resist = ALL_TYPES.filter(ty => row[ty] === 0.5);
      if (resist.length) {
        const pick = this.rng.pick(resist);
        t.defTypes = [pick];
        this.emit({ type: 'retype', uid: t.uid, kind: 'def', value: pick });
      }
    }
  }

  lowestRatioAlly(side) {
    let best = null;
    for (const u of this.units) {
      if (!u.alive || u.side !== side) continue;
      if (!best || u.hp / u.maxHp < best.hp / best.maxHp) best = u;
    }
    return best;
  }

  rawRank(u, k) {
    let n = u.rk[k];
    for (const b of u.tmp) if (b.k === k && b.until > this.time) n += b.n;
    if ((k === 'def' || k === 'spd') && u.poisonUntil > this.time && this.tier(this.enemyOf(u.side), '독') >= 2) n -= 1;
    if (k === 'spe' && u.chalMax && u.chal >= u.chalMax) n += u.chalRank;
    return n;
  }

  rank(u, k) {
    let n = this.rawRank(u, k);
    if (u.experiment) {
      if (k === 'spe') return -6;
      if (k === 'atk') n = Math.min(0, n);
      if (k === 'spa') n += Math.max(0, this.rawRank(u, 'atk')) + Math.max(0, this.rawRank(u, 'spe')) + u.ppBonus;
    }
    return Math.max(-6, Math.min(6, n));
  }

  atkStat(u) {
    return u.base.pa * (1 + u.pct.pa) * rankMult(this.rank(u, 'atk'));
  }

  spaStat(u) {
    const extra = u.experiment ? Math.max(0, u.pct.pa) + Math.max(0, u.pct.as) : 0;
    return u.base.sa * (1 + u.pct.sa + extra) * rankMult(this.rank(u, 'spa'));
  }

  offense(u) {
    return u.special ? this.spaStat(u) : this.atkStat(u);
  }

  defense(u, special, ignoreUp) {
    let r = this.rank(u, special ? 'spd' : 'def');
    if (ignoreUp && r > 0) r = 0;
    const b = special ? u.base.mr * (1 + u.pct.mr) : u.base.armor * (1 + u.pct.armor);
    return b * rankMult(r);
  }

  attackSpeed(u) {
    if (u.experiment) return 0.55;
    let a = u.base.as * (1 + u.pct.as) * rankMult(this.rank(u, 'spe'));
    if (u.chalPer) a *= 1 + u.chal * u.chalPer;
    if (u.chill > 0 && u.chillUntil > this.time) a *= Math.max(0.1, 1 - u.chill * u.chillPer);
    if (u.paraUntil > this.time) a *= 0.8;
    if (this.side[this.enemyOf(u.side)].frost) a *= 0.65;
    return Math.max(0.1, a);
  }

  critChance(u) {
    const t = CONFIG.combat.critTable;
    return t[Math.max(0, Math.min(t.length - 1, this.rank(u, 'crit')))];
  }

  snapshot(u) {
    u.eff = {
      pa: Math.round(this.atkStat(u)),
      sa: Math.round(this.spaStat(u)),
      armor: Math.round(this.defense(u, false)),
      mr: Math.round(this.defense(u, true)),
      basic: Math.round(this.offense(u)),
      as: Math.round(this.attackSpeed(u) * 100) / 100,
      crit: this.critChance(u),
      omnivamp: u.vamp,
      special: u.special,
      range: u.range,
      maxMana: u.maxMana,
      hp: u.maxHp,
      ranks: Object.assign({}, ...Object.keys(u.rk).map(k => ({ [k]: this.rank(u, k) })))
    };
  }

  gainPP(u, n) {
    if (!u.alive || n <= 0 || u.experiment || u.thunder || u.egg) return;
    let g = n + u.ppBonus;
    if (u.ppFreezeUntil > this.time) g *= 0.5;
    u.mana = Math.min(u.maxMana, u.mana + g);
  }

  fireReduction(u) {
    const foe = this.enemyOf(u.side);
    if (!this.side[foe].fireOn) return 0;
    return traitVal('불꽃', 'reduce', this.tier(foe, '불꽃'));
  }

  heal(t, amount, src) {
    if (!t.alive || amount <= 0) return 0;
    let a = amount * (1 + t.healMod);
    const red = this.fireReduction(t);
    if (red && !t.fairyImmune) a *= 1 - red;
    const real = Math.min(a, t.maxHp - t.hp);
    if (real <= 0) return 0;
    t.hp += real;
    (src || t).healed += real;
    this.side[t.side].stats.heal += real;
    this.emit({ type: 'heal', target: t.uid, amount: real });
    return real;
  }

  addShield(u, amount) {
    if (!u.alive || amount <= 0) return;
    let a = amount * (1 + u.shieldMod);
    const red = this.fireReduction(u);
    if (red) a *= 1 - red;
    u.shield += a;
    u.shieldPeak = Math.max(u.shieldPeak, u.shield);
  }

  stun(t, dur, bySide, kind) {
    if (!t.alive || dur <= 0) return;
    const d = dur + (bySide ? this.side[bySide].cc : 0);
    t.stunUntil = Math.max(t.stunUntil, this.time + d);
    this.emit({ type: 'stun', target: t.uid, kind: kind || 'stun', duration: d });
  }

  moveTo(u, r, c, duration) {
    const fr = u.r;
    const fc = u.c;
    let d = duration || CONFIG.combat.moveTime;
    if (this.side[this.enemyOf(u.side)].frost) d /= 0.65;
    if (this.grid[u.r][u.c] === u.uid) this.grid[u.r][u.c] = 0;
    u.r = r;
    u.c = c;
    this.grid[r][c] = u.uid;
    u.moving = true;
    u.moveRemain = d;
    this.emit({ type: 'move', uid: u.uid, fr, fc, r, c, duration: d });
    const rock = this.side[this.enemyOf(u.side)].rocks.get(r * 10 + c);
    if (rock) {
      const src = this.byUid[rock.src];
      this.dealDamage(src || null, u, (src ? this.atkStat(src) : 40) * rock.mult, { special: false, kind: 'rock' });
    }
  }

  nextStep(u, t) {
    const [tr, tc] = this.aimCell(u, t);
    const C = BOARD_COLS;
    const start = u.r * C + u.c;
    const prev = new Int16Array(BOARD_ROWS * C).fill(-1);
    prev[start] = start;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const k = queue[head++];
      const r = Math.floor(k / C);
      const c = k % C;
      if (k !== start && Hex.dist(r, c, tr, tc) <= u.range) {
        let cur = k;
        while (prev[cur] !== start) cur = prev[cur];
        return [Math.floor(cur / C), cur % C];
      }
      for (const [nr, nc] of Hex.neighbors(r, c)) {
        const nk = nr * C + nc;
        if (prev[nk] !== -1) continue;
        if (this.grid[nr][nc] !== 0) continue;
        prev[nk] = k;
        queue.push(nk);
      }
    }
    let best = null;
    let bestD = Hex.dist(u.r, u.c, tr, tc);
    for (const [nr, nc] of Hex.neighbors(u.r, u.c)) {
      if (this.grid[nr][nc] !== 0) continue;
      const d = Hex.dist(nr, nc, tr, tc);
      if (d < bestD) {
        best = [nr, nc];
        bestD = d;
      }
    }
    return best;
  }

  dash(u, t) {
    if (Hex.dist(u.r, u.c, t.r, t.c) > 1) {
      let best = null;
      let bestD = Infinity;
      for (const [nr, nc] of Hex.neighbors(t.r, t.c)) {
        if (this.grid[nr][nc] !== 0) continue;
        const d = Hex.dist(u.r, u.c, nr, nc);
        if (d < bestD) {
          best = [nr, nc];
          bestD = d;
        }
      }
      if (best) this.moveTo(u, best[0], best[1], CONFIG.combat.dashTime);
    }
    this.emit({ type: 'dash', uid: u.uid, target: t.uid });
    this.stun(t, u.cavalryStun, u.side, 'flinch');
  }

  strike(u, t, skill, mult, shadow) {
    const cfg = CONFIG.combat;
    this.lastHit = false;
    if (!skill) {
      if (u.experiment) u.mana = Math.min(u.maxMana, u.mana + 1);
      else this.gainPP(u, cfg.ppPerAttack + u.waterPP);
      if (u.chalPer && u.chal < u.chalMax) u.chal += 1;
      if (u.paraUntil > this.time && this.rng.next() < 0.2) {
        this.emit({ type: 'fail', target: u.uid, kind: 'para' });
        return 0;
      }
      if (u.confUntil > this.time && this.rng.next() < 0.2) {
        this.emit({ type: 'fail', target: u.uid, kind: 'confuse' });
        this.dealDamage(u, u, this.offense(u), { special: u.special, kind: 'confuse' });
        return 0;
      }
    }
    if (shadow) this.emit({ type: 'shadowcast', side: u.side, uid: u.uid, target: t.uid, index: shadow });
    else this.emit({ type: skill ? 'skill' : 'attack', uid: u.uid, target: t.uid, ranged: u.ranged || u.fan, special: u.special, enhanced: !!(skill && u.hypno && u.skillCount === 3), fan: !skill && u.fan });
    const diff = this.rank(u, 'acc') - this.rank(t, 'eva');
    if (diff < 0) {
      const chance = 6 / (6 - Math.max(-6, diff));
      if (this.rng.next() >= chance) {
        this.emit({ type: 'miss', target: t.uid });
        u.lastMissed = true;
        if (!skill && t.dodgePP) this.gainPP(t, t.dodgePP);
        return 0;
      }
    }
    this.lastHit = true;
    u.lastMissed = false;
    const crit = this.rng.next() < this.critChance(u);
    let raw = this.offense(u) * (skill ? cfg.skillMult * (1 + u.skillAmp) : 1) * (mult || 1);
    if (crit) raw *= cfg.critMult;
    if (diff > 0) raw *= 1 + cfg.hitBonus;
    if (skill && u.waterSkillAmp) raw *= 1 + u.waterSkillAmp;
    const o = { special: u.special, crit, kind: skill ? 'skill' : 'basic' };
    const dmg = this.dealDamage(u, t, raw, o);
    if (!skill && u.basicHeal && dmg > 0 && u.alive) this.heal(u, u.maxHp * u.basicHeal, u);
    if (!skill && u.fan) {
      const a = hexMetric(u.r, u.c);
      const b = hexMetric(t.r, t.c);
      const base = Math.atan2(b.y - a.y, b.x - a.x);
      for (const e of this.units) {
        if (e === t || !this.canTarget(u, e) || e.serpent || Hex.dist(u.r, u.c, e.r, e.c) > 3) continue;
        const q = hexMetric(e.r, e.c);
        let diffA = Math.atan2(q.y - a.y, q.x - a.x) - base;
        while (diffA > Math.PI) diffA -= Math.PI * 2;
        while (diffA < -Math.PI) diffA += Math.PI * 2;
        if (Math.abs(diffA) <= 0.62) this.dealDamage(u, e, raw, o);
      }
    }
    return dmg;
  }

  castSkill(u, t) {
    this.casts += 1;
    if (u.experiment) {
      u.mana = 0;
      u.skillCount += 1;
      this.psychoBreak(u);
      return;
    }
    if (u.serpent) {
      u.mana = 0;
      u.skillCount += 1;
      this.serpentSkill(u);
      return;
    }
    const used = u.maxMana;
    u.mana = 0;
    u.skillCount += 1;
    if (u.mew) this.mewPick(u, t);
    if (u.shadowCaster) this.summonShadows(u);
    this.skillScale = 1;
    this.shadowIndex = 0;
    this.runSkill(u, t);
    const tgt = this.skillTarget;
    if (this.lastHit && u.shadowCaster && tgt) {
      const n = this.side[u.side].shadows;
      for (let i = 0; i < n && tgt.alive; i++) {
        this.skillScale = 0.2;
        this.shadowIndex = i + 1;
        this.runSkill(u, tgt);
      }
    }
    this.skillScale = 1;
    this.shadowIndex = 0;
    if (this.side[this.enemyOf(u.side)].frost) u.ppFreezeUntil = this.time + 3;
    const refund = u.ppRefund + u.waterRefund;
    if (refund > 0 && u.alive) u.mana = Math.min(u.maxMana, used * refund);
    if (u.fairyHeal) {
      const a = this.lowestRatioAlly(u.side);
      if (a) this.heal(a, a.maxHp * u.fairyHeal * used * (1 + u.fairyBonus), u);
    }
    if (u.waterHeal) {
      for (const o of this.units) {
        if (!o.alive || Hex.dist(u.r, u.c, o.r, o.c) > 2) continue;
        if (o.side === u.side) this.heal(o, (o.maxHp - o.hp) * u.waterHeal, u);
        else o.tmp.push({ k: 'spe', n: -1, until: this.time + 2.5 });
      }
      this.emit({ type: 'wave', uid: u.uid });
    }
    if (u.flyingSkill) u.tmp.push({ k: 'spe', n: 1, until: this.time + 3 });
    if (u.types.includes('땅') && this.tier(u.side, '땅')) {
      const st = this.side[u.side];
      st.quake += 1;
      if (st.quake % traitVal('땅', 'every', this.tier(u.side, '땅')) === 0) this.quake(u.side);
    }
  }

  dealDamage(src, t, raw, o) {
    if (!t.alive || raw <= 0) return 0;
    let dmg = raw;
    if (!o.trueDmg) dmg = (raw * 100) / (100 + this.defense(t, o.armor ? false : o.special, o.crit || o.ignoreUp));
    const typed = o.kind === 'basic' || o.kind === 'skill';
    if (typed && src && src.side !== t.side) {
      const tm = typeMult(src.skillType, t.defTypes);
      if (tm <= 0) return 0;
      dmg *= tm;
    }
    if (typed && src && !o.special && src.burnUntil > this.time) dmg *= 0.8;
    if (src && src.side !== t.side) dmg *= 1 + src.amp + (src.warriorOn ? src.warriorAmp : 0);
    if (t.frozenUntil > this.time && t.frozenBy && t.frozenBy !== t.side) dmg *= 1 + traitVal('얼음', 'frozenAmp', this.tier(t.frozenBy, '얼음'));
    dmg *= t.taken;
    const red = this.damageReduction(t, o.special);
    if (red > 0) dmg *= 1 - red;
    const isHit = o.kind === 'basic' || o.kind === 'skill';
    if (isHit && t.darkGuard && src && typeMult(src.skillType, t.defTypes) > 1) dmg *= t.darkGuard;
    let absorbed = 0;
    if (t.shield > 0 && !o.ignoreShield) {
      absorbed = Math.min(t.shield, dmg);
      t.shield -= absorbed;
    }
    let hpDmg = dmg - absorbed;
    if (hpDmg >= t.hp && t.phoenix && !t.eggUsed && !t.egg) {
      t.eggUsed = true;
      t.egg = true;
      t.eggUntil = this.time + 2.5;
      t.hp = Math.max(1, t.maxHp * 0.3);
      t.shield = 0;
      t.mana = 0;
      t.stunUntil = t.eggUntil;
      t.poisonUntil = 0;
      t.burnUntil = 0;
      this.emit({ type: 'damage', target: t.uid, amount: Math.max(1, Math.round(dmg)), crit: !!o.crit, special: !!o.special, kind: o.kind });
      this.emit({ type: 'egg', uid: t.uid });
      return dmg;
    }
    if (hpDmg >= t.hp) {
      if (t.endureUntil > this.time) hpDmg = Math.max(0, t.hp - 1);
      else if (t.endure && !t.endureUsed) {
        t.endureUsed = true;
        t.endureUntil = this.time + t.endure;
        hpDmg = Math.max(0, t.hp - 1);
        this.emit({ type: 'buff', target: t.uid, kind: 'endure' });
      }
    }
    const real = Math.min(hpDmg, t.hp);
    t.hp -= real;
    const total = real + absorbed;
    if (src) {
      src.damageDealt += total;
      if (o.special) src.dealtS += total;
      else src.dealtP += total;
      t.damagers.add(src.uid);
      if (src.training) this.side[src.side].stats.training += total * src.training;
    }
    if (o.special) t.takenS += total;
    else t.takenP += total;
    this.emit({ type: 'damage', target: t.uid, amount: Math.max(1, Math.round(total)), crit: !!o.crit, special: !!o.special, kind: o.kind });
    if (src && src.alive && src.vamp > 0 && total > 0 && src.side !== t.side) this.heal(src, total * src.vamp, src);
    if (isHit) this.gainPP(t, CONFIG.combat.ppPerHit);
    if (isHit && src && src.side !== t.side) {
      if (src.chillOn) this.addChill(t, 1, src.side);
      if (src.poisoner && (o.kind === 'skill' || src.poisoner >= 3)) this.addPoison(t, src, traitVal('독', 'duration', src.poisoner), false);
    }
    if (o.kind === 'basic' && src && t.reflect && src.alive) this.dealDamage(t, src, total * t.reflect, { trueDmg: true, kind: 'reflect' });
    if (t.hp <= 0) {
      this.kill(t, o.kind);
      return total;
    }
    if (src && src.frostExec && src.side !== t.side && t.hp <= t.maxHp * 0.12) {
      this.emit({ type: 'freeze', target: t.uid, duration: 0.6 });
      this.execute(t, src.side);
      return total;
    }
    if (isHit) {
      if (t.channel) t.channel.hitDuring = true;
      if (t.form && t.form.skill === '분노의주먹') t.rageHits += 1;
      if (t.sleep && !t.sleep.awake) {
        t.sleep.stock += t.maxHp * 0.005;
        if (t.hp < t.maxHp * 0.4) this.sleepWake(t);
      }
    }
    if (isHit && src && src.side !== t.side && src.alive) {
      if (t.thorns && t.thorns.until > this.time) {
        if (t.thorns.reflect) this.dealDamage(t, src, total * t.thorns.reflect, { special: true, kind: 'thorns' });
        if (t.thorns.flat && o.kind === 'basic' && src.alive) {
          this.dealDamage(t, src, this.atkStat(t) * t.thorns.flat, { special: false, kind: 'thorns' });
          this.addPoison(src, t, 3, false);
        }
      }
      if (o.kind === 'basic' && t.spore && src.alive && (t.sporeCd[src.uid] || 0) <= this.time && this.rng.next() < t.spore) {
        t.sporeCd[src.uid] = this.time + 6;
        const k = this.rng.int(3);
        if (k === 0) this.stun(src, 1, t.side, 'sleep');
        else if (k === 1) this.addPoison(src, t, 3, false);
        else this.addPara(src, 2);
      }
    }
    if (t.bugHeal && !t.bugHealed && t.hp <= t.maxHp / 2) {
      t.bugHealed = true;
      this.heal(t, (t.maxHp - t.hp) * t.bugHeal, t);
      this.emit({ type: 'buff', target: t.uid, kind: 'bug' });
    }
    if (t.warriorShield && !t.warriorUsed && t.hp <= t.maxHp * 0.4) {
      t.warriorUsed = true;
      t.warriorOn = true;
      this.addShield(t, (t.maxHp - t.hp) * t.warriorShield);
      this.emit({ type: 'buff', target: t.uid, kind: 'warrior' });
    }
    return total;
  }

  damageReduction(t, special) {
    let red = 0;
    for (const r of t.reduces) {
      if (r.until <= this.time) continue;
      if (r.kind === 'all' || (r.kind === 'phys' && !special) || (r.kind === 'spec' && special)) red += r.pct;
    }
    if (t.suggest && ((t.suggest === 'phys' && !special) || (t.suggest === 'spec' && special))) {
      let up = 0;
      for (const k of ['atk', 'spa', 'def', 'spd', 'spe', 'acc', 'eva', 'crit']) up += Math.max(0, this.rank(t, k));
      red += 0.05 * up;
    }
    return Math.min(0.8, red);
  }

  kill(t, kind) {
    if (!t.alive) return;
    t.egg = false;
    if (t.channel) {
      t.channel = null;
      t.hidden = false;
    }
    t.hp = 0;
    t.alive = false;
    t.moving = false;
    t.shield = 0;
    t.deathR = t.r;
    t.deathC = t.c;
    if (this.grid[t.r][t.c] === t.uid) this.grid[t.r][t.c] = 0;
    for (const d of t.damagers) {
      const k = this.byUid[d];
      if (k) k.takedowns += 1;
    }
    this.emit({ type: 'death', uid: t.uid, execute: kind === 'execute' });
    const foe = this.enemyOf(t.side);
    if (t.frozenUntil > this.time && t.frozenBy === foe && traitVal('얼음', 'explode', this.tier(foe, '얼음')) > 0) this.iceExplode(t, foe, 0);
    if (this.tier(foe, '독') >= 4 && t.poisonUntil > this.time) this.addSpikes(foe, t.deathR, t.deathC);
    if (t.heart) this.heartBurst(t);
    if (t.types.includes('비행')) {
      const s = this.side[t.side].storm;
      if (s) {
        s.radius += 1;
        s.power *= 1 + traitVal('비행', 'growth', this.tier(t.side, '비행'));
        this.emit({ type: 'storm', side: t.side, r: s.r, c: s.c, radius: s.radius, grow: true });
      }
    }
    if (t.revivePct && !t.reviveUsed) {
      t.reviveUsed = true;
      t.reviving = true;
      t.reviveAt = this.time + traitVal('고스트', 'delay', this.tier(t.side, '고스트'));
    }
  }

  execute(t, bySide) {
    if (!t.alive) return;
    this.emit({ type: 'damage', target: t.uid, amount: Math.max(1, Math.round(t.hp + t.shield)), crit: false, special: false, kind: 'execute' });
    this.kill(t, 'execute');
  }

  revive(u) {
    const cell = this.nearestFree(u.deathR, u.deathC);
    u.reviving = false;
    if (!cell) return;
    u.alive = true;
    u.hp = u.maxHp * u.revivePct;
    u.mana = 0;
    u.shield = 0;
    u.stunUntil = 0;
    u.frozenUntil = 0;
    u.chill = 0;
    u.poisonUntil = 0;
    u.toxicSince = 0;
    u.burnUntil = 0;
    u.paraUntil = 0;
    u.confUntil = 0;
    u.channel = null;
    u.hidden = false;
    u.reduces = [];
    u.shieldTimed = [];
    u.target = null;
    u.moving = false;
    u.damagers = new Set();
    u.r = cell[0];
    u.c = cell[1];
    this.grid[u.r][u.c] = u.uid;
    this.emit({ type: 'revive', uid: u.uid });
  }

  addChill(t, n, side) {
    if (!t.alive) return;
    const tier = Math.max(1, this.tier(side, '얼음'));
    const max = traitVal('얼음', 'maxStack', tier) || 10;
    if (t.chillUntil < this.time) t.chill = 0;
    t.chill = Math.min(max, t.chill + n);
    t.chillUntil = this.time + traitVal('얼음', 'duration', tier);
    t.chillPer = traitVal('얼음', 'asPerStack', tier);
    if (t.chill >= max && this.time >= t.freezeCdUntil) {
      const d = traitVal('얼음', 'freeze', tier) + this.side[side].cc;
      t.frozenUntil = this.time + d;
      t.frozenBy = side;
      t.freezeCdUntil = this.time + traitVal('얼음', 'cooldown', tier);
      t.stunUntil = Math.max(t.stunUntil, t.frozenUntil);
      this.emit({ type: 'freeze', target: t.uid, duration: d });
    }
  }

  iceExplode(center, side, depth) {
    const tier = this.tier(side, '얼음');
    const crit = tier >= 3;
    const raw = center.maxHp * traitVal('얼음', 'explode', tier) * (crit ? CONFIG.combat.critMult : 1);
    const stacks = center.chill;
    const r = center.alive ? center.r : center.deathR;
    const c = center.alive ? center.c : center.deathC;
    center.chill = 0;
    const victims = this.units.filter(o => o.alive && o.side === center.side && o !== center && Hex.dist(o.r, o.c, r, c) <= 1);
    this.emit({ type: 'explode', r, c });
    const share = victims.length ? Math.ceil(stacks / victims.length) : 0;
    const max = traitVal('얼음', 'maxStack', tier) || 10;
    for (const v of victims) {
      this.dealDamage(null, v, raw, { special: true, crit, kind: 'ice' });
      if (!v.alive || share <= 0) continue;
      const before = v.chill;
      this.addChill(v, share, side);
      if (crit && depth < 3 && v.alive && before < max && v.chill >= max) this.iceExplode(v, side, depth + 1);
    }
  }

  addPoison(t, src, dur, toxic) {
    if (!t.alive || t.egg) return;
    const now = this.time;
    if (t.poisonUntil <= now) {
      t.poisonSince = now;
      t.poisonAcc = 0;
      t.toxicSince = 0;
    }
    t.poisonUntil = Math.max(t.poisonUntil, now + (dur || 3));
    if (src) t.poisonSrc = src.uid;
    if (toxic && !t.toxicSince) {
      t.toxicSince = now;
      this.emit({ type: 'status', target: t.uid, kind: 'toxic' });
    }
  }

  addBurn(t, src, dur) {
    if (!t.alive || t.egg) return;
    if (t.burnUntil <= this.time) t.burnAcc = 0;
    t.burnUntil = Math.max(t.burnUntil, this.time + (dur || 3));
    if (src) t.burnSrc = src.uid;
    this.emit({ type: 'status', target: t.uid, kind: 'burn' });
  }

  addPara(t, dur) {
    if (!t.alive || t.egg) return;
    t.paraUntil = Math.max(t.paraUntil, this.time + (dur || 3));
    this.emit({ type: 'status', target: t.uid, kind: 'para' });
  }

  addConfuse(t, dur) {
    if (!t.alive || t.egg) return;
    t.confUntil = Math.max(t.confUntil, this.time + (dur || 3));
    this.emit({ type: 'status', target: t.uid, kind: 'confuse' });
  }

  heartBurst(t) {
    const st = this.side[t.side];
    const stack = st.heartBase + st.stats.heal;
    const amount = stack * 0.03;
    if (amount <= 0) return;
    this.emit({ type: 'heart', side: t.side, uid: t.uid });
    for (const a of this.aliveOf(t.side)) this.heal(a, Math.min(amount, a.maxHp * 0.5), null);
  }

  summonShadows(u) {
    const st = this.side[u.side];
    const add = Math.min(2, Math.max(0, st.benchFree - st.shadows));
    if (add <= 0) return;
    st.shadows += add;
    this.emit({ type: 'shadow', side: u.side, uid: u.uid, count: st.shadows });
  }

  mewPick(u, t) {
    if (u.mewUsed.size >= ALL_TYPES.length) u.mewUsed.clear();
    let best = null;
    let bestM = -1;
    for (const ty of ALL_TYPES) {
      if (u.mewUsed.has(ty)) continue;
      const m = typeMult(ty, t.defTypes) + this.rng.next() * 0.01;
      if (m > bestM) {
        bestM = m;
        best = ty;
      }
    }
    u.mewUsed.add(best);
    u.skillType = best;
    this.emit({ type: 'retype', uid: u.uid, kind: 'mew', value: best, move: MEW_MOVES[best] });
  }

  psychoBreak(u) {
    const foes = this.aliveOf(this.enemyOf(u.side)).filter(e => !e.hidden);
    for (const e of foes) this.stun(e, 2, u.side, 'airborne');
    this.side[u.side].slam = { at: this.time + 2, src: u };
    this.emit({ type: 'psywave', side: u.side, uid: u.uid, targets: foes.map(e => e.uid) });
  }

  slamDown(src, side) {
    const pct = Math.min(0.6, this.spaStat(src) * 0.0005);
    const foes = this.aliveOf(this.enemyOf(side)).filter(e => !e.hidden);
    this.emit({ type: 'slam', side, targets: foes.map(e => e.uid) });
    for (const e of foes) this.dealDamage(src, e, e.maxHp * pct, { special: true, kind: 'skill' });
  }

  tickThunder(u, dt) {
    if (u.stunUntil > this.time) return;
    const iv = 5 / Math.max(0.2, this.attackSpeed(u) / u.base.as);
    if (u.thunderAcc < 0) u.thunderAcc = iv - 0.3;
    u.thunderAcc += dt;
    u.mana = Math.min(u.maxMana, (u.thunderAcc / iv) * u.maxMana);
    if (u.thunderAcc < iv) return;
    u.thunderAcc = 0;
    u.mana = 0;
    this.casts += 1;
    u.skillCount += 1;
    const foes = this.units.filter(o => this.canTarget(u, o)).sort((a, b) => (b.mana / b.maxMana) - (a.mana / a.maxMana) || a.uid - b.uid).slice(0, 3);
    if (!foes.length) return;
    this.emit({ type: 'lightning', side: u.side, targets: foes.map(e => e.uid) });
    let burned = 0;
    for (const e of foes) {
      this.dealDamage(u, e, this.spaStat(u) * 2 * (1 + u.skillAmp), { special: true, kind: 'skill' });
      if (!e.alive) continue;
      const b = e.mana * 0.4;
      e.mana -= b;
      burned += b;
      this.stun(e, 1.5, u.side, 'stun');
    }
    if (burned > 0) {
      const gain = burned * 0.5 * 0.03;
      u.pct.sa += gain;
      u.pct.as += gain;
      this.emit({ type: 'buff', target: u.uid, kind: 'thunder' });
    }
  }

  hatch(u) {
    u.egg = false;
    u.hp = u.maxHp;
    u.stunUntil = 0;
    u.skillAmp += 0.5;
    u.fan = true;
    u.range = 3;
    u.ranged = true;
    const foes = this.aliveOf(this.enemyOf(u.side));
    this.emit({ type: 'hatch', uid: u.uid, side: u.side });
    for (const e of foes) {
      this.stun(e, 1.5, u.side, 'airborne');
      const m = typeMult('불꽃', e.defTypes) || 1;
      this.dealDamage(u, e, this.spaStat(u) * 2.5 * m, { special: true, kind: 'phoenix' });
    }
  }

  initSerpent(u) {
    const a = hexMetric(u.r, u.c);
    const ang = u.side === 'A' ? -Math.PI / 2 : Math.PI / 2;
    const S = { x: a.x, y: a.y, ang, trail: [], segs: [], mode: 'swim', modeT: 0, wp: null, leg: 0, contactAcc: 0, impact: null, center: null };
    for (let i = 0; i < 90; i++) S.trail.push({ x: a.x - Math.cos(ang) * i * 0.08, y: a.y - Math.sin(ang) * i * 0.08 });
    u.serpent = S;
    if (this.grid[u.r][u.c] === u.uid) this.grid[u.r][u.c] = 0;
    this.updateSerpentSegs(u);
    this.emit({ type: 'flood', side: u.side, uid: u.uid });
  }

  updateSerpentSegs(u) {
    const S = u.serpent;
    const tr = S.trail;
    const segs = [];
    let want = 0;
    let acc = 0;
    for (let i = 0; i < tr.length && segs.length < SERPENT.segs; i++) {
      if (i > 0) {
        const d = Math.hypot(tr[i].x - tr[i - 1].x, tr[i].y - tr[i - 1].y);
        while (segs.length < SERPENT.segs && acc + d >= want) {
          const k = d > 0 ? (want - acc) / d : 0;
          segs.push({ x: tr[i - 1].x + (tr[i].x - tr[i - 1].x) * k, y: tr[i - 1].y + (tr[i].y - tr[i - 1].y) * k });
          want += SERPENT.gap;
        }
        acc += d;
      } else {
        segs.push({ x: tr[0].x, y: tr[0].y });
        want = SERPENT.gap;
      }
    }
    while (segs.length < SERPENT.segs) segs.push(Object.assign({}, segs[segs.length - 1]));
    const swim = S.mode === 'swim';
    segs.forEach((g, i) => {
      g.h = swim ? Math.sin(this.time * SERPENT.wave - i * SERPENT.phase) : -1;
      const cell = metricCell(g.x, g.y);
      g.r = cell[0];
      g.c = cell[1];
    });
    S.segs = segs;
    const head = metricCell(S.x, S.y);
    u.r = head[0];
    u.c = head[1];
    u.hidden = !(swim && segs.some(g => g.h > 0));
  }

  serpentNear(o, s) {
    let best = [Infinity, s.r, s.c];
    for (const g of s.serpent.segs || []) {
      if (g.h <= 0) continue;
      const d = Hex.dist(o.r, o.c, g.r, g.c);
      if (d < best[0]) best = [d, g.r, g.c];
    }
    return best;
  }

  clusterPoint(foes) {
    let best = null;
    let bestN = -1;
    for (const e of foes) {
      const n = foes.filter(o => Hex.dist(e.r, e.c, o.r, o.c) <= 2).length;
      if (n > bestN) {
        bestN = n;
        best = e;
      }
    }
    return best ? hexMetric(best.r, best.c) : null;
  }

  clampMetric(p) {
    return { x: Math.max(0.2, Math.min(BOARD_COLS - 0.3, p.x)), y: Math.max(0.15, Math.min((BOARD_ROWS - 1) * SERPENT.yk - 0.1, p.y)) };
  }

  tickSerpent(u, dt) {
    const S = u.serpent;
    S.modeT += dt;
    const foes = this.aliveOf(this.enemyOf(u.side)).filter(e => !e.serpent);
    if (S.mode === 'swim') {
      if (u.stunUntil <= this.time) {
        if (!S.wp || Math.hypot(S.wp.x - S.x, S.wp.y - S.y) < 0.6) {
          const c = (foes.length ? this.clusterPoint(foes) : null) || { x: (BOARD_COLS - 0.5) / 2, y: 3.5 * SERPENT.yk };
          const goRight = S.wp ? S.wp.x < (BOARD_COLS - 0.5) / 2 : S.x < (BOARD_COLS - 0.5) / 2;
          S.wp = this.clampMetric({ x: goRight ? BOARD_COLS - 0.4 : 0.1, y: c.y + (this.rng.next() - 0.5) * 0.8 });
        }
        let diff = Math.atan2(S.wp.y - S.y, S.wp.x - S.x) - S.ang;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = SERPENT.turn * dt;
        S.ang += Math.max(-turn, Math.min(turn, diff));
        const nx = S.x + Math.cos(S.ang) * SERPENT.speed * dt;
        const ny = S.y + Math.sin(S.ang) * SERPENT.speed * dt;
        const cl = this.clampMetric({ x: nx, y: ny });
        S.x = cl.x;
        S.y = cl.y;
        S.trail.unshift({ x: S.x, y: S.y });
        if (S.trail.length > 160) S.trail.length = 160;
        S.contactAcc += dt;
        if (S.contactAcc >= SERPENT.tick) {
          S.contactAcc -= SERPENT.tick;
          this.serpentContact(u, foes);
        }
      }
      this.updateSerpentSegs(u);
      if (u.mana >= u.maxMana && u.stunUntil <= this.time) this.castSkill(u, null);
      return;
    }
    if (S.mode === 'dive' && S.modeT >= 1) {
      S.mode = 'rise';
      S.modeT = 0;
      S.center = { x: (BOARD_COLS - 0.5) / 2, y: 3.5 * SERPENT.yk };
      S.x = S.center.x;
      S.y = S.center.y;
      const [cr, cc] = metricCell(S.x, S.y);
      for (const e of foes) {
        const m = hexMetric(e.r, e.c);
        if (Math.hypot(m.x - S.x, m.y - S.y) <= 2.1) this.stun(e, 2, u.side, 'airborne');
      }
      this.emit({ type: 'serpent', uid: u.uid, mode: 'rise', r: cr, c: cc });
    } else if (S.mode === 'rise' && S.modeT >= 0.6) {
      S.mode = 'sky';
      S.modeT = 0;
      let best = null;
      let bestN = -1;
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          const m = hexMetric(r, c);
          const n = foes.filter(e => {
            const q = hexMetric(e.r, e.c);
            return Math.hypot(q.x - m.x, q.y - m.y) <= 3;
          }).length;
          if (n > bestN) {
            bestN = n;
            best = [r, c];
          }
        }
      }
      S.impact = best;
      this.emit({ type: 'serpent', uid: u.uid, mode: 'sky', r: best[0], c: best[1] });
    } else if (S.mode === 'sky' && S.modeT >= 0.8) {
      const m = hexMetric(S.impact[0], S.impact[1]);
      S.x = m.x;
      S.y = m.y;
      S.mode = 'swim';
      S.modeT = 0;
      S.wp = null;
      S.leg = 1;
      S.trail = [];
      for (let i = 0; i < 90; i++) S.trail.push({ x: m.x - Math.cos(S.ang) * i * 0.08, y: m.y - Math.sin(S.ang) * i * 0.08 });
      this.emit({ type: 'splash', uid: u.uid, r: S.impact[0], c: S.impact[1] });
      const cfg = CONFIG.combat;
      for (const e of foes) {
        const q = hexMetric(e.r, e.c);
        if (Math.hypot(q.x - m.x, q.y - m.y) > 3) continue;
        const crit = this.rng.next() < this.critChance(u);
        this.dealDamage(u, e, this.offense(u) * 2.15 * (1 + u.skillAmp) * (crit ? cfg.critMult : 1), { special: u.special, crit, kind: 'skill' });
      }
    }
    this.updateSerpentSegs(u);
  }

  serpentContact(u, foes) {
    let any = false;
    const cfg = CONFIG.combat;
    for (const e of foes) {
      if (!e.alive || typeMult(u.skillType, e.defTypes) <= 0) continue;
      const q = hexMetric(e.r, e.c);
      if (!u.serpent.segs.some(g => g.h > 0.1 && Math.hypot(g.x - q.x, g.y - q.y) <= SERPENT.reach)) continue;
      const crit = this.rng.next() < this.critChance(u);
      this.dealDamage(u, e, this.offense(u) * SERPENT.ratio * (crit ? cfg.critMult : 1), { special: u.special, crit, kind: 'basic' });
      any = true;
    }
    if (any) this.gainPP(u, 1);
  }

  serpentSkill(u) {
    const S = u.serpent;
    S.mode = 'dive';
    S.modeT = 0;
    this.emit({ type: 'serpent', uid: u.uid, mode: 'dive' });
    this.updateSerpentSegs(u);
  }

  addSpikes(side, r, c) {
    const st = this.side[side];
    const cells = [[r, c]].concat(Hex.neighbors(r, c));
    for (const [cr, cc] of cells) st.spikes.add(cr * 10 + cc);
    this.emit({ type: 'spikes', side, cells });
  }

  quake(side) {
    const tier = this.tier(side, '땅');
    const foe = this.enemyOf(side);
    const targets = this.aliveOf(foe).filter(e => !e.groundDown).sort(strongerFirst).slice(0, 2);
    for (const e of targets) {
      e.groundDown = true;
      e.rk.def -= 1;
      const s = traitVal('땅', 'stun', tier);
      if (s) this.stun(e, s, side, 'quake');
    }
    const exec = traitVal('땅', 'execute', tier);
    if (exec) {
      for (const e of this.aliveOf(foe)) if (e.hp < e.maxHp * exec) this.execute(e, side);
      for (const a of this.aliveOf(side).filter(x => !x.groundUp).sort(strongerFirst).slice(0, 2)) {
        a.groundUp = true;
        a.rk.def += 1;
      }
    }
    this.emit({ type: 'quake', side, targets: targets.map(e => e.uid) });
  }

  tickSide(side, dt) {
    const T = this.teams[side];
    const st = this.side[side];
    if (st.slam && this.time >= st.slam.at) {
      const s = st.slam;
      st.slam = null;
      this.slamDown(s.src, side);
    }
    if (st.seaOn && st.sea) {
      st.seaAcc += dt;
      while (st.seaAcc >= 2) {
        st.seaAcc -= 2;
        for (const a of this.aliveOf(side)) {
          if (a.serpent || !st.sea.has(a.r * 10 + a.c)) continue;
          this.gainPP(a, 1);
          this.heal(a, (a.maxHp - a.hp) * 0.05, null);
        }
      }
    }
    if (!T) return;
    const foe = this.enemyOf(side);
    const ft = this.tier(side, '불꽃');
    if (ft && this.time >= traitVal('불꽃', 'start', ft)) {
      if (!st.fireOn) {
        st.fireOn = true;
        st.fireAcc = 0;
        this.emit({ type: 'field', side, kind: 'fire', on: true });
      }
      st.fireAcc += dt;
      while (st.fireAcc >= 1) {
        st.fireAcc -= 1;
        const pct = traitVal('불꽃', 'pct', ft);
        for (const e of this.aliveOf(foe)) st.stats.burn += this.dealDamage(null, e, e.maxHp * pct, { trueDmg: true, kind: 'fire' });
      }
    }
    const gt = this.tier(side, '풀');
    if (gt) {
      st.seedAcc += dt;
      while (st.seedAcc >= 1) {
        st.seedAcc -= 1;
        let total = 0;
        const pct = traitVal('풀', 'drain', gt);
        for (const e of this.aliveOf(foe)) total += this.dealDamage(null, e, e.maxHp * pct, { trueDmg: true, kind: 'seed' });
        const a = this.lowestRatioAlly(side);
        if (a && total > 0) this.heal(a, total, null);
      }
    }
    if (st.regen) {
      st.regenAcc += dt;
      while (st.regenAcc >= 1) {
        st.regenAcc -= 1;
        for (const a of this.aliveOf(side)) this.heal(a, a.maxHp * st.regen, null);
      }
    }
    const et = this.tier(side, '전기');
    if (et) {
      const iv = traitVal('전기', 'interval', et);
      if (!st.lightAt) st.lightAt = iv;
      if (this.time >= st.lightAt) {
        st.lightAt += iv;
        const sparks = this.aliveOf(side).filter(u => u.types.includes('전기'));
        const enemies = this.aliveOf(foe);
        if (sparks.length && enemies.length) {
          const crit = traitVal('전기', 'crit', et) > 0;
          const raw = Math.max(...sparks.map(u => this.spaStat(u))) * traitVal('전기', 'ratio', et) * (crit ? CONFIG.combat.critMult : 1);
          this.emit({ type: 'lightning', side, targets: enemies.map(e => e.uid) });
          for (const e of enemies) {
            this.dealDamage(null, e, raw, { special: true, crit, kind: 'lightning' });
            if (e.alive) {
              this.stun(e, traitVal('전기', 'stun', et), side, 'lightning');
              st.stats.stun += 1;
            }
          }
        }
      }
    }
    const fl = this.tier(side, '비행');
    if (fl >= 3) {
      if (!st.storm) {
        st.storm = { r: side === 'A' ? 3 : 4, c: 3, radius: traitVal('비행', 'stormRadius', fl), power: 1, moveAcc: 0, tickAcc: 0 };
        this.emit({ type: 'storm', side, r: st.storm.r, c: st.storm.c, radius: st.storm.radius });
      }
      const s = st.storm;
      const enemies = this.aliveOf(foe);
      s.moveAcc += dt;
      if (s.moveAcc >= 1 && enemies.length) {
        s.moveAcc -= 1;
        const score = (r, c) => enemies.reduce((sum, e) => sum + Hex.dist(r, c, e.r, e.c), 0);
        let best = [s.r, s.c];
        let bestScore = score(s.r, s.c);
        for (const [nr, nc] of Hex.neighbors(s.r, s.c)) {
          const sc = score(nr, nc);
          if (sc < bestScore) {
            best = [nr, nc];
            bestScore = sc;
          }
        }
        if (best[0] !== s.r || best[1] !== s.c) {
          s.r = best[0];
          s.c = best[1];
          this.emit({ type: 'storm', side, r: s.r, c: s.c, radius: s.radius });
        }
      }
      s.tickAcc += dt;
      while (s.tickAcc >= 0.5) {
        s.tickAcc -= 0.5;
        const pct = traitVal('비행', 'stormPct', fl) * s.power;
        for (const e of this.aliveOf(foe)) {
          const d = Hex.dist(s.r, s.c, e.r, e.c);
          if (d > s.radius) continue;
          const f = Math.max(0, 1 - 0.3 * d);
          if (f > 0) this.dealDamage(null, e, e.maxHp * pct * f, { trueDmg: true, kind: 'storm' });
        }
      }
      const ex = traitVal('비행', 'execute', fl);
      if (ex && !st.stormDone && this.time >= ex) {
        st.stormDone = true;
        this.emit({ type: 'storm', side, r: s.r, c: s.c, radius: 9, finale: true });
        for (const e of this.aliveOf(foe)) this.execute(e, side);
      }
    }
    const wt = this.tier(side, '물');
    if (wt >= 3) {
      for (const u of this.aliveOf(side)) {
        if (!u.waterPaired) continue;
        u.whirlAcc += dt;
        if (u.whirlAcc < traitVal('물', 'whirlEvery', wt)) continue;
        u.whirlAcc = 0;
        const center = u.target && u.target.alive ? u.target : this.nearestEnemy(u);
        if (!center) continue;
        const raw = u.maxMana * 2 * traitVal('물', 'whirlPerPP', wt) * this.spaStat(u);
        this.emit({ type: 'whirl', side, r: center.r, c: center.c });
        for (const e of this.aliveOf(foe)) {
          if (Hex.dist(center.r, center.c, e.r, e.c) <= 1) this.dealDamage(u, e, raw, { special: true, kind: 'whirl' });
        }
      }
    }
    if (wt >= 4 && this.time >= st.tsunamiAt) {
      st.tsunamiAt += 10;
      const enemies = this.aliveOf(foe);
      this.emit({ type: 'tsunami', side });
      for (const e of enemies) {
        this.stun(e, 2, side, 'airborne');
        this.dealDamage(null, e, e.maxHp * traitVal('물', 'tsunami', wt), { trueDmg: true, crit: true, kind: 'tsunami' });
      }
    }
  }

  tickUnits(dt) {
    for (const u of this.units) {
      if (u.reviving && this.time >= u.reviveAt) this.revive(u);
      if (!u.alive) continue;
      if (u.egg && this.time >= u.eggUntil) this.hatch(u);
      if (u.shieldTimed.length) {
        const keep = [];
        for (const s of u.shieldTimed) {
          if (s.until <= this.time) u.shield = Math.max(0, u.shield - s.amt);
          else keep.push(s);
        }
        u.shieldTimed = keep;
      }
      const foe = this.enemyOf(u.side);
      if (u.poisonUntil > 0) {
        if (u.poisonUntil <= this.time) {
          u.poisonUntil = 0;
          u.poisonAcc = 0;
          u.toxicSince = 0;
        } else {
          if (!u.toxicSince && this.tier(foe, '독') >= 3 && this.time - u.poisonSince >= 5) {
            u.toxicSince = this.time;
            this.emit({ type: 'status', target: u.uid, kind: 'toxic' });
          }
          u.poisonAcc += dt;
          while (u.poisonAcc >= 1 && u.alive) {
            u.poisonAcc -= 1;
            const src = u.poisonSrc ? this.byUid[u.poisonSrc] : null;
            const steps = u.toxicSince ? Math.floor((this.time - u.toxicSince) / 3) : 0;
            const pct = 0.03 * (1 + (u.toxicSince ? 0.5 * steps : 0));
            this.dealDamage(src && src.side !== u.side ? src : null, u, u.maxHp * pct, { trueDmg: true, kind: u.toxicSince ? 'toxic' : 'poison' });
          }
        }
      }
      if (u.alive && u.burnUntil > 0) {
        if (u.burnUntil <= this.time) {
          u.burnUntil = 0;
          u.burnAcc = 0;
        } else {
          u.burnAcc += dt;
          while (u.burnAcc >= 0.5 && u.alive) {
            u.burnAcc -= 0.5;
            const src = u.burnSrc ? this.byUid[u.burnSrc] : null;
            this.dealDamage(src && src.side !== u.side ? src : null, u, u.hp * 0.01, { trueDmg: true, kind: 'burn' });
          }
        }
      }
      if (u.alive && !u.serpent && this.side[foe].spikes.has(u.r * 10 + u.c)) this.addPoison(u, null, 3, true);
    }
  }

  step(dt) {
    if (this.over) return;
    this.time += dt;
    this.tickSide('A', dt);
    this.tickSide('B', dt);
    this.tickUnits(dt);
    if (this.timers.length) {
      const due = this.timers.filter(x => x.at <= this.time);
      if (due.length) {
        this.timers = this.timers.filter(x => x.at > this.time);
        for (const x of due) x.fn();
      }
    }
    this.cleanAcc += dt;
    if (this.cleanAcc >= 1) {
      this.cleanAcc = 0;
      for (const u of this.units) {
        if (u.tmp.length) u.tmp = u.tmp.filter(b => b.until > this.time);
        if (u.reduces.length) u.reduces = u.reduces.filter(b => b.until > this.time);
      }
    }
    this.order = this.rng.shuffle(this.order || this.units.slice());
    for (const u of this.order) {
      if (!u.alive) continue;
      if (u.serpent) {
        this.tickSerpent(u, dt);
        continue;
      }
      if (u.thunder) {
        this.tickThunder(u, dt);
        continue;
      }
      if (u.egg) continue;
      if (u.sleep && !u.sleep.awake) continue;
      u.atkTimer -= dt;
      if (u.channel && this.runChannel(u, dt)) continue;
      if (u.moving) {
        u.moveRemain -= dt;
        if (u.moveRemain > 0) continue;
        u.moving = false;
      }
      if (u.stunUntil > this.time) continue;
      if (!u.target || !this.canTarget(u, u.target)) this.setTarget(u, this.nearestEnemy(u));
      let t = u.target;
      if (!t) continue;
      let d = this.distTo(u, t);
      if (d > u.range) {
        const n = this.nearestEnemy(u);
        if (n && n !== t) {
          this.setTarget(u, n);
          t = n;
          d = this.distTo(u, t);
        }
      }
      if (u.cavalryStun && u.lastDash !== t.uid && !t.serpent) {
        u.lastDash = t.uid;
        this.dash(u, t);
        if (u.moving) continue;
        d = this.distTo(u, t);
      }
      if (d <= u.range) {
        if (u.atkTimer <= 0 && !u.channel) {
          if (u.mana >= u.maxMana && !u.noSkill) this.castSkill(u, t);
          else this.strike(u, t, false);
          u.atkTimer = 1 / this.attackSpeed(u);
        }
      } else {
        const s = this.nextStep(u, t);
        if (s) this.moveTo(u, s[0], s[1]);
      }
    }
    this.snapAcc += dt;
    if (this.snapAcc >= 0.25) {
      this.snapAcc = 0;
      for (const u of this.units) if (u.alive) this.snapshot(u);
    }
    this.checkEnd();
  }

  standing(side) {
    return this.units.filter(u => u.side === side && (u.alive || u.reviving)).length;
  }

  checkEnd() {
    if (this.over) return;
    const a = this.standing('A');
    const b = this.standing('B');
    if (a === 0 || b === 0) {
      this.over = true;
      this.winner = a === 0 && b === 0 ? 'draw' : a === 0 ? 'B' : 'A';
    } else if (this.time >= CONFIG.combat.timeLimit) {
      this.over = true;
      this.winner = 'draw';
    }
    if (this.over) this.emit({ type: 'end', winner: this.winner });
  }

  runToEnd() {
    let guard = 0;
    while (!this.over && guard < 100000) {
      this.step(CONFIG.combat.tick);
      guard++;
    }
  }

  survivors(side) {
    return this.aliveOf(side);
  }
}
