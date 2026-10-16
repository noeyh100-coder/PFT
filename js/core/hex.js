const BOARD_ROWS = 8;
const BOARD_COLS = 7;
const HOME_ROWS = [4, 5, 6, 7];

const Hex = {
  inBounds(r, c) {
    return r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS;
  },

  toCube(r, c) {
    const x = c - (r - (r & 1)) / 2;
    const z = r;
    return { x, y: -x - z, z };
  },

  dist(r1, c1, r2, c2) {
    const a = Hex.toCube(r1, c1);
    const b = Hex.toCube(r2, c2);
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
  },

  neighbors(r, c) {
    const odd = r & 1;
    const d = odd
      ? [[0, 1], [-1, 1], [-1, 0], [0, -1], [1, 0], [1, 1]]
      : [[0, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]];
    const out = [];
    for (const [dr, dc] of d) {
      const nr = r + dr;
      const nc = c + dc;
      if (Hex.inBounds(nr, nc)) out.push([nr, nc]);
    }
    return out;
  },

  upperNeighbors(r, c) {
    return Hex.neighbors(r, c).filter(([nr]) => nr === r - 1);
  },

  lowerNeighbors(r, c) {
    return Hex.neighbors(r, c).filter(([nr]) => nr === r + 1);
  },

  mirror(r, c) {
    return [BOARD_ROWS - 1 - r, BOARD_COLS - 1 - c];
  },

  isHome(r) {
    return r >= 4 && r < BOARD_ROWS;
  }
};
