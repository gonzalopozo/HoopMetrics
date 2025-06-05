from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import select
import logging
import traceback

from .models import UserRole
from .deps import get_db, require_role
from .config import get_settings
from .routers import home, debug, players, auth, teams, favorites
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
app.include_router(favorites.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        # Return a proper JSONResponse instead of a dict
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Internal server error", "details": str(e)}
        )

@app.middleware("http")
async def convert_responses_to_json(request: Request, call_next):
    """Ensure all responses are proper JSONResponse objects"""
    try:
        # Call the next middleware or endpoint
        response = await call_next(request)
        
        # If already a response object, return it
        if isinstance(response, JSONResponse):
            return response
            
        # If it's a dict, convert to JSONResponse
        if isinstance(response, dict):
            return JSONResponse(content=response)
            
        # Otherwise, return the original response
        return response
    except Exception as e:
        # Log the error and return a JSON error response
        logger.error(f"Error processing request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Internal server error", "details": str(e)}
        )

@app.get("/")
async def health_check():
    return JSONResponse(content={"status": "ok", "message": "API is running"})

@app.get("/health/db")
async def db_health_check():
    """Test database connection using a proper session lifecycle."""
    session = None
    try:
        # Import the db module
        from .database import SessionLocal
        
        # Create a session specifically for this check
        session = SessionLocal()
        result = await session.execute(select(1))
        value = result.scalar_one()
        return JSONResponse(content={"status": "ok", "database": "connected", "test_value": value})
    except Exception as e:
        error_details = str(e)
        logger.error(f"Database connection error: {error_details}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Database connection failed", "details": error_details}
        )

# Ejemplo de endpoint protegido por rol
@app.get("/admin/dashboard")
async def admin_dashboard(user=Depends(require_role(UserRole.admin))):
    return {"msg": f"Bienvenido, {user.username}. Solo admins pueden ver esto."}