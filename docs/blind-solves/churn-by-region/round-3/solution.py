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
    """
    unique = df.drop_duplicates(subset="customer_id", keep="first")
    frame = pd.DataFrame(
        {
            "region": unique["region"].fillna("unknown").to_numpy(),
            "churned_flag": (unique["churned"] == 1).astype(int).to_numpy(),
        }
    )
    summary = (
        frame.groupby("region")
        .agg(customers=("churned_flag", "size"), churned=("churned_flag", "sum"))
        .reset_index()
    )
    summary["churn_rate"] = (summary["churned"] / summary["customers"]).round(4)
    summary = summary[["region", "customers", "churned", "churn_rate"]]
    summary = summary.sort_values(by=["churn_rate", "region"], ascending=[False, True])
    return summary.reset_index(drop=True)
