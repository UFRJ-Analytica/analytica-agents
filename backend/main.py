import os
from typing import Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from dateutil.parser import parse as dtparse
from backend.storage import load_table
from fastapi.responses import Response
import json
from fastapi import Request

# nomes de arquivos
FN = {
    "marcacao": "marcacao.csv",
    "solicitacao": "solicitacao.csv",
    "tempo_espera": "tempo_espera.csv",
    "profissional_historico": "profissional_historico.csv",
    "unidade_historico": "unidade_historico.csv",
    "oferta_programada": "oferta_programada.csv",
    "cid": "cid.csv",
}

# tipagem mínima por coluna (ajustável se necessário)
DTYPES = {
    "cid": {
        "cid_id": "string",        # ex: "I10"
        "cid": "string",           # descrição textual
        "cid_categoria.id": "string",
        "cid_categoria.descricao": "string",
        "cid_categoria.abreviatura": "string",
        "cid_capitulo.id": "string",
        "cid_capitulo.descricao": "string",
        "cid_grupo.descricao": "string",
        "cid_grupo.abreviatura": "string",
        "comprimento": "Int64"
    },
    "marcacao": {
        "unidade_solicitante_id_cnes": "string",
        "marcacao_executada": "Int64",
        "cid_solicitado_id": "string",
        "cid_agendado_id": "string",
    },
    "solicitacao": {
        "unidade_solicitante_id_cnes": "string",
    },
    "profissional_historico": {
        "unidade_id_cnes": "string",
        "profissional_id": "string",
        "ano": "Int64",
        "mes": "Int64",
    },
    "unidade_historico": {
        "unidade_id_cnes": "string",
        "ano": "Int64",
        "mes": "Int64",
        # se tiver geo:
        # "latitude": "float64", "longitude": "float64"
    },
    "oferta_programada": {
        "unidade_id_cnes": "string",
        "ano": "Int64",
        # quantidade pode variar de nome, detectamos dinamicamente
    },
    "tempo_espera": {
        "procedimento_id": "string",
        "n_execucoes": "Int64",
        "tempo_medio_espera": "float64",
        "tempo_espera_mediano": "float64",
        "tempo_espera_90_percentil": "float64",
        "tempo_espera_desvio_padrao": "float64",
        "ic95_inferior": "float64",
        "ic95_superior": "float64",
        "tempo_medio_espera_movel_3m": "float64",
        "tempo_medio_espera_movel_6m": "float64",
        "tempo_medio_espera_movel_12m": "float64",
        "ano": "Int64",
        "mes": "Int64",
        "unidade_id_cnes": "string",
    },
}

DATE_COLS = {
    "marcacao": ["data_solicitacao", "data_aprovacao", "data_confirmacao", "data_marcacao", "data_cancelamento", "data_atualizacao", "laudo_data_observacao"],
    "solicitacao": ["data_solicitacao", "data_desejada", "data_aprovacao", "data_atualizacao"],
}

# ================== Carregamento (cache) ==================
_CACHE = {}

def _load_csv(name: str) -> pd.DataFrame:
    path = os.path.join(DATA_DIR, FN[name])
    if name in _CACHE:
        return _CACHE[name]
    if not os.path.exists(path):
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")
    dtypes = DTYPES.get(name, None)
    parse_dates = DATE_COLS.get(name, [])
    df = pd.read_csv(path, dtype=dtypes, parse_dates=parse_dates, low_memory=False)
    _CACHE[name] = df
    return df

def _detect_qty_column(df: pd.DataFrame):
    # tenta achar uma coluna de quantidade na oferta_programada (ajuste se souber o nome certo)
    candidates = ["quantidade", "qtd", "qtd_oferta", "quantidade_oferta", "oferta_qtd", "capacidade"]
    for c in candidates:
        if c in df.columns and pd.api.types.is_numeric_dtype(df[c]):
            return c
    return None
# =================== cid ==================================

def _cid_lookup_map() -> dict:
    """Mapeia cid_id -> dict com campos úteis (descrições, categoria, capítulo)."""
    df = _load_csv("cid").copy()
    if "cid_id" not in df.columns:
        return {}
    # renomeia para chaves planas padronizadas
    rename_cols = {
        "cid": "cid_descricao",
        "cid_categoria.id": "cid_categoria_id",
        "cid_categoria.descricao": "cid_categoria_descricao",
        "cid_categoria.abreviatura": "cid_categoria_abrev",
        "cid_capitulo.id": "cid_capitulo_id",
        "cid_capitulo.descricao": "cid_capitulo_descricao",
        "cid_grupo.descricao": "cid_grupos_descricoes",
        "cid_grupo.abreviatura": "cid_grupos_abrevs",
    }
    for c, newc in rename_cols.items():
        if c in df.columns:
            df = df.rename(columns={c: newc})

    # cria dict
    keep = ["cid_id", "cid_descricao", "cid_categoria_id", "cid_categoria_descricao",
            "cid_categoria_abrev", "cid_capitulo_id", "cid_capitulo_descricao",
            "cid_grupos_descricoes", "cid_grupos_abrevs", "comprimento"]
    keep = [k for k in keep if k in df.columns]
    df2 = df[keep].drop_duplicates(subset=["cid_id"])
    return {row["cid_id"]: row.drop(labels=["cid_id"]).to_dict() for _, row in df2.iterrows()}

def _enrich_with_cid(df: pd.DataFrame, col_name: str) -> pd.DataFrame:
    """
    Enriquecer um DataFrame que tenha uma coluna com código CID (ex.: 'cid_solicitado_id' ou 'cid_agendado_id').
    Retorna as colunas extras com sufixo baseado em 'col_name'.
    """
    if col_name not in df.columns:
        return df

    lookup = _cid_lookup_map()
    if not lookup:
        return df

    # aplica mapeamento linha a linha
    def _expander(cid_code: Optional[str]) -> dict:
        if pd.isna(cid_code):
            return {}
        cid_code = str(cid_code)
        meta = lookup.get(cid_code, {})
        return {
            f"{col_name}_descricao": meta.get("cid_descricao"),
            f"{col_name}_categoria_id": meta.get("cid_categoria_id"),
            f"{col_name}_categoria_descricao": meta.get("cid_categoria_descricao"),
            f"{col_name}_capitulo_id": meta.get("cid_capitulo_id"),
            f"{col_name}_capitulo_descricao": meta.get("cid_capitulo_descricao"),
        }

    meta_df = df[col_name].apply(_expander).apply(pd.Series)
    for c in meta_df.columns:
        df[c] = meta_df[c]
    return df


# ================== FastAPI ===============================
app = FastAPI(title="Analytica Agents API", version="0.4.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


def maybe_pretty(payload, pretty: bool):
    if pretty:
        return Response(
            content=json.dumps(payload, indent=2, ensure_ascii=False),
            media_type="application/json; charset=utf-8"
        )
    return payload


@app.get("/")
def home():
    return {
        "status": "ok",
        "docs": "/docs",
        "endpoints": [
            "/insights/occupancy-index?ano=2024",
            "/insights/wait-time-series?cnes=2269554&ano=2024",
            "/insights/professional-load?ano=2024",
            "/insights/supply-demand?ano=2024",
            "/schema",
        ]
    }

# -------- GEO: unidades com lat/long (para o MAPA) --------
@app.get("/geo/units")
def geo_units(request: Request, ano: int = Query(..., ge=2000, le=2100), pretty: bool = False):
    import re
    uh = load_table("unidade_historico").copy()

    # 1) Detecta latitude/longitude por substring (ex.: unidade_latitude / unidade_longitude)
    def find_col(df, patterns):
        for c in df.columns:
            name = c.lower()
            if any(p in name for p in patterns):
                return c
        return None

    lat_col = find_col(uh, ["latitude", "lat_"])  # latitude é suficiente p/ seu caso
    lon_col = find_col(uh, ["longitude", "long_", "lng"])

    if not lat_col or not lon_col:
        return {
            "ano": ano, "rows": 0, "data": [],
            "detail": "Colunas de coordenadas não encontradas",
            "columns_available": uh.columns.tolist(),
            "expected_any_of": {"latitude": ["*latitude*"], "longitude": ["*longitude*"]},
        }

    # 2) Normaliza tipo numérico
    uh[lat_col] = pd.to_numeric(uh[lat_col], errors="coerce")
    uh[lon_col] = pd.to_numeric(uh[lon_col], errors="coerce")

    # 3) Filtro por ano (se existir)
    if "ano" in uh.columns:
        if not pd.api.types.is_integer_dtype(uh["ano"]):
            uh["ano"] = pd.to_numeric(uh["ano"], errors="coerce").astype("Int64")
        uh = uh[uh["ano"] == ano]

    # 4) Seleciona colunas úteis e renomeia para contrato estável
    base_cols = ["unidade_id_cnes", "unidade_nome", "bairro", "regiao", "ano", "mes"]
    have_base = [c for c in base_cols if c in uh.columns]

    df = uh[have_base + [lat_col, lon_col]].dropna(subset=[lat_col, lon_col]).copy()
    df = df.rename(columns={lat_col: "latitude", lon_col: "longitude"})

    # 5) Se houver série temporal, pega última observação por CNES
    if "unidade_id_cnes" in df.columns and ("mes" in df.columns or "ano" in df.columns):
        sort_cols = ["unidade_id_cnes"] + [c for c in ["ano", "mes"] if c in df.columns]
        df = df.sort_values(sort_cols).groupby("unidade_id_cnes", as_index=False).tail(1)

    result = {"ano": ano, "rows": int(df.shape[0]), "data": df.to_dict(orient="records")}
    return maybe_pretty(result, pretty)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# -------- Índice de Ocupação / Estresse --------
@app.get("/insights/occupancy-index")
def occupancy_index(ano: int = Query(..., ge=2000, le=2100), top: int = 100):
    mk = load_table("marcacao").copy()
    if "data_solicitacao" not in mk.columns:
        return {"ano": ano, "rows": 0, "data": []}
    mk = mk[mk["data_solicitacao"].notna()]
    mk = mk[mk["data_solicitacao"].dt.year == ano]

    mk["executada"] = mk.get("marcacao_executada", 0)
    mk["executada"] = mk["executada"].fillna(0).astype("Int64")

    with_lead = mk[mk["data_marcacao"].notna()].copy()
    with_lead["lead_dias"] = (with_lead["data_marcacao"].dt.date - with_lead["data_solicitacao"].dt.date).apply(lambda x: x.days)

    grp_dem  = mk.groupby("unidade_solicitante_id_cnes", dropna=False).size().rename("demanda")
    grp_exec = mk.groupby("unidade_solicitante_id_cnes", dropna=False)["executada"].sum(min_count=1).rename("executadas")
    grp_lead = with_lead.groupby("unidade_solicitante_id_cnes", dropna=False)["lead_dias"].median().rename("lead_mediana_dias")

    df = pd.concat([grp_dem, grp_exec, grp_lead], axis=1).reset_index().rename(columns={"unidade_solicitante_id_cnes": "cnes"})
    df["taxa_execucao"] = (df["executadas"] / df["demanda"]).astype(float)

    for col in ["lead_mediana_dias", "demanda", "taxa_execucao"]:
        m, s = df[col].mean(skipna=True), df[col].std(skipna=True)
        df[f"z_{col}"] = 0.0 if (pd.isna(s) or s == 0) else (df[col] - m) / s

    df["stress_index"] = df["z_lead_mediana_dias"] + df["z_demanda"] - df["z_taxa_execucao"]
    df = df.sort_values("stress_index", ascending=False).head(top)

    return {"ano": ano, "rows": int(df.shape[0]), "data": df.to_dict(orient="records")}

# -------- Série temporal de espera --------
@app.get("/insights/wait-time-series")
def wait_time_series(cnes: str, ano: int):
    mk = load_table("marcacao").copy()
    if not {"unidade_solicitante_id_cnes","data_solicitacao","data_marcacao"}.issubset(mk.columns):
        return {"cnes": cnes, "ano": ano, "data": []}

    mk = mk[
        (mk["unidade_solicitante_id_cnes"].astype(str) == str(cnes)) &
        (mk["data_solicitacao"].notna())
    ]
    mk = mk[mk["data_solicitacao"].dt.year == ano]
    mk = mk[mk["data_marcacao"].notna()].copy()
    if mk.empty:
        return {"cnes": cnes, "ano": ano, "data": []}

    mk["lead_dias"] = (mk["data_marcacao"].dt.date - mk["data_solicitacao"].dt.date).apply(lambda x: x.days)
    mk["mes"] = mk["data_solicitacao"].dt.to_period("M").dt.to_timestamp()

    agg = mk.groupby("mes")["lead_dias"].agg(
        n_exec="count",
        lead_mediana_dias="median",
        lead_p90_dias=lambda s: s.quantile(0.9)
    ).reset_index().sort_values("mes")

    return {"cnes": cnes, "ano": ano, "data": agg.to_dict(orient="records")}

# -------- Carga de profissionais --------
@app.get("/insights/professional-load")
def professional_load(ano: int, top: int = 100):
    ph = load_table("profissional_historico")
    ph = ph[ph["ano"] == ano]
    if ph.empty:
        return {"ano": ano, "rows": 0, "data": []}
    agg = ph.groupby("unidade_id_cnes")["profissional_id"].nunique().reset_index(name="profissionais_ativos")
    agg = agg.sort_values("profissionais_ativos", ascending=False).head(top)
    agg = agg.rename(columns={"unidade_id_cnes": "cnes"})
    return {"ano": ano, "rows": int(agg.shape[0]), "data": agg.to_dict(orient="records")}

# -------- Oferta x Demanda --------
def _detect_qty_column(df: pd.DataFrame):
    for c in ["quantidade","qtd","qtd_oferta","quantidade_oferta","oferta_qtd","capacidade"]:
        if c in df.columns and pd.api.types.is_numeric_dtype(df[c]): return c
    return None

@app.get("/insights/supply-demand")
def supply_demand(ano: int, top: int = 200):
    sol = load_table("solicitacao").copy()
    if "data_solicitacao" not in sol.columns:
        return {"ano": ano, "rows": 0, "data": [], "oferta_coluna_usada": None}
    sol = sol[sol["data_solicitacao"].notna()]
    sol = sol[sol["data_solicitacao"].dt.year == ano]
    demand = sol.groupby("unidade_solicitante_id_cnes").size().reset_index(name="demanda").rename(columns={"unidade_solicitante_id_cnes": "cnes"})

    ofe = load_table("oferta_programada").copy()
    ofe = ofe[ofe["ano"] == ano]
    qty_col = _detect_qty_column(ofe)
    supply = (ofe.groupby("unidade_id_cnes")[qty_col].sum(min_count=1).reset_index(name="oferta")
              if qty_col else
              ofe.groupby("unidade_id_cnes").size().reset_index(name="oferta"))
    supply = supply.rename(columns={"unidade_id_cnes": "cnes"})

    df = pd.merge(demand, supply, on="cnes", how="outer")
    df["demanda_sobre_oferta"] = df["demanda"] / df["oferta"]
    df = df.sort_values("demanda_sobre_oferta", ascending=False, na_position="last").head(top)

    return {"ano": ano, "rows": int(df.shape[0]), "data": df.to_dict(orient="records"), "oferta_coluna_usada": qty_col or "COUNT(*)"}


@app.get("/debug/columns")
def debug_columns(table: str):
    df = load_table(table)
    sample = df.head(3).to_dict(orient="records")
    return {"table": table, "columns": df.columns.tolist(), "sample": sample}

