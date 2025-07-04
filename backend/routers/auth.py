# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
# from datetime import timedelta
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from crud import create_user, authenticate_user, get_user_by_email, update_user_role
from deps import get_db
from security import create_access_token
from models import UserRole

router = APIRouter(
    prefix="/auth", tags=["auth"]
)

class SignUpRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.free

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # username: str
    # role: UserRole

class UpgradeRequest(BaseModel):
    email: EmailStr
    new_role: UserRole

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignUpRequest, db: AsyncSession = Depends(get_db)):
    try:
        existing = await authenticate_user(db, data.email, data.password)
        if existing:
            raise HTTPException(status_code=400, detail="Usuario ya existe")
        user = await create_user(db, data.username, data.email, data.password, data.role)
        token = create_access_token({"sub": user.email, "role": user.role.value, "username": user.username})
        return TokenResponse(
            access_token=token,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear el usuario: {str(e)}")

@router.post("/login", response_model=TokenResponse)
async def login(form_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await authenticate_user(db, form_data.email, form_data.password)
        print(user)
        if not user:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        token = create_access_token({"sub": user.email, "role": user.role.value, "username": user.username})
        return TokenResponse(
            access_token=token,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al iniciar sesión: {str(e)}")

@router.post("/upgrade", response_model=TokenResponse)
async def upgrade_subscription(data: UpgradeRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await get_user_by_email(db, data.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await update_user_role(db, user.id, data.new_role)
        token = create_access_token({"sub": user.email, "role": data.new_role.value, "username": user.username})
        return TokenResponse(access_token=token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la suscripción: {str(e)}")