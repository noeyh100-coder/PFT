const EVOLVE_EXCLUDES = {
  '저승갓숭': ['망키'],
  '갸라도스': ['잉어킹'],
  '신뇽': ['미뇽'],
  '망나뇽': ['신뇽'],
  '팬텀': ['고오스'],
  '후딘': ['캐이시'],
  '해피너스': ['핑복'],
  '야도킹': ['야돈', '야도란'],
  '야도란': ['야돈', '야도킹']
};

const Unlocks = {
  queue(p, entry) {
    if (p.pending.some(e => e.iid === entry.iid)) return;
    p.pending.push(entry);
  },

  onCombatStart(game, p) {
    const board = p.boardUnits();
    p.participants = new Set(board.map(u => u.iid));
    if (!p.unlockedShop.has('뮤')) {
      const types = computeSynergies(p).filter(s => s.kind === 'type' && s.active).length;
      if (types >= 4) this.unlockGuaranteed(game, p, '뮤');
    }
    if (!p.unlockedShop.has('프리져')) {
      let total = 0;
      for (const inst of board) {
        const form = formOf(UNITS[inst.unitId], inst.star, p);
        if (form.types.includes('얼음')) total += inst.star;
      }
      if (total >= CONFIG.unlock.iceStarTotal) this.unlockGuaranteed(game, p, '프리져');
    }
    const used = new Set();
    for (const inst of board) {
      if (inst.unitId !== '야돈' || inst.star < 2) continue;
      const up = '야도킹';
      const down = '야도란';
      const tryCells = (cells, target) => {
        if (p.excluded.has(target)) return false;
        for (const [r, c] of cells) {
          const o = p.board[r][c];
          if (o && o.unitId === '셀러' && o.star >= 2 && !used.has(o.iid)) {
            used.add(o.iid);
            this.queue(p, { iid: inst.iid, to: target, star: 1, consume: o.iid });
            return true;
          }
        }
        return false;
      };
      if (!tryCells(Hex.upperNeighbors(inst.loc.r, inst.loc.c), up)) {
        tryCells(Hex.lowerNeighbors(inst.loc.r, inst.loc.c), down);
      }
    }
  },

  onCombatEnd(game, p, sim, side, isPvp) {
    const won = sim.winner === side;
    const cfg = CONFIG.unlock;
    for (const cu of sim.units) {
      if (cu.side !== side || !cu.iid) continue;
      const inst = p.findInstance(cu.iid);
      if (!inst) continue;
      const id = inst.unitId;
      if ((id === '미뇽' || id === '신뇽') && inst.star >= 2 && won) inst.wins += 1;
      if (id === '잉어킹' && inst.star === 3) inst.battles = (inst.battles || 0) + 1;
      if (id === '고오스' && inst.star >= 2) inst.takedowns += cu.takedowns;
      if (id === '미뇽' && inst.star >= 2 && inst.wins >= cfg.dratiniWins) {
        this.queue(p, { iid: inst.iid, to: '신뇽', star: Math.max(1, inst.star - 1) });
      }
      if (id === '신뇽' && inst.star >= 2 && inst.wins >= cfg.dragonairWins) {
        this.queue(p, { iid: inst.iid, to: '망나뇽', star: Math.max(1, inst.star - 1) });
      }
      if (id === '잉어킹' && inst.star === 3 && inst.battles >= cfg.magikarpBattles) {
        this.queue(p, { iid: inst.iid, to: '갸라도스', star: 2 });
      }
      if (id === '고오스' && inst.star >= 2 && inst.takedowns >= cfg.gastlyTakedowns) {
        this.queue(p, { iid: inst.iid, to: '팬텀', star: Math.max(1, inst.star - 1) });
      }
      if (id === '망키' && inst.star >= 2 && !cu.alive && isPvp) {
        this.queue(p, { iid: inst.iid, to: '저승갓숭', star: Math.max(1, inst.star - 1) });
      }
      if (id === '캐이시' && inst.star >= 2 && p.counters.hypnosis >= cfg.hypnosisSeconds) {
        this.queue(p, { iid: inst.iid, to: '후딘', star: Math.max(1, inst.star - 1) });
      }
      if (id === '핑복' && inst.star >= 2 && p.counters.heal >= cfg.healStack) {
        this.queue(p, { iid: inst.iid, to: '해피너스', star: 1 });
      }
    }
    const mine = sim.units.filter(cu => cu.side === side);
    if (!p.unlockedShop.has('투구')) {
      if (mine.some(cu => cu.unitId === '암나이트' && cu.star >= 2)) {
        p.fossilWins = won ? p.fossilWins + 1 : 0;
        if (p.fossilWins >= cfg.kabutoWins) this.unlockGuaranteed(game, p, '투구');
      } else {
        p.fossilWins = 0;
      }
    }
    if (!p.unlockedShop.has('프테라')) {
      if (mine.some(cu => cu.unitId === '투구' && cu.star >= 2)) {
        p.fossilLosses = won ? 0 : p.fossilLosses + 1;
        if (p.fossilLosses >= cfg.aerodactylLosses) this.unlockGuaranteed(game, p, '프테라');
      } else {
        p.fossilLosses = 0;
      }
    }
    const stage = p.counters.download >= cfg.downloadStage2 ? 2 : p.counters.download >= cfg.downloadStage1 ? 1 : 0;
    if (stage > p.downloadStage) p.pendingDownload = stage;
    if (p.counters.gene >= cfg.geneStack) this.unlockGuaranteed(game, p, '뮤츠');
    if (p.counters.stun >= cfg.electricStuns) this.unlockGuaranteed(game, p, '썬더');
    if (p.counters.burn >= cfg.burnDamage) this.unlockGuaranteed(game, p, '파이어');
  },

  resolvePending(game, p) {
    const list = p.pending;
    p.pending = [];
    for (const e of list) {
      const inst = p.findInstance(e.iid);
      if (!inst) continue;
      if (e.consume) {
        const s = p.findInstance(e.consume);
        if (s) {
          p.remove(s);
          game.pool.give(s.unitId, copiesForStar(s.star));
        }
      }
      const fromName = formOf(UNITS[inst.unitId], inst.star, p).name;
      inst.unitId = e.to;
      inst.star = e.star;
      inst.wins = 0;
      inst.pvpWins = 0;
      inst.takedowns = 0;
      inst.battles = 0;
      game.notify(p, fromName + ' → ' + formOf(UNITS[e.to], e.star, p).name + ' 진화!', 'evolve');
      this.markUnlocked(game, p, e.to);
    }
    if (p.pendingDownload && p.pendingDownload > p.downloadStage) {
      p.downloadStage = p.pendingDownload;
      game.notify(p, '다운로드 완료: 폴리곤이 ' + UNITS['폴리곤'].stageForms[p.downloadStage].name + '(으)로 업그레이드!', 'evolve');
    }
    p.pendingDownload = 0;
  },

  markUnlocked(game, p, id) {
    if (p.unlockedShop.has(id)) return;
    p.unlockedShop.add(id);
    for (const ex of EVOLVE_EXCLUDES[id] || []) p.excluded.add(ex);
    game.notify(p, id + ' 해금! 이제 상점에 ' + id + '이(가) 등장합니다.', 'unlock');
  },

  unlockGuaranteed(game, p, id) {
    if (p.unlockedShop.has(id)) return;
    p.unlockedShop.add(id);
    p.guaranteed.push(id);
    game.notify(p, id + ' 해금! 다음 새로고침에 확정으로 등장합니다.', 'unlock');
  },

  progressText(inst, p, game) {
    const cfg = CONFIG.unlock;
    const id = inst.unitId;
    if (id === '미뇽') return inst.star >= 2 ? '신뇽 진화: 승리 ' + inst.wins + '/' + cfg.dratiniWins : '2성이 되면 승리 횟수를 셉니다 (신뇽)';
    if (id === '신뇽') return inst.star >= 2 ? '망나뇽 진화: 승리 ' + inst.wins + '/' + cfg.dragonairWins : '2성이 되면 승리 횟수를 셉니다 (망나뇽)';
    if (id === '잉어킹') return inst.star === 3 ? '갸라도스 진화: 전투 참여 ' + (inst.battles || 0) + '/' + cfg.magikarpBattles : '3성이 되면 전투 참여 횟수를 셉니다 (갸라도스)';
    if (id === '고오스') return inst.star >= 2 ? '팬텀 진화: 처치 관여 ' + inst.takedowns + '/' + cfg.gastlyTakedowns : '고우스트가 되면 처치 관여를 셉니다 (팬텀)';
    if (id === '망키') return inst.star >= 2 ? '저승갓숭 진화: PvP 전투에서 쓰러지면 진화' : '성원숭이 되면 조건이 열립니다 (저승갓숭)';
    if (id === '캐이시') return '후딘 진화: 최면 누적 ' + Math.floor(p.counters.hypnosis) + '/' + cfg.hypnosisSeconds + '초 + 윤겔라 전투 참여';
    if (id === '핑복') return '치유 스택 ' + Math.floor(p.counters.heal) + (p.counters.heal >= cfg.healStack ? ' · 럭키가 전투에 참여하면 해피너스 진화' : '/' + cfg.healStack + ' (해피너스)');
    if (id === '해피너스') return '치유 스택 ' + Math.floor(p.counters.heal);
    if (id === '야돈') return inst.star >= 2 ? '위 칸에 2성 셀러 → 야도킹 / 아래 칸에 2성 셀러 → 야도란 (1성으로 진화)' : '2성이 되면 2성 셀러와 붙어 진화할 수 있습니다';
    if (id === '메타몽') {
      const tgt = dittoTargetOf(p);
      const name = tgt ? formOf(UNITS[tgt.unitId], tgt.star, p).name : '없음';
      return (p.dittoLink && tgt && tgt.iid === p.dittoLink ? '연결: ' : '자동 연결: ') + name;
    }
    if (id === '먹고자') {
      const f = inst.feast;
      const parts = f ? [['atk', '공격'], ['spa', '특수공격'], ['def', '방어'], ['spd', '특수방어']].filter(([k]) => f[k] > 0).map(([k, n]) => n + ' +' + Math.round(f[k] * 100) + '%') : [];
      return (p.fedRound === game.roundLabel() ? '이번 준비 단계 먹이 완료' : '먹이 가능') + (parts.length ? ' · ' + parts.join(', ') : '');
    }
    if (id === '폴리곤') {
      const next = p.downloadStage === 0 ? cfg.downloadStage1 : p.downloadStage === 1 ? cfg.downloadStage2 : null;
      return next ? '다운로드 ' + Math.floor(p.counters.download) + '/' + next : '다운로드 완료';
    }
    if (id === '암나이트') return p.unlockedShop.has('투구') ? '투구 해금 완료' : '투구 해금: 2성으로 필드에서 연속 승리 ' + p.fossilWins + '/' + cfg.kabutoWins;
    if (id === '투구') return p.unlockedShop.has('프테라') ? '프테라 해금 완료' : '프테라 해금: 2성으로 필드에서 연속 패배 ' + p.fossilLosses + '/' + cfg.aerodactylLosses;
    if (id === '뮤') return '뮤츠 해금: 유전자 ' + Math.floor(p.counters.gene) + '/' + cfg.geneStack;
    return '';
  }
};
