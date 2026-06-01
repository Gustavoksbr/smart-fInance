# =============================================================================
# app/models/init_db.py — Database Initialization
# =============================================================================
from app.models.database import engine, Base
from app.models.models import User, Dashboard, FinancialRecordDB


def init_db():
    """Cria todas as tabelas no banco de dados"""
    print("Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas com sucesso!")


if __name__ == "__main__":
    init_db()
