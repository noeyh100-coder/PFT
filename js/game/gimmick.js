const Z_MOVES = {
  '노말': '울트라대시어택', '격투': '전력무쌍격렬권', '비행': '파이널다이브클래시', '독': '애시드포이즌딜리트', '땅': '라이징랜드오버',
  '바위': '월즈엔드폴', '벌레': '절대포식회전참', '고스트': '무한암야로의유인', '강철': '초월나선연격', '불꽃': '다이내믹풀플레임',
  '물': '슈퍼아쿠아토네이도', '풀': '블룸샤인엑스트라', '전기': '스파킹기가볼트', '에스퍼': '맥시멈사이브레이커', '얼음': '레이징지오프리즈',
  '드래곤': '얼티메이트드래곤번', '악': '블랙홀이클립스', '페어리': '러블리스타임팩트'
};

const MAX_MOVES = {
  '노말': '다이어택', '격투': '다이너클', '비행': '다이제트', '독': '다이애시드', '땅': '다이어스', '바위': '다이록', '벌레': '다이웜',
  '고스트': '다이할로우', '강철': '다이스틸', '불꽃': '다이번', '물': '다이스트림', '풀': '다이그래스', '전기': '다이썬더',
  '에스퍼': '다이사이코', '얼음': '다이아이스', '드래곤': '다이드라군', '악': '다이아크', '페어리': '다이페어리'
};

const GIMMICK = { megaBonus: 2, megaAs: 0.3, megaPP: 0.3, zMult: 2, dmaxHp: 1.5, dmaxMult: 1.5, dmaxCasts: 3, super: 1.2, resist: 5 / 6 };

const GIMMICK_FX = {
  effMult(src, t) {
    const a = !!(src && src.tera);
    const d = !!(t && t.tera);
    if (a && d) return 1;
    if (d) return GIMMICK.resist;
    if (a) return GIMMICK.super;
    let m = typeMult(src ? src.skillType : null, t.defTypes);
    if (t.thickFat && src && (src.skillType === '불꽃' || src.skillType === '얼음') && m > 0) m = GIMMICK.resist;
    return m <= 0 && this.immuneOff ? 0.5 : m;
  },

  gimmickMods(u, a, b, live) {
    const had = !!(a && a['mega-stone']);
    const has = !!(b && b['mega-stone']);
    if (has && !had) {
      const key = this.atkView(u) >= this.spaStat(u) ? 'atk' : 'spa';
      u.megaKey = key;
      addStatModifier(u, key, GIMMICK.megaBonus);
      u.pct.as += GIMMICK.megaAs;
      u.megaPP = Math.min(u.maxMana - 1, Math.round(u.maxMana * GIMMICK.megaPP));
      u.maxMana -= u.megaPP;
      u.mana = Math.min(u.mana, u.maxMana);
      if (live) this.emit({ type: 'gimmick', uid: u.uid, kind: 'mega', on: true });
    } else if (had && !has && u.megaKey) {
      addStatModifier(u, u.megaKey, -GIMMICK.megaBonus);
      u.pct.as -= GIMMICK.megaAs;
      u.maxMana += u.megaPP || 0;
      u.megaKey = null;
      u.megaPP = 0;
      if (live) this.emit({ type: 'gimmick', uid: u.uid, kind: 'mega', on: false });
    }
    const tera = !!(b && b['tera-orb']);
    if (tera !== !!u.tera) {
      u.tera = tera;
      if (live) this.emit({ type: 'gimmick', uid: u.uid, kind: 'tera', on: tera });
    }
    if (!live) return;
    if (b && b['max-mushrooms'] && !u.dmaxUsed) this.dmaxStart(u);
    else if (!(b && b['max-mushrooms']) && u.dmax) this.dmaxEnd(u);
  },

  gimmickStart(units) {
    for (const u of units) {
      if (u.megaKey) this.emit({ type: 'gimmick', uid: u.uid, kind: 'mega', on: true });
      if (u.tera) this.emit({ type: 'gimmick', uid: u.uid, kind: 'tera', on: true });
      if (u.it['max-mushrooms'] && !u.dmaxUsed) this.dmaxStart(u);
    }
  },

  dmaxStart(u) {
    if (!u.alive || u.dmax) return;
    u.dmax = true;
    u.dmaxUsed = true;
    u.dmaxLeft = GIMMICK.dmaxCasts;
    const add = Math.round(u.maxHp * (GIMMICK.dmaxHp - 1));
    u.dmaxAdd = add;
    u.maxHp += add;
    u.hp += add;
    this.emit({ type: 'gimmick', uid: u.uid, kind: 'dmax', on: true });
  },

  dmaxEnd(u) {
    if (!u.dmax) return;
    u.dmax = false;
    const add = u.dmaxAdd || 0;
    u.dmaxAdd = 0;
    if (add) {
      const ratio = u.maxHp > 0 ? u.hp / u.maxHp : 1;
      u.maxHp = Math.max(1, u.maxHp - add);
      if (u.alive) u.hp = Math.max(1, Math.min(u.maxHp, Math.round(u.maxHp * ratio)));
    }
    this.emit({ type: 'gimmick', uid: u.uid, kind: 'dmax', on: false });
  },

  gimmickCast(u) {
    let m = 1;
    let name = null;
    if (u.it['z-crystal'] && !u.zUsed) {
      u.zUsed = true;
      m *= GIMMICK.zMult;
      name = Z_MOVES[u.skillType] || 'Z기술';
    }
    if (u.dmax && u.dmaxLeft > 0) {
      m *= GIMMICK.dmaxMult;
      if (!name) name = MAX_MOVES[u.skillType] || '다이맥스 기술';
    }
    if (name) this.emit({ type: 'gimmick', uid: u.uid, kind: 'move', move: name });
    return m;
  },

  gimmickAfterCast(u) {
    if (!u.dmax) return;
    u.dmaxLeft -= 1;
    if (u.dmaxLeft <= 0) this.dmaxEnd(u);
  }
};

Object.assign(CombatSim.prototype, GIMMICK_FX);
