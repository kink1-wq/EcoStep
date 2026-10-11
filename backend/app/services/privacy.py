import io

from PIL import Image, ImageFilter, ImageOps

from app.schemas.report import PrivacyBox


def blur_regions(data: bytes, boxes: list[PrivacyBox]) -> bytes | None:
    """Скрывает лица и номера автомобилей на фото (пикселизация + размытие).
    Возвращает новое JPEG-изображение (метаданные EXIF, включая GPS, при этом отбрасываются) или None, если скрывать нечего."""
    regions = []
    for b in boxes:
        y0, y1 = sorted((max(0, min(1000, b.ymin)), max(0, min(1000, b.ymax))))
        x0, x1 = sorted((max(0, min(1000, b.xmin)), max(0, min(1000, b.xmax))))
        if y1 - y0 < 4 or x1 - x0 < 4:  # мусорная «рамка» нулевого размера
            continue
        regions.append((x0, y0, x1, y1))
    if not regions:
        return None

    img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    width, height = img.size
    for x0, y0, x1, y1 in regions:
        # небольшой запас вокруг рамки: детектор может чуть промахнуться краем
        padx, pady = (x1 - x0) * width / 1000 * 0.2, (y1 - y0) * height / 1000 * 0.2
        px0, py0 = max(0, int(x0 * width / 1000 - padx)), max(0, int(y0 * height / 1000 - pady))
        px1, py1 = min(width, int(x1 * width / 1000 + padx)), min(height, int(y1 * height / 1000 + pady))
        if px1 - px0 < 2 or py1 - py0 < 2:
            continue
        region = img.crop((px0, py0, px1, py1))
        w, h = region.size
        small = region.resize((max(1, w // 12), max(1, h // 12)), Image.Resampling.BILINEAR)
        mosaic = small.resize((w, h), Image.Resampling.NEAREST).filter(ImageFilter.GaussianBlur(max(2, min(w, h) // 12)))
        img.paste(mosaic, (px0, py0))

    out = io.BytesIO()
    img.save(out, "JPEG", quality=88, optimize=True)
    return out.getvalue()
