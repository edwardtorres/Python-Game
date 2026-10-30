# Notes: churn_by_region

- Rule 1 (dedupe on customer_id, keep first): `df.drop_duplicates(subset="customer_id", keep="first")` runs before any counting.
- Rule 2 (missing region is 'unknown', its own group): `fillna("unknown")` on region, which covers NaN and None, so the group is counted like any other region.
- Rule 3 (column order region, customers, churned, churn_rate): the final selection is `summary[["region", "customers", "churned", "churn_rate"]]`.
- Rule 4 (customers, churned, churn_rate): customers is the row count per region after dedupe (one row per customer); churned counts rows where `churned == 1`; churn_rate is `(churned / customers).round(4)`.
- Rule 5 (sort by churn_rate descending, then region A to Z): `sort_values(by=["churn_rate", "region"], ascending=[False, True])` on the rounded column, so rounding ties are broken by region.
- Rule 6 (index 0, 1, 2, ...): `reset_index(drop=True)` at the end.

Assumptions:
- Region values are matched exactly. No stripping, lowercasing, or other normalisation, since the brief asks for no extra behaviour. An empty string is not treated as missing; only NaN and None are.
- "A to Z" is taken as pandas' default string order (plain code-point order, so uppercase sorts before lowercase).
- churned is compared with `== 1` exactly, as the rule states.

Testing: a hand-checked 12-row case covering a duplicate, a None region, and a three-way churn_rate tie, plus 200 random frames checked against a pure-Python reference. All passed under pandas 3.0.5.
