import os, jwt, uuid
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Body
from pydantic import BaseModel

JWT_SECRET = os.environ.get("JWT_SECRET", "CHANGE_ME_SECRET")
JWT_ALG = os.environ.get("JWT_ALG", "HS256")
ACCESS_TOKEN_EXPIRES_MINUTES = 60

# Usuários "fake" só para demo — troque por sua validação real
FAKE_USERS = {
    "admin": "admin123",
    "gustavo": "senha123"
}

class TokenRequest(BaseModel):
    username: str
    password: str

def create_access_token(*, sub: str, app: str = "website_builder_app", sid: str | None = None):
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    payload = {
        "iss": "analytica-agents",
        "sub": sub,           # quem é o usuário
        "app": app,           # nome da app (usado no /task)
        "sid": sid or str(uuid.uuid4()),  # id de sessão
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

@app.post("/token")
def issue_token(body: TokenRequest = Body(...)):
    # 1) Valida credenciais (substitua por consulta ao seu banco/Keycloak/etc.)
    valid = FAKE_USERS.get(body.username) == body.password
    if not valid:
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    # 2) Emite JWT com 1h de expiração
    token = create_access_token(sub=body.username)

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRES_MINUTES * 60  # segundos
    }
