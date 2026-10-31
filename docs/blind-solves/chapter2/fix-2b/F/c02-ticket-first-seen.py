def first_seen(log):
    seen = set()
    result = []
    for dock in log:
        if dock not in seen:
            seen.add(dock)
            result.append(dock)
    return result
