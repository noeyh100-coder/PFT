const Assets = {
  status: {},
  listeners: [],

  onLoad(fn) {
    this.listeners.push(fn);
  },

  check(url) {
    const st = this.status[url];
    if (st) return st;
    this.status[url] = 'loading';
    const img = new Image();
    img.onload = () => {
      this.status[url] = 'ok';
      for (const fn of this.listeners) fn(url);
    };
    img.onerror = () => {
      this.status[url] = 'missing';
    };
    img.src = url;
    return 'loading';
  },

  ready(url) {
    return this.check(url) === 'ok';
  },

  cardUrl(form) {
    return 'img/card/pokemon/' + form.en + '.jpg';
  },

  skillUrl(form) {
    return 'img/card/skill/' + form.en + '.jpg';
  },

  playerUrl(name) {
    return 'img/dot/player/Strategist-' + name + '.png';
  },

  leaderUrl(id) {
    return 'img/dot/leader/' + id + '.png';
  },

  setCardArt(el, form, size) {
    const url = this.cardUrl(form);
    if (this.ready(url)) {
      el.style.backgroundImage = 'url("' + url + '")';
      el.classList.add('has-art');
      return;
    }
    const px = size || 90;
    const spr = Sprites.portrait(form, px, { fill: 0.85, max: 3, animate: true, bottom: 0.92 });
    if (!spr) return;
    const box = document.createElement('div');
    box.className = 'card-spr';
    box.style.width = px + 'px';
    box.style.height = px + 'px';
    box.appendChild(spr);
    el.appendChild(box);
    el.classList.add('has-spr');
  }
};

const ICON_PAL = {
  W: '#eceaf5', Y: '#f6c945', O: '#e8892f', B: '#5b8fd9', K: '#1b1726', R: '#e0414b', G: '#59d97a',
  M: '#8e62d1', P: '#6aa8d8', N: '#7a5230', D: '#3a3550', L: '#9a9cb8'
};

const ICON_BITMAPS = {
  sword: ['..........WW', '.........WWW', '........WWW.', '.......WWW..', '......WWW...', '.Y...WWW....', '..Y.WWW.....', '...YWW......', '...NY.......', '..NNNY......', '.NNN..Y.....', 'NNN.........'],
  ball: ['....KKKK....', '..KKRRRRKK..', '.KRRRRRRRRK.', '.KRRRRRRRRK.', 'KRRRRKKRRRRK', 'KKKKKWWKKKKK', 'KWWWWKKWWWWK', '.KWWWWWWWWK.', '.KWWWWWWWWK.', '..KKWWWWKK..', '....KKKK....', '............'],
  sushi: ['............', '............', '...OOOOOO...', '..OOWOOWOO..', '..WWWWWWWW..', '..WWWWWWWW..', '..KKKKKKKK..', '.PPPPPPPPPP.', 'PPPPPPPPPPPP', '.PPPPPPPPPP.', '............', '............'],
  encounter: ['...MMMMMM...', '..MMMWWMMM..', '.MMMWMMWMMM.', '.MMMMMMWMMM.', '.MMMMMWMMMM.', '.MMMMWMMMMM.', '.MMMMWMMMMM.', '.MMMMMMMMMM.', '.MMMMWMMMMM.', '..MMMMMMMM..', '...MMMMMM...', '............'],
  check: ['............', '..........G.', '.........GG.', '........GG..', '.......GG...', '.G....GG....', '.GG..GG.....', '..GGGG......', '...GG.......', '............', '............', '............'],
  speed: ['............', '.W....W.....', '.WW...WW....', '..WW...WW...', '...WW...WW..', '....WW...WW.', '...WW...WW..', '..WW...WW...', '.WW...WW....', '.W....W.....', '............', '............'],
  gear: ['.....LL.....', '..L.LLLL.L..', '..LLLLLLLL..', '...LL..LL...', '.LLL....LLL.', 'LLL......LLL', 'LLL......LLL', '.LLL....LLL.', '...LL..LL...', '..LLLLLLLL..', '..L.LLLL.L..', '.....LL.....'],
  lock: ['....KKKK....', '...KLLLLK...', '...KL..LK...', '...KL..LK...', '..YYYYYYYY..', '..YYYYYYYY..', '..YYYKKYYY..', '..YYYKKYYY..', '..YYYYYYYY..', '..YYYYYYYY..', '............', '............'],
  unlock: ['....KKKK....', '...KLLLLK...', '...KL..LK...', '...KL.......', '..YYYYYYYY..', '..YYYYYYYY..', '..YYYKKYYY..', '..YYYKKYYY..', '..YYYYYYYY..', '..YYYYYYYY..', '............', '............'],
  refresh: ['....WWWW....', '..WW....WW.W', '.W........WW', '.W.......WWW', 'W...........', 'W...........', '...........W', '...........W', 'WWW.......W.', 'WW........W.', 'W.WW....WW..', '....WWWW....'],
  xpup: ['.....WW.....', '....WWWW....', '...WWWWWW...', '..WWW..WWW..', '.WWW....WWW.', '.....WW.....', '....WWWW....', '...WWWWWW...', '..WWW..WWW..', '.WWW....WWW.', '............', '............'],
  coin: ['...YYYYYY...', '..YYYYYYYY..', '.YYWYYYYYYY.', '.YYWYYYYYYY.', '.YYWYYYYYYY.', '.YYYYYYYYYY.', '.YYYYYYYYYY.', '.YYYYYYYYYO.', '.YYYYYYYYYO.', '..YYYYYYOO..', '...OOOOOO...', '............'],
  players: ['............', '...WW...WW..', '..WWWW.WWWW.', '..WWWW.WWWW.', '...WW...WW..', '............', '.WWWWW.WWWW.', 'WWWWWWWWWWWW', 'WWWWWWWWWWWW', 'WWWWWWWWWWWW', '............', '............'],
  chart: ['............', '.......OO...', '.......OO...', '...OO..OO...', '...OO..OO.OO', 'OO.OO..OO.OO', 'OO.OO..OO.OO', 'OO.OO..OO.OO', 'OO.OO..OO.OO', 'WWWWWWWWWWWW', '............', '............'],
  shield: ['.BBBBBBBBBB.', '.BWWBBBBBBB.', '.BWBBBBBBBB.', '.BBBBBBBBBB.', '.BBBBBBBBBB.', '.BBBBBBBBBB.', '..BBBBBBBB..', '..BBBBBBBB..', '...BBBBBB...', '....BBBB....', '.....BB.....', '............'],
  heart: ['............', '.RRR...RRR..', 'RRWRR.RRRRR.', 'RWRRRRRRRRR.', 'RRRRRRRRRRR.', '.RRRRRRRRR..', '..RRRRRRR...', '...RRRRR....', '....RRR.....', '.....R......', '............', '............'],
  target: ['....RRRR....', '..RR....RR..', '.R...RR...R.', '.R..R..R..R.', 'R..R.WW.R..R', 'R..R.WW.R..R', '.R..R..R..R.', '.R...RR...R.', '..RR....RR..', '....RRRR....', '............', '............'],
  arrow: ['..........W.', '.........WW.', '........WWW.', '...Y...WW...', '....Y.WW....', '.....WW.....', '....WWY.....', '...WW..Y....', '..WW....Y...', '.WW.........', 'WW..........', '............'],
  flame: ['.....R......', '....RR......', '....RRR.....', '...RRORR....', '...RROORR...', '..RROOYORR..', '..ROOYYOOR..', '..ROYYYYOR..', '..ROYYYYOR..', '...ROYYOR...', '....RRRR....', '............'],
  drop: ['.....B......', '.....B......', '....BBB.....', '....BBB.....', '...BBBBB....', '..BBWBBBB...', '..BWBBBBB...', '..BBBBBBB...', '...BBBBB....', '....BBB.....', '............', '............'],
  basic: ['....OOOO....', '...OOOOOO...', '..OOWOWOWO..', '..OOOOOOOO..', '..OOOOOOOO..', '..NOOOOOON..', '...NOOOOON..', '....OOOOO...', '....OOOOO...', '....NNNNN...', '............', '............'],
  pa: ['....OOOO....', '...OOOOOO...', '..OOOOOOOO..', '..OOWNOOO...', '...OONNO....', '.....NN.....', '....NN......', '...NN.......', '..NN........', '.NN.........', 'NN..........', '............'],
  sa: ['.......M....', '......MM....', '.....MMM....', '....MMMMM...', '...MMWMMM...', '...MMWWMM...', '..MMMWWMMM..', '..MMWWWWMM..', '...MMWWMM...', '....MMMM....', '............', '............'],
  armor: ['.YYYYYYYYYY.', '.YNNNNNNNNY.', '.YNYYYYYYNY.', '.YNYYYYYYNY.', '.YNYYYYYYNY.', '..YNYYYYNY..', '..YNYYYYNY..', '...YNYYNY...', '....YNNY....', '.....YY.....', '............', '............'],
  mr: ['....BBBB....', '..BBPPPPBB..', '.BPPWWPPPPB.', '.BPWWPPPPPB.', 'BPPWPPPPPPPB', 'BPPPPPPPPPPB', 'BPPPPPPPPPPB', '.BPPPPPPPPB.', '.BPPPPPPPPB.', '..BBPPPPBB..', '....BBBB....', '............'],
  as: ['............', '.Y.....Y....', '..Y.....Y...', '...Y.....Y..', '....Y.....Y.', '.....Y.....Y', '....Y.....Y.', '...Y.....Y..', '..Y.....Y...', '.Y.....Y....', '............', '............'],
  crit: ['R...........', '.R..........', '..R.........', '...R........', '....R...RR..', '.....R.RRR..', '......RRRR..', '.....RRRRR..', '....RRRRRR..', '............', '............', '............'],
  vamp: ['............', '.RRRRRRRRRR.', '.RWRRRRRRWR.', '.RWWRRRRWWR.', '..WWR..RWW..', '..WW....WW..', '...W....W...', '...W....W...', '............', '............', '............', '............'],
  home: ['.....WW.....', '....WWWW....', '...WWWWWW...', '..WWWWWWWW..', '.WWWWWWWWWW.', 'WWWWWWWWWWWW', '.WWWWWWWWWW.', '.WWWNNNWWWW.', '.WWWNNNWWWW.', '.WWWNNNWWWW.', '.WWWNNNWWWW.', '............'],
  info: ['....WWWW....', '..WWWWWWWW..', '.WWWWKKWWWW.', '.WWWWKKWWWW.', 'WWWWWWWWWWWW', 'WWWWKKKWWWWW', 'WWWWWKKWWWWW', 'WWWWWKKWWWWW', '.WWWWKKWWWW.', '.WWWKKKKWWW.', '..WWWWWWWW..', '....WWWW....'],
  role: ['....WWWW....', '...WWWWWW...', '...WWWWWW...', '....WWWW....', '............', '..WWWWWWWW..', '.WWWWWWWWWW.', '.WWWWWWWWWW.', '.WWWWWWWWWW.', '............', '............', '............']
};

function iconSvg(name, size) {
  const rows = ICON_BITMAPS[name];
  const px = size || 12;
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < 12) {
      const ch = row[x] || '.';
      if (ch === '.') {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < 12 && row[x + w] === ch) w++;
      rects += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="1" fill="' + ICON_PAL[ch] + '"/>';
      x += w;
    }
  });
  return '<svg class="px-icon" width="' + px + '" height="' + px + '" viewBox="0 0 12 12" shape-rendering="crispEdges">' + rects + '</svg>';
}
