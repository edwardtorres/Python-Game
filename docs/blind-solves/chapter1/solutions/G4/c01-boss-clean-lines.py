def clean_lines(lines):
    cleaned = []
    for line in lines:
        trimmed = line.strip(" ")
        if trimmed:
            cleaned.append(trimmed)
    return cleaned
