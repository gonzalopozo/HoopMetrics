from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..models import Player, Team
from ..database import get_session

router = APIRouter(
    prefix="/debug",
    tags=["debug"]
)

@router.get("/debug/players/count")
def get_player_count(session: Session = Depends(get_session)):
    try:
        count = session.exec(select(Player)).all()
        return {"count": len(count), "players": [p.name for p in count]}
    except Exception as e:
        return {"error": str(e)}


@router.get("/debug/teams/count")
def get_team_count(session: Session = Depends(get_session)):
    try:
        count = session.exec(select(Team)).all()
        return {"count": len(count), "teams": [t.full_name for t in count]}
    except Exception as e:
        return {"error": str(e)}
