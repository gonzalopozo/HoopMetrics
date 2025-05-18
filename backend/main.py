from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, select

from .config import get_settings
from .database import engine

from .routers import home, debug, players

env = get_settings()

app = FastAPI()
app.include_router(home.router)
app.include_router(debug.router)
app.include_router(players.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[env.FRONTEND_URL],            # Permite todas las fuentes
    allow_credentials=True,                      # Permite envío de cookies y cabeceras de autenticación
    allow_methods=["*"],                         # Permite todos los métodos HTTP
    allow_headers=["*"],                         # Permite todas las cabeceras
)

@app.get("/")
def health_check():
    try:
        with Session(engine) as session:
            # Consulta simple para verificar la conexión
            session.exec(select(1)).one()
            return {"status": "ok"}
    except Exception as e:
        print(f"Error connecting to database: {e}")
        # No lanzamos excepción aquí para permitir que la app inicie de todos modos
        return {"status": "error", "message": str(e)}
