# =============================================================================
# SmartFinance API — FastAPI Entry Point
# =============================================================================
import asyncio
import httpx
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.api.routes import auth, dashboards
from app.api.routes.llm import router as llm_router
from app.core.config import settings
from app.models.database import engine, Base, SessionLocal

logger = logging.getLogger("keepalive")

# ---------------------------------------------------------------------------
# Keep-Alive Task — Mantém Render e Supabase ativos
# ---------------------------------------------------------------------------
async def keep_alive_task():
    """
    Task que faz ping no endpoint /health a cada 10 minutos.
    O /health faz consulta ao banco, mantendo tanto Render quanto Supabase ativos.
    """
    url = getattr(settings, "BACKEND_URL", None)
    if not url:
        logger.info("BACKEND_URL não definida — keep-alive desativado.")
        return
    
    health_url = url.rstrip("/") + "/health"
    
    # Aguarda 2 minutos após o startup antes do primeiro ping
    await asyncio.sleep(120)
    
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            await asyncio.sleep(600)  # 10 minutos
            try:
                # Chama o endpoint /health que vai consultar o banco (Supabase)
                response = await client.get(health_url)
                logger.info("keep-alive health-check -> %s %s", health_url, response.status_code)
                
                if response.status_code == 200:
                    data = response.json()
                    db_status = data.get("database", "unknown")
                    logger.info("✓ Keep-alive successful | Database status: %s", db_status)
                    
                    if db_status == "error":
                        db_error = data.get("database_error", "")
                        if "ENOTFOUND" in db_error or "not found" in db_error:
                            logger.warning("⚠ Database pausado pelo Supabase")
                            logger.info("ℹ️  Acesse https://app.supabase.com para reativar")
                else:
                    logger.warning("⚠ Keep-alive returned status %s", response.status_code)
                    
            except Exception as e:
                logger.warning("✗ Keep-alive falhou: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação"""
    # -----------------------------------------------------------------------
    # DB init (DEV) — evita side-effects no import e não quebra deploy
    # -----------------------------------------------------------------------
    try:
        # Por padrão, só roda create_all() automaticamente quando for SQLite.
        # Para Postgres (ex.: Supabase), prefira migrations (Alembic).
        if settings.DATABASE_URL.startswith("sqlite"):
            Base.metadata.create_all(bind=engine)
            print("✓ SQLite tables ensured (create_all)")
        else:
            print("ℹ DB init skipped (non-sqlite). Use Alembic migrations if needed.")
    except Exception as e:
        # Não derruba o servidor só por falha de init (permite /health subir).
        print(f"⚠️ DB init failed: {e}")

    # Startup: inicia a task de keep-alive em background (não aguarda)
    task = None
    try:
        task = asyncio.create_task(keep_alive_task())
        print("🚀 Keep-alive task iniciada (primeiro ping em 2 minutos)")
    except Exception as e:
        print(f"⚠️ Erro ao iniciar keep-alive task: {e}")
    
    yield
    
    # Shutdown: cancela a task se existir
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            print("🛑 Keep-alive task cancelada")


app = FastAPI(
    title="SmartFinance API",
    description="Dashboard Financeiro e Macroeconômico Inteligente",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(OperationalError)
async def sqlalchemy_operational_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database unavailable. Check DATABASE_URL / network egress.",
        },
    )

# ---------------------------------------------------------------------------
# CORS — configurado via variável de ambiente CORS_ORIGINS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboards.router, prefix="/api/dashboards", tags=["dashboards"])
app.include_router(llm_router, prefix="/api/llm", tags=["llm"])


@app.get("/health")
def health_check():
    """
    Health check que consulta o banco de dados.
    Usado pelo keep-alive para manter Supabase e Render ativos.
    """
    db_status = "unknown"
    db_error = None
    
    try:
        # Cria uma sessão temporária para testar a conexão
        db = SessionLocal()
        try:
            # Faz uma query simples para acordar o Supabase
            result = db.execute(text("SELECT 1 as alive"))
            row = result.fetchone()
            if row and row[0] == 1:
                db_status = "connected"
            else:
                db_status = "error"
        finally:
            db.close()
    except Exception as e:
        db_status = "error"
        db_error = str(e)
        logger.error("Health check database error: %s", e)
    
    response = {
        "status": "ok",
        "service": "SmartFinance API",
        "database": db_status
    }
    
    if db_error:
        response["database_error"] = db_error
    
    return response


@app.get("/ping")
def ping():
    """Endpoint público simples sem consulta ao banco (não requer autenticação)"""
    return {"status": "pong", "message": "API está acordada"}


@app.get("/db-health")
def db_health_check():
    """
    Endpoint legado - mantido para compatibilidade.
    Use /health para verificação completa.
    """
    try:
        db = SessionLocal()
        try:
            result = db.execute(text("SELECT 1 as health_check"))
            row = result.fetchone()
            if row:
                return {
                    "status": "ok",
                    "database": "connected",
                    "message": "Database is healthy"
                }
            return {
                "status": "warning",
                "database": "connected",
                "message": "Database connected but query returned no result"
            }
        finally:
            db.close()
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "message": f"Database connection failed: {str(e)}"
        }
