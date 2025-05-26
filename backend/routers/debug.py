from fastapi import APIRouter, Depends
from sqlmodel import select

from deps import get_db
from models import Player, Team
from sqlmodel.ext.asyncio.session import AsyncSession


router = APIRouter(
    prefix="/debug",
    tags=["debug"]
)

@router.get("/debug/players/count")
async def get_player_count(session: AsyncSession = Depends(get_db)):
    try:
        result = await session.execute(select(Player))
        count = result.all()
        return {"count": len(count), "players": [p.name for p in count]}
    except Exception as e:
        return {"error": str(e)}


@router.get("/debug/teams/count")
async def get_team_count(session: AsyncSession = Depends(get_db)):
    try:
        result = await session.execute(select(Team))
        count = result.all()
        return {"count": len(count), "teams": [t.full_name for t in count]}
    except Exception as e:
        return {"error": str(e)}
