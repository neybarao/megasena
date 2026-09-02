from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "icons"
OUTPUT.mkdir(parents=True, exist_ok=True)


def build_icon(size: int) -> None:
    source = Image.open(OUTPUT / "icon-source.png").convert("RGB")
    image = source.resize((size, size), Image.Resampling.LANCZOS)
    image.save(OUTPUT / f"icon-{size}.png", optimize=True)
    image.save(OUTPUT / f"icon-{size}-v2.png", optimize=True)


for icon_size in (192, 512):
    build_icon(icon_size)
