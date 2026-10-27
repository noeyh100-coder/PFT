const ITEM_STAT_LABEL = { atk: '물리공격', spa: '특수공격', def: '물리방어', spd: '특수방어', spe: '스피드', crit: '급소율', hp: '체력', pp: '시작 PP' };
const ITEM_STAT_FORMAT = { atk: 'percent', spa: 'flat', def: 'flat', spd: 'flat', spe: 'percent', crit: 'percentagePoints', hp: 'flat', pp: 'flat' };

const ITEM_COMPONENTS = [
  { id: 'muscle-band', name: '힘의머리띠', stats: { atk: 0.1 } },
  { id: 'wise-glasses', name: '박식안경', stats: { spa: 10 } },
  { id: 'protective-pads', name: '방호패드', stats: { def: 20 } },
  { id: 'x-sp-def', name: '스페셜가드', stats: { spd: 20 } },
  { id: 'leftovers', name: '먹다남은음식', stats: { hp: 150 } },
  { id: 'swift-wing', name: '순발력깃털', stats: { spe: 0.1 } },
  { id: 'razor-claw', name: '예리한손톱', stats: { crit: 0.1 } },
  { id: 'leppa-berry', name: '과사열매', stats: { pp: 15 } }
];

const ITEM_COMPLETED = [
  { id: 'choice-band', name: '구애머리띠', from: ['muscle-band', 'muscle-band'], bonus: { atk: 0.35 } },
  { id: 'super-potion', name: '좋은상처약', from: ['muscle-band', 'wise-glasses'], bonus: { atk: 0.05, spa: 5 }, extraStats: [{ label: '모든 피해 흡혈', value: 20, unit: '%', prefix: '' }], desc: '입힌 피해량의 25%만큼 체력 비율이 가장 낮은 아군을 회복시킵니다.' },
  { id: 'covert-cloak', name: '은밀망토', from: ['muscle-band', 'protective-pads'], unique: true, bonus: { atk: 0.05, spa: 15 }, extraStats: [{ label: '물리 피해 감소', value: 25, unit: '%', prefix: '' }], desc: '체력이 60% 이하로 떨어지면 잠시 대상으로 지정되지 않고 해로운 효과를 제거한 뒤 스피드 15%를 얻습니다.' },
  { id: 'shell-bell', name: '조개껍질방울', from: ['muscle-band', 'x-sp-def'], bonus: { atk: 0.05, spa: 15 }, extraStats: [{ label: '모든 피해 흡혈', value: 40, unit: '%', prefix: '' }], desc: '전투당 1회, 체력이 40% 이하가 되면 5초 동안 최대 체력의 25% 보호막을 획득합니다.' },
  { id: 'weakness-policy', name: '약점보험', from: ['muscle-band', 'leftovers'], bonus: { atk: 0.05 }, desc: '전투당 한 번, 효과가 굉장한 공격을 맞거나 체력이 60% 이하가 되면 최대 체력의 30% 보호막과 물리공격 30% 증가를 얻습니다.' },
  { id: 'black-belt', name: '검은띠', from: ['muscle-band', 'swift-wing'], bonus: { atk: 0.1, spa: 20 }, desc: '체력이 1750 이상인 적에게 피해를 주면 준 피해의 15%만큼 회복합니다.' },
  { id: 'punching-glove', name: '펀치글러브', from: ['muscle-band', 'razor-claw'], bonus: { atk: 0.25 }, desc: '물리 스킬에 급소가 적용되고 급소 피해량이 10% 증가합니다.' },
  { id: 'ether', name: 'PP에이드', from: ['muscle-band', 'leppa-berry'], bonus: { atk: 0.05 }, desc: '기본 공격 시 PP를 5 추가로 얻습니다.' },
  { id: 'choice-specs', name: '구애안경', from: ['wise-glasses', 'wise-glasses'], bonus: { spa: 35 } },
  { id: 'eviolite', name: '진화의휘석', from: ['wise-glasses', 'protective-pads'], unique: true, bonus: { spa: 10 }, desc: '아이템으로 얻은 능력치 중 가장 높은 능력치가 20% 증가하며, 진화하지 않은 경우 40% 증가합니다.' },
  { id: 'full-incense', name: '만복향로', from: ['wise-glasses', 'x-sp-def'], desc: '2칸 안 적의 특수방어를 30% 낮춥니다. 해당 적이 스킬을 사용하면 사용한 PP의 160%만큼 특수 피해를 입힙니다.' },
  { id: 'black-sludge', name: '검은오물', from: ['wise-glasses', 'leftovers'], bonus: { spa: 5 }, desc: '스킬 및 기본 공격 시 10초 동안 적에게 화상과 회복량 33% 감소를 적용합니다.' },
  { id: 'choice-scarf', name: '구애스카프', from: ['wise-glasses', 'swift-wing'], desc: '기본 공격 시 스피드 4% 획득.' },
  { id: 'black-glasses', name: '검은안경', from: ['wise-glasses', 'razor-claw'], bonus: { spa: 25, crit: 0.1 }, desc: '특수 스킬에 급소 적용 가능, 이미 스킬 급소가 가능한 경우 급소 피해량 10% 증가.' },
  { id: 'soul-dew', name: '마음의물방울', from: ['wise-glasses', 'leppa-berry'], bonus: { spa: 10 }, desc: '전투 시작 후 5초마다 특수공격이 30% 증가합니다.' },
  { id: 'rocky-helmet', name: '울퉁불퉁맷', from: ['protective-pads', 'protective-pads'], bonus: { def: 15, hp: 100 }, desc: '기본 공격 피해를 8% 감소시키고, 기본 공격을 받으면 인접한 적들에게 특수 피해를 입힙니다(쿨타임 2초).' },
  { id: 'kings-rock', name: '왕의징표석', from: ['protective-pads', 'x-sp-def'], bonus: { def: 5, spd: 5 }, desc: '자신을 공격하는 적 하나당 물리방어 및 특수방어 10 증가. 기본 공격 시 10% 확률로 적을 1.5초 기절시킵니다.' },
  { id: 'flame-orb', name: '불구슬플레이트', from: ['protective-pads', 'leftovers'], desc: '2초마다 2칸 안의 적 하나에게 10초 화상 및 회복량 33% 감소를 적용합니다(중복 불가).' },
  { id: 'booster-energy', name: '부스트에너지', from: ['protective-pads', 'swift-wing'], bonus: { def: -20 }, extraStats: [{ label: '특수방어', value: 20, unit: '', prefix: '+' }], desc: '피격당하거나 기본공격, 스킬 및 자신이 적중한 기본공격/특수공격 스킬 피해량 2%씩 증가(최대 25번). 최대 중첩 시 물리방어/특수방어 20 획득.' },
  { id: 'shell-armor', name: '조가비갑옷', from: ['protective-pads', 'razor-claw'], bonus: { def: 5, hp: 150, crit: 0.1 }, desc: '받는 급소 피해가 30% 감소하고 자신을 공격한 적의 급소율을 3초 동안 20% 감소시킵니다(중복 불가).' },
  { id: 'soothe-bell', name: '평온의방울', from: ['protective-pads', 'leppa-berry'], bonus: { def: 5 }, desc: '피격될 때 얻는 PP가 2배가 됩니다.' },
  { id: 'assault-vest', name: '돌격조끼', from: ['x-sp-def', 'x-sp-def'], bonus: { spd: 15, hp: 100 }, desc: '기본 공격 피해 8% 감소. 기본 공격을 하면 인접한 적에게 특수 피해를 입힙니다(쿨타임 2초).' },
  { id: 'lax-incense', name: '무사태평향로', from: ['x-sp-def', 'leftovers'], desc: '2칸 안 적의 물리방어 30% 감소. 전투 시작 후 15초 동안 물리방어/특수방어 25 획득.' },
  { id: 'mental-herb', name: '멘탈허브', from: ['x-sp-def', 'razor-claw'], unique: true, bonus: { spe: 0.2, crit: 0.1 }, desc: '전투 시작 후 18초 동안 군중제어 면역, 면역 동안 2초마다 스피드 3% 획득.' },
  { id: 'full-restore', name: '만병통치제', icon: 'full-restore', from: ['x-sp-def', 'leppa-berry'], unique: true, desc: '장착 기물과 주변 1칸 아군의 특수공격 25%, PP 10 획득 및 7초마다 해로운 효과를 제거합니다.' },
  { id: 'big-root', name: '큰뿌리', from: ['leftovers', 'leftovers'], bonus: { hp: 500 }, desc: '최대 체력의 30%에 해당하는 추가 체력을 얻습니다.' },
  { id: 'focus-sash', name: '기합의띠', from: ['leftovers', 'swift-wing'], unique: true, desc: '체력이 1만이 되면 사망하지 않고 물리공격을 30% 얻고 5초 동안 체력을 1로 유지합니다.' },
  { id: 'expert-belt', name: '달인의띠', from: ['leftovers', 'razor-claw'], bonus: { crit: 0.1 }, desc: '적 타입의 효과가 굉장할 때 해당 공격당 피해증폭 3% 획득.' },
  { id: 'rescue-hood', name: '레스큐후드', icon: 'rescue-hood', from: ['leftovers', 'leppa-berry'], unique: true, desc: '5초마다 1칸 내 아군의 체력을 회복시키고, 범위 공격을 받는 피해를 8% 감소시킵니다.' },
  { id: 'silver-wing', name: '은빛날개', from: ['swift-wing', 'x-sp-def'], desc: '기본 공격 시 대상 주변 적에게 추가 투사체를 발사해 기본 물리공격의 60% 피해를 입힙니다.' },
  { id: 'zoom-lens', name: '망원렌즈', from: ['swift-wing', 'swift-wing'], bonus: { spe: 0.2 }, extraStats: [{ label: '사거리', value: 1, unit: ' 증가', prefix: '+' }] },
  { id: 'spell-tag', name: '저주의부적', from: ['swift-wing', 'razor-claw'], bonus: { atk: 0.1, crit: 0.1 }, desc: '물리 피해를 입히면 3초 동안 적의 물리방어 30% 감소(중첩 불가).' },
  { id: 'twisted-spoon', name: '휘어진스푼', from: ['swift-wing', 'leppa-berry'], bonus: { spa: 10 }, desc: '특수 피해를 입히면 3초 동안 적의 특수방어 30% 감소(중복 불가).' },
  { id: 'scope-lens', name: '초점렌즈', from: ['razor-claw', 'razor-claw'], bonus: { crit: 0.2 }, desc: '피해가 무조건 급소에 맞으며, 가로로 인접한 아군 2명의 급소율 +20% 및 스피드 +10%.' },
  { id: 'everstone', name: '변함없는돌', from: ['razor-claw', 'leppa-berry'], unique: true, bonus: { crit: 0.1 }, desc: '장착 기물은 성이 올라가도 진화하지 않습니다. 모든 능력치 5% 증가, 최종 진화 상태가 아닐 시 10% 증가.' },
  { id: 'max-ether', name: 'PP맥스', from: ['leppa-berry', 'leppa-berry'], desc: '스킬 사용 시 PP 10 획득.' }
];

const ITEM_MAGNET = { id: 'magnet', name: '자석', kind: 'consumable', magnet: true, desc: '아이템을 가진 기물에게 쓰면 그 기물의 아이템을 모두 빼서 아이템 칸으로 돌려줍니다.' };

const ITEM_GOLDEN_MAGNET = { id: 'golden-magnet', name: '황금 자석', kind: 'consumable', magnet: true, keep: true, label: '무한 자석', desc: '아이템을 가진 기물에게 쓰면 그 기물의 아이템을 모두 빼서 아이템 칸으로 돌려줍니다. 써도 사라지지 않습니다.' };

const ITEM_LUCKY_BOX = { id: 'lucky-box', name: '행운의 아이템 상자', icon: 'lucky-box', kind: 'consumable', lucky: true, placeholder: true, label: '추천 아이템', desc: '포켓몬에게 쓰면 그 포켓몬에게 맞는 추천 완성 아이템 4개 중 하나를 골라 아이템 칸에 받습니다.' };

const ITEM_GLOVES = { id: 'thiefs-gloves', name: '도적의 장갑', icon: 'thiefs-gloves', kind: 'completed', special: true, gloves: true, unique: true, desc: '아이템 3칸을 모두 차지합니다. 라운드마다 무작위 완성 아이템 2개를 새로 끼고 싸웁니다.' };

const ITEM_GIMMICKS = [
  { id: 'mega-stone', name: '메가스톤', icon: 'mega-stone', gimmick: 'mega', desc: '장착한 포켓몬이 메가진화합니다. 물리공격·특수공격 중 높은 쪽이 30% 증가하고 스피드가 30% 증가하며, 최대 PP가 30% 감소합니다. 메가진화 모습이 없는 포켓몬은 무지갯빛 테두리가 일렁입니다.' },
  { id: 'z-crystal', name: 'Z크리스탈', icon: 'z-crystal', gimmick: 'z', desc: '전투마다 첫 스킬이 Z기술로 바뀌어 피해와 효과가 2배가 됩니다.' },
  { id: 'max-mushrooms', name: '다이버섯', icon: 'max-mushrooms', gimmick: 'dmax', desc: '전투가 시작되면 다이맥스합니다. 스킬을 3번 쓸 때까지 최대 체력이 1.5배가 되고, 스킬이 다이맥스 기술로 바뀌어 피해와 효과가 1.5배가 됩니다.' },
  { id: 'tera-orb', name: '테라스탈오브', icon: 'tera-orb', gimmick: 'tera', desc: '장착한 포켓몬이 테라스탈합니다. 받는 모든 공격은 효과가 별로(피해 5/6배), 주는 모든 공격은 효과가 굉장함(피해 1.2배) 판정을 받습니다.' }
];

const MEGA_FORMS = {
  Charizard: { en: 'Charizard-Mega-X', name: '메가리자몽X' },
  Kangaskhan: { en: 'Kangaskhan-Mega', name: '메가캥카' },
  Slowbro: { en: 'Slowbro-Mega', name: '메가야도란' },
  Aerodactyl: { en: 'Aerodactyl-Mega', name: '메가프테라' },
  Steelix: { en: 'Steelix-Mega', name: '메가강철톤' },
  Gengar: { en: 'Gengar-Mega', name: '메가팬텀' },
  Alakazam: { en: 'Alakazam-Mega', name: '메가후딘' },
  Mewtwo: { en: 'Mewtwo-Mega-Y', name: '메가뮤츠Y' }
};

const REC_ITEMS = {
  phys: ['choice-band', 'expert-belt', 'black-belt', 'punching-glove', 'scope-lens', 'spell-tag', 'shell-bell', 'silver-wing', 'covert-cloak', 'focus-sash', 'super-potion'],
  spec: ['choice-specs', 'expert-belt', 'black-glasses', 'soul-dew', 'twisted-spoon', 'max-ether', 'ether', 'choice-scarf', 'black-sludge', 'zoom-lens', 'full-restore'],
  tank: ['rocky-helmet', 'assault-vest', 'kings-rock', 'big-root', 'super-potion', 'flame-orb', 'full-incense', 'lax-incense', 'shell-armor', 'mental-herb', 'booster-energy', 'soothe-bell', 'weakness-policy', 'rescue-hood']
};

const ITEM_CANDIES = [
  { id: 'rare-candy', name: '이상한사탕', icon: 'rare-candy', maxCost: 5, desc: '기물에게 쓰면 별이 1 오릅니다.' }
];

const ITEM_DUPLICATORS = [
  { id: 'exp-s', name: '경험사탕S', icon: 'exp-candy-s', maxCost: 1, label: '소형 챔피언 복제기', desc: '1코스트 기물에게 쓰면 그 기물의 1성 복사본 하나를 대기석에 얻습니다.' },
  { id: 'exp-m', name: '경험사탕M', icon: 'exp-candy-m', maxCost: 3, label: '하급 챔피언 복제기', desc: '3코스트 이하 기물에게 쓰면 그 기물의 1성 복사본 하나를 대기석에 얻습니다.' },
  { id: 'exp-l', name: '경험사탕L', icon: 'exp-candy-l', maxCost: 5, label: '챔피언 복제기', desc: '기물에게 쓰면 그 기물의 1성 복사본 하나를 대기석에 얻습니다.' }
];

const ITEM_DICE = { id: 'loaded-dice', name: '두드리짱의 망치', icon: 'tinkaton-hammer', label: '시너지 상점', desc: '포켓몬에게 주면 소모되며, 상점 5칸이 그 포켓몬과 시너지(타입·직업)가 하나 이상 겹치는 포켓몬으로 바뀝니다. (무료, 현재 레벨의 상점 확률을 따름)' };

const ITEM_BOXES = [
  { id: 'poke-box', name: '작은 모으령 상자', icon: 'gimmi-small', box: 'component', desc: '클릭해서 열면 서로 다른 조합 아이템 4개 중 하나를 고릅니다.' },
  { id: 'great-box', name: '큰 모으령 상자', icon: 'gimmi-big', box: 'completed', desc: '클릭해서 열면 서로 다른 완성 아이템 4개 중 하나를 고릅니다.' },
  { id: 'forge-box', name: '대장간 상자', icon: 'dynite-ore', box: 'treasure3', desc: '클릭해서 열면 서로 다른 3등급 보물 4개 중 하나를 고릅니다.' },
  { id: 'radiant-box', name: '찬란한 모으령 상자', icon: 'gimmi-big', box: 'radiant', glow: true, desc: '클릭해서 열면 서로 다른 찬란한 아이템 5개 중 하나를 고릅니다. (찬란한 아이템: 완성 아이템의 두 배 효과)' }
];

const TREASURE_TIER_NAME = ['0등급', '1등급', '2등급', '3등급'];

const ITEM_TREASURES = [
  { id: 'absorb-bulb', name: '구근', tier: 0, icon: 'absorb-bulb', desc: '5초마다 피해증폭이 5%씩 증가합니다.' },
  { id: 'luminous-moss', name: '빛이끼', tier: 0, icon: 'luminous-moss', desc: '받는 피해가 5% 줄어듭니다.' },
  { id: 'rusted-sword-1', name: '녹슨검', tier: 1, icon: 'rusted-sword', desc: '모든 공격이 체력이 10% 이하인 적을 처형합니다. 적을 처치하면 3칸 안에서 가장 멀리 있는 적에게 이동해 공격의 100% 물리 피해를 입힙니다.' },
  { id: 'rusted-shield-1', name: '녹슨방패', tier: 1, icon: 'rusted-shield', desc: '체력이 처음으로 50% 이하가 되면 최대 체력 25%의 보호막을 얻고, 그 뒤 8초마다 최대 체력 10%의 보호막을 얻습니다.' },
  { id: 'griseous-orb-1', name: '큰백금옥', tier: 1, icon: 'griseous-orb', desc: '기본 공격이나 스킬에 맞을 때마다 물리방어·특수방어가 3씩 오릅니다(최대 15번). 최대로 쌓이면 공격받은 뒤 1칸 안의 적에게 물리방어·특수방어 중 높은 쪽의 50%만큼 특수 피해를 입힙니다. (재사용 대기시간 2초)' },
  { id: 'life-orb-1', name: '생명의구슬', tier: 1, icon: 'life-orb', desc: '적에게 받는 모든 피해가 5초에 걸쳐 나누어 들어옵니다. 체력이 처음으로 40% 이하가 되면 남은 피해를 모두 없애고, 5초 동안 잃은 체력의 50%만큼 보호막을 얻습니다.' },
  { id: 'red-orb-1', name: '주홍구슬', tier: 1, icon: 'red-orb', desc: '피해를 6번 입힐 때마다 체력이 가장 낮은 적 2명에게 충격을 가해 150의 물리 피해를 입힙니다.' },
  { id: 'blue-orb-1', name: '쪽빛구슬', tier: 1, icon: 'blue-orb', desc: '기본 공격할 때 PP를 10 더 얻습니다. 스킬을 쓴 뒤 PP를 5 얻고 특수공격이 5%씩 증가합니다.' },
  { id: 'rusted-sword-2', name: '강화 녹슨검', tier: 2, icon: 'rusted-sword', desc: '모든 공격이 체력이 12% 이하인 적을 처형합니다. 적을 처치하면 3칸 안에서 가장 멀리 있는 적에게 이동해 공격의 100% 물리 피해를 입히고, 5초 동안 내구력과 피해증폭이 10% 증가합니다.' },
  { id: 'rusted-shield-2', name: '강화 녹슨방패', tier: 2, icon: 'rusted-shield', desc: '체력이 처음으로 50% 이하가 되면 최대 체력 50%의 보호막을 얻고, 그 뒤 8초마다 최대 체력 10%의 보호막을 얻습니다.' },
  { id: 'griseous-orb-2', name: '강화 큰백금옥', tier: 2, icon: 'griseous-orb', desc: '기본 공격이나 스킬에 맞을 때마다 물리방어·특수방어가 5씩 오릅니다(최대 15번). 최대로 쌓이면 공격받은 뒤 1칸 안의 적에게 물리방어·특수방어 중 높은 쪽의 75%만큼 특수 피해를 입힙니다. (재사용 대기시간 2초)' },
  { id: 'life-orb-2', name: '강화 생명의구슬', tier: 2, icon: 'life-orb', desc: '적에게 받는 모든 피해가 7초에 걸쳐 나누어 들어옵니다. 체력이 처음으로 40% 이하가 되면 남은 피해를 모두 없애고, 10초 동안 잃은 체력의 50%만큼 보호막을 얻습니다.' },
  { id: 'red-orb-2', name: '강화 주홍구슬', tier: 2, icon: 'red-orb', desc: '피해를 6번 입힐 때마다 체력이 가장 낮은 적 2명에게 충격을 가해 250의 물리 피해를 입힙니다.' },
  { id: 'blue-orb-2', name: '강화 쪽빛구슬', tier: 2, icon: 'blue-orb', desc: '기본 공격할 때 PP를 20 더 얻습니다. 스킬을 쓴 뒤 PP를 8 얻고 특수공격이 7%씩 증가합니다.' },
  { id: 'rusted-sword-3', name: '완벽한 녹슨검', tier: 3, icon: 'rusted-sword', desc: '모든 공격이 체력이 15% 이하인 적을 처형합니다. 적을 처치하면 3칸 안에서 가장 멀리 있는 적에게 이동해 공격의 100% 물리 피해를 입히고, 5초 동안 내구력과 피해증폭이 15% 증가합니다. 처형할 때마다 3골드를 얻고 최대 체력의 40%를 회복합니다.' },
  { id: 'rusted-shield-3', name: '완벽한 녹슨방패', tier: 3, icon: 'rusted-shield', desc: '체력이 처음으로 50% 이하가 되면 최대 체력 70%의 보호막을 얻고, 그 뒤 8초마다 최대 체력 15%의 보호막을 얻습니다. 보호막을 얻을 때마다 가까운 적 3명에게 대지의 힘을 가해 최대 체력 15%만큼 특수 피해를 입힙니다.' },
  { id: 'griseous-orb-3', name: '완벽한 큰백금옥', tier: 3, icon: 'griseous-orb', desc: '기본 공격이나 스킬에 맞을 때마다 물리방어·특수방어가 10씩 오릅니다(최대 15번). 최대로 쌓이면 공격받은 뒤 1칸 안의 적에게 물리방어·특수방어 중 높은 쪽의 90%만큼 특수 피해를 입히고(재사용 대기시간 2초), 4칸 안의 적에게 높은 쪽의 50%만큼 고정 피해를 입힙니다(재사용 대기시간 3초).' },
  { id: 'life-orb-3', name: '완벽한 생명의구슬', tier: 3, icon: 'life-orb', desc: '적에게 받는 모든 피해가 10초에 걸쳐 나누어 들어옵니다. 체력이 처음으로 40% 이하가 되면 남은 피해를 모두 없애고, 15초 동안 잃은 체력의 50%만큼 보호막을 얻습니다. 잃은 체력의 비율만큼 모든 피해 흡혈을 얻습니다(최대 100%).' },
  { id: 'red-orb-3', name: '완벽한 주홍구슬', tier: 3, icon: 'red-orb', desc: '피해를 6번 입힐 때마다 체력이 가장 낮은 적 2명에게 충격을 가해 300의 물리 피해를 입힙니다. 충격을 가할 때마다 스피드가 20% 증가합니다.' },
  { id: 'blue-orb-3', name: '완벽한 쪽빛구슬', tier: 3, icon: 'blue-orb', desc: '기본 공격할 때 PP를 30 더 얻습니다. 스킬을 쓴 뒤 PP를 13 얻고 특수공격이 10%씩 증가합니다. 스킬을 쓸 때마다 이번 전투의 최대 PP가 5 줄어듭니다(최소 20).' }
];

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
    if (c.from.includes('leppa-berry')) stats.pp = 15;
    map[c.id] = Object.assign({ kind: 'completed' }, c, { stats });
    recipe[c.from.slice().sort().join('+')] = c.id;
  }
  const radiants = [];
  for (const c of ITEM_COMPLETED) {
    const b = map[c.id];
    const stats = {};
    for (const k in b.stats) stats[k] = b.stats[k] * 2;
    const id = 'radiant-' + c.id;
    map[id] = Object.assign({}, b, { id, base: c.id, radiant: true, name: '찬란한 ' + c.name, icon: c.icon || c.id, stats, desc: '효과와 능력치가 두 배로 적용됩니다.' + (c.desc ? ' (원래 효과: ' + c.desc + ')' : '') });
    radiants.push(id);
  }
  map[ITEM_MAGNET.id] = Object.assign({ stats: {} }, ITEM_MAGNET);
  map[ITEM_GOLDEN_MAGNET.id] = Object.assign({ stats: {} }, ITEM_GOLDEN_MAGNET);
  map[ITEM_LUCKY_BOX.id] = Object.assign({ stats: {} }, ITEM_LUCKY_BOX);
  map[ITEM_GLOVES.id] = Object.assign({ stats: {} }, ITEM_GLOVES);
  for (const g of ITEM_GIMMICKS) map[g.id] = Object.assign({ kind: 'completed', special: true, unique: true, stats: {} }, g);
  for (const c of ITEM_CANDIES) map[c.id] = Object.assign({ kind: 'consumable', candy: true, stats: {} }, c);
  for (const c of ITEM_DUPLICATORS) map[c.id] = Object.assign({ kind: 'consumable', dup: true, stats: {} }, c);
  map[ITEM_DICE.id] = Object.assign({ kind: 'consumable', traitShop: true, stats: {} }, ITEM_DICE);
  for (const b of ITEM_BOXES) map[b.id] = Object.assign({ kind: 'consumable', stats: {} }, b);
  for (const t of ITEM_TREASURES) map[t.id] = Object.assign({ kind: 'treasure', stats: {} }, t);
  const tiers = [[], [], [], []];
  for (const t of ITEM_TREASURES) tiers[t.tier].push(t.id);
  return { map, recipe, components: ITEM_COMPONENTS.map(c => c.id), completed: ITEM_COMPLETED.map(c => c.id), radiants, treasures: tiers };
})();

function itemDef(id) {
  return ITEMS.map[id] || null;
}

function itemBase(id) {
  const d = ITEMS.map[id];
  return d && d.base ? d.base : id;
}

function itemWeight(id) {
  const d = ITEMS.map[id];
  return d && d.radiant ? 2 : 1;
}

function itemCountMap(list) {
  const it = {};
  for (const id of list || []) {
    const b = itemBase(id);
    it[b] = (it[b] || 0) + itemWeight(id);
  }
  return it;
}

function isMagnet(id) {
  const d = ITEMS.map[id];
  return !!d && !!d.magnet;
}

function isGearItem(id) {
  const d = ITEMS.map[id];
  return !!d && d.kind !== 'consumable';
}

function itemSlotsUsed(items) {
  return (items || []).some(id => ITEMS.map[id] && ITEMS.map[id].gloves) ? 3 : (items || []).length;
}

function uniqueClash(items, id, skip) {
  const d = ITEMS.map[id];
  if (!d || !d.unique) return false;
  const b = itemBase(id);
  return (items || []).some((x, i) => i !== skip && itemBase(x) === b);
}

function recommendedPool(form) {
  const role = (form && form.role) || '';
  if (role.indexOf('탱커') >= 0) return REC_ITEMS.tank;
  return form && form.special ? REC_ITEMS.spec : REC_ITEMS.phys;
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
    const fmt = ITEM_STAT_FORMAT[k];
    const amount = fmt === 'percent' ? Math.round(v * 100) + '%' : fmt === 'percentagePoints' ? Math.round(v * 100) + '%p' : v;
    parts.push(ITEM_STAT_LABEL[k] + ' +' + amount);
  }
  for (const stat of d.extraStats || []) {
    const value = stat.value * (d.radiant ? 2 : 1);
    parts.push(stat.label + ' ' + (stat.prefix == null ? '+' : stat.prefix) + value + (stat.unit || ''));
  }
  return parts.join(', ');
}

function itemIconName(id) {
  const d = itemDef(id);
  return (d && d.icon) || id;
}

function isConsumable(id) {
  const d = itemDef(id);
  return !!d && d.kind === 'consumable';
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
  } else if (d.kind === 'completed' && d.from && !d.radiant) {
    lines.push('');
    lines.push(itemDef(d.from[0]).name + ' + ' + itemDef(d.from[1]).name + ' = ' + d.name);
  } else if (d.kind === 'treasure') {
    lines.splice(1, 0, '채굴 보물 · ' + TREASURE_TIER_NAME[d.tier]);
  }
  return lines.join('\n');
}

const ITEM_ICON_COLORS = {
  'choice-band': [96, 96, 178],
  'expert-belt': [99, 90, 99],
  'choice-specs': [255, 255, 90],
  'covert-cloak': [86, 106, 130],
  'eviolite': [206, 148, 230],
  'rocky-helmet': [255, 197, 0],
  'shell-bell': [239, 214, 214],
  'full-restore': [247, 212, 60],
  'full-incense': [222, 214, 0],
  'kings-rock': [230, 214, 90],
  'assault-vest': [206, 82, 82],
  'weakness-policy': [214, 247, 197],
  'black-sludge': [140, 140, 173],
  'flame-orb': [248, 88, 88],
  'lax-incense': [255, 222, 156],
  'big-root': [230, 206, 132],
  'black-belt': [99, 90, 99],
  'choice-scarf': [74, 156, 222],
  'booster-energy': [178, 97, 13],
  'silver-wing': [148, 173, 222],
  'focus-sash': [189, 49, 49],
  'zoom-lens': [197, 189, 58],
  'punching-glove': [216, 48, 49],
  'black-glasses': [99, 90, 99],
  'shell-armor': [102, 66, 91],
  'mental-herb': [143, 226, 226],
  'metronome': [134, 194, 230],
  'spell-tag': [152, 152, 152],
  'scope-lens': [66, 82, 99],
  'ether': [165, 197, 197],
  'soul-dew': [222, 197, 247],
  'soothe-bell': [214, 115, 107],
  'everstone': [181, 206, 214],
  'super-potion': [197, 99, 90],
  'rescue-hood': [93, 215, 135],
  'twisted-spoon': [107, 132, 132],
  'dragon-fang': [132, 107, 99],
  'max-ether': [49, 107, 66],
  'thiefs-gloves': [128, 66, 177],
  'mega-stone': [99, 230, 255],
  'z-crystal': [150, 182, 183],
  'max-mushrooms': [252, 176, 190],
  'tera-orb': [97, 64, 91]
};
