const AUG_TIER_NAME = ['', '실버', '골드', '프리즘'];

const AUG_ROUNDS = ['2-1', '3-2', '4-2'];

const AUGMENTS = [
 {
  "id": "latebloom",
  "tier": 1,
  "name": "후발 주자",
  "rounds": [
   "2-1"
  ],
  "icon": "berry-juice",
  "desc": "전장 및 대기석에 있는 포켓몬을 판매합니다. 무작위 1코스트 2성 포켓몬 4명을 획득합니다. 다음 3라운드 동안 상점이 비활성화됩니다."
 },
 {
  "id": "latespec",
  "tier": 1,
  "name": "후반 전문가",
  "rounds": [
   "3-2"
  ],
  "icon": "luck-incense",
  "desc": "9레벨에 도달하면 36골드를 획득합니다."
 },
 {
  "id": "efficient",
  "tier": 1,
  "name": "효율적인 소비자",
  "rounds": [
   "2-1"
  ],
  "icon": "moomoo-milk",
  "desc": "다음 회전초밥 4회 동안 선택한 포켓몬의 복사본을 하나 더 획득합니다. 즉시 4골드를 획득합니다."
 },
 {
  "id": "thrill1",
  "tier": 1,
  "name": "사냥의 전율I",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "razor-fang",
  "desc": "적이 사망하면 가장 가까운 아군이 체력을 220 회복합니다."
 },
 {
  "id": "swordsdance",
  "tier": 1,
  "name": "칼춤",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "x-attack",
  "desc": "아군이 공격을 10% 얻습니다. 5초마다 5% 더 얻습니다."
 },
 {
  "id": "calmmind",
  "tier": 1,
  "name": "명상",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "x-sp-atk",
  "desc": "아군이 특수공격을 10% 얻습니다. 5초마다 5% 더 얻습니다."
 },
 {
  "id": "cooperate",
  "tier": 1,
  "name": "협력",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "exp-share",
  "desc": "무작위 조합 아이템 1개와 무작위 3코스트 포켓몬 2명을 획득합니다."
 },
 {
  "id": "onetwothree",
  "tier": 1,
  "name": "하나, 둘, 셋",
  "rounds": [
   "2-1"
  ],
  "icon": "poke-ball",
  "desc": "1코스트 포켓몬 1명, 2코스트 포켓몬 2명, 3코스트 포켓몬 1명을 획득합니다."
 },
 {
  "id": "onetwofive",
  "tier": 1,
  "name": "하나, 둘, 다섯!",
  "rounds": [
   "4-2"
  ],
  "icon": "great-ball",
  "desc": "무작위 조합 아이템 1개, 2골드, 무작위 5코스트 포켓몬 1명을 획득합니다."
 },
 {
  "id": "pandora1",
  "tier": 1,
  "name": "판도라의 아이템",
  "rounds": [
   "2-1",
   "3-2",
   "4-2"
  ],
  "icon": "enigma-berry",
  "desc": "라운드 시작: 아이템 칸의 아이템이 같은 종류의 무작위 아이템으로 변합니다. 무작위 조합 아이템 1개를 획득합니다."
 },
 {
  "id": "bigfriend",
  "tier": 1,
  "name": "커다란 친구",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "heavy-duty-boots",
  "desc": "체력이 1750 이상인 아군 옆에서 전투를 시작하는 아군이 내구력을 10% 얻습니다. 먹다남은음식 1개를 획득합니다."
 },
 {
  "id": "exiles1",
  "tier": 1,
  "name": "추방자I",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "escape-rope",
  "desc": "인접한 포켓몬 없이 전투를 시작하는 아군 포켓몬이 10초 동안 최대 체력의 20%에 해당하는 보호막을 획득합니다."
 },
 {
  "id": "shaymin1",
  "tier": 1,
  "name": "쉐이미의 축복I",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "sacred-ash",
  "desc": "아군이 모든 피해 흡혈을 12% 얻습니다. 초과 회복량은 최대 200의 피해를 흡수하는 보호막으로 전환됩니다."
 },
 {
  "id": "patientblessing",
  "tier": 1,
  "name": "참는 자에게 복을",
  "rounds": [
   "2-1"
  ],
  "icon": "sitrus-berry",
  "desc": "라운드마다, 지난 라운드에서 포켓몬을 구매하지 않았다면 무료 새로고침을 2회 얻습니다."
 },
 {
  "id": "augpower",
  "tier": 1,
  "name": "증강된 힘",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "dynamax-candy",
  "desc": "다음 증강이 한 등급 높아집니다."
 },
 {
  "id": "laststand",
  "tier": 1,
  "name": "배수의진",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "adrenaline-orb",
  "desc": "전방 가로 1열 중앙에서 전투를 시작하는 아군 포켓몬이 피해 증폭을 15%, 최대 체력을 25% 얻습니다."
 },
 {
  "id": "craft",
  "tier": 1,
  "name": "정교한 공예",
  "rounds": [
   "2-1"
  ],
  "icon": "electric-seed",
  "desc": "완성 아이템을 만들 때마다 무료 새로고침을 2회 얻습니다."
 },
 {
  "id": "lunchmoney",
  "tier": 1,
  "name": "점심값",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "lansat-berry",
  "desc": "적 전략가에게 7의 피해를 입힐 때마다 2골드를 획득합니다."
 },
 {
  "id": "spoils1",
  "tier": 1,
  "name": "전리품I",
  "rounds": [
   "2-1"
  ],
  "icon": "poke-ball",
  "desc": "적 처치 시 25% 확률로 전리품을 획득합니다."
 },
 {
  "id": "wishful",
  "tier": 1,
  "name": "희망사항",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "max-potion",
  "desc": "전투 시작 10초 후 아군이 잃은 체력의 40%를 회복합니다."
 },
 {
  "id": "smallbag",
  "tier": 1,
  "name": "작은 꾸러미",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "item/gimmi-small",
  "desc": "무작위 조합 아이템 2개를 획득합니다."
 },
 {
  "id": "makeshift1",
  "tier": 1,
  "name": "임시변통 방어구I",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "iron",
  "desc": "아이템이 없는 아군이 방어와 특수방어를 30 얻습니다."
 },
 {
  "id": "pallet",
  "tier": 1,
  "name": "태초마을",
  "rounds": [
   "3-2"
  ],
  "icon": "premier-ball",
  "desc": "전장과 대기석의 모든 아군 포켓몬을 제거합니다. 무작위 3코스트 2성 포켓몬 2명, 2코스트 2성 포켓몬 3명, 1코스트 2성 포켓몬 1명을 획득합니다."
 },
 {
  "id": "silverspoon",
  "tier": 1,
  "name": "은수저",
  "rounds": [
   "2-1"
  ],
  "icon": "pearl-string",
  "desc": "10의 경험치를 획득합니다."
 },
 {
  "id": "silverfate1",
  "tier": 1,
  "name": "은빛 운명",
  "rounds": [
   "2-1"
  ],
  "icon": "wishing-piece",
  "desc": "무작위 실버 증강을 얻고 2골드를 획득합니다."
 },
 {
  "id": "silverfate2",
  "tier": 1,
  "name": "은빛 운명+",
  "rounds": [
   "3-2"
  ],
  "icon": "wishing-piece",
  "desc": "무작위 실버 증강을 얻고 4골드를 획득합니다."
 },
 {
  "id": "gimmiuse",
  "tier": 1,
  "name": "유용한 모으령",
  "rounds": [
   "2-1"
  ],
  "icon": "item/gimmi-small",
  "desc": "작은 모으령 상자(조합 아이템 상자) 1개와 3골드를 획득합니다."
 },
 {
  "id": "shellbreak1",
  "tier": 1,
  "name": "껍질 깨기I",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "x-attack",
  "desc": "후방 가로 1열에서 전투를 시작한 아군이 전투 시작 시 체력이 80%로 조정되지만 피해 증폭을 17% 얻습니다."
 },
 {
  "id": "noconnect",
  "tier": 1,
  "name": "연결 불가",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "starf-berry",
  "desc": "가지고 있는 1코스트 포켓몬마다 그 포켓몬의 1성 복사본을 1명씩 획득합니다."
 },
 {
  "id": "itembag",
  "tier": 1,
  "name": "아이템 꾸러미",
  "rounds": [
   "2-1",
   "3-2",
   "4-2"
  ],
  "icon": "item/gimmi-big",
  "desc": "무작위 완성 아이템 1개를 획득합니다."
 },
 {
  "id": "winning",
  "tier": 1,
  "name": "승승장구",
  "rounds": [
   "3-2"
  ],
  "icon": "x-speed",
  "desc": "지난 전투에 배치한 포켓몬의 별 레벨을 올릴 때마다 무료 상점 새로고침 2회를 얻습니다. 2골드를 획득합니다."
 },
 {
  "id": "survivor",
  "tier": 1,
  "name": "생존자",
  "rounds": [
   "2-1"
  ],
  "icon": "focus-band",
  "desc": "4골드를 획득합니다. 플레이어 3명이 탈락하면 100골드를 추가로 획득합니다."
 },
 {
  "id": "rerollday",
  "tier": 1,
  "name": "새로고침의 날",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "room-service",
  "desc": "무료 상점 새로고침을 10회 얻습니다."
 },
 {
  "id": "crumbs",
  "tier": 1,
  "name": "부스러기",
  "rounds": [
   "2-1"
  ],
  "icon": "jaboca-berry",
  "desc": "다음 회전초밥 2회에서 선택되지 않은 포켓몬 1명과 해당 포켓몬이 보유한 아이템을 획득합니다. 1골드를 획득합니다."
 },
 {
  "id": "titan",
  "tier": 1,
  "name": "거대한 거인",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "big-mushroom",
  "desc": "현재 및 최대 플레이어 체력이 25 증가합니다. 회전초밥에서 일찍 움직일 수 있지만 이동 속도가 큰 폭으로 감소합니다."
 },
 {
  "id": "predict",
  "tier": 1,
  "name": "결과 예측",
  "rounds": [
   "2-1"
  ],
  "icon": "lucky-egg",
  "desc": "연승을 4연승으로 설정합니다. 4골드를 획득합니다."
 },
 {
  "id": "boxing",
  "tier": 1,
  "name": "권투 교습",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "item/punching-glove",
  "desc": "아군이 전방에서 전투를 시작하는 아군 하나당 체력을 30 얻습니다."
 },
 {
  "id": "smallcandy",
  "tier": 1,
  "name": "조금 달콤한 사탕",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "item/exp-candy-m",
  "desc": "경험사탕M을 획득합니다. 플레이어 대상 전투를 5회 치른 후 다시 획득합니다."
 },
 {
  "id": "useful",
  "tier": 1,
  "name": "다 쓸 데가 있다니까",
  "rounds": [
   "2-1"
  ],
  "icon": "bottle-cap",
  "desc": "아이템을 장착하지 않은 아군 포켓몬이 사망하면 40% 확률로 1골드를 떨어뜨립니다."
 },
 {
  "id": "buddy1",
  "tier": 1,
  "name": "단짝I",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "x-defense",
  "desc": "둘이서 고립된 아군(서로만 붙어 있는 두 아군)이 전투 시작 시 공격 속도를 10%, 방어를 13 얻습니다."
 },
 {
  "id": "cataclysm",
  "tier": 1,
  "name": "대격변 생성기",
  "rounds": [
   "3-2"
  ],
  "icon": "dynite-ore",
  "desc": "전장의 포켓몬들이 1코스트 더 높은 무작위 포켓몬으로 영구히 바뀝니다. 자석 2개를 획득합니다."
 },
 {
  "id": "lateclass",
  "tier": 2,
  "name": "후반 학습",
  "rounds": [
   "2-1"
  ],
  "icon": "protein",
  "desc": "매 플레이어 대상 전투 라운드 시작 시 경험치를 2 얻습니다. 아군 5코스트 포켓몬이 체력을 12%, 공격 속도를 12% 얻습니다."
 },
 {
  "id": "thrill2",
  "tier": 2,
  "name": "사냥의 전율II",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "razor-fang",
  "desc": "적이 사망하면 가장 가까운 아군이 체력을 500 회복합니다."
 },
 {
  "id": "chaos",
  "tier": 2,
  "name": "혼돈 마법",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "shiny-charm",
  "desc": "주문술사가 시작 PP를 40 얻습니다. 주문술사가 PP를 375 사용할 때마다 마법 효과가 전장을 강타해 모든 적에게 최대 체력의 10%만큼 특수 피해를 입힙니다."
 },
 {
  "id": "shellup",
  "tier": 2,
  "name": "강화된 조개",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "item/shell-bell",
  "desc": "조개껍질방울 1개를 획득합니다. 전투 시작: 조개껍질방울을 장착한 아군이 체력을 20% 잃지만, 체력의 30%에 해당하는 보호막을 얻고 공격을 10% 얻습니다."
 },
 {
  "id": "boomlearn1",
  "tier": 2,
  "name": "폭발적인 학습",
  "rounds": [
   "3-2"
  ],
  "icon": "zinc",
  "desc": "즉시 및 다음 3번의 라운드 시작 시 경험치를 7 얻습니다."
 },
 {
  "id": "boomlearn2",
  "tier": 2,
  "name": "폭발적인 학습+",
  "rounds": [
   "4-2"
  ],
  "icon": "zinc",
  "desc": "즉시 및 다음 3번의 라운드 시작 시 경험치를 10 얻습니다."
 },
 {
  "id": "pandora2",
  "tier": 2,
  "name": "판도라의 아이템II",
  "rounds": [
   "2-1",
   "3-2",
   "4-2"
  ],
  "icon": "enigma-berry",
  "desc": "라운드 시작: 아이템 칸의 아이템이 같은 종류의 무작위 아이템으로 변합니다. 무작위 조합 아이템 2개를 획득합니다."
 },
 {
  "id": "pandorabench",
  "tier": 2,
  "name": "판도라의 대기석",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "eject-button",
  "desc": "라운드가 시작될 때마다 대기석 가장 오른쪽 3명의 포켓몬이 동일한 코스트의 무작위 포켓몬으로 변신합니다. 6골드를 획득합니다."
 },
 {
  "id": "custom",
  "tier": 2,
  "name": "특별 맞춤 설정",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "luxury-ball",
  "desc": "행운의 아이템 상자, 자석, 10골드를 획득합니다. 포켓몬에게 행운의 아이템 상자를 사용하면 그 포켓몬의 추천 아이템 중 하나를 선택할 수 있습니다!"
 },
 {
  "id": "bigbag",
  "tier": 2,
  "name": "큰 꾸러미",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "item/tinkaton-hammer",
  "desc": "무작위 조합 아이템 3개, 2골드, 두드리짱의 망치를 획득합니다."
 },
 {
  "id": "campaign",
  "tier": 2,
  "name": "출정",
  "rounds": [
   "2-1"
  ],
  "icon": "quick-ball",
  "desc": "2코스트 2성 포켓몬 1명을 획득합니다. 플레이어에게 80의 피해를 입히면 고코스트 포켓몬과 아이템이 들어 있는 상자 1개(5코스트 포켓몬 1명, 큰 모으령 상자 1개)를 획득합니다."
 },
 {
  "id": "exiles2",
  "tier": 2,
  "name": "추방자II",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "escape-rope",
  "desc": "인접한 포켓몬 없이 전투를 시작하는 아군 포켓몬이 10초 동안 최대 체력의 30%에 해당하는 보호막을 획득합니다."
 },
 {
  "id": "ascend",
  "tier": 2,
  "name": "초월",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "max-revive",
  "desc": "전투 시작 12초 후, 피해 증폭을 35% 얻습니다."
 },
 {
  "id": "shaymin2",
  "tier": 2,
  "name": "쉐이미의 축복II",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "sacred-ash",
  "desc": "아군이 모든 피해 흡혈을 18% 얻습니다. 초과 회복량은 최대 400의 피해를 흡수하는 보호막으로 전환됩니다."
 },
 {
  "id": "opticshop",
  "tier": 2,
  "name": "안경점",
  "rounds": [
   "4-2"
  ],
  "icon": "wide-lens",
  "desc": "박식안경으로 제작되는 무작위 완성 아이템 2개를 획득합니다."
 },
 {
  "id": "earlyedu",
  "tier": 2,
  "name": "조기 교육",
  "rounds": [
   "2-1"
  ],
  "icon": "calcium",
  "desc": "아군이 공격 및 특수공격을 8% 얻습니다. 이 수치는 플레이어 대상 전투가 끝날 때마다 1% 증가합니다. 1코스트 포켓몬은 두 배로 얻습니다."
 },
 {
  "id": "haste",
  "tier": 2,
  "name": "고속이동",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "quick-claw",
  "desc": "전투 시작 시 아군이 3초 동안 공격 속도를 25% 얻습니다. 처치 관여 시 아군이 다음 대상에게 돌진하고 동일한 추가 효과를 다시 얻습니다."
 },
 {
  "id": "mindlink",
  "tier": 2,
  "name": "정신 결속",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "soothe-bell",
  "desc": "포켓몬이 4초마다 최대 체력의 5%를 회복합니다. 잃은 플레이어 체력 10당 체력 회복량이 0.5% 증가합니다."
 },
 {
  "id": "spoils2",
  "tier": 2,
  "name": "전리품II",
  "rounds": [
   "2-1"
  ],
  "icon": "great-ball",
  "desc": "적 처치 시 30% 확률로 전리품을 획득합니다."
 },
 {
  "id": "recycle1",
  "tier": 2,
  "name": "재활용 쓰레기통",
  "rounds": [
   "2-1"
  ],
  "icon": "blunder-policy",
  "desc": "지금 무작위 완성 아이템 1개를 획득하고 플레이어 대상 전투 8회 후에 조합 아이템 1개를 획득합니다. 포켓몬을 판매하면 완성 아이템이 조합 아이템으로 분해됩니다."
 },
 {
  "id": "recycle2",
  "tier": 2,
  "name": "재활용 쓰레기통",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "blunder-policy",
  "desc": "지금 무작위 완성 아이템 1개를 획득하고 플레이어 대상 전투 4회 후에 조합 아이템 1개를 획득합니다. 포켓몬을 판매하면 완성 아이템이 조합 아이템으로 분해됩니다."
 },
 {
  "id": "doublekill",
  "tier": 2,
  "name": "재빠른 더블 킬",
  "rounds": [
   "2-1"
  ],
  "icon": "item/choice-scarf",
  "desc": "구애스카프를 1개 획득합니다. 플레이어 2명이 탈락하면 40골드를 획득합니다."
 },
 {
  "id": "littlebuddies",
  "tier": 2,
  "name": "작은 친구들",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "poke-doll",
  "desc": "아군 4코스트, 5코스트 포켓몬이 전장에 있는 아군 1코스트 및 2코스트 포켓몬 1명당 체력을 55, 공격 속도를 6% 얻습니다."
 },
 {
  "id": "makeshift2",
  "tier": 2,
  "name": "임시변통 방어구II",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "iron",
  "desc": "아이템이 없는 아군이 방어와 특수방어를 50 얻습니다."
 },
 {
  "id": "dualtech",
  "tier": 2,
  "name": "이중 기술",
  "rounds": [
   "2-1"
  ],
  "icon": "pp-up",
  "desc": "무작위 2코스트 2성 포켓몬 1명과 무작위 1코스트 2성 포켓몬 2명을 획득합니다."
 },
 {
  "id": "favorable",
  "tier": 2,
  "name": "유리한 조건",
  "rounds": [
   "2-1"
  ],
  "icon": "lemonade",
  "desc": "회전초밥에서 포켓몬을 선택할 수 없습니다. 회전초밥 라운드마다 추가로 플레이어 체력을 6 얻고 8골드를 획득합니다. 회전초밥 보상을 선택하지 않으면 선택되지 않은 포켓몬과 해당 포켓몬의 아이템을 획득합니다."
 },
 {
  "id": "shellbreak2",
  "tier": 2,
  "name": "껍질 깨기II",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "x-attack",
  "desc": "후방 가로 1열에서 전투를 시작한 아군이 전투 시작 시 체력이 80%로 조정되지만 피해 증폭을 30% 얻습니다."
 },
 {
  "id": "indecisive1",
  "tier": 2,
  "name": "우유부단I",
  "rounds": [
   "3-2"
  ],
  "icon": "ability-capsule",
  "desc": "3라운드 후 동일한 등급의 새 증강을 선택합니다. 즉시 4골드를 획득합니다."
 },
 {
  "id": "polymath",
  "tier": 2,
  "name": "박학다식",
  "rounds": [
   "2-1",
   "3-2",
   "4-2"
  ],
  "icon": "x-sp-atk",
  "desc": "박식안경과 방호패드를 획득합니다. 아군이 특수공격을 8%, 방어를 6 얻습니다."
 },
 {
  "id": "lastpoke",
  "tier": 2,
  "name": "마지막 포켓몬",
  "rounds": [
   "2-1"
  ],
  "icon": "heal-ball",
  "desc": "추천 아이템을 장착한 5코스트 2성 포켓몬을 획득합니다. 이 포켓몬은 스테이지 4-3부터 배치할 수 있습니다."
 },
 {
  "id": "savings",
  "tier": 2,
  "name": "예금 계좌",
  "rounds": [
   "2-1"
  ],
  "icon": "gold-bottle-cap",
  "desc": "이자로 50골드를 획득하면 30골드를 획득합니다. 최대 이자가 7골드로 증가합니다. 즉시 4골드를 획득합니다."
 },
 {
  "id": "bronze1",
  "tier": 2,
  "name": "영원한 브론즈I",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "absorb-bulb",
  "desc": "아군이 브론즈 등급 시너지당 피해 증폭을 2.5% 얻습니다."
 },
 {
  "id": "cavity1",
  "tier": 2,
  "name": "이빨 썩겠어",
  "rounds": [
   "2-1"
  ],
  "icon": "item/exp-candy-m",
  "desc": "경험사탕M 2개와 5골드를 획득합니다."
 },
 {
  "id": "cavity2",
  "tier": 2,
  "name": "이빨 썩겠어+",
  "rounds": [
   "3-2"
  ],
  "icon": "item/exp-candy-m",
  "desc": "경험사탕M 2개와 8골드를 획득합니다."
 },
 {
  "id": "cavity3",
  "tier": 2,
  "name": "이빨 썩겠어++",
  "rounds": [
   "4-2"
  ],
  "icon": "item/exp-candy-m",
  "desc": "경험사탕M 2개와 14골드를 획득합니다."
 },
 {
  "id": "energywave",
  "tier": 2,
  "name": "에너지 파동",
  "rounds": [
   "2-1",
   "3-2",
   "4-2"
  ],
  "icon": "cell-battery",
  "desc": "기본 공격 5회마다 기본 공격 피해량의 200%에 해당하는 추가 고정 피해를 입힙니다."
 },
 {
  "id": "soulbeat",
  "tier": 2,
  "name": "소울비트",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "sweet-heart",
  "desc": "아군이 체력을 44, 공격을 4%, 특수공격을 4%, 방어를 4, 특수방어를 4, 공격 속도를 4%, 시작 PP를 10 얻습니다."
 },
 {
  "id": "clutter",
  "tier": 2,
  "name": "어수선한 마음",
  "rounds": [
   "2-1"
  ],
  "icon": "berry-juice",
  "desc": "즉시 무작위 1코스트 포켓몬 4명을 획득합니다. 플레이어 대상 전투 라운드 종료 시 대기석에 포켓몬이 가득 찼다면 3의 경험치를 획득합니다."
 },
 {
  "id": "rocketway",
  "tier": 2,
  "name": "로켓단의 방식",
  "rounds": [
   "4-2"
  ],
  "icon": "red-card",
  "desc": "7골드를 획득합니다. 다음 2라운드 동안 적 포켓몬이 처치될 때 2골드를 떨어뜨립니다."
 },
 {
  "id": "wootears",
  "tier": 2,
  "name": "울머기의 눈물",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "item/leppa-berry",
  "desc": "과사열매를 획득합니다. 아군이 PP 재생을 10 얻습니다(1초마다 PP 10). 전투 시작 12초 후에는 PP 재생을 30만큼 얻습니다(1초마다 PP 30)."
 },
 {
  "id": "rosaroy",
  "tier": 2,
  "name": "로사와 로이",
  "rounds": [
   "3-2"
  ],
  "icon": "luck-incense",
  "desc": "라운드마다, 이전 전투에서 아군이 처음으로 처치한 포켓몬의 1성 복사본 1명을 획득합니다. 이 방식을 통해 처음으로 25골드 가치의 포켓몬을 획득하면 무작위 조합 아이템 1개를 획득합니다."
 },
 {
  "id": "dealer",
  "tier": 2,
  "name": "수완가",
  "rounds": [
   "2-1"
  ],
  "icon": "relic-gold",
  "desc": "이자가 없는 대신 플레이어 대상 전투 라운드를 시작할 때마다 3골드를 획득합니다. 즉시 3골드를 획득합니다."
 },
 {
  "id": "epicroll",
  "tier": 2,
  "name": "서사적 새로고침",
  "rounds": [
   "3-2"
  ],
  "icon": "stardust",
  "desc": "8레벨에 도달하면 무료 상점 새로고침을 20회 얻습니다."
 },
 {
  "id": "birthday",
  "tier": 2,
  "name": "생일 모임",
  "rounds": [
   "2-1"
  ],
  "icon": "old-gateau",
  "desc": "무작위 2코스트 2성 포켓몬 1명을 획득합니다. 7레벨에 도달하면 도적의 장갑 1개를 획득합니다. 9레벨에 도달하면 무작위 5코스트 2성 포켓몬 1명을 획득합니다."
 },
 {
  "id": "newera1",
  "tier": 2,
  "name": "새로운 시대",
  "rounds": [
   "2-1"
  ],
  "icon": "lum-berry",
  "desc": "즉시 및 이후 매 스테이지 시작 시 경험치를 4 획득하고 무료 새로고침을 2회 얻습니다."
 },
 {
  "id": "newera2",
  "tier": 2,
  "name": "새로운 시대+",
  "rounds": [
   "3-2"
  ],
  "icon": "lum-berry",
  "desc": "즉시 및 이후 매 스테이지 시작 시 경험치를 8 획득하고 무료 새로고침을 2회 얻습니다."
 },
 {
  "id": "trio",
  "tier": 2,
  "name": "삼인방",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "pearl-string",
  "desc": "3코스트 포켓몬 2명을 획득합니다. 전투 시작: 무작위 3코스트 아군 3명이 체력을 220, 공격 속도를 20% 얻습니다."
 },
 {
  "id": "kindling",
  "tier": 2,
  "name": "땔감 제공",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "item/flame-orb",
  "desc": "불구슬플레이트 1개를 획득합니다. 화상이 적용된 적을 공격할 때 모든 피해 흡혈을 12% 얻습니다."
 },
 {
  "id": "lotus1",
  "tier": 2,
  "name": "보석 연꽃I",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "star-piece",
  "desc": "아군이 급소율을 1랭크 얻으며 스킬에 급소가 적용될 수 있습니다."
 },
 {
  "id": "munchkin",
  "tier": 2,
  "name": "먼치킨",
  "rounds": [
   "2-1"
  ],
  "icon": "tiny-mushroom",
  "desc": "처음 구매하는 1코스트 및 2코스트 포켓몬이 즉시 2성으로 업그레이드됩니다. 7골드를 획득합니다."
 },
 {
  "id": "doublebattle",
  "tier": 2,
  "name": "더블배틀",
  "rounds": [
   "2-1"
  ],
  "icon": "power-bracer",
  "desc": "전장에 똑같은 포켓몬이 정확히 2명 있다면 각각 공격, 특수공격, 방어, 특수방어를 30% 얻습니다. 포켓몬을 3성으로 업그레이드하면 동일한 2성 포켓몬을 1명 획득합니다."
 },
 {
  "id": "clearmind",
  "tier": 2,
  "name": "맑은 정신",
  "rounds": [
   "2-1"
  ],
  "icon": "fresh-water",
  "desc": "플레이어 대상 전투 종료 시 아군 대기석에 포켓몬이 없다면 3의 경험치를 획득합니다."
 },
 {
  "id": "craftmate",
  "tier": 2,
  "name": "동료 제작",
  "rounds": [
   "3-2"
  ],
  "icon": "x-speed",
  "desc": "다음에 구매하는 1코스트 포켓몬이 3성으로 변합니다. 2골드를 획득합니다."
 },
 {
  "id": "gimmihelp",
  "tier": 2,
  "name": "모으령의 도움",
  "rounds": [
   "2-1"
  ],
  "icon": "item/gimmi-small",
  "desc": "바로 7골드를 획득합니다. 이후 매 라운드 1골드를 획득합니다."
 },
 {
  "id": "gildedsteel",
  "tier": 2,
  "name": "도금 강철",
  "rounds": [
   "4-2"
  ],
  "icon": "iron-ball",
  "desc": "5코스트 비탱커 포켓몬 2명을 획득합니다. 5코스트 포켓몬을 1명 이상 배치하면 아군 1~4코스트 포켓몬이 내구력을 8% 얻습니다."
 },
 {
  "id": "loan1",
  "tier": 2,
  "name": "대출 선지급",
  "rounds": [
   "2-1"
  ],
  "icon": "amulet-coin",
  "desc": "20골드를 획득합니다. 다음 증강이 한 등급 낮아집니다."
 },
 {
  "id": "loan2",
  "tier": 2,
  "name": "대출 선지급+",
  "rounds": [
   "3-2"
  ],
  "icon": "amulet-coin",
  "desc": "33골드를 획득합니다. 다음 증강이 한 등급 낮아집니다."
 },
 {
  "id": "buddy2",
  "tier": 2,
  "name": "단짝II",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "x-defense",
  "desc": "둘이서 고립된 아군(서로만 붙어 있는 두 아군)이 전투 시작 시 공격 속도를 15%, 방어를 22 얻습니다."
 },
 {
  "id": "onecomp",
  "tier": 2,
  "name": "단일 조합 사수",
  "rounds": [
   "2-1"
  ],
  "icon": "macho-brace",
  "desc": "플레이어 대상 전투에 참여한 포켓몬은 대기석에 놓거나 판매할 수 없습니다. 아군이 플레이어 대상 전투 후 체력을 1%, 공격 및 특수공격을 1.5% 영구히 얻습니다."
 },
 {
  "id": "sololevel",
  "tier": 2,
  "name": "나 혼자 레벨업",
  "rounds": [
   "2-1"
  ],
  "icon": "dire-hit",
  "desc": "다음 전투 5회 동안 아군 팀 규모가 1이 되지만, 배치하는 포켓몬의 능력치가 크게 증가합니다(체력·공격·특수공격 3배). 해당 포켓몬이 적을 처치할 때마다 경험치를 1 얻습니다. 이후 조합 아이템 2개를 획득합니다."
 },
 {
  "id": "persist",
  "tier": 2,
  "name": "끈질긴 학습",
  "rounds": [
   "2-1"
  ],
  "icon": "hp-up",
  "desc": "플레이어 대상 전투가 끝나고 승리 시 2의 경험치, 패배 시 3의 경험치를 획득합니다."
 },
 {
  "id": "patience1",
  "tier": 2,
  "name": "기다림의 미학",
  "rounds": [
   "2-1"
  ],
  "icon": "strange-souvenir",
  "desc": "무작위 1코스트 포켓몬 1명을 획득합니다. 게임이 끝날 때까지 해당 포켓몬의 복사본을 각 라운드 시작 시 획득합니다."
 },
 {
  "id": "goldfate1",
  "tier": 2,
  "name": "금빛 운명",
  "rounds": [
   "2-1"
  ],
  "icon": "wishing-piece",
  "desc": "무작위 골드 증강을 얻고 3골드를 획득합니다."
 },
 {
  "id": "goldfate2",
  "tier": 2,
  "name": "금빛 운명+",
  "rounds": [
   "3-2"
  ],
  "icon": "wishing-piece",
  "desc": "무작위 골드 증강을 얻고 6골드를 획득합니다."
 },
 {
  "id": "exchange",
  "tier": 2,
  "name": "교환의 장",
  "rounds": [
   "2-1"
  ],
  "icon": "pass-orb",
  "desc": "라운드마다 무료 상점 새로고침을 획득합니다. 2골드를 획득합니다."
 },
 {
  "id": "heartup",
  "tier": 2,
  "name": "강화된 마음",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "item/soul-dew",
  "desc": "마음의물방울 1개를 획득합니다. 특수공격 증가량이 90% 이상일 경우 마음의물방울이 PP 재생을 20 추가로 부여합니다(1초마다 PP 20)."
 },
 {
  "id": "crownweight",
  "tier": 2,
  "name": "왕관의 무게",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "item/kings-rock",
  "desc": "왕의징표석 1개를 획득합니다. 전투 시작: 왕의징표석을 장착한 아군이 가로 열에 혼자 있을 경우 최대 체력을 20% 얻습니다."
 },
 {
  "id": "calcloss",
  "tier": 2,
  "name": "계산된 패배",
  "rounds": [
   "2-1"
  ],
  "icon": "oran-berry",
  "desc": "전투에서 패배한 후 2골드와 무료 상점 새로고침 1회를 획득합니다."
 },
 {
  "id": "bandmaker",
  "tier": 2,
  "name": "머리띠 제작자",
  "rounds": [
   "4-2"
  ],
  "icon": "item/muscle-band",
  "desc": "힘의머리띠로 제작되는 무작위 완성 아이템 2개를 획득합니다."
 },
 {
  "id": "bumpy",
  "tier": 2,
  "name": "울퉁불퉁",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "item/rocky-helmet",
  "desc": "울퉁불퉁맷 1개를 획득합니다. 아군의 울퉁불퉁맷이 피해를 20~170%(스테이지에 따라) 더 입힙니다."
 },
 {
  "id": "gold21",
  "tier": 2,
  "name": "21골드 획득",
  "rounds": [
   "3-2"
  ],
  "icon": "nugget",
  "desc": "21골드를 획득합니다."
 },
 {
  "id": "fourplus",
  "tier": 2,
  "name": "4후지원",
  "rounds": [
   "4-2"
  ],
  "icon": "quick-ball",
  "desc": "다음에 골드로 구매하는 4코스트 포켓몬이 즉시 2성으로 업그레이드됩니다. 5골드를 획득합니다."
 },
 {
  "id": "twovalue",
  "tier": 2,
  "name": "2만한 가치",
  "rounds": [
   "2-1"
  ],
  "icon": "pp-up",
  "desc": "플레이어 대상 전투가 끝날 때마다 그 전투에 배치한 서로 다른 2코스트 포켓몬 2명당 무료 새로고침 1회를 얻습니다. 2코스트 포켓몬 1명을 획득합니다."
 },
 {
  "id": "timerball",
  "tier": 3,
  "name": "황금 타이머볼",
  "rounds": [
   "4-2"
  ],
  "icon": "timer-ball",
  "desc": "11라운드 후 부화하는 황금 타이머볼을 획득합니다. 타이머볼이 부화하면 막대한 전리품(큰 모으령 상자 3개, 60골드)을 얻습니다. 플레이어 대상 전투에서 승리하면 부화 타이머를 1라운드만큼 가속합니다."
 },
 {
  "id": "ringcall",
  "tier": 3,
  "name": "링의 소환!",
  "rounds": [
   "3-2"
  ],
  "icon": "master-ball",
  "desc": "5코스트 포켓몬, 1코스트 2성 포켓몬, 5골드가 포함된 꾸러미를 획득합니다. 다음 2번의 스테이지 시작 시 꾸러미를 다시 획득합니다."
 },
 {
  "id": "hedge",
  "tier": 3,
  "name": "헤지펀드",
  "rounds": [
   "2-1"
  ],
  "icon": "big-nugget",
  "desc": "25골드를 획득합니다. 최대 이자가 10골드로 증가합니다."
 },
 {
  "id": "prismticket",
  "tier": 3,
  "name": "프리즘 티켓",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "pass-orb",
  "desc": "상점을 새로고침할 때마다 50% 확률로 무료 새로고침을 획득합니다."
 },
 {
  "id": "prismfate1",
  "tier": 3,
  "name": "프리즘 운명",
  "rounds": [
   "2-1"
  ],
  "icon": "wishing-piece",
  "desc": "무작위 프리즘 증강을 얻고 3골드를 획득합니다."
 },
 {
  "id": "prismfate2",
  "tier": 3,
  "name": "프리즘 운명",
  "rounds": [
   "3-2"
  ],
  "icon": "wishing-piece",
  "desc": "무작위 프리즘 증강을 얻고 7골드를 획득합니다."
 },
 {
  "id": "pandora3",
  "tier": 3,
  "name": "판도라의 아이템III",
  "rounds": [
   "2-1",
   "3-2"
  ],
  "icon": "enigma-berry",
  "desc": "라운드 시작: 아이템 칸의 아이템이 같은 종류의 무작위 아이템으로 변합니다. 무작위 찬란한 아이템 1개를 획득합니다. (찬란한 아이템: 완성 아이템의 두 배 효과를 지니고 있습니다!)"
 },
 {
  "id": "silph1",
  "tier": 3,
  "name": "실프주식회사의 지원+",
  "rounds": [
   "3-2"
  ],
  "icon": "amulet-coin",
  "desc": "26골드를 획득합니다. 전투가 끝날 때마다 50골드를 넘게 모은 상태라면 넘은 10골드마다 무료 새로고침을 1회 획득합니다. (80골드까지)"
 },
 {
  "id": "silph2",
  "tier": 3,
  "name": "실프주식회사의 지원++",
  "rounds": [
   "4-2"
  ],
  "icon": "amulet-coin",
  "desc": "40골드를 획득합니다. 전투가 끝날 때마다 50골드를 넘게 모은 상태라면 넘은 10골드마다 무료 새로고침을 1회 획득합니다. (80골드까지)"
 },
 {
  "id": "deadlyband",
  "tier": 3,
  "name": "치명적인 머리띠",
  "rounds": [
   "2-1"
  ],
  "icon": "item/choice-band",
  "desc": "구애머리띠 1개를 획득합니다. 장착한 포켓몬이 처치 관여를 달성할 때마다 구애머리띠가 영구히 공격을 1% 얻습니다."
 },
 {
  "id": "optimize",
  "tier": 3,
  "name": "최적화",
  "rounds": [
   "3-2"
  ],
  "icon": "item/golden-magnet",
  "desc": "황금 자석과 무작위 조합 아이템 4개를 획득합니다. 황금 자석은 무한히 사용할 수 있는 자석입니다. 가지고 있던 자석은 두드리짱의 망치로 바뀝니다."
 },
 {
  "id": "shaymin3",
  "tier": 3,
  "name": "쉐이미의 축복III",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "sacred-ash",
  "desc": "아군이 모든 피해 흡혈을 25% 얻습니다. 초과 회복량은 최대 1000의 피해를 흡수하는 보호막으로 전환됩니다."
 },
 {
  "id": "radiantrelic",
  "tier": 3,
  "name": "찬란한 유물",
  "rounds": [
   "2-1",
   "3-2",
   "4-2"
  ],
  "icon": "relic-gold",
  "desc": "찬란한 아이템 5개 중 하나를 선택합니다. 자석을 획득합니다. (찬란한 아이템: 완성 아이템의 두 배 효과를 지니고 있습니다!)"
 },
 {
  "id": "formation",
  "tier": 3,
  "name": "진형 유지",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "guard-spec",
  "desc": "후방 가로 2열에 있는 아군이 전방에서 전투를 시작하는 아군 한 명당 특수공격을 10%, 공격을 9% 얻습니다."
 },
 {
  "id": "spoils3",
  "tier": 3,
  "name": "전리품III",
  "rounds": [
   "2-1"
  ],
  "icon": "ultra-ball",
  "desc": "적 처치 시 40% 확률로 전리품을 획득합니다."
 },
 {
  "id": "longinvest",
  "tier": 3,
  "name": "장기 투자",
  "rounds": [
   "2-1"
  ],
  "icon": "bottle-cap",
  "desc": "더 이상 이자를 획득하지 않으며, 지금 바로 8골드를 획득합니다. 라운드 시작 시 4의 경험치를 획득합니다."
 },
 {
  "id": "shrink",
  "tier": 3,
  "name": "작아지기!",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "tiny-mushroom",
  "desc": "아군의 크기가 작아져 공격 속도와 이동 속도를 30% 얻습니다."
 },
 {
  "id": "oakhelp",
  "tier": 3,
  "name": "오박사의 도움",
  "rounds": [
   "2-1"
  ],
  "icon": "exp-share",
  "desc": "4코스트 포켓몬, 해당 포켓몬과 시너지가 같은 1코스트 2성 포켓몬, 8골드를 획득합니다. 다음 2번의 스테이지 시작 시 해당 4코스트 포켓몬을 다시 획득합니다."
 },
 {
  "id": "indecisive2",
  "tier": 3,
  "name": "우유부단II",
  "rounds": [
   "3-2"
  ],
  "icon": "ability-capsule",
  "desc": "3라운드 후 동일한 등급의 새 증강을 선택합니다. 즉시 6골드를 획득합니다."
 },
 {
  "id": "soulawaken",
  "tier": 3,
  "name": "영혼 각성",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "comet-shard",
  "desc": "전투 시작: 아군이 10초 동안 매초 공격 및 특수공격을 2% 얻습니다. 최대 중첩 시 주는 피해의 12%만큼 추가 고정 피해를 입힙니다."
 },
 {
  "id": "bronze2",
  "tier": 3,
  "name": "영원한 브론즈II",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "absorb-bulb",
  "desc": "아군이 브론즈 등급 시너지당 피해 증폭을 2.5%, 방어 및 특수방어를 4 얻습니다."
 },
 {
  "id": "comeback",
  "tier": 3,
  "name": "역전의 서막",
  "rounds": [
   "2-1"
  ],
  "icon": "focus-band",
  "desc": "잃은 플레이어 체력당 아군이 체력을 5, 공격 속도를 0.4% 얻습니다."
 },
 {
  "id": "achieve",
  "tier": 3,
  "name": "성취",
  "rounds": [
   "3-2"
  ],
  "icon": "lucky-egg",
  "desc": "9레벨에 도달하면 즉시 10레벨이 되고 무료 상점 새로고침 2회를 얻습니다. 즉시 경험치를 6 얻습니다."
 },
 {
  "id": "cram",
  "tier": 3,
  "name": "단기학습",
  "rounds": [
   "4-2"
  ],
  "icon": "pp-max",
  "desc": "경험치를 50 얻습니다."
 },
 {
  "id": "rockethelp",
  "tier": 3,
  "name": "로켓단의 도움",
  "rounds": [
   "2-1"
  ],
  "icon": "red-card",
  "desc": "레벨 업할 때마다 2성 포켓몬과 1골드를 획득합니다. 획득하는 포켓몬의 코스트는 레벨보다 4 낮습니다. (1~5코스트)"
 },
 {
  "id": "fossil",
  "tier": 3,
  "name": "화석의 비밀",
  "rounds": [
   "2-1"
  ],
  "icon": "armorite-ore",
  "desc": "10골드를 획득하고, 암스타(2성 암나이트)를 획득합니다. 화석 포켓몬(투구·프테라)을 해금할 때마다 해당 포켓몬에게 적합한 아이템을 획득합니다."
 },
 {
  "id": "lotus2",
  "tier": 3,
  "name": "보석 연꽃II",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "star-piece",
  "desc": "아군이 급소율을 1랭크, 급소 피해량을 10% 얻으며 스킬에 급소가 적용될 수 있습니다."
 },
 {
  "id": "studyagain",
  "tier": 3,
  "name": "학습 또 학습!",
  "rounds": [
   "2-1"
  ],
  "icon": "carbos",
  "desc": "경험치를 구매하면 2의 추가 경험치를 얻습니다. 즉시 8의 경험치를 얻습니다."
 },
 {
  "id": "moneystorm",
  "tier": 3,
  "name": "돈 폭풍",
  "rounds": [
   "4-2"
  ],
  "icon": "nugget",
  "desc": "즉시 및 게임이 끝날 때까지 라운드마다 7골드를 획득합니다."
 },
 {
  "id": "deadlyspecs",
  "tier": 3,
  "name": "치명적인 안경",
  "rounds": [
   "2-1"
  ],
  "icon": "item/choice-specs",
  "desc": "구애안경 1개를 획득합니다. 장착한 포켓몬이 처치 관여를 달성할 때마다 구애안경이 영구히 특수공격을 1% 얻습니다."
 },
 {
  "id": "yoshhelp",
  "tier": 3,
  "name": "요씽리스의 도움",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "item/leftovers",
  "desc": "먹다남은음식 4개를 획득합니다. 먹다남은음식이 추가 체력을 +85 제공합니다."
 },
 {
  "id": "gardhelp",
  "tier": 3,
  "name": "가디안의 도움",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "item/wise-glasses",
  "desc": "박식안경 4개를 획득합니다. 박식안경이 공격 속도를 +5% 제공합니다."
 },
 {
  "id": "harihelp",
  "tier": 3,
  "name": "하리뭉의 도움",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "item/muscle-band",
  "desc": "힘의머리띠 4개를 획득합니다. 힘의머리띠가 공격 속도를 +5% 제공합니다."
 },
 {
  "id": "realsnack",
  "tier": 3,
  "name": "진짜 먹밥",
  "rounds": [
   "3-2"
  ],
  "icon": "rage-candy-bar",
  "desc": "플레이어 대상 전투가 끝날 때마다 플레이어 체력을 2 얻고 2골드를 획득합니다. 또한 전략가의 이동 속도가 증가합니다. 즉시 15골드를 획득합니다."
 },
 {
  "id": "patience2",
  "tier": 3,
  "name": "기다림의 미학II",
  "rounds": [
   "2-1"
  ],
  "icon": "strange-souvenir",
  "desc": "무작위 2코스트 포켓몬 하나를 정해 2마리를 획득합니다. 게임이 끝날 때까지 해당 포켓몬을 각 라운드 시작 시 1마리씩 획득합니다."
 },
 {
  "id": "sweetcandy",
  "tier": 3,
  "name": "달콤한 사탕",
  "rounds": [
   "4-2"
  ],
  "icon": "item/exp-candy-l",
  "desc": "경험사탕L 1개와 10골드를 획득하고 무료 상점 새로고침을 18회 얻습니다."
 },
 {
  "id": "tradehub",
  "tier": 3,
  "name": "거래 중심지",
  "rounds": [
   "4-2"
  ],
  "icon": "room-service",
  "desc": "즉시 무료 상점 새로고침 16회를 얻고 게임이 끝날 때까지 라운드마다 2회를 얻습니다."
 },
 {
  "id": "bigstrong",
  "tier": 3,
  "name": "거대하고 강력한",
  "rounds": [
   "3-2",
   "4-2"
  ],
  "icon": "big-mushroom",
  "desc": "아군의 크기가 커져 체력을 200, 최대 체력을 10% 얻습니다."
 }
];

const AUG_MAP = Object.fromEntries(AUGMENTS.map(x => [x.id, x]));

const AUG_PATTERNS = [[1, 1, 1], [1, 1, 2], [1, 2, 2], [2, 2, 2], [1, 2, 3], [2, 2, 3], [2, 3, 3], [1, 1, 3], [2, 1, 2], [2, 3, 2], [3, 2, 2], [1, 3, 2]];

function augDef(id) {
  return AUG_MAP[id] || null;
}

function augIconUrl(d) {
  if (!d) return '';
  return d.icon.indexOf('item/') === 0 ? 'img/' + d.icon + '.png' : 'img/aug/' + d.icon + '.png';
}
