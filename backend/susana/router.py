import os
import jwt
from fastapi import APIRouter, HTTPException, Header

from .agent import invoke_susana_agent
from .config import SusanaRequest, JWT_SECRET, JWT_ALG, GEMINI_API_KEY

router = APIRouter(tags=["susana"])


@router.post("/susana")
async def susana_endpoint(payload: SusanaRequest, Authorization: str = Header(default=None)):
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente ou inválido no header Authorization.")
    token = Authorization.split(" ", 1)[1].strip()
    try:
        jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")

    if not (GEMINI_API_KEY or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")):
        raise HTTPException(status_code=500, detail="Configure as credenciais do Gemini (API key ou service account).")

    query = (payload.query or "").strip()
    enrich = []
    if payload.ano is not None:
        enrich.append(f"ano={payload.ano}")
    if payload.cnes:
        enrich.append(f"cnes={payload.cnes}")
    if enrich:
        query = f"{query}\n\n[contexto: {', '.join(enrich)}]"

    result = await invoke_susana_agent(query)

    tool_payload = result.tool_result
    if isinstance(tool_payload, dict):
        # Limit JSON for response body
        tool_payload = json_truncate(tool_payload)

    return {
        "answer": result.answer,
        "used_tool": result.used_tool,
        "tool_name": result.tool_name,
        "tool_result": tool_payload,
        "context_docs": result.context_docs,
    }


def json_truncate(data: dict, limit: int = 4000):
    import json

    if len(json.dumps(data, ensure_ascii=False, default=str)) <= limit:
        return data

    truncated = dict(data)
    if isinstance(truncated.get("data"), list):
        rows = truncated["data"]
        while rows and len(json.dumps(truncated, ensure_ascii=False, default=str)) > limit:
            rows = rows[:-1]
            truncated["data"] = rows
        if not rows:
            truncated.pop("data", None)
        if len(json.dumps(truncated, ensure_ascii=False, default=str)) <= limit:
            return truncated

    return {"detail": "tool result truncated due to size limit"}
