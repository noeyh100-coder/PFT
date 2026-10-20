const ENCOUNTERS = [
  { id: '나옹', en: 'Meowth', desc: '매 스테이지 첫 라운드에 골드를 받습니다. (2스테이지 8 · 3스테이지 12 · 4스테이지 16 · 5스테이지 20 · 6스테이지 24 · 7스테이지 28)' },
  { id: '피카츄', en: 'Pikachu', desc: '모든 플레이어가 1코스트 선물 대신 무작위 2코스트 기물 하나를 받습니다.' },
  { id: '이브이', en: 'Eevee', desc: '모든 플레이어가 1코스트 선물 대신 무작위 3코스트 기물 하나를 받습니다.' },
  { id: '폴리곤', en: 'Porygon', desc: '모든 플레이어가 작은 모으령 상자 2개를 받습니다.' },
  { id: '썬더', en: 'Zapdos', desc: '플레이어가 탈락하면 그 플레이어의 골드를 남은 플레이어들이 똑같이 나눠 받습니다.' },
  { id: '잉어킹', en: 'Magikarp', desc: '잉어킹이 튀어오르기를 썼습니다. 그러나 아무 일도 일어나지 않았습니다.' },
  { id: '프리져', en: 'Articuno', desc: '게임당 한 번, 체력이 1 이하로 떨어지면 그 라운드의 피해를 모두 막고 체력 1로 버팁니다.' },
  { id: '해피너스', en: 'Blissey', desc: '모든 플레이어가 체력 120으로 시작합니다.' },
  { id: '저승갓숭', en: 'Annihilape', desc: '모든 플레이어가 체력 90으로 시작합니다.' },
  { id: '파이어', en: 'Moltres', desc: '게임당 한 번, 체력이 30 미만이 되면 큰 모으령 상자 3개와 20골드를 받습니다.' },
  { id: '먹고자', en: 'Munchlax', desc: '증강 카드마다 새로고침을 2번 더 할 수 있습니다. (카드마다 3번)' },
  { id: '메타몽', en: 'Ditto', desc: '가장 많이 모은 타입·특성 시너지의 기물 수가 1 늘어납니다.' }
];

const ENCOUNTER_IDS = ENCOUNTERS.map(e => e.id);

function encounterDef(id) {
  return ENCOUNTERS.find(e => e.id === id) || null;
}

function encounterGold(stage) {
  return stage >= 2 && stage <= 7 ? 4 * stage : 0;
}
