def add_stop(stop, stops=None):
    if stops is None:
        stops = []
    stops.append(stop)
    return stops
