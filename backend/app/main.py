from fastapi import FastAPI

from app.api.routes import chat
from app.api.routes import knowledge
from app.api.routes import health

app = FastAPI(
    title="Nexus API",
    version="1.0.0"
)

app.include_router(chat.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(health.router, prefix="/api")