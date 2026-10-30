import pandas as pd


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
    7. customers and churned are 64-bit integers (int64).
    """
    # Rule 1: one row per customer_id, first occurrence kept.
    unique = df.drop_duplicates(subset="customer_id", keep="first").copy()

    # Rule 2: a missing region becomes 'unknown', which then groups like any other value.
    unique["region"] = unique["region"].fillna("unknown")

    # Helper flag: 1 for customers with churned == 1, else 0.
    unique["_is_churned"] = (unique["churned"] == 1).astype("int64")

    # Rule 4 counts: unique customers and churned customers per region.
    grouped = unique.groupby("region", sort=False).agg(
        customers=("customer_id", "nunique"),
        churned=("_is_churned", "sum"),
    )

    # Rule 7: 64-bit integer counts.
    grouped["customers"] = grouped["customers"].astype("int64")
    grouped["churned"] = grouped["churned"].astype("int64")

    result = grouped.reset_index()

    # Rule 4: churn rate rounded to 4 decimals.
    result["churn_rate"] = (result["churned"] / result["customers"]).round(4)

    # Rule 3: column order.
    result = result[["region", "customers", "churned", "churn_rate"]]

    # Rule 5: highest churn_rate first, ties broken by region A to Z.
    # Rule 6: fresh 0..n-1 index.
    result = result.sort_values(
        by=["churn_rate", "region"], ascending=[False, True]
    ).reset_index(drop=True)

    return result
