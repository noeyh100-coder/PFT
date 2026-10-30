const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RANK_TIERS = ['몬스터볼', '슈퍼볼', '하이퍼볼', '마스터볼'];
const RANK_DELTA = [40, 30, 20, 10, -10, -20, -30, -40];
const TABLE = process.env.SUPABASE_TABLE || 'ptft_accounts';
const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
const DATA_DIR = path.resolve(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'accounts.json');
const TOKEN_DAYS = 30;
const DEV_IDS = new Set(String(process.env.DEV_IDS || 'noeyh100').split(',').map(x => x.trim().toLowerCase()).filter(Boolean));

function rankOf(lp) {
  const p = Math.max(0, Math.floor(lp || 0));
  const tier = Math.min(3, Math.floor(p / 400));
  if (tier === 3 && p >= 1500) return { tier, tierName: RANK_TIERS[3], div: 1, lp: p - 1500, total: p };
  const rest = p - tier * 400;
  return { tier, tierName: RANK_TIERS[tier], div: 4 - Math.floor(rest / 100), lp: rest % 100, total: p };
}

function rankDelta(placement) {
  return RANK_DELTA[Math.max(1, Math.min(8, placement)) - 1];
}

class FileStore {
  constructor() {
    this.kind = 'file';
    this.rows = {};
    try {
      this.rows = JSON.parse(fs.readFileSync(FILE, 'utf8')) || {};
    } catch (e) {
      this.rows = {};
    }
  }

  save() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.rows));
    fs.renameSync(tmp, FILE);
  }

  async get(id) {
    return this.rows[id] ? Object.assign({}, this.rows[id]) : null;
  }

  async byName(name) {
    for (const r of Object.values(this.rows)) if (r.name.toLowerCase() === name.toLowerCase()) return Object.assign({}, r);
    return null;
  }

  async insert(row) {
    if (this.rows[row.id]) return false;
    this.rows[row.id] = Object.assign({}, row);
    this.save();
    return true;
  }

  async update(id, patch) {
    if (!this.rows[id]) return null;
    Object.assign(this.rows[id], patch);
    this.save();
    return Object.assign({}, this.rows[id]);
  }
}

class SupabaseStore {
  constructor() {
    this.kind = 'supabase';
    this.base = SUPA_URL + '/rest/v1/' + TABLE;
    this.headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' };
  }

  async req(query, opts) {
    const res = await fetch(this.base + query, Object.assign({ headers: this.headers }, opts || {}));
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (e) {
      body = null;
    }
    return { status: res.status, body };
  }

  async get(id) {
    const r = await this.req('?id=eq.' + encodeURIComponent(id) + '&select=*');
    if (r.status >= 300) throw new Error('db ' + r.status);
    return Array.isArray(r.body) && r.body[0] ? r.body[0] : null;
  }

  async byName(name) {
    const r = await this.req('?name=ilike.' + encodeURIComponent(name.replace(/[%_*]/g, '')) + '&select=*');
    if (r.status >= 300) throw new Error('db ' + r.status);
    return Array.isArray(r.body) && r.body[0] ? r.body[0] : null;
  }

  async insert(row) {
    const r = await this.req('', { method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, this.headers), body: JSON.stringify(row) });
    if (r.status === 409) return false;
    if (r.status >= 300) throw new Error('db ' + r.status);
    return true;
  }

  async update(id, patch) {
    const r = await this.req('?id=eq.' + encodeURIComponent(id), { method: 'PATCH', headers: Object.assign({ Prefer: 'return=representation' }, this.headers), body: JSON.stringify(patch) });
    if (r.status >= 300) throw new Error('db ' + r.status);
    return Array.isArray(r.body) && r.body[0] ? r.body[0] : null;
  }
}

function makeSecret(store) {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (store.kind === 'supabase') return crypto.createHash('sha256').update('ptft-session|' + SUPA_KEY).digest('hex');
  const f = path.join(DATA_DIR, 'secret.txt');
  try {
    const s = fs.readFileSync(f, 'utf8').trim();
    if (s.length >= 32) return s;
  } catch (e) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const s = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(f, s);
  } catch (e) {
    return s;
  }
  return s;
}

const store = SUPA_URL && SUPA_KEY ? new SupabaseStore() : new FileStore();
const SECRET = makeSecret(store);

function hashPw(pw, salt) {
  return new Promise((ok, fail) => crypto.scrypt(pw, salt, 32, (err, key) => (err ? fail(err) : ok(key.toString('hex')))));
}

function sign(id) {
  const exp = Date.now() + TOKEN_DAYS * 86400000;
  const body = Buffer.from(id).toString('base64url') + '.' + exp.toString(36);
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + sig;
}

function verify(token) {
  if (typeof token !== 'string' || token.length > 300) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const body = parts[0] + '.' + parts[1];
  const want = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(want);
  const b = Buffer.from(parts[2]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (parseInt(parts[1], 36) < Date.now()) return null;
  try {
    return Buffer.from(parts[0], 'base64url').toString();
  } catch (e) {
    return null;
  }
}

function publicView(row) {
  return { id: row.id, name: row.name, lp: row.lp || 0, games: row.games || 0, wins: row.wins || 0, top4: row.top4 || 0, rank: rankOf(row.lp), dev: DEV_IDS.has(row.id), wallet: row.wallet || null };
}

function cleanList(v, max) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const x of v) {
    if (typeof x !== 'string' || x.length > 40 || out.includes(x)) continue;
    out.push(x);
    if (out.length >= max) break;
  }
  return out;
}

function cleanInt(v) {
  const n = Math.floor(Number(v) || 0);
  return Math.max(0, Math.min(1e9, n));
}

function cleanWallet(w) {
  if (!w || typeof w !== 'object') return null;
  const owned = w.owned && typeof w.owned === 'object' ? w.owned : {};
  const gg = w.gameGold && typeof w.gameGold === 'object' ? w.gameGold : {};
  return {
    rev: cleanInt(w.rev),
    vp: cleanInt(w.vp),
    gold: cleanInt(w.gold),
    owned: { icon: cleanList(owned.icon, 2000), look: cleanList(owned.look, 200), map: cleanList(owned.map, 50) },
    used: cleanList(w.used, 500),
    shinyCharm: !!w.shinyCharm,
    amuletCoin: !!w.amuletCoin,
    awards: cleanList(w.awards, 30),
    gameGold: { k: String(gg.k || '').slice(0, 40), n: cleanInt(gg.n) }
  };
}

async function saveWallet(token, w) {
  const id = verify(token);
  if (!id) return { error: '다시 로그인해 주세요' };
  const wallet = cleanWallet(w);
  if (!wallet) return { error: '잘못된 요청입니다' };
  const row = await store.get(id);
  if (!row) return { error: '계정을 찾지 못했습니다' };
  if (row.wallet && (row.wallet.rev || 0) >= wallet.rev) return { wallet: row.wallet };
  const next = await store.update(id, { wallet });
  return { wallet: next ? next.wallet : wallet };
}

function cleanId(v) {
  const s = String(v || '').trim().toLowerCase();
  return /^[a-z0-9_]{4,16}$/.test(s) ? s : null;
}

function cleanName(v) {
  const n = String(v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12);
  return n.length >= 2 ? n : null;
}

async function register(o) {
  const id = cleanId(o.id);
  if (!id) return { error: '아이디는 영어 소문자·숫자·_ 4~16글자입니다' };
  const name = cleanName(o.name);
  if (!name) return { error: '닉네임은 2~12글자입니다' };
  const pw = String(o.pw || '');
  if (pw.length < 6 || pw.length > 64) return { error: '비밀번호는 6~64글자입니다' };
  if (await store.get(id)) return { error: '이미 있는 아이디입니다' };
  if (await store.byName(name)) return { error: '이미 쓰는 닉네임입니다' };
  const salt = crypto.randomBytes(16).toString('hex');
  const row = { id, name, salt, hash: await hashPw(pw, salt), lp: 0, games: 0, wins: 0, top4: 0 };
  if (!(await store.insert(row))) return { error: '이미 있는 아이디입니다' };
  return { token: sign(id), account: publicView(row) };
}

async function login(o) {
  const id = cleanId(o.id);
  const pw = String(o.pw || '');
  const row = id ? await store.get(id) : null;
  if (!row) return { error: '아이디 또는 비밀번호가 맞지 않습니다' };
  const h = await hashPw(pw, row.salt);
  if (!crypto.timingSafeEqual(Buffer.from(h), Buffer.from(row.hash))) return { error: '아이디 또는 비밀번호가 맞지 않습니다' };
  return { token: sign(id), account: publicView(row) };
}

async function me(token) {
  const id = verify(token);
  const row = id ? await store.get(id) : null;
  return row ? { account: publicView(row) } : { error: '다시 로그인해 주세요' };
}

async function rename(token, v) {
  const id = verify(token);
  if (!id) return { error: '다시 로그인해 주세요' };
  const name = cleanName(v);
  if (!name) return { error: '닉네임은 2~12글자입니다' };
  const other = await store.byName(name);
  if (other && other.id !== id) return { error: '이미 쓰는 닉네임입니다' };
  const row = await store.update(id, { name });
  return row ? { account: publicView(row) } : { error: '계정을 찾지 못했습니다' };
}

async function applyResult(id, placement) {
  const row = await store.get(id);
  if (!row) return null;
  const before = row.lp || 0;
  const after = Math.max(0, before + rankDelta(placement));
  const next = await store.update(id, { lp: after, games: (row.games || 0) + 1, wins: (row.wins || 0) + (placement === 1 ? 1 : 0), top4: (row.top4 || 0) + (placement <= 4 ? 1 : 0) });
  return { placement, before: rankOf(before), after: rankOf(after), delta: after - before, account: next ? publicView(next) : null };
}

module.exports = { store, register, login, me, rename, saveWallet, verify, applyResult, rankOf, rankDelta, RANK_TIERS };
