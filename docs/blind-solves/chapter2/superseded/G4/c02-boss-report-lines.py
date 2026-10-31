def report_lines(rows):
    totals = {}
    for dock, kg in rows:
        totals[dock] = totals.get(dock, 0) + kg
    return [f"{dock}: {totals[dock]:.1f} kg" for dock in sorted(totals)]
