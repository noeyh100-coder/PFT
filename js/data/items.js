const ITEM_STAT_LABEL = { atk: '공격', spa: '특수공격', def: '방어', spd: '특수방어', spe: '스피드', crit: '급소율', hp: '체력', pp: '시작 PP' };

const ITEM_COMPONENTS = [
  { id: 'muscle-band', name: '힘의머리띠', stats: { atk: 1 } },
  { id: 'wise-glasses', name: '박식안경', stats: { spa: 1 } },
  { id: 'protective-pads', name: '방호패드', stats: { def: 1 } },
  { id: 'x-sp-def', name: '스페셜가드', stats: { spd: 1 } },
  { id: 'leftovers', name: '먹다남은음식', stats: { hp: 150 } },
  { id: 'swift-wing', name: '순발력깃털', stats: { spe: 1 } },
  { id: 'razor-claw', name: '예리한손톱', stats: { crit: 1 } },
  { id: 'leppa-berry', name: '과사열매', stats: { pp: 5 } }
];

const ITEM_COMPLETED = [
  { id: 'choice-band', name: '구애머리띠', from: ['muscle-band', 'muscle-band'], desc: '공격이 30% 증가합니다.' },
  { id: 'expert-belt', name: '달인의띠', from: ['wise-glasses', 'muscle-band'], desc: '효과가 굉장한 상대에게 주는 최종 피해가 60%, 그 밖의 상대에게는 10% 증가합니다.' },
  { id: 'choice-specs', name: '구애안경', from: ['wise-glasses', 'wise-glasses'], desc: '특수공격이 25% 증가합니다.' },
  { id: 'covert-cloak', name: '은밀망토', from: ['protective-pads', 'muscle-band'], unique: true, desc: '체력이 처음으로 40% 이하가 되면 2초 동안 대상으로 지정되지 않고, 잃은 체력의 60%를 회복합니다.' },
  { id: 'eviolite', name: '진화의휘석', from: ['protective-pads', 'wise-glasses'], unique: true, desc: '아직 진화할 수 있는 포켓몬이면 체력·공격·특수공격·방어·특수방어가 1.2배가 됩니다.' },
  { id: 'rocky-helmet', name: '울퉁불퉁맷', from: ['protective-pads', 'protective-pads'], bonus: { def: 3 }, desc: '방어가 크게 오르고, 기본 공격에 맞으면 받은 피해의 50%를 공격한 적에게 돌려줍니다.' },
  { id: 'shell-bell', name: '조개껍질방울', from: ['x-sp-def', 'muscle-band'], desc: '모든 피해 흡혈 40%.' },
  { id: 'full-incense', name: '만복향로', from: ['x-sp-def', 'wise-glasses'], desc: '2칸 안의 적의 특수방어와 스피드가 1랭크 내려갑니다.' },
  { id: 'kings-rock', name: '왕의징표석', from: ['x-sp-def', 'protective-pads'], bonus: { hp: 150 }, desc: '2칸 안의 적 1명마다 방어·특수방어가 1랭크씩 오릅니다(최대 4). 기본 공격 때 30% 확률로 적을 1.5초 동안 풀죽음(기절) 상태로 만듭니다.' },
  { id: 'assault-vest', name: '돌격조끼', from: ['x-sp-def', 'x-sp-def'], bonus: { spd: 3, hp: 200 }, desc: '특수방어가 크게 오르고, 6초마다 공격·특수공격이 1랭크씩 오릅니다.' },
  { id: 'weakness-policy', name: '약점보험', from: ['leftovers', 'muscle-band'], desc: '효과가 굉장한 공격을 처음 맞으면 최대 체력 30%의 보호막을 얻고 공격·특수공격이 30% 증가합니다.' },
  { id: 'black-sludge', name: '검은오물', from: ['leftovers', 'wise-glasses'], desc: '피해를 입힌 적의 회복량이 33% 줄고 화상을 입습니다.' },
  { id: 'flame-orb', name: '불구슬플레이트', from: ['leftovers', 'protective-pads'], desc: '바로 옆 칸의 적의 회복량이 33% 줄고 화상을 입습니다.' },
  { id: 'lax-incense', name: '무사태평향로', from: ['leftovers', 'x-sp-def'], desc: '2칸 안의 적의 방어와 명중률이 1랭크 내려갑니다.' },
  { id: 'big-root', name: '큰뿌리', from: ['leftovers', 'leftovers'], desc: '최대 체력이 20% 증가합니다.' },
  { id: 'black-belt', name: '검은띠', from: ['swift-wing', 'muscle-band'], desc: '최대 체력이 1300 이상인 적에게 주는 피해가 45% 증가합니다.' },
  { id: 'choice-scarf', name: '구애스카프', from: ['swift-wing', 'wise-glasses'], desc: '기본 공격할 때마다 공격 속도가 3%씩 오릅니다.' },
  { id: 'booster-energy', name: '부스트에너지', from: ['swift-wing', 'protective-pads'], desc: '기본 공격을 맞히거나 기본 공격·스킬에 맞을 때마다 공격·특수공격이 3%씩 오릅니다(최대 25번). 최대로 쌓이면 방어·특수방어가 2랭크 오릅니다.' },
  { id: 'silver-wing', name: '은빛날개', from: ['swift-wing', 'x-sp-def'], desc: '기본 공격할 때 주변 적 2명에게 투사체를 더 날려 기본 공격 피해의 30%를 입힙니다.' },
  { id: 'focus-sash', name: '기합의띠', from: ['swift-wing', 'leftovers'], unique: true, desc: '처음으로 쓰러질 피해를 받으면 쓰러지지 않고 2초 동안 체력 1로 버티며, 공격·특수공격이 20% 증가합니다.' },
  { id: 'zoom-lens', name: '망원렌즈', from: ['swift-wing', 'swift-wing'], bonus: { spe: 1 }, desc: '사거리가 1칸 늘고 스피드가 크게 오릅니다.' },
  { id: 'punching-glove', name: '펀치글러브', from: ['razor-claw', 'muscle-band'], bonus: { atk: 2 }, desc: '물리 스킬의 급소율이 1랭크 더 오릅니다.' },
  { id: 'black-glasses', name: '검은안경', from: ['razor-claw', 'wise-glasses'], bonus: { spa: 1 }, desc: '특수 스킬의 급소율이 1랭크 더 오릅니다.' },
  { id: 'shell-armor', name: '조가비갑옷', from: ['razor-claw', 'protective-pads'], desc: '급소에 맞지 않고, 받는 피해가 15% 줄어듭니다.' },
  { id: 'mental-herb', name: '멘탈허브', from: ['razor-claw', 'x-sp-def'], unique: true, desc: '전투 시작 후 18초 동안 군중 제어 효과에 걸리지 않고, 그동안 받는 피해가 25% 줄어듭니다.' },
  { id: 'metronome', name: '메트로놈', from: ['razor-claw', 'leftovers'], desc: '같은 대상을 3초 공격할 때마다 주는 피해가 30%씩 증가합니다. 대상을 바꾸면 처음부터 다시 쌓입니다.' },
  { id: 'spell-tag', name: '저주의부적', from: ['razor-claw', 'swift-wing'], bonus: { atk: 1 }, desc: '피해를 입힌 적의 방어가 6초 동안 3랭크 내려갑니다. (겹치지 않음)' },
  { id: 'scope-lens', name: '초점렌즈', from: ['razor-claw', 'razor-claw'], desc: '기본 공격이 모두 급소에 맞습니다. 같은 줄 양옆 아군의 급소율이 1랭크 오릅니다.' },
  { id: 'ether', name: 'PP에이드', from: ['leppa-berry', 'muscle-band'], desc: '기본 공격할 때 PP를 3 더 얻습니다.' },
  { id: 'soul-dew', name: '마음의물방울', from: ['leppa-berry', 'wise-glasses'], desc: '5초마다 특수공격이 18%씩 증가합니다.' },
  { id: 'soothe-bell', name: '평온의방울', from: ['leppa-berry', 'protective-pads'], desc: '공격에 맞을 때 PP를 2 더 얻습니다.' },
  { id: 'everstone', name: '변함없는돌', from: ['leppa-berry', 'x-sp-def'], unique: true, bonus: { hp: 350 }, desc: '진화하지 않습니다. 별은 오르지만 모습·스킬·타입은 그대로입니다. 돌을 빼면 전투를 한 번 치른 뒤 다음 라운드에 진화합니다.' },
  { id: 'super-potion', name: '좋은상처약', from: ['leppa-berry', 'leftovers'], desc: '매초 최대 체력의 1.5%를 회복합니다.' },
  { id: 'twisted-spoon', name: '휘어진스푼', from: ['leppa-berry', 'swift-wing'], bonus: { spa: 1 }, desc: '피해를 입힌 적의 특수방어가 6초 동안 3랭크 내려갑니다. (겹치지 않음)' },
  { id: 'dragon-fang', name: '용의이빨', from: ['leppa-berry', 'razor-claw'], desc: '기본 공격할 때 PP를 3 더 얻고, 급소에 맞히면 3을 더 얻습니다.' },
  { id: 'max-ether', name: 'PP맥스', from: ['leppa-berry', 'leppa-berry'], bonus: { pp: 4 }, desc: '시작 PP가 더 많고, 스킬을 쓴 뒤 PP를 12 얻습니다.' }
];

const ITEM_MAGNET = { id: 'magnet', name: '자석', kind: 'consumable', desc: '아이템을 가진 기물에게 쓰면 그 기물의 아이템을 모두 빼서 아이템 칸으로 돌려줍니다.' };

const ITEMS = (function () {
  const map = {};
  const recipe = {};
  for (const c of ITEM_COMPONENTS) map[c.id] = Object.assign({ kind: 'component', desc: '' }, c);
  for (const c of ITEM_COMPLETED) {
    const stats = {};
    for (const part of c.from.concat([null])) {
      const src = part ? map[part].stats : c.bonus || {};
      for (const k in src) stats[k] = (stats[k] || 0) + src[k];
    }
    map[c.id] = Object.assign({ kind: 'completed' }, c, { stats });
    recipe[c.from.slice().sort().join('+')] = c.id;
  }
  map[ITEM_MAGNET.id] = Object.assign({ stats: {} }, ITEM_MAGNET);
  return { map, recipe, components: ITEM_COMPONENTS.map(c => c.id), completed: ITEM_COMPLETED.map(c => c.id) };
})();

function itemDef(id) {
  return ITEMS.map[id] || null;
}

function combineItems(a, b) {
  return ITEMS.recipe[[a, b].sort().join('+')] || null;
}

function itemStatText(id) {
  const d = itemDef(id);
  if (!d || !d.stats) return '';
  const parts = [];
  for (const k of ['hp', 'atk', 'spa', 'def', 'spd', 'spe', 'crit', 'pp']) {
    const v = d.stats[k];
    if (!v) continue;
    parts.push(ITEM_STAT_LABEL[k] + ' +' + v + (k === 'hp' || k === 'pp' ? '' : '랭크'));
  }
  return parts.join(', ');
}

function itemTipText(id) {
  const d = itemDef(id);
  if (!d) return '';
  const lines = [d.name];
  const st = itemStatText(id);
  if (st) lines.push(st);
  if (d.desc) lines.push(d.desc);
  if (d.kind === 'component') {
    lines.push('');
    for (const other of ITEMS.components) {
      const out = combineItems(id, other);
      if (out) lines.push(d.name + ' + ' + itemDef(other).name + ' = ' + itemDef(out).name);
    }
  } else if (d.kind === 'completed') {
    lines.push('');
    lines.push(itemDef(d.from[0]).name + ' + ' + itemDef(d.from[1]).name + ' = ' + d.name);
  }
  return lines.join('\n');
}
