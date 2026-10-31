class Parcel:
    def __init__(self, kg, name):
        self.kg = kg
        self.name = name


class Pallet(Parcel):
    def __init__(self, kg, name, count):
        super().__init__(kg, name)
        self.count = count

    def total_weight(self):
        return self.kg * self.count


def pallet_totals(rows):
    return [
        (name, Pallet(kg, name, count).total_weight())
        for kg, name, count in rows
    ]
