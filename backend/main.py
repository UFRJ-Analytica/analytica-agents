from fastapi import FastAPI, HTTPException, Query
from google.cloud import bigquery
import pandas as pd

app = FastAPI(title="Analytica Agents API")
bq = bigquery.Client(project="rj-sms-sandbox")

@app.get("/explore")
def explore(table: str = Query(...), limit: int = 50):
    try:
        sql = f"SELECT * FROM `rj-sms-sandbox.hackathon_coppe.{table}` LIMIT {limit}"
        df = bq.query(sql).to_dataframe()
        return {
            "table": table,
            "rows": len(df),
            "columns": df.columns.tolist(),
            "nulls": df.isnull().sum().to_dict(),
            "sample": df.head(5).to_dict(orient="records"),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/dengue/series")
def dengue_series(mes_ini: str, mes_fim: str, usar_agendado: bool = True):
    """
    mes_ini/mes_fim no formato YYYY-MM (ex.: 2024-01).
    Usa CID A90/A91 (dengue). Filtra por mês de data_solicitacao.
    """
    cid_col = "cid_agendado_id" if usar_agendado else "cid_solicitado_id"
    sql = f"""
    WITH dados AS (
      SELECT
        DATE_TRUNC(DATE(data_solicitacao), MONTH) AS mes,
        unidade_solicitante_id_cnes AS cnes,
        {cid_col} AS cid
      FROM `rj-sms-sandbox.hackathon_coppe.marcacao`
      WHERE {cid_col} IN ('A90','A91')  -- dengue clássica/hemorrágica (ICD-10)
        AND data_solicitacao IS NOT NULL
        AND DATE(data_solicitacao) BETWEEN DATE('{mes_ini}-01')
            AND LAST_DAY(DATE('{mes_fim}-01'))
    )
    SELECT
      mes,
      cnes,
      COUNT(*) AS qtd
    FROM dados
    GROUP BY mes, cnes
    ORDER BY mes, qtd DESC
    """
    try:
        df = bq.query(sql).to_dataframe()
        return {"query": sql, "rows": len(df), "data": df.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
