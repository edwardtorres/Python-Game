// The mistake taxonomy. Every wrong variant and every common-mistake note uses one of
// these tags, so feedback can name the mistake and review can count them.
import type { Mistake } from '../../engine/types';

function mistake(tag: string, title: string, explanation: string): Mistake {
  return { tag, title, explanation };
}

export const MISTAKES = {
  MUTABLE_DEFAULT: mistake('MUTABLE_DEFAULT', 'A default list is shared between calls', 'A default value is created once, when the function is defined. A list or dict default is the same object on every call, so changes carry over.'),
  OFF_BY_ONE_RANGE: mistake('OFF_BY_ONE_RANGE', 'range() stops before its end', 'range(a, b) stops before b, and range(n) starts at 0. Off-by-one loops skip the first or last item.'),
  INT_DIVISION: mistake('INT_DIVISION', '/ always gives a float', 'In Python 3, / gives a float even when the result is whole. Use // for floor division when you need an int.'),
  ALIASING_COPY: mistake('ALIASING_COPY', 'Two names can point to one list', 'Assigning a list to another name copies the reference, not the list. Changing one name changes the other. Make a copy when the caller must keep its list.'),
  TRUTHINESS: mistake('TRUTHINESS', 'Empty values are false', 'An empty list, string, dict, or 0 is false in an if test. Check the value you mean, such as len(items) == 0 or items is None.'),
  STR_IMMUTABLE: mistake('STR_IMMUTABLE', 'Strings cannot change in place', 'Methods such as upper() return a new string. The original stays the same, so the result must be stored or returned.'),
  KEYERROR_VS_GET: mistake('KEYERROR_VS_GET', 'A missing dict key raises KeyError', 'd[key] raises KeyError when the key is missing. d.get(key, default) returns the default instead. Pick the one that matches the rule.'),
  EXCEPTION_TOO_BROAD: mistake('EXCEPTION_TOO_BROAD', 'A broad except hides other bugs', 'except Exception catches every ordinary error, including ones you did not expect. Catch the error you mean, such as ValueError.'),
  IS_VS_EQUALS: mistake('IS_VS_EQUALS', 'is checks identity, == checks value', 'x is y is true only when both names refer to the same object. Use == to compare values, and is for None.'),
  DICT_ORDER_ASSUMPTION: mistake('DICT_ORDER_ASSUMPTION', 'Dict order is insertion order', 'A dict keeps the order its keys were added. It is not sorted. Sort explicitly when the output needs an order.'),
  SET_ORDER_ASSUMPTION: mistake('SET_ORDER_ASSUMPTION', 'A set is not a list', 'A set removes duplicates and has no positions to index. Use sorted() when the output must be ordered, and expect the size to drop when duplicates go.'),
  OPERATOR_MIXUP: mistake('OPERATOR_MIXUP', '% is the remainder, not the quotient', '// gives the whole-number quotient, % gives the remainder. Reading one as the other changes the answer.'),
  INT_FROM_TEXT: mistake('INT_FROM_TEXT', 'int() cannot read a decimal point', 'int("12.5") raises ValueError. Use float() for decimal text, then convert with int() if you need a whole number.'),
  TEXT_PLUS_NUMBER: mistake('TEXT_PLUS_NUMBER', 'Text and numbers do not join with +', 'Adding text to a number raises TypeError. Convert the number with str(), or use an f-string, to build the text.'),
  PAIR_ORDER: mistake('PAIR_ORDER', 'A pair is written from, then to', 'Keep each pair in trip order. Swapping the two values gives a valid tuple with the wrong meaning.'),
  SINGLE_STOP_EDGE: mistake('SINGLE_STOP_EDGE', 'A one-stop trip has no pairs', 'A pair needs two neighbouring stops. Slicing stops[1:] handles a single stop without a special case.'),
  NO_FALLBACK: mistake('NO_FALLBACK', 'Expected failures need a fallback', 'When the rule says to return None for bad text, catch the ValueError that float() raises for it. Let other errors through.'),
  SLICE_DROPS_LAST: mistake('SLICE_DROPS_LAST', 'items[:-1] leaves out the last item', 'A slice stops before its end index, so items[:-1] drops the last item. Build the new list from all the items.'),
  EMPTY_IS_NONE: mistake('EMPTY_IS_NONE', 'An empty total is 0, not None', 'Returning None for an empty input changes the answer type. Let the loop run zero times and return the starting value.'),
  SORTED_CHANGES_ORDER: mistake('SORTED_CHANGES_ORDER', 'sorted() reorders the items', 'sorted() puts items in order. Use it only when the rule asks for an order, and keep the caller order otherwise.'),
  CASE_SENSITIVE_KEYS: mistake('CASE_SENSITIVE_KEYS', 'Words that differ only by case are different keys', 'Dock and dock are different dict keys. Lower the words first when the rule says counting ignores case.'),
  SPLIT_ON_SPACE: mistake('SPLIT_ON_SPACE', 'split(" ") only splits on single spaces', 'split() with no argument splits on any run of whitespace, including tabs and repeated spaces. split(" ") does not.'),
  CONTAINER_SHAPE: mistake('CONTAINER_SHAPE', 'Return the shape the rule names', 'A list of pairs is not a dict, even when it holds the same counts. Check the return type the rule states.'),
  LOOP_INSTEAD: mistake('LOOP_INSTEAD', 'The ticket asks for a comprehension', 'A loop that appends gives the same result, but the ticket asks for a comprehension and no loop.'),
  WRONG_NAME: mistake('WRONG_NAME', 'The function must have the name the ticket gives', 'Another name is a different function. The grader and the callers look for the exact name.'),
  INSERT_AT_FRONT: mistake('INSERT_AT_FRONT', 'Adding at the front puts the item first', 'append() adds at the end, and insert(0, x) puts x first. Check where the rule wants the new item.'),
  BUILDS_LIST_NOT_YIELD: mistake('BUILDS_LIST_NOT_YIELD', 'yield gives values one at a time', 'Building a whole list first gives the same values, but the ticket asks for yield, which produces each value as it is needed.'),
  REVERSED_ORDER: mistake('REVERSED_ORDER', 'Reversing flips the order', 'Reversing a list or slicing with [::-1] puts the last item first. Keep the order the rule gives.'),
  FORMAT_SPEC: mistake('FORMAT_SPEC', 'The layout must match the rule exactly', 'A report line is checked character by character. Use the separator and order the rule names.'),
  UNCHECKED_ARGUMENT: mistake('UNCHECKED_ARGUMENT', 'A size or count must be checked before use', 'Without a check, a size of zero or less quietly gives a wrong answer. Raise ValueError for a value the function cannot use, as itertools.batched does.'),
  NON_FINITE_FLOAT: mistake('NON_FINITE_FLOAT', 'float() reads nan and inf', 'float("nan") and float("inf") are valid floats. They are not weights, so the ticket says to return None for them.'),
  PARTIAL_STRIP: mistake('PARTIAL_STRIP', 'strip(" ") removes spaces only', 'strip() with no argument removes every whitespace character. strip(" ") leaves tabs and line breaks in place.'),
  LINE_ENDINGS: mistake('LINE_ENDINGS', 'A text file keeps the characters you write', 'Lines are separated by line breaks you write yourself. Without them, lines run together. With them, a read keeps the breaks unless you strip them.'),
  IMPORT_NOT_FOUND: mistake('IMPORT_NOT_FOUND', 'A module must exist before it can be imported', 'import looks for the module by its exact name. A name that is misspelled, or a module that is not installed, raises ModuleNotFoundError.'),
  SINGLE_ELEMENT_TUPLE: mistake('SINGLE_ELEMENT_TUPLE', 'A one-item tuple needs a comma', '(x) is just x in parentheses. (x,) is a tuple with one item.'),
  GENERATOR_EXHAUSTED: mistake('GENERATOR_EXHAUSTED', 'A generator can be used once', 'A generator gives its values once. A second loop over the same generator gets nothing.'),
  MODULE_SIDE_EFFECT: mistake('MODULE_SIDE_EFFECT', 'Importing runs the module top to bottom', 'Top-level code in a module runs when the module is first imported. Keep prints and work inside functions or behind if __name__ == "__main__".'),
  MISSING_ARGUMENT: mistake('MISSING_ARGUMENT', 'A parameter with no default is required', 'A function parameter without a default must be given a value. Calling without it raises TypeError.'),
  WITH_CLOSE_ORDER: mistake('WITH_CLOSE_ORDER', 'The with block closes its file when it ends', 'Reading or writing after the with block is outside the block. The file is already closed, so the read raises ValueError.'),
  SCOPE_SHADOWING: mistake('SCOPE_SHADOWING', 'Assignment makes a name local', 'A name assigned inside a function is local to it. Assigning to a name without declaring it global does not change the outer name.'),
  COMPREHENSION_SIDE_EFFECT: mistake('COMPREHENSION_SIDE_EFFECT', 'A comprehension is for building a value', 'A comprehension should build a list, set, or dict. Calling append inside it hides the loop and makes the code harder to read.'),
} as const satisfies Record<string, Mistake>;

export type MistakeTag = keyof typeof MISTAKES;

export function mistakeFor(tag: MistakeTag): Mistake {
  return MISTAKES[tag];
}
