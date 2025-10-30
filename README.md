# Analytica Agents — Susana IA

Susana IA é um assistente de dados (chatbot) construído sobre FastAPI (backend) e Next.js (frontend), orquestrado com o Agent Development Kit (ADK) do Google. O objetivo é responder perguntas sobre dados operacionais (SUS/Rio), acionando ferramentas internas (endpoints) quando necessário e, no futuro, integrar mapas e análise interativa.

## Visão Geral

- Backend FastAPI com autenticação via JWT (`POST /token`) e endpoint do agente (`POST /susana`).
- Agente em ADK (Google) que chama funções locais (geo/ocupação/espera/profissionais/oferta x demanda) sem HTTP.
- Frontend Next.js (App Router, TypeScript) com duas entradas: Mapa Iterativo e Chat Susana IA.
- Carregamento de variáveis via `.env` na raiz do repositório.

## Arquitetura

```
backend/
  main.py                  # FastAPI app (token, rotas de insights, inclui router Susana)
  storage.py               # Carregamento de tabelas (CSV/Parquet/S3)
  NL2SQL_Agent/            # (existente) exemplo de agente
  susana/
    config.py              # .env (raiz), modelos e validações
    agent.py               # Agente ADK + tools (geo/occupancy/wait/prof/supply)
    router.py              # APIRouter: POST /susana (JWT + chamada do agente)
frontend/
  app/                     # Next.js App Router (Home, /map, /chat, API proxy)
  src/components/          # Atomic Design (atoms/molecules/organisms/templates)
  .env.local               # Vars do front (URL do backend e credenciais para proxy)
```

## Pré‑requisitos

- Python 3.10+ (recomendado 3.12)
- Node.js 18+ (ou 20+)
- Pip e virtualenv (ou uv/poetry, se preferir)

## Instalação — Backend

1) Criar venv e instalar dependências
- `python -m venv .venv`
- `.\.venv\Scripts\activate` (Windows) ou `source .venv/bin/activate` (Unix)
- `pip install -r backend/requirements.txt`

2) Configurar `.env` (raiz do projeto)
- Adicione/ajuste as chaves mínimas:
  - `JWT_SECRET=um_segredo_forte`
  - `JWT_ALG=HS256`
  - Uma forma de autenticar no Gemini (escolha 1):
    - `GEMINI_API_KEY=...` ou
    - `GOOGLE_API_KEY=...` ou
    - `GOOGLE_GENAI_API_KEY=...` ou
    - `GOOGLE_APPLICATION_CREDENTIALS=/caminho/service-account.json`
  - Modelo Gemini (padrão atualizado): `GEMINI_MODEL=gemini-2.5-flash`
  - Dados locais (opcional, usados pelos insights): `DATA_DIR=backend/dados`
  - Se precisar reduzir o tamanho dos dados (ex.: conta free do Supabase), gere amostras com `.\.venv\Scripts\python.exe scripts/create_parquet_samples.py` e então configure `DATA_BACKEND=local` + `DATA_URI=backend/dados_sample`.

3) Subir a API localmente (carrega `.env` da raiz)
- `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
- Swagger em `http://localhost:8000/docs`

### Endpoints do Backend

- `POST /token` → emite JWT (padrão usa `ADMIN_USERNAME`/`ADMIN_PASSWORD` do ambiente, defaults: `admin/admin123`).
- `POST /susana` (protegido) → retorna `{ answer, used_tool, tool_name, tool_result, context_docs }`.
- `GET /geo/units`, `GET /insights/occupancy-index`, `GET /insights/wait-time-series`, `GET /insights/professional-load`, `GET /insights/supply-demand` → ferramentas usadas pelo agente.

Arquivos relevantes:
- App e rotas: `backend/main.py`
- Config do agente (envs): `backend/susana/config.py`
- Agente ADK + tools: `backend/susana/agent.py`
- Router do agente (JWT + chamada): `backend/susana/router.py`

### Teste Rápido (curl)

- Obter token:
  - `curl -s -X POST http://localhost:8000/token -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'`
- Chamar Susana:
  - `TOKEN=...` (valor de `access_token`)
  - `curl -s -X POST http://localhost:8000/susana -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"query":"Quais unidades mais estressadas em 2024 e o mapa delas?","ano":2024}'`

## Instalação — Frontend (Next.js)

1) Variáveis do frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
- `BACKEND_USERNAME=admin`
- `BACKEND_PASSWORD=admin123`

2) Instalar e rodar
- `cd frontend`
- `npm install`
- `npm run dev`
- Acesse `http://localhost:3000`
  - Home → cartões “Mapa Iterativo” e “Susana IA”
  - /map → consome `GET /geo/units`
  - /chat → chama `/api/token` (proxy para backend) e `/api/susana`

## Deploy

### Docker Compose (exemplo)

Crie/ajuste `docker-compose.yml` (se preferir containerizar os dois):

- Serviço backend (exemplo): expor porta 8000, montar `.env` da raiz como env.
- Serviço frontend: build com Next, `NEXT_PUBLIC_BACKEND_URL=http://api:8000`.

Dicas rápidas:
- Build/Run: `docker compose up --build -d`
- Logs: `docker compose logs -f`

### Railway (FastAPI + Next.js)

Configuracao sugerida com dois services no mesmo projeto Railway:

1. **Backend (FastAPI)**
   - Service root: diretorio raiz do repositorio (`railway.json` na raiz aponta para `backend/Dockerfile`).
   - Builder: `Dockerfile`.
   - Porta: deixe o padrao (`$PORT` fornecido pelo Railway).
   - Healthcheck: `/healthz` (ja configurado no `railway.json`).
   - Variaveis obrigatorias (defina via Railway):
     - `JWT_SECRET` (obrigatorio)
     - `JWT_ALG=HS256` (ou outro suportado)
     - `ADMIN_USERNAME` e `ADMIN_PASSWORD` (credenciais do `/token`)
     - `GEMINI_API_KEY` (ou variantes `GOOGLE_API_KEY`, `GOOGLE_GENAI_API_KEY`, ou `GOOGLE_APPLICATION_CREDENTIALS`)
     - `GEMINI_MODEL` (ex.: `gemini-2.5-flash`)
     - `DATA_DIR` (se usar CSV/Parquet locais enviados como volume/S3)
   - Opcional: desative `Sleep Application` para manter o container ativo.

2. **Frontend (Next.js)**
   - Crie um novo service apontando para `frontend/` (usa `frontend/railway.json` + `frontend/Dockerfile`).
   - Variaveis do ambiente:
     - `NEXT_PUBLIC_BACKEND_URL=https://<service-backend>.railway.app`
     - `BACKEND_USERNAME` e `BACKEND_PASSWORD` (mesmos valores configurados no backend)
   - Builder: `Dockerfile` (multi-stage com `npm ci`, `next build` e `next start`).
   - Porta padrao: utilize `$PORT` fornecido pelo Railway.

3. **Integracao**
   - Depois que o backend subir, copie a URL publica dele e atualize `NEXT_PUBLIC_BACKEND_URL` no service do frontend.
   - Revise as variaveis sensiveis (JWT, Gemini) sempre via painel do Railway (`Variables`).
   - Se precisar de banco de dados ou buckets, adicione plug-ins do Railway e configure as variaveis no backend.

4. **Deploy via CLI (opcional)**
   - `railway link` (escolha o projeto)
   - `railway up --service backend`
   - `railway up --service frontend`

### systemd (exemplo backend)

- Arquivo de unidade:
  - `ExecStart=/opt/analytica-agents/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 2`
  - `EnvironmentFile=/etc/default/analytica-env`
  - `WorkingDirectory=/opt/analytica-agents`
- `sudo systemctl daemon-reload && sudo systemctl restart analytica.service`

## Solução de Problemas

- 401 no `/susana`:
  - Cheque o header `Authorization: Bearer <token>` e gere token em `/token`.
- 500 por credenciais do Gemini:
  - Garanta uma das variáveis: `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`/`GOOGLE_GENAI_API_KEY`) ou apontar `GOOGLE_APPLICATION_CREDENTIALS` para uma service account válida.
- Modelo não encontrado (404 NOT_FOUND):
  - Ajuste `GEMINI_MODEL` (ex.: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.5-pro`).
- Algoritmo JWT inválido:
  - `JWT_ALG` é sanitizado em `backend/susana/config.py`; use `HS256` (padrão) ou outra suportada.
- `.env` duplicado:
  - O backend lê apenas o `.env` da raiz do projeto.

## Padrões de Código

- Backend: Python/FastAPI, foco em simplicidade e manutenibilidade. Env por `.env` raiz.
- Frontend: Next.js com Atomic Design inicial (atoms/molecules/organisms/templates). Estilos simples em `frontend/styles/globals.css`.

## Roadmap

- Melhorar UI do chat (histórico, mensagens do agente, estados visuais).
- Filtros e camadas no mapa (cluster, heatmap, filtros por ano/CNES).
- Observabilidade (latência/erros por rota/tool, tracing básico).
- Opção de embeddings locais ou Vertex AI para cenários sem API key pública.

## Comandos Git (exemplo)

- Criar/alternar para a branch `gus` e enviar mudanças:
  - `git fetch origin`
  - `git switch -c gus` (ou `git switch gus` se já existir)
  - `git add -A`
  - `git commit -m "feat(susana): backend ADK + frontend Next; README"`
  - `git push -u origin gus`

## Licença

- Verifique os termos do repositório original/projeto. Este README não altera direitos de terceiros.

