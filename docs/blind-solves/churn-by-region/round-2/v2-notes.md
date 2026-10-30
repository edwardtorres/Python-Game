# Notes: churn_by_region

- Rule 1 (drop repeated customer_id, keep first): `drop_duplicates(subset="customer_id", keep="first")` runs before any counting, so the first row in file order wins.
- Rule 2 (missing region becomes 'unknown', its own group): `fillna("unknown")` on region before `groupby`, so the group is not dropped as NaN.
- Rule 3 (column order region, customers, churned, churn_rate): final `result[["region", "customers", "churned", "churn_rate"]]` selection.
- Rule 4 (churn_rate = churned / customers rounded to 4 decimals): customers is `nunique` of customer_id per region, churned is the sum of a 0/1 flag for `churned == 1`, and `churn_rate` is `(churned / customers).round(4)`.
- Rule 5 (sort churn_rate high to low, then region A to Z): `sort_values(["churn_rate", "region"], ascending=[False, True])`, applied after rounding so ties at 4 decimals fall to region order.
- Rule 6 (index 0, 1, 2, ...): `reset_index(drop=True)` after sorting.
- Rule 7 (customers and churned are int64): explicit `astype("int64")` on both counts.

Assumptions:
- "Missing" means pandas missing values (NaN or None). An empty string or whitespace-only region is not treated as missing.
- Region sort uses pandas default string ordering, which is code-point order and therefore case-sensitive.
- customers counts unique customer_id values per region. This matches the row count after dedupe unless customer_id itself is missing.

Verification: solution.py matches an independent plain-Python reference on the visible export (west 42/14/0.3333, south 34/11/0.3235, unknown 8/2/0.2500, north 27/6/0.2222, east 39/8/0.2051), and returns the right columns and int64 counts on empty input. Test script: check_solution.py in the same folder.
