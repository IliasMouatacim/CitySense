"""Create bounded, CC0 PBR derivatives from ambientCG sources (requires Pillow)."""
import argparse
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps, ImageDraw, ImageFilter

parser = argparse.ArgumentParser()
parser.add_argument('style_root', type=Path, help='OSM2World-default-style checkout')
parser.add_argument('floor_root', type=Path, help='Extracted ambientCG Concrete023 1K-JPG')
args = parser.parse_args()
out = Path(__file__).resolve().parents[1] / 'apps/web/public/materials'
root = args.style_root / 'textures/cc0textures'

def save(image, name):
    image.save(out / name, quality=88, optimize=True)

for material, name in [('Concrete034', 'campus-concrete'), ('Wood026', 'campus-timber')]:
    source = root / material
    color = Image.open(source / f'{material}_Color.jpg').convert('RGB')
    size = (1024, round(color.height / color.width * 1024))
    color = color.resize(size, Image.Resampling.LANCZOS)
    if material == 'Wood026':
        color = ImageOps.colorize(ImageOps.grayscale(color), '#403d34', '#ccc3ab')
    save(color, name + '-color.jpg')
    height = Image.open(source / f'{material}_Displacement.jpg').convert('L').resize(size, Image.Resampling.LANCZOS)
    save(height, name + '-height.jpg')
    # OSM2World stores roughness in the green channel of its ORM map.
    rough = Image.open(source / f'{material}_ORM.jpg').getchannel('G').resize(size, Image.Resampling.LANCZOS)
    save(rough, name + '-roughness.jpg')

# The courtyard photograph shows square slabs. Keep that layout while adding
# photographed aggregate, subtle slab variation and matching relief/roughness.
color = Image.open(args.floor_root / 'Concrete023_1K-JPG_Color.jpg').convert('RGB')
height = Image.open(args.floor_root / 'Concrete023_1K-JPG_Displacement.jpg').convert('L')
rough = Image.open(args.floor_root / 'Concrete023_1K-JPG_Roughness.jpg').convert('L')
floor_maps = [Image.new('RGB', (1024, 1024)), Image.new('L', (1024, 1024)), Image.new('L', (1024, 1024))]
for row in range(4):
    for col in range(4):
        index = row * 4 + col
        for source, dest in zip([color, height, rough], floor_maps):
            tile = source.crop((col * 256, row * 256, (col + 1) * 256, (row + 1) * 256))
            tile = tile.rotate((index % 4) * 90)
            if dest.mode == 'RGB':
                tile = ImageEnhance.Brightness(tile).enhance(.94 + (index * 7 % 9) * .012)
            dest.paste(tile, (col * 256, row * 256))
for dest, joint in zip(floor_maps, ['#64665b', 20, 240]):
    draw = ImageDraw.Draw(dest)
    for p in range(0, 1024, 256):
        draw.rectangle((p, 0, p + 2, 1023), fill=joint)
        draw.rectangle((0, p, 1023, p + 2), fill=joint)
for image, channel in zip(floor_maps, ['color', 'height', 'roughness']):
    save(image.filter(ImageFilter.GaussianBlur(.35)) if channel == 'height' else image,
         f'campus-paving-{channel}.jpg')
