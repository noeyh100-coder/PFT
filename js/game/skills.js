function skillParamsOf(form) {
  if (!form || typeof SKILL_P === 'undefined') return {};
  return SKILL_P[form.name + '·' + form.skill] || SKILL_P[form.name] || {};
}

const SKILL_P = {
  '캐터피': { m: 1.5, spe: -2 },
  '단데기': { def: 2, dur: 5, shield: 0.15, reflect: 0.2 },
  '버터플': { m: 1.2 },
  '꼬렛': { m: 1.7, range: 3 },
  '레트라': { m: 2.0, range: 3 },
  '모래두지': { m: 1.8, buff: 1, heal: 0.25, debuff: 1 },
  '고지': { m: 2.1, buff: 2, heal: 0.4, debuff: 2 },
  '푸푸린': { m: 1.5, ring: 0, stun: 1.5 },
  '푸린': { m: 1.7, ring: 1, stun: 1.5 },
  '푸크린': { m: 2.0, ring: 1, stun: 2 },
  '콘팡': { m: 1.8, n: 1, red: 0 },
  '도나리': { m: 2.2, n: 2, red: 0 },
  '고라파덕': { m: 1.7, line: 0 },
  '골덕': { m: 2.1, line: 2 },
  '발챙이': { m: 1.8, heal: 0.02 },
  '슈륙챙이': { m: 2.1, heal: 0.03 },
  '강챙이': { m: 2.4, heal: 0.04 },
  '왕구리': { m: 2.3 },
  '두두': { m: 1.8, behind: 1 },
  '두트리오': { m: 2.15, behind: 2 },
  '슬리프': { m: 2.0, steal: 0.4, stunMul: 1.5, guard: 0 },
  '슬리퍼': { m: 2.4, steal: 0.5, stunMul: 2, guard: 0, guardDef: 0 },
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
  '쏘드라': { m: [2.1, 2.3, 2.6] },
  '시드라': { m: [2.3, 2.5, 2.8] },
  '킹드라': { m: [2.5, 2.7, 3.0] },
  '코일': { m: 2.15, chance: 0.2 },
  '레어코일': { m: 2.55, chance: 0.2 },
  '자포코일': { m: 2.9, chance: 0.2 },
  '마그비': { m: 1.7, ring: 0, chance: 0.3 },
  '마그마': { m: 1.9, ring: 1, chance: 0.3 },
  '마그마번': { m: 2.2, ring: 1, chance: 0.5 },
  '깨비참': { m: 0.75, crit: 1 },
  '깨비드릴조': { m: 0.9, crit: 1 },
  '뿔충이': { m: 1.5, spe: -2 },
  '딱충이': { def: 2, dur: 3, thorn: 0.6 },
  '독침붕': { m: 2.05 },
  '파오리': { m: 2.3, crit: 1 },
  '셀러': { def: 2, dur: 4, red: 0.2, m: 1.5 },
  '파르셀': { def: 3, dur: 5, red: 0.3, m: 1.75 },
  '크랩': { m: 2.0, splash: 0 },
  '킹크랩': { m: 2.4, splash: 0 },
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
  '뿔카노': { m: 1.8, def: 1 },
  '코뿌리': { m: 2.1, def: 1 },
  '거대코뿌리': { m: 2.6, stun: 1.5, root: 2 },
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
  '아르코': { m: 1.0, dur: 2, regen: 0.03 },
  '파라스': { chance: 0.5 },
  '파라섹트': { chance: 1 },
  '배루키': { m: 1.7 },
  '시라소몬': { m: 2.0, knock: 3, crash: 0.3 },
  '홍수몬': { m: 1.8, dur: 1.5, dura: 0.6 },
  '카포에라': { m: 0.3, n: 11, pas: 0.5 },
  '캐이시': { m: 2.3, ring: 1, sleep: 1.5 },
  '윤겔라': { m: 2.7, ring: 1, sleep: 1.5 },
  '이상해씨': { heal: 0.7, beam: 0.2 },
  '이상해풀': { heal: 0.7, beam: 0.25 },
  '이상해꽃': { heal: 0.7, beam: 0.3 },
  '파이리': { m: 2.6, chance: 0.5, splash: 0.3 },
  '리자드': { m: 2.8, chance: 0.5, splash: 0.3 },
  '리자몽': { m: 3.1, chance: 0.5, splash: 0.35 },
  '꼬부기': { m: 2.1 },
  '어니부기': { m: 2.5 },
  '거북왕': { m: 3.0 },
  '구구': { m: 1.9, splash: 0 },
  '피죤': { m: 2.15, splash: 0 },
  '피죤투': { m: 2.5, splash: 0.5 },
  '삐': { m: 1.9, chance: 0.3 },
  '삐삐': { m: 2.25, chance: 0.3 },
  '픽시': { m: 2.5, chance: 0.3 },
  '주뱃': { m: 0.85, n: 2 },
  '골뱃': { m: 1.0, n: 2 },
  '크로뱃': { m: 0.65, n: 4 },
  '에레키드': { m: 2.1, chance: 0.3 },
  '에레브': { m: 2.45, chance: 0.3 },
  '에레키블': { m: 2.85, chance: 0.5 },
  '폴리곤': { m: 2.15 },
  '폴리곤2': { m: 2.65 },
  '폴리곤Z': { m: 3.0, dur: 2 },
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
  '아쿠스타': { m: 2.7, heal: 0, spd: 0, shield: 0 },
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
  '쁘사이저': { m: 2.4, pas: 0.4 },
  '투구': { m: 1.9, pierce: 0.5, pp: 30, dur: 3 },
  '투구푸스': { m: 2.25, pierce: 0.5, pp: 30, dur: 3 },
  '왕눈해': { m: 2.0, chance: 0.1, r: 3 },
  '독파리': { m: 2.3, chance: 0.1, r: 3 },
  '캥카': { m: 1.0 },
  '탕구리': { m: 1.1 },
  '텅구리': { m: 1.3 },
  '가디': { m: 2.0, chance: 0.1, dash: false },
  '윈디': { m: 2.4, chance: 0.2, dash: true },
  '식스테일': { m: 2.0, radius: 2, crit: 0.2 },
  '나인테일': { m: 2.35, radius: 2, crit: 0.2 },
  '또가스': { m: 0.2, chance: 0.4, dur: 5, radius: 2 },
  '또도가스': { m: 0.25, chance: 0.4, dur: 5, radius: 2 },
  '질퍽이': { m: 2.3 },
  '질뻐기': { m: 2.65 },
  '켄타로스': { m: 2.65 },
  '롱스톤': { m: 1.8, def: 1, shield: 0.15 },
  '강철톤': { m: 2.2, def: 2, shield: 0.2 },
  '팬텀': { m: 2.5 },
  '망나뇽': { m: 0.3, n: [20, 30, 100], dur: 2 },
  '후딘': { m: 2.6, delay: 3, amp: 0.3, radius: 2 },
  '해피너스': { heal: 0.175, shield: 0.14 },
  '망키': { m: 1.8 },
  '성원숭': { m: 2.1 },
  '저승갓숭': { m: 1.8, per: 0.05 },
  '스라크': { m: 1.9, crit: 1 },
  '스라크·벌레먹기': { m: 1.6, heal: 0.4 },
  '발챙이·거품광선': { m: 1.8, behind: 1 },
  '슈륙챙이·거품광선': { m: 2.1, behind: 1 },
  '뚜벅쵸·꽃잎댄스': { m: 0.8, dur: 2, regen: 0.03 },
  '냄새꼬·꽃잎댄스': { m: 0.9, dur: 2, regen: 0.03 },
  '라플레시아·애시드봄': { m: 2.3 },
  '배루키·로킥': { m: 1.7, knock: 3, crash: 0.25 },
  '배루키·판별': { m: 1.6, dur: 1.5, def: 1 },
  '홍수몬·판별': { m: 2.2, dur: 2, def: 2 },
  '카포에라·마하펀치': { m: 2.0 },
  '왕구리·거품광선': { m: 2.4, behind: 2 },
  '핫삼': { m: 0.3, n: 12 },
  '사마자르': { m: 2.0, rock: 0.5 },
  '프테라': { m: 2.2 },
  '먹고자': { stock: 0.02, cap: 1, wake: 0.3, heal: 0.4, giga: 1.75, press: 1.05, air: 1.5, again: 0.6, air2: 1, spe: 2.0, pp: 30 },
  '잠만보': { stock: 0.03, cap: 1, wake: 0.3, heal: 0.4, giga: 2.5, press: 1.5, air: 1.5, again: 0.6, air2: 1, spe: 2.0, pp: 30 },
  '라프라스': { m: 2.3 },
  '프리져': { m: 0.4, radius: 2, dur: 5 },
  '파이어': { orb: 1.5, blast: 2.0, stun: 1.5, arm: 3, burn: 5, anti: 0.5 },
  '썬더': { dur: 5 },
  '꼬렛·기습': { m: 1.7, extra: false },
  '레트라·기습': { m: 2.2, extra: true },
  '모래두지·아이스스피너': { m: 1.5, buff: 1, heal: 0.25, chill: 1 },
  '고지·아이스스피너': { m: 1.8, buff: 2, heal: 0.4, chill: 2 },
  '나시·용의파동': { m: 2.0 },
  '파오리·바위깨기': { m: 2.2, n: 1 },
  '창파나이트·스타어설트': { m: 3.2, stun: 1 },
  '마임맨·오로라베일': { m: 1.8, red: 0.2, dur: 6, radius: 2, shield: 0.2, chill: 1 },
  '마임꽁꽁·오로라베일': { m: 2.1, red: 0.25, dur: 6, radius: 2, shield: 0.25, chill: 2 },
  '포니타·매지컬샤인': { m: 1.6, conf: 0 },
  '날쌩마·매지컬샤인': { m: 1.95, conf: 0.3 },
  '나옹·도둑질': { m: 1.7, ring: 0, gold: 1 },
  '페르시온·도둑질': { m: 2.1, ring: 1, gold: 2 },
  '나옹·메탈클로': { m: 1.8, chance: 0.5 },
  '나이킹·메탈클로': { m: 2.1, chance: 1 },
  '디그다·아이언헤드': { m: 2.2, splash: 0 },
  '닥트리오·아이언헤드': { m: 2.6, splash: 0.5 },
  '라이츄·사이코키네시스': { m: 2.7 },
  '꼬마돌·와일드볼트': { m: 0.8, dur: 3, def: 1, red: 0, stun: 0, shield: 0, buff: 0, para: 0.2 },
  '데구리·와일드볼트': { m: 0.3, dur: 3, def: 0, red: 0.2, stun: 0, shield: 0.2, buff: 0, para: 0.3 },
  '딱구리·와일드볼트': { m: 1.1, dur: 4, def: 0, red: 0.3, stun: 0.5, shield: 0.25, buff: 2, para: 0.4 },
  '야돈·신통력': { m: 1.85, allies: false },
  '야도란·셸암즈': { m: 2.0, chance: 0.3 },
  '야도킹·기묘한주문': { m: 1.8, pp: 4 },
  '찌리리공·클로로블라스트': { m: 2.1, recoil: 0.15 },
  '붐볼·클로로블라스트': { m: 2.45, recoil: 0.15 },
  '텅구리·섀도본': { m: 1.3, chance: 0.2 },
  '가디·바위떨구기': { m: 2.0 },
  '윈디·분노의불꽃': { m: 2.6, splash: 0.5, burn: 0.3 },
  '식스테일·파우더스노': { m: 2.0, chill: 2 },
  '나인테일·눈보라': { m: 1.9 },
  '또도가스·이상한연기': { m: 1.9, chance: 0.5 },
  '질퍽이·탁쳐서떨구기': { m: 2.2 },
  '질뻐기·탁쳐서떨구기': { m: 2.55 },
  '켄타로스·레이징불': { m: 2.65 },
  '고라파덕·쓱쓱': { spe: 1, max: 6, spe6: 0.15, vamp6: 0.2 },
  '골덕·쓱쓱': { spe: 1, max: 6, spe6: 0.2, vamp6: 0.25 },
  '마그비·회오리불꽃': { k: 0.25, dur: 10, buff: 1 },
  '마그마·회오리불꽃': { k: 0.3, dur: 10, buff: 1 },
  '마그마번·회오리불꽃': { k: 0.35, dur: 10, buff: 1 },
  '모래두지·웅크리기': { red: 0.2, dur: 2, def: 1 },
  '고지·웅크리기': { red: 0.3, dur: 2, def: 1 },
  '뽀뽀라·악마의키스': { sleep: 2, heal: 0.3 },
  '루주라·악마의키스': { sleep: 2, heal: 0.35 },
  '콘치·아쿠아링': { heal: 0.3 },
  '왕콘치·아쿠아링': { heal: 0.35 },
  '뿔충이·마지막일침': { m: 1.5 },
  '딱충이·마지막일침': { m: 1.75 },
  '파오리·바둥바둥': { min: 1.5, max: 4.0 },
  '야돈·하품': { heal: 0.6, stacks: 2, sleep: 2 },
  '잉어킹·튀어오르기': { m: 1.6, shield: 0.5, splash: 0.5 },
  '포니타·불꽃세례': { m: 1.7, ring: 0, chance: 0.3 },
  '날쌩마·불꽃세례': { m: 1.9, ring: 1, chance: 0.3 },
  '피츄·100만볼트': { m: 1.9, every: 4, chance: 0.2 },
  '피카츄·100만볼트': { m: 2.25, every: 4, chance: 0.2 },
  '라이츄·100만볼트': { m: 2.55, every: 4, chance: 0.2 },
  '핑복·알낳기': { heal: 0.1 },
  '흉내내·리플렉터': { m: 1.7, red: 0.25, dur: 6, radius: 2, shield: 0.15 },
  '부스터·니트로차지': { m: 1.8, range: 3 },
  '블래키·맹독': { dur: 6 },
  '버터플·삼중가루': { para: 10, poison: 10, sleep: 2 },
  '배루키·카운터': { m: 1.5, dur: 1.5, dura: 0.6 },
  '배루키·인파이트': { m: 0.25, n: 11, pas: 0.4 },
  '질퍽이·녹기': { m: 1.6, buff: 2 },
  '질뻐기·녹기': { m: 1.9, buff: 2 },
  '찌리리공·대폭발': { base: 0.5, per: 0.04 },
  '붐볼·대폭발': { base: 0.6, per: 0.05 },
  '캥카·속이기/비장의무기': { m: 1.5, buff: 3, k2: 3.0 },
  '롱스톤·헤비봄버': { m: 1.0, rock: 0.5, air: 1.5, rocks: 12 },
  '강철톤·헤비봄버': { m: 1.2, rock: 0.6, air: 1.5, rocks: 12 },
  '스라크·엄습하는일격': { m: 2.2 }
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
      o.tmp.push({ k: 'def', value: statModifierDelta('def', n), until: this.time + 6 });
      o.tmp.push({ k: 'spd', value: statModifierDelta('spd', n), until: this.time + 6 });
    }
    if (has('에스퍼')) this.addConfuse(o, 3 * k);
    if (has('악')) {
      o.tmp.push({ k: 'atk', value: statModifierDelta('atk', -1), until: this.time + 99 });
      o.tmp.push({ k: 'spa', value: statModifierDelta('spa', -1), until: this.time + 99 });
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
    const accuracy = Math.max(0, Math.min(1, 1 + this.statModifier(u, 'acc') + statModifierDelta('acc', opt.acc || 0) - this.statModifier(t, 'eva')));
    if (!opt.sure && accuracy < 1) {
      if (this.rng.next() >= accuracy) {
        this.emit({ type: 'miss', target: t.uid });
        u.lastMissed = true;
        this.skillMissed = true;
        return 0;
      }
    }
    const special = opt.special != null ? opt.special : u.special;
    const roll = this.rng.next();
    const skillCritChance = special ? u.skillCritSpa || 0 : u.skillCritAtk || 0;
    const crit = roll < Math.min(1, skillCritChance + (opt.crit || 0));
    let raw = opt.raw != null ? opt.raw : this.offense(u) * mult * (u.special ? u.pwStar || 1 : 1);
    raw *= (1 + u.skillAmp) * this.skillScale;
    if (crit) raw *= cfg.critMult + (u.critDmg || 0);
    if (u.waterSkillAmp) raw *= 1 + u.waterSkillAmp;
    const dmg = this.dealDamage(u, t, raw, { special, crit, kind: 'skill', aoe: opt.aoe, ignoreShield: opt.ignoreShield, def: opt.def, ignoreUp: opt.ignoreUp });
    u.lastMissed = false;
    if (t === this.skillTarget && dmg > 0) this.lastHit = true;
    if (opt.burst !== false) this.emit({ type: 'hitfx', target: t.uid, kind: u.skillType });
    if (opt.onHit && t.alive) opt.onHit(t, dmg);
    if (opt.onKill && !t.alive) opt.onKill(t);
    return dmg;
  },

  hitAll(u, list, mult, o) {
    let total = 0;
    const opt = Object.assign({}, o, { aoe: true });
    for (const t of list) total += this.hit(u, t, mult, opt);
    return total;
  },

  chance(p) {
    return p > 0 && this.rng.next() < p;
  },

  hypnotize(u, t, dur) {
    if (!t || !t.alive) return;
    const d = this.stun(t, dur * this.durMul(u), u.side);
    if (d > 0 && u.form && u.form.name === '윤겔라') this.side[u.side].stats.hypno += d;
  },

  status(u, t, kind, dur, p) {
    if (!t || !t.alive || (p != null && p < 1 && !this.chance(p))) return;
    const d = (dur || 0) * this.durMul(u);
    if (kind === 'stun') this.stun(t, d, u.side);
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
    t.tmp.push({ k, value: statModifierDelta(k, n), until: this.time + dur * this.durMul(u) });
  },

  buff(u, k, n, dur) {
    if (!n) return;
    u.tmp.push({ k, value: statModifierDelta(k, n), until: this.time + dur * this.durMul(u) });
  },

  perma(u, k, n) {
    addStatModifier(u, k, n);
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
    this.emit({ type: 'stun', target: u.uid, duration: d });
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
    u.pct.spe += P.spe || 2;
    u.maxPP = P.pp || 30;
    u.pp = 0;
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
      this.hitAll(u, this.ring(u, u.r, u.c, 2), (P.press || 1.5) * k, { special: false, onHit: o => this.stun(o, air, u.side) });
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
    const tg = S.farthestWithin(u, P.range || 3) || t;
    S.skillTarget = tg;
    S.dashTo(u, tg);
    S.hit(u, tg, P.m, {});
  },
  '기습'(S, u, t, P) {
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
    S.hitAll(u, list, P.m, { onHit: o => S.status(u, o, 'stun', P.stun) });
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
        if (has('벌레')) for (const e of S.foesOf(u)) e.pp = Math.max(0, e.pp * (1 - Math.min(0.6, 0.3 * k)));
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
    S.hit(u, t, P.m, { onHit: o => S.status(u, o, 'stun', 1, 0.1) });
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
    let splash = 2;
    if (scales > 6) {
      S.hitAll(u, S.line(u, t, 2), P.m[2], {});
      splash = 3;
    } else if (scales > 3) {
      S.hitAll(u, S.cone(u, t, 2), P.m[1], { onHit: o => S.status(u, o, 'para', 3, 0.3) });
    } else {
      S.ringFx(u, t.r, t.c, 1);
      S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m[0], { onHit: o => S.status(u, o, 'stun', 1, 0.2) });
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
      if (d > 0 && o.alive && S.stun(o, P.stun, u.side) !== 0) n += 1;
    }
    if (n) {
      S.buff(u, 'def', n, 5);
      S.buff(u, 'spd', n, 5);
    }
    u.rootUntil = S.time + P.root;
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
        S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, { onHit: o => S.status(u, o, 'stun', P.air) });
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
    const cands = S.foesOf(u).filter(o => S.statModifier(o, 'atk') >= 0).sort(strongerFirst);
    const tg = cands[0] || t;
    S.perma(tg, 'atk', -1);
    S.emit({ type: 'hitfx', target: tg.uid, kind: '풀' });
    S.healAmt(u, u, S.atkStat(tg) * P.heal);
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
      for (const o of S.ring(u, cr, cc, 2)) S.stun(o, (P.stun || 1.5) * S.durMul(u), u.side);
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
  '하이드로펌프'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 3), P.m, {});
  },
  '하이드로캐논'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 4), P.m, {});
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
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => { if (S.chance(P.chance)) S.perma(o, 'spa', -1); } });
  },
  '더블윙'(S, u, t, P) {
    u.wingN = P.n;
    u.wingM = P.m;
    S.emit({ type: 'buff', target: u.uid, kind: 'wing' });
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
    S.hitAll(u, S.line(u, t, S.distTo(u, t) + 2), P.m, {});
  },
  '일렉트릭볼'(S, u, t, P) {
    const ratio = S.attackSpeed(u) / Math.max(0.1, S.attackSpeed(t));
    S.hit(u, t, P.m * Math.max(1, Math.min(2, ratio)), {});
  },
  '화염방사'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 8), P.m, { onHit: o => S.status(u, o, 'burn', 3, P.chance != null ? P.chance : 0.3) });
  },
  '빛의장막'(S, u, t, P) {
    for (const a of S.alliesOf(u)) if (Hex.dist(u.r, u.c, a.r, a.c) <= 2) S.reduce(u, a, 0.3, 5, 'spec');
    S.hit(u, t, P.m, {});
  },
  '악의파동'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 1);
    S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, { onHit: o => S.status(u, o, 'stun', 1, 0.2) });
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
    const list = [t].concat(S.foesOf(u).filter(o => o !== t).sort((a, b) => Hex.dist(a.r, a.c, t.r, t.c) - Hex.dist(b.r, b.c, t.r, t.c) || a.uid - b.uid).slice(0, 2));
    S.hitAll(u, list, P.m, {
      onHit: o => {
        if (['atk', 'spa', 'def', 'spd', 'spe'].some(k => S.statModifier(o, k) > 0)) S.status(u, o, 'confuse', 2);
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
    S.hit(u, t, P.m, { def: true });
    for (const o of [t].concat(S.ring(u, t.r, t.c, 1).filter(x => x !== t))) S.debuff(u, o, 'def', -1, 4);
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
    for (const o of S.units) {
      if (o === u || !o.alive) continue;
      const sum = ['atk', 'spa', 'def', 'spd', 'spe', 'acc', 'eva', 'crit'].reduce((s, k) => s + Math.max(0, S.statModifier(o, k) / STAT_MODIFIER_PER_POINT[k]), 0);
      if (sum > bestSum) {
        best = o;
        bestSum = sum;
      }
    }
    if (best) {
      for (const k of ['atk', 'spa', 'def', 'spd', 'spe', 'acc', 'eva', 'crit']) {
        const n = Math.max(0, S.statModifier(best, k) / STAT_MODIFIER_PER_POINT[k]);
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
    if (u.form && u.form.name === '쁘사이저') {
      u.xCross = true;
      S.emit({ type: 'buff', target: u.uid, kind: 'xcross' });
      return;
    }
    S.hit(u, t, P.m, { crit: P.crit });
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
    if (P.pp && kill && t && !t.alive) u.pp = Math.min(u.maxPP, u.pp + P.pp);
  },
  '바위깨기'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'def', -P.n, 4) });
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
    let tg = t;
    for (let n = 0; n < 3 && tg; n++) {
      if (P.dash) S.dashTo(u, tg);
      S.skillTarget = tg;
      S.hit(u, tg, P.m, {
        onHit: o => {
          if (!S.chance(P.chance)) return;
          if (S.rng.next() < 0.5) S.status(u, o, 'burn', 3);
          else S.status(u, o, 'stun', 1);
        }
      });
      if (tg.alive || !u.alive) break;
      S.emit({ type: 'buff', target: u.uid, kind: 'again' });
      tg = S.nearestEnemy(u);
    }
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
  '더스트슈트'(S, u, t, P) {
    S.hit(u, t, P.m, { acc: -1, onHit: o => S.status(u, o, 'poison', 3, 0.3) });
  },
  '이판사판태클'(S, u, t, P) {
    S.dashTo(u, t);
    const d = S.hit(u, t, P.m, {});
    if (d > 0) S.dealDamage(null, u, d * 0.25, { trueDmg: true, kind: 'recoil' });
    if (u.alive) S.timedShield(u, (u.maxHp - u.hp) * 0.7, 0);
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
    if (!t) return;
    const list = [t].concat(S.ring(u, t.r, t.c, P.radius).filter(o => o !== t && !o.gyaraFx));
    const until = S.time + P.delay;
    for (const o of list) o.fsMark = { by: u.uid, until, acc: 0, amp: P.amp, m: P.m, done: false };
    S.ringFx(u, t.r, t.c, P.radius);
    S.later(P.delay, () => {
      for (const o of list) S.futurePop(o);
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
    if (!t) return;
    const m = P.m * (1 + (P.per || 0.05) * (u.rageHits || 0));
    const d0 = Hex.dist(u.r, u.c, t.r, t.c);
    const back = S.foesOf(u).filter(o => o !== t && Hex.dist(o.r, o.c, t.r, t.c) <= 1 && Hex.dist(u.r, u.c, o.r, o.c) >= d0);
    S.hit(u, t, m, {});
    S.hitAll(u, back, m, { burst: false });
  },
  '연속자르기'(S, u, t, P) {
    if (u.furyTarget === t.uid) u.furyN = Math.min(3, (u.furyN || 0) + 1);
    else u.furyN = 0;
    u.furyTarget = t.uid;
    S.hit(u, t, P.m * Math.pow(2, u.furyN), {});
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
  '원시의힘'(S, u, t, P) {
    if (!t) return;
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, [t].concat(S.ring(u, t.r, t.c, 1).filter(o => o !== t)), P.m, {});
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
    S.hitAll(u, S.cone(u, t, 2), P.m, { onHit: o => S.status(u, o, 'stun', 1, 0.3) });
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
  '아이스스피너'(S, u, t, P) {
    S.buff(u, 'def', P.buff, 5);
    S.buff(u, 'spd', P.buff, 5);
    S.healAmt(u, u, (u.maxHp - u.hp) * P.heal);
    S.ringFx(u, u.r, u.c, 1);
    S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, { onHit: o => S.chillN(u, o, P.chill) });
  },
  '용의파동'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 2), P.m, {});
    for (const a of S.alliesOf(u)) if (Hex.dist(u.r, u.c, a.r, a.c) <= 1) S.buff(a, 'spd', 1, 5);
  },
  '스타어설트'(S, u, t, P) {
    S.dashTo(u, t);
    S.hit(u, t, P.m, {});
    S.selfStun(u, P.stun);
  },
  '오로라베일'(S, u, t, P) {
    for (const a of S.alliesOf(u)) if (Hex.dist(u.r, u.c, a.r, a.c) <= P.radius) S.reduce(u, a, P.red, P.dur, 'all');
    S.shieldPct(u, P.shield, 0);
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.chillN(u, o, P.chill) });
  },
  '매지컬샤인'(S, u, t, P) {
    S.dashTo(u, t);
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => { if (P.conf) S.status(u, o, 'confuse', 2, P.conf); } });
    if ((u.nitroN || 0) < 3) {
      u.nitroN = (u.nitroN || 0) + 1;
      S.perma(u, 'spe', 1);
    }
  },
  '메탈클로'(S, u, t, P) {
    S.hit(u, t, P.m, {});
    if ((u.clawN || 0) < 3 && S.chance(P.chance)) {
      u.clawN = (u.clawN || 0) + 1;
      S.perma(u, 'atk', 1);
    }
  },
  '아이언헤드'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.status(u, o, 'stun', 1, 0.3) });
    if (P.splash) S.hitAll(u, S.ring(u, t.r, t.c, 1).filter(o => o !== t), P.m * P.splash, {});
  },
  '와일드볼트'(S, u, t, P) {
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
        S.hitAll(u, list, P.m * (1 + 0.5 * n), {
          onHit: o => {
            if (P.stun) S.status(u, o, 'stun', P.stun);
            S.status(u, o, 'para', 3, P.para);
          }
        });
        n += 1;
      },
      end: () => {
        S.shieldPct(u, P.shield, 0);
        S.buff(u, 'def', P.buff, 5);
        S.buff(u, 'spd', P.buff, 5);
      }
    });
  },
  '셸암즈'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.status(u, o, 'poison', 3, P.chance) });
    S.buff(u, 'def', 1, 5);
    S.buff(u, 'spd', 1, 5);
  },
  '기묘한주문'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => { o.pp = Math.max(0, o.pp - P.pp); } });
    S.buff(u, 'spd', 1, 5);
  },
  '클로로블라스트'(S, u, t, P) {
    S.ringFx(u, u.r, u.c, 1);
    const total = S.hitAll(u, S.ring(u, u.r, u.c, 1), P.m, {});
    if (total > 0) S.dealDamage(null, u, total * P.recoil, { trueDmg: true, kind: 'recoil' });
  },
  '섀도본'(S, u, t, P) {
    const deb = o => S.debuff(u, o, 'def', -1, 4, P.chance);
    S.hit(u, t, P.m, { onHit: deb });
    if (t.alive) S.hit(u, t, P.m, { onHit: deb });
    const ax = S.axis(u, t);
    const back = S.foesOf(u).filter(o => {
      if (o === t) return false;
      const q = S.project(ax, o);
      return q.along > 0.3 && q.along < ax.len - 0.3 && q.side <= 0.62;
    });
    S.hitAll(u, back, P.m, { onHit: deb });
  },
  '바위떨구기'(S, u, t, P) {
    S.hit(u, t, P.m, { onHit: o => S.debuff(u, o, 'spe', -1, 4) });
  },
  '분노의불꽃'(S, u, t, P) {
    S.dashTo(u, t);
    const burn = o => S.status(u, o, 'burn', 3, P.burn);
    S.hit(u, t, P.m, { onHit: burn });
    if (P.splash) S.hitAll(u, S.ring(u, t.r, t.c, 1).filter(o => o !== t), P.m * P.splash, { onHit: burn });
  },
  '파우더스노'(S, u, t, P) {
    S.hitAll(u, S.cone(u, t, 2), P.m, { onHit: o => S.chillN(u, o, P.chill) });
  },
  '이상한연기'(S, u, t, P) {
    S.ringFx(u, t.r, t.c, 1);
    S.hitAll(u, S.ring(u, t.r, t.c, 1), P.m, { onHit: o => S.status(u, o, 'confuse', 2, P.chance) });
  },
  '탁쳐서떨구기'(S, u, t, P) {
    if (t.shield > 0) {
      t.shield = 0;
      t.shieldTimed = [];
      S.emit({ type: 'buff', target: t.uid, kind: 'break' });
    }
    S.hit(u, t, P.m * (t.items && t.items.length ? 1.3 : 1), {});
  },
  '레이징불'(S, u, t, P) {
    S.dashTo(u, t);
    if (t.shield > 0) {
      t.shield = 0;
      t.shieldTimed = [];
      S.emit({ type: 'buff', target: t.uid, kind: 'break' });
    }
    const st = u.skillType;
    S.hit(u, t, P.m, {
      crit: st === '격투' ? 1 : 0,
      onHit: o => {
        if (st === '불꽃') S.status(u, o, 'burn', 3, 0.3);
        if (st === '물') S.debuff(u, o, 'spe', -1, 4);
      }
    });
  },
  '철제광선'(S, u, t, P) {
    S.hitAll(u, S.line(u, t, 4), P.m, {});
    S.dealDamage(null, u, u.maxHp * 0.25, { trueDmg: true, kind: 'recoil' });
  },
  '쓱쓱'(S, u, t, P) {
    if ((u.aquaN || 0) < P.max) {
      u.aquaN = (u.aquaN || 0) + 1;
      S.perma(u, 'spe', P.spe);
      S.emit({ type: 'buff', target: u.uid, kind: 'aquastep', value: u.aquaN });
      if (u.aquaN >= P.max) {
        u.pct.spe += P.spe6;
        u.vamp += P.vamp6;
      }
    } else S.perma(u, 'spe', P.spe);
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
      S.status(u, t, 'stun', P.sleep);
    }
    S.healAmt(u, u, u.maxHp * P.heal);
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
        S.status(u, o, 'stun', P.sleep);
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
  '맹독'(S, u, t, P) {
    if (t && t.alive) S.addPoison(t, u, P.dur, true);
    const n = S.foesOf(u).filter(o => o.toxicSince && o.poisonUntil > S.time).length;
    if (n) {
      S.buff(u, 'def', n, 5);
      S.buff(u, 'spd', n, 5);
    }
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
      S.status(u, c, 'stun', P.sleep);
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
      u.tmp.push({ k: 'def', value: statModifierDelta('def', P.buff), until: S.time + 999, feint: true });
      u.tmp.push({ k: 'spd', value: statModifierDelta('spd', P.buff), until: S.time + 999, feint: true });
      S.hit(u, t, P.m, { special: false, onHit: o => S.status(u, o, 'stun', 1) });
      return;
    }
    u.tmp = u.tmp.filter(b => b.feint !== true);
    S.dashTo(u, t);
    const raw = (S.defense(u, false) + S.defense(u, true)) * P.k2 * (u.pwStar || 1);
    S.hit(u, t, 1, { raw, special: false });
  },
  '헤비봄버'(S, u, t, P) {
    const c0 = S.densestFoe(u, 1) || t;
    if (!c0) return;
    S.dashTo(u, c0, 0.4);
    const raw = S.defense(u, false) * P.m * (u.pwStar || 1);
    S.later(0.4, () => {
      if (!u.alive) return;
      S.ringFx(u, u.r, u.c, 2);
      for (const o of S.foesOf(u)) S.hit(u, o, 1, { raw, special: false, burst: false, onHit: x => S.status(u, x, 'stun', P.air) });
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
  }
};

SKILLS['도둑질'] = SKILLS['고양이돈받기'];

Object.assign(CombatSim.prototype, SKILL_HELPERS);

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
