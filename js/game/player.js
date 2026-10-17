class Player {
  constructor(id, name, isHuman) {
    this.id = id;
    this.name = name;
    this.isHuman = isHuman;
    this.hp = CONFIG.startHp;
    this.gold = 0;
    this.level = 1;
    this.xp = 0;
    this.streak = 0;
    this.alive = true;
    this.placement = 0;
    this.board = [];
    for (let r = 0; r < BOARD_ROWS; r++) this.board.push(new Array(BOARD_COLS).fill(null));
    this.bench = new Array(CONFIG.benchSize).fill(null);
    this.shop = new Array(CONFIG.shopSize).fill(null);
    this.shopLocked = false;
    this.pity = 0;
    this.lastOpponent = null;
    this.currentOpponent = null;
    this.lastResult = null;
    this.branch = {};
    this.pendingBranch = [];
    this.unlockedShop = new Set();
    this.excluded = new Set();
    this.guaranteed = [];
    this.pending = [];
    this.downloadStage = 0;
    this.pendingDownload = 0;
    this.counters = { hypnosis: 0, heal: 0, gene: 0, download: 0, bolt: 0, burn: 0 };
    this.dragonScales = 0;
    this.training = 0;
    this.psychic = 0;
    this.psychicLosses = 0;
    this.fossilWins = 0;
    this.fossilLosses = 0;
    this.participants = new Set();
    this.history = {};
    this.orbs = [];
    this.items = ['magnet', 'magnet', 'magnet', 'magnet'];
    this.stage1Items = 0;
    this.stage1Given = 0;
    this.strategist = 'Hazel';
    this.mapId = null;
    this.dittoLink = null;
    this.fedRound = null;
    this.seaTiles = [];
  }

  boardUnits() {
    const out = [];
    for (const r of HOME_ROWS) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (this.board[r][c]) out.push(this.board[r][c]);
      }
    }
    return out;
  }

  benchUnits() {
    return this.bench.filter(Boolean);
  }

  allUnits() {
    return this.boardUnits().concat(this.benchUnits());
  }

  boardCount() {
    return this.boardUnits().length;
  }

  freeBenchSlot() {
    return this.bench.indexOf(null);
  }

  findInstance(iid) {
    return this.allUnits().find(u => u.iid === iid) || null;
  }

  unitAt(loc) {
    if (!loc) return null;
    if (loc.zone === 'board') return this.board[loc.r][loc.c];
    if (loc.zone === 'bench') return this.bench[loc.i];
    return null;
  }

  setAt(loc, inst) {
    if (loc.zone === 'board') this.board[loc.r][loc.c] = inst;
    else this.bench[loc.i] = inst;
    if (inst) inst.loc = Object.assign({}, loc);
  }

  remove(inst) {
    if (!inst || !inst.loc) return;
    const here = this.unitAt(inst.loc);
    if (here === inst) {
      if (inst.loc.zone === 'board') this.board[inst.loc.r][inst.loc.c] = null;
      else this.bench[inst.loc.i] = null;
    }
    inst.loc = null;
  }

  placeBench(inst, i) {
    this.setAt({ zone: 'bench', i }, inst);
  }

  placeBoard(inst, r, c) {
    this.setAt({ zone: 'board', r, c }, inst);
  }

  xpNeeded() {
    return CONFIG.xpToNext[this.level] || 0;
  }

  addXp(n) {
    if (this.level >= CONFIG.maxLevel) return;
    this.xp += n;
    while (this.level < CONFIG.maxLevel && this.xp >= this.xpNeeded()) {
      this.xp -= this.xpNeeded();
      this.level += 1;
    }
    if (this.level >= CONFIG.maxLevel) this.xp = 0;
  }
}
