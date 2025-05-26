from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select
import logging
import traceback

from models import UserRole
from deps import get_db, require_role
from config import get_settings
from database import engine
from routers import home, debug, players, auth, teams
from sqlmodel.ext.asyncio.session import AsyncSession

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

env = get_settings()

app = FastAPI()
app.include_router(home.router)
app.include_router(debug.router)
app.include_router(players.router)
app.include_router(auth.router)
app.include_router(teams.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and catch exceptions to prevent 500 errors"""
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.url.path}")
        logger.error(f"Error: {str(e)}")
        logger.error(traceback.format_exc())
        # Return a more graceful error
        return {"status": "error", "message": "Internal server error", "details": str(e)}

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "API is running"}

@app.get("/health/db")
async def db_health_check():
    """Separate function to test database without depending on session"""
    try:
        # Create a one-time session instead of using Depends
        from database import async_session_factory
        async with async_session_factory() as session:
            result = await session.execute(select(1))
            value = result.one()
            return {"status": "ok", "database": "connected", "test_value": value}
    except Exception as e:
        error_details = str(e)
        logger.error(f"Database connection error: {error_details}")
        return {"status": "error", "message": "Database connection failed", "details": error_details}

# Ejemplo de endpoint protegido por rol
@app.get("/admin/dashboard")
async def admin_dashboard(user=Depends(require_role(UserRole.admin))):
    return {"msg": f"Bienvenido, {user.username}. Solo admins pueden ver esto."}