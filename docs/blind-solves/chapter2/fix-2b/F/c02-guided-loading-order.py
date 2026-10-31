def loading_order(parcels):
    ordered = sorted(parcels, key=lambda parcel: (-parcel[1], parcel[0]))
    return [name for name, _kg in ordered]
