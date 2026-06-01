# =============================================================================
# app/core/config.py — Configurações centralizadas (use .env em produção)
# =============================================================================
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # JWT
    SECRET_KEY: str = "TROQUE_ESTA_CHAVE_EM_PRODUCAO_COM_openssl_rand_hex_32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 horas

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Database
    DATABASE_URL: str = "sqlite:///./smartfinance.db"

    # Backend URL (para keep-alive)
    BACKEND_URL: str = "http://localhost:8000"

    # Chave secreta para API de LLM (ngrok)
    API_KEY: str = ""
    # Groq API uses /v1/models/<model>/predict (see Groq docs)
    LLM_API_URL: str = "https://api.groq.com/v1/models/llama-3.1-8b-instant/predict"
    LLM_MODEL: str = "llama-3.1-8b-instant"

    @property
    def cors_origins_list(self) -> list[str]:
        """Converte a string de origens em uma lista"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
