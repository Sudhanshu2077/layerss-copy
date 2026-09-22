"""Generate WebP variants for Layerss public assets (idempotent).
- Photos (jpg/jpeg): <name>.webp same-size q82 + -480.webp max-width 480 q80 (for cards/carousel).
- Icons (png 512): <name>.webp same-size q90 + -128.webp 128px q85 (used in UI at ~38px).
- Preserves aspect, never upscales, keeps originals untouched.
"""
from PIL import Image
import pathlib

root = pathlib.Path('frontend/public')
made = []
saved_bytes = 0
orig_bytes = 0

def save_webp(im, dest, quality, method=6):
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Preserve alpha for icons; photos convert to RGB
    if im.mode in ('RGBA', 'LA'):
        pass
    elif im.mode != 'RGB':
        im = im.convert('RGB')
    im.save(dest, 'WEBP', quality=quality, method=method)
    return dest.stat().st_size

for f in sorted(root.rglob('*')):
    if not f.is_file():
        continue
    suf = f.suffix.lower()
    if suf not in ('.jpg', '.jpeg', '.png'):
        continue
    if f.suffix == '.webp':
        continue
    with Image.open(f) as im:
        w, h = im.size
        orig_bytes += f.stat().st_size
        # Full-size webp alongside
        full = f.with_suffix('.webp')
        # Only regenerate if missing or source newer
        if (not full.exists()) or (f.stat().st_mtime > full.stat().st_mtime):
            img = im.copy()
            sz = save_webp(img, full, 90 if suf == '.png' else 82)
            saved_bytes += sz
            made.append(f"{full.as_posix()} {sz}b")
        # Small variant
        if 'icons' in f.parts:
            small = f.with_name(f.stem + '-128.webp')
            if (not small.exists()) or (f.stat().st_mtime > small.stat().st_mtime):
                img = im.copy()
                img.thumbnail((128, 128), Image.LANCZOS)
                sz = save_webp(img, small, 85)
                saved_bytes += sz
                made.append(f"{small.as_posix()} {sz}b")
        elif f.stat().st_size > 40000 and w > 520:
            small = f.with_name(f.stem + '-480.webp')
            if (not small.exists()) or (f.stat().st_mtime > small.stat().st_mtime):
                img = im.copy()
                img.thumbnail((480, 480), Image.LANCZOS)
                sz = save_webp(img, small, 80)
                saved_bytes += sz
                made.append(f"{small.as_posix()} {sz}b")

print(f"ORIG_TOTAL {orig_bytes} bytes")
print(f"GENERATED {len(made)} files")
for m in made:
    print("MADE", m)
