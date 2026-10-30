def countdown(n):
    while n >= 1:
        yield n
        n -= 1
