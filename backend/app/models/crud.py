# =============================================================================
# app/models/crud.py — Database CRUD Operations
# =============================================================================
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import User, Dashboard, FinancialRecordDB
from app.core.security import get_password_hash


# ---------------------------------------------------------------------------
# User CRUD
# ---------------------------------------------------------------------------

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, name: str, email: str, password: str) -> User:
    hashed_password = get_password_hash(password)
    user = User(name=name, email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Dashboard CRUD
# ---------------------------------------------------------------------------

def create_dashboard(db: Session, name: str, owner_id: int) -> Dashboard:
    dashboard = Dashboard(name=name, owner_id=owner_id)
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)
    return dashboard


def get_dashboard_by_id(db: Session, dashboard_id: int) -> Optional[Dashboard]:
    return db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()


def get_user_dashboards(db: Session, owner_id: int) -> List[Dashboard]:
    return db.query(Dashboard).filter(Dashboard.owner_id == owner_id).all()


# ---------------------------------------------------------------------------
# Financial Record CRUD
# ---------------------------------------------------------------------------

def create_financial_record(
    db: Session,
    dashboard_id: int,
    data: str,
    nome: str,
    descricao: str,
    categoria: str,
    valor: float,
    tipo: str,
) -> FinancialRecordDB:
    record = FinancialRecordDB(
        dashboard_id=dashboard_id,
        data=data,
        nome=nome,
        descricao=descricao,
        categoria=categoria,
        valor=valor,
        tipo=tipo,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_dashboard_records(db: Session, dashboard_id: int) -> List[FinancialRecordDB]:
    return db.query(FinancialRecordDB).filter(FinancialRecordDB.dashboard_id == dashboard_id).all()


def get_record_by_id(db: Session, record_id: int) -> Optional[FinancialRecordDB]:
    return db.query(FinancialRecordDB).filter(FinancialRecordDB.id == record_id).first()


def get_record_by_name_in_dashboard(db: Session, dashboard_id: int, nome: str) -> Optional[FinancialRecordDB]:
    """Busca um registro pelo nome dentro de um dashboard específico."""
    return db.query(FinancialRecordDB).filter(
        FinancialRecordDB.dashboard_id == dashboard_id,
        FinancialRecordDB.nome == nome
    ).first()


def update_financial_record(
    db: Session,
    record: FinancialRecordDB,
    data: str,
    nome: str,
    descricao: str,
    categoria: str,
    valor: float,
    tipo: str,
) -> FinancialRecordDB:
    record.data = data
    record.nome = nome
    record.descricao = descricao
    record.categoria = categoria
    record.valor = valor
    record.tipo = tipo
    db.commit()
    db.refresh(record)
    return record


def delete_financial_record(db: Session, record: FinancialRecordDB) -> None:
    db.delete(record)
    db.commit()
