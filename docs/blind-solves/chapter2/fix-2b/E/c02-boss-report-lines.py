def report_lines(rows):
    ordered = sorted(rows, key=lambda row: row[0])
    return [f"{dock}: {total:.1f}" for dock, total in ordered]
