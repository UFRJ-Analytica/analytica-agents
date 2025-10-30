# backend/storage.py, substitua o topo do arquivo
import io
import os
from functools import lru_cache
from typing import Optional

import pandas as pd
import requests

DATA_BACKEND = os.getenv("DATA_BACKEND", "local").lower()
DATA_URI     = os.getenv("DATA_URI", "./backend/dados")
DATA_FORMAT  = os.getenv("DATA_FORMAT", "parquet").lower()

SUPABASE_TOKEN = os.getenv("SUPABASE_STORAGE_TOKEN")

FILEMAP = {
    "marcacao": "marcacao",
    "solicitacao": "solicitacao",
    "tempo_espera": "tempo_espera",
    "profissional_historico": "profissional_historico",
    "unidade_historico": "unidade_historico",
    "oferta_programada": "oferta_programada",
    "cid": "cids",
    "procedimento": "procedimento",
    "equipamento_historico": "equipamento_historico",
    "leito_historico": "leito_historico",
    "habilitacao_historico": "habilitacao_historico",
}

def _make_path(name: str) -> str:
    base = FILEMAP[name]
    ext = ".parquet" if DATA_FORMAT == "parquet" else ".csv"
    if DATA_BACKEND in {"s3", "supabase"}:
        return f"{DATA_URI.rstrip('/')}/{base}{ext}"
    return os.path.join(DATA_URI, f"{base}{ext}")

def _read_supabase(path: str) -> bytes:
    headers = {}
    if SUPABASE_TOKEN:
        token = SUPABASE_TOKEN.strip()
        if token:
            headers["Authorization"] = f"Bearer {token}"
    resp = requests.get(path, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp.content

@lru_cache(maxsize=32)
def load_table(name: str, dtypes=None, parse_dates=None) -> pd.DataFrame:
    path = _make_path(name)
    if DATA_BACKEND == "supabase":
        blob = _read_supabase(path)
        if DATA_FORMAT == "parquet":
            return pd.read_parquet(io.BytesIO(blob))
        return pd.read_csv(io.BytesIO(blob), dtype=dtypes, parse_dates=parse_dates, low_memory=False)

    if DATA_FORMAT == "parquet":
        return pd.read_parquet(path)
    return pd.read_csv(path, dtype=dtypes, parse_dates=parse_dates, low_memory=False)
    path = _make_path(name)
    try:
        if DATA_FORMAT == "parquet":
            # pandas detecta pyarrow automaticamente quando instalado
            return pd.read_parquet(path)
        else:
            return pd.read_csv(path, dtype=dtypes, parse_dates=parse_dates, low_memory=False)
    except ImportError as e:
        raise RuntimeError(
            "Parquet engine ausente. Instale as dependências: `pip install pyarrow s3fs`."
        ) from e
