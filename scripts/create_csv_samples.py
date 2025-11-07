#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create a downsampled CSV file capped by a target size in MB.

Usage (from repo root):
  python scripts/create_csv_samples.py \
    --input backend/dados_csv/marcacao.csv \
    --output backend/dados_csv/marcacao.sample.csv \
    --max-mb 10 \
    --method head

Methods:
  head   : takes the first N rows that fit in the size budget (fast, 1 pass)
  random : approximate random sample to fit the size budget (2 passes)
"""
from __future__ import annotations

import argparse
import io
import math
import os
from typing import List, Tuple

import pandas as pd


def _estimate_csv_sizes(df: pd.DataFrame) -> Tuple[int, int]:
    """Return (header_bytes, avg_row_bytes) estimated with UTF-8 encoding."""
    if df is None or df.shape[0] == 0:
        # Sensible defaults to avoid div-by-zero; small CSV header + small row
        return (128, 128)

    # Estimate total bytes by writing to a text buffer then encoding
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    total = len(buf.getvalue().encode("utf-8"))

    header_buf = io.StringIO()
    header_buf.write(",".join(list(df.columns)) + "\n")
    header_bytes = len(header_buf.getvalue().encode("utf-8"))

    row_bytes = max(total - header_bytes, 0)
    avg_row_bytes = max(math.ceil(row_bytes / max(df.shape[0], 1)), 1)
    return header_bytes, avg_row_bytes


def _hard_trim_to_bytes(df: pd.DataFrame, max_bytes: int) -> pd.DataFrame:
    """Binary-search the largest head(df, n) whose UTF-8 CSV size <= max_bytes."""
    if df.empty:
        return df

    lo, hi = 1, df.shape[0]
    best = 0
    while lo <= hi:
        mid = (lo + hi) // 2
        # Use a text buffer and then encode to count bytes accurately in UTF-8
        buf = io.StringIO()
        df.iloc[:mid].to_csv(buf, index=False)
        size = len(buf.getvalue().encode("utf-8"))
        if size <= max_bytes:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return df.iloc[:best]


def sample_head(input_path: str, output_path: str, max_bytes: int, chunksize: int = 100_000) -> None:
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    # quick peek to estimate sizes and keep columns if file is tiny
    peek = pd.read_csv(input_path, nrows=10_000)
    header_b, avg_b = _estimate_csv_sizes(peek)
    budget_rows = max((max_bytes - header_b) // max(avg_b, 1), 1)

    frames: List[pd.DataFrame] = []
    taken = 0
    for chunk in pd.read_csv(input_path, chunksize=chunksize):
        need = int(budget_rows - taken)
        if need <= 0:
            break
        frames.append(chunk.iloc[:max(need, 0)])
        taken += min(len(chunk), max(need, 0))

    result = pd.concat(frames, ignore_index=True) if frames else peek.iloc[:0]
    result = _hard_trim_to_bytes(result, max_bytes)
    result.to_csv(output_path, index=False)


def sample_random(input_path: str, output_path: str, max_bytes: int, chunksize: int = 200_000, seed: int = 42) -> None:
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    peek = pd.read_csv(input_path, nrows=20_000)
    header_b, avg_b = _estimate_csv_sizes(peek)
    target_rows = max((max_bytes - header_b) // max(avg_b, 1), 1)

    total_rows = 0
    for chunk in pd.read_csv(input_path, chunksize=chunksize):
        total_rows += len(chunk)

    if total_rows == 0:
        pd.DataFrame(columns=peek.columns).to_csv(output_path, index=False)
        return

    # approximate fraction to reach target_rows in a second pass
    frac = min(max(target_rows / total_rows, 1 / max(total_rows, 1)), 1.0)

    frames: List[pd.DataFrame] = []
    for chunk in pd.read_csv(input_path, chunksize=chunksize):
        if frac >= 1.0:
            frames.append(chunk)
        else:
            frames.append(chunk.sample(frac=frac, random_state=seed))

    result = pd.concat(frames, ignore_index=True) if frames else peek.iloc[:0]
    result = _hard_trim_to_bytes(result, max_bytes)
    result.to_csv(output_path, index=False)


def main() -> None:
    ap = argparse.ArgumentParser(description="Create a CSV sample capped by max size (MB)")
    ap.add_argument("--input", required=True, help="Path to source CSV")
    ap.add_argument("--output", required=True, help="Path to output CSV sample")
    ap.add_argument("--max-mb", type=float, default=10.0, help="Max output size in MB (default: 10)")
    ap.add_argument("--method", choices=["head", "random"], default="head", help="Sampling method")
    args = ap.parse_args()

    max_bytes = int(args.max_mb * 1024 * 1024)
    if args.method == "head":
        sample_head(args.input, args.output, max_bytes)
    else:
        sample_random(args.input, args.output, max_bytes)

    out_size = os.path.getsize(args.output)
    print(f"Wrote {args.output} ({out_size/1024/1024:.2f} MB)")


if __name__ == "__main__":
    main()
