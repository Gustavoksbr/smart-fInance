# =============================================================================
# app/api/routes/dashboards.py
#
# Rotas do espaço privado autenticado:
#   - CRUD de dashboards
#   - POST manual de registros
#   - Upload de planilha Excel (Pandas)
#   - Download do template Excel
#   - Exportação de registros para Excel
# =============================================================================
import io
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.models.database import get_db
from app.models import crud
from app.models.models import User, Dashboard
from app.schemas.dashboard import (
    REQUIRED_EXCEL_COLUMNS,
    DashboardCreate,
    DashboardOut,
    FinancialRecord,
    UploadResult,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_dashboard_or_404(db: Session, dashboard_id: int) -> Dashboard:
    dashboard = crud.get_dashboard_by_id(db, dashboard_id)
    if not dashboard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dashboard não encontrado.")
    return dashboard


def _assert_owner(dashboard: Dashboard, user: User) -> None:
    if dashboard.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")


def _translate_validation_error(error: dict) -> str:
    """Traduz erros de validação do Pydantic para mensagens legíveis em português."""
    field = error.get("loc", [None])[0]
    error_type = error.get("type", "")
    msg = error.get("msg", "")
    
    # Mapa de campos para nomes legíveis
    field_names = {
        "data": "Data",
        "nome": "Nome",
        "descricao": "Descrição",
        "categoria": "Categoria",
        "valor": "Valor",
        "tipo": "Tipo",
    }
    
    field_label = field_names.get(field, str(field))
    
    # Mapa de tipos de erro para mensagens em português
    error_messages = {
        "string_too_long": f"{field_label} é muito longo (máximo 50 caracteres para '{field}')",
        "string_too_short": f"{field_label} não pode estar vazio",
        "value_error": f"{field_label} contém um valor inválido",
        "type_error": f"{field_label} tem um tipo de dados inválido",
        "greater_than": f"{field_label} deve ser maior que 0",
        "less_than_equal": f"{field_label} é muito grande (máximo 999.999.999,99)",
        "pattern_mismatch": f"{field_label} deve ser 'receita' ou 'despesa'",
        "date_parsing": f"Data inválida (formato: YYYY-MM-DD)",
        "float_parsing": f"{field_label} deve ser um número válido",
    }
    
    # Traduz erros específicos
    if "string_too_long" in error_type:
        return f"{field_label} é muito longo (máximo 50 caracteres)"
    elif "string_too_short" in error_type:
        return f"{field_label} não pode estar vazio"
    elif "greater_than" in error_type:
        return f"{field_label} deve ser maior que 0"
    elif "less_than_equal" in error_type:
        return f"{field_label} é muito grande (máximo 999.999.999,99)"
    elif "pattern_mismatch" in error_type or "pattern" in error_type.lower():
        return f"{field_label} deve ser 'receita' ou 'despesa'"
    elif "type_error" in error_type or "float_parsing" in msg.lower():
        if field == "valor":
            return f"{field_label} deve ser um número válido"
        return f"{field_label} tem um formato inválido"
    
    return f"{field_label}: {msg}"


# ---------------------------------------------------------------------------
# Download do Template Excel (DEVE VIR ANTES DAS ROTAS COM {dashboard_id})
# ---------------------------------------------------------------------------

@router.get("/template", summary="Baixar template Excel de exemplo")
def download_template() -> StreamingResponse:
    """
    Gera e retorna o template .xlsx com cabeçalho e 2 linhas de exemplo.
    Não requer autenticação para facilitar o onboarding.
    """
    sample_data = {
        "data": ["2025-01-15", "2025-01-20"],
        "nome": ["Salário", "Aluguel"],
        "descricao": ["Salário Janeiro", "Aluguel Janeiro"],
        "categoria": ["Renda", "Moradia"],
        "valor": [5000.00, 1500.00],
        "tipo": ["receita", "despesa"],
    }
    df = pd.DataFrame(sample_data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Registros")

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=template_smartfinance.xlsx"},
    )


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("/", response_model=DashboardOut, status_code=status.HTTP_201_CREATED)
def create_dashboard(
    payload: DashboardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardOut:
    """Cria um novo dashboard vinculado ao usuário autenticado."""
    dashboard = crud.create_dashboard(db, payload.name, current_user.id)
    return DashboardOut.model_validate(dashboard)


@router.get("/", response_model=list[DashboardOut])
def list_dashboards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DashboardOut]:
    """Lista todos os dashboards do usuário autenticado."""
    dashboards = crud.get_user_dashboards(db, current_user.id)
    return [DashboardOut.model_validate(d) for d in dashboards]


@router.get("/{dashboard_id}", response_model=DashboardOut)
def get_dashboard(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardOut:
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)
    return DashboardOut.model_validate(dashboard)


@router.put("/{dashboard_id}", response_model=DashboardOut)
def update_dashboard(
    dashboard_id: int,
    payload: DashboardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardOut:
    """Atualiza o nome de um dashboard."""
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)
    
    dashboard.name = payload.name
    db.commit()
    db.refresh(dashboard)
    
    return DashboardOut.model_validate(dashboard)


@router.delete("/{dashboard_id}", status_code=status.HTTP_200_OK)
def delete_dashboard(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Deleta um dashboard e todos os seus registros."""
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)
    
    dashboard_name = dashboard.name
    db.delete(dashboard)
    db.commit()
    
    return {"message": f"Dashboard '{dashboard_name}' deletado com sucesso."}


# ---------------------------------------------------------------------------
# Inserção manual de registros (tabela grid no front-end)
# ---------------------------------------------------------------------------

@router.post("/{dashboard_id}/records", status_code=status.HTTP_201_CREATED)
def add_record(
    dashboard_id: int,
    record: FinancialRecord,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Insere um registro financeiro manual no dashboard via POST."""
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)
    
    # Verifica se já existe um registro com o mesmo nome neste dashboard
    existing_record = crud.get_record_by_name_in_dashboard(db, dashboard_id, record.nome)
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe um registro com o nome '{record.nome}' neste dashboard."
        )
    
    crud.create_financial_record(
        db,
        dashboard_id,
        record.data,
        record.nome,
        record.descricao,
        record.categoria,
        record.valor,
        record.tipo,
    )
    
    total_records = len(crud.get_dashboard_records(db, dashboard_id))
    return {"message": "Registro inserido com sucesso.", "total_records": total_records}


@router.get("/{dashboard_id}/records")
def list_records(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Retorna todos os registros de um dashboard."""
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)
    
    records = crud.get_dashboard_records(db, dashboard_id)
    records_dict = [
        {
            "id": r.id,
            "data": r.data,
            "nome": r.nome,
            "descricao": r.descricao,
            "categoria": r.categoria,
            "valor": r.valor,
            "tipo": r.tipo,
        }
        for r in records
    ]
    
    return {"dashboard_id": dashboard_id, "records": records_dict}


@router.get("/{dashboard_id}/export", summary="Exportar registros para Excel")
def export_records(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """Exporta todos os registros do dashboard para um arquivo Excel."""
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)
    
    records = crud.get_dashboard_records(db, dashboard_id)
    
    # Converte registros para DataFrame
    data = {
        "data": [r.data for r in records],
        "nome": [r.nome for r in records],
        "descricao": [r.descricao for r in records],
        "categoria": [r.categoria for r in records],
        "valor": [r.valor for r in records],
        "tipo": [r.tipo for r in records],
    }
    df = pd.DataFrame(data)
    
    # Gera o arquivo Excel em memória
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Registros")
    
    output.seek(0)
    filename = f"{dashboard.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.put("/{dashboard_id}/records/{record_id}", status_code=status.HTTP_200_OK)
def update_record(
    dashboard_id: int,
    record_id: int,
    record: FinancialRecord,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Atualiza um registro financeiro específico."""
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)
    
    db_record = crud.get_record_by_id(db, record_id)
    if not db_record or db_record.dashboard_id != dashboard_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado.")
    
    # Verifica se já existe outro registro com o mesmo nome neste dashboard
    existing_record = crud.get_record_by_name_in_dashboard(db, dashboard_id, record.nome)
    if existing_record and existing_record.id != record_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe outro registro com o nome '{record.nome}' neste dashboard."
        )
    
    updated_record = crud.update_financial_record(
        db,
        db_record,
        record.data,
        record.nome,
        record.descricao,
        record.categoria,
        record.valor,
        record.tipo,
    )
    
    return {
        "message": "Registro atualizado com sucesso.",
        "record": {
            "id": updated_record.id,
            "data": updated_record.data,
            "nome": updated_record.nome,
            "descricao": updated_record.descricao,
            "categoria": updated_record.categoria,
            "valor": updated_record.valor,
            "tipo": updated_record.tipo,
        },
    }


@router.delete("/{dashboard_id}/records/{record_id}", status_code=status.HTTP_200_OK)
def delete_record(
    dashboard_id: int,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Deleta um registro financeiro específico."""
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)
    
    db_record = crud.get_record_by_id(db, record_id)
    if not db_record or db_record.dashboard_id != dashboard_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado.")
    
    deleted_data = {
        "id": db_record.id,
        "data": db_record.data,
        "nome": db_record.nome,
        "descricao": db_record.descricao,
        "categoria": db_record.categoria,
        "valor": db_record.valor,
        "tipo": db_record.tipo,
    }
    
    crud.delete_financial_record(db, db_record)
    return {"message": "Registro deletado com sucesso.", "deleted_record": deleted_data}


# ---------------------------------------------------------------------------
# Upload de planilha Excel — Pandas
# ---------------------------------------------------------------------------

@router.post(
    "/{dashboard_id}/upload",
    response_model=UploadResult,
    summary="Importar registros via planilha Excel",
    description=(
        "Recebe um arquivo .xlsx, valida o cabeçalho contra o template padrão "
        "e importa os registros válidos. Linhas com erro são rejeitadas individualmente "
        "sem interromper a importação das demais."
    ),
)
async def upload_excel(
    dashboard_id: int,
    file: UploadFile = File(..., description="Planilha .xlsx seguindo o template padrão."),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UploadResult:
    dashboard = _get_dashboard_or_404(db, dashboard_id)
    _assert_owner(dashboard, current_user)

    # ------------------------------------------------------------------
    # 1. Validação do Content-Type
    # ------------------------------------------------------------------
    ALLOWED_CONTENT_TYPES = {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",  # alguns clientes enviam assim
    }
    if file.content_type not in ALLOWED_CONTENT_TYPES and not (
        file.filename or ""
    ).endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Apenas arquivos .xlsx são aceitos.",
        )

    # ------------------------------------------------------------------
    # 2. Leitura em memória com Pandas (sem tocar o disco)
    # ------------------------------------------------------------------
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Não foi possível ler a planilha: {exc}",
        )

    # ------------------------------------------------------------------
    # 3. Validação de cabeçalho
    # ------------------------------------------------------------------
    actual_columns = {col.strip().lower() for col in df.columns.tolist()}
    missing = REQUIRED_EXCEL_COLUMNS - actual_columns
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Cabeçalho inválido. Colunas ausentes: {sorted(missing)}. "
                f"Baixe o template em GET /api/dashboards/template."
            ),
        )

    # Normaliza nomes de colunas
    df.columns = [c.strip().lower() for c in df.columns]
    df = df[list(REQUIRED_EXCEL_COLUMNS)]  # mantém apenas as colunas do template

    # ------------------------------------------------------------------
    # 4. Processamento linha a linha com coleta de erros parciais
    # ------------------------------------------------------------------
    imported_count = 0
    errors: list[dict] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # +2 porque pandas é 0-indexed e há o cabeçalho
        try:
            # Valida os dados antes de criar o registro
            record = FinancialRecord(
                data=str(row["data"]).strip(),
                nome=str(row["nome"]).strip(),
                descricao=str(row.get("descricao", "")).strip(),  # Opcional
                categoria=str(row["categoria"]).strip(),
                valor=float(row["valor"]),
                tipo=str(row["tipo"]).strip().lower(),
            )
            
            # Verifica se já existe um registro com o mesmo nome neste dashboard
            existing_record = crud.get_record_by_name_in_dashboard(db, dashboard_id, record.nome)
            if existing_record:
                errors.append({
                    "row": row_num,
                    "error": f"Já existe um registro com o nome '{record.nome}' neste dashboard."
                })
                continue
            
            # Cria o registro
            crud.create_financial_record(
                db,
                dashboard_id,
                record.data,
                record.nome,
                record.descricao,
                record.categoria,
                record.valor,
                record.tipo,
            )
            imported_count += 1
        except ValidationError as ve:
            # Traduz erros de validação do Pydantic
            error_messages = [_translate_validation_error(error) for error in ve.errors()]
            error_text = "; ".join(error_messages)
            errors.append({"row": row_num, "error": error_text})
        except ValueError as e:
            # Erros de conversão de tipo (ex: valor não é número)
            if "could not convert" in str(e).lower() or "invalid literal" in str(e).lower():
                errors.append({"row": row_num, "error": "Valor contém um número inválido"})
            else:
                errors.append({"row": row_num, "error": str(e)})
        except Exception as exc:
            errors.append({"row": row_num, "error": f"Erro inesperado: {str(exc)[:100]}"})


    return UploadResult(
        dashboard_id=dashboard_id,
        rows_imported=imported_count,
        rows_rejected=len(errors),
        errors=errors,
        message=(
            f"{imported_count} registro(s) importado(s) com sucesso."
            + (f" {len(errors)} linha(s) rejeitada(s) por erro de validação." if errors else "")
        ),
    )
