def stock_check(catalog, orders):
    stocked = set(catalog)
    return [sku in stocked for sku in orders]
