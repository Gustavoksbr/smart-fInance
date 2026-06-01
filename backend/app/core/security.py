# =============================================================================
# app/core/security.py
#
# Funções utilitárias de segurança utilizando passlib com backend bcrypt.
#
# ⚠️  LIMITAÇÃO BCRYPT — LEITURA OBRIGATÓRIA:
#     O algoritmo bcrypt possui uma limitação estrutural clássica: ele ignora
#     silenciosamente qualquer byte após o 72º (truncamento de senha).
#     Isso significa que senhas diferentes cujos primeiros 72 bytes coincidem
#     seriam aceitas como equivalentes — uma vulnerabilidade grave.
#
#     MITIGAÇÃO APLICADA NESTE PROJETO:
#       1. O schema Pydantic `UserCreate` rejeita senhas > 72 caracteres ainda
#          na camada de validação (antes de qualquer hashing).
#       2. O front-end React reforça o mesmo limite no campo de formulário
#          (maxLength=72 + validação de estado controlado).
#       3. Estas funções são a última linha de defesa — nunca recebem senhas
#          maiores que 72 chars se os layers anteriores funcionarem.
# =============================================================================

from passlib.context import CryptContext

# CryptContext com esquema bcrypt (rounds padrão = 12 — bom equilíbrio entre
# segurança e performance; aumente para 14+ em ambientes de altíssima segurança)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(plain_password: str) -> str:
    """
    Gera o hash bcrypt de uma senha em texto puro.

    Args:
        plain_password: Senha já validada (máx. 72 chars) vinda do schema.

    Returns:
        String com o hash bcrypt no formato $2b$<rounds>$<salt><hash>.
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha em texto puro corresponde ao hash armazenado.

    A comparação é feita pelo passlib de forma segura (timing-safe),
    evitando ataques de timing.

    Args:
        plain_password:   Senha enviada pelo usuário no login.
        hashed_password:  Hash bcrypt armazenado no banco de dados.

    Returns:
        True se a senha corresponder ao hash, False caso contrário.
    """
    return pwd_context.verify(plain_password, hashed_password)
