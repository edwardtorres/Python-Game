"""Two checks, run under this Python and compared with what the engine (Pyodide, Python 3.14)
recorded.

1. Every grading payload in cases.json is graded, and the verdict is compared: status,
   pass counts, per-case results, and matched mistakes. Messages are not compared, because
   pandas and matplotlib messages change between versions.
2. Every lesson example and every predict option in examples.json is run, and its printed
   output must match exactly. A traceback option compares only the exception type, because
   CPython 3.10 words some messages differently from Pyodide.

Run from the repository root. CI runs it under CPython 3.10.
"""

import contextlib
import io
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


def check_payloads(version):
    with open(os.path.join(ROOT, "scripts", "py310", "cases.json"), encoding="utf-8") as handle:
        cases = json.load(handle)
    mismatches = 0
    for case in cases:
        result = json.loads(grader.grade_json(json.dumps(case["payload"]), json.dumps(case["datasets"])))
        actual = verdict(result)
        if actual != case["expected"]:
            mismatches += 1
            print(f"MISMATCH {case['name']}: engine {case['expected']} vs {version} {actual}")
    print(f"run-cases: {len(cases)} payloads on Python {version}, {mismatches} mismatches")
    return mismatches


def run_snippet(code):
    """Runs one snippet in a fresh namespace. Returns (stdout, exception type name or None)."""
    namespace = {"__name__": "__snippet__"}
    buffer = io.StringIO()
    try:
        with contextlib.redirect_stdout(buffer):
            exec(compile(code, "<example>", "exec"), namespace)
    except Exception as exc:  # noqa: BLE001 - any error is a result to compare
        return buffer.getvalue(), type(exc).__name__
    return buffer.getvalue(), None


def check_examples(version):
    with open(os.path.join(ROOT, "scripts", "py310", "examples.json"), encoding="utf-8") as handle:
        examples = json.load(handle)
    mismatches = 0
    for example in examples:
        stdout, error_type = run_snippet(example["code"])
        if example["check"] == "stdout":
            actual = stdout if error_type is None else f"raised {error_type}"
            ok = actual == example["expected"]
        else:
            actual = error_type or "none"
            ok = actual == example["expected"]
        if not ok:
            mismatches += 1
            print(f"MISMATCH {example['name']}: engine {example['expected']!r} vs {version} {actual!r}")
    print(f"run-examples: {len(examples)} snippets on Python {version}, {mismatches} mismatches")
    return mismatches


def main():
    version = sys.version.split()[0]
    mismatches = check_payloads(version) + check_examples(version)
    return 1 if mismatches else 0


if __name__ == "__main__":
    sys.exit(main())
