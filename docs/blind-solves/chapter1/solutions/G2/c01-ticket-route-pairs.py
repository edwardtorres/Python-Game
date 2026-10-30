def route_pairs(stops):
    stops = list(stops)
    return [(stops[i], stops[i + 1]) for i in range(len(stops) - 1)]
