const CONFIG = {
  startHp: 100,
  benchSize: 9,
  shopSize: 5,
  rerollCost: 2,
  xpCost: 4,
  xpAmount: 4,
  passiveXp: 2,
  maxLevel: 10,
  xpToNext: { 1: 2, 2: 2, 3: 6, 4: 10, 5: 20, 6: 36, 7: 56, 8: 68, 9: 68 },
  poolSize: { 1: 29, 2: 22, 3: 18, 4: 12, 5: 10 },
  shopOdds: {
    1: [100, 0, 0, 0, 0],
    2: [100, 0, 0, 0, 0],
    3: [75, 25, 0, 0, 0],
    4: [55, 30, 15, 0, 0],
    5: [45, 33, 20, 2, 0],
    6: [30, 40, 25, 5, 0],
    7: [19, 30, 40, 10, 1],
    8: [18, 25, 32, 22, 3],
    9: [10, 20, 25, 35, 10],
    10: [5, 10, 20, 40, 25]
  },
  baseIncome: 5,
  earlyIncome: 2,
  interestPer: 10,
  interestMax: 5,
  streakBonus(n) {
    if (n >= 6) return 3;
    if (n >= 5) return 2;
    if (n >= 2) return 1;
    return 0;
  },
  stageDamage: { 1: 0, 2: 2, 3: 5, 4: 8, 5: 10, 6: 12, 7: 17, 8: 25 },
  unitDamage: { 1: 1, 2: 2, 3: 3 },
  planningTime: { encounter: 10, early: 20, normal: 30, carousel: 15 },
  combat: {
    tick: 0.05,
    timeLimit: 40,
    moveTime: 0.4,
    dashTime: 0.15,
    maxMana: 20,
    ppPerAttack: 1,
    ppPerHit: 1,
    skillMult: 1.5,
    critMult: 1.5,
    critTable: [0.0417, 0.125, 0.5, 1],
    rankStep: 0.15,
    hitBonus: 0.1,
    rangedRange: 3
  },
  unlock: {
    magikarpBattles: 5,
    dratiniWins: 3,
    dragonairWins: 3,
    gastlyTakedowns: 8,
    hypnosisSeconds: 60,
    healStack: 3000,
    geneStack: 100,
    iceStarTotal: 10,
    electricStuns: 50,
    burnDamage: 5000,
    downloadStage1: 40,
    downloadStage2: 120,
    kabutoWins: 3,
    aerodactylLosses: 3
  },
  regions: ['알로라', '가라르', '히스이', '팔데아'],
  carouselCosts: {
    2: [1, 1, 1, 1, 2, 2, 2, 2, 2],
    3: [2, 2, 2, 2, 3, 3, 3, 3, 3],
    4: [3, 3, 3, 3, 3, 4, 4, 4, 4],
    5: [3, 3, 3, 4, 4, 4, 4, 5, 5],
    6: [4, 4, 4, 4, 4, 5, 5, 5, 5],
    7: [4, 4, 4, 4, 5, 5, 5, 5, 5]
  },
  pve: {
    '1-2': { leader: null, units: [
      { name: '비버니', star: 1, cost: 1, mult: 0.55, r: 4, c: 2 },
      { name: '비버니', star: 1, cost: 1, mult: 0.55, r: 4, c: 4 }
    ] },
    '1-3': { leader: null, units: [
      { name: '비버니', star: 1, cost: 1, mult: 0.6, r: 4, c: 2 },
      { name: '비버니', star: 1, cost: 1, mult: 0.6, r: 4, c: 4 },
      { name: '찌르꼬', star: 1, cost: 1, mult: 0.6, range: 3, r: 6, c: 3 }
    ] },
    '1-4': { leader: null, units: [
      { name: '비버니', star: 1, cost: 1, mult: 0.62, r: 4, c: 2 },
      { name: '비버니', star: 1, cost: 1, mult: 0.62, r: 4, c: 4 },
      { name: '찌르꼬', star: 1, cost: 1, mult: 0.62, range: 3, r: 6, c: 2 },
      { name: '찌르꼬', star: 1, cost: 1, mult: 0.62, range: 3, r: 6, c: 4 }
    ] },
    '2-7': { leader: 'Leader-2-7', units: [
      { name: '귀뚤톡크', star: 2, cost: 2, mult: 1.3, r: 4, c: 3 },
      { name: '귀뚤뚜기', star: 1, cost: 2, mult: 1.3, r: 4, c: 2 },
      { name: '귀뚤뚜기', star: 1, cost: 2, mult: 1.3, r: 4, c: 4 }
    ] },
    '3-7': { leader: 'Leader-3-7', units: [
      { name: '누오', star: 2, cost: 3, mult: 1.3, r: 4, c: 2 },
      { name: '토오', star: 2, cost: 3, mult: 1.3, r: 4, c: 4 },
      { name: '냐스퍼', star: 1, cost: 3, mult: 1.3, r: 6, c: 3 }
    ] },
    '4-7': { leader: 'Leader-4-7', units: [
      { name: '대포무노', star: 2, cost: 5, mult: 2.05, hpMult: 2.6, r: 5, c: 3, drops: 3 }
    ] },
    '5-7': { leader: 'Leader-5-7', units: [
      { name: '파치리스', star: 3, cost: 5, mult: 1.63, hpMult: 2.6, r: 4, c: 3, drops: 3 }
    ] },
    'default': { leader: null, units: [
      { name: '아르세우스', star: 3, cost: 5, mult: 1.53, hpMult: 2.5, r: 5, c: 3, drops: 4 }
    ] }
  },
  orbs: {
    1: { gray: 0.8, blue: 0.2, gold: 0 },
    2: { gray: 0.5, blue: 0.45, gold: 0.05 },
    3: { gray: 0.4, blue: 0.45, gold: 0.15 },
    4: { gray: 0.35, blue: 0.45, gold: 0.2 },
    5: { gray: 0.3, blue: 0.45, gold: 0.25 }
  },
  carousel: { firstRelease: 3, releaseGap: 5, lastWindow: 7, ringRadius: 84, spin: 0.22, pickRadius: 24, moveSpeed: 170 },
  strategists: ['Hazel', 'Ember', 'Moss', 'Scarlet', 'Indigo', 'Ebony', 'Sunny', 'Daisy'],
  maps: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'],
  botNames: ['반바지 꼬마', '등산가', '아가씨', '이과계 남자', '낚시꾼', '괴인', '엘리트 트레이너']
};

const TYPE_COLORS = {
  '노말': '#a8a77a', '불꽃': '#ee8130', '물': '#6390f0', '풀': '#7ac74c', '전기': '#f7d02c', '얼음': '#96d9d6',
  '격투': '#c22e28', '독': '#a33ea1', '땅': '#e2bf65', '비행': '#a98ff3', '에스퍼': '#f95587', '벌레': '#a6b91a',
  '바위': '#b6a136', '고스트': '#735797', '드래곤': '#6f35fc', '악': '#705746', '강철': '#b7b7ce', '페어리': '#d685ad'
};

const COST_COLORS = { 1: '#8c8c8c', 2: '#3fae5a', 3: '#3b7fd4', 4: '#a24bd6', 5: '#e0a51b' };
