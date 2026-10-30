def build_label(name, *tags, **options):
    parts = [str(name)]
    if tags:
        parts.append("[" + ", ".join(str(tag) for tag in tags) + "]")
    for key in sorted(options):
        parts.append(f"{key}={options[key]}")
    return " ".join(parts)
