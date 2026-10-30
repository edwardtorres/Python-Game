1. Remove repeated customer_id rows, keeping the first one: `df.drop_duplicates(subset='customer_id', keep='first')`, run on the whole frame before any grouping or filling.
2. Missing region becomes 'unknown' and is its own group: `fillna('unknown')` on region, applied after de-duplication so the kept row is chosen by file order alone; 'unknown' then groups like any other value.
3. Columns in order region, customers, churned, churn_rate: final `summary[['region', 'customers', 'churned', 'churn_rate']]`.
4. customers = unique customers per region (row count after de-duplication, via `size`); churned = count of rows with churned == 1 (summed flag); churn_rate = (churned / customers).round(4).
5. Sort by churn_rate descending, then region ascending: `sort_values(['churn_rate', 'region'], ascending=[False, True])`, done after rounding so ties use the rounded value.
6. Index 0, 1, 2, ...: `reset_index(drop=True)` as the last step.

Assumptions:
- A missing region is any value pandas reads as missing (NaN, as produced by an empty CSV field). Blank or whitespace-only strings are not treated as missing, and region values are not stripped or case-folded.
- customers is counted as rows after de-duplication. This equals the number of unique customer_id values unless customer_id itself is missing; in that case only the first missing-id row survives de-duplication and is counted.
- No import is needed, because the function only calls DataFrame methods on the input.
- Tested on a small synthetic export (duplicates with a different region on the repeat, a missing region, rate ties, empty input). The visible 150-row CSV was not loaded into a file for testing.
