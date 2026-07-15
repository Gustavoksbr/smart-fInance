# =============================================================================
# SmartFinance API — FastAPI Entry Point
# =============================================================================
import asyncio
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.api.routes import auth, dashboards
from app.api.routes.llm import router as llm_router
from app.core.config import settings
from app.models.database import engine, Base, get_db

# ---------------------------------------------------------------------------
# Keep-Alive Task — Mantém a API e Supabase acordados fazendo ping a cada 10 minutos
# ---------------------------------------------------------------------------
async def keep_alive_task():
    """Task que faz ping no próprio backend e consulta o banco a cada 10 minutos"""
    # Aguarda 2 minutos após o startup antes do primeiro ping
    await asyncio.sleep(120)
    
    while True:
        try:
            # Ping no backend (mantém Render acordado)
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{settings.BACKEND_URL}/ping")
                if response.status_code == 200:
                    print(f"✓ Keep-alive ping successful: {response.json()}")
                else:
                    print(f"⚠ Keep-alive ping returned status {response.status_code}")
            
            # Consulta simples no banco (mantém Supabase acordado)
            try:
                db = next(get_db())
                try:
                    # Executa uma query simples para "acordar" o Supabase
                    result = db.execute(text("SELECT 1 as keep_alive"))
                    row = result.fetchone()
                    if row:
                        print(f"✓ Database keep-alive successful: {row[0]}")
                    else:
                        print("⚠ Database keep-alive returned no result")
                except Exception as db_err:
                    print(f"✗ Database keep-alive query failed: {db_err}")
                finally:
                    db.close()
            except Exception as db_conn_err:
                print(f"✗ Database connection failed: {db_conn_err}")
                
        except Exception as e:
            print(f"✗ Keep-alive ping failed: {e}")
        
        # Aguarda 10 minutos antes do próximo ping
        await asyncio.sleep(600)


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
    return {"status": "ok", "service": "SmartFinance API"}


@app.get("/ping")
def ping():
    """Endpoint público para keep-alive (não requer autenticação)"""
    return {"status": "pong", "message": "API está acordada"}


@app.get("/db-health")
def db_health_check():
    """Endpoint para verificar a saúde do banco de dados"""
    try:
        db = next(get_db())
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
