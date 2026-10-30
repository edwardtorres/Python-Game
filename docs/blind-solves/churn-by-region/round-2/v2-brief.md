# Blind solve brief: Churn rate by region

From: Tomas Reyes, Retention Analytics
Subject: Churn by region for Monday

The customer export has repeated rows, and some customers have no region. I need one summary table per region for the Monday review. The notebook has the visible export loaded as customers. Write churn_by_region(df) in the last cell, and check the rules before you submit.

## Rules
1. Remove repeated customer_id rows, keeping the first one.
2. A missing region becomes the text 'unknown', and it is a group of its own.
3. Return the columns in this order: region, customers, churned, churn_rate.
4. churn_rate is churned / customers, rounded to 4 decimals.
5. Sort by churn_rate from highest to lowest, then by region from A to Z.
6. The index runs 0, 1, 2, and so on.
7. customers and churned are 64-bit integers (int64).

## Entry point
Write the function `churn_by_region` in a file named solution.py. Keep its name and arguments.

## Skeleton you start from
```python
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
    pass
```

## Notebook
The visible export is loaded as customers. Its CSV follows.

```csv
customer_id,region,plan,tenure_months,monthly_charge,churned
C0001,east,pro,47,89.46,0
C0002,south,basic,50,23.83,0
C0003,north,pro,27,82.46,0
C0004,south,pro,17,82.84,0
C0005,west,basic,63,36.99,0
C0006,west,pro,23,73.74,1
C0007,west,plus,37,55.58,0
C0008,east,pro,4,84.21,0
C0009,south,pro,44,90.3,1
C0010,east,pro,46,83.43,0
C0011,west,pro,71,84.52,0
C0012,south,plus,32,53.9,0
C0013,west,basic,50,20.66,1
C0014,,basic,57,24.59,1
C0015,south,basic,27,28.06,0
C0016,east,basic,8,26.03,1
C0017,east,plus,45,54.68,1
C0018,south,basic,20,34.9,1
C0019,east,pro,66,86.36,0
C0020,south,plus,42,67,0
C0021,south,plus,33,47,0
C0022,north,basic,58,27.57,0
C0023,west,plus,71,62.64,0
C0058,west,basic,30,31.4,0
C0024,east,basic,27,22.53,0
C0025,west,basic,5,32.54,1
C0026,west,pro,42,81.13,0
C0027,south,pro,47,90.13,0
C0028,west,pro,65,81.92,0
C0029,east,plus,49,58.17,0
C0030,east,pro,23,77.85,0
C0031,north,pro,41,87.74,0
C0032,north,pro,13,82,0
C0033,north,plus,12,50.71,0
C0034,east,pro,29,90.1,1
C0129,south,pro,8,91.65,1
C0035,west,basic,39,40.29,1
C0036,north,pro,20,86.62,0
C0037,south,plus,19,45.11,1
C0038,south,basic,40,24.86,0
C0039,west,basic,9,25.95,1
C0040,east,plus,36,45.08,0
C0041,east,plus,40,61.53,0
C0042,south,plus,37,49.22,0
C0043,west,pro,43,91.72,0
C0044,west,pro,42,98.98,0
C0045,south,pro,7,90.69,0
C0046,west,plus,38,53.2,0
C0047,east,plus,41,57.52,0
C0048,east,pro,13,101.27,0
C0049,north,basic,46,19.95,0
C0050,west,plus,15,57.17,0
C0051,west,basic,3,37.88,1
C0052,west,pro,1,89.08,0
C0053,west,plus,71,59.89,0
C0054,south,basic,5,24.81,1
C0055,south,basic,45,17.62,0
C0056,north,plus,12,48.98,1
C0057,east,pro,33,91.98,0
C0058,west,basic,30,31.4,0
C0059,north,basic,71,33.39,1
C0060,west,basic,31,18.49,0
C0061,south,pro,61,86.67,0
C0062,,pro,40,85.4,0
C0063,north,pro,49,88.03,0
C0064,north,pro,67,76.03,0
C0065,west,pro,32,91.05,1
C0066,north,basic,8,39.27,1
C0067,east,plus,31,60.07,1
C0068,west,basic,46,27.27,1
C0069,north,pro,27,90.02,0
C0070,east,plus,69,46.5,0
C0071,east,pro,48,85.26,0
C0072,south,plus,51,54.27,0
C0073,west,pro,65,93.42,1
C0074,east,plus,13,50.48,0
C0075,west,plus,60,51.85,0
C0076,west,basic,26,31.31,0
C0077,east,plus,55,57.32,0
C0078,,basic,53,32.49,0
C0079,east,pro,58,98.95,0
C0080,west,pro,36,95.49,0
C0081,east,pro,44,95.98,0
C0082,south,basic,12,26.69,1
C0083,south,plus,37,51.19,1
C0084,east,pro,59,86.49,0
C0085,east,plus,4,48.12,0
C0086,east,basic,12,33.05,0
C0087,south,pro,36,90.61,0
C0088,,pro,9,90.31,1
C0100,west,pro,13,93.39,0
C0089,east,plus,32,55.39,0
C0090,west,pro,34,103.54,0
C0091,north,basic,63,20.41,0
C0092,south,plus,67,49.39,0
C0093,west,pro,54,86,0
C0094,south,plus,47,51,0
C0095,south,basic,32,20.1,1
C0096,,pro,33,89.54,0
C0097,east,basic,22,34.94,0
C0010,east,pro,46,83.43,0
C0098,west,pro,21,100.91,0
C0118,north,pro,21,96.1,0
C0099,east,basic,45,28.21,0
C0100,west,pro,13,93.39,0
C0101,east,plus,35,47.65,0
C0102,east,basic,23,29.65,1
C0103,west,plus,11,48.98,0
C0104,west,basic,2,38.37,0
C0105,south,plus,13,52.32,1
C0106,north,basic,68,21.38,1
C0107,south,basic,47,33.03,1
C0108,west,basic,60,34.65,0
C0025,west,basic,5,32.54,1
C0127,east,plus,21,50.53,1
C0109,,basic,62,24.47,0
C0110,,basic,72,27.03,0
C0111,south,basic,40,28.19,0
C0112,south,plus,4,49.77,0
C0113,west,plus,18,54.16,1
C0114,west,pro,38,84.64,0
C0115,west,plus,71,50.78,0
C0040,east,plus,36,45.08,0
C0116,east,plus,37,53.31,0
C0117,north,pro,11,92.51,0
C0118,north,pro,21,96.1,0
C0119,south,pro,39,85.06,0
C0120,north,plus,29,59.08,0
C0121,east,plus,46,50.28,1
C0122,east,pro,66,99.43,0
C0123,west,pro,53,88.81,1
C0124,north,basic,31,28.74,0
C0125,west,plus,32,63.23,1
C0126,south,pro,58,92.41,0
C0127,east,plus,21,50.53,1
C0128,north,pro,47,90.96,0
C0129,south,pro,8,91.65,1
C0130,east,basic,47,27.66,0
C0131,west,plus,22,54.63,1
C0132,north,basic,57,27.67,0
C0133,west,plus,28,41.7,0
C0134,east,pro,8,87.14,0
C0135,east,basic,51,28.84,0
C0136,west,basic,48,32.69,0
C0137,south,basic,42,30.68,1
C0138,north,basic,41,24.31,0
C0139,north,plus,68,51.14,0
C0140,south,pro,43,85.22,0
C0141,south,plus,46,61.04,0
C0142,,plus,44,60.01,0
C0143,north,basic,71,29.09,1
C0144,north,plus,54,53.91,1
C0145,east,pro,10,92.81,1
C0146,east,basic,7,26.43,0
C0147,north,plus,15,53.48,0
C0148,west,basic,28,21.34,1
C0149,south,pro,32,78.34,0
C0150,north,pro,9,89.31,0
```

Your function receives a DataFrame with the same columns as this export.
