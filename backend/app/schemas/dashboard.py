# =============================================================================
# app/schemas/dashboard.py
# =============================================================================
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# Cabeçalho obrigatório do template Excel
REQUIRED_EXCEL_COLUMNS = {"data", "nome", "descricao", "categoria", "valor", "tipo"}


class DashboardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, examples=["Finanças Pessoais 2025"])


class DashboardOut(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class FinancialRecord(BaseModel):
    """Registro financeiro individual (linha da planilha ou POST manual)."""

    data: str = Field(..., examples=["2025-01-15"])
    nome: str = Field(..., min_length=1, max_length=50)
    descricao: str = Field(default="", max_length=200)
    categoria: str = Field(..., min_length=1, max_length=50)
    valor: float = Field(..., gt=0, le=999999999.99)  # maior que 0, até 999 milhões
    tipo: str = Field(..., pattern="^(receita|despesa)$")


class UploadResult(BaseModel):
    """Resultado do processamento da planilha pelo Pandas."""

    dashboard_id: int
    rows_imported: int
    rows_rejected: int
    errors: list[dict[str, Any]] = []
    message: str
