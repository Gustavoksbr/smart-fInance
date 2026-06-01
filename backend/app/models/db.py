# =============================================================================
# app/models/db.py
#
# Simulação de banco de dados em memória para fins didáticos.
# Em produção: substitua por SQLAlchemy + PostgreSQL/SQLite.
# =============================================================================
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class UserDB:
    id: int
    name: str
    email: str
    hashed_password: str
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DashboardDB:
    id: int
    name: str
    owner_id: int
    records: list[dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# "Tabelas" em memória
# ---------------------------------------------------------------------------
users_db: dict[int, UserDB] = {}
dashboards_db: dict[int, DashboardDB] = {}

_user_counter = 0
_dashboard_counter = 0


def next_user_id() -> int:
    global _user_counter
    _user_counter += 1
    return _user_counter


def next_dashboard_id() -> int:
    global _dashboard_counter
    _dashboard_counter += 1
    return _dashboard_counter


def get_user_by_email(email: str) -> Optional[UserDB]:
    return next((u for u in users_db.values() if u.email == email), None)
