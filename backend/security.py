from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

from .config import get_settings

env = get_settings()

PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = env.AUTH_SECRET_KEY
ALGORITHM = env.AUTH_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = env.AUTH_ACCESS_TOKEN_EXPIRE_MINUTES

def hash_password(password: str) -> str:
    return PWD_CONTEXT.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return PWD_CONTEXT.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
