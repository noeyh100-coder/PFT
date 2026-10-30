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

const SERPENT = { yk: 0.852 };
const GYARA = { dive: 0.5, pool: 3, every: 0.5, poolR: 1, poolMult: 0.3, burstR: 2, burstMult: 2.15, stun: 1.5, sky: 1.5, fall: 0.45 };

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

function strongerFirst(a, b) {
  return (b.cost - a.cost) || (b.star - a.star) || (b.maxHp - a.maxHp) || (a.uid - b.uid);
}

const SYN_DMG_KIND = { ice: '얼음', fire: '불꽃', burn: '불꽃', seed: '풀', lightning: '전기', storm: '비행', tsunami: '물', poison: '독', toxic: '독' };

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
    this.skillBoost = 1;
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
      stats: { heal: 0, bolt: 0, burn: 0, hypno: 0 },
      synDmg: {},
      esp: null,
      elecField: false,
      elecFieldAt: 0,
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
      swordGold: 0,
      rocks: new Map(),
      blizzards: []
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
      base: { hp: st.hp, atk: st.atk, spa: st.spa, def: st.def, spd: st.spd, spe: st.spe },
      pwP: st.pwP || 1,
      pwS: st.pwS || 1,
      pwStar: st.pwStar || 1,
      pwD: st.pwD || 1,
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
      shiny: !!spec.shiny,
      pp: 0,
      maxPP: st.maxPP,
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
      statMods: { atk: 0, spa: 0, def: 0, spd: 0, spe: 0, acc: 0, eva: 0, crit: 0 },
      tmp: [],
      pct: { hp: 0, atk: 0, spa: 0, def: 0, spd: 0, spe: 0 },
      flatHp: 0,
      vamp: st.omnivamp || 0,
      taken: 1,
      amp: 0,
      healMod: 0,
      shieldMod: 0,
      ppBonus: 0,
      ppMul: 0,
      leaderHeal: 0,
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
      zap: 0,
      zapHasteUntil: 0,
      untargetUntil: 0,
      experiment: false,
      mew: false,
      mewTypes: null,
      mewCasts: 0,
      ghostNext: 0,
      darkAcc: 0,
      ccImmuneUntil: 0,
      antiHealUntil: 0,
      antiHeal: 0,
      shockUntil: 0,
      shockAt: 0,
      shockSrc: null,
      shockDmg: 0,
      dura: 0,
      bugAmp: 0,
      bugDura: 0,
      bugFrenzy: 0,
      bugStacks: 0,
      frenzyUntil: 0,
      download: false,
      heart: false,
      shadowCaster: false,
      frostExec: false,
      gyara: false,
      gyaraFx: null,
      gyaraBoost: 1,
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
      warriorShield: 0,
      warriorAmp: 0,
      warriorUsed: false,
      warriorOn: false,
      chalPer: 0,
      chalMax: 0,
      chalModifier: 0,
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
      bulkGain: 0,
      steelWall: 0,
      charmTo: 0,
      charmUntil: 0,
      fsArmed: false,
      fireBasic: false,
      icicle: false,
      bulked: false,
      bulkUntil: 0,
      moveSpeedBonus: 0,
      waterPP: 0,
      waterHeal: 0,
      waterSkillAmp: 0,
      waterRefund: 0,
      waterPaired: false,
      whirlAcc: 0,
      flatDef: 0,
      flatSpd: 0,
      swordUntil: 0,
      swordAmp: 0,
      swordDura: 0,
      esper: false,
      roomExtra: 0,
      mirror: null,
      psyBonus: 0,
      psyChance: 0,
      psyPer: 0,
      psyPerMax: 0,
      wish: false,
      sealKill: false,
      sealSpa: 0,
      sealedBy: null,
      killedBy: null,
      wishVuln: 0,
      wishVulnUntil: 0,
      roomItems: null,
      roomUntil: 0,
      roomTaken: null,
      roomStolen: null,
      evolvable: !!spec.evolvable,
      eff: null,
      augOne: spec.augOne || 0,
      augItem: null,
      augShield: 0,
      augHits: 0,
      mvMul: 1,
      critDmg: 0,
      hasteUntil: 0
    };
    const tr = u.traits;
    if (tr.includes('실험체')) {
      u.experiment = true;
      u.maxPP = 8;
    }
    if (tr.includes('천둥의 화신')) u.thunder = true;
    if (tr.includes('열기의 화신')) u.phoenix = true;
    if (tr.includes('냉기의 화신')) u.frostExec = true;
    if (tr.includes('저주받은 그림자')) u.shadowCaster = true;
    if (tr.includes('치유의 마음')) u.heart = true;
    if (tr.includes('다운로드')) u.download = true;
    if (u.unitId === '뮤' || (u.form && u.form.skill === '오리진즈슈퍼노바')) {
      u.mew = true;
      u.ghostNext = 10;
    }
    const sk = u.form && u.form.skill;
    const P0 = skillParamsOf(u.form);
    if ((sk === '깨뜨리다' || sk === '폭발펀치') && P0.heal) u.basicHeal = P0.heal;
    if (sk === '포자') {
      u.spore = P0.chance || 0.5;
      u.noSkill = true;
    }
    if (sk === '잠자기') u.sleep = { gained: 0, awake: false, P: P0 };
    if (sk === '불대문자') u.fireBasic = true;
    if (sk === '절대영도') u.icicle = true;
    this.initPassive(u, sk, P0);
    this.applyItems(u, spec);
    u.pp = Math.min(u.maxPP, (st.startPP || 0) + u.itemPP);
    if (u.experiment) u.pp = 0;
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
          if (e.modifiers) for (const k in e.modifiers) addStatModifier(u, k, e.modifiers[k]);
          if (e.healMod) u.healMod += e.healMod;
          if (e.vamp) u.vamp += e.vamp;
          if (e.pp) u.ppBonus += e.pp * PP_RULE.event;
          if (e.allPct) for (const k in u.pct) u.pct[k] += e.allPct;
          if (e.hpPct) u.pct.hp += e.hpPct;
          if (e.shieldMod) u.shieldMod += e.shieldMod;
        }
      }
      const scales = T.scales || 0;
      st.scales = scales;
      if (!st.mewTypes) st.mewTypes = ALL_TYPES.filter(id => t(id) > 0);
      for (const u of units) {
        const ty = id => u.types.includes(id) || (u.mew && t(id) > 0);
        const cl = id => u.traits.includes(id);
        if (t('강철')) {
          if (this.augFront(side, u.r)) u.steelWall = v('강철', 'wall');
          else {
            u.amp += v('강철', 'gear');
            u.pct.spe += v('강철', 'gear');
          }
        }
        if (ty('바위') && t('바위')) {
          addStatModifier(u, 'def', v('바위', 'def'));
          u.reflect = v('바위', 'reflect');
        }
        if (ty('페어리') && t('페어리')) {
          addStatModifier(u, 'spa', 1);
          u.fairyHeal = v('페어리', 'healPerPP');
          u.fairyBonus = v('페어리', 'healBonus');
          u.fairyImmune = t('페어리') >= 2;
        }
        if (t('얼음') && (ty('얼음') || t('얼음') >= 3)) u.chillOn = true;
        if (ty('얼음') && t('얼음')) addStatModifier(u, 'spd', 1);
        if (ty('전기') && t('전기')) addStatModifier(u, 'spe', 1);
        if (ty('풀') && t('풀') >= 2) {
          addStatModifier(u, 'def', 1);
          addStatModifier(u, 'spd', 1);
        }
        if (ty('풀') && t('풀')) {
          u.pct.hp += v('풀', 'hp');
          u.flatHp += v('풀', 'flat');
        }
        if (ty('땅') && t('땅')) u.flatHp += v('땅', 'hp');
        if (ty('불꽃') && t('불꽃') >= 2) {
          addStatModifier(u, 'atk', 1);
          addStatModifier(u, 'spa', 1);
        }
        if (t('비행')) addStatModifier(u, 'spe', 1);
        if (ty('비행') && t('비행')) u.flyingSkill = true;
        if (ty('비행') && t('비행') >= 2) {
          addStatModifier(u, 'acc', 1);
          addStatModifier(u, 'eva', 1);
          u.dodgePP = 2 * PP_RULE.event;
        }
        if (ty('벌레')) {
          const bt = t('벌레');
          const bm = bt >= 6 ? 2 : 1;
          if (bt >= 2) {
            addStatModifier(u, 'atk', bm);
            addStatModifier(u, 'spa', bm);
          }
          if (bt >= 3) {
            addStatModifier(u, 'def', bm);
            addStatModifier(u, 'spd', bm);
          }
          if (bt >= 4) {
            addStatModifier(u, 'spe', bm);
            addStatModifier(u, 'acc', bm);
            addStatModifier(u, 'eva', bm);
            u.bugFrenzy = bt >= 6 ? 4 : bt >= 5 ? 2 : 1;
          }
        }
        if (t('드래곤')) u.amp += v('드래곤', 'amp') + v('드래곤', 'ampPerScale') * scales;
        if (ty('드래곤') && t('드래곤') >= 2) {
          addStatModifier(u, 'atk', 1);
          addStatModifier(u, 'spe', 1);
        }
        if (u.strongDragon && t('드래곤')) {
          const k = v('드래곤', 'strongPerScale') * scales;
          u.pct.hp += k;
          u.pct.atk += k;
          u.pct.spa += k;
        }
        if (ty('고스트') && t('고스트')) u.revivePct = v('고스트', 'hp');
        if (t('악')) u.taken *= 1 - v('악', 'reduce');
        if (ty('악') && t('악')) u.darkGuard = v('악', 'superEffective');
        if (ty('독') && t('독')) u.poisoner = t('독');
        if (ty('격투') && t('격투')) u.bulkGain = v('격투', 'mult');
        if (ty('물') && t('물')) {
          u.waterPP = PP_RULE.event;
          u.waterHeal = v('물', 'heal');
          u.waterSkillAmp = v('물', 'skillAmp');
          u.waterRefund = v('물', 'refund');
          u.waterPaired = t('물') >= 3 && (T.waterPairCosts || []).includes(u.cost);
        }
        if (t('전쟁기계')) u.taken *= 1 - (cl('전쟁기계') ? v('전쟁기계', 'self') : v('전쟁기계', 'all'));
        if (cl('주문술사')) addStatModifier(u, 'spa', v('주문술사', 'modifier'));
        if (cl('타격대')) addStatModifier(u, 'atk', v('타격대', 'modifier'));
        if (cl('감시자')) addStatModifier(u, 'spd', v('감시자', 'modifier'));
        if (cl('파수꾼')) addStatModifier(u, 'def', v('파수꾼', 'modifier'));
        if (cl('매복자')) addStatModifier(u, 'crit', v('매복자', 'modifier'));
        if (cl('화석')) {
          const n = v('화석', 'modifier');
          for (const k of ['atk', 'spa', 'def', 'spd', 'spe']) addStatModifier(u, k, n);
        }
        if (cl('학살자') && t('학살자')) {
          u.warriorShield = v('학살자', 'shield');
          u.warriorAmp = v('학살자', 'amp');
        }
        if (cl('도전자') && t('도전자')) {
          u.chalPer = v('도전자', 'per');
          u.chalMax = v('도전자', 'max');
          u.chalModifier = statModifierDelta('spe', v('도전자', 'modifier'));
        }
        if (t('난동꾼')) {
          if (cl('난동꾼')) u.pct.hp += v('난동꾼', 'pct');
          else u.flatHp += v('난동꾼', 'flat');
        }
        if (t('선도자')) {
          u.ppMul += v('선도자', 'pp');
          u.leaderHeal = v('선도자', 'heal');
        }
        if (cl('최면술사')) u.hypno = v('최면술사', 'duration');
      }
      this.esperInit(side, units);
    }
    const sst = this.side[side];
    sst.frost = units.some(u => u.frostExec);
    for (const u of units) {
      if (u.traits.includes('가족')) {
        addStatModifier(u, 'def', 1);
        addStatModifier(u, 'spd', 1);
      }
    }
    if (T) {
      sst.benchFree = T.benchFree || 0;
      sst.heartBase = T.healStack || 0;
      sst.sea = T.sea && T.sea.length ? new Set(T.sea) : null;
      sst.seaOn = !!(T.tiers && T.tiers['바다의 음유시인']);
    }
    this.itemsInitSide(side);
    this.augInit(side, units);
    this.adaptSide(side, units);
    for (const u of units) {
      u.maxHp = Math.max(1, Math.round((u.base.hp * (1 + u.pct.hp) + u.flatHp) * this.evoMul(u, 'hp')));
      u.hp = u.maxHp;
    }
    this.augPost(side, units);
    this.gimmickStart(units);
    for (const u of units) if (u.traits.includes('최상위 포식자')) this.initGyara(u);
    if (sst.frost) this.emit({ type: 'field', side, kind: 'frost', on: true });
    if (sst.seaOn && sst.sea) this.emit({ type: 'sea', side, cells: Array.from(sst.sea) });
    if (T && this.tier(side, '물')) {
      for (const u of units) if (u.types.includes('물')) this.addShield(u, u.maxHp * traitVal('물', 'shield', this.tier(side, '물')));
    }
  }

  adaptSide(side, units) {
    for (const u of units) {
      const def = u.unitId ? UNITS[u.unitId] : null;
      if (!def || !ADAPT[def.id] || u.ditto || u.creep || !u.form || !isAdaptBase(def, u.form)) continue;
      const v = { atk: this.atkView(u), spa: this.spaStat(u), def: this.defense(u, false, false, true), spd: this.defense(u, true, false, true) };
      u.adaptMode = adaptMode(def.id, v);
      const nf = adaptForm(def, u.form, u.adaptMode);
      if (nf !== u.form) this.reformUnit(u, def, nf);
    }
    const tier = this.tier(side, '적응가');
    if (!tier) return;
    const n = traitVal('적응가', 'modifier', tier);
    for (const u of units) {
      if (!u.traits.includes('적응가')) continue;
      const k = this.topStat(u);
      addStatModifier(u, k, n);
      u.adaptBonus = { k, value: statModifierDelta(k, n) };
    }
  }

  topStat(u) {
    const vals = { atk: this.atkView(u), spa: this.spaStat(u), def: this.defense(u, false, false, true), spd: this.defense(u, true, false, true) };
    const role = (u.stats && u.stats.role) || '';
    const tank = role.indexOf('탱커') >= 0;
    const pref = tank ? (u.special ? 'spd' : 'def') : u.special ? 'spa' : 'atk';
    const best = Math.max(vals.atk, vals.spa, vals.def, vals.spd);
    if (vals[pref] >= best - 1e-9) return pref;
    return ['atk', 'spa', 'def', 'spd'].find(k => vals[k] >= best - 1e-9);
  }

  reformUnit(u, def, nf) {
    const bonus = def.unlockOnly ? UNLOCK_STAT_BONUS : 1;
    const o = computeStats(u.form, def.cost, u.star, bonus, { boost: def.boost });
    const n = computeStats(nf, def.cost, u.star, bonus, { boost: def.boost });
    u.base.hp = Math.round((u.base.hp * n.hp) / o.hp);
    u.base.atk = Math.round((u.base.atk * n.atk) / o.atk);
    u.base.def = Math.round((u.base.def * n.def) / o.def);
    u.base.spd = Math.round((u.base.spd * n.spd) / o.spd);
    u.base.spe = (u.base.spe * n.spe) / o.spe;
    u.pwP = n.pwP;
    u.pwS = n.pwS;
    u.pwD = n.pwD;
    u.special = n.special;
    u.range = Math.max(1, u.range + n.range - o.range);
    u.ranged = u.range > 1;
    u.maxPP = Math.max(1, u.maxPP + n.maxPP - o.maxPP);
    u.pp = Math.max(0, Math.min(u.maxPP, u.pp + (n.startPP || 0) - (o.startPP || 0)));
    u.form = nf;
    u.skillType = nf.skillType || u.skillType;
    u.stats = Object.assign({}, u.stats, { atk: n.atk, def: n.def, spd: n.spd, role: n.role, special: n.special, range: u.range, spe: n.spe, maxPP: u.maxPP, startPP: n.startPP, basic: n.basic });
    const P0 = skillParamsOf(nf);
    u.basicHeal = (nf.skill === '깨뜨리다' || nf.skill === '폭발펀치') && P0.heal ? P0.heal : 0;
    this.initPassive(u, nf.skill, P0);
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
    return !!o && o.alive && o.side !== u.side && !o.hidden && this.effMult(u, o) > 0;
  }

  distTo(u, t) {
    return Hex.dist(u.r, u.c, t.r, t.c);
  }

  aimCell(u, t) {
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

  statModifier(u, k) {
    let value = u.statMods[k] || 0;
    for (const b of u.tmp) if (b.k === k && b.until > this.time) value += b.value;
    if ((k === 'def' || k === 'spd') && u.poisonUntil > this.time && this.tier(this.enemyOf(u.side), '독') >= 2) value -= 20;
    if (k === 'spe' && u.chalMax && u.chal >= u.chalMax) value += u.chalModifier;
    if (u.kingN && (k === 'def' || k === 'spd')) value += 10 * u.kingN;
    if (u.decoy && (k === 'def' || k === 'spd')) value += 20 * this.targetersOf(u);
    return value;
  }

  otMult(k) {
    if (!this.overtime) return 1;
    return k === 'atk' ? 4.5 : k === 'def' ? 3 : k === 'spe' ? 4 : k === 'move' ? 2 : k === 'cc' ? 0.34 : k === 'heal' ? 0.34 : 1;
  }

  atkView(u) {
    const atkBonus = this.statModifier(u, 'atk');
    return u.base.atk * Math.max(0, 1 + u.pct.atk + (u.experiment ? Math.min(0, atkBonus) : atkBonus)) * this.otMult('atk') * this.evoMul(u, 'atk');
  }

  spaView(u) {
    const extra = u.experiment
      ? Math.max(0, u.pct.atk) + Math.max(0, u.pct.spe) + Math.max(0, this.statModifier(u, 'atk')) + Math.max(0, this.statModifier(u, 'spe')) + u.ppBonus * 0.015
      : 0;
    return (u.base.spa * (1 + u.pct.spa + extra) + this.statModifier(u, 'spa')) * this.otMult('atk') * this.evoMul(u, 'spa');
  }

  atkStat(u) {
    return this.atkView(u) * (u.pwP || 1);
  }

  spaStat(u) {
    return this.spaView(u) * (u.pwS || 1);
  }

  offense(u) {
    return u.special ? this.spaStat(u) : this.atkStat(u);
  }

  defense(u, special, ignoreUp, view) {
    let bonus = this.statModifier(u, special ? 'spd' : 'def');
    if (ignoreUp && bonus > 0) bonus = 0;
    const pw = view ? 1 : u.pwD || 1;
    const b = special ? u.base.spd * pw + u.flatSpd : u.base.def * pw + u.flatDef;
    return Math.max(0, b + bonus) * (1 + (u.steelWall || 0)) * this.otMult('def') * this.evoMul(u, special ? 'spd' : 'def');
  }

  attackSpeed(u) {
    if (u.experiment) return Math.min(5, 0.77 * this.otMult('spe'));
    let a = u.base.spe * (1 + u.pct.spe + (u.hasteUntil > this.time ? 0.25 : 0) + this.statModifier(u, 'spe')) * this.evoMul(u, 'spe');
    if (u.chalPer) a *= 1 + u.chal * u.chalPer;
    if (u.chill > 0 && u.chillUntil > this.time) a *= Math.max(0.1, 1 - u.chill * u.chillPer);
    if (u.paraUntil > this.time) a *= 0.8;
    if (this.side[this.enemyOf(u.side)].frost) a *= 0.65;
    if (u.frenzyUntil > this.time) a *= 1 + 0.5 * Math.max(1, u.bugFrenzy);
    if (u.zapHasteUntil > this.time) a *= 2.5;
    return Math.min(5, Math.max(0.1, a) * this.otMult('spe'));
  }

  critChance(u) {
    return Math.max(0, Math.min(1, CONFIG.combat.critChance + this.statModifier(u, 'crit')));
  }

  snapshot(u) {
    u.eff = {
      atk: Math.round(this.atkView(u)),
      spa: Math.round(this.spaView(u)),
      def: Math.round(this.defense(u, false, false, true)),
      spd: Math.round(this.defense(u, true, false, true)),
      basic: Math.round(this.atkView(u)),
      spe: Math.round(this.attackSpeed(u) * 100) / 100,
      crit: this.critChance(u),
      amp: u.amp + u.bugAmp + (u.warriorOn ? u.warriorAmp : 0) + this.swordAmpOf(u),
      dura: 1 - u.taken * (1 - u.dura) * (1 - u.bugDura) * (1 - this.swordDuraOf(u)),
      omnivamp: u.vamp + this.orbVamp(u),
      special: u.special,
      range: u.range,
      maxPP: u.maxPP,
      hp: u.maxHp,
      stats: Object.assign({}, ...Object.keys(u.statMods).map(k => ({ [k]: this.statModifier(u, k) })))
    };
  }

  checkStalemate() {
    const A = this.units.filter(u => u.alive && u.side === 'A');
    const B = this.units.filter(u => u.alive && u.side === 'B');
    if (!A.length || !B.length) return;
    for (const a of A) for (const b of B) if (this.effMult(a, b) > 0 || this.effMult(b, a) > 0) return;
    this.immuneOff = true;
    this.emit({ type: 'stalemate' });
  }

  gainPP(u, n) {
    if (!u.alive || n <= 0 || u.experiment || u.egg || u.casting || u.channel) return;
    if (u.ppLockUntil > this.time) return;
    let g = (n + u.ppBonus) * (1 + u.ppMul);
    if (u.ppFreezeUntil > this.time) g *= 0.5;
    u.pp = Math.min(u.maxPP * 2, u.pp + g);
  }

  fireReduction(u) {
    const foe = this.enemyOf(u.side);
    if (!this.side[foe].fireOn) return 0;
    return traitVal('불꽃', 'reduce', this.tier(foe, '불꽃'));
  }

  heal(t, amount, src) {
    if (!t.alive || amount <= 0) return 0;
    let a = amount * (1 + t.healMod) * this.otMult('heal');
    if (src && src.casting && this.skillBoost > 1) a *= this.skillBoost;
    if (t.antiHealUntil > this.time) a *= 1 - t.antiHeal;
    const red = this.fireReduction(t);
    if (red && !t.fairyImmune) a *= 1 - red;
    const real = Math.min(a, t.maxHp - t.hp);
    if (this.side[t.side].aug) this.augOnHeal(t, src, a - Math.max(0, real));
    if (real <= 0) return 0;
    t.hp += real;
    (src || t).healed += real;
    this.side[t.side].stats.heal += real;
    this.emit({ type: 'heal', target: t.uid, amount: real });
    return real;
  }

  addShield(u, amount) {
    if (!u.alive || amount <= 0) return;
    let a = amount * (1 + u.shieldMod) * this.otMult('heal');
    if (this.skillBoost > 1 && this.boostSide === u.side) a *= this.skillBoost;
    const red = this.fireReduction(u);
    if (red) a *= 1 - red;
    u.shield += a;
    u.shieldPeak = Math.max(u.shieldPeak, u.shield);
  }

  stun(t, dur, bySide) {
    if (!t.alive || dur <= 0) return 0;
    if (t.bulkUntil > this.time) return 0;
    if (t.ccImmuneUntil > this.time && bySide && bySide !== t.side) return 0;
    const d = (dur + (bySide ? this.side[bySide].cc : 0)) * this.ccMul(t);
    t.stunUntil = Math.max(t.stunUntil, this.time + d);
    this.emit({ type: 'stun', target: t.uid, duration: d });
    return d;
  }

  bulkCell(u) {
    const row = u.side === 'A' ? BOARD_ROWS - 1 : 0;
    const free = c => !this.grid[row][c] || this.grid[row][c] === u.uid;
    const cells = [];
    for (let c = 0; c < BOARD_COLS; c++) if (free(c)) cells.push(c);
    if (!cells.length) return null;
    const edge = c => Math.min(c, BOARD_COLS - 1 - c);
    cells.sort((a, b) => (edge(a) - edge(b)) || (Hex.dist(u.r, u.c, row, a) - Hex.dist(u.r, u.c, row, b)) || (a - b));
    return [row, cells[0]];
  }

  bulkUp(u) {
    u.bulked = true;
    u.bulkUntil = this.time + 3;
    u.channel = null;
    u.target = null;
    u.hidden = true;
    this.emit({ type: 'hide', uid: u.uid, on: true });
    this.emit({ type: 'buff', target: u.uid, kind: 'bulk' });
    const cell = this.bulkCell(u);
    if (cell && (cell[0] !== u.r || cell[1] !== u.c)) this.moveTo(u, cell[0], cell[1], CONFIG.combat.dashTime);
  }

  bulkEnd(u) {
    u.bulkUntil = 0;
    if (!(u.untargetUntil > this.time)) {
      u.hidden = false;
      this.emit({ type: 'hide', uid: u.uid, on: false });
    }
    const k = u.bulkGain;
    addStatModifier(u, 'spe', 3 * k);
    u.moveSpeedBonus += 0.45 * k;
    addStatModifier(u, 'atk', k);
    addStatModifier(u, 'def', k);
    this.emit({ type: 'buff', target: u.uid, kind: 'bulkon' });
  }

  moveTo(u, r, c, duration) {
    const fr = u.r;
    const fc = u.c;
    let d = duration || CONFIG.combat.moveTime;
    if (this.side[this.enemyOf(u.side)].frost) d /= 0.65;
    if (!duration) d /= this.otMult('move') * (1 + u.moveSpeedBonus) * (u.mvMul || 1);
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

  pathStep(u, t) {
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
      const nb = Hex.neighbors(r, c).sort((a, b) => Hex.dist(a[0], a[1], tr, tc) - Hex.dist(b[0], b[1], tr, tc));
      for (const [nr, nc] of nb) {
        const nk = nr * C + nc;
        if (prev[nk] !== -1) continue;
        if (this.grid[nr][nc] !== 0) continue;
        prev[nk] = k;
        queue.push(nk);
      }
    }
    return null;
  }

  greedyStep(u, t) {
    const [tr, tc] = this.aimCell(u, t);
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

  nextStep(u, t) {
    return this.pathStep(u, t) || this.greedyStep(u, t);
  }

  reachableFoe(u, skip) {
    const list = [];
    for (const o of this.units) if (o !== skip && this.canTarget(u, o)) list.push([this.distTo(u, o), o]);
    list.sort((a, b) => a[0] - b[0] || a[1].uid - b[1].uid);
    for (const [d, o] of list) {
      if (d <= u.range) return { o, step: null };
      const st = this.pathStep(u, o);
      if (st) return { o, step: st };
    }
    return null;
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
    this.stun(t, u.cavalryStun, u.side);
  }

  strike(u, t, skill, mult, shadow) {
    const cfg = CONFIG.combat;
    this.lastHit = false;
    if (!skill) {
      if (u.experiment) u.pp = Math.min(u.maxPP, u.pp + 1);
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
    else this.emit({ type: skill ? 'skill' : 'attack', uid: u.uid, target: t.uid, ranged: u.ranged || u.fan, special: u.special, enhanced: !!(skill && u.hypno && u.skillCount === 3), fan: !skill && (u.fan || u.fireBasic), icicle: !skill && u.icicle });
    const accuracy = Math.max(0, Math.min(1, 1 + this.statModifier(u, 'acc') - this.statModifier(t, 'eva')));
    if (accuracy < 1) {
      if (this.rng.next() >= accuracy) {
        this.emit({ type: 'miss', target: t.uid });
        u.lastMissed = true;
        u.missFlag = true;
        if (!skill && t.dodgePP) this.gainPP(t, t.dodgePP);
        if (t.bugFrenzy) this.bugFrenzy(t);
        return 0;
      }
    }
    this.lastHit = true;
    u.lastMissed = false;
    const skillCritChance = u.special ? u.skillCritSpa : u.skillCritAtk;
    const sunnyCrit = !skill && this.side[u.side].sunny && t.stormUntil > this.time ? 0.2 : 0;
    const crit = this.rng.next() < (u.alwaysCrit && !skill ? 1 : Math.min(1, (skill ? skillCritChance : this.critChance(u)) + sunnyCrit));
    let raw = (skill ? this.offense(u) : this.atkStat(u)) * (skill ? cfg.skillMult * (1 + u.skillAmp) * (u.special ? u.pwStar || 1 : 1) : 1) * (mult || 1);
    if (crit) raw *= cfg.critMult + (u.critDmg || 0);
    if (skill && u.waterSkillAmp) raw *= 1 + u.waterSkillAmp;
    const o = { special: u.special, crit, kind: skill ? 'skill' : 'basic' };
    let dmg;
    if (!skill && u.icicle) {
      const o2 = Object.assign({}, o, { special: true });
      const chilled = t.chill > 0 && t.chillUntil > this.time;
      dmg = this.dealDamage(u, t, raw * (chilled ? 0.6 : 1), o2);
      if (chilled && t.alive) dmg += this.dealDamage(u, t, raw * 0.4, { trueDmg: true, kind: 'true' });
      if (t.alive) this.addChill(t, 1, u.side);
    } else dmg = this.dealDamage(u, t, raw, o);
    if (!skill && !shadow && u.alive) this.itemOnBasic(u, t, raw, dmg, crit);
    if (!skill && !shadow && u.alive) this.basicPassive(u, t, raw, o, dmg);
    if (!skill && dmg > 0) this.augOnBasic(u, t, dmg);
    if (!skill && u.basicHeal && dmg > 0 && u.alive) this.heal(u, u.maxHp * u.basicHeal, u);
    if (!skill && u.thunder && !shadow) this.zapStrike(u, t, raw);
    if (!skill && u.fireBasic && !u.fan) {
      const a = hexMetric(u.r, u.c);
      const b = hexMetric(t.r, t.c);
      const base = Math.atan2(b.y - a.y, b.x - a.x);
      for (const e of this.units) {
        if (e === t || !this.canTarget(u, e) || Hex.dist(t.r, t.c, e.r, e.c) > 1) continue;
        const q = hexMetric(e.r, e.c);
        let diffA = Math.atan2(q.y - a.y, q.x - a.x) - base;
        while (diffA > Math.PI) diffA -= Math.PI * 2;
        while (diffA < -Math.PI) diffA += Math.PI * 2;
        if (Math.abs(diffA) <= 1.05) this.dealDamage(u, e, raw, o);
      }
    }
    if (!skill && u.fan) {
      const a = hexMetric(u.r, u.c);
      const b = hexMetric(t.r, t.c);
      const base = Math.atan2(b.y - a.y, b.x - a.x);
      for (const e of this.units) {
        if (e === t || !this.canTarget(u, e) || Hex.dist(u.r, u.c, e.r, e.c) > 3) continue;
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
    this.emit({ type: 'cast', uid: u.uid, target: t ? t.uid : null });
    if (u.sealedBy) this.sealCast(u);
    const boost = this.gimmickCast(u);
    if (u.experiment) {
      u.pp = 0;
      u.skillCount += 1;
      this.psychoBreak(u);
      this.gimmickAfterCast(u);
      return;
    }
    if (u.gyara) {
      u.pp = 0;
      u.skillCount += 1;
      u.gyaraBoost = boost;
      this.gyaraSkill(u);
      this.gimmickAfterCast(u);
      return;
    }
    if (u.thunder) {
      u.pp = 0;
      u.skillCount += 1;
      const P = SKILL_P['썬더'] || {};
      u.zapHasteUntil = this.time + (P.dur || 5) * this.durMul(u);
      this.emit({ type: 'buff', target: u.uid, kind: 'thunder' });
      this.emit({ type: 'lightning', side: u.side, targets: [u.uid] });
      this.gimmickAfterCast(u);
      return;
    }
    const used = u.maxPP;
    u.pp = Math.min(u.maxPP - 1, Math.max(0, u.pp - u.maxPP));
    u.skillCount += 1;
    if (u.shadowCaster) this.summonShadows(u);
    this.skillBoost = boost;
    this.boostSide = u.side;
    this.skillScale = boost;
    this.shadowIndex = 0;
    u.casting = true;
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
    this.skillBoost = 1;
    this.shadowIndex = 0;
    u.casting = false;
    u.ppLockUntil = this.time + PP_RULE.lock;
    this.gimmickAfterCast(u);
    if (this.side[this.enemyOf(u.side)].frost) u.ppFreezeUntil = this.time + 3;
    const refund = u.ppRefund + u.waterRefund;
    if (refund > 0 && u.alive) u.pp = Math.min(u.maxPP, u.pp + used * refund);
    if (u.it['max-ether'] && u.alive) u.pp = Math.min(u.maxPP, u.pp + 10 * u.it['max-ether']);
    if (u.items.length && u.alive) this.itemAfterCast(u, used);
    if (u.fairyHeal) {
      const a = this.lowestRatioAlly(u.side);
      if (a) this.heal(a, a.maxHp * u.fairyHeal * used * (1 + u.fairyBonus), u);
    }
    if (u.waterHeal) {
      for (const o of this.units) {
        if (!o.alive || Hex.dist(u.r, u.c, o.r, o.c) > 2) continue;
        if (o.side === u.side) this.heal(o, (o.maxHp - o.hp) * u.waterHeal, u);
        else o.tmp.push({ k: 'spe', value: statModifierDelta('spe', -1), until: this.time + 2.5 });
      }
      this.emit({ type: 'wave', uid: u.uid });
    }
    if (u.flyingSkill) u.tmp.push({ k: 'spe', value: statModifierDelta('spe', 1), until: this.time + 3 });
    this.augAfterCast(u, used);
  }

  dealDamage(src, t, raw, o) {
    if (!t.alive || raw <= 0) return 0;
    if (t.bulkUntil > this.time) return 0;
    if (o.orbTick) return this.orbTickDamage(t, raw);
    if (o.crit && t.critGuard) {
      raw /= CONFIG.combat.critMult + ((src && src.critDmg) || 0);
      o = Object.assign({}, o, { crit: false });
    }
    let dmg = raw;
    if (!o.trueDmg) dmg = (raw * 100) / (100 + this.defense(t, o.def ? false : o.special, o.crit || o.ignoreUp));
    const typed = o.kind === 'basic' || o.kind === 'skill';
    if (typed && src && src.side !== t.side) {
      const tm = this.effMult(src, t);
      if (tm <= 0) return 0;
      dmg *= tm;
    }
    if (typed && src && !o.special && src.burnUntil > this.time) dmg *= 0.8;
    if (src && src.side !== t.side) dmg *= 1 + src.amp + src.bugAmp + (src.warriorOn ? src.warriorAmp : 0) + this.swordAmpOf(src);
    if (typed && src && src.side !== t.side) dmg *= this.itemDamageMult(src, t, o);
    const dura = 1 - (1 - (t.dura || 0)) * (1 - (t.bugDura || 0)) * (1 - this.swordDuraOf(t));
    if (dura > 0) dmg *= 1 - dura;
    if (t.frozenUntil > this.time && t.frozenBy && t.frozenBy !== t.side) dmg *= 1 + traitVal('얼음', 'frozenAmp', this.tier(t.frozenBy, '얼음'));
    dmg *= t.taken;
    if (t.wishVulnUntil > this.time) dmg *= 1 + t.wishVuln;
    if (t.it && t.it['luminous-moss']) dmg *= Math.pow(0.95, t.it['luminous-moss']);
    const red = this.damageReduction(t, o.special);
    if (red > 0) dmg *= 1 - red;
    const isHit = o.kind === 'basic' || o.kind === 'skill';
    if (isHit && t.darkGuard && src && this.effMult(src, t) > 1) dmg *= t.darkGuard;
    let absorbed = 0;
    if (t.shield > 0 && !o.ignoreShield) {
      absorbed = Math.min(t.shield, dmg);
      t.shield -= absorbed;
    }
    let hpDmg = dmg - absorbed;
    let delayed = 0;
    if (t.orbDur && !t.orbDone && hpDmg > 0 && (!src || src.side !== t.side)) {
      t.orbQ.push({ left: hpDmg, rate: hpDmg / t.orbDur });
      delayed = hpDmg;
      hpDmg = 0;
    }
    if (hpDmg >= t.hp && t.phoenix && !t.eggUsed && !t.egg) {
      t.eggUsed = true;
      t.egg = true;
      t.eggUntil = this.time + 2.5;
      t.hp = t.maxHp;
      t.hidden = true;
      t.untargetUntil = this.time + 2;
      this.emit({ type: 'hide', uid: t.uid, on: true });
      t.shield = 0;
      t.pp = 0;
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
      } else if (t.sashReady) {
        this.sashFire(t);
        hpDmg = Math.max(0, t.hp - 1);
      }
    }
    const real = Math.min(hpDmg, t.hp);
    t.hp -= real;
    const total = real + absorbed + delayed;
    if (t.mirror && (!src || src.side !== t.side)) t.mirror.acc += total;
    if (src) {
      src.damageDealt += total;
      if (o.special) src.dealtS += total;
      else src.dealtP += total;
      t.damagers.add(src.uid);
      if (src.leaderHeal && total > 0 && src.side !== t.side && (o.kind === 'skill' || src.casting)) {
        const ally = this.lowestRatioAlly(src.side);
        if (ally) this.heal(ally, total * src.leaderHeal, src);
      }
    }
    if (!src && total > 0 && SYN_DMG_KIND[o.kind]) {
      const sd = this.side[this.enemyOf(t.side)].synDmg;
      const k = SYN_DMG_KIND[o.kind];
      const e = sd[k] || (sd[k] = { p: 0, s: 0 });
      if (o.special) e.s += total;
      else e.p += total;
    }
    if (o.special) t.takenS += total;
    else t.takenP += total;
    this.emit({ type: 'damage', target: t.uid, amount: Math.max(1, Math.round(total)), crit: !!o.crit, special: !!o.special, kind: o.kind });
    const vamp = src ? src.vamp + this.orbVamp(src) + this.augVamp(src, t) : 0;
    if (src && src.alive && vamp > 0 && real > 0 && src.side !== t.side) this.heal(src, real * vamp, src);
    if (src && src.side !== t.side && src.it && (o.kind === 'basic' || o.kind === 'skill')) this.redOrbCount(src);
    if (isHit && src && src.side !== t.side) {
      const pp = Math.min(PP_RULE.hitCap, raw * PP_RULE.hitRaw + dmg * PP_RULE.hitReal);
      this.gainPP(t, pp * (t.it && t.it['soothe-bell'] ? 2 * t.it['soothe-bell'] : 1));
    }
    if (isHit && src && src.side !== t.side) this.itemAfterHit(src, t, o, total);
    if (isHit && src && src.side !== t.side) {
      if (src.chillOn) this.addChill(t, 1, src.side);
      if (src.poisoner && (o.kind === 'skill' || src.poisoner >= 3)) this.addPoison(t, src, traitVal('독', 'duration', src.poisoner), false);
    }
    if (o.kind === 'basic' && src && t.reflect && src.alive) this.dealDamage(t, src, total * t.reflect, { trueDmg: true, kind: 'reflect' });
    if (t.fsMark && t.fsMark.until > this.time && (!src || src.side !== t.side)) t.fsMark.acc += total * t.fsMark.amp;
    if (isHit && t.charge != null && src && src.side !== t.side) t.charge += 1;
    if (t.hp <= 0) {
      t.killedBy = src && src.side !== t.side ? src : null;
      this.kill(t, o.kind);
      if (src && src.side !== t.side) this.itemOnKill(src, t, false);
      return total;
    }
    if (src && src.side !== t.side && src.alive && src.it && this.swordExecute(src, t)) return total;
    if (isHit) {
      if (t.channel) t.channel.hitDuring = true;
      if (t.form && t.form.skill === '분노의주먹') t.rageHits += 1;
      if (t.sleep && !t.sleep.awake) {
        const SP = t.sleep.P;
        const add = Math.min(t.base.hp * (SP.stock || 0.03), t.base.hp * (SP.cap || 1) - t.sleep.gained);
        if (add > 0) {
          t.sleep.gained += add;
          t.maxHp += add;
          t.hp += add;
        }
        if (t.hp <= t.maxHp * (SP.wake || 0.3)) this.sleepWake(t);
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
        if (k === 0) this.stun(src, 1, t.side);
        else if (k === 1) this.addPoison(src, t, 3, false);
        else this.addPara(src, 2);
      }
    }
    if (t.bulkGain && !t.bulked && t.alive && t.hp <= t.maxHp * 0.5) this.bulkUp(t);
    if (t.cloakReady) this.itemCloak(t);
    if (t.items && t.items.length) this.itemAfterDamage(src, t, o, isHit);
    if (t.warriorShield && !t.warriorUsed && t.hp <= t.maxHp * 0.4) {
      t.warriorUsed = true;
      t.warriorOn = true;
      this.addShield(t, (t.maxHp - t.hp) * t.warriorShield);
      this.emit({ type: 'buff', target: t.uid, kind: 'warrior' });
    }
    if (isHit && src && src.esper) this.esperAfterHit(src, t, o, total);
    if (isHit && src && src.side !== t.side && t.alive) this.augAfterDamage(src, t, total);
    return total;
  }

  damageReduction(t, special) {
    let remaining = 1;
    for (const r of t.reduces) {
      if (r.until <= this.time) continue;
      if (r.kind === 'all' || (r.kind === 'phys' && !special) || (r.kind === 'spec' && special)) remaining *= 1 - r.pct;
    }
    if (t.suggest && ((t.suggest === 'phys' && !special) || (t.suggest === 'spec' && special))) {
      let up = 0;
      for (const k of ['atk', 'spa', 'def', 'spd', 'spe', 'acc', 'eva', 'crit']) {
        up += Math.max(0, this.statModifier(t, k) / STAT_MODIFIER_PER_POINT[k]);
      }
      remaining *= 1 - 0.1 * up;
    }
    return Math.min(0.8, 1 - Math.max(0, remaining));
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
    this.deathPassive(t);
    const foe = this.enemyOf(t.side);
    if (t.frozenUntil > this.time && t.frozenBy === foe && traitVal('얼음', 'explode', this.tier(foe, '얼음')) > 0) this.iceExplode(t, foe, 0);
    if (this.tier(foe, '독') >= 4 && t.poisonUntil > this.time) this.addSpikes(foe, t.deathR, t.deathC);
    if (t.heart) this.heartBurst(t);
    this.augOnKill(t);
    if (t.wish || t.killedBy) this.esperOnKill(t);
    if (t.types.includes('비행')) {
      const s = this.side[t.side].storm;
      if (s) {
        s.radius += 1;
        s.power *= 1 + traitVal('비행', 'growth', this.tier(t.side, '비행'));
        this.emit({ type: 'storm', side: t.side, r: s.r, c: s.c, radius: s.radius, grow: true });
      }
    }
    const fieldSide = this.enemyOf(t.side);
    if (this.side[fieldSide].elecField) {
      const near = this.aliveOf(t.side).filter(o => Hex.dist(t.deathR, t.deathC, o.r, o.c) <= 1).sort((a, b) => a.uid - b.uid).slice(0, 2);
      if (near.length) this.emit({ type: 'lightning', side: fieldSide, targets: near.map(o => o.uid) });
      for (const o of near) this.stun(o, 1.5, fieldSide);
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
    u.pp = 0;
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
    u.hidden = true;
    u.untargetUntil = this.time + 2;
    this.emit({ type: 'revive', uid: u.uid });
  }

  addChill(t, n, side, noCd) {
    if (!t.alive) return;
    const tier = Math.max(1, this.tier(side, '얼음'));
    const max = traitVal('얼음', 'maxStack', tier) || 10;
    if (t.chillUntil < this.time) t.chill = 0;
    t.chill = Math.min(max, t.chill + n);
    t.chillUntil = this.time + traitVal('얼음', 'duration', tier);
    t.chillPer = traitVal('얼음', 'asPerStack', tier);
    if (t.chill >= max && (noCd || this.time >= t.freezeCdUntil) && !(t.ccImmuneUntil > this.time)) {
      const d = (traitVal('얼음', 'freeze', tier) + this.side[side].cc) * this.ccMul(t);
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
    if (t.burnUntil <= this.time) {
      t.burnAcc = 0;
      t.burnStacks = 0;
    }
    t.burnUntil = Math.max(t.burnUntil, this.time + (dur || 3));
    if (src) t.burnSrc = src.uid;
    this.emit({ type: 'status', target: t.uid, kind: 'burn' });
  }

  addPara(t, dur) {
    if (!t.alive || t.egg) return;
    if (t.ccImmuneUntil > this.time) return;
    t.paraUntil = Math.max(t.paraUntil, this.time + (dur || 3) * this.ccMul(t));
    this.emit({ type: 'status', target: t.uid, kind: 'para' });
  }

  addConfuse(t, dur) {
    if (!t.alive || t.egg) return;
    if (t.ccImmuneUntil > this.time) return;
    t.confUntil = Math.max(t.confUntil, this.time + (dur || 3) * this.ccMul(t));
    this.emit({ type: 'status', target: t.uid, kind: 'confuse' });
  }

  bugFrenzy(t) {
    const k = Math.max(1, t.bugFrenzy);
    if (t.bugStacks < 10) {
      t.bugStacks += 1;
      t.bugAmp += 0.03 * k;
      t.bugDura += 0.03 * k;
      this.emit({ type: 'buff', target: t.uid, kind: 'frenzy' });
    }
    t.frenzyUntil = this.time + 2;
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

  psychoBreak(u) {
    const foes = this.aliveOf(this.enemyOf(u.side)).filter(e => !e.hidden);
    for (const e of foes) this.stun(e, 3, u.side);
    this.side[u.side].slam = { at: this.time + 3, src: u };
    this.emit({ type: 'psywave', side: u.side, uid: u.uid, targets: foes.map(e => e.uid), dur: 3, high: true });
  }

  slamDown(src, side) {
    const pct = Math.min(0.75, this.spaStat(src) * 0.00065);
    const foes = this.aliveOf(this.enemyOf(side)).filter(e => !e.hidden);
    this.emit({ type: 'slam', side, targets: foes.map(e => e.uid) });
    for (const e of foes) this.dealDamage(src, e, e.maxHp * pct, { special: true, kind: 'skill' });
  }

  zapStrike(u, t, raw) {
    if (!t.alive && !t.reviving) {
      this.zapChain(u, t, raw);
      return;
    }
    this.emit({ type: 'lightning', side: u.side, targets: [t.uid] });
    t.zap = (t.zap || 0) + 1;
    if (t.zap >= 10) {
      t.zap = 0;
      this.stun(t, 1.5, u.side);
    }
    this.zapChain(u, t, raw);
  }

  zapChain(u, t, raw) {
    if (!(u.zapHasteUntil > this.time)) return;
    const hit = new Set([t.uid]);
    let front = [t];
    let dmg = raw;
    const chained = [];
    for (let depth = 0; depth < 4 && front.length; depth++) {
      dmg *= 0.5;
      const next = [];
      for (const f of front) {
        const fr = f.alive ? f.r : f.deathR;
        const fc = f.alive ? f.c : f.deathC;
        const near = this.units.filter(o => !hit.has(o.uid) && this.canTarget(u, o) && Hex.dist(fr, fc, o.r, o.c) <= 1).sort((a, b) => a.uid - b.uid).slice(0, 3);
        for (const o of near) {
          hit.add(o.uid);
          next.push(o);
          chained.push(o.uid);
          this.dealDamage(u, o, dmg, { special: true, kind: 'skill' });
        }
      }
      front = next;
    }
    if (chained.length) this.emit({ type: 'lightning', side: u.side, targets: chained });
  }

  ccMul(t) {
    return this.otMult('cc') * (this.side[t.side] && this.side[t.side].elecField ? 0.5 : 1);
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
      this.stun(e, 1.5, u.side);
      const m = typeMult('불꽃', e.defTypes) || 1;
      this.dealDamage(u, e, this.spaStat(u) * 2.5 * m, { special: true, kind: 'phoenix' });
    }
  }

  initGyara(u) {
    u.gyara = true;
    u.gyaraFx = null;
    this.emit({ type: 'flood', side: u.side, uid: u.uid });
  }

  gyaraCluster(u) {
    const foes = this.aliveOf(this.enemyOf(u.side)).filter(e => !e.hidden);
    let best = [u.r, u.c];
    let bestN = -1;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const n = foes.filter(e => Hex.dist(r, c, e.r, e.c) <= GYARA.burstR).length;
        if (n > bestN) {
          bestN = n;
          best = [r, c];
        }
      }
    }
    return best;
  }

  gyaraSkill(u) {
    u.gyaraFx = { phase: 'dive', t: 0, home: [u.r, u.c], at: null, tick: 0 };
    u.hidden = true;
    u.moving = false;
    u.channel = null;
    this.emit({ type: 'gyara', uid: u.uid, mode: 'dive', r: u.r, c: u.c });
  }

  gyaraHit(u, r, c, radius, mult, stun) {
    const cfg = CONFIG.combat;
    for (const e of this.aliveOf(this.enemyOf(u.side))) {
      if (e.hidden || Hex.dist(r, c, e.r, e.c) > radius) continue;
      const crit = this.rng.next() < (u.special ? u.skillCritSpa : u.skillCritAtk);
      this.dealDamage(u, e, this.offense(u) * mult * (1 + u.skillAmp) * (u.special ? u.pwStar || 1 : 1) * this.skillBoostOf(u) * (crit ? cfg.critMult + (u.critDmg || 0) : 1), { special: u.special, crit, kind: 'skill' });
      if (stun && e.alive) this.stun(e, stun, u.side);
    }
  }

  skillBoostOf(u) {
    return u.gyaraBoost || 1;
  }

  tickGyara(u, dt) {
    const F = u.gyaraFx;
    F.t += dt;
    if (F.phase === 'dive' && F.t >= GYARA.dive) {
      F.phase = 'pool';
      F.t = 0;
      F.at = this.gyaraCluster(u);
      this.emit({ type: 'gyara', uid: u.uid, mode: 'pool', r: F.at[0], c: F.at[1], dur: GYARA.pool });
    } else if (F.phase === 'pool') {
      F.tick += dt;
      while (F.tick >= GYARA.every) {
        F.tick -= GYARA.every;
        this.gyaraHit(u, F.at[0], F.at[1], GYARA.poolR, GYARA.poolMult, 0);
      }
      if (F.t >= GYARA.pool) {
        F.phase = 'sky';
        F.t = 0;
        this.gyaraHit(u, F.at[0], F.at[1], GYARA.burstR, GYARA.burstMult, GYARA.stun);
        this.emit({ type: 'gyara', uid: u.uid, mode: 'burst', r: F.at[0], c: F.at[1] });
      }
    } else if (F.phase === 'sky' && F.t >= GYARA.sky) {
      F.phase = 'fall';
      F.t = 0;
      this.emit({ type: 'gyara', uid: u.uid, mode: 'fall', r: F.home[0], c: F.home[1] });
    } else if (F.phase === 'fall' && F.t >= GYARA.fall) {
      u.gyaraFx = null;
      u.gyaraBoost = 1;
      u.hidden = false;
      u.atkTimer = Math.min(u.atkTimer, 0.3);
      this.emit({ type: 'gyara', uid: u.uid, mode: 'land', r: u.r, c: u.c });
    }
  }

  tickBlizzards(side, dt) {
    const st = this.side[side];
    const keep = [];
    for (const b of st.blizzards) {
      const u = b.src;
      b.acc += dt;
      while (b.acc >= 0.5 && this.time <= b.until + 1e-9) {
        b.acc -= 0.5;
        const foes = this.aliveOf(this.enemyOf(side)).filter(e => !e.hidden && Hex.dist(b.r, b.c, e.r, e.c) <= b.radius);
        for (const e of foes) {
          if (!e.alive) continue;
          const chilled = e.chill > 0 && e.chillUntil > this.time;
          const raw = this.spaStat(u) * b.m * (1 + u.skillAmp) * (u.pwStar || 1);
          this.dealDamage(u, e, raw * (chilled ? 0.9 : 1), { special: true, kind: 'skill' });
          if (chilled && e.alive) this.dealDamage(u, e, raw * 0.1, { trueDmg: true, kind: 'true' });
          if (e.alive) this.addChill(e, 1, side, true);
        }
        for (const e of foes) {
          if (!e.alive || !(e.frozenUntil > this.time)) continue;
          this.emit({ type: 'glacier', target: e.uid });
          e.killedBy = u.alive ? u : null;
          this.execute(e, side);
        }
      }
      if (this.time < b.until) keep.push(b);
      else this.emit({ type: 'blizzard', side, id: b.id, end: true });
    }
    st.blizzards = keep;
  }

  addSpikes(side, r, c) {
    const st = this.side[side];
    const cells = [[r, c]].concat(Hex.neighbors(r, c));
    for (const [cr, cc] of cells) st.spikes.add(cr * 10 + cc);
    this.emit({ type: 'spikes', side, cells });
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
          if (a.gyaraFx || !st.sea.has(a.r * 10 + a.c)) continue;
          this.gainPP(a, PP_RULE.event);
          this.heal(a, (a.maxHp - a.hp) * 0.05, null);
        }
      }
    }
    if (st.blizzards.length) this.tickBlizzards(side, dt);
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
        const grass = this.aliveOf(side).filter(a => a.types.includes('풀') || a.mew);
        const heirs = grass.length ? grass : [this.lowestRatioAlly(side)].filter(Boolean);
        if (heirs.length && total > 0) for (const a of heirs) this.heal(a, total / heirs.length, null);
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
        const enemies = this.aliveOf(foe).filter(e => !e.gyaraFx);
        if (sparks.length && enemies.length) {
          const spa = Math.max(...sparks.map(u => this.spaStat(u)));
          const ranked = enemies.slice().sort(strongerFirst);
          const n = traitVal('전기', 'count', et);
          const big = traitVal('전기', 'big', et);
          const hitList = n >= 99 ? ranked : ranked.slice(0, n);
          const bigSet = new Set(big > 0 ? ranked.slice(0, 2) : []);
          this.emit({ type: 'lightning', side, targets: hitList.map(e => e.uid) });
          for (const e of hitList) {
            const ratio = bigSet.has(e) ? big : traitVal('전기', 'ratio', et);
            this.dealDamage(null, e, spa * ratio, { special: true, kind: 'lightning' });
            st.stats.bolt += 1;
            if (e.alive) this.addPara(e, traitVal('전기', 'para', et));
          }
        }
      }
    }
    if (!st.elecField && this.time >= 8 && this.aliveOf(side).some(u => u.thunder)) {
      st.elecField = true;
      this.emit({ type: 'field', side, kind: 'electric' });
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
        const raw = u.maxPP * 2 * traitVal('물', 'whirlPerPP', wt) * this.spaStat(u);
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
        this.stun(e, 2, side);
        this.dealDamage(null, e, e.maxHp * traitVal('물', 'tsunami', wt), { trueDmg: true, crit: true, kind: 'tsunami' });
      }
    }
  }

  tickUnits(dt) {
    for (const u of this.units) {
      if (u.reviving && this.time >= u.reviveAt) this.revive(u);
      if (!u.alive) continue;
      if (u.channel) u.ppLockUntil = Math.max(u.ppLockUntil || 0, this.time + PP_RULE.lock);
      if (u.charge != null) u.charge += 3 * dt;
      if (u.danceRegen && u.hp < u.maxHp) this.heal(u, u.maxHp * u.danceRegen * dt, u);
      if (u.untargetUntil && this.time >= u.untargetUntil) {
        u.untargetUntil = 0;
        if ((!u.channel || !u.channel.hidden) && !(u.bulkUntil > this.time)) {
          u.hidden = false;
          this.emit({ type: 'hide', uid: u.uid, on: false });
        }
      }
      if (u.egg && this.time >= u.eggUntil) this.hatch(u);
      if (u.mew && this.time >= u.ghostNext) {
        u.ghostNext += 10;
        const mt = this.side[u.side].mewTypes || [];
        if (mt.includes('고스트')) {
          const pool = ALL_TYPES.filter(x => !mt.includes(x) && !(u.mewExtra || []).includes(x));
          if (pool.length) {
            const pick = pool[Math.floor(this.rng.next() * pool.length)];
            (u.mewExtra = u.mewExtra || []).push(pick);
            this.emit({ type: 'retype', uid: u.uid, kind: 'mew', value: pick, move: '고스트: ' + pick });
          }
        }
      }
      if (u.shockUntil > this.time && this.time >= u.shockAt) {
        u.shockAt += 2;
        const src = u.shockSrc && u.shockSrc.alive ? u.shockSrc : null;
        this.emit({ type: 'hitfx', target: u.uid, kind: '전기' });
        this.dealDamage(src, u, u.shockDmg, { special: true, kind: 'shock' });
        if (!u.alive) continue;
      }
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
            this.dealDamage(src && src.side !== u.side ? src : null, u, u.hp * 0.01 * Math.max(1, u.burnStacks || 1), { trueDmg: true, kind: 'burn' });
          }
        }
      }
      if (u.alive && !u.gyaraFx && this.side[foe].spikes.has(u.r * 10 + u.c)) this.addPoison(u, null, 3, true);
      if (u.alive && u.items.length) this.tickItems(u, dt);
      if (u.alive && u.orbQ && u.orbQ.length) this.tickOrbQueue(u, dt);
    }
  }

  step(dt) {
    if (this.over) return;
    this.time += dt;
    this.stalemateAcc = (this.stalemateAcc || 0) + dt;
    if (!this.immuneOff && this.stalemateAcc >= 0.5) {
      this.stalemateAcc = 0;
      this.checkStalemate();
    }
    this.esperTick();
    this.augTick(dt);
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
      if (u.bulkUntil && this.time >= u.bulkUntil) this.bulkEnd(u);
      if (u.gyaraFx) {
        this.tickGyara(u, dt);
        continue;
      }
      if (u.egg) continue;
      if (u.sleep && !u.sleep.awake) continue;
      u.atkTimer -= dt;
      if (u.channel && this.runChannel(u, dt)) {
        if (u.moving) {
          u.moveRemain -= dt;
          if (u.moveRemain <= 0) u.moving = false;
        }
        continue;
      }
      if (u.moving) {
        u.moveRemain -= dt;
        if (u.moveRemain > 0) continue;
        u.moving = false;
      }
      if (u.bulkUntil) continue;
      if (u.stunUntil > this.time) continue;
      if (u.charmUntil) {
        const ct = this.byUid[u.charmTo];
        if (this.time >= u.charmUntil || !ct || !ct.alive) {
          u.charmUntil = 0;
          u.charmTo = 0;
        } else {
          if (this.distTo(u, ct) <= u.range) {
            if (u.atkTimer <= 0) {
              this.strike(u, ct, false);
              u.atkTimer = 1 / this.attackSpeed(u);
            }
          } else {
            const s = this.pathStep(u, ct) || this.greedyStep(u, ct);
            if (s) this.moveTo(u, s[0], s[1]);
          }
          continue;
        }
      }
      if (!u.target || !this.canTarget(u, u.target)) this.setTarget(u, this.nearestEnemy(u));
      let t = u.target;
      if (!t) continue;
      let d = this.distTo(u, t);
      if (d > u.range) {
        const n = this.nearestEnemy(u);
        if (n && n !== t && this.distTo(u, n) < d) {
          this.setTarget(u, n);
          t = n;
          d = this.distTo(u, t);
        }
      }
      if (u.cavalryStun && u.lastDash !== t.uid) {
        u.lastDash = t.uid;
        this.dash(u, t);
        if (u.moving) continue;
        d = this.distTo(u, t);
      }
      if (d <= u.range) {
        if (u.atkTimer <= 0 && !u.channel) {
          if (u.pp >= u.maxPP && !u.noSkill) this.castSkill(u, t);
          else this.strike(u, t, false);
          u.atkTimer = 1 / this.attackSpeed(u);
        }
      } else {
        if (u.rootUntil > this.time) continue;
        let s = this.pathStep(u, t);
        if (!s) {
          const alt = this.reachableFoe(u, t);
          if (alt) {
            this.setTarget(u, alt.o);
            t = alt.o;
            s = alt.step;
            if (!s) continue;
          }
        }
        if (!s) s = this.greedyStep(u, t);
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
    if (!this.overtime && this.time >= CONFIG.combat.overtimeAt) {
      this.overtime = true;
      this.emit({ type: 'overtime' });
    }
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
