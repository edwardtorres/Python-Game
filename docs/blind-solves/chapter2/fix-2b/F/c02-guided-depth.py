def depth(value):
    if not isinstance(value, list):
        return 0
    return 1 + max((depth(item) for item in value), default=0)
