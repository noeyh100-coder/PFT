const Sound = {
  vol: 0.6,
  muted: false,

  init() {
    try {
      const v = localStorage.getItem('ptft-vol');
      if (v !== null && isFinite(Number(v))) this.vol = Math.max(0, Math.min(1, Number(v)));
      this.muted = localStorage.getItem('ptft-mute') === '1';
    } catch (e) {
      this.vol = 0.6;
    }
  },

  save() {
    try {
      localStorage.setItem('ptft-vol', String(this.vol));
      localStorage.setItem('ptft-mute', this.muted ? '1' : '0');
    } catch (e) {
      return;
    }
  },

  play(src, gain) {
    if (this.muted || this.vol <= 0) return;
    try {
      const a = new Audio(src);
      a.volume = Math.max(0, Math.min(1, this.vol * (gain || 1)));
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {
      return;
    }
  },

  cry(en) {
    if (en) this.play('sound/cry/' + en + '.ogg', 0.55);
  }
};

const Bgm = {
  vol: 0.3,
  off: false,
  key: null,
  group: null,
  tracks: [],
  fadeSec: 1.2,
  armed: false,

  init() {
    try {
      const v = localStorage.getItem('ptft-bgm-vol');
      if (v !== null && isFinite(Number(v))) this.vol = Math.max(0, Math.min(1, Number(v)));
      this.off = localStorage.getItem('ptft-bgm-off') === '1';
    } catch (e) {
      this.vol = 0.3;
    }
    const retry = () => {
      for (const t of this.tracks) if (t.want > 0 && t.el.paused) this.start(t);
    };
    window.addEventListener('pointerdown', retry);
    window.addEventListener('keydown', retry);
    setInterval(() => this.tick(0.05), 50);
  },

  save() {
    try {
      localStorage.setItem('ptft-bgm-vol', String(this.vol));
      localStorage.setItem('ptft-bgm-off', this.off ? '1' : '0');
    } catch (e) {
      return;
    }
  },

  level() {
    return this.off || Sound.muted ? 0 : this.vol;
  },

  start(t) {
    try {
      const p = t.el.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {
      return;
    }
  },

  groups: {
    encounter: ['encounter'],
    planning: ['planning1', 'planning2', 'planning3', 'planning4', 'planning5', 'planning6'],
    carousel: ['carousel1', 'carousel2'],
    battle: ['battle']
  },
  last: {},

  play(group) {
    if (group === this.group) return;
    this.group = group;
    let key = null;
    if (group) {
      const list = this.groups[group] || [group];
      const pool = list.length > 1 ? list.filter(k => k !== this.last[group]) : list;
      key = pool[Math.floor(Math.random() * pool.length)];
      this.last[group] = key;
    }
    this.load(key);
  },

  load(key) {
    if (key === this.key) return;
    this.key = key;
    for (const t of this.tracks) t.want = 0;
    if (!key) return;
    let t = this.tracks.find(x => x.key === key);
    if (!t) {
      const el = new Audio('sound/bgm/' + key + '.mp3');
      el.loop = true;
      el.volume = 0;
      t = { key, el, g: 0, want: 1 };
      this.tracks.push(t);
    }
    t.want = 1;
    if (t.g <= 0.001) {
      try {
        t.el.currentTime = 0;
      } catch (e) {
        t.g = 0;
      }
    }
    this.start(t);
  },

  tick(dt) {
    const step = dt / this.fadeSec;
    const L = this.level();
    for (const t of this.tracks) {
      if (t.g < t.want) t.g = Math.min(t.want, t.g + step);
      else if (t.g > t.want) t.g = Math.max(t.want, t.g - step);
      const v = Math.max(0, Math.min(1, t.g * t.g * L));
      if (Math.abs(t.el.volume - v) > 0.001) t.el.volume = v;
      if (t.g <= 0 && t.want <= 0 && !t.el.paused) t.el.pause();
    }
  }
};

Sound.init();
Bgm.init();
