def clean_lines(lines):
    cleaned = []
    for line in lines:
        trimmed = line.strip(" ")
        if trimmed.isspace() or trimmed == "":
            continue
        cleaned.append(trimmed)
    return cleaned
