const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

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
  return { t: 'start', code: room.code, seed: room.seed, seats: room.seats, slot: room.slotOf[token] };
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
    room.seats.push({ name: room.names[t], look: room.looks[t] || '', map: (room.maps && room.maps[t]) || '', human: true });
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

function sendCatchup(c, room) {
  send(c, startInfo(room, c.token));
  send(c, { t: 'catchup', n: room.tick, a: room.log });
}

function onHello(c, m) {
  c.name = cleanName(m.name);
  c.look = cleanLook(m.look);
  c.map = cleanLook(m.map);
  c.icon = cleanIcon(m.icon);
  const room = roomOfToken(c.token);
  send(c, { t: 'welcome', token: c.token, name: c.name, room: room ? room.code : null });
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
  const room = c.room ? rooms.get(c.room) : null;
  if (m.t === 'create') {
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
    if (r.state !== 'lobby') return send(c, { t: 'error', msg: '이미 게임이 시작된 방입니다' });
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
    if (room.state !== 'lobby' || room.host !== c.token) return;
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
    endGame(room);
  }
}

wss.on('connection', ws => {
  const c = { ws, token: null, name: '', look: '', icon: '', room: null, rateStart: 0, rateCount: 0 };
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
      onMessage(c, m);
    } catch (e) {
      console.error(e);
    }
  });
  ws.on('close', () => {
    if (!c.token || clients.get(c.token) !== c) return;
    c.ws = null;
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
  console.log('pokemon autobattler server on :' + PORT + ' tick ' + TICK_MS + 'ms');
});
