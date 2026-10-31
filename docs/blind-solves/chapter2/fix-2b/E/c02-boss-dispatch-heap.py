def dispatch_order(jobs):
    ordered = sorted(jobs, key=lambda job: job[0])
    return [name for _priority, name in ordered]
