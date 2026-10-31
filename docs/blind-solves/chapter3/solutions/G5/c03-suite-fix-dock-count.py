def count_docks(log):
    # Each entry is one scan's dock name. A set keeps each exact name once.
    return len(set(log))
