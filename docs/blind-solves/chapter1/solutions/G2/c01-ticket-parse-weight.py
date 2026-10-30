import math


def parse_weight(text):
    if not isinstance(text, str):
        raise TypeError("weight must be text")
    try:
        value = float(text)
    except ValueError:
        return None
    if not math.isfinite(value):
        return None
    return value
