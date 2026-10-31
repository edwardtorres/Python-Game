def classify_weight(kg):
    if kg < 5:
        return "light"
    if kg <= 20:
        return "medium"
    return "heavy"
