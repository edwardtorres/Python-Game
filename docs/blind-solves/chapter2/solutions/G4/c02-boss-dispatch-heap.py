def dispatch_order(jobs):
    # sorted() is stable, so jobs with the same priority keep arrival order.
    ordered = sorted(jobs, key=lambda job: job[0])
    return [name for _priority, name in ordered]
