from google.cloud import bigquery

# Se você já fez "gcloud auth application-default login",
# isto funciona sem setar GOOGLE_APPLICATION_CREDENTIALS.
client = bigquery.Client(project="rj-sms-sandbox")

def peek(table="marcacao", limit=5):
    sql = f"SELECT * FROM `rj-sms-sandbox.hackathon_coppe.{table}` LIMIT {limit}"
    print(client.query(sql).to_dataframe())
    return client.query(sql).to_dataframe()
