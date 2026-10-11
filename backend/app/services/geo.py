import math

EARTH_RADIUS_M = 6_371_000


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Расстояние между двумя точками на земле, в метрах."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def bbox(lat: float, lon: float, radius_m: float) -> tuple[float, float, float, float]:
    """Прямоугольник вокруг точки (min_lat, max_lat, min_lon, max_lon) — для быстрой предварительной выборки из БД."""
    dlat = radius_m / 111_320
    dlon = radius_m / (111_320 * max(0.01, math.cos(math.radians(lat))))
    return lat - dlat, lat + dlat, lon - dlon, lon + dlon
