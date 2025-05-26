# app/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database import async_session_factory
from security import decode_access_token
from models import User, UserRole
from sqlalchemy.ext.asyncio import AsyncSession
from crud import get_user_by_email
import logging

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_db():
    session = async_session_factory()
    try:
        yield session
    except Exception as e:
        logging.error(f"Database connection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection error"
        )
    finally:
        await session.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido") 
    email: str = payload.get("sub")
    user = await get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user

def require_role(*roles: UserRole):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permiso denegado")
        return user
    return role_checker
