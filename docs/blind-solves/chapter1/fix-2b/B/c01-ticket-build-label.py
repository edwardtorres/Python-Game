def build_label(name, *tags, **options):
    parts = [name]
    if tags:
        parts.append("[" + ", ".join(tags) + "]")
    for key in sorted(options):
        parts.append(f"{key}={options[key]}")
    return " ".join(parts)
