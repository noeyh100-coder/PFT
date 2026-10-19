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

Sound.init();
