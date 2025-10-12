# backend/storage.py
import os
from functools import lru_cache
from typing import Dict, Optional
import pandas as pd

DATA_BACKEND = os.getenv("DATA_BACKEND", "local").lower()   # local | s3
DATA_URI     = os.getenv("DATA_URI", "./backend/dados")     # pasta local ou s3://bucket/prefix
DATA_FORMAT  = os.getenv("DATA_FORMAT", "parquet").lower()  # parquet | csv

# nomes "lógicos" -> arquivo físico
FILEMAP: Dict[str, str] = {
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
    "profissional": "profissional_historico",  # alias útil
}

def _make_path(logical_name: str) -> str:
    base = FILEMAP[logical_name]
    ext  = ".parquet" if DATA_FORMAT == "parquet" else ".csv"
    if DATA_BACKEND == "s3":
        # s3fs/fsspec suporta URIs s3://
        return f"{DATA_URI.rstrip('/')}/{base}{ext}"
    else:
        return os.path.join(DATA_URI, f"{base}{ext}")

@lru_cache(maxsize=32)
def load_table(name: str,
               dtypes: Optional[dict] = None,
               parse_dates: Optional[list] = None) -> pd.DataFrame:
    path = _make_path(name)
    if DATA_FORMAT == "parquet":
        # pandas usa pyarrow; para S3 precisa de s3fs instalado
        return pd.read_parquet(path)
    else:
        return pd.read_csv(path, dtype=dtypes, parse_dates=parse_dates, low_memory=False)
