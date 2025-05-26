from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import case, desc, func, select
from sqlmodel.ext.asyncio.session import AsyncSession


from models import Match, MatchStatistic, Player, PlayerRead, StatRead, Team, TeamRead, TopPerformer
from deps import get_db

router = APIRouter(
    prefix="/home",
    tags=["home"]
)


@router.get("/top-performers", response_model=List[TopPerformer])
async def read_top_performers(session: AsyncSession = Depends(get_db)):
    try:
        matchs = await session.execute(
            select(Match)
            .where(Match.home_score != None)
            .where(Match.away_score != None)
            .order_by(desc(Match.date))
            .limit(2)
        )

        performers: List[TopPerformer] = []
        for matc in matchs:
            # matchss.append(match)
            # 1) Expresión para 'side'
            side_expr = case(
                (Player.current_team_id == matc.home_team_id,  'home'),
                (Player.current_team_id == matc.away_team_id, 'away'),
                else_='other'
            ).label("side")

            # 2) Expresión para 'total' = points + rebounds + assists
            total_expr = (
                func.coalesce(MatchStatistic.points,  0) +
                func.coalesce(MatchStatistic.rebounds,0) +
                func.coalesce(MatchStatistic.assists, 0)
            ).label("total")

            # 3) Statement con DISTINCT ON(side)
            stmt = (
                select(
                    MatchStatistic,
                    total_expr,
                    Player.id.label("player_id"),
                    Player.name.label("player_name"),
                    Player.current_team_id.label("player_team_id"),
                    Player.url_pic.label("player_url_pic"),
                    side_expr,
                )
                .join(Player, MatchStatistic.player_id == Player.id)
                .where(MatchStatistic.match_id == matc.id)
                .distinct(side_expr)
                .order_by(side_expr, desc(total_expr))
            )

            # 4) Ejecutar y mapear resultados
            result = await session.execute(stmt)
            rows = result.all()

            for stat, total, player_id, player_name, player_team_id, player_url_pic, side in rows:
                if (side == 'other'): continue

                match = matc  # Ya lo tienes
                team = await session.get(Team, player_team_id) if player_team_id else None

                performers.append(
                    TopPerformer(
                        id         = player_id,
                        name       = player_name,
                        team       = TeamRead(full_name=team.full_name) if team else None,
                        url_pic    = player_url_pic,
                        game_stats = StatRead(
                            points=stat.points or 0,
                            rebounds=stat.rebounds or 0,
                            assists=stat.assists or 0,
                            steals=stat.steals or 0,
                            blocks=stat.blocks or 0,
                            minutes_played=stat.minutes_played or 0.0,
                            field_goals_attempted=stat.field_goals_attempted or 0,
                            field_goals_made=stat.field_goals_made or 0,
                            three_points_made=stat.three_points_made or 0,
                            three_points_attempted=stat.three_points_attempted or 0,
                            free_throws_made=stat.free_throws_made or 0,
                            free_throws_attempted=stat.free_throws_attempted or 0,
                            fouls=stat.fouls or 0,
                            turnovers=stat.turnovers or 0,
                        ),
                        isWinner = (
                            (side == 'home' and match.home_score > match.away_score)
                            or
                            (side == 'away' and match.away_score > match.home_score)
                        ),
                        points   = int(stat.points or 0),
                        rebounds = int(stat.rebounds or 0),
                        assists  = int(stat.assists or 0),
                    )
                )
        
        return performers
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in read_players: {str(e)}")
        # Re-raise it so FastAPI can handle it appropriately
        raise
