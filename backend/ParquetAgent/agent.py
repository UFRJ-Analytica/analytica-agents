# backend/ParquetAgent/agent.py
import os
import requests
from google.adk.agents import Agent  # mantendo sua lib

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

def query_api_tool(prompt: str) -> str:
    """
    Heurística bem simples: detecta palavras-chave e consulta o endpoint certo.
    Em produção, você pode usar um roteador mais elaborado ou chain-of-thought controlado.
    """
    try:
        # exemplos de roteamento simples:
        if "mapa" in prompt.lower() or "coordenada" in prompt.lower():
            ano = _extrai_ano(prompt) or 2024
            r = requests.get(f"{BACKEND_URL}/geo/units", params={"ano": ano}, timeout=30)
            r.raise_for_status()
            return r.text

        if "ocupação" in prompt.lower() or "estresse" in prompt.lower():
            ano = _extrai_ano(prompt) or 2024
            r = requests.get(f"{BACKEND_URL}/insights/occupancy-index", params={"ano": ano, "top": 100}, timeout=30)
            r.raise_for_status()
            return r.text

        if "profissional" in prompt.lower():
            ano = _extrai_ano(prompt) or 2024
            r = requests.get(f"{BACKEND_URL}/insights/professional-load", params={"ano": ano, "top": 100}, timeout=30)
            r.raise_for_status()
            return r.text

        if "oferta" in prompt.lower() or "demanda" in prompt.lower():
            ano = _extrai_ano(prompt) or 2024
            r = requests.get(f"{BACKEND_URL}/insights/supply-demand", params={"ano": ano, "top": 200}, timeout=30)
            r.raise_for_status()
            return r.text

        if "tempo de espera" in prompt.lower() or "série" in prompt.lower():
            ano = _extrai_ano(prompt) or 2024
            cnes = _extrai_cnes(prompt) or "2269554"
            r = requests.get(f"{BACKEND_URL}/insights/wait-time-series", params={"cnes": cnes, "ano": ano}, timeout=30)
            r.raise_for_status()
            return r.text

        # fallback: schema
        r = requests.get(f"{BACKEND_URL}/schema", timeout=30)
        r.raise_for_status()
        return r.text
    except Exception as e:
        return f"Erro ao consultar API: {e}"

def _extrai_ano(texto: str):
    import re
    m = re.search(r"(20\d{2})", texto)
    return int(m.group(1)) if m else None

def _extrai_cnes(texto: str):
    import re
    m = re.search(r"\b(\d{6,7})\b", texto)
    return m.group(1) if m else None

root_agent = Agent(
    model='gemini-2.5-flash',
    name='ParquetAgent',
    description='Agente que consulta a API de dados de saúde.',
    instruction=('Você tem acesso a ferramentas que permitem carregar, combinar e consultar dados do Datalake de Saúde. ' \
                'Use essas ferramentas para responder às perguntas do usuário com base nos dados disponíveis.'\
                'Se o usuário fizer uma pergunta que não pode ser respondida com os dados, informe educadamente que você não tem essa informação.'\
                'Seu fluxo de execução deve ser a seguinte:'\
                '1. Analise as colunas disponíveis nos arquivos carregados'\
                '2. Entenda quais colunas devem ser utilizadas para fazer consulta nestes arquivos baseado no prompt do usuário.'\
                '3. Use a ferramenta query_parquet_tool para consultar os dados e obter as informações solicitadas pelo usuário.'\
                '4. Forneça a resposta ao usuário com base nos dados obtidos.'\
                ),
    tools=[query_api_tool],
)
