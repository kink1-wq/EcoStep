import io

from PIL import Image


def _to_deg(v, ref: str) -> float:
    d, m, s = (float(x) for x in v)
    val = d + m / 60 + s / 3600
    return -val if ref in ("S", "W") else val


def extract_gps(data: bytes) -> tuple[float, float] | None:
    """Резервный источник координат — EXIF фотографии."""
    try:
        gps = Image.open(io.BytesIO(data)).getexif().get_ifd(0x8825)
        if not gps:
            return None
        return _to_deg(gps[2], gps[1]), _to_deg(gps[4], gps[3])
    except Exception:
        return None
