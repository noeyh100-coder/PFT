import random, math, sys
from PIL import Image

W, H = 320, 180
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
rnd = random.Random(7)
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def grad(img, y0, y1, cols, x0=0, x1=W):
    px = img.load()
    n = len(cols) - 1
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0 - 1) * n
        for x in range(x0, x1):
            k = min(n - 1, int(t))
            f = t - k
            c = cols[k + 1] if f * 16 > BAYER[y % 4][x % 4] + 0.5 else cols[k]
            px[x, y] = c


def ridge(seed, base, amp, freq, octv=3):
    r = random.Random(seed)
    ph = [r.random() * 10 for _ in range(octv)]
    out = []
    for x in range(W):
        v = 0
        for o in range(octv):
            v += math.sin(x * freq * (2 ** o) + ph[o]) * amp / (1.8 ** o)
        out.append(int(base + v))
    return out


img = Image.new('RGBA', (W, H))
px = img.load()
grad(img, 0, 96, [hexc('#58b0f0'), hexc('#78c4f8'), hexc('#a0d8f8'), hexc('#cdeefa'), hexc('#f2f8e8')])

for x in range(W):
    pass
far = ridge(3, 70, 9, 0.021)
for x in range(W):
    for y in range(far[x], 100):
        if 0 <= y < H:
            snow = y < far[x] + 3 and far[x] < 66
            px[x, y] = hexc('#e8f0f8') if snow else (hexc('#8aa8d0') if (x + y) % 7 else hexc('#7e9cc6'))
    if far[x] < 99:
        px[x, far[x]] = hexc('#a8c0e0') if far[x] >= 66 else hexc('#ffffff')
mid = ridge(11, 86, 6, 0.033)
for x in range(W):
    for y in range(mid[x], 104):
        px[x, y] = hexc('#68a868') if y > mid[x] + 1 else hexc('#88c078')

grad(img, 104, H, [hexc('#90d060'), hexc('#80c458'), hexc('#70b850'), hexc('#62aa48')])

trees = []
x = -6
while x < W + 8:
    trees.append((x, 100 + rnd.randint(-2, 3), rnd.randint(6, 9)))
    x += rnd.randint(7, 11)
for tx, ty, r in sorted(trees, key=lambda t: t[1]):
    for yy in range(ty - r * 2, ty + 3):
        for xx in range(tx - r, tx + r + 1):
            if not (0 <= xx < W and 0 <= yy < H):
                continue
            dx = (xx - tx) / r
            dy = (yy - (ty - r)) / (r * 1.25)
            d = dx * dx + dy * dy
            if d <= 1:
                light = dx < -0.2 and dy < 0.1
                dark = dx > 0.45 or dy > 0.6
                c = '#54a050' if light else ('#2e7238' if dark else '#3e8a44')
                if d > 0.86:
                    c = '#245c2e'
                px[xx, yy] = hexc(c)
    for yy in range(ty + 1, ty + 6):
        for xx in (tx, tx + 1):
            if 0 <= xx < W and yy < H:
                px[xx, yy] = hexc('#6a4a2a')
for x in range(W):
    for y in range(104, 108):
        if (x * 3 + y) % 5 == 0:
            px[x, y] = hexc('#5a9c44')

pond = (58, 128, 34, 9)
cx, cy, rx, ry = pond
for y in range(cy - ry - 2, cy + ry + 3):
    for x in range(cx - rx - 3, cx + rx + 4):
        d = ((x - cx) / (rx + 2.5)) ** 2 + ((y - cy) / (ry + 2)) ** 2
        if d <= 1:
            px[x, y] = hexc('#c8b070') if d > 0.78 else px[x, y]
for y in range(cy - ry, cy + ry + 1):
    for x in range(cx - rx, cx + rx + 1):
        d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
        if d <= 1:
            c = '#4890e0' if d > 0.7 else '#60a8f0'
            if (y - cy) < -ry * 0.4 and d > 0.5:
                c = '#3878c8'
            px[x, y] = hexc(c)
for (sx, sy, l) in [(48, 125, 6), (64, 129, 4), (55, 132, 5), (70, 126, 3)]:
    for i in range(l):
        px[sx + i, sy] = hexc('#d8f0ff')

path = []
for y in range(108, H):
    t = (y - 108) / (H - 108)
    xc = 176 + math.sin(t * 2.6 + 0.4) * 22 - t * 6
    w = 3 + t * 22
    path.append((y, xc, w))
for y, xc, w in path:
    for x in range(int(xc - w - 2), int(xc + w + 3)):
        if 0 <= x < W:
            e = abs(x - xc) - w
            if e <= 0:
                c = '#e0c488' if ((x + y * 3) % 11) else '#ccac70'
                if e > -1.5:
                    c = '#c8a468'
                px[x, y] = hexc(c)
            elif e < 2 and (x + y) % 2 == 0:
                px[x, y] = hexc('#a8b860')

def tall_grass(x0, y0, cols, rows):
    for j in range(rows):
        for i in range(cols):
            bx = x0 + i * 8 + (4 if j % 2 else 0)
            by = y0 + j * 6
            for k in range(6):
                for m in range(-k // 2, k // 2 + 1):
                    for off in (0, 4):
                        xx, yy = bx + off + m, by + k - 6
                        if 0 <= xx < W and 0 <= yy < H:
                            px[xx, yy] = hexc('#2f8a3a' if abs(m) == k // 2 else ('#58b848' if m < 0 else '#3e9c40'))

tall_grass(2, 154, 9, 5)
tall_grass(246, 150, 10, 6)
tall_grass(108, 116, 4, 2)
tall_grass(250, 114, 5, 2)

for _ in range(260):
    x, y = rnd.randrange(W), rnd.randrange(110, H)
    r, g, b, a = px[x, y]
    if g > 150 and r < 170 and b < g:
        px[x, y] = hexc('#5ea040')
        if x + 1 < W:
            px[x + 1, y - 1 if y > 0 else y] = hexc('#5ea040')
for _ in range(90):
    x, y = rnd.randrange(W), rnd.randrange(112, H)
    r, g, b, a = px[x, y]
    if g > 150 and r < 170 and b < g:
        c = rnd.choice(['#ffffff', '#f8e060', '#f8a0c0', '#f8f0f0'])
        px[x, y] = hexc(c)
        if rnd.random() < 0.4 and y + 1 < H:
            px[x, y + 1] = hexc('#3e8a30')

for fx in range(206, 244, 6):
    for yy in range(118, 126):
        px[fx, yy] = hexc('#8a5a30')
        px[fx + 1, yy] = hexc('#a8703c')
for yy in (119, 123):
    for xx in range(204, 246):
        px[xx, yy] = hexc('#b07a44') if yy == 119 else hexc('#8a5a30')
for xx in range(196, 203):
    for yy in range(110, 116):
        px[xx, yy] = hexc('#c08a50') if 0 < xx - 196 < 6 and 0 < yy - 110 < 5 else hexc('#7a4c26')
for yy in range(116, 124):
    px[199, yy] = hexc('#7a4c26')

img.save(OUT + '/field.png')

cl = Image.new('RGBA', (640, 64), (0, 0, 0, 0))
cp = cl.load()
def cloud(x0, y0, s):
    blobs = [(0, 6, 7), (8, 2, 9), (18, 4, 8), (26, 7, 6), (-8, 9, 5), (34, 9, 5)]
    for bx, by, r in blobs:
        r = int(r * s)
        for y in range(-r, r + 1):
            for x in range(-r, r + 1):
                if x * x + y * y <= r * r:
                    xx, yy = (x0 + int(bx * s) + x) % 640, y0 + int(by * s) + y
                    if 0 <= yy < 64:
                        shade = y > r * 0.35
                        cp[xx, yy] = (226, 238, 250, 255) if shade else (255, 255, 255, 255)
    for x in range(int(-10 * s), int(40 * s)):
        yy = y0 + int(13 * s)
        if 0 <= yy < 64:
            xx = (x0 + x) % 640
            if cp[xx, yy - 1][3]:
                cp[xx, yy] = (200, 222, 244, 255)
for (x, y, s) in [(20, 8, 1.0), (150, 22, 0.7), (250, 4, 1.25), (400, 18, 0.85), (520, 6, 1.1)]:
    cloud(x, y, s)
cl.save(OUT + '/clouds.png')

logo_ball = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
print('ok')
