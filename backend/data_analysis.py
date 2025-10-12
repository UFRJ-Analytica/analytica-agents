from google.cloud import bigquery
import pandas as pd
import os

def run_query(sql: str) -> pd.DataFrame:
    client = bigquery.Client(project="rj-sms-sandbox")
    query_job = client.query(sql)
    df = query_job.result().to_dataframe()
    return df


def exploratory_summary(table="marcacao", limit=1000):
    sql = f"""
    SELECT *
    FROM `rj-sms-sandbox.hackathon_coppe.{table}`
    LIMIT {limit}
    """
    df = run_query(sql)
    return {
        "shape": df.shape,
        "columns": df.columns.tolist(),
        "nulls": df.isnull().sum().to_dict(),
        "sample": df.head(5).to_dict(orient="records")
    }
