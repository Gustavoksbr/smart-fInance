# =============================================================================
# app/api/routes/llm.py — API de chat LLM para dashboards privados
# =============================================================================
from collections import defaultdict
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.core.deps import get_current_user
from app.models import crud
from app.models.database import get_db
from app.models.models import Dashboard, User
from app.schemas.llm import LLMRequest, LLMResponse

router = APIRouter()


def _build_dashboard_context(dashboard: Dashboard, records: list[Any]) -> str:
    if not records:
        return (
            f"Dashboard: {dashboard.name}\n"
            "O dashboard não contém registros financeiros no momento."
        )

    total_receita = sum(r.valor for r in records if r.tipo == "receita")
    total_despesa = sum(r.valor for r in records if r.tipo == "despesa")
    saldo = total_receita - total_despesa

    receitas_por_categoria: dict[str, float] = defaultdict(float)
    despesas_por_categoria: dict[str, float] = defaultdict(float)
    receitas_por_nome: list[tuple[float, str, str, str]] = []
    despesas_por_nome: list[tuple[float, str, str, str]] = []

    for record in records:
        if record.tipo == "receita":
            receitas_por_categoria[record.categoria] += record.valor
            receitas_por_nome.append((record.valor, record.nome, record.categoria, record.data))
        elif record.tipo == "despesa":
            despesas_por_categoria[record.categoria] += record.valor
            despesas_por_nome.append((record.valor, record.nome, record.categoria, record.data))

    receitas_por_nome.sort(reverse=True)
    despesas_por_nome.sort(reverse=True)

    def format_top(entries: list[tuple[float, str, str, str]], label: str) -> list[str]:
        return [
            f"- {name} ({category}): R$ {value:.2f} em {date}"
            for value, name, category, date in entries[:4]
        ]

    context_lines = [
        f"Dashboard: {dashboard.name}",
        f"URL: http://localhost:5173/dashboards/{dashboard.name.lower().replace(' ', '-')}",
        "Totais:",
        f"- Registros: {len(records)}",
        f"- Receitas: R$ {total_receita:.2f}",
        f"- Despesas: R$ {total_despesa:.2f}",
        f"- Saldo: R$ {saldo:.2f}",
        "",
        "Receitas por categoria:",
    ]

    for category, value in sorted(receitas_por_categoria.items(), key=lambda item: item[1], reverse=True):
        context_lines.append(f"- {category}: R$ {value:.2f}")

    context_lines.extend(["", "Despesas por categoria:"])
    for category, value in sorted(despesas_por_categoria.items(), key=lambda item: item[1], reverse=True):
        context_lines.append(f"- {category}: R$ {value:.2f}")

    if receitas_por_nome:
        context_lines.extend(["", "Receitas mais altas:"])
        context_lines.extend(format_top(receitas_por_nome, "receita"))

    if despesas_por_nome:
        context_lines.extend(["", "Despesas mais altas:"])
        context_lines.extend(format_top(despesas_por_nome, "despesa"))

    if len(records) > 10:
        context_lines.extend(["", f"Mostrando os 10 primeiros registros de {len(records)}:"])

    for record in records[:10]:
        context_lines.append(
            f"- {record.nome} | {record.categoria} | {record.tipo} | R$ {record.valor:.2f} | {record.data}"
        )

    return "\n".join(context_lines)


@router.post("/chat", response_model=LLMResponse)
async def dashboard_chat(
    payload: LLMRequest,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> LLMResponse:
    if not settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_KEY para LLM não configurada.",
        )

    dashboard = crud.get_dashboard_by_id(db, payload.dashboard_id)

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard não encontrado."
        )

    if dashboard.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado."
        )

    records = crud.get_dashboard_records(db, payload.dashboard_id)

    context_text = _build_dashboard_context(dashboard, records)

    system_prompt = (
        "Você é um assistente financeiro especializado em análise de dashboards. "
        "Use APENAS os dados fornecidos. Nunca invente valores, categorias, nomes ou "
        "referências de lançamento que não estejam presentes nos dados. "
        "Se não for possível inferir algo, fale claramente que não há informação suficiente. "
        "Responda em português com títulos e listas quando fizer resumos." 
    )

    messages = [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": (
                f"{context_text}\n\n"
                f"Pergunta do usuário: {payload.prompt.strip()}"
            ),
        },
    ]

    # histórico opcional
    if payload.messages:
        for msg in payload.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

    body = {
        "model": settings.LLM_MODEL,
        "messages": messages,
        "temperature": 0.4,
    }

    async with httpx.AsyncClient(timeout=40.0) as client:
        response = await client.post(
            settings.LLM_API_URL,
            headers={
                "Authorization": f"Bearer {settings.API_KEY}",
                "Content-Type": "application/json",
            },
            json=body,
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao consultar o LLM: {response.status_code} - {response.text}",
        )

    data = response.json()

    answer = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content")
    )

    if not answer:
        answer = "Não foi possível gerar resposta."

    return LLMResponse(answer=answer)