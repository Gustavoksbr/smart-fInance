# =============================================================================
# app/models/models.py — SQLAlchemy Models
# =============================================================================
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.models.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento
    dashboards = relationship("Dashboard", back_populates="owner", cascade="all, delete-orphan")


class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    owner = relationship("User", back_populates="dashboards")
    records = relationship("FinancialRecordDB", back_populates="dashboard", cascade="all, delete-orphan")


class FinancialRecordDB(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"), nullable=False)
    data = Column(String(10), nullable=False)  # formato YYYY-MM-DD
    nome = Column(String(50), nullable=False)
    descricao = Column(String(200), nullable=False, default="")
    categoria = Column(String(50), nullable=False)
    valor = Column(Float, nullable=False)
    tipo = Column(String(10), nullable=False)  # receita ou despesa
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento
    dashboard = relationship("Dashboard", back_populates="records")
