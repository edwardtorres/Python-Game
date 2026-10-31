def rank_rows(rows):
    ordered = sorted(rows, key=lambda row: (row[0], -row[2], row[1]))
    return [f"{dock}/{name}" for dock, name, _kg in ordered]
