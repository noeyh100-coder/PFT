class Pool {
  constructor() {
    this.counts = {};
    this.max = {};
    for (const u of UNIT_DATA) {
      const n = CONFIG.poolSize[u.cost];
      this.counts[u.id] = n;
      this.max[u.id] = n;
    }
  }

  remaining(id) {
    return this.counts[id] || 0;
  }

  take(id, n) {
    const k = n || 1;
    if (this.remaining(id) < k) return false;
    this.counts[id] -= k;
    return true;
  }

  give(id, n) {
    if (!(id in this.counts)) return;
    this.counts[id] = Math.min(this.max[id], this.counts[id] + (n || 1));
  }
}
