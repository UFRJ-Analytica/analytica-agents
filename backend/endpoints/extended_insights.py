from __future__ import annotations

from typing import Any, Literal, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from backend.storage import load_table

router = APIRouter(tags=["insights-extended"])

VALID_YEAR_MIN = 2000
VALID_YEAR_MAX = 2100

SPECIALTY_DATASETS = {
    "oftalmologia": "consulta_oftalmologia",
    "oftalmologia_geral": "consulta_otalmologia_geral",
    "fisioterapia": "consultas_fisioterapia_nome_das_unidades",
    "saude_mental": "consulta_em_saude_mental_nome_das_unidades",
    "catarata": "cirurgia_de_catarata",
}


def _safe_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df is None or df.empty:
        return []
    safe = df.copy()
    safe.replace([np.inf, -np.inf], pd.NA, inplace=True)
    safe = safe.where(pd.notna(safe), None)
    return safe.to_dict(orient="records")


def _ensure_datetime(df: pd.DataFrame, col: str) -> None:
    if col not in df.columns:
        return
    if not pd.api.types.is_datetime64_any_dtype(df[col]):
        df[col] = pd.to_datetime(df[col], errors="coerce")


def _pick_col(df: pd.DataFrame, candidates: list[str]) -> Optional[str]:
    for col in candidates:
        if col in df.columns:
            return col
    return None


def _normalize_cnes(value: pd.Series | str) -> pd.Series | str:
    if isinstance(value, pd.Series):
        return (
            value.astype(str)
            .str.strip()
            .str.replace(r"\.0$", "", regex=True)
            .replace({"nan": None, "None": None, "": None})
        )
    return str(value).strip().removesuffix(".0")


def _filter_year_numeric(df: pd.DataFrame, year_col: str, ano: Optional[int]) -> pd.DataFrame:
    year = pd.to_numeric(df[year_col], errors="coerce")
    mask = year.between(VALID_YEAR_MIN, VALID_YEAR_MAX)
    if ano is not None:
        mask &= year.eq(ano)
    return df[mask].copy()


def _filter_year_from_date(df: pd.DataFrame, date_col: str, ano: Optional[int]) -> pd.DataFrame:
    if date_col not in df.columns:
        return df
    _ensure_datetime(df, date_col)
    out = df[df[date_col].notna()].copy()
    if ano is not None:
        out = out[out[date_col].dt.year == ano]
    return out


def _detect_offer_qty_col(df: pd.DataFrame) -> Optional[str]:
    candidates = [
        "vagas_programadas_todas",
        "vagas_programadas_primeira_vez",
        "vagas_programadas_retorno",
        "vagas_programadas_reserva",
        "quantidade",
        "qtd",
        "qtd_oferta",
        "quantidade_oferta",
        "oferta_qtd",
        "capacidade",
    ]
    for col in candidates:
        if col in df.columns:
            return col
    return None


def _exec_flag(df: pd.DataFrame) -> pd.Series:
    if "marcacao_executada" not in df.columns:
        return pd.Series(0, index=df.index, dtype="Int64")
    return pd.to_numeric(df["marcacao_executada"], errors="coerce").fillna(0).astype("Int64")


def _load_specialty_df(dataset: str) -> tuple[pd.DataFrame, str]:
    if dataset not in SPECIALTY_DATASETS:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset inválido: {dataset}. Opções: {sorted(SPECIALTY_DATASETS.keys())}",
        )
    table = SPECIALTY_DATASETS[dataset]
    return load_table(table).copy(), table


def _specialty_year_filter(
    df: pd.DataFrame,
    ano: Optional[int],
    referencia: Literal["solicitacao", "marcacao"],
) -> tuple[pd.DataFrame, Optional[str]]:
    candidates = ["ano_solicitacao", "ano"] if referencia == "solicitacao" else ["ano_marcacao", "ano"]
    year_col = _pick_col(df, candidates)
    if year_col:
        return _filter_year_numeric(df, year_col, ano), year_col
    return df.copy(), None


def _join_procedimento(df: pd.DataFrame, key: str = "procedimento_sisreg_id") -> pd.DataFrame:
    if key not in df.columns:
        return df
    try:
        proc = load_table("procedimento").copy()
    except Exception:
        return df
    if key not in proc.columns:
        return df
    keep_cols = [c for c in [key, "procedimento", "procedimento_tipo", "procedimento_especialidade"] if c in proc.columns]
    proc = proc[keep_cols].drop_duplicates(subset=[key])
    return df.merge(proc, on=key, how="left")


def _group_dimension(df: pd.DataFrame, by: Literal["unidade", "procedimento"]) -> tuple[pd.DataFrame, str, str]:
    if by == "unidade":
        raw_col = _pick_col(df, ["unidade_solicitante_id_cnes", "unidade_solicitante", "unidade_id_cnes"])
        if not raw_col:
            raise HTTPException(status_code=400, detail="Coluna de CNES não encontrada no dataset.")
        out = df.copy()
        out["cnes"] = _normalize_cnes(out[raw_col])
        return out[out["cnes"].notna()].copy(), "cnes", "cnes"

    raw_col = _pick_col(df, ["procedimento_sisreg_id", "procedimento"])
    if not raw_col:
        raise HTTPException(status_code=400, detail="Coluna de procedimento não encontrada no dataset.")
    key = "procedimento_sisreg_id" if raw_col == "procedimento_sisreg_id" else "procedimento"
    out = df.copy()
    out[key] = out[raw_col].astype(str)
    out = out[out[key].notna()].copy()
    return out, key, key


@router.get("/insights/top-procedures")
def top_procedures(
    ano: Optional[int] = Query(default=None, ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    top: int = Query(default=20, ge=1, le=200),
    cnes: Optional[str] = None,
):
    sol = load_table("solicitacao").copy()
    sol = _filter_year_from_date(sol, "data_solicitacao", ano)

    cnes_col = _pick_col(sol, ["unidade_solicitante_id_cnes", "unidade_solicitante", "unidade_id_cnes"])
    if cnes and cnes_col:
        cnes_norm = _normalize_cnes(sol[cnes_col])
        sol = sol[cnes_norm == _normalize_cnes(cnes)]

    proc_col = _pick_col(sol, ["procedimento_sisreg_id", "procedimento"])
    if not proc_col:
        raise HTTPException(status_code=400, detail="Coluna de procedimento não encontrada em solicitacao.")

    agg = (
        sol.groupby(proc_col, dropna=False)
        .size()
        .reset_index(name="solicitacoes")
        .rename(columns={proc_col: "procedimento_sisreg_id"})
        .sort_values("solicitacoes", ascending=False)
        .head(top)
    )
    agg["procedimento_sisreg_id"] = agg["procedimento_sisreg_id"].astype(str)
    agg = _join_procedimento(agg, key="procedimento_sisreg_id")

    return {
        "ano": ano,
        "cnes": _normalize_cnes(cnes) if cnes else None,
        "rows": int(agg.shape[0]),
        "data": _safe_records(agg),
    }


@router.get("/insights/procedure-trend")
def procedure_trend(
    procedimento_sisreg_id: str,
    ano_inicio: Optional[int] = Query(default=None, ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    ano_fim: Optional[int] = Query(default=None, ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    cnes: Optional[str] = None,
):
    sol = load_table("solicitacao").copy()
    _ensure_datetime(sol, "data_solicitacao")
    if "data_solicitacao" not in sol.columns:
        raise HTTPException(status_code=400, detail="data_solicitacao não encontrada em solicitacao.")

    proc_col = _pick_col(sol, ["procedimento_sisreg_id", "procedimento"])
    if not proc_col:
        raise HTTPException(status_code=400, detail="Coluna de procedimento não encontrada.")

    sol = sol[sol["data_solicitacao"].notna()].copy()
    sol = sol[sol[proc_col].astype(str) == str(procedimento_sisreg_id)]

    if ano_inicio is not None:
        sol = sol[sol["data_solicitacao"].dt.year >= ano_inicio]
    if ano_fim is not None:
        sol = sol[sol["data_solicitacao"].dt.year <= ano_fim]

    cnes_col = _pick_col(sol, ["unidade_solicitante_id_cnes", "unidade_solicitante", "unidade_id_cnes"])
    if cnes and cnes_col:
        cnes_norm = _normalize_cnes(sol[cnes_col])
        sol = sol[cnes_norm == _normalize_cnes(cnes)]

    if sol.empty:
        return {
            "procedimento_sisreg_id": str(procedimento_sisreg_id),
            "rows": 0,
            "data": [],
        }

    sol["mes"] = sol["data_solicitacao"].dt.to_period("M").astype(str)
    agg = (
        sol.groupby("mes")
        .size()
        .reset_index(name="solicitacoes")
        .sort_values("mes")
    )
    agg["ano"] = agg["mes"].str.slice(0, 4).astype(int)

    return {
        "procedimento_sisreg_id": str(procedimento_sisreg_id),
        "cnes": _normalize_cnes(cnes) if cnes else None,
        "ano_inicio": ano_inicio,
        "ano_fim": ano_fim,
        "rows": int(agg.shape[0]),
        "data": _safe_records(agg),
    }


def _rate_from_marcacao(
    ano: int,
    by: Literal["unidade", "procedimento"],
    top: int,
    min_volume: int,
    numerator_mask_fn,
    metric_name: str,
):
    mk = load_table("marcacao").copy()
    mk = _filter_year_from_date(mk, "data_solicitacao", ano)
    mk, group_col, out_col = _group_dimension(mk, by)

    mk["_numerador"] = numerator_mask_fn(mk).astype("Int64")
    grp = mk.groupby(group_col, dropna=False)
    agg = grp.size().rename("volume").to_frame().reset_index()
    agg["numerador"] = grp["_numerador"].sum(min_count=1).values
    agg = agg[agg["volume"] >= min_volume].copy()
    if agg.empty:
        return {"ano": ano, "rows": 0, "data": []}

    agg[metric_name] = (agg["numerador"] / agg["volume"]).astype(float)
    agg = agg.sort_values([metric_name, "volume"], ascending=[False, False]).head(top)
    agg = agg.rename(columns={group_col: out_col})

    if out_col == "procedimento_sisreg_id":
        agg = _join_procedimento(agg, key="procedimento_sisreg_id")

    return {
        "ano": ano,
        "by": by,
        "min_volume": min_volume,
        "rows": int(agg.shape[0]),
        "data": _safe_records(agg),
    }


@router.get("/insights/execution-rate")
def execution_rate(
    ano: int = Query(..., ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    by: Literal["unidade", "procedimento"] = "unidade",
    top: int = Query(default=100, ge=1, le=500),
    min_volume: int = Query(default=10, ge=1, le=10000),
):
    return _rate_from_marcacao(
        ano,
        by,
        top,
        min_volume,
        lambda df: _exec_flag(df) == 1,
        "taxa_execucao",
    )


@router.get("/insights/no-show-rate")
def no_show_rate(
    ano: int = Query(..., ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    by: Literal["unidade", "procedimento"] = "unidade",
    top: int = Query(default=100, ge=1, le=500),
    min_volume: int = Query(default=10, ge=1, le=10000),
):
    def _mask(df: pd.DataFrame) -> pd.Series:
        status_col = _pick_col(df, ["solicitacao_status", "status"])
        falta_col = _pick_col(df, ["falta_registrada"])
        mask = pd.Series(False, index=df.index)
        if status_col:
            mask = mask | df[status_col].astype(str).str.contains("FALTA", case=False, na=False)
        if falta_col:
            mask = mask | pd.to_numeric(df[falta_col], errors="coerce").fillna(0).astype(int).eq(1)
        return mask

    return _rate_from_marcacao(ano, by, top, min_volume, _mask, "taxa_falta")


@router.get("/insights/cancellation-rate")
def cancellation_rate(
    ano: int = Query(..., ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    by: Literal["unidade", "procedimento"] = "unidade",
    top: int = Query(default=100, ge=1, le=500),
    min_volume: int = Query(default=10, ge=1, le=10000),
):
    def _mask(df: pd.DataFrame) -> pd.Series:
        status_col = _pick_col(df, ["solicitacao_status", "status"])
        mask = pd.Series(False, index=df.index)
        if status_col:
            mask = mask | df[status_col].astype(str).str.contains("CANCEL", case=False, na=False)
        if "data_cancelamento" in df.columns:
            mask = mask | df["data_cancelamento"].notna()
        return mask

    return _rate_from_marcacao(ano, by, top, min_volume, _mask, "taxa_cancelamento")


@router.get("/insights/risk-profile")
def risk_profile(
    ano: Optional[int] = Query(default=None, ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    by: Literal["unidade", "procedimento"] = "unidade",
    top: int = Query(default=100, ge=1, le=500),
):
    sol = load_table("solicitacao").copy()
    sol = _filter_year_from_date(sol, "data_solicitacao", ano)
    sol, group_col, out_col = _group_dimension(sol, by)

    risk_col = _pick_col(sol, ["solicitacao_risco", "risco"])
    if not risk_col:
        raise HTTPException(status_code=400, detail="Coluna de risco não encontrada.")

    sol["risco"] = sol[risk_col].astype(str).str.upper().str.strip()
    pivot = (
        sol.groupby([group_col, "risco"], dropna=False)
        .size()
        .unstack(fill_value=0)
        .reset_index()
        .rename(columns={group_col: out_col})
    )

    for risk in ["AZUL", "VERDE", "AMARELO", "VERMELHO"]:
        if risk not in pivot.columns:
            pivot[risk] = 0

    pivot["total"] = pivot[["AZUL", "VERDE", "AMARELO", "VERMELHO"]].sum(axis=1)
    denom = pivot["total"].replace({0: np.nan})
    pivot["pct_azul"] = pivot["AZUL"] / denom
    pivot["pct_verde"] = pivot["VERDE"] / denom
    pivot["pct_amarelo"] = pivot["AMARELO"] / denom
    pivot["pct_vermelho"] = pivot["VERMELHO"] / denom
    pivot = pivot.sort_values("total", ascending=False).head(top)

    if out_col == "procedimento_sisreg_id":
        pivot = _join_procedimento(pivot, key="procedimento_sisreg_id")

    return {
        "ano": ano,
        "by": by,
        "rows": int(pivot.shape[0]),
        "data": _safe_records(pivot),
    }


@router.get("/insights/status-funnel")
def status_funnel(
    ano: Optional[int] = Query(default=None, ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    by: Literal["unidade", "procedimento"] = "unidade",
    top: int = Query(default=100, ge=1, le=500),
    top_status: int = Query(default=8, ge=2, le=20),
):
    sol = load_table("solicitacao").copy()
    sol = _filter_year_from_date(sol, "data_solicitacao", ano)
    sol, group_col, out_col = _group_dimension(sol, by)

    status_col = _pick_col(sol, ["solicitacao_status", "status"])
    if not status_col:
        raise HTTPException(status_code=400, detail="Coluna de status não encontrada.")

    sol["status"] = sol[status_col].astype(str).str.upper().str.strip()
    top_statuses = (
        sol["status"].value_counts().head(top_status).index.tolist()
    )
    sol["status"] = np.where(sol["status"].isin(top_statuses), sol["status"], "OUTROS")

    pivot = (
        sol.groupby([group_col, "status"], dropna=False)
        .size()
        .unstack(fill_value=0)
        .reset_index()
        .rename(columns={group_col: out_col})
    )
    status_cols = [c for c in pivot.columns if c not in [out_col]]
    pivot["total"] = pivot[status_cols].sum(axis=1)
    pivot = pivot.sort_values("total", ascending=False).head(top)

    if out_col == "procedimento_sisreg_id":
        pivot = _join_procedimento(pivot, key="procedimento_sisreg_id")

    return {
        "ano": ano,
        "by": by,
        "rows": int(pivot.shape[0]),
        "statuses_considerados": top_statuses,
        "data": _safe_records(pivot),
    }


@router.get("/insights/unit-dashboard")
def unit_dashboard(
    cnes: str,
    ano: int = Query(..., ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
):
    cnes_norm = _normalize_cnes(cnes)
    output: dict[str, Any] = {
        "cnes": cnes_norm,
        "ano": ano,
    }

    uh = load_table("unidade_historico").copy()
    uh = _filter_year_numeric(uh, "ano", ano) if "ano" in uh.columns else uh
    uh_col = _pick_col(uh, ["unidade_id_cnes", "unidade_solicitante_id_cnes", "unidade_solicitante"])
    if uh_col:
        uh["_cnes"] = _normalize_cnes(uh[uh_col])
        uh = uh[uh["_cnes"] == cnes_norm].copy()
    if not uh.empty:
        sort_cols = [c for c in ["ano", "mes"] if c in uh.columns]
        if sort_cols:
            uh = uh.sort_values(sort_cols)
        row = uh.tail(1).iloc[0].to_dict()
        keep = [k for k in ["unidade_nome", "unidade_bairro", "unidade_area_programatica", "unidade_latitude", "unidade_longitude"] if k in row]
        output["unidade"] = {k: row.get(k) for k in keep}

    sol = load_table("solicitacao").copy()
    sol = _filter_year_from_date(sol, "data_solicitacao", ano)
    sol_col = _pick_col(sol, ["unidade_solicitante_id_cnes", "unidade_solicitante", "unidade_id_cnes"])
    if sol_col:
        sol["_cnes"] = _normalize_cnes(sol[sol_col])
        sol = sol[sol["_cnes"] == cnes_norm].copy()
    output["demanda_solicitacoes"] = int(sol.shape[0])

    mk = load_table("marcacao").copy()
    mk = _filter_year_from_date(mk, "data_solicitacao", ano)
    mk_col = _pick_col(mk, ["unidade_solicitante_id_cnes", "unidade_solicitante", "unidade_id_cnes"])
    if mk_col:
        mk["_cnes"] = _normalize_cnes(mk[mk_col])
        mk = mk[mk["_cnes"] == cnes_norm].copy()

    exec_flag = _exec_flag(mk)
    output["agendamentos"] = int(mk.shape[0])
    output["execucoes"] = int(exec_flag.sum(skipna=True))
    output["taxa_execucao"] = float(exec_flag.mean(skipna=True)) if len(exec_flag) else None

    if not mk.empty and {"data_solicitacao", "data_marcacao"}.issubset(mk.columns):
        _ensure_datetime(mk, "data_solicitacao")
        _ensure_datetime(mk, "data_marcacao")
        with_dates = mk[mk["data_solicitacao"].notna() & mk["data_marcacao"].notna()].copy()
        if not with_dates.empty:
            lead = (with_dates["data_marcacao"].dt.date - with_dates["data_solicitacao"].dt.date).apply(lambda d: d.days)
            output["lead_time_mediano_dias"] = float(pd.to_numeric(lead, errors="coerce").median(skipna=True))
            output["lead_time_p90_dias"] = float(pd.to_numeric(lead, errors="coerce").quantile(0.9))

    ofe = load_table("oferta_programada").copy()
    if "ano" in ofe.columns:
        ofe = _filter_year_numeric(ofe, "ano", ano)
    ofe_col = _pick_col(ofe, ["unidade_solicitante_id_cnes", "unidade_id_cnes", "unidade_solicitante"])
    if ofe_col:
        ofe["_cnes"] = _normalize_cnes(ofe[ofe_col])
        ofe = ofe[ofe["_cnes"] == cnes_norm].copy()
    qty_col = _detect_offer_qty_col(ofe)
    if qty_col:
        output["oferta_total"] = float(pd.to_numeric(ofe[qty_col], errors="coerce").sum(min_count=1)) if not ofe.empty else 0
        output["oferta_coluna_usada"] = qty_col
    else:
        output["oferta_total"] = int(ofe.shape[0])
        output["oferta_coluna_usada"] = "COUNT(*)"

    ph = load_table("profissional_historico").copy()
    if "ano" in ph.columns:
        ph = _filter_year_numeric(ph, "ano", ano)
    ph_col = _pick_col(ph, ["unidade_id_cnes", "unidade_solicitante_id_cnes"])
    if ph_col:
        ph["_cnes"] = _normalize_cnes(ph[ph_col])
        ph = ph[ph["_cnes"] == cnes_norm].copy()
    output["profissionais_ativos"] = int(ph["profissional_id"].nunique()) if "profissional_id" in ph.columns else 0
    if "profissional_carga_horaria_semanal_total" in ph.columns:
        output["carga_horaria_total"] = float(pd.to_numeric(ph["profissional_carga_horaria_semanal_total"], errors="coerce").sum(min_count=1))

    lh = load_table("leito_historico").copy()
    if "ano" in lh.columns:
        lh = _filter_year_numeric(lh, "ano", ano)
    lh_col = _pick_col(lh, ["unidade_id_cnes", "unidade_solicitante_id_cnes"])
    if lh_col:
        lh["_cnes"] = _normalize_cnes(lh[lh_col])
        lh = lh[lh["_cnes"] == cnes_norm].copy()
    if "leito_quantidade_total" in lh.columns:
        output["leitos_total"] = float(pd.to_numeric(lh["leito_quantidade_total"], errors="coerce").sum(min_count=1))

    eh = load_table("equipamento_historico").copy()
    if "ano" in eh.columns:
        eh = _filter_year_numeric(eh, "ano", ano)
    eh_col = _pick_col(eh, ["unidade_id_cnes", "unidade_solicitante_id_cnes"])
    if eh_col:
        eh["_cnes"] = _normalize_cnes(eh[eh_col])
        eh = eh[eh["_cnes"] == cnes_norm].copy()
    eq_col = _pick_col(eh, ["equipamentos_quantidade_ativos", "equipamentos_quantidade"])
    if eq_col:
        output["equipamentos_ativos_total"] = float(pd.to_numeric(eh[eq_col], errors="coerce").sum(min_count=1))

    hh = load_table("habilitacao_historico").copy()
    if "ano" in hh.columns:
        hh = _filter_year_numeric(hh, "ano", ano)
    hh_col = _pick_col(hh, ["unidade_id_cnes", "unidade_solicitante_id_cnes"])
    if hh_col:
        hh["_cnes"] = _normalize_cnes(hh[hh_col])
        hh = hh[hh["_cnes"] == cnes_norm].copy()
    if "habilitacao_ativa_indicador" in hh.columns:
        flag = hh["habilitacao_ativa_indicador"].astype(str).str.upper().isin(["1", "TRUE", "T", "SIM", "S", "ATIVA"])
        output["habilitacoes_ativas"] = int(hh[flag]["habilitacao"].nunique()) if "habilitacao" in hh.columns else int(flag.sum())

    if "data_solicitacao" in sol.columns and "data_solicitacao" in mk.columns:
        _ensure_datetime(sol, "data_solicitacao")
        _ensure_datetime(mk, "data_solicitacao")
        sol_m = sol[sol["data_solicitacao"].notna()].copy()
        mk_m = mk[mk["data_solicitacao"].notna()].copy()
        if not sol_m.empty or not mk_m.empty:
            series = []
            sol_agg = (
                sol_m.assign(mes=sol_m["data_solicitacao"].dt.to_period("M").astype(str))
                .groupby("mes")
                .size()
                .rename("demanda")
            )
            if "marcacao_executada" in mk_m.columns:
                mk_agg = (
                    mk_m.assign(mes=mk_m["data_solicitacao"].dt.to_period("M").astype(str))
                    .groupby("mes")["marcacao_executada"]
                    .apply(lambda s: pd.to_numeric(s, errors="coerce").fillna(0).astype(int).sum())
                    .rename("execucoes")
                )
            else:
                mk_agg = (
                    mk_m.assign(mes=mk_m["data_solicitacao"].dt.to_period("M").astype(str))
                    .groupby("mes")
                    .size()
                    .rename("execucoes")
                )
            for mes in sorted(set(sol_agg.index) | set(mk_agg.index)):
                series.append(
                    {
                        "mes": mes,
                        "demanda": int(sol_agg.get(mes, 0)),
                        "execucoes": int(mk_agg.get(mes, 0)),
                    }
                )
            output["serie_mensal"] = series

    return output


@router.get("/capacity/professional-hours")
def capacity_professional_hours(
    ano: int = Query(..., ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    mes: Optional[int] = Query(default=None, ge=1, le=12),
    top: int = Query(default=100, ge=1, le=500),
):
    ph = load_table("profissional_historico").copy()
    ph = _filter_year_numeric(ph, "ano", ano) if "ano" in ph.columns else ph
    if mes is not None and "mes" in ph.columns:
        ph = ph[pd.to_numeric(ph["mes"], errors="coerce") == mes]

    cnes_col = _pick_col(ph, ["unidade_id_cnes", "unidade_solicitante_id_cnes"])
    if not cnes_col:
        raise HTTPException(status_code=400, detail="Coluna de unidade não encontrada.")
    ph["cnes"] = _normalize_cnes(ph[cnes_col])

    agg = (
        ph.groupby("cnes")
        .agg(
            profissionais_ativos=("profissional_id", "nunique"),
            carga_horaria_total=("profissional_carga_horaria_semanal_total", lambda s: pd.to_numeric(s, errors="coerce").sum(min_count=1)),
        )
        .reset_index()
        .sort_values("carga_horaria_total", ascending=False)
        .head(top)
    )
    return {"ano": ano, "mes": mes, "rows": int(agg.shape[0]), "data": _safe_records(agg)}


@router.get("/capacity/leitos")
def capacity_leitos(
    ano: int = Query(..., ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    mes: Optional[int] = Query(default=None, ge=1, le=12),
    by: Literal["unidade", "especialidade"] = "unidade",
    top: int = Query(default=100, ge=1, le=500),
):
    lh = load_table("leito_historico").copy()
    lh = _filter_year_numeric(lh, "ano", ano) if "ano" in lh.columns else lh
    if mes is not None and "mes" in lh.columns:
        lh = lh[pd.to_numeric(lh["mes"], errors="coerce") == mes]

    if by == "unidade":
        group_col = _pick_col(lh, ["unidade_id_cnes", "unidade_solicitante_id_cnes"])
        if not group_col:
            raise HTTPException(status_code=400, detail="Coluna de unidade não encontrada em leito_historico.")
        lh["cnes"] = _normalize_cnes(lh[group_col])
    else:
        group_col = _pick_col(lh, ["leito_especialidade", "leito"])
        if not group_col:
            raise HTTPException(status_code=400, detail="Coluna de especialidade de leito não encontrada.")

    key = "cnes" if by == "unidade" else group_col
    agg = (
        lh.groupby(key)
        .agg(
            leitos_total=("leito_quantidade_total", lambda s: pd.to_numeric(s, errors="coerce").sum(min_count=1)),
            leitos_sus=("leito_quantidade_sus", lambda s: pd.to_numeric(s, errors="coerce").sum(min_count=1)),
            leitos_contratado=("leito_quantidade_contratado", lambda s: pd.to_numeric(s, errors="coerce").sum(min_count=1)),
        )
        .reset_index()
        .sort_values("leitos_total", ascending=False)
        .head(top)
    )
    return {"ano": ano, "mes": mes, "by": by, "rows": int(agg.shape[0]), "data": _safe_records(agg)}


@router.get("/capacity/equipamentos")
def capacity_equipamentos(
    ano: int = Query(..., ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    mes: Optional[int] = Query(default=None, ge=1, le=12),
    by: Literal["unidade", "equipamento"] = "unidade",
    top: int = Query(default=100, ge=1, le=500),
):
    eh = load_table("equipamento_historico").copy()
    eh = _filter_year_numeric(eh, "ano", ano) if "ano" in eh.columns else eh
    if mes is not None and "mes" in eh.columns:
        eh = eh[pd.to_numeric(eh["mes"], errors="coerce") == mes]

    if by == "unidade":
        group_col = _pick_col(eh, ["unidade_id_cnes", "unidade_solicitante_id_cnes"])
        if not group_col:
            raise HTTPException(status_code=400, detail="Coluna de unidade não encontrada em equipamento_historico.")
        eh["cnes"] = _normalize_cnes(eh[group_col])
        key = "cnes"
    else:
        key = _pick_col(eh, ["equipamento_especifico", "equipamento"])
        if not key:
            raise HTTPException(status_code=400, detail="Coluna de equipamento não encontrada.")

    agg = (
        eh.groupby(key)
        .agg(
            equipamentos_ativos=("equipamentos_quantidade_ativos", lambda s: pd.to_numeric(s, errors="coerce").sum(min_count=1)),
            equipamentos_total=("equipamentos_quantidade", lambda s: pd.to_numeric(s, errors="coerce").sum(min_count=1)),
        )
        .reset_index()
        .sort_values("equipamentos_ativos", ascending=False)
        .head(top)
    )
    return {"ano": ano, "mes": mes, "by": by, "rows": int(agg.shape[0]), "data": _safe_records(agg)}


@router.get("/capacity/habilitacoes-ativas")
def capacity_habilitacoes_ativas(
    ano: int = Query(..., ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    mes: Optional[int] = Query(default=None, ge=1, le=12),
    top: int = Query(default=100, ge=1, le=500),
):
    hh = load_table("habilitacao_historico").copy()
    hh = _filter_year_numeric(hh, "ano", ano) if "ano" in hh.columns else hh
    if mes is not None and "mes" in hh.columns:
        hh = hh[pd.to_numeric(hh["mes"], errors="coerce") == mes]

    cnes_col = _pick_col(hh, ["unidade_id_cnes", "unidade_solicitante_id_cnes"])
    if not cnes_col:
        raise HTTPException(status_code=400, detail="Coluna de unidade não encontrada em habilitacao_historico.")
    hh["cnes"] = _normalize_cnes(hh[cnes_col])

    if "habilitacao_ativa_indicador" in hh.columns:
        active = hh["habilitacao_ativa_indicador"].astype(str).str.upper().isin(["1", "TRUE", "T", "SIM", "S", "ATIVA"])
        hh = hh[active].copy()

    if "habilitacao" in hh.columns:
        agg = (
            hh.groupby("cnes")["habilitacao"]
            .nunique()
            .reset_index(name="habilitacoes_ativas")
            .sort_values("habilitacoes_ativas", ascending=False)
            .head(top)
        )
    else:
        agg = (
            hh.groupby("cnes")
            .size()
            .reset_index(name="habilitacoes_ativas")
            .sort_values("habilitacoes_ativas", ascending=False)
            .head(top)
        )

    return {"ano": ano, "mes": mes, "rows": int(agg.shape[0]), "data": _safe_records(agg)}


@router.get("/specialties/overview")
def specialties_overview(
    dataset: Literal["oftalmologia", "oftalmologia_geral", "fisioterapia", "saude_mental", "catarata"],
    ano: Optional[int] = Query(default=None, ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    referencia: Literal["solicitacao", "marcacao"] = "solicitacao",
):
    df, table = _load_specialty_df(dataset)
    df, year_col = _specialty_year_filter(df, ano, referencia)

    exec_col = _exec_flag(df)
    total = int(df.shape[0])
    execucoes = int(exec_col.sum(skipna=True))
    taxa_execucao = float(execucoes / total) if total else None

    risco = {}
    if "solicitacao_risco" in df.columns:
        risco = df["solicitacao_risco"].astype(str).str.upper().value_counts().head(6).to_dict()

    status = {}
    if "solicitacao_status" in df.columns:
        status = df["solicitacao_status"].astype(str).value_counts().head(6).to_dict()

    origem_col = _pick_col(df, ["unidade_solicitante_nome", "unidade_solicitante", "unidade_solicitante_id_cnes"])
    destino_col = _pick_col(df, ["unidade_executante_nome", "unidade_executante", "unidade_executante_id_cnes"])

    top_origem = []
    top_destino = []
    if origem_col:
        top_origem = _safe_records(
            df.groupby(origem_col).size().reset_index(name="solicitacoes").sort_values("solicitacoes", ascending=False).head(10)
        )
    if destino_col:
        top_destino = _safe_records(
            df.groupby(destino_col).size().reset_index(name="encaminhamentos").sort_values("encaminhamentos", ascending=False).head(10)
        )

    return {
        "dataset": dataset,
        "table": table,
        "ano": ano,
        "referencia": referencia,
        "year_col_usada": year_col,
        "rows": total,
        "metrics": {
            "total_solicitacoes": total,
            "execucoes": execucoes,
            "taxa_execucao": taxa_execucao,
            "risco_distribuicao": risco,
            "status_top": status,
        },
        "top_origem": top_origem,
        "top_destino": top_destino,
    }


@router.get("/specialties/flow-map")
def specialties_flow_map(
    dataset: Literal["oftalmologia", "oftalmologia_geral", "fisioterapia", "saude_mental", "catarata"],
    ano: Optional[int] = Query(default=None, ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    referencia: Literal["solicitacao", "marcacao"] = "solicitacao",
    top: int = Query(default=200, ge=1, le=1000),
):
    df, table = _load_specialty_df(dataset)
    df, year_col = _specialty_year_filter(df, ano, referencia)

    origem = _pick_col(df, ["unidade_solicitante_nome", "unidade_solicitante", "unidade_solicitante_id_cnes"])
    destino = _pick_col(df, ["unidade_executante_nome", "unidade_executante", "unidade_executante_id_cnes"])
    if not origem or not destino:
        raise HTTPException(status_code=400, detail="Colunas de origem/destino não encontradas no dataset.")

    df = df[df[origem].notna() & df[destino].notna()].copy()
    df["_executada"] = _exec_flag(df)
    flow = (
        df.groupby([origem, destino], dropna=False)
        .agg(
            volume=("solicitacao_id", "count") if "solicitacao_id" in df.columns else ("_executada", "size"),
            execucoes=("_executada", "sum"),
        )
        .reset_index()
        .rename(columns={origem: "origem", destino: "destino"})
    )
    flow["taxa_execucao"] = flow["execucoes"] / flow["volume"].replace({0: np.nan})
    flow = flow.sort_values("volume", ascending=False).head(top)

    return {
        "dataset": dataset,
        "table": table,
        "ano": ano,
        "referencia": referencia,
        "year_col_usada": year_col,
        "rows": int(flow.shape[0]),
        "data": _safe_records(flow),
    }


@router.get("/specialties/unit-ranking")
def specialties_unit_ranking(
    dataset: Literal["oftalmologia", "oftalmologia_geral", "fisioterapia", "saude_mental", "catarata"],
    metric: Literal["volume", "execucao", "risco"] = "volume",
    ano: Optional[int] = Query(default=None, ge=VALID_YEAR_MIN, le=VALID_YEAR_MAX),
    referencia: Literal["solicitacao", "marcacao"] = "solicitacao",
    top: int = Query(default=100, ge=1, le=500),
):
    df, table = _load_specialty_df(dataset)
    df, year_col = _specialty_year_filter(df, ano, referencia)

    unidade = _pick_col(df, ["unidade_solicitante_nome", "unidade_solicitante", "unidade_solicitante_id_cnes"])
    if not unidade:
        raise HTTPException(status_code=400, detail="Coluna de unidade solicitante não encontrada.")

    df = df[df[unidade].notna()].copy()

    if metric == "volume":
        rank = (
            df.groupby(unidade)
            .size()
            .reset_index(name="volume")
            .sort_values("volume", ascending=False)
            .head(top)
        )
    elif metric == "execucao":
        df["_exec"] = _exec_flag(df)
        rank = (
            df.groupby(unidade)
            .agg(volume=("solicitacao_id", "count") if "solicitacao_id" in df.columns else ("_exec", "size"), taxa_execucao=("_exec", "mean"))
            .reset_index()
            .sort_values(["taxa_execucao", "volume"], ascending=[False, False])
            .head(top)
        )
    else:
        score = {"AZUL": 1, "VERDE": 2, "AMARELO": 3, "VERMELHO": 4}
        if "solicitacao_risco" not in df.columns:
            raise HTTPException(status_code=400, detail="Coluna de risco não encontrada para ranking por risco.")
        df["_risco_score"] = df["solicitacao_risco"].astype(str).str.upper().map(score).fillna(0)
        rank = (
            df.groupby(unidade)
            .agg(volume=("solicitacao_id", "count") if "solicitacao_id" in df.columns else ("_risco_score", "size"), risco_score_medio=("_risco_score", "mean"))
            .reset_index()
            .sort_values(["risco_score_medio", "volume"], ascending=[False, False])
            .head(top)
        )

    rank = rank.rename(columns={unidade: "unidade"})
    return {
        "dataset": dataset,
        "table": table,
        "metric": metric,
        "ano": ano,
        "referencia": referencia,
        "year_col_usada": year_col,
        "rows": int(rank.shape[0]),
        "data": _safe_records(rank),
    }


@router.get("/meta/data-coverage")
def meta_data_coverage():
    tables = [
        "marcacao",
        "solicitacao",
        "tempo_espera",
        "profissional_historico",
        "unidade_historico",
        "oferta_programada",
        "cid",
        "procedimento",
        "equipamento_historico",
        "leito_historico",
        "habilitacao_historico",
        "consulta_oftalmologia",
        "consulta_otalmologia_geral",
        "consultas_fisioterapia_nome_das_unidades",
        "consulta_em_saude_mental_nome_das_unidades",
        "cirurgia_de_catarata",
    ]
    year_candidates = ["ano", "ano_solicitacao", "ano_marcacao", "ano_marcacao"]
    data = []

    for table in tables:
        try:
            df = load_table(table).copy()
            payload: dict[str, Any] = {
                "table": table,
                "rows": int(df.shape[0]),
                "columns": int(df.shape[1]),
            }
            years = {}
            for col in year_candidates:
                if col in df.columns:
                    y = pd.to_numeric(df[col], errors="coerce")
                    y = y[y.between(VALID_YEAR_MIN, VALID_YEAR_MAX)]
                    if not y.empty:
                        years[col] = {"min": int(y.min()), "max": int(y.max())}
            payload["year_range"] = years or None
            data.append(payload)
        except Exception as exc:
            data.append({"table": table, "error": str(exc)})

    return {"rows": len(data), "data": data}
