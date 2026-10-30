"""Grader core. Runs learner code in a fresh namespace and compares it with a reference.

Challenge kinds: function, pandas, chart, ml, api, testing, structure.

Every graded call reseeds Python's random module and NumPy's global RNG first. The
virtual clock makes retry backoff measurable. Messages for hidden cases never reveal
expected values. A run also reports which wrong variant the learner's output matches,
so the explanation for that mistake can be shown.
"""

import ast
import copy
import io
import json
import math
import traceback

import runtime
from mock_api import MockAPI

LEARNER = "<learner>"
REFERENCE = "<reference>"
VARIANT = "<variant>"
CLIP = 220
HIDDEN_NOTE = "Did not match on a hidden case."


def _clip(text):
    text = " ".join(str(text).split())
    return text if len(text) <= CLIP else text[: CLIP - 3] + "..."


def _error_info(exc, filename):
    lines = [frame.lineno for frame in traceback.extract_tb(exc.__traceback__) if frame.filename == filename]
    return {"type": type(exc).__name__, "message": _clip(exc), "line": lines[-1] if lines else None}


def _definitions_only(code):
    """Keeps imports and definitions, and drops top-level exploration. Notebook
    submissions are graded this way, so cells that print or inspect data do not
    break the graded run. Line numbers are kept, so errors still point to the cell."""
    tree = ast.parse(code, filename=LEARNER)
    keep = (ast.Import, ast.ImportFrom, ast.FunctionDef, ast.ClassDef)
    tree.body = [node for node in tree.body if isinstance(node, keep)]
    return tree


def _load(code, filename, extra=None, definitions_only=False):
    namespace = runtime.new_namespace()
    if extra:
        namespace.update(extra)
    try:
        if definitions_only:
            exec(compile(_definitions_only(code), filename, "exec"), namespace)
        else:
            exec(compile(code, filename, "exec"), namespace)
    except SyntaxError as exc:
        return None, {"type": "SyntaxError", "message": _clip(exc.msg), "line": exc.lineno}
    except Exception as exc:
        return None, _error_info(exc, filename)
    return namespace, None


def _call(fn, args, kwargs, filename):
    runtime.seed_everything()
    try:
        return {"ok": True, "value": fn(*copy.deepcopy(args), **copy.deepcopy(kwargs))}
    except Exception as exc:
        return {"ok": False, "error": _error_info(exc, filename)}


def _read_csv(datasets, name):
    import pandas as pd

    return pd.read_csv(io.StringIO(datasets[name]))


def _plain(value):
    if isinstance(value, bool) or value is None or isinstance(value, (int, str)):
        return value
    if isinstance(value, float):
        return None if math.isnan(value) else round(value, 12)
    if isinstance(value, (list, tuple)):
        return [_plain(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _plain(item) for key, item in sorted(value.items(), key=lambda pair: repr(pair[0]))}
    if isinstance(value, (set, frozenset)):
        return {"set": sorted((_plain(item) for item in value), key=repr)}
    return repr(value)


def _same(a, b, tolerance):
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) is type(b) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        a_nan = isinstance(a, float) and math.isnan(a)
        b_nan = isinstance(b, float) and math.isnan(b)
        if a_nan or b_nan:
            return a_nan and b_nan
        return math.isclose(a, b, rel_tol=tolerance, abs_tol=tolerance)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(_same(x, y, tolerance) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(_same(a[key], b[key], tolerance) for key in a)
    return type(a) is type(b) and a == b


def _is_number(text):
    try:
        float(text)
        return True
    except ValueError:
        return False


def _describe_chart(fig):
    fig.canvas.draw()
    if len(fig.axes) != 1:
        return {"error": f"expected one set of axes, found {len(fig.axes)}"}
    ax = fig.axes[0]
    xlabels = [label.get_text() for label in ax.get_xticklabels() if label.get_text()]
    ylabels = [label.get_text() for label in ax.get_yticklabels() if label.get_text()]
    description = {"title": ax.get_title(), "xlabel": ax.get_xlabel(), "ylabel": ax.get_ylabel(), "orientation": None}
    bars = [container for container in ax.containers if type(container).__name__ == "BarContainer"]
    lines = ax.get_lines()
    if bars:
        patches = list(bars[0].patches)
        if any(not _is_number(label) for label in xlabels):
            description.update(type="bar", orientation="vertical", categories=xlabels, values=[round(float(p.get_height()), 12) for p in patches])
        elif any(not _is_number(label) for label in ylabels):
            description.update(type="bar", orientation="horizontal", categories=ylabels, values=[round(float(p.get_width()), 12) for p in patches])
        else:
            description.update(type="bar", orientation="unknown", categories=xlabels, values=[])
        description["series"] = len(bars)
    elif lines:
        values = [round(float(v), 12) for v in lines[0].get_ydata()]
        description.update(type="line", categories=xlabels, values=values, series=len(lines))
    elif ax.collections:
        description.update(type="scatter", categories=[], values=[], series=len(ax.collections))
    else:
        description.update(type="other", categories=[], values=[], series=0)
    return description


def _chart_problems(got, want, rules):
    problems = []
    if "error" in got:
        return [got["error"]]
    if rules.get("chart_type") and got["type"] != rules["chart_type"]:
        problems.append(f"expected a {rules['chart_type']} chart, got {got['type']}")
    if rules.get("orientation") and got.get("orientation") != rules["orientation"]:
        problems.append(f"expected {rules['orientation']} bars")
    if rules.get("series") is not None and got.get("series") != rules["series"]:
        problems.append(f"expected {rules['series']} series, found {got.get('series')}")
    if rules.get("require_title") and not got["title"].strip():
        problems.append("the chart needs a title")
    for axis in ("xlabel", "ylabel"):
        needle = rules.get(f"{axis}_contains")
        if needle and needle.lower() not in got[axis].lower():
            problems.append(f"the {axis[0]}-axis label should mention '{needle}'")
    if got.get("categories") != want.get("categories"):
        problems.append("categories or their order differ from the expected chart")
    elif not _same(got.get("values"), want.get("values"), rules.get("tolerance", 1e-9)):
        problems.append("the plotted values differ from the expected values")
    return problems


def _frame_problem(got, want, rules):
    import pandas as pd

    if not isinstance(got, pd.DataFrame):
        return f"return a DataFrame, got {type(got).__name__}"
    tolerance = rules.get("tolerance", 1e-9)
    try:
        pd.testing.assert_frame_equal(got, want, check_dtype=rules.get("check_dtype", True), rtol=tolerance, atol=tolerance)
    except AssertionError as exc:
        return _clip(exc)
    return None


def _function_problem(got, want, rules):
    if not got["ok"]:
        if want["ok"]:
            return f"raised {got['error']['type']}: {got['error']['message']}"
        if got["error"]["type"] == want["error"]["type"]:
            return None
        return f"raised {got['error']['type']}, expected {want['error']['type']}"
    if not want["ok"]:
        return f"returned a value, but the reference raises {want['error']['type']}"
    if _same(got["value"], want["value"], rules.get("tolerance", 1e-9)):
        return None
    return f"expected {_clip(repr(want['value']))}, got {_clip(repr(got['value']))}"


def _compare(kind, got, want, rules):
    if kind == "function":
        return _function_problem(got, want, rules)
    if not got["ok"]:
        return f"raised {got['error']['type']}: {got['error']['message']}"
    if kind == "pandas":
        return _frame_problem(got["value"], want["value"], rules)
    return "; ".join(_chart_problems(got["description"], want["description"], rules)) or None


def _public(problem, case, got):
    if problem is None:
        return ""
    if case.get("visibility", "visible") == "visible":
        return _clip(problem)
    if not got["ok"]:
        return f"raised {got['error']['type']} on a hidden case"
    return HIDDEN_NOTE


def _frame_summary(value):
    import pandas as pd

    if not isinstance(value, pd.DataFrame):
        return {"not_a_frame": type(value).__name__}
    return {
        "columns": [str(column) for column in value.columns],
        "index": _plain(list(value.index)),
        "data": _plain(value.values.tolist()),
        "dtypes": [str(dtype) for dtype in value.dtypes],
    }


def _summary(kind, outcome):
    if not outcome["ok"]:
        return "error:" + outcome["error"]["type"]
    if kind == "function":
        return json.dumps(_plain(outcome["value"]), sort_keys=True)
    if kind == "pandas":
        return json.dumps(_frame_summary(outcome["value"]), sort_keys=True)
    return json.dumps(outcome["description"], sort_keys=True)


def _run_one(kind, fn, case, datasets, filename):
    if kind == "function":
        return _call(fn, case.get("args", []), case.get("kwargs", {}), filename)
    frame = _read_csv(datasets, case["dataset"])
    if kind == "pandas":
        return _call(fn, [frame], {}, filename)
    outcome = _call(fn, [frame], {}, filename)
    if not outcome["ok"]:
        return outcome
    import matplotlib.pyplot as plt

    figure = outcome["value"] if hasattr(outcome["value"], "axes") else plt.gcf()
    try:
        description = _describe_chart(figure)
    finally:
        plt.close("all")
    return {"ok": True, "description": description}


def _execute(kind, code, filename, payload, cases, datasets):
    namespace, error = _load(code, filename, definitions_only=payload.get("definitions_only", False))
    if error is not None:
        return None, error
    fn = namespace.get(payload["entry"])
    if not callable(fn):
        return None, {"type": "NameError", "message": f"define a function named {payload['entry']}", "line": None}
    return [_run_one(kind, fn, case, datasets, filename) for case in cases], None


def _grade_cases(payload, datasets):
    kind = payload["kind"]
    scope = payload.get("scope", "all")
    cases = [case for case in payload["cases"] if scope == "all" or case.get("visibility", "visible") == "visible"]
    expected, reference_error = _execute(kind, payload["reference"], REFERENCE, payload, cases, datasets)
    if reference_error is not None:
        return {"status": "error", "error": {"type": "ReferenceError", "message": reference_error["message"], "line": None}, "cases": [], "matched": [], "passed": 0, "total": 0}
    outputs, learner_error = _execute(kind, payload["learner"], LEARNER, payload, cases, datasets)
    if learner_error is not None:
        return {"status": "error", "error": learner_error, "cases": [], "matched": [], "passed": 0, "total": len(cases)}

    rules = payload.get("rules", {})
    results = []
    for case, got, want in zip(cases, outputs, expected):
        problem = _compare(kind, got, want, rules)
        results.append(
            {
                "id": case["id"],
                "label": case.get("label", case["id"]),
                "visibility": case.get("visibility", "visible"),
                "ok": problem is None,
                "message": _public(problem, case, got),
            }
        )
    passed = all(result["ok"] for result in results)
    matched = []
    if not passed:
        learner_signature = [_summary(kind, outcome) for outcome in outputs]
        for variant in payload.get("variants", []):
            variant_outputs, variant_error = _execute(kind, variant["code"], VARIANT, payload, cases, datasets)
            if variant_error is None and [_summary(kind, outcome) for outcome in variant_outputs] == learner_signature:
                matched.append({"variantId": variant["id"], **variant["mistake"]})
    return {
        "status": "pass" if passed else "fail",
        "error": None,
        "cases": results,
        "passed": sum(1 for result in results if result["ok"]),
        "total": len(results),
        "matched": matched,
    }


def _run_suite(impl_code, filename, tests_code):
    namespace = runtime.new_namespace("__tests__")
    exec(compile(impl_code, filename, "exec"), namespace)
    exec(compile(tests_code, LEARNER, "exec"), namespace)
    outcomes = []
    for name in list(namespace):
        test = namespace[name]
        if not (name.startswith("test_") and callable(test)):
            continue
        runtime.seed_everything()
        try:
            test()
            outcomes.append((name, None))
        except AssertionError as exc:
            outcomes.append((name, _clip(exc) or "an assertion failed"))
        except Exception as exc:
            outcomes.append((name, f"{type(exc).__name__}: {_clip(exc)}"))
    return outcomes


def _grade_testing(payload):
    try:
        correct = _run_suite(payload["reference"], REFERENCE, payload["learner"])
    except Exception as exc:
        return {"status": "error", "error": _error_info(exc, LEARNER), "cases": [], "matched": [], "passed": 0, "total": 0}
    correct_ok = all(message is None for _, message in correct)
    first_failure = next((f"{name}: {message}" for name, message in correct if message), "")
    cases = [
        {
            "id": "correct",
            "label": "Your tests pass on the correct implementation",
            "visibility": "visible",
            "ok": correct_ok,
            "message": "" if correct_ok else _clip(first_failure),
        }
    ]
    matched = []
    for mutant in payload["mutants"]:
        try:
            outcomes = _run_suite(mutant["code"], VARIANT, payload["learner"])
        except Exception:
            outcomes = [("import", "the buggy version does not run")]
        killed = any(message is not None for _, message in outcomes)
        cases.append(
            {
                "id": mutant["id"],
                "label": mutant["label"],
                "visibility": mutant.get("visibility", "visible"),
                "ok": killed,
                "message": "" if killed else "Your tests did not catch this bug.",
            }
        )
        if not killed:
            matched.append({"variantId": mutant["id"], **mutant["mistake"]})
    passed = correct_ok and not matched
    return {
        "status": "pass" if passed else "fail",
        "error": None,
        "cases": cases,
        "passed": sum(1 for case in cases if case["ok"]),
        "total": len(cases),
        "matched": matched,
    }


def _dotted(node):
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        base = _dotted(node.value)
        return f"{base}.{node.attr}" if base else None
    return None


def _find_function(tree, name):
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name:
            return node
    return None


def _structure_check(tree, check):
    kind = check["type"]
    if kind == "defines":
        return _find_function(tree, check["name"]) is not None, f"define a function named {check['name']}"
    scope = _find_function(tree, check["within"]) if check.get("within") else tree
    if scope is None:
        return False, f"define {check['within']} first"
    if kind == "no_loops_in":
        ok = not any(isinstance(node, (ast.For, ast.While)) for node in ast.walk(scope))
        return ok, "use no for or while loops here; work on the whole column at once"
    if kind == "uses_comprehension_in":
        ok = any(isinstance(node, (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)) for node in ast.walk(scope))
        return ok, "use a comprehension here"
    if kind == "calls":
        ok = any(isinstance(node, ast.Call) and _dotted(node.func) == check["name"] for node in ast.walk(scope))
        return ok, f"call {check['name']}"
    if kind == "forbids_calls":
        ok = not any(isinstance(node, ast.Call) and _dotted(node.func) == check["name"] for node in ast.walk(scope))
        return ok, f"do not call {check['name']} here"
    return False, f"unknown check type {kind}"


def _grade_structure(payload):
    try:
        tree = ast.parse(payload["learner"], filename=LEARNER)
    except SyntaxError as exc:
        return {"status": "error", "error": {"type": "SyntaxError", "message": _clip(exc.msg), "line": exc.lineno}, "cases": [], "matched": [], "passed": 0, "total": 0}
    cases = []
    for index, check in enumerate(payload["checks"]):
        ok, message = _structure_check(tree, check)
        cases.append({"id": f"check-{index}", "label": check["label"], "visibility": "visible", "ok": ok, "message": "" if ok else _clip(message)})
    passed = all(case["ok"] for case in cases)
    return {"status": "pass" if passed else "fail", "error": None, "cases": cases, "passed": sum(1 for c in cases if c["ok"]), "total": len(cases), "matched": []}


def _grade_api(payload):
    failures = payload.get("failures", [])
    rules = payload.get("rules", {})
    reference_api = MockAPI(failures)
    reference_ns, reference_error = _load(payload["reference"], REFERENCE, {"http_get": reference_api.http_get})
    if reference_error is not None:
        return {"status": "error", "error": reference_error, "cases": [], "matched": [], "passed": 0, "total": 0}
    expected = _call(reference_ns[payload["entry"]], [], {}, REFERENCE)

    api = MockAPI(failures)
    learner_ns, learner_error = _load(payload["learner"], LEARNER, {"http_get": api.http_get})
    if learner_error is not None:
        return {"status": "error", "error": learner_error, "cases": [], "matched": [], "passed": 0, "total": 0}
    fn = learner_ns.get(payload["entry"])
    if not callable(fn):
        return {"status": "error", "error": {"type": "NameError", "message": f"define a function named {payload['entry']}", "line": None}, "cases": [], "matched": [], "passed": 0, "total": 0}
    outcome = _call(fn, [], {}, LEARNER)

    cases = []
    if not outcome["ok"]:
        problem = f"raised {outcome['error']['type']}: {outcome['error']['message']}"
    else:
        problem = None if _same(outcome["value"], expected["value"], 1e-9) else "returned a different list than expected"
    cases.append({"id": "result", "label": "Returns every shipment, in order", "visibility": "visible", "ok": problem is None, "message": _clip(problem or "")})

    max_attempts = rules.get("max_attempts_per_page", 4)
    pages = sorted({call["page"] for call in api.calls})
    for page in pages:
        attempts = sum(1 for call in api.calls if call["page"] == page)
        ok = attempts <= max_attempts
        cases.append({"id": f"attempts-{page}", "label": f"Page {page} needs at most {max_attempts} attempts", "visibility": "visible", "ok": ok, "message": "" if ok else f"made {attempts} attempts"})

    for index, failed in enumerate(api.failed):
        later = [call for call in api.calls if call["page"] == failed["page"] and call["at"] > failed["at"]]
        label = f"After the {failed['status']} on page {failed['page']}, wait before retrying"
        if not later:
            cases.append({"id": f"retry-{index}", "label": label, "visibility": "visible", "ok": False, "message": "did not retry the page"})
            continue
        gap = later[0]["at"] - failed["at"]
        if failed["retry_after"] is not None:
            ok = gap >= failed["retry_after"]
            message = "" if ok else f"waited {gap:g}s, but Retry-After asked for {failed['retry_after']}s"
        else:
            ok = gap > 0
            message = "" if ok else "retried with no backoff"
        cases.append({"id": f"retry-{index}", "label": label, "visibility": "visible", "ok": ok, "message": message})

    passed = all(case["ok"] for case in cases)
    return {"status": "pass" if passed else "fail", "error": None, "cases": cases, "passed": sum(1 for c in cases if c["ok"]), "total": len(cases), "matched": []}


def _grade_ml(payload, datasets):
    import numpy as np

    train = _read_csv(datasets, payload["train"])
    holdout = _read_csv(datasets, payload["holdout"])
    namespace, error = _load(payload["learner"], LEARNER)
    if error is not None:
        return {"status": "error", "error": error, "cases": [], "matched": [], "passed": 0, "total": 0}
    fn = namespace.get(payload["entry"])
    if not callable(fn):
        return {"status": "error", "error": {"type": "NameError", "message": f"define a function named {payload['entry']}", "line": None}, "cases": [], "matched": [], "passed": 0, "total": 0}
    trained = _call(fn, [train.copy()], {}, LEARNER)
    if not trained["ok"]:
        return {"status": "error", "error": trained["error"], "cases": [], "matched": [], "passed": 0, "total": 1}
    try:
        predictions = np.asarray(trained["value"].predict(holdout[payload["features"]]))
    except Exception as exc:
        return {"status": "error", "error": _error_info(exc, LEARNER), "cases": [], "matched": [], "passed": 0, "total": 1}
    truth = holdout[payload["target"]].to_numpy()
    if payload["metric"] == "mae":
        score = float(np.mean(np.abs(predictions.astype(float) - truth.astype(float))))
        ok = score <= payload["threshold"]
        needs = f"needs MAE at or below {payload['threshold']}"
    else:
        score = float(np.mean(predictions == truth))
        ok = score >= payload["threshold"]
        needs = f"needs accuracy at or above {payload['threshold']}"
    cases = [{"id": "holdout", "label": "Scores on the hidden holdout set", "visibility": "hidden", "ok": ok, "message": f"{payload['metric']} = {score:.4f}; {needs}"}]
    return {"status": "pass" if ok else "fail", "error": None, "cases": cases, "passed": int(ok), "total": 1, "matched": []}


def grade(payload, datasets):
    runtime.reset_runtime()
    runtime.install_virtual_clock()
    try:
        kind = payload["kind"]
        if kind == "structure":
            return _grade_structure(payload)
        if kind == "testing":
            return _grade_testing(payload)
        if kind == "api":
            return _grade_api(payload)
        if kind == "ml":
            return _grade_ml(payload, datasets)
        return _grade_cases(payload, datasets)
    finally:
        runtime.restore_clock()


def grade_json(payload_json, datasets_json):
    return json.dumps(grade(json.loads(payload_json), json.loads(datasets_json)), sort_keys=True)
