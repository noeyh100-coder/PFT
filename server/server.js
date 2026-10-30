const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const accounts = require('./accounts');

const PORT = Number(process.env.PORT) || 8080;
const TICK_MS = Math.max(2, Number(process.env.TICK_MS) || 50);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = new Set(['index.html', 'css', 'js', 'img', 'fonts', 'sound']);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.md': 'text/plain; charset=utf-8',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};
const MAX_GAME_MS = 100 * 60 * 1000;
const EMPTY_ROOM_MS = 3 * 60 * 1000;
const LOBBY_GRACE_MS = 10 * 1000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RANK_SIZE = Math.max(2, Math.min(8, Number(process.env.RANK_SIZE) || 8));
const RANK_REPORT_MS = 15000;
const rankQueue = [];
const apiHits = new Map();

const clients = new Map();
const rooms = new Map();

const server = http.createServer((req, res) => {
  let url = '/';
  try {
    url = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400);
    res.end();
    return;
  }
  if (url.startsWith('/api/')) {
    handleApi(req, res, url);
    return;
  }
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok ' + rooms.size);
    return;
  }
  if (url === '/') url = '/index.html';
  const file = path.resolve(ROOT, '.' + url);
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || path.isAbsolute(rel) || !PUBLIC.has(rel.split(path.sep)[0])) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  if (rel.split(path.sep)[0] === 'sound' && !/\.(ogg|mp3|wav)$/i.test(file)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Content-Length': st.size };
    if (ext === '.png' || ext === '.woff2' || ext === '.ttf' || ext === '.ogg' || ext === '.mp3') headers['Cache-Control'] = 'public, max-age=86400';
    else headers['Cache-Control'] = 'no-cache';
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
});

function apiSend(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function apiLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const h = apiHits.get(ip) || { start: now, n: 0 };
  if (now - h.start > 60000) {
    h.start = now;
    h.n = 0;
  }
  h.n += 1;
  apiHits.set(ip, h);
  return h.n > 40;
}

function handleApi(req, res, url) {
  if (req.method !== 'POST') return apiSend(res, 405, { error: 'POST만 됩니다' });
  if (apiLimited(req)) return apiSend(res, 429, { error: '요청이 너무 많습니다. 잠시 뒤에 다시 해 주세요' });
  let raw = '';
  req.on('data', d => {
    raw += d;
    if (raw.length > 32768) req.destroy();
  });
  req.on('end', async () => {
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return apiSend(res, 400, { error: '잘못된 요청입니다' });
    }
    const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    try {
      let out;
      if (url === '/api/register') out = await accounts.register(body);
      else if (url === '/api/login') out = await accounts.login(body);
      else if (url === '/api/me') out = await accounts.me(auth);
      else if (url === '/api/rename') out = await accounts.rename(auth, body.name);
      else if (url === '/api/wallet') out = await accounts.saveWallet(auth, body.wallet);
      else return apiSend(res, 404, { error: '없는 주소입니다' });
      apiSend(res, out.error ? 400 : 200, out);
    } catch (e) {
      console.error(e);
      apiSend(res, 500, { error: '계정 서버에 문제가 생겼습니다. 잠시 뒤에 다시 해 주세요' });
    }
  });
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8192 });

function send(c, msg) {
  if (c && c.ws && c.ws.readyState === 1) c.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
}

function cleanName(v) {
  const n = String(v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12);
  return n.length >= 2 ? n : '게스트' + Math.floor(Math.random() * 900 + 100);
}

function cleanLook(v) {
  const l = String(v || '');
  return /^[A-Za-z]{1,16}$/.test(l) ? l : '';
}

function cleanIcon(v) {
  const l = String(v || '');
  return /^[A-Za-z0-9-]{1,24}$/.test(l) ? l : '';
}

function newCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 5; i++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
    if (!rooms.has(c)) return c;
  }
}

function roomView(room, token) {
  return {
    code: room.code,
    state: room.state,
    ranked: !!room.ranked,
    members: room.members.map(t => {
      const c = clients.get(t);
      return { name: room.names[t], look: room.looks[t] || '', icon: room.icons[t] || '', host: t === room.host, me: t === token, online: !!(c && c.ws) };
    })
  };
}

function broadcastRoom(room) {
  for (const t of room.members) send(clients.get(t), { t: 'room', room: roomView(room, t) });
}

function startInfo(room, token) {
  return { t: 'start', code: room.code, seed: room.seed, seats: room.seats, slot: room.slotOf[token], ranked: !!room.ranked };
}

function leaveRoom(c, explicit) {
  const room = c.room ? rooms.get(c.room) : null;
  c.room = null;
  if (!room) return;
  if (room.state === 'lobby') {
    room.members = room.members.filter(t => t !== c.token);
    delete room.names[c.token];
    delete room.looks[c.token];
    if (room.maps) delete room.maps[c.token];
    delete room.icons[c.token];
    if (room.host === c.token) room.host = room.members[0] || null;
    if (!room.members.length) closeRoom(room);
    else broadcastRoom(room);
  } else if (room.state === 'playing') {
    const slot = room.slotOf[c.token];
    if (explicit || room.parked.has(c.token)) room.gone.add(c.token);
    if (slot !== undefined) room.pending.push([slot, { t: 'afk', on: true }]);
  }
  if (explicit) send(c, { t: 'left' });
}

function endGame(room) {
  clearInterval(room.timer);
  room.timer = null;
  if (room.ranked) {
    clearTimeout(room.reportTimer);
    for (const t of room.members) {
      const c = clients.get(t);
      if (c && c.room === room.code) c.room = null;
    }
    rooms.delete(room.code);
    return;
  }
  room.state = 'lobby';
  room.members = room.members.filter(t => {
    const c = clients.get(t);
    const keep = !room.gone.has(t) && c && c.ws && c.room === room.code;
    if (!keep) {
      delete room.names[t];
      delete room.looks[t];
      if (room.maps) delete room.maps[t];
      delete room.icons[t];
    }
    return keep;
  });
  if (!room.members.includes(room.host)) room.host = room.members[0] || null;
  room.log = [];
  room.pending = [];
  room.parked = new Set();
  room.created = Date.now();
  if (!room.members.length) closeRoom(room);
  else broadcastRoom(room);
}

function roomOfToken(token) {
  for (const room of rooms.values()) {
    if (!room.members.includes(token)) continue;
    if (room.state === 'lobby') return room;
    if (room.state === 'playing' && !room.gone.has(token)) return room;
  }
  return null;
}

function closeRoom(room) {
  clearTimeout(room.reportTimer);
  clearInterval(room.timer);
  room.timer = null;
  rooms.delete(room.code);
}

function tickRoom(room) {
  room.tick += 1;
  const acts = room.pending.splice(0).map(([slot, a]) => [room.tick, slot, a]);
  if (acts.length) room.log.push(...acts);
  const msg = JSON.stringify({ t: 'tk', n: room.tick, a: acts });
  let online = 0;
  let parked = 0;
  for (const t of room.members) {
    const c = clients.get(t);
    if (!c || !c.ws || c.room !== room.code) continue;
    if (room.parked.has(t)) {
      parked += 1;
      continue;
    }
    online += 1;
    send(c, msg);
  }
  const now = Date.now();
  if (online) room.lastOnline = now;
  if (!online && parked) endGame(room);
  else if (now - room.started > MAX_GAME_MS) endGame(room);
  else if (now - room.lastOnline > EMPTY_ROOM_MS) closeRoom(room);
}

function startGame(room) {
  const humans = room.members.slice(0, 8);
  room.seats = [];
  room.slotOf = {};
  humans.forEach((t, i) => {
    const cl = clients.get(t);
    room.seats.push({ name: room.names[t], look: room.looks[t] || '', map: (room.maps && room.maps[t]) || '', charm: !!(cl && cl.charm), human: true });
    room.slotOf[t] = i;
  });
  while (room.seats.length < 8) room.seats.push({ human: false });
  room.seed = crypto.randomInt(1, 0x7fffffff);
  room.state = 'playing';
  room.tick = 0;
  room.log = [];
  room.pending = [];
  room.gone = new Set();
  room.started = Date.now();
  room.lastOnline = Date.now();
  room.over = new Set();
  room.parked = new Set();
  for (const t of room.members) send(clients.get(t), startInfo(room, t));
  room.timer = setInterval(() => tickRoom(room), TICK_MS);
}

function queueView() {
  return { t: 'queue', n: rankQueue.length, size: RANK_SIZE };
}

function broadcastQueue() {
  const msg = queueView();
  for (const t of rankQueue) send(clients.get(t), Object.assign({ on: true }, msg));
}

function unqueue(c, silent) {
  const i = rankQueue.indexOf(c.token);
  if (i < 0) return;
  rankQueue.splice(i, 1);
  if (!silent) send(c, { t: 'queue', on: false, n: rankQueue.length, size: RANK_SIZE });
  broadcastQueue();
}

function enqueue(c) {
  if (!c.uid) return send(c, { t: 'error', msg: '랭크 게임은 로그인한 뒤에 할 수 있습니다' });
  for (let i = rankQueue.length - 1; i >= 0; i--) {
    const o = clients.get(rankQueue[i]);
    if (!o || !o.ws || o.uid === c.uid) rankQueue.splice(i, 1);
  }
  const room = c.room ? rooms.get(c.room) : null;
  if (room && room.state === 'playing' && !room.gone.has(c.token)) return send(c, { t: 'error', msg: '진행 중인 게임이 있습니다' });
  if (room) leaveRoom(c, false);
  rankQueue.push(c.token);
  broadcastQueue();
  if (rankQueue.length >= RANK_SIZE) startRanked(rankQueue.splice(0, RANK_SIZE));
}

function startRanked(tokens) {
  const code = newCode();
  const r = { code, ranked: true, host: null, members: [], names: {}, looks: {}, maps: {}, icons: {}, uids: {}, state: 'lobby', timer: null, created: Date.now() };
  for (const t of tokens) {
    const c = clients.get(t);
    if (!c) continue;
    r.members.push(t);
    r.names[t] = c.name;
    r.looks[t] = c.look;
    r.maps[t] = c.map || '';
    r.icons[t] = c.icon;
    r.uids[t] = c.uid;
    c.room = code;
  }
  rooms.set(code, r);
  startGame(r);
  broadcastQueue();
}

function validRanks(a) {
  if (!Array.isArray(a) || a.length !== 8) return false;
  const seen = new Set();
  for (const v of a) {
    if (!Number.isInteger(v) || v < 1 || v > 8 || seen.has(v)) return false;
    seen.add(v);
  }
  return true;
}

function reportRanked(room, c, ranks) {
  if (room.finished || !validRanks(ranks)) return;
  if (!room.reports) room.reports = new Map();
  room.reports.set(c.token, ranks.join(','));
  let online = 0;
  for (const t of room.members) {
    const o = clients.get(t);
    if (o && o.ws && o.room === room.code && !room.parked.has(t)) online += 1;
  }
  if (room.reports.size >= Math.max(1, online)) finishRanked(room);
  else if (!room.reportTimer) room.reportTimer = setTimeout(() => finishRanked(room), RANK_REPORT_MS);
}

async function finishRanked(room) {
  if (room.finished) return;
  room.finished = true;
  clearTimeout(room.reportTimer);
  const count = new Map();
  for (const k of room.reports.values()) count.set(k, (count.get(k) || 0) + 1);
  let best = null;
  for (const [k, n] of count) if (!best || n > best[1]) best = [k, n];
  const ranks = best ? best[0].split(',').map(Number) : null;
  const members = room.members.slice();
  const uids = Object.assign({}, room.uids);
  const slots = Object.assign({}, room.slotOf);
  endGame(room);
  if (!ranks) return;
  for (const t of members) {
    const uid = uids[t];
    const slot = slots[t];
    if (!uid || slot === undefined) continue;
    try {
      const res = await accounts.applyResult(uid, ranks[slot]);
      if (res) send(clients.get(t), Object.assign({ t: 'rankResult' }, res));
    } catch (e) {
      console.error(e);
    }
  }
}

function sendCatchup(c, room) {
  send(c, startInfo(room, c.token));
  send(c, { t: 'catchup', n: room.tick, a: room.log });
}

async function onHello(c, m) {
  c.uid = m.auth ? accounts.verify(m.auth) : null;
  c.name = cleanName(m.name);
  if (c.uid) {
    try {
      const row = await accounts.store.get(c.uid);
      if (row) c.name = row.name;
      else c.uid = null;
    } catch (e) {
      console.error(e);
    }
  }
  c.look = cleanLook(m.look);
  c.map = cleanLook(m.map);
  c.icon = cleanIcon(m.icon);
  c.charm = !!m.charm;
  const room = roomOfToken(c.token);
  send(c, { t: 'welcome', token: c.token, name: c.name, room: room ? room.code : null, account: !!c.uid, rankSize: RANK_SIZE, rankQueued: rankQueue.includes(c.token) });
  if (!room) return;
  c.room = room.code;
  room.names[c.token] = c.name;
  room.looks[c.token] = c.look;
  if (!room.maps) room.maps = {};
  room.maps[c.token] = c.map;
  room.icons[c.token] = c.icon;
  if (room.state === 'playing' && !room.parked.has(c.token)) {
    sendCatchup(c, room);
    const slot = room.slotOf[c.token];
    if (slot !== undefined) room.pending.push([slot, { t: 'afk', on: false }]);
    return;
  }
  broadcastRoom(room);
}

function onMessage(c, m) {
  if (m.t === 'hello') return onHello(c, m);
  if (!c.name) return;
  if (m.t === 'rankQueue') return enqueue(c);
  if (m.t === 'rankCancel') return unqueue(c, false);
  const room = c.room ? rooms.get(c.room) : null;
  if (m.t === 'create') {
    unqueue(c, true);
    if (room) leaveRoom(c, false);
    const code = newCode();
    const r = { code, host: c.token, members: [c.token], names: { [c.token]: c.name }, looks: { [c.token]: c.look }, maps: { [c.token]: c.map || '' }, icons: { [c.token]: c.icon }, state: 'lobby', timer: null, created: Date.now() };
    rooms.set(code, r);
    c.room = code;
    broadcastRoom(r);
    return;
  }
  if (m.t === 'join') {
    const code = String(m.code || '').toUpperCase().slice(0, 5);
    const r = rooms.get(code);
    if (!r) return send(c, { t: 'error', msg: '그런 방이 없습니다' });
    if (r.state !== 'lobby' || r.ranked) return send(c, { t: 'error', msg: '이미 게임이 시작된 방입니다' });
    if (r.members.length >= 8 && !r.members.includes(c.token)) return send(c, { t: 'error', msg: '방이 가득 찼습니다' });
    if (room && room !== r) leaveRoom(c, false);
    if (!r.members.includes(c.token)) r.members.push(c.token);
    r.names[c.token] = c.name;
    r.looks[c.token] = c.look;
    if (!r.maps) r.maps = {};
    r.maps[c.token] = c.map || '';
    r.icons[c.token] = c.icon;
    c.room = code;
    broadcastRoom(r);
    return;
  }
  if (m.t === 'leave') {
    leaveRoom(c, true);
    return;
  }
  if (!room) return;
  if (m.t === 'start') {
    if (room.state !== 'lobby' || room.host !== c.token || room.ranked) return;
    startGame(room);
    return;
  }
  if (m.t === 'act') {
    if (room.state !== 'playing') return;
    const slot = room.slotOf[c.token];
    if (slot === undefined || !m.a || typeof m.a !== 'object' || m.a.t === 'afk') return;
    const now = Date.now();
    if (now - c.rateStart > 1000) {
      c.rateStart = now;
      c.rateCount = 0;
    }
    c.rateCount += 1;
    if (c.rateCount > 25) return;
    if (JSON.stringify(m.a).length > 300) return;
    room.pending.push([slot, m.a]);
    return;
  }
  if (m.t === 'park') {
    if (room.state !== 'playing') return;
    room.parked.add(c.token);
    const slot = room.slotOf[c.token];
    if (slot !== undefined) room.pending.push([slot, { t: 'afk', on: true }]);
    return;
  }
  if (m.t === 'over') {
    if (room.state !== 'playing') return;
    room.over.add(c.token);
    if (room.ranked) reportRanked(room, c, m.ranks);
    else endGame(room);
  }
}

wss.on('connection', ws => {
  const c = { ws, token: null, uid: null, name: '', look: '', icon: '', room: null, rateStart: 0, rateCount: 0 };
  ws.on('message', data => {
    let m = null;
    try {
      m = JSON.parse(String(data));
    } catch (e) {
      return;
    }
    if (!m || typeof m.t !== 'string') return;
    if (!c.token) {
      if (m.t !== 'hello') return;
      const tok = typeof m.token === 'string' && /^[0-9a-f]{32}$/.test(m.token) ? m.token : crypto.randomBytes(16).toString('hex');
      const prev = clients.get(tok);
      if (prev && prev.ws && prev.ws !== ws) {
        prev.ws.removeAllListeners('close');
        try {
          prev.ws.close();
        } catch (e) {
          prev.ws = null;
        }
      }
      c.token = tok;
      c.room = prev ? prev.room : null;
      clients.set(tok, c);
    }
    try {
      const p = onMessage(c, m);
      if (p && p.catch) p.catch(e => console.error(e));
    } catch (e) {
      console.error(e);
    }
  });
  ws.on('close', () => {
    if (!c.token || clients.get(c.token) !== c) return;
    c.ws = null;
    unqueue(c, true);
    const room = c.room ? rooms.get(c.room) : null;
    if (!room) return;
    if (room.state === 'lobby') {
      broadcastRoom(room);
      setTimeout(() => {
        if (clients.get(c.token) !== c || c.ws) return;
        leaveRoom(c, false);
        c.room = null;
      }, LOBBY_GRACE_MS);
    } else if (room.state === 'playing') {
      const slot = room.slotOf[c.token];
      if (slot !== undefined) room.pending.push([slot, { t: 'afk', on: true }]);
    }
  });
});

setInterval(() => {
  for (const [tok, c] of clients) {
    if (c.ws) continue;
    const room = c.room ? rooms.get(c.room) : null;
    if (!room) clients.delete(tok);
  }
  for (const room of rooms.values()) {
    if (room.state === 'lobby' && Date.now() - room.created > 2 * 60 * 60 * 1000) closeRoom(room);
  }
}, 60000);

server.listen(PORT, () => {
  console.log('pokemon autobattler server on :' + PORT + ' tick ' + TICK_MS + 'ms · accounts ' + accounts.store.kind + ' · rank size ' + RANK_SIZE);
});
