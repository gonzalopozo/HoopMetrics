from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import User, UserRole
from .security import hash_password, verify_password

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, username: str, email: str, password: str, role: UserRole = UserRole.free):
    pwd_hash = hash_password(password)
    user = User(username=username, email=email, password_hash=pwd_hash, role=role)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def authenticate_user(db: AsyncSession, email: str, password: str):
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user

async def update_user_role(db: AsyncSession, id: int, new_role: UserRole):
    user = await db.get(User, id)
    if not user:
        return None
    user.role = new_role
    await db.commit()
    await db.refresh(user)
    return user

async def update_user_profile(
    db: AsyncSession, 
    user_id: int, 
    username: str = None, 
    profile_image_url: str = None
):
    """Actualiza el perfil del usuario"""
    user = await db.get(User, user_id)
    if not user:
        return None
    
    # Actualizar campos si se proporcionan
    if username is not None:
        # Verificar que el username no esté ya en uso
        existing_user = await get_user_by_username(db, username)
        if existing_user and existing_user.id != user_id:
            raise ValueError("Username already exists")
        user.username = username
    
    if profile_image_url is not None:
        user.profile_image_url = profile_image_url
    
    await db.commit()
    await db.refresh(user)
    return user

async def get_user_by_username(db: AsyncSession, username: str):
    """Obtiene un usuario por username"""
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()

async def get_user_profile(db: AsyncSession, user_id: int):
    """Obtiene el perfil completo del usuario"""
    user = await db.get(User, user_id)
    return user

