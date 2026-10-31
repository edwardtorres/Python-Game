from dataclasses import dataclass


@dataclass(order=True)
class Parcel:
    kg: float
    name: str


def lightest_names(rows):
    parcels = sorted(Parcel(kg, name) for kg, name in rows)
    return [parcel.name for parcel in parcels]
