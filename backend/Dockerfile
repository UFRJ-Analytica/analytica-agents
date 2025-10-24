FROM python:3.11-slim

WORKDIR /app

# deps de sistema (se precisar compilar algo)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

# copiar requirements e instalar
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# copiar projeto
COPY backend /app/backend

# porta (só documentação)
EXPOSE 8000

# a command real é dada no docker-compose (uvicorn)
