import type { ChallengeSpec } from '../types';

// A pandas task (Data). Notebook mode: the visible export is loaded in the first cell,
// and Submit grades the definitions in your cells in a fresh namespace.
const REFERENCE = `import pandas as pd


def churn_by_region(df):
    unique = df.drop_duplicates(subset="customer_id", keep="first").copy()
    unique["region"] = unique["region"].fillna("unknown")
    summary = (
        unique.groupby("region", dropna=False)
        .agg(customers=("customer_id", "size"), churned=("churned", "sum"))
        .reset_index()
    )
    summary["churn_rate"] = (summary["churned"] / summary["customers"]).round(4)
    summary = summary.sort_values(["churn_rate", "region"], ascending=[False, True])
    summary = summary.reset_index(drop=True)
    return summary[["region", "customers", "churned", "churn_rate"]]
`;

const STARTER = `def churn_by_region(df):
    """Summarise churn by region for the Monday retention review.

    Rules:
    1. Remove repeated customer_id rows, keeping the first one.
    2. A missing region becomes the text 'unknown', and it is a group of its own.
    3. Return the columns in this order: region, customers, churned, churn_rate.
    4. customers is the number of unique customers in the region, churned is how many of
       them have churned == 1, and churn_rate is churned / customers rounded to 4 decimals.
    5. Sort by churn_rate from highest to lowest, then by region from A to Z.
    6. The index runs 0, 1, 2, and so on.
    7. customers and churned are 64-bit integers (int64).
    """
    pass
`;

const DUPLICATES_KEPT = REFERENCE.replace('unique = df.drop_duplicates(subset="customer_id", keep="first").copy()', 'unique = df.copy()');
const MISSING_DROPPED = REFERENCE.replace('unique["region"] = unique["region"].fillna("unknown")', 'unique = unique.dropna(subset=["region"])');
const GROUPBY_TRAP = REFERENCE.replace('    unique["region"] = unique["region"].fillna("unknown")\n', '').replace('dropna=False', 'dropna=True');
const NOT_ROUNDED = REFERENCE.replace('.round(4)', '');
const ASCENDING = REFERENCE.replace('ascending=[False, True]', 'ascending=[True, True]');
const NO_RESET = REFERENCE.replace('    summary = summary.reset_index(drop=True)\n', '');
const WRONG_COLUMNS = REFERENCE.replace('[["region", "customers", "churned", "churn_rate"]]', '[["region", "churned", "customers", "churn_rate"]]');

export const churnByRegion: ChallengeSpec = {
  id: 'churn-by-region',
  chapterId: 'c07-pandas',
  title: 'Churn rate by region',
  kind: 'pandas',
  notebook: true,
  ticket: {
    from: 'Tomas Reyes, Retention Analytics',
    subject: 'Churn by region for Monday',
    body: 'The customer export has repeated rows, and some customers have no region. I need one summary table per region for the Monday review. The notebook has the visible export loaded as customers. Write churn_by_region(df) in the last cell, and check the rules before you submit.',
  },
  rules: [
    'Remove repeated customer_id rows, keeping the first one.',
    "A missing region becomes the text 'unknown', and it is a group of its own.",
    'Return the columns in this order: region, customers, churned, churn_rate.',
    'churn_rate is churned / customers, rounded to 4 decimals.',
    'Sort by churn_rate from highest to lowest, then by region from A to Z.',
    'The index runs 0, 1, 2, and so on.',
    'customers and churned are 64-bit integers (int64).',
  ],
  entry: 'churn_by_region',
  starter: STARTER,
  setupCell: "customers = load_dataset('customers')\ncustomers.head()\n",
  competencies: ['select-filter', 'clean-missing', 'clean-duplicates', 'groupby-agg', 'method-chaining'],
  datasets: [
    { name: 'customers', generator: 'churn', seed: 101, rows: 150, visibility: 'visible' },
    { name: 'customers_hidden_1', generator: 'churn', seed: 202, rows: 150, visibility: 'hidden' },
    { name: 'customers_hidden_2', generator: 'churn', seed: 303, rows: 80, visibility: 'hidden' },
  ],
  cases: [
    { id: 'v-export', label: 'The visible export', visibility: 'visible', dataset: 'customers' },
    { id: 'h-second-export', label: 'A second export', visibility: 'hidden', dataset: 'customers_hidden_1' },
    { id: 'h-small-export', label: 'A small export', visibility: 'hidden', dataset: 'customers_hidden_2' },
  ],
  rulesForGrader: { check_dtype: true, tolerance: 1e-9 },
  reference: REFERENCE,
  variants: [
    {
      id: 'duplicates-kept',
      code: DUPLICATES_KEPT,
      mistake: { tag: 'duplicates', title: 'Repeated customers were counted twice', explanation: 'Rule 1 removes repeated customer_id rows. Without that step, a customer who appears twice inflates the counts and the churn rate.' },
    },
    {
      id: 'missing-dropped',
      code: MISSING_DROPPED,
      mistake: { tag: 'missing-data', title: 'Customers without a region disappeared', explanation: "Rule 2 keeps those customers as an 'unknown' group. dropna() removes them, so the totals no longer match the export." },
    },
    {
      id: 'groupby-dropna-trap',
      code: GROUPBY_TRAP,
      mistake: { tag: 'groupby-dropna', title: 'groupby quietly dropped the missing regions', explanation: 'groupby() drops NaN keys by default (dropna=True). Fill the missing region before grouping, or set dropna=False deliberately.' },
    },
    {
      id: 'rate-not-rounded',
      code: NOT_ROUNDED,
      mistake: { tag: 'rounding', title: 'churn_rate was not rounded', explanation: 'Rule 4 asks for 4 decimals. Without round(4), the rate keeps every digit the division produces.' },
    },
    {
      id: 'sorted-ascending',
      code: ASCENDING,
      mistake: { tag: 'ordering', title: 'Sorted the wrong way', explanation: 'Rule 5 sorts the highest churn rate first. ascending=True puts the lowest first.' },
    },
    {
      id: 'index-not-reset',
      code: NO_RESET,
      mistake: { tag: 'index', title: 'The index was left scrambled', explanation: 'After sort_values(), the index keeps the old row labels. Rule 6 asks for 0, 1, 2, and so on, so call reset_index(drop=True).' },
    },
    {
      id: 'int32-counts',
      code: REFERENCE.replace('summary = summary.reset_index(drop=True)\n', 'summary = summary.reset_index(drop=True).astype({"customers": int, "churned": int})\n'),
      mistake: { tag: 'dtype', title: 'Counts came out as 32-bit integers', explanation: 'Rule 7 asks for 64-bit integers. In this browser the Python engine is 32-bit, so a bare int gives int32 here, while the same code gives int64 on most laptops. Name the width explicitly, as int64.' },
    },
    {
      id: 'columns-reordered',
      code: WRONG_COLUMNS,
      mistake: { tag: 'columns', title: 'Columns in the wrong order', explanation: 'Rule 3 fixes the column order. pandas compares columns by position, so swapping two of them fails even when the values are right.' },
    },
  ],
  variantRule: {
    'duplicates-kept': 0,
    'missing-dropped': 1,
    'groupby-dropna-trap': 1,
    'rate-not-rounded': 3,
    'sorted-ascending': 4,
    'index-not-reset': 5,
    'columns-reordered': 2,
    'int32-counts': 6,
  },
  hints: [
    'Decide what one row of the answer means: one region. Which customers should count toward that row?',
    'Remove repeated customers first, then fill the missing regions, then group by region and count. Round the rate last.',
    'Start like this:\n\n    unique = df.drop_duplicates(subset="customer_id", keep="first")\n    # fill the missing regions, group, then sort and reset the index',
  ],
};
