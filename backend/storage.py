# backend/storage.py, substitua o topo do arquivo
import io
import os
from functools import lru_cache
from typing import Optional

from urllib.parse import urlparse, urlunparse, quote

import pandas as pd
import requests

# Optional Supabase client (preferred when available)
try:
    from supabase import create_client  # type: ignore
except Exception:  # pragma: no cover
    create_client = None  # type: ignore

DATA_BACKEND = os.getenv("DATA_BACKEND", "local").lower()
DATA_URI     = os.getenv("DATA_URI", "./backend/dados")
DATA_FORMAT  = os.getenv("DATA_FORMAT", "parquet").lower()

SUPABASE_TOKEN = os.getenv("SUPABASE_STORAGE_TOKEN")
SUPABASE_URL   = os.getenv("SUPABASE_URL")
SUPABASE_KEY   = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")
SUPABASE_PREFIX = os.getenv("SUPABASE_PREFIX", "").strip("/")

_SB_CLIENT = None

def _get_supabase_client():
    global _SB_CLIENT
    if _SB_CLIENT is not None:
        return _SB_CLIENT
    if create_client and SUPABASE_URL and SUPABASE_KEY:
        _SB_CLIENT = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _SB_CLIENT

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

def _encode_uri_path(uri: str) -> str:
    try:
        p = urlparse(uri)
        segs = [quote(seg, safe='@:$&+,;=') for seg in p.path.split('/')]
        enc_path = '/'.join(segs)
        return urlunparse(p._replace(path=enc_path))
    except Exception:
        return uri.replace(' ', '%20')


def _make_path(name: str) -> str:
    base = FILEMAP[name]
    ext = ".parquet" if DATA_FORMAT == "parquet" else ".csv"
    if DATA_BACKEND in {"s3", "supabase"}:
        base_uri = DATA_URI.rstrip('/')
        if DATA_BACKEND == "supabase":
            base_uri = _encode_uri_path(base_uri)
        return f"{base_uri}/{base}{ext}"
    return os.path.join(DATA_URI, f"{base}{ext}")

def _read_supabase(path: str) -> bytes:
    headers = {}
    if SUPABASE_TOKEN:
        token = SUPABASE_TOKEN.strip()
        if token:
            headers["Authorization"] = f"Bearer {token}"
    resp = requests.get(path, headers=headers, timeout=60)
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        raise requests.HTTPError(f"Supabase GET failed {resp.status_code} for URL: {path}") from e
    return resp.content


def _read_supabase_api(base_name: str) -> Optional[bytes]:
    """Read object from Supabase Storage using official client if configured.

    Returns bytes or None if client is not configured.
    """
    client = _get_supabase_client()
    if not client or not SUPABASE_BUCKET:
        return None
    ext = ".parquet" if DATA_FORMAT == "parquet" else ".csv"
    key = f"{base_name}{ext}"
    if SUPABASE_PREFIX:
        key = f"{SUPABASE_PREFIX}/{key}"
    # supabase-py v2 returns bytes from download
    data = client.storage.from_(SUPABASE_BUCKET).download(key)
    return data  # type: ignore[return-value]

@lru_cache(maxsize=32)
def load_table(name: str, dtypes=None, parse_dates=None) -> pd.DataFrame:
    path = _make_path(name)
    if DATA_BACKEND == "supabase":
        # Try client first (handles private/public buckets and avoids URL encoding issues)
        blob = _read_supabase_api(FILEMAP[name])
        if blob is None:
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
