from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select, select

from models import UserRole

from deps import get_db, require_role


from config import get_settings
from database import engine

from routers import home, debug, players, auth, teams
from sqlmodel.ext.asyncio.session import AsyncSession



env = get_settings()

app = FastAPI()
app.include_router(home.router)
app.include_router(debug.router)
app.include_router(players.router)
app.include_router(auth.router)
app.include_router(teams.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],            # Permite todas las fuentes
    allow_credentials=True,                      # Permite envío de cookies y cabeceras de autenticación
    allow_methods=["*"],                         # Permite todos los métodos HTTP
    allow_headers=["*"],                         # Permite todas las cabeceras
)

@app.get("/")
async def health_check():
    try:
        # Simple health check without DB connection first
        return {"status": "ok", "message": "API is running"}
    except Exception as e:
        print(f"Error in health check: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/health/db")
async def db_health_check(session: AsyncSession = Depends(get_db)):
    try:
        result = await session.exec(select(1))
        abc = result.one()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return {"status": "error", "message": str(e)}

# Ejemplo de endpoint protegido por rol
@app.get("/admin/dashboard")
async def admin_dashboard(user=Depends(require_role(UserRole.admin))):
    return {"msg": f"Bienvenido, {user.username}. Solo admins pueden ver esto."}