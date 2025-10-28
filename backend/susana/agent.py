from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from uuid import uuid4

from google.adk.agents.llm_agent import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import FunctionTool
from google.genai.types import Content, Part

from backend.susana.config import GEMINI_MODEL


@dataclass
class SusanaAgentResult:
    answer: str
    used_tool: bool
    tool_name: Optional[str]
    tool_result: Any
    context_docs: List[Dict[str, Any]]


def _build_tools(trace: Dict[str, Any]) -> List[FunctionTool]:
    """Create FunctionTool wrappers around FastAPI insight endpoints."""

    def _track(name: str, payload: Any) -> Any:
        trace["tool_name"] = name
        trace["tool_result"] = payload
        trace["used_tool"] = True
        trace["context_docs"] = _extract_context(payload)
        return payload

    def geo_units_tool(ano: int = 2024) -> Dict[str, Any]:
        from backend.main import geo_units

        result = geo_units(request=None, ano=ano, pretty=False)
        return _track("geo_units", result)

    geo_units_tool.__doc__ = (
        "Retorna unidades de saúde com latitude e longitude para o mapa."
    )

    def occupancy_index_tool(ano: int = 2024, top: int = 100) -> Dict[str, Any]:
        from backend.main import occupancy_index

        result = occupancy_index(ano=ano, top=top)
        return _track("occupancy_index", result)

    occupancy_index_tool.__doc__ = (
        "Calcula índice de estresse/ocupação por CNES no ano especificado."
    )

    def wait_time_series_tool(cnes: str, ano: int = 2024) -> Dict[str, Any]:
        from backend.main import wait_time_series

        result = wait_time_series(cnes=cnes, ano=ano)
        return _track("wait_time_series", result)

    wait_time_series_tool.__doc__ = (
        "Retorna série temporal de tempo de espera (lead time) para o CNES informado."
    )

    def professional_load_tool(ano: int = 2024, top: int = 100) -> Dict[str, Any]:
        from backend.main import professional_load

        result = professional_load(ano=ano, top=top)
        return _track("professional_load", result)

    professional_load_tool.__doc__ = (
        "Lista carga de profissionais ativos por CNES para o ano desejado."
    )

    def supply_demand_tool(ano: int = 2024, top: int = 200) -> Dict[str, Any]:
        from backend.main import supply_demand

        result = supply_demand(ano=ano, top=top)
        return _track("supply_demand", result)

    supply_demand_tool.__doc__ = (
        "Avalia relação oferta vs demanda por CNES no ano informado."
    )

    return [
        FunctionTool(func=geo_units_tool),
        FunctionTool(func=occupancy_index_tool),
        FunctionTool(func=wait_time_series_tool),
        FunctionTool(func=professional_load_tool),
        FunctionTool(func=supply_demand_tool),
    ]


def _extract_context(result: Any) -> List[Dict[str, Any]]:
    if isinstance(result, dict):
        data = result.get("data")
        if isinstance(data, list):
            return [row for row in data[:3] if isinstance(row, dict)]
    return []


async def invoke_susana_agent(query: str) -> SusanaAgentResult:
    trace: Dict[str, Any] = {
        "used_tool": False,
        "tool_name": None,
        "tool_result": None,
        "context_docs": [],
    }
    agent = Agent(
        name="susana_assistant",
        model=GEMINI_MODEL,
        description="Assistente de dados do SUS/Rio utilizando ADK.",
        instruction=(
            "Você é Susana, especialista em dados operacionais da rede SUS/Rio. "
            "Responda de forma objetiva e, quando precisar de dados vivos, utilize as tools disponíveis. "
            "Após usar uma tool, sintetize os principais pontos e destaque insights relevantes. "
            "Se não houver dados suficientes, seja transparente sobre a limitação."
        ),
        tools=_build_tools(trace),
    )

    session_service = InMemorySessionService()
    app_name = "susana-agent-app"
    user_id = "susana-user"
    session_id = str(uuid4())
    await session_service.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
    )

    runner = Runner(
        agent=agent,
        app_name=app_name,
        session_service=session_service,
    )

    message = Content(role="user", parts=[Part(text=query)])
    events = runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=message,
    )

    answer = ""
    async for event in events:
        if event.is_final_response():
            if event.content and event.content.parts:
                answer = event.content.parts[0].text or ""

    return SusanaAgentResult(
        answer=answer.strip() or "Não consegui gerar resposta no momento.",
        used_tool=bool(trace["used_tool"]),
        tool_name=trace["tool_name"],
        tool_result=trace["tool_result"],
        context_docs=trace["context_docs"],
    )
