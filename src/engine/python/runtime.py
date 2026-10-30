"""Shared runtime helpers: fixed seeding, a virtual clock, and namespace setup.

Every graded run calls seed_everything() first, so learner code that uses random
or numpy.random gets the same numbers every time. The virtual clock makes retry
backoff measurable without waiting in real time.
"""

import importlib.util
import random
import time

GRADER_SEED = 20251030
VIRTUAL = {"now": 0.0, "sleeps": []}
_REAL = {"sleep": time.sleep, "monotonic": time.monotonic, "time": time.time}


def _virtual_sleep(seconds):
    VIRTUAL["now"] += float(seconds)
    VIRTUAL["sleeps"].append(float(seconds))


def _virtual_now():
    return VIRTUAL["now"]


def install_virtual_clock():
    VIRTUAL["now"] = 0.0
    VIRTUAL["sleeps"] = []
    time.sleep = _virtual_sleep
    time.monotonic = _virtual_now
    time.time = _virtual_now


def restore_clock():
    time.sleep = _REAL["sleep"]
    time.monotonic = _REAL["monotonic"]
    time.time = _REAL["time"]


def seed_everything(seed=GRADER_SEED):
    random.seed(seed)
    if importlib.util.find_spec("numpy") is not None:
        import numpy

        numpy.random.seed(seed)


def new_namespace(name="__learner__"):
    return {"__name__": name}


WORK_ROOT = "/home/pyodide"


def reset_runtime():
    """Clears state a previous run left behind: open figures, learner modules and
    files under the home directory, and their sys.path entries. Library state
    such as NumPy's RNG is handled by seed_everything(), not here."""
    import os
    import shutil
    import sys

    if "matplotlib.pyplot" in sys.modules:
        import matplotlib.pyplot as plt

        plt.close("all")
    for name, module in list(sys.modules.items()):
        origin = getattr(module, "__file__", None) or ""
        if origin.startswith(WORK_ROOT + "/"):
            del sys.modules[name]
    sys.path[:] = [entry for entry in sys.path if not entry.startswith(WORK_ROOT)]
    if os.path.isdir(WORK_ROOT):
        for entry in os.listdir(WORK_ROOT):
            path = os.path.join(WORK_ROOT, entry)
            if os.path.isdir(path):
                shutil.rmtree(path, ignore_errors=True)
            else:
                os.remove(path)
