class Rng {
  constructor(seed) {
    this.state = (seed >>> 0) || 1;
  }

  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(n) {
    return Math.floor(this.next() * n);
  }

  range(min, max) {
    return min + this.int(max - min + 1);
  }

  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    return arr[this.int(arr.length)];
  }

  weighted(items, weightOf) {
    let total = 0;
    for (const it of items) total += Math.max(0, weightOf(it));
    if (total <= 0) return null;
    let roll = this.next() * total;
    let last = null;
    for (const it of items) {
      const w = Math.max(0, weightOf(it));
      if (w <= 0) continue;
      last = it;
      if (roll < w) return it;
      roll -= w;
    }
    return last;
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  seedFor() {
    return Math.floor(this.next() * 4294967295) + 1;
  }
}
