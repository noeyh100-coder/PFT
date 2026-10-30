const VP_PLACE = [1000, 500, 400, 300, 100, 100, 100, 100];
const VP_PRICE = { icon: 250, look: 500, map: 1500 };
const WALLET_DEFAULT = { icon: 'Bulbasaur', look: 'TrAA', map: 'kanto' };
const COIN_GOLD = 50000;

const Wallet = {
  key: 'guest',
  data: null,
  api: null,

  fresh() {
    return { rev: 0, vp: 0, gold: 0, owned: { icon: [], look: [], map: [] }, used: [], shinyCharm: false, amuletCoin: false, awards: [], gameGold: { k: '', n: 0 } };
  },

  norm(w) {
    const d = this.fresh();
    const src = w && typeof w === 'object' ? w : {};
    for (const k of ['rev', 'vp', 'gold']) d[k] = Math.max(0, Math.floor(Number(src[k]) || 0));
    for (const k of ['icon', 'look', 'map']) {
      const list = src.owned && Array.isArray(src.owned[k]) ? src.owned[k].filter(x => typeof x === 'string') : [];
      d.owned[k] = Array.from(new Set([WALLET_DEFAULT[k]].concat(list)));
    }
    d.used = Array.isArray(src.used) ? Array.from(new Set(src.used.filter(x => typeof x === 'string'))) : [];
    d.shinyCharm = !!src.shinyCharm;
    d.amuletCoin = !!src.amuletCoin;
    d.awards = Array.isArray(src.awards) ? src.awards.slice(-30) : [];
    if (src.gameGold && typeof src.gameGold === 'object') d.gameGold = { k: String(src.gameGold.k || ''), n: Math.max(0, Math.floor(Number(src.gameGold.n) || 0)) };
    return d;
  },

  readLocal(key) {
    try {
      return JSON.parse(localStorage.getItem('ptft-wallet-' + key) || 'null');
    } catch (e) {
      return null;
    }
  },

  writeLocal() {
    try {
      localStorage.setItem('ptft-wallet-' + this.key, JSON.stringify(this.data));
    } catch (e) {
      return;
    }
  },

  load(accountId, remote) {
    this.key = accountId || 'guest';
    const local = this.readLocal(this.key);
    const pick = remote && (!local || (remote.rev || 0) >= (local.rev || 0)) ? remote : local;
    this.data = this.norm(pick);
    this.writeLocal();
    if (accountId && local && (!remote || (local.rev || 0) > (remote.rev || 0))) this.sync();
    return this.data;
  },

  get() {
    if (!this.data) this.load(null, null);
    return this.data;
  },

  save(sync) {
    const d = this.get();
    d.rev += 1;
    this.writeLocal();
    if (sync) this.sync();
  },

  sync() {
    if (!this.api || this.key === 'guest') return;
    const key = this.key;
    this.api('wallet', { wallet: this.data }).then(r => {
      if (key !== this.key || !r || !r.wallet) return;
      if ((r.wallet.rev || 0) > this.data.rev) {
        this.data = this.norm(r.wallet);
        this.writeLocal();
      }
    });
  },

  owns(kind, key) {
    return this.get().owned[kind].includes(key);
  },

  buy(kind, key) {
    const d = this.get();
    if (this.owns(kind, key)) return { ok: true };
    const price = VP_PRICE[kind];
    if (d.vp < price) return { ok: false, reason: 'VP가 부족합니다 (' + d.vp + ' / ' + price + ')' };
    d.vp -= price;
    d.owned[kind].push(key);
    this.save(true);
    return { ok: true };
  },

  requiredUnits() {
    if (!this.required) this.required = UNIT_DATA.filter(u => !u.region).map(u => u.id);
    return this.required;
  },

  baseUnit(id) {
    const def = UNITS[id];
    if (!def || !def.region) return id;
    const base = id.split(' ').slice(1).join(' ');
    return UNITS[base] ? base : id;
  },

  usedCount() {
    const used = new Set(this.get().used);
    return this.requiredUnits().filter(id => used.has(id)).length;
  },

  markUsed(ids) {
    const d = this.get();
    let changed = false;
    for (const raw of ids) {
      const id = this.baseUnit(raw);
      if (d.used.includes(id)) continue;
      d.used.push(id);
      changed = true;
    }
    if (!changed) return false;
    const got = !d.shinyCharm && this.usedCount() >= this.requiredUnits().length;
    if (got) d.shinyCharm = true;
    this.save(got);
    return got;
  },

  addGold(gameKey, earned) {
    const d = this.get();
    const before = d.gameGold.k === gameKey ? d.gameGold.n : 0;
    const add = Math.max(0, Math.floor(earned) - before);
    d.gameGold = { k: gameKey, n: Math.max(before, Math.floor(earned)) };
    if (!add) return false;
    d.gold += add;
    const got = !d.amuletCoin && d.gold >= COIN_GOLD;
    if (got) d.amuletCoin = true;
    this.save(got);
    return got;
  },

  award(gameKey, placement) {
    const d = this.get();
    if (!placement || d.awards.includes(gameKey)) return null;
    const base = VP_PLACE[Math.max(1, Math.min(8, placement)) - 1];
    const vp = d.amuletCoin ? base * 2 : base;
    d.vp += vp;
    d.awards = d.awards.concat([gameKey]).slice(-30);
    this.save(true);
    return { vp, doubled: d.amuletCoin };
  }
};
