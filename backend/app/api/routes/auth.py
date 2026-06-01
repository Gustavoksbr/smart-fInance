# =============================================================================
# app/api/routes/auth.py — Registro e Login
# =============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.jwt import create_access_token
from app.core.security import verify_password
from app.models.database import get_db
from app.models import crud
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserOut

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar novo usuário",
    description=(
        "Cria um novo usuário. A senha é validada pelo Pydantic (8–72 chars) "
        "antes de chegar ao bcrypt, prevenindo a vulnerabilidade de truncamento."
    ),
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    # Verifica duplicidade de e-mail
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado.",
        )

    # Cria usuário no banco de dados
    user = crud.create_user(db, payload.name, payload.email, payload.password)

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login e obtenção de JWT",
)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = crud.get_user_by_email(db, payload.email)

    # Mensagem genérica para não revelar se o e-mail existe (user enumeration)
    invalid_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas.",
    )

    if not user:
        raise invalid_exc

    if not verify_password(payload.password, user.hashed_password):
        raise invalid_exc

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )

