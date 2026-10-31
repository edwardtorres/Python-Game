import math


def parse_weight(text):
    if not isinstance(text, str):
        raise TypeError("weight must be text")
    try:
        value = float(text)
    except ValueError:
        return None
    if math.isnan(value) or math.isinf(value):
        return None
    return value
