importScripts(
  '../data/units.js', '../data/regional.js', '../data/pp.js', '../data/config.js', '../data/traits.js', '../data/items.js', '../data/encounters.js',
  '../data/augments.js', '../data/skilltext.js', '../data/traiticons.js', '../core/rng.js', '../core/hex.js', '../game/units.js', '../game/player.js',
  '../game/pool.js', '../game/synergy.js', '../game/combat.js', '../game/skills.js', '../game/skills2.js', '../game/itemfx.js', '../game/esper.js',
  '../game/augfx.js', '../game/gimmick.js', '../game/unlocks.js', '../game/bot.js', '../game/game.js', '../game/augments.js', '../game/botaug.js'
);

function snapshot(g, p) {
  const units = p.boardUnits().filter(u => !u.overflow).map(u => ({ id: u.unitId, star: u.star, items: (u.items || []).filter(i => {
    const d = itemDef(i);
    return d && d.kind === 'completed';
  }) }));
  const traits = computeSynergies(p).filter(s => s.active && s.kind !== 'unique').map(s => s.id + ':' + s.tier);
  return { place: 0, augs: p.augs.map(a => a.id), units, traits, level: p.level };
}

function playOne(seed) {
  const g = new Game({ seed });
  g.start();
  const rec = {};
  let n = 0;
  while (g.phase !== 'over' && n++ < 250) {
    if (g.phase === 'carousel') {
      g.carouselRunBots();
      g.phase = 'result';
    } else {
      g.startCombat();
      for (const p of g.players) if (p.alive && p.boardUnits().length) rec[p.id] = snapshot(g, p);
      g.finishCombat();
    }
    if (g.phase === 'over') break;
    g.nextRound();
  }
  for (const p of g.players) {
    if (!rec[p.id]) rec[p.id] = snapshot(g, p);
    rec[p.id].place = p.placement || (p.alive ? 1 : 8);
  }
  return { seed, rounds: n, label: g.roundLabel(), players: Object.values(rec) };
}

let stop = false;
onmessage = e => {
  const m = e.data;
  if (m.t === 'stop') {
    stop = true;
    return;
  }
  if (m.t !== 'run') return;
  stop = false;
  const out = [];
  for (const seed of m.seeds) {
    if (stop) break;
    try {
      out.push(playOne(seed));
    } catch (err) {
      postMessage({ t: 'err', seed, msg: String((err && err.stack) || err).slice(0, 400) });
    }
    if (out.length >= 2) {
      postMessage({ t: 'games', games: out.splice(0) });
    }
  }
  if (out.length) postMessage({ t: 'games', games: out });
  postMessage({ t: 'done' });
};
