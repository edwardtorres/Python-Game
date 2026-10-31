def nested_total(values):
    total = 0
    for value in values:
        if isinstance(value, list):
            total += nested_total(value)
        else:
            total += value
    return total
