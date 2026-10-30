"""Runs every exported grading payload under this Python and compares the verdicts with
the verdicts the engine (Pyodide, Python 3.14) recorded in cases.json.

Run from the repository root. CI runs it under CPython 3.10. Messages are not compared,
because pandas and matplotlib messages change between versions. Status, pass counts,
per-case results, and matched mistakes must all agree.
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "src", "engine", "python"))
os.environ.setdefault("MPLBACKEND", "Agg")

import grader  # noqa: E402


def verdict(result):
    return {
        "status": result["status"],
        "passed": result["passed"],
        "total": result["total"],
        "cases": [[case["id"], case["ok"]] for case in result["cases"]],
        "matched": [mistake["variantId"] for mistake in result["matched"]],
    }


def main():
    with open(os.path.join(ROOT, "scripts", "py310", "cases.json"), encoding="utf-8") as handle:
        cases = json.load(handle)
    mismatches = 0
    for case in cases:
        result = json.loads(grader.grade_json(json.dumps(case["payload"]), json.dumps(case["datasets"])))
        actual = verdict(result)
        if actual != case["expected"]:
            mismatches += 1
            print(f"MISMATCH {case['name']}: engine {case['expected']} vs {sys.version.split()[0]} {actual}")
    print(f"run-cases: {len(cases)} payloads on Python {sys.version.split()[0]}, {mismatches} mismatches")
    return 1 if mismatches else 0


if __name__ == "__main__":
    sys.exit(main())
