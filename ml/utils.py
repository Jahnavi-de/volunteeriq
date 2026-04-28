from math import atan2, cos, pi, sin, sqrt


def clamp(value, minimum, maximum):
    return min(max(value, minimum), maximum)


def to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_rad(degrees):
    return to_float(degrees) * pi / 180


def haversine_distance(lat1, lng1, lat2, lng2):
    values = [to_float(lat1, None), to_float(lng1, None), to_float(lat2, None), to_float(lng2, None)]
    if any(value is None for value in values):
        return 999

    lat1, lng1, lat2, lng2 = values
    radius_km = 6371
    d_lat = to_rad(lat2 - lat1)
    d_lng = to_rad(lng2 - lng1)
    a = sin(d_lat / 2) ** 2 + cos(to_rad(lat1)) * cos(to_rad(lat2)) * sin(d_lng / 2) ** 2
    return radius_km * 2 * atan2(sqrt(a), sqrt(1 - a))


def normalise_skill(skill):
    return str(skill or "").strip().lower().replace(" ", "_")
