const AUG_TIER_NAME = ['', '실버', '골드', '프리즘'];

const AUGMENTS = [
 {
  "id": "cyber1",
  "tier": 1,
  "name": "사이버네틱 이식 I",
  "src": "Cybernetic Implants I",
  "icon": "cell-battery",
  "desc": "아이템을 든 아군 체력 +120, 공격·특수공격 +6%"
 },
 {
  "id": "cyber2",
  "tier": 2,
  "name": "사이버네틱 몸집 II",
  "src": "Cybernetic Bulk II",
  "icon": "cell-battery",
  "desc": "아이템을 든 아군 체력 +220, 공격·특수공격 +10%"
 },
 {
  "id": "cyber3",
  "tier": 3,
  "name": "사이버네틱 업링크 III",
  "src": "Cybernetic Uplink III",
  "icon": "cell-battery",
  "desc": "아이템을 든 아군 체력 +350, 공격·특수공격 +15%, 2초마다 PP 3"
 },
 {
  "id": "feather1",
  "tier": 1,
  "name": "경량급 I",
  "src": "Featherweights I",
  "icon": "fluffy-tail",
  "desc": "1·2코 아군 공격 속도 +15%, 스피드 +1랭크"
 },
 {
  "id": "feather2",
  "tier": 2,
  "name": "경량급 II",
  "src": "Featherweights II",
  "icon": "fluffy-tail",
  "desc": "1·2코 아군 공격 속도 +25%, 스피드 +2랭크"
 },
 {
  "id": "feather3",
  "tier": 3,
  "name": "경량급 III",
  "src": "Featherweights III",
  "icon": "fluffy-tail",
  "desc": "1·2코 아군 공격 속도 +40%, 스피드 +3랭크"
 },
 {
  "id": "bigfriend1",
  "tier": 1,
  "name": "큰 친구 I",
  "src": "Big Friend I",
  "icon": "iron-ball",
  "desc": "필드에 4·5코 아군이 있으면 아군 받는 피해 −6%"
 },
 {
  "id": "bigfriend2",
  "tier": 2,
  "name": "큰 친구 II",
  "src": "Big Friend II",
  "icon": "iron-ball",
  "desc": "필드에 4·5코 아군이 있으면 아군 받는 피해 −10%"
 },
 {
  "id": "bigfriend3",
  "tier": 3,
  "name": "큰 친구 III",
  "src": "Big Friend III",
  "icon": "iron-ball",
  "desc": "필드에 4·5코 아군이 있으면 아군 받는 피해 −16%"
 },
 {
  "id": "double1",
  "tier": 1,
  "name": "문제가 두배 I",
  "src": "Double Trouble I",
  "icon": "poke-doll",
  "desc": "같은 기물이 딱 2마리면 둘 다 공격·특수공격·방어·특수방어 +15%"
 },
 {
  "id": "double2",
  "tier": 2,
  "name": "문제가 두배 II",
  "src": "Double Trouble II",
  "icon": "poke-doll",
  "desc": "같은 기물이 딱 2마리면 둘 다 공격·특수공격·방어·특수방어 +25%"
 },
 {
  "id": "double3",
  "tier": 3,
  "name": "문제가 두배 III",
  "src": "Double Trouble III",
  "icon": "poke-doll",
  "desc": "같은 기물이 딱 2마리면 둘 다 공격·특수공격·방어·특수방어 +40%"
 },
 {
  "id": "triforce1",
  "tier": 1,
  "name": "삼위일체 I",
  "src": "Tri Force I",
  "icon": "star-piece",
  "desc": "3코 아군 체력 +150, 공격 속도 +10%"
 },
 {
  "id": "triforce2",
  "tier": 2,
  "name": "삼위일체 II",
  "src": "Tri Force II",
  "icon": "star-piece",
  "desc": "3코 아군 체력 +250, 공격 속도 +18%"
 },
 {
  "id": "triforce3",
  "tier": 3,
  "name": "삼위일체 III",
  "src": "Tri Force III",
  "icon": "star-piece",
  "desc": "3코 아군 체력 +400, 공격 속도 +28%"
 },
 {
  "id": "battery1",
  "tier": 1,
  "name": "푸른 배터리 I",
  "src": "Blue Battery I",
  "icon": "pp-up",
  "desc": "아군이 스킬을 쓴 뒤 PP 4 돌려받음"
 },
 {
  "id": "battery2",
  "tier": 2,
  "name": "푸른 배터리 II",
  "src": "Blue Battery II",
  "icon": "pp-up",
  "desc": "아군이 스킬을 쓴 뒤 PP 16 돌려받음"
 },
 {
  "id": "battery3",
  "tier": 3,
  "name": "푸른 배터리 III",
  "src": "Blue Battery III",
  "icon": "pp-up",
  "desc": "아군이 스킬을 쓴 뒤 PP 24 돌려받음"
 },
 {
  "id": "electro1",
  "tier": 1,
  "name": "전기 충전 I",
  "src": "Electrocharge I",
  "icon": "electric-seed",
  "desc": "아군이 급소를 맞으면 주변 1칸 적에게 특수 피해 60 (기물마다 0.5초 대기)"
 },
 {
  "id": "electro2",
  "tier": 2,
  "name": "전기 충전 II",
  "src": "Electrocharge II",
  "icon": "electric-seed",
  "desc": "아군이 급소를 맞으면 주변 1칸 적에게 특수 피해 110 (기물마다 0.5초 대기)"
 },
 {
  "id": "electro3",
  "tier": 3,
  "name": "전기 충전 III",
  "src": "Electrocharge III",
  "icon": "electric-seed",
  "desc": "아군이 급소를 맞으면 주변 1칸 적에게 특수 피해 180 (기물마다 0.5초 대기)"
 },
 {
  "id": "exiles1",
  "tier": 1,
  "name": "추방자 I",
  "src": "Exiles I",
  "icon": "escape-rope",
  "desc": "전투 시작 시 인접한 아군이 없는 아군에게 최대 체력 20% 보호막 (8초)"
 },
 {
  "id": "exiles2",
  "tier": 2,
  "name": "추방자 II",
  "src": "Exiles II",
  "icon": "escape-rope",
  "desc": "전투 시작 시 인접한 아군이 없는 아군에게 최대 체력 35% 보호막 (8초)"
 },
 {
  "id": "exiles3",
  "tier": 3,
  "name": "추방자 III",
  "src": "Exiles III",
  "icon": "escape-rope",
  "desc": "전투 시작 시 인접한 아군이 없는 아군에게 최대 체력 55% 보호막 (8초)"
 },
 {
  "id": "training1",
  "tier": 1,
  "name": "전투 훈련 I",
  "src": "Combat Training I",
  "icon": "macho-brace",
  "desc": "전투에서 살아남을 때마다 그 기물의 공격·특수공격 +1% 영구 (최대 15%)"
 },
 {
  "id": "training2",
  "tier": 2,
  "name": "전투 훈련 II",
  "src": "Combat Training II",
  "icon": "macho-brace",
  "desc": "전투에서 살아남을 때마다 그 기물의 공격·특수공격 +1.5% 영구 (최대 25%)"
 },
 {
  "id": "training3",
  "tier": 3,
  "name": "전투 훈련 III",
  "src": "Combat Training III",
  "icon": "macho-brace",
  "desc": "전투에서 살아남을 때마다 그 기물의 공격·특수공격 +2% 영구 (최대 40%)"
 },
 {
  "id": "manaflow1",
  "tier": 1,
  "name": "마나 흐름 I",
  "src": "Manaflow I",
  "icon": "pp-max",
  "desc": "아군 시작 PP +10"
 },
 {
  "id": "manaflow2",
  "tier": 2,
  "name": "마나 흐름 II",
  "src": "Manaflow II",
  "icon": "pp-max",
  "desc": "아군 시작 PP +20"
 },
 {
  "id": "manaflow3",
  "tier": 3,
  "name": "마나 흐름 III",
  "src": "Manaflow III",
  "icon": "pp-max",
  "desc": "아군 시작 PP +30"
 },
 {
  "id": "spoils1",
  "tier": 1,
  "name": "전리품 I",
  "src": "Spoils of War I",
  "icon": "amulet-coin",
  "desc": "아군이 적을 처치하면 15% 확률로 1골드"
 },
 {
  "id": "spoils2",
  "tier": 2,
  "name": "전리품 II",
  "src": "Spoils of War II",
  "icon": "amulet-coin",
  "desc": "아군이 적을 처치하면 25% 확률로 1골드 (전투당 최대 5)"
 },
 {
  "id": "spoils3",
  "tier": 3,
  "name": "전리품 III",
  "src": "Spoils of War III",
  "icon": "amulet-coin",
  "desc": "아군이 적을 처치하면 40% 확률로 1골드 (전투당 최대 8)"
 },
 {
  "id": "pumping1",
  "tier": 1,
  "name": "펌핑 I",
  "src": "Pumping Up I",
  "icon": "protein",
  "desc": "아군 공격 속도 +5%, 이후 라운드마다 +0.5%"
 },
 {
  "id": "pumping2",
  "tier": 2,
  "name": "펌핑 II",
  "src": "Pumping Up II",
  "icon": "protein",
  "desc": "아군 공격 속도 +8%, 이후 라운드마다 +1%"
 },
 {
  "id": "pumping3",
  "tier": 3,
  "name": "펌핑 III",
  "src": "Pumping Up III",
  "icon": "protein",
  "desc": "아군 공격 속도 +12%, 이후 라운드마다 +1.5%"
 },
 {
  "id": "united1",
  "tier": 1,
  "name": "단결 I",
  "src": "Stand United I",
  "icon": "soothe-bell",
  "desc": "켜진 시너지 하나마다 아군 공격·특수공격 +1.5%"
 },
 {
  "id": "united2",
  "tier": 2,
  "name": "단결 II",
  "src": "Stand United II",
  "icon": "soothe-bell",
  "desc": "켜진 시너지 하나마다 아군 공격·특수공격 +2.5%"
 },
 {
  "id": "united3",
  "tier": 3,
  "name": "단결 III",
  "src": "Stand United III",
  "icon": "soothe-bell",
  "desc": "켜진 시너지 하나마다 아군 공격·특수공격 +4%"
 },
 {
  "id": "scoped1",
  "tier": 1,
  "name": "조준경 부착 I",
  "src": "Scoped Weapons I",
  "icon": "wide-lens",
  "desc": "뒤 두 줄 아군 사거리 +1, 공격 속도 +6%"
 },
 {
  "id": "scoped2",
  "tier": 2,
  "name": "조준경 부착 II",
  "src": "Scoped Weapons II",
  "icon": "wide-lens",
  "desc": "뒤 두 줄 아군 사거리 +1, 공격 속도 +12%"
 },
 {
  "id": "scoped3",
  "tier": 3,
  "name": "조준경 부착 III",
  "src": "Scoped Weapons III",
  "icon": "wide-lens",
  "desc": "뒤 두 줄 아군 사거리 +2, 공격 속도 +20%"
 },
 {
  "id": "thrill1",
  "tier": 1,
  "name": "사냥의 전율 I",
  "src": "Thrill of the Hunt I",
  "icon": "razor-fang",
  "desc": "아군이 적을 처치하면 체력 250 회복"
 },
 {
  "id": "thrill2",
  "tier": 2,
  "name": "사냥의 전율 II",
  "src": "Thrill of the Hunt II",
  "icon": "razor-fang",
  "desc": "아군이 적을 처치하면 체력 450 회복"
 },
 {
  "id": "thrill3",
  "tier": 3,
  "name": "사냥의 전율 III",
  "src": "Thrill of the Hunt III",
  "icon": "razor-fang",
  "desc": "아군이 적을 처치하면 체력 700 회복, 공격 속도 +10% (중첩)"
 },
 {
  "id": "glass1",
  "tier": 1,
  "name": "유리 대포 I",
  "src": "Glass Cannon I",
  "icon": "x-attack",
  "desc": "뒤 두 줄 아군 최대 체력 −10%, 피해 +13%"
 },
 {
  "id": "glass2",
  "tier": 2,
  "name": "유리 대포 II",
  "src": "Glass Cannon II",
  "icon": "x-attack",
  "desc": "뒤 두 줄 아군 최대 체력 −20%, 피해 +25%"
 },
 {
  "id": "glass3",
  "tier": 3,
  "name": "유리 대포 III",
  "src": "Glass Cannon III",
  "icon": "x-attack",
  "desc": "뒤 두 줄 아군 최대 체력 −25%, 피해 +40%"
 },
 {
  "id": "celestial1",
  "tier": 1,
  "name": "천상의 축복 I",
  "src": "Celestial Blessing I",
  "icon": "comet-shard",
  "desc": "아군 흡혈 +8%, 넘친 회복은 보호막으로 (최대 200)"
 },
 {
  "id": "celestial2",
  "tier": 2,
  "name": "천상의 축복 II",
  "src": "Celestial Blessing II",
  "icon": "comet-shard",
  "desc": "아군 흡혈 +15%, 넘친 회복은 보호막으로 (최대 350)"
 },
 {
  "id": "celestial3",
  "tier": 3,
  "name": "천상의 축복 III",
  "src": "Celestial Blessing III",
  "icon": "comet-shard",
  "desc": "아군 흡혈 +25%, 넘친 회복은 보호막으로 (최대 600)"
 },
 {
  "id": "unified1",
  "tier": 1,
  "name": "단합된 저항 I",
  "src": "Unified Resistance I",
  "icon": "guard-spec",
  "desc": "아군 방어·특수방어 +8, 체력 50% 이하일 때 2배"
 },
 {
  "id": "unified2",
  "tier": 2,
  "name": "단합된 저항 II",
  "src": "Unified Resistance II",
  "icon": "guard-spec",
  "desc": "아군 방어·특수방어 +14, 체력 50% 이하일 때 2배"
 },
 {
  "id": "unified3",
  "tier": 3,
  "name": "단합된 저항 III",
  "src": "Unified Resistance III",
  "icon": "guard-spec",
  "desc": "아군 방어·특수방어 +22, 체력 50% 이하일 때 2배"
 },
 {
  "id": "firstaid1",
  "tier": 1,
  "name": "구급 상자 I",
  "src": "First Aid Kit I",
  "icon": "full-restore",
  "desc": "아군이 받는 치유·보호막 +15%"
 },
 {
  "id": "firstaid2",
  "tier": 2,
  "name": "구급 상자 II",
  "src": "First Aid Kit II",
  "icon": "full-restore",
  "desc": "아군이 받는 치유·보호막 +30%"
 },
 {
  "id": "firstaid3",
  "tier": 3,
  "name": "구급 상자 III",
  "src": "First Aid Kit III",
  "icon": "full-restore",
  "desc": "아군이 받는 치유·보호막 +50%"
 },
 {
  "id": "built1",
  "tier": 1,
  "name": "특별 제작 I",
  "src": "Built Different I",
  "icon": "muscle-band",
  "desc": "켜진 시너지가 없는 아군 체력 +200, 공격 속도 +25%"
 },
 {
  "id": "built2",
  "tier": 2,
  "name": "특별 제작 II",
  "src": "Built Different II",
  "icon": "muscle-band",
  "desc": "켜진 시너지가 없는 아군 체력 +350, 공격 속도 +45%"
 },
 {
  "id": "built3",
  "tier": 3,
  "name": "특별 제작 III",
  "src": "Built Different III",
  "icon": "muscle-band",
  "desc": "켜진 시너지가 없는 아군 체력 +500, 공격 속도 +65%"
 },
 {
  "id": "distance1",
  "tier": 1,
  "name": "거리두기 I",
  "src": "Social Distancing I",
  "icon": "safety-goggles",
  "desc": "인접한 아군이 없는 아군 공격·특수공격 +12%"
 },
 {
  "id": "distance2",
  "tier": 2,
  "name": "거리두기 II",
  "src": "Social Distancing II",
  "icon": "safety-goggles",
  "desc": "인접한 아군이 없는 아군 공격·특수공격 +22%"
 },
 {
  "id": "distance3",
  "tier": 3,
  "name": "거리두기 III",
  "src": "Social Distancing III",
  "icon": "safety-goggles",
  "desc": "인접한 아군이 없는 아군 공격·특수공격 +35%"
 },
 {
  "id": "knife1",
  "tier": 1,
  "name": "칼날의 끝 I",
  "src": "Knife's Edge I",
  "icon": "expert-belt",
  "desc": "앞 두 줄 아군 공격·특수공격 +12%"
 },
 {
  "id": "knife2",
  "tier": 2,
  "name": "칼날의 끝 II",
  "src": "Knife's Edge II",
  "icon": "expert-belt",
  "desc": "앞 두 줄 아군 공격·특수공격 +22%"
 },
 {
  "id": "knife3",
  "tier": 3,
  "name": "칼날의 끝 III",
  "src": "Knife's Edge III",
  "icon": "expert-belt",
  "desc": "앞 두 줄 아군 공격·특수공격 +35%"
 },
 {
  "id": "lotus1",
  "tier": 1,
  "name": "보석 연꽃 I",
  "src": "Jeweled Lotus I",
  "icon": "lansat-berry",
  "desc": "아군 스킬도 급소가 터지고, 급소율 +10%"
 },
 {
  "id": "lotus2",
  "tier": 2,
  "name": "보석 연꽃 II",
  "src": "Jeweled Lotus II",
  "icon": "lansat-berry",
  "desc": "아군 스킬도 급소가 터지고, 급소율 +20%"
 },
 {
  "id": "lotus3",
  "tier": 3,
  "name": "보석 연꽃 III",
  "src": "Jeweled Lotus III",
  "icon": "lansat-berry",
  "desc": "아군 스킬도 급소가 터지고, 급소율 +35%"
 },
 {
  "id": "rolling1",
  "tier": 2,
  "name": "끝없는 새로고침 I",
  "src": "Rolling for Days I",
  "icon": "shiny-charm",
  "desc": "즉시 7골드. 라운드마다 무료 새로고침 1회"
 },
 {
  "id": "rolling2",
  "tier": 2,
  "name": "끝없는 새로고침 II",
  "src": "Rolling for Days II",
  "icon": "shiny-charm",
  "desc": "라운드마다 무료 새로고침 2회"
 },
 {
  "id": "rolling3",
  "tier": 3,
  "name": "끝없는 새로고침 III",
  "src": "Rolling for Days III",
  "icon": "shiny-charm",
  "desc": "라운드마다 무료 새로고침 3회"
 },
 {
  "id": "heart",
  "tier": 1,
  "name": "시너지의 마음",
  "src": "Heart",
  "icon": "sweet-heart",
  "desc": "무작위 시너지 +1"
 },
 {
  "id": "soul",
  "tier": 2,
  "name": "시너지의 영혼",
  "src": "Soul",
  "icon": "wishing-piece",
  "desc": "무작위 시너지 +1, 그 시너지 기물 체력 +150"
 },
 {
  "id": "crown",
  "tier": 3,
  "name": "시너지의 왕관",
  "src": "Crown",
  "icon": "relic-gold",
  "desc": "무작위 시너지 +2"
 },
 {
  "id": "compbag",
  "tier": 1,
  "name": "부품 꾸러미",
  "src": "Component Grab Bag",
  "icon": "luxury-ball",
  "desc": "조합 아이템 2개"
 },
 {
  "id": "bigbag",
  "tier": 2,
  "name": "큰 꾸러미",
  "src": "Big Grab Bag",
  "icon": "ultra-ball",
  "desc": "조합 아이템 3개 + 속임수주사위 1개 + 2골드"
 },
 {
  "id": "heroicbag",
  "tier": 3,
  "name": "영웅의 꾸러미",
  "src": "Heroic Grab Bag",
  "icon": "master-ball",
  "desc": "완성 아이템 2개 + 속임수주사위 2개 + 6골드"
 },
 {
  "id": "windfall",
  "tier": 1,
  "name": "뜻밖의 횡재",
  "src": "Windfall",
  "icon": "nugget",
  "desc": "즉시 8골드"
 },
 {
  "id": "patient",
  "tier": 1,
  "name": "차분한 학습",
  "src": "Patient Study",
  "icon": "exp-share",
  "desc": "PvP에서 이기면 경험치 2, 지면 경험치 4"
 },
 {
  "id": "richer",
  "tier": 1,
  "name": "부익부",
  "src": "Rich Get Richer",
  "icon": "big-nugget",
  "desc": "이자 최대치 +1"
 },
 {
  "id": "calcloss",
  "tier": 1,
  "name": "계산된 패배",
  "src": "Calculated Loss",
  "icon": "eject-button",
  "desc": "PvP에서 질 때마다 2골드 + 무료 새로고침 1회"
 },
 {
  "id": "starter",
  "tier": 1,
  "name": "초보자 키트",
  "src": "Starter Kit",
  "icon": "heal-ball",
  "desc": "무작위 2코 기물 2마리 + 1골드"
 },
 {
  "id": "pbench",
  "tier": 1,
  "name": "판도라의 대기석",
  "src": "Pandora's Bench",
  "icon": "red-card",
  "desc": "즉시 3골드. 라운드 시작마다 대기석 왼쪽 4칸의 기물이 같은 코스트의 무작위 기물로 바뀜 (별 유지)"
 },
 {
  "id": "censer",
  "tier": 1,
  "name": "열정의 향로",
  "src": "Ardent Censer",
  "icon": "lax-incense",
  "desc": "아군이 다른 아군을 치유하거나 보호막을 주면 받은 아군 공격 속도 +15% (3초)"
 },
 {
  "id": "sunfire",
  "tier": 1,
  "name": "태양불꽃 보드",
  "src": "Sunfire Board",
  "icon": "adrenaline-orb",
  "desc": "전투 시작과 5초마다 무작위 적 2명에게 화상 + 치유 33% 감소 (3초)"
 },
 {
  "id": "weakspot",
  "tier": 1,
  "name": "약점",
  "src": "Weakspot",
  "icon": "blunder-policy",
  "desc": "아군 기본 공격이 대상의 치유를 33% 줄임 (3초)"
 },
 {
  "id": "makeshift",
  "tier": 1,
  "name": "임시방편 갑옷",
  "src": "Makeshift Armor",
  "icon": "heavy-duty-boots",
  "desc": "아이템이 없는 아군 방어·특수방어 +20"
 },
 {
  "id": "clearmind",
  "tier": 1,
  "name": "맑은 정신",
  "src": "Clear Mind",
  "icon": "fresh-water",
  "desc": "전투가 시작될 때 대기석이 비어 있으면 경험치 3"
 },
 {
  "id": "hyperroll",
  "tier": 1,
  "name": "하이퍼 롤",
  "src": "Hyper Roll",
  "icon": "timer-ball",
  "desc": "즉시 무료 새로고침 6회"
 },
 {
  "id": "salvage",
  "tier": 1,
  "name": "재활용 통",
  "src": "Salvage Bin",
  "icon": "armorite-ore",
  "desc": "기물을 팔면 그 기물이 든 완성 아이템이 조합 아이템 2개로 분해되어 돌아옴"
 },
 {
  "id": "hotstreak",
  "tier": 1,
  "name": "연승가도",
  "src": "Hot Streak",
  "icon": "starf-berry",
  "desc": "연승·연패 골드 +1"
 },
 {
  "id": "twohealthy",
  "tier": 1,
  "name": "두 배로 건강",
  "src": "Two Healthy",
  "icon": "oran-berry",
  "desc": "2성 아군 체력 +120"
 },
 {
  "id": "teamup",
  "tier": 1,
  "name": "팀 결성",
  "src": "Teaming Up",
  "icon": "galarica-cuff",
  "desc": "조합 아이템 1개 + 속임수주사위 1개"
 },
 {
  "id": "center",
  "tier": 1,
  "name": "중심 찾기",
  "src": "Find Your Center",
  "icon": "zoom-lens",
  "desc": "필드 가운데 칸(앞에서 둘째 줄 가운데)의 아군 피해 +20%, 체력 +150"
 },
 {
  "id": "branching",
  "tier": 1,
  "name": "가지치기",
  "src": "Branching Out",
  "icon": "tiny-mushroom",
  "desc": "조합 아이템 1개 + 자석 1개 + 3골드"
 },
 {
  "id": "spree",
  "tier": 1,
  "name": "쇼핑광",
  "src": "Shopping Spree",
  "icon": "quick-ball",
  "desc": "현재 레벨만큼 무료 새로고침"
 },
 {
  "id": "corners",
  "tier": 1,
  "name": "편법",
  "src": "Cutting Corners",
  "icon": "room-service",
  "desc": "레벨업에 필요한 경험치 −2 (모든 레벨)"
 },
 {
  "id": "epitaph",
  "tier": 1,
  "name": "감동적인 비문",
  "src": "Inspiring Epitaph",
  "icon": "revive",
  "desc": "아군이 쓰러지면 체력 비율이 가장 낮은 아군에게 최대 체력 25% 보호막 (4초)"
 },
 {
  "id": "metabolic",
  "tier": 1,
  "name": "신진대사 촉진기",
  "src": "Metabolic Accelerator",
  "icon": "moomoo-milk",
  "desc": "라운드마다 플레이어 체력 1 회복"
 },
 {
  "id": "transfusion",
  "tier": 1,
  "name": "수혈",
  "src": "Transfusion",
  "icon": "berry-juice",
  "desc": "아군이 스킬을 쓰면 체력 비율이 가장 낮은 다른 아군 PP +5"
 },
 {
  "id": "pilfer",
  "tier": 1,
  "name": "좀도둑",
  "src": "Pilfer",
  "icon": "strange-souvenir",
  "desc": "PvP에서 이기면 20% 확률로 조합 아이템 1개"
 },
 {
  "id": "levelup",
  "tier": 2,
  "name": "레벨 업!",
  "src": "Level Up!",
  "icon": "lucky-egg",
  "desc": "경험치를 살 때마다 경험치 +2 추가"
 },
 {
  "id": "pitems",
  "tier": 2,
  "name": "판도라의 아이템",
  "src": "Pandora's Items",
  "icon": "enigma-berry",
  "desc": "조합 아이템 2개. 라운드 시작마다 아이템 칸의 아이템이 같은 종류의 무작위 아이템으로 바뀜"
 },
 {
  "id": "tinytitans",
  "tier": 2,
  "name": "작은 거인",
  "src": "Tiny Titans",
  "icon": "hp-up",
  "desc": "플레이어 체력과 최대 체력 +20"
 },
 {
  "id": "secondwind",
  "tier": 2,
  "name": "재기",
  "src": "Second Wind",
  "icon": "sitrus-berry",
  "desc": "전투 시작 10초 뒤 아군이 잃은 체력의 40% 회복"
 },
 {
  "id": "gifts",
  "tier": 2,
  "name": "하늘의 선물",
  "src": "Gifts from Above",
  "icon": "galarica-wreath",
  "desc": "큰 모으령 상자 1개"
 },
 {
  "id": "trove",
  "tier": 2,
  "name": "보물창고",
  "src": "Treasure Trove",
  "icon": "pearl-string",
  "desc": "1티어 보물 2개"
 },
 {
  "id": "buried",
  "tier": 2,
  "name": "묻힌 보물",
  "src": "Buried Treasures",
  "icon": "big-mushroom",
  "desc": "다음 4라운드 동안 라운드마다 조합 아이템 1개"
 },
 {
  "id": "money",
  "tier": 2,
  "name": "돈!",
  "src": "Money!",
  "icon": "relic-gold",
  "desc": "PvE 라운드마다 4골드"
 },
 {
  "id": "lategame",
  "tier": 2,
  "name": "후반 전문가",
  "src": "Lategame Specialist",
  "icon": "dynamax-candy",
  "desc": "레벨 9가 되면 30골드"
 },
 {
  "id": "tonsstats",
  "tier": 2,
  "name": "엄청난 스탯",
  "src": "Tons of Stats",
  "icon": "calcium",
  "desc": "아군 체력 +60, 공격·특수공격·방어·특수방어·공격 속도 +6%"
 },
 {
  "id": "longpals",
  "tier": 2,
  "name": "원거리 친구",
  "src": "Long Distance Pals",
  "icon": "jaboca-berry",
  "desc": "가장 멀리 떨어진 아군 2명 체력·공격·특수공격 +15%"
 },
 {
  "id": "beggars",
  "tier": 2,
  "name": "거지도 가릴 수 있다",
  "src": "Beggars Can Be Choosers",
  "icon": "bottle-cap",
  "desc": "PvP에서 3번 질 때마다 작은 모으령 상자 1개"
 },
 {
  "id": "recombob",
  "tier": 2,
  "name": "재조합기",
  "src": "Recombobulator",
  "icon": "ability-capsule",
  "desc": "필드의 기물이 모두 1코스트 높은 무작위 기물로 바뀜 (별 유지)"
 },
 {
  "id": "patience",
  "tier": 2,
  "name": "인내는 미덕",
  "src": "Patience is a Virtue",
  "icon": "old-gateau",
  "desc": "새로고침을 하지 않은 라운드가 끝날 때마다 경험치 3 + 1골드"
 },
 {
  "id": "worthwait",
  "tier": 2,
  "name": "기다릴 가치",
  "src": "Worth the Wait",
  "icon": "stardust",
  "desc": "3성을 만들 때마다 6골드"
 },
 {
  "id": "cape",
  "tier": 2,
  "name": "전략가의 망토",
  "src": "Tactician's Cape",
  "icon": "iron",
  "desc": "필드에 놓을 수 있는 기물 +1"
 },
 {
  "id": "waiting",
  "tier": 2,
  "name": "기다림의 미학",
  "src": "사진",
  "icon": "lemonade",
  "desc": "무작위 1코 기물 1마리를 얻고, 게임이 끝날 때까지 라운드 시작마다 그 기물의 복사본을 얻음"
 },
 {
  "id": "magicdice",
  "tier": 2,
  "name": "마법 주사위",
  "src": "사진",
  "icon": "loaded-dice",
  "desc": "라운드마다 속임수주사위 1개"
 },
 {
  "id": "urf",
  "tier": 2,
  "name": "U.R.F.",
  "src": "사진",
  "icon": "x-sp-atk",
  "desc": "아군 최대 PP −25%"
 },
 {
  "id": "itembag",
  "tier": 2,
  "name": "아이템 꾸러미",
  "src": "Item Grab Bag",
  "icon": "power-weight",
  "desc": "완성 아이템 1개 + 조합 아이템 1개"
 },
 {
  "id": "richerplus",
  "tier": 2,
  "name": "부익부+",
  "src": "Rich Get Richer+",
  "icon": "gold-bottle-cap",
  "desc": "즉시 12골드, 이자 최대치 +1"
 },
 {
  "id": "ascension",
  "tier": 2,
  "name": "승천",
  "src": "Ascension",
  "icon": "max-revive",
  "desc": "전투 시작 15초 뒤 아군 피해 +50%"
 },
 {
  "id": "thinkfast",
  "tier": 2,
  "name": "빠른 판단",
  "src": "Think Fast",
  "icon": "x-speed",
  "desc": "다음 3라운드 동안 새로고침 무료"
 },
 {
  "id": "twotanky",
  "tier": 2,
  "name": "두 배로 튼튼",
  "src": "Two Tanky",
  "icon": "x-defense",
  "desc": "2성 아군 체력 +250"
 },
 {
  "id": "goldenticket",
  "tier": 3,
  "name": "황금 티켓",
  "src": "Golden Ticket",
  "icon": "luck-incense",
  "desc": "새로고침할 때 50% 확률로 무료"
 },
 {
  "id": "pforge",
  "tier": 3,
  "name": "휴대용 대장간",
  "src": "Portable Forge",
  "icon": "dynite-ore",
  "desc": "3티어 보물 4개 중 1개 선택"
 },
 {
  "id": "lforge",
  "tier": 3,
  "name": "살아있는 대장간",
  "src": "Living Forge",
  "icon": "great-ball",
  "desc": "5라운드마다 큰 모으령 상자 1개"
 },
 {
  "id": "goldenegg",
  "tier": 3,
  "name": "황금 알",
  "src": "The Golden Egg",
  "icon": "lum-berry",
  "desc": "9라운드 뒤 큰 모으령 상자 3개 + 60골드"
 },
 {
  "id": "hedge",
  "tier": 3,
  "name": "헤지 펀드",
  "src": "Hedge Fund",
  "icon": "big-nugget",
  "desc": "즉시 20골드, 이자 최대치 +5"
 },
 {
  "id": "cruel",
  "tier": 3,
  "name": "잔인한 계약",
  "src": "Cruel Pact",
  "icon": "rage-candy-bar",
  "desc": "경험치를 골드 대신 플레이어 체력 2로 구매"
 },
 {
  "id": "archives",
  "tier": 3,
  "name": "고대 기록보관소",
  "src": "Ancient Archives",
  "icon": "balm-mushroom",
  "desc": "무작위 시너지 +1 + 큰 모으령 상자 1개"
 },
 {
  "id": "tacrown",
  "tier": 3,
  "name": "전략가의 왕관",
  "src": "Tactician's Crown",
  "icon": "zinc",
  "desc": "필드에 놓을 수 있는 기물 +1 + 조합 아이템 2개"
 },
 {
  "id": "gloves",
  "tier": 3,
  "name": "행운의 장갑",
  "src": "Lucky Gloves",
  "icon": "power-bracer",
  "desc": "아이템 상자가 4개 대신 6개 중에서 고르게 됨 + 큰 모으령 상자 1개"
 },
 {
  "id": "relics",
  "tier": 3,
  "name": "찬란한 유물",
  "src": "Radiant Relics",
  "icon": "weakness-policy",
  "desc": "3티어 보물 1개 + 2티어 보물 2개"
 },
 {
  "id": "wellness",
  "tier": 3,
  "name": "웰니스 트러스트",
  "src": "Wellness Trust",
  "icon": "sacred-ash",
  "desc": "라운드마다 필드 아군의 최대 체력 +12 영구"
 },
 {
  "id": "expected",
  "tier": 3,
  "name": "예상된 예외",
  "src": "Expected Unexpectedness",
  "icon": "dire-hit",
  "desc": "전투마다 아군 공격·특수공격이 무작위로 +15~45%"
 },
 {
  "id": "tiniest",
  "tier": 3,
  "name": "가장 작은 거인",
  "src": "Tiniest Titan",
  "icon": "carbos",
  "desc": "플레이어 체력과 최대 체력 +30, 라운드마다 1골드"
 },
 {
  "id": "phreaky",
  "tier": 3,
  "name": "기괴한 금요일",
  "src": "Phreaky Friday",
  "icon": "rowap-berry",
  "desc": "4라운드 뒤 무작위 4코 2성 기물 1마리 + 25골드"
 },
 {
  "id": "birthday",
  "tier": 3,
  "name": "생일 선물",
  "src": "Birthday Present",
  "icon": "leppa-berry",
  "desc": "레벨업할 때마다 그 레벨에 맞는 코스트의 무작위 2성 기물"
 },
 {
  "id": "kitchen",
  "tier": 3,
  "name": "전략가의 주방",
  "src": "Tactician's Kitchen",
  "icon": "max-potion",
  "desc": "무작위 시너지 2개가 각각 +1"
 },
 {
  "id": "lonehero",
  "tier": 3,
  "name": "외로운 영웅",
  "src": "Lone Hero",
  "icon": "throat-spray",
  "desc": "필드에 기물이 1마리뿐이면 그 기물의 체력·공격·특수공격 3배"
 },
 {
  "id": "collector",
  "tier": 3,
  "name": "아이템 수집가",
  "src": "Item Collector",
  "icon": "pass-orb",
  "desc": "필드 아군이 든 아이템 종류 하나마다 아군 체력 +15, 피해 +1%"
 },
 {
  "id": "reckoning",
  "tier": 3,
  "name": "마지막 심판",
  "src": "Final Reckoning",
  "icon": "red-card",
  "desc": "PvP에서 지면 다음 전투 아군 피해 +25% (중첩, 이기면 초기화)"
 },
 {
  "id": "bronze",
  "tier": 3,
  "name": "평생 브론즈 III",
  "src": "Bronze for Life III",
  "icon": "utility-umbrella",
  "desc": "1단계로 켜진 시너지 하나마다 아군 체력 +40, 피해 +3%"
 },
 {
  "id": "prismticket",
  "tier": 3,
  "name": "프리즘 티켓",
  "src": "Prismatic Ticket",
  "icon": "premier-ball",
  "desc": "새로고침할 때 40% 확률로 무료 + 즉시 무료 새로고침 5회"
 },
 {
  "id": "windfall3",
  "tier": 3,
  "name": "대박 횡재",
  "src": "Windfall++",
  "icon": "nugget",
  "desc": "즉시 30골드"
 },
 {
  "id": "level11",
  "tier": 3,
  "name": "레벨 11",
  "src": "자체",
  "icon": "lucky-egg",
  "desc": "최대 레벨 +1"
 },
 {
  "id": "pbox",
  "tier": 3,
  "name": "판도라의 상자",
  "src": "자체",
  "icon": "enigma-berry",
  "desc": "큰 모으령 상자 2개. 라운드 시작마다 아이템 칸의 완성 아이템이 무작위로 바뀜"
 }
];

const AUG_MAP = Object.fromEntries(AUGMENTS.map(x => [x.id, x]));

const AUG_TRAIT = { heart: 1, soul: 1, crown: 2, archives: 1, kitchen: 1 };

const AUG_PATTERNS = [[1, 1, 1], [1, 1, 2], [1, 2, 2], [2, 2, 2], [1, 2, 3], [2, 2, 3], [2, 3, 3], [1, 1, 3], [2, 1, 2], [2, 3, 2], [3, 2, 2], [1, 3, 2]];

const AUG_ROUNDS = ['2-1', '3-2', '4-2'];

function augDef(id) {
  return AUG_MAP[id] || null;
}
