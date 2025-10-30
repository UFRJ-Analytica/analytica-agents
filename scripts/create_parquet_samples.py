#!/usr/bin/env python3
"""
Utilitário para gerar subconjuntos menores dos principais arquivos Parquet,
facilitando uso em ambientes com limites de armazenamento (ex.: Supabase Free).

Os arquivos reduzidos são gravados em backend/dados_sample mantendo o mesmo
formato (Parquet) e copiando integralmente os arquivos menores.
"""

from __future__ import annotations

import shutil
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq


ROOT = Path(__file__).resolve().parents[1]
INPUT_DIR = ROOT / "backend" / "dados"
OUTPUT_DIR = ROOT / "backend" / "dados_sample"

# Quantidade máx. de linhas a manter em cada arquivo grande
TARGET_ROWS = {
    "marcacao": 50_000,
    "solicitacao": 50_000,
    "oferta_programada": 50_000,
    "profissional_historico": 50_000,
}


def ensure_output_dir() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def read_partial_table(path: Path, max_rows: int) -> pa.Table:
    """Lê o mínimo necessário de row groups para atingir até max_rows linhas."""
    parquet_file = pq.ParquetFile(path)
    collected: list[pa.Table] = []
    total = 0

    for group_idx in range(parquet_file.num_row_groups):
        table = parquet_file.read_row_group(group_idx)
        remaining = max_rows - total
        if table.num_rows > remaining:
            table = table.slice(0, remaining)
        collected.append(table)
        total += table.num_rows
        if total >= max_rows:
            break

    if not collected:
        return pa.Table.from_batches([])
    return pa.concat_tables(collected)


def create_sample(name: str, max_rows: int) -> None:
    source = INPUT_DIR / f"{name}.parquet"
    destination = OUTPUT_DIR / f"{name}.parquet"

    if not source.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {source}")

    table = read_partial_table(source, max_rows)
    pq.write_table(table, destination)
    print(f"[sample] {name}: {table.num_rows} linhas -> {destination}")


def copy_remaining_files() -> None:
    for path in INPUT_DIR.glob("*.parquet"):
        name = path.stem
        if name in TARGET_ROWS:
            continue
        dest = OUTPUT_DIR / path.name
        shutil.copy2(path, dest)
        print(f"[copy] {name}: arquivo completo -> {dest}")


def main() -> None:
    ensure_output_dir()
    for name, rows in TARGET_ROWS.items():
        create_sample(name, rows)
    copy_remaining_files()
    print(f"\nArquivos reduzidos disponíveis em: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
