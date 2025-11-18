# backend/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app \
    PORT=8000

WORKDIR /app

# System deps (mínimo necessário pra numpy/pandas e curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
  && rm -rf /var/lib/apt/lists/*

# Copia somente requirements primeiro (cache de camadas!)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copia o código do backend
# Obs: como o Dockerfile é construído a partir da pasta "backend",
# este COPY envia todo o conteúdo atual para "/app/backend" na imagem
COPY . /app/backend

EXPOSE 8000

# Uvicorn usa $PORT do Railway automaticamente
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
