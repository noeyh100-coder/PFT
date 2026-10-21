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
  { id: 'kings-rock', name: '왕의징표석', from: ['x-sp-def', 'protective-pads'], bonus: { hp: 150 }, desc: '2칸 안의 적 1명마다 방어·특수방어가 1랭크씩 오릅니다(최대 4). 기본 공격 때 10% 확률로 적을 1.5초 동안 풀죽음(기절) 상태로 만듭니다.' },
  { id: 'assault-vest', name: '돌격조끼', from: ['x-sp-def', 'x-sp-def'], bonus: { spd: 3, hp: 200 }, desc: '특수방어가 크게 오르고, 10초마다 공격·특수공격이 1랭크씩 오릅니다.' },
  { id: 'weakness-policy', name: '약점보험', from: ['leftovers', 'muscle-band'], desc: '효과가 굉장한 공격을 처음 맞으면 최대 체력 30%의 보호막을 얻고 공격·특수공격이 30% 증가합니다.' },
  { id: 'black-sludge', name: '검은오물', from: ['leftovers', 'wise-glasses'], desc: '피해를 입힌 적의 회복량이 33% 줄고 화상을 입습니다.' },
  { id: 'flame-orb', name: '불구슬플레이트', from: ['leftovers', 'protective-pads'], desc: '바로 옆 칸의 적의 회복량이 33% 줄고 3초 동안 화상을 입습니다.' },
  { id: 'lax-incense', name: '무사태평향로', from: ['leftovers', 'x-sp-def'], desc: '2칸 안의 적의 방어와 명중률이 1랭크 내려갑니다.' },
  { id: 'big-root', name: '큰뿌리', from: ['leftovers', 'leftovers'], desc: '최대 체력이 20% 증가합니다.' },
  { id: 'black-belt', name: '검은띠', from: ['swift-wing', 'muscle-band'], desc: '최대 체력이 1300 이상인 적에게 주는 피해가 45% 증가합니다.' },
  { id: 'choice-scarf', name: '구애스카프', from: ['swift-wing', 'wise-glasses'], desc: '기본 공격할 때마다 공격 속도가 2%씩 오릅니다.' },
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
  { id: 'super-potion', name: '좋은상처약', from: ['leppa-berry', 'leftovers'], desc: '매초 최대 체력의 1.5%를 회복하고, 바로 옆 칸의 아군도 매초 이 기물의 최대 체력의 1%만큼 회복시킵니다.' },
  { id: 'twisted-spoon', name: '휘어진스푼', from: ['leppa-berry', 'swift-wing'], bonus: { spa: 1 }, desc: '피해를 입힌 적의 특수방어가 6초 동안 3랭크 내려갑니다. (겹치지 않음)' },
  { id: 'dragon-fang', name: '용의이빨', from: ['leppa-berry', 'razor-claw'], desc: '기본 공격할 때 PP를 3 더 얻고, 급소에 맞히면 3을 더 얻습니다.' },
  { id: 'max-ether', name: 'PP맥스', from: ['leppa-berry', 'leppa-berry'], bonus: { pp: 4 }, desc: '시작 PP가 더 많고, 스킬을 쓴 뒤 PP를 12 얻습니다.' }
];

const ITEM_MAGNET = { id: 'magnet', name: '자석', kind: 'consumable', magnet: true, desc: '아이템을 가진 기물에게 쓰면 그 기물의 아이템을 모두 빼서 아이템 칸으로 돌려줍니다.' };

const ITEM_GOLDEN_MAGNET = { id: 'golden-magnet', name: '황금 자석', kind: 'consumable', magnet: true, keep: true, label: '무한 자석', desc: '아이템을 가진 기물에게 쓰면 그 기물의 아이템을 모두 빼서 아이템 칸으로 돌려줍니다. 써도 사라지지 않습니다.' };

const ITEM_LUCKY_BOX = { id: 'lucky-box', name: '행운의 아이템 상자', icon: 'lucky-box', kind: 'consumable', lucky: true, placeholder: true, label: '추천 아이템', desc: '포켓몬에게 쓰면 그 포켓몬에게 맞는 추천 완성 아이템 4개 중 하나를 골라 아이템 칸에 받습니다.' };

const ITEM_GLOVES = { id: 'thiefs-gloves', name: '도적의 장갑', icon: 'thiefs-gloves', kind: 'completed', special: true, gloves: true, unique: true, desc: '아이템 3칸을 모두 차지합니다. 라운드마다 무작위 완성 아이템 2개를 새로 끼고 싸웁니다.' };

const ITEM_GIMMICKS = [
  { id: 'mega-stone', name: '메가스톤', icon: 'mega-stone', gimmick: 'mega', desc: '장착한 포켓몬이 메가진화합니다. 공격·특수공격 중 높은 쪽이 2랭크, 공격 속도가 30% 오르고 최대 PP가 30% 줄어듭니다. 메가진화 모습이 없는 포켓몬은 무지갯빛 테두리가 일렁입니다.' },
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
  phys: ['choice-band', 'expert-belt', 'black-belt', 'punching-glove', 'metronome', 'scope-lens', 'spell-tag', 'shell-bell', 'silver-wing', 'covert-cloak', 'focus-sash', 'dragon-fang'],
  spec: ['choice-specs', 'expert-belt', 'black-glasses', 'soul-dew', 'twisted-spoon', 'max-ether', 'ether', 'choice-scarf', 'black-sludge', 'zoom-lens', 'dragon-fang'],
  tank: ['rocky-helmet', 'assault-vest', 'kings-rock', 'big-root', 'super-potion', 'flame-orb', 'full-incense', 'lax-incense', 'shell-armor', 'mental-herb', 'booster-energy', 'soothe-bell', 'weakness-policy']
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
  { id: 'forge-box', name: '대장간 상자', icon: 'dynite-ore', box: 'treasure3', desc: '클릭해서 열면 서로 다른 3티어 보물 4개 중 하나를 고릅니다.' },
  { id: 'radiant-box', name: '찬란한 모으령 상자', icon: 'gimmi-big', box: 'radiant', glow: true, desc: '클릭해서 열면 서로 다른 찬란한 아이템 5개 중 하나를 고릅니다. (찬란한 아이템: 완성 아이템의 두 배 효과)' }
];

const TREASURE_TIER_NAME = ['0티어', '1티어', '2티어', '3티어'];

const ITEM_TREASURES = [
  { id: 'absorb-bulb', name: '구근', tier: 0, icon: 'absorb-bulb', desc: '5초마다 피해증폭이 5%씩 증가합니다.' },
  { id: 'luminous-moss', name: '빛이끼', tier: 0, icon: 'luminous-moss', desc: '받는 피해가 5% 줄어듭니다.' },
  { id: 'rusted-sword-1', name: '녹슨검', tier: 1, icon: 'rusted-sword', desc: '모든 공격이 체력이 10% 이하인 적을 처형합니다. 적을 쓰러뜨리면 3칸 안에서 가장 멀리 있는 적에게 이동해 공격의 100% 물리 피해를 입힙니다.' },
  { id: 'rusted-shield-1', name: '녹슨방패', tier: 1, icon: 'rusted-shield', desc: '체력이 처음으로 50% 이하가 되면 최대 체력 25%의 보호막을 얻고, 그 뒤 8초마다 최대 체력 10%의 보호막을 얻습니다.' },
  { id: 'griseous-orb-1', name: '큰백금옥', tier: 1, icon: 'griseous-orb', desc: '기본 공격이나 스킬에 맞을 때마다 방어·특수방어가 3씩 오릅니다(최대 15번). 최대로 쌓이면 공격받은 뒤 1칸 안의 적에게 방어·특수방어 중 높은 쪽의 50%만큼 특수 피해를 입힙니다. (재사용 대기시간 2초)' },
  { id: 'life-orb-1', name: '생명의구슬', tier: 1, icon: 'life-orb', desc: '적에게 받는 모든 피해가 5초에 걸쳐 나누어 들어옵니다. 체력이 처음으로 40% 이하가 되면 남은 피해를 모두 없애고, 5초 동안 잃은 체력의 50%만큼 보호막을 얻습니다.' },
  { id: 'red-orb-1', name: '주홍구슬', tier: 1, icon: 'red-orb', desc: '피해를 6번 입힐 때마다 체력이 가장 낮은 적 2명에게 충격을 가해 150의 물리 피해를 입힙니다.' },
  { id: 'blue-orb-1', name: '쪽빛구슬', tier: 1, icon: 'blue-orb', desc: '기본 공격할 때 PP를 1 더 얻습니다. 스킬을 쓴 뒤 PP를 2 얻고 특수공격이 5%씩 증가합니다.' },
  { id: 'rusted-sword-2', name: '강화 녹슨검', tier: 2, icon: 'rusted-sword', desc: '모든 공격이 체력이 12% 이하인 적을 처형합니다. 적을 쓰러뜨리면 3칸 안에서 가장 멀리 있는 적에게 이동해 공격의 100% 물리 피해를 입히고, 5초 동안 내구력과 피해증폭이 10% 증가합니다.' },
  { id: 'rusted-shield-2', name: '강화 녹슨방패', tier: 2, icon: 'rusted-shield', desc: '체력이 처음으로 50% 이하가 되면 최대 체력 50%의 보호막을 얻고, 그 뒤 8초마다 최대 체력 10%의 보호막을 얻습니다.' },
  { id: 'griseous-orb-2', name: '강화 큰백금옥', tier: 2, icon: 'griseous-orb', desc: '기본 공격이나 스킬에 맞을 때마다 방어·특수방어가 5씩 오릅니다(최대 15번). 최대로 쌓이면 공격받은 뒤 1칸 안의 적에게 방어·특수방어 중 높은 쪽의 75%만큼 특수 피해를 입힙니다. (재사용 대기시간 2초)' },
  { id: 'life-orb-2', name: '강화 생명의구슬', tier: 2, icon: 'life-orb', desc: '적에게 받는 모든 피해가 7초에 걸쳐 나누어 들어옵니다. 체력이 처음으로 40% 이하가 되면 남은 피해를 모두 없애고, 10초 동안 잃은 체력의 50%만큼 보호막을 얻습니다.' },
  { id: 'red-orb-2', name: '강화 주홍구슬', tier: 2, icon: 'red-orb', desc: '피해를 6번 입힐 때마다 체력이 가장 낮은 적 2명에게 충격을 가해 250의 물리 피해를 입힙니다.' },
  { id: 'blue-orb-2', name: '강화 쪽빛구슬', tier: 2, icon: 'blue-orb', desc: '기본 공격할 때 PP를 2 더 얻습니다. 스킬을 쓴 뒤 PP를 3 얻고 특수공격이 7%씩 증가합니다.' },
  { id: 'rusted-sword-3', name: '완벽한 녹슨검', tier: 3, icon: 'rusted-sword', desc: '모든 공격이 체력이 15% 이하인 적을 처형합니다. 적을 쓰러뜨리면 3칸 안에서 가장 멀리 있는 적에게 이동해 공격의 100% 물리 피해를 입히고, 5초 동안 내구력과 피해증폭이 15% 증가합니다. 처형할 때마다 3골드를 얻고 최대 체력의 40%를 회복합니다.' },
  { id: 'rusted-shield-3', name: '완벽한 녹슨방패', tier: 3, icon: 'rusted-shield', desc: '체력이 처음으로 50% 이하가 되면 최대 체력 70%의 보호막을 얻고, 그 뒤 8초마다 최대 체력 15%의 보호막을 얻습니다. 보호막을 얻을 때마다 가까운 적 3명에게 대지의 힘을 가해 최대 체력 15%만큼 특수 피해를 입힙니다.' },
  { id: 'griseous-orb-3', name: '완벽한 큰백금옥', tier: 3, icon: 'griseous-orb', desc: '기본 공격이나 스킬에 맞을 때마다 방어·특수방어가 10씩 오릅니다(최대 15번). 최대로 쌓이면 공격받은 뒤 1칸 안의 적에게 방어·특수방어 중 높은 쪽의 90%만큼 특수 피해를 입히고(재사용 대기시간 2초), 4칸 안의 적에게 높은 쪽의 50%만큼 고정 피해를 입힙니다(재사용 대기시간 3초).' },
  { id: 'life-orb-3', name: '완벽한 생명의구슬', tier: 3, icon: 'life-orb', desc: '적에게 받는 모든 피해가 10초에 걸쳐 나누어 들어옵니다. 체력이 처음으로 40% 이하가 되면 남은 피해를 모두 없애고, 15초 동안 잃은 체력의 50%만큼 보호막을 얻습니다. 잃은 체력의 비율만큼 모든 피해 흡혈을 얻습니다(최대 100%).' },
  { id: 'red-orb-3', name: '완벽한 주홍구슬', tier: 3, icon: 'red-orb', desc: '피해를 6번 입힐 때마다 체력이 가장 낮은 적 2명에게 충격을 가해 300의 물리 피해를 입힙니다. 충격을 가할 때마다 공격 속도가 20% 증가합니다.' },
  { id: 'blue-orb-3', name: '완벽한 쪽빛구슬', tier: 3, icon: 'blue-orb', desc: '기본 공격할 때 PP를 3 더 얻습니다. 스킬을 쓴 뒤 PP를 5 얻고 특수공격이 10%씩 증가합니다. 스킬을 쓸 때마다 이번 전투의 최대 PP가 2 줄어듭니다(최소 8).' }
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
    map[c.id] = Object.assign({ kind: 'completed' }, c, { stats });
    recipe[c.from.slice().sort().join('+')] = c.id;
  }
  const radiants = [];
  for (const c of ITEM_COMPLETED) {
    const b = map[c.id];
    const stats = {};
    for (const k in b.stats) stats[k] = b.stats[k] * 2;
    const id = 'radiant-' + c.id;
    map[id] = Object.assign({}, b, { id, base: c.id, radiant: true, name: '찬란한 ' + c.name, icon: c.icon || c.id, stats, desc: '효과와 능력치가 두 배로 적용됩니다. (원래 효과: ' + c.desc + ')' });
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
    parts.push(ITEM_STAT_LABEL[k] + ' +' + v + (k === 'hp' || k === 'pp' ? '' : '랭크'));
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
