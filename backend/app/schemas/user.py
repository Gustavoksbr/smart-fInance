# =============================================================================
# app/schemas/user.py
#
# Schemas Pydantic para criação e leitura de usuários.
#
# REGRA DE NEGÓCIO CRÍTICA — LIMITE DE 72 CARACTERES (bcrypt):
#   O Pydantic valida o tamanho da senha ANTES de qualquer operação de hashing.
#   Isso garante que nunca chegue ao bcrypt uma senha maior que 72 bytes,
#   prevenindo silenciosamente a vulnerabilidade de truncamento.
#
#   Referência: https://security.stackexchange.com/q/39849
# =============================================================================

from pydantic import BaseModel, EmailStr, Field, field_validator

# ---------------------------------------------------------------------------
# Constantes de validação — centralizadas para reutilização no frontend
# ---------------------------------------------------------------------------
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 72  # ← limite estrutural do bcrypt (72 bytes UTF-8)


class UserCreate(BaseModel):
    """Schema usado no endpoint POST /api/auth/register."""

    name: str = Field(..., min_length=2, max_length=50, examples=["João Silva"])
    email: EmailStr = Field(..., max_length=255, examples=["joao@email.com"])

    password: str = Field(
        ...,
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description=(
            f"Senha entre {PASSWORD_MIN_LENGTH} e {PASSWORD_MAX_LENGTH} caracteres. "
            f"O limite de {PASSWORD_MAX_LENGTH} é imposto pela limitação estrutural "
            f"do algoritmo bcrypt, que ignora silenciosamente bytes após o {PASSWORD_MAX_LENGTH}º."
        ),
        examples=["MinhaSenhaSegura123!"],
    )

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, value: str) -> str:
        """
        Validação adicional de complexidade:
          - Pelo menos 1 letra maiúscula
          - Pelo menos 1 dígito numérico

        Adapte as regras conforme a política de segurança do seu produto.
        """
        if not any(c.isupper() for c in value):
            raise ValueError("A senha deve conter ao menos uma letra maiúscula.")
        if not any(c.isdigit() for c in value):
            raise ValueError("A senha deve conter ao menos um dígito numérico.")
        return value

    @field_validator("password")
    @classmethod
    def validate_no_whitespace_only(cls, value: str) -> str:
        """Impede senhas compostas apenas de espaços."""
        if value.strip() == "":
            raise ValueError("A senha não pode ser composta somente de espaços.")
        return value


class UserLogin(BaseModel):
    """Schema usado no endpoint POST /api/auth/login."""

    email: EmailStr
    # Aplicamos o mesmo limite máximo no login para evitar ataques de DoS
    # com hashing de strings extremamente longas.
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX_LENGTH)


class UserOut(BaseModel):
    """Dados do usuário retornados ao cliente (nunca expõe o hash)."""

    id: int
    name: str
    email: EmailStr

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Resposta do endpoint de login/register com JWT."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut
