def repeated_tickets(tickets):
    seen = set()
    reported = set()
    result = []
    for ticket in tickets:
        if ticket not in seen:
            seen.add(ticket)
        elif ticket not in reported:
            reported.add(ticket)
            result.append(ticket)
    return result
