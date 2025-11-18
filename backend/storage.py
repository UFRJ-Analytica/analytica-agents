# backend/storage.py, substitua o topo do arquivo
import io
import os
from functools import lru_cache
from typing import Optional, Sequence

from urllib.parse import quote, urlparse, urlunparse

import pandas as pd
import requests

# Optional Supabase client (preferred when available)
try:
    from supabase import create_client  # type: ignore
except Exception:  # pragma: no cover
    create_client = None  # type: ignore

DATA_BACKEND = os.getenv("DATA_BACKEND", "local").lower()
DATA_URI = os.getenv("DATA_URI", "./backend/dados")
DATA_FORMAT = os.getenv("DATA_FORMAT", "parquet").lower()
if DATA_FORMAT not in {"parquet", "csv", "auto"}:
    DATA_FORMAT = "parquet"

SUPABASE_TOKEN = os.getenv("SUPABASE_STORAGE_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
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


def _candidate_formats() -> Sequence[str]:
    if DATA_FORMAT == "auto":
        return ("parquet", "csv")
    return (DATA_FORMAT,)


def _encode_uri_path(uri: str) -> str:
    try:
        parsed = urlparse(uri)
        segments = [quote(seg, safe='@:$&+,;=') for seg in parsed.path.split('/')]
        encoded_path = '/'.join(segments)
        return urlunparse(parsed._replace(path=encoded_path))
    except Exception:
        return uri.replace(' ', '%20')


def _make_path(name: str, fmt: str) -> str:
    base = FILEMAP[name]
    ext = ".parquet" if fmt == "parquet" else ".csv"
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
    if resp.status_code == 404:
        raise FileNotFoundError(f"Supabase Storage object not found at {path}")
    try:
        resp.raise_for_status()
    except requests.HTTPError as exc:
        raise requests.HTTPError(f"Supabase GET failed {resp.status_code} for URL: {path}") from exc
    return resp.content


def _read_supabase_api(base_name: str, fmt: str) -> Optional[bytes]:
    """Read object from Supabase Storage using the official client when available."""

    client = _get_supabase_client()
    if not client or not SUPABASE_BUCKET:
        return None

    ext = ".parquet" if fmt == "parquet" else ".csv"
    key = f"{base_name}{ext}"
    if SUPABASE_PREFIX:
        key = f"{SUPABASE_PREFIX}/{key}"

    try:
        data = client.storage.from_(SUPABASE_BUCKET).download(key)
    except Exception as exc:  # pragma: no cover - depends on Supabase runtime
        status = getattr(exc, "status", None)
        code = getattr(exc, "code", None)
        if status == 404 or code == "not_found":
            return None
        raise
    return data  # type: ignore[return-value]


def _read_frame_from_blob(blob: bytes, fmt: str, dtypes=None, parse_dates=None) -> pd.DataFrame:
    buffer = io.BytesIO(blob)
    if fmt == "parquet":
        return pd.read_parquet(buffer)
    return pd.read_csv(buffer, dtype=dtypes, parse_dates=parse_dates, low_memory=False)


def _read_frame_from_path(path: str, fmt: str, dtypes=None, parse_dates=None) -> pd.DataFrame:
    if fmt == "parquet":
        return pd.read_parquet(path)
    return pd.read_csv(path, dtype=dtypes, parse_dates=parse_dates, low_memory=False)


@lru_cache(maxsize=32)
def load_table(name: str, dtypes=None, parse_dates=None) -> pd.DataFrame:
    last_error: Optional[Exception] = None
    for fmt in _candidate_formats():
        try:
            if DATA_BACKEND == "supabase":
                blob = _read_supabase_api(FILEMAP[name], fmt)
                if blob is None:
                    path = _make_path(name, fmt)
                    blob = _read_supabase(path)
                return _read_frame_from_blob(blob, fmt, dtypes=dtypes, parse_dates=parse_dates)

            path = _make_path(name, fmt)
            return _read_frame_from_path(path, fmt, dtypes=dtypes, parse_dates=parse_dates)
        except FileNotFoundError as err:
            last_error = err
            if DATA_FORMAT != "auto":
                break
        except requests.HTTPError as err:
            last_error = err
            if DATA_FORMAT != "auto":
                break
        except ImportError as err:
            raise RuntimeError(
                "Parquet engine ausente. Instale as dependencias necesarias, por exemplo `pip install pyarrow s3fs`."
            ) from err
        except Exception as err:
            last_error = err
            if DATA_FORMAT != "auto":
                break

    raise RuntimeError(
        f"Nao foi possivel carregar '{name}' usando os formatos candidatos {_candidate_formats()}. Ultimo erro: {last_error}"
    ) from last_error
