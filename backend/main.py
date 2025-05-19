from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, select

from models import UserRole

from deps import get_db, require_role


from config import get_settings
from database import engine

from routers import home, debug, players, auth
from sqlmodel.ext.asyncio.session import AsyncSession



env = get_settings()

app = FastAPI()
app.include_router(home.router)
app.include_router(debug.router)
app.include_router(players.router)
app.include_router(auth.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],            # Permite todas las fuentes
    allow_credentials=True,                      # Permite envío de cookies y cabeceras de autenticación
    allow_methods=["*"],                         # Permite todos los métodos HTTP
    allow_headers=["*"],                         # Permite todas las cabeceras
)

@app.get("/")
async def health_check(session: AsyncSession = Depends(get_db)):
    try:
        result = await session.exec(select(1))
        abc = result.one()
        return {"status": "ok"}
    except Exception as e:
        print(f"Error connecting to database: {e}")
        # No lanzamos excepción aquí para permitir que la app inicie de todos modos
        return {"status": "error", "message": str(e)}

# Ejemplo de endpoint protegido por rol
@app.get("/admin/dashboard")
async def admin_dashboard(user=Depends(require_role(UserRole.admin))):
    return {"msg": f"Bienvenido, {user.username}. Solo admins pueden ver esto."}