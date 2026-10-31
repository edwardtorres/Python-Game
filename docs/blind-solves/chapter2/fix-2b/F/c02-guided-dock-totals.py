def dock_totals(parcels):
    totals = {}
    for dock, kg in parcels:
        totals[dock] = totals.get(dock, 0) + kg
    return totals
