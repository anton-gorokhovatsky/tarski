#!/usr/bin/env python3
"""Generate responsive AVIF variants for artist dossier galleries."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
GALLERY_DIRECTORIES = (
    ROOT / "assets/artist-index/anastasia-dahl",
    ROOT / "assets/artist-index/alina-kugush",
)
TARGET_WIDTHS = (800, 1400)
QUALITY = 62


def generate_variant(source: Path, target_width: int) -> Path:
    destination = source.with_name(f"{source.stem}-{target_width}.avif")

    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        width = min(target_width, image.width)
        height = round(image.height * width / image.width)

        if (width, height) != image.size:
            image = image.resize((width, height), Image.Resampling.LANCZOS)

        image.save(destination, format="AVIF", quality=QUALITY, speed=6)

    return destination


def main() -> None:
    sources = sorted(
        source
        for directory in GALLERY_DIRECTORIES
        for source in directory.glob("*.jpg")
        if not any(source.stem.endswith(f"-{width}") for width in TARGET_WIDTHS)
    )

    for source in sources:
        for target_width in TARGET_WIDTHS:
            destination = generate_variant(source, target_width)
            print(destination.relative_to(ROOT))


if __name__ == "__main__":
    main()
