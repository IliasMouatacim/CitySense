"""Generate repeatable, tileable grass and sand textures for the walking map."""
import random
from pathlib import Path
from PIL import Image

destination = Path(__file__).resolve().parents[1] / 'apps/web/public/materials'
for name, base in [('grass', (118, 137, 82)), ('sand', (206, 187, 145))]:
    rng = random.Random(name)
    size = 256
    image = Image.new('RGB', (size, size))
    pixels = image.load()
    grid = [[rng.uniform(-16, 16) for _ in range(8)] for _ in range(8)]
    for y in range(size):
        for x in range(size):
            i, u = divmod(x, 32)
            j, v = divmod(y, 32)
            u, v = u / 32, v / 32
            broad = sum(grid[(j + b) % 8][(i + a) % 8] * wx * wy
                        for a, wx in enumerate([1-u, u]) for b, wy in enumerate([1-v, v]))
            tone = broad + rng.gauss(0, 8)
            pixels[x, y] = tuple(round(c + tone) for c in base)
    if name == 'grass':
        for _ in range(16000):
            x, y = rng.randrange(size), rng.randrange(size)
            shade = rng.randrange(-28, 29)
            drift = rng.choice([-1, 0, 1])
            for n in range(rng.randrange(2, 5)):
                pixels[(x + drift*n//2) % size, (y+n) % size] = tuple(c+shade+n for c in base)
    image.save(destination / f'campus-{name}.jpg', quality=90)
