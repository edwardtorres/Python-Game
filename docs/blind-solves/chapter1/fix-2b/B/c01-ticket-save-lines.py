def save_and_reload(path, lines):
    with open(path, "w", encoding="utf-8", newline="") as handle:
        for line in lines:
            handle.write(line + "\n")
    with open(path, encoding="utf-8", newline="") as handle:
        content = handle.read()
    return content.split("\n")[:-1]
