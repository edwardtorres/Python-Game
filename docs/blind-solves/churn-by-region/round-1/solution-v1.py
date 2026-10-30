def churn_by_region(df):
    """Summarise churn by region for the Monday retention review.

    Rules:
    1. Remove repeated customer_id rows, keeping the first one.
    2. A missing region becomes the text 'unknown', and it is a group of its own.
    3. Return the columns in this order: region, customers, churned, churn_rate.
    4. customers is the number of unique customers in the region, churned is how many of
       them have churned == 1, and churn_rate is churned / customers rounded to 4 decimals.
    5. Sort by churn_rate from highest to lowest, then by region from A to Z.
    6. The index runs 0, 1, 2, and so on.
    """
    # Rule 1: keep the first row for each customer_id, across the whole export.
    unique = df.drop_duplicates(subset='customer_id', keep='first').copy()

    # Rule 2: a missing region becomes 'unknown', which then groups like any other value.
    unique['region'] = unique['region'].fillna('unknown')

    # Helper flag: 1 when the customer has churned == 1, else 0.
    unique['_is_churned'] = (unique['churned'] == 1).astype(int)

    # Rule 4 inputs: unique customers per region, and churned customers per region.
    summary = unique.groupby('region', as_index=False).agg(
        customers=('customer_id', 'size'),
        churned=('_is_churned', 'sum'),
    )

    # Rule 4: churn_rate = churned / customers, rounded to 4 decimals.
    summary['churn_rate'] = (summary['churned'] / summary['customers']).round(4)

    # Rule 3: column order.
    summary = summary[['region', 'customers', 'churned', 'churn_rate']]

    # Rule 5: highest churn_rate first, ties broken by region A to Z.
    summary = summary.sort_values(by=['churn_rate', 'region'], ascending=[False, True])

    # Rule 6: index 0, 1, 2, ...
    return summary.reset_index(drop=True)
