import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# ConstrÃ³i o caminho para o diretÃ³rio raiz do projeto (2 nÃ­veis acima de config.py)
# backend/susana/config.py -> backend/ -> ./
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DOTENV_PATH = PROJECT_ROOT / ".env"

# Carrega o .env a partir do caminho explÃ­cito
if DOTENV_PATH.exists():
    load_dotenv(dotenv_path=DOTENV_PATH)
else:
    # Opcional: log ou aviso de que o .env nÃ£o foi encontrado
    print(f"Aviso: arquivo .env nÃ£o encontrado em {DOTENV_PATH}")

JWT_SECRET = os.environ.get("JWT_SECRET", "CHANGE_ME_SECRET")
_alg = (os.environ.get("JWT_ALG", "HS256") or "").strip().upper()
_ALLOWED_JWT_ALGS = {
    "HS256", "HS384", "HS512",
    "RS256", "RS384", "RS512",
    "ES256", "ES384", "ES512",
    "PS256", "PS384", "PS512",
}
if _alg not in _ALLOWED_JWT_ALGS:
    print(f"Aviso: JWT_ALG inválido ('{_alg}'); usando HS256.")
    _alg = "HS256"
JWT_ALG = _alg

GEMINI_API_KEY = (
    os.environ.get("GEMINI_API_KEY")
    or os.environ.get("GOOGLE_API_KEY")
    or os.environ.get("GOOGLE_GENAI_API_KEY")
    or ""
)
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "text-embedding-004")

DATA_DIR = os.environ.get("DATA_DIR", os.getcwd())
RAG_GLOB = os.environ.get("RAG_GLOB", os.path.join(DATA_DIR, "**", "*.parquet"))
CHROMA_DIR = os.environ.get("CHROMA_DIR", os.path.join(os.getcwd(), ".chroma"))

class SusanaRequest(BaseModel):
    query: str
    ano: int | None = None
    cnes: str | None = None
