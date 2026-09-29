"""Cut the pool illustration into the layers the animated hero draws (public/hero/).

    python3 -m venv .venv && .venv/bin/pip install numpy pillow opencv-python-headless
    .venv/bin/python scripts/split_hero.py

Outputs plate.webp (scene without the octopus), water.webp (water, transparent above
the waterline), octo.webp (octopus cutout, pupils painted out) and eyes.png (eye mask).
The coordinates in src/components/PoolScene.tsx are printed at the end; the hand-set
polygons below are tuned for Untitled707_20260925073040.png.
"""

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/Untitled707_20260925073040.png"
OUT = ROOT / "public/hero"
OUT.mkdir(exist_ok=True)

im = cv2.imread(str(SRC))
H, W = im.shape[:2]
hsv = cv2.cvtColor(cv2.GaussianBlur(im, (5, 5), 0), cv2.COLOR_BGR2HSV)
h, s, v = (hsv[:, :, i].astype(int) for i in range(3))


def poly_mask(points):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(points, np.int32)], 1)
    return m


# --- octopus mask: GrabCut seeded by a rough outline, coral skin and the white robe
inside = poly_mask([(720, 105), (1300, 105), (1310, 540), (1385, 900), (1375, 1140), (1372, 1514),
                    (1165, 1514), (1185, 1245), (855, 1245), (835, 1514), (655, 1514), (635, 1125),
                    (585, 1105), (585, 755), (700, 755), (715, 560)])
coral = ((h <= 8) | (h >= 170)) & (s > 120) & (v > 150)
white = (s < 40) & (v > 185)
bgcol = (((h >= 88) & (h <= 112) & (s > 70) & (v > 150)) | ((h >= 35) & (h <= 85) & (s > 60))
         | ((h >= 12) & (h <= 24) & (s > 80) & (v > 170)))
gc = np.full((H, W), cv2.GC_BGD, np.uint8)
gc[inside == 1] = cv2.GC_PR_FGD
gc[(inside == 1) & bgcol] = cv2.GC_PR_BGD
gc[cv2.erode(((inside == 1) & (coral | white)).astype(np.uint8), np.ones((5, 5), np.uint8)) == 1] = cv2.GC_FGD
bottle = poly_mask([(628, 768), (664, 770), (670, 838), (708, 880), (748, 1062), (702, 1098), (652, 1092),
                    (622, 962), (610, 860), (630, 835)])
gc[bottle == 1] = cv2.GC_PR_FGD
gc[cv2.erode(bottle, np.ones((15, 15), np.uint8)) == 1] = cv2.GC_FGD
gc[990:1115, 1175:1295] = cv2.GC_FGD  # the glass
cv2.grabCut(im, gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
mask = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)


def largest(m):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    return np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)


mask = largest(mask)
n, lab, st, _ = cv2.connectedComponentsWithStats(255 - mask)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] < 4000:
        mask[lab == i] = 255
# drop thin fence and wave lines stuck to the outline
mask = largest(cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))))

# --- background plate: fill the hole row by row (the scene is mostly horizontal bands)
hole = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) > 0
src = im.astype(np.float32)
clean = cv2.medianBlur(im, 31).astype(np.float32)  # water without wave lines
plate = src.copy()
for y in range(H):
    row = hole[y]
    if not row.any():
        continue
    S = clean if y >= 905 else src
    for x0, x1 in np.where(np.diff(np.concatenate([[0], row.astype(np.int8), [0]])) != 0)[0].reshape(-1, 2):
        L = S[y, max(0, x0 - 8):max(1, x0 - 2)].mean(axis=0) if x0 > 2 else S[y, x1 + 2:x1 + 8].mean(axis=0)
        R = S[y, x1 + 2:x1 + 8].mean(axis=0) if x1 + 8 < W else L
        t = np.linspace(0, 1, x1 - x0)[:, None]
        plate[y, x0:x1] = L * (1 - t) + R * t
blur = cv2.GaussianBlur(plate, (0, 0), sigmaX=1, sigmaY=2.5)
plate[hole] = blur[hole] + np.random.normal(0, 6, (hole.sum(), 1))
plate = np.clip(plate, 0, 255).astype(np.uint8)
Image.fromarray(cv2.cvtColor(plate, cv2.COLOR_BGR2RGB)).save(OUT / "plate.webp", quality=78, method=6)

# --- water: everything below the waterline
WATER_Y = 800
phsv = cv2.cvtColor(cv2.GaussianBlur(plate, (5, 5), 0), cv2.COLOR_BGR2HSV)
blue = (phsv[:, :, 0] >= 86) & (phsv[:, :, 0] <= 112) & (phsv[:, :, 1] > 60) & (phsv[:, :, 2] > 120)
wl = np.array([840 + (np.argmax(blue[840:960, x]) if blue[840:960, x].any() else 60) for x in range(W)])
wl = np.convolve(np.pad(wl, 7, mode="edge"), np.ones(15) / 15, mode="valid").astype(int)
alpha = np.zeros((H - WATER_Y, W), np.uint8)
for x in range(W):
    alpha[max(0, wl[x] - WATER_Y - 9):, x] = 255
water = cv2.cvtColor(plate[WATER_Y:], cv2.COLOR_BGR2RGBA)
water[:, :, 3] = cv2.GaussianBlur(alpha, (3, 3), 0)
Image.fromarray(water).save(OUT / "water.webp", quality=78, method=6)

# --- eyes: find the whites, paint the pupils out, keep a mask to redraw them live
rhsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
eyew = ((rhsv[:, :, 1] < 40) & (rhsv[:, :, 2] > 200)).astype(np.uint8)
eyew[:250] = 0; eyew[400:] = 0; eyew[:, :760] = 0; eyew[:, 1200:] = 0
eyew = cv2.morphologyEx(eyew, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(eyew)
eyes = np.isin(lab, [i for i in range(1, n) if st[i, 4] > 500]).astype(np.uint8)
eye_white = np.median(im[eyes == 1], axis=0)
dark = (rhsv[:, :, 2] < 90).astype(np.uint8)
pupils = np.zeros_like(dark)
for x0, y0, x1, y1 in [(868, 302, 904, 340), (1068, 294, 1106, 334)]:
    pupils[y0:y1, x0:x1] = dark[y0:y1, x0:x1]
lids = [(790, 930, np.where(eyes[:, 796:921].any(axis=1))[0].min()),
        (970, 1145, np.where(eyes[:, 977:1137].any(axis=1))[0].min())]
for x0, x1, top in lids:
    pupils[:top + 2, x0:x1] = 0
pupils = cv2.dilate(pupils, np.ones((5, 5), np.uint8))
for x0, x1, top in lids:
    pupils[:top + 2, x0:x1] = 0
fg = im.copy()
fg[pupils == 1] = eye_white
eyemask = cv2.morphologyEx(((eyes | pupils) > 0).astype(np.uint8) * 255, cv2.MORPH_CLOSE,
                           cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
for x0, x1, top in lids:
    eyemask[:top, x0:x1] = 0

ys, xs = np.where(mask > 0)
bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
octo = cv2.cvtColor(fg, cv2.COLOR_BGR2RGBA)
octo[:, :, 3] = cv2.GaussianBlur(mask, (3, 3), 0)
Image.fromarray(octo[by0:by1, bx0:bx1]).save(OUT / "octo.webp", quality=86, method=6)

ey, ex = np.where(eyemask > 0)
ex0, ey0, ex1, ey1 = ex.min() - 2, ey.min() - 2, ex.max() + 3, ey.max() + 3
em = np.zeros((ey1 - ey0, ex1 - ex0, 4), np.uint8)
em[:, :, :3] = 255
em[:, :, 3] = eyemask[ey0:ey1, ex0:ex1]
Image.fromarray(em).save(OUT / "eyes.png", optimize=True)

print(json.dumps({
    "WATER_Y": WATER_Y,
    "OCTO": [int(bx0), int(by0), int(bx1 - bx0), int(by1 - by0)],
    "EYES": [int(ex0), int(ey0), int(ex1 - ex0), int(ey1 - ey0)],
}))
