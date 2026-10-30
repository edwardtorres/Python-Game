"""Static Python 3.10 check for lesson and reference code.

Reads a JSON list of {"name": ..., "code": ...} from the file given as the argument, and
prints one line per problem. Exit status 1 means a snippet uses something Python 3.10
cannot run. The grammar check uses ast with feature_version=(3, 10). It misses nested
same-quote f-strings (Python 3.12), so those are found from the token stream. CI also
runs every snippet under a real Python 3.10 (see scripts/py310/run-cases.py).
"""

import ast
import io
import json
import sys
import tokenize

# Names added in Python 3.11 or later. A snippet that uses one must carry the
# "newer Python" label, so it is reported here and labelled in the lesson text.
NEWER_NAMES = {
    "tomllib",
    "ExceptionGroup",
    "BaseExceptionGroup",
    "Self",
    "Never",
    "LiteralString",
    "NotRequired",
    "Required",
    "StrEnum",
    "TaskGroup",
    "UTC",
    "assert_never",
    "batched",
}


def grammar_problems(code):
    try:
        ast.parse(code, feature_version=(3, 10))
    except SyntaxError as error:
        return [f"syntax newer than Python 3.10: {error.msg} (line {error.lineno})"]
    return []


def name_problems(code):
    tree = ast.parse(code)
    found = []
    for node in ast.walk(tree):
        names = []
        if isinstance(node, ast.Name):
            names.append(node.id)
        elif isinstance(node, ast.Attribute):
            names.append(node.attr)
        elif isinstance(node, ast.alias):
            names.append(node.name.split(".")[0])
            names.append(node.name.split(".")[-1])
        for name in names:
            if name in NEWER_NAMES:
                found.append(f"uses {name}, which needs Python 3.11 or later")
    return sorted(set(found))


def nested_same_quote_problems(code):
    """Nested same-quote f-strings are valid only from Python 3.12 (PEP 701)."""
    if not hasattr(tokenize, "FSTRING_START"):
        return []
    found = []
    stack = []
    for token in tokenize.generate_tokens(io.StringIO(code).readline):
        if token.type == tokenize.FSTRING_START:
            quote = token.string.lstrip("rRbBuUfF")
            if any(open_quote == quote for open_quote in stack):
                found.append("nests an f-string inside an f-string with the same quotes (Python 3.12)")
            stack.append(quote)
        elif token.type == tokenize.FSTRING_END:
            stack.pop()
        elif token.type == tokenize.STRING and stack:
            quote = token.string.lstrip("rRbBuUfF")[:1]
            if quote and quote == stack[-1][:1]:
                found.append("puts a string with the same quotes inside an f-string (Python 3.12)")
    return sorted(set(found))


def check(snippet):
    code = snippet["code"]
    problems = grammar_problems(code)
    if not problems:
        problems = name_problems(code) + nested_same_quote_problems(code)
    return problems


def main(path):
    with open(path, encoding="utf-8") as handle:
        snippets = json.load(handle)
    failures = 0
    for snippet in snippets:
        for problem in check(snippet):
            failures += 1
            print(f"{snippet['name']}: {problem}")
    print(f"check-py310: {len(snippets)} snippets, {failures} problems")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
