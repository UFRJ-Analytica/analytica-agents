import os
import asyncio
from typing import Optional, Dict, Any, List

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dateutil.parser import parse as dtparse

# --- Google ADK / Agent ---
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part
from NL2SQL_Agent.agent import root_agent

# ===============================================================
# 🔹 CONFIGURAÇÕES BÁSICAS
# ===============================================================

DATA_DIR = os.getenv("DATA_DIR", r"C:\Users\gustavo.costa\Documents\analytica-agents\dataset")

FN = {
    "marcacao": "marcacao.csv",
    "solicitacao": "solicitacao.csv",
    "tempo_espera": "tempo_espera.csv",
    "profissional_historico": "profissional_historico.csv",
    "unidade_historico": "unidade_historico.csv",
    "oferta_programada": "oferta_programada.csv",
    "cid": "cid.csv",
}

# 🔹 Tipos de colunas e cache global
DTYPES = {...}  # manter igual ao seu
DATE_COLS = {...}
_CACHE: Dict[str, pd.DataFrame] = {}

# ===============================================================
# 🔹 UTILITÁRIOS DE CARREGAMENTO
# ===============================================================

def _load_csv(name: str) -> pd.DataFrame:
    """Carrega um CSV em cache, com tipagem e parsing de datas."""
    if name in _CACHE:
        return _CACHE[name]

    path = os.path.join(DATA_DIR, FN[name])
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {path}")

    try:
        df = pd.read_csv(
            path,
            dtype=DTYPES.get(name),
            parse_dates=DATE_COLS.get(name, []),
            low_memory=False,
        )
        _CACHE[name] = df
        return df
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar {name}: {str(e)}")

def _detect_qty_column(df: pd.DataFrame) -> Optional[str]:
    """Detecta dinamicamente a coluna de quantidade."""
    for c in ["quantidade", "qtd", "qtd_oferta", "quantidade_oferta", "oferta_qtd", "capacidade"]:
        if c in df.columns and pd.api.types.is_numeric_dtype(df[c]):
            return c
    return None

# ===============================================================
# 🔹 FUNÇÕES CID (mantém seu código)
# ===============================================================

def _cid_lookup_map() -> Dict[str, dict]:
    df = _load_csv("cid").copy()
    if "cid_id" not in df.columns:
        return {}

    rename_cols = {...}  # manter o seu mapeamento
    df.rename(columns={k: v for k, v in rename_cols.items() if k in df.columns}, inplace=True)

    keep = [c for c in [
        "cid_id", "cid_descricao", "cid_categoria_id", "cid_categoria_descricao",
        "cid_categoria_abrev", "cid_capitulo_id", "cid_capitulo_descricao",
        "cid_grupos_descricoes", "cid_grupos_abrevs", "comprimento"
    ] if c in df.columns]

    return {
        row["cid_id"]: row.drop(labels=["cid_id"]).to_dict()
        for _, row in df[keep].drop_duplicates(subset=["cid_id"]).iterrows()
    }

def _enrich_with_cid(df: pd.DataFrame, col_name: str) -> pd.DataFrame:
    if col_name not in df.columns:
        return df

    lookup = _cid_lookup_map()
    if not lookup:
        return df

    def _expand(cid_code: Optional[str]) -> dict:
        if pd.isna(cid_code):
            return {}
        meta = lookup.get(str(cid_code), {})
        return {
            f"{col_name}_descricao": meta.get("cid_descricao"),
            f"{col_name}_categoria_id": meta.get("cid_categoria_id"),
            f"{col_name}_categoria_descricao": meta.get("cid_categoria_descricao"),
            f"{col_name}_capitulo_id": meta.get("cid_capitulo_id"),
            f"{col_name}_capitulo_descricao": meta.get("cid_capitulo_descricao"),
        }

    expanded = df[col_name].map(_expand).apply(pd.Series)
    return pd.concat([df, expanded], axis=1)

# ===============================================================
# 🔹 FASTAPI CONFIG
# ===============================================================

app = FastAPI(title="Analytica Agents API", version="0.3.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "status": "ok",
        "docs": "/docs",
        "version": app.version,
        "available_endpoints": [
            "/insights/occupancy-index",
            "/insights/wait-time-series",
            "/insights/professional-load",
            "/insights/supply-demand",
            "/task"
        ]
    }

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# ===============================================================
# 🔹 ENDPOINT /task (melhorado)
# ===============================================================

os.environ["GOOGLE_API_KEY"] = "AIzaSyA_JwdU9mVBBu7fOLPi54XLcRRvT6HWj4E"
# ---------- Função auxiliar síncrona ----------
def run_task_sync(user_input: str):
    """
    Executa a lógica do agente NL2SQL dentro de um asyncio.run(),
    para isolar event loops e evitar conflitos com FastAPI.
    """
    async def _run():
        APP_NAME = "saude-agents-app"
        USER_ID = "user_12345"
        SESSION_ID = "session_12345"

        session_service = InMemorySessionService()
        # O método create_session é síncrono — não precisa de await
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            session_id=SESSION_ID
        )

        runner = Runner(
            agent=root_agent,
            app_name=APP_NAME,
            session_service=session_service,
        )

        content = Content(role="user", parts=[Part(text=user_input)])

        try:
            final_response = None
            async for event in runner.run_async(
                user_id=USER_ID,
                session_id=SESSION_ID,
                new_message=content
            ):
                if event.is_final_response():
                    final_response = event.content.parts[0].text
                    break

            if not final_response:
                final_response = "Sem resposta gerada pelo agente."

            return {"response": final_response}

        except Exception as e:
            raise RuntimeError(f"Erro interno na execução do agente: {str(e)}")

    # Executa o contexto assíncrono isolado
    return asyncio.run(_run())


# ---------- Endpoint FastAPI ----------
@app.post("/task")
async def task(user_input: str = Query(..., description="Texto enviado pelo usuário")):
    """
    Endpoint principal que executa o agente dentro de um asyncio.run().
    """
    try:
        result = await asyncio.to_thread(run_task_sync, user_input)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar task: {str(e)}")
