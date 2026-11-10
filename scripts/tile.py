import sys
from PIL import Image
src, prefix = sys.argv[1], sys.argv[2]
tile = int(sys.argv[3]) if len(sys.argv) > 3 else 1700
im = Image.open(src)
w, h = im.size
n = 0
for a in range(0, h, tile):
    im.crop((0, a, w, min(a + tile, h))).save(f'/tmp/{prefix}{n}.png'); n += 1
print(w, h, n)
