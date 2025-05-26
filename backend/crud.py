from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import User, UserRole
from security import hash_password, verify_password

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
