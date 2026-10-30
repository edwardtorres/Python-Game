"""Simulated HTTP API for API tasks. Deterministic, offline, and recording every call.

http_get(url) returns {"status", "retry_after", "body"}, the same shape the learner
sees. Scripted failures fire once each, on the first request for their page.
"""

import json
from urllib.parse import parse_qs, urlsplit

import runtime

TOTAL_SHIPMENTS = 25


def shipment_weight(index):
    return (index * 37) % 100 + 1


class MockAPI:
    def __init__(self, failures=None):
        self._pending = [dict(f) for f in (failures or [])]
        self.calls = []
        self.failed = []

    def _take_failure(self, page):
        for index, failure in enumerate(self._pending):
            if int(failure["page"]) == page:
                return self._pending.pop(index)
        return None

    def http_get(self, url):
        parts = urlsplit(url)
        query = {key: values[0] for key, values in parse_qs(parts.query).items()}
        page = int(query.get("page", "1"))
        per_page = int(query.get("per_page", "10"))
        now = runtime.VIRTUAL["now"]
        self.calls.append({"path": parts.path, "page": page, "per_page": per_page, "at": now})
        if parts.path != "/api/shipments":
            return {"status": 404, "retry_after": None, "body": "{}"}
        failure = self._take_failure(page)
        if failure is not None:
            self.failed.append({"page": page, "status": failure["status"], "retry_after": failure.get("retry_after"), "at": now})
            return {"status": failure["status"], "retry_after": failure.get("retry_after"), "body": ""}
        start = (page - 1) * per_page
        items = [
            {"id": index + 1, "weight_kg": shipment_weight(index)}
            for index in range(start, min(TOTAL_SHIPMENTS, start + per_page))
        ]
        next_page = page + 1 if start + per_page < TOTAL_SHIPMENTS else None
        return {"status": 200, "retry_after": None, "body": json.dumps({"items": items, "next_page": next_page})}
