def save_and_reload(path, lines):
    with open(path, "w", encoding="utf-8", newline="") as handle:
        for note in lines:
            handle.write(note + "\n")
    with open(path, "r", encoding="utf-8", newline="") as handle:
        text = handle.read()
    if not text:
        return []
    if text.endswith("\n"):
        text = text[:-1]
    return text.split("\n")
