"""Notebook sessions: cells share one namespace, output is captured, and rich values render.

A session is a dict of namespaces keyed by id. Cells run in order in the same
namespace, like Jupyter. Grading never uses a session; it runs the cells again in a
fresh namespace, so notebook state cannot leak into a graded result.
"""

import ast
import base64
import contextlib
import io
import json
import traceback

import runtime

SESSIONS = {}
DATASETS = {}


def set_datasets(datasets_json):
    """Visible dataset CSVs for the notebook. Hidden datasets never reach a session."""
    DATASETS.clear()
    DATASETS.update(json.loads(datasets_json))
    return {"ok": True}


def load_dataset(name):
    import pandas as pd

    return pd.read_csv(io.StringIO(DATASETS[name]))


def _render(value):
    import pandas as pd

    if isinstance(value, (pd.DataFrame, pd.Series)):
        frame = value.to_frame() if isinstance(value, pd.Series) else value
        return {"kind": "html", "data": frame.head(60).to_html(classes="table", border=0, escape=True)}
    if value is None:
        return None
    return {"kind": "text", "data": repr(value)[:4000]}


def _figure_images():
    import matplotlib.pyplot as plt

    images = []
    for number in plt.get_fignums():
        figure = plt.figure(number)
        buffer = io.BytesIO()
        figure.savefig(buffer, format="png", dpi=110)
        images.append(base64.b64encode(buffer.getvalue()).decode("ascii"))
    plt.close("all")
    return images


def _run_cell_in(namespace, code):
    output = io.StringIO()
    result = {"stdout": "", "display": None, "images": [], "error": None}
    try:
        tree = ast.parse(code, filename="<cell>", mode="exec")
        last_expression = tree.body and isinstance(tree.body[-1], ast.Expr)
        with contextlib.redirect_stdout(output):
            if last_expression:
                head = ast.Module(body=tree.body[:-1], type_ignores=[])
                tail = ast.Expression(body=tree.body[-1].value)
                exec(compile(head, "<cell>", "exec"), namespace)
                value = eval(compile(tail, "<cell>", "eval"), namespace)
                result["display"] = _render(value)
            else:
                exec(compile(tree, "<cell>", "exec"), namespace)
            result["images"] = _figure_images()
    except SyntaxError as exc:
        result["error"] = {"type": "SyntaxError", "message": str(exc.msg), "line": exc.lineno}
    except Exception as exc:
        lines = [frame.lineno for frame in traceback.extract_tb(exc.__traceback__) if frame.filename == "<cell>"]
        result["error"] = {"type": type(exc).__name__, "message": str(exc)[:400], "line": lines[-1] if lines else None}
    result["stdout"] = output.getvalue()[:8000]
    return result


def start_session(session_id):
    runtime.reset_runtime()
    namespace = runtime.new_namespace("__notebook__")
    namespace["load_dataset"] = load_dataset
    runtime.seed_everything()
    SESSIONS[session_id] = namespace
    return {"ok": True}


def run_cell(session_id, code):
    if session_id not in SESSIONS:
        start_session(session_id)
    return _run_cell_in(SESSIONS[session_id], code)


def reset_session(session_id):
    SESSIONS.pop(session_id, None)
    return {"ok": True}


