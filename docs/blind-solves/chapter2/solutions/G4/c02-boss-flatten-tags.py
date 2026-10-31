_END = object()


def flatten_tags(items):
    # Iterative walk with an explicit stack, so deep nesting cannot hit the recursion limit.
    tags = []
    stack = [iter(items)]
    while stack:
        item = next(stack[-1], _END)
        if item is _END:
            stack.pop()
        elif isinstance(item, list):
            stack.append(iter(item))
        else:
            tags.append(item)
    return tags
