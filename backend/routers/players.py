from fastapi import APIRouter, Depends
from sqlmodel import desc, func, select
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession
from ..models import Match, PointsProgression, PointsTypeDistribution, PlayerBarChartData, PlayerBarChartData, MinutesProgression, ParticipationRate
from typing import List
from sqlalchemy import cast, Integer

from ..deps import get_db
from ..models import MatchStatistic, Player, PlayerRead, StatRead, Team, TeamRead, PlayerSkillProfile

router = APIRouter(
    prefix="/players",
    tags=["players"]
)

@router.get("/sortedbyppg/{page}", response_model=List[PlayerRead])
async def read_players_sorted_by_ppg_paginated(page:int, session: AsyncSession = Depends(get_db)):
    try:
        limit  = 20
        offset = (page - 1) * limit

        # Subconsulta de medias por jugador
        stats_subq = (
            select(
                MatchStatistic.player_id.label("player_id"),
                func.avg(MatchStatistic.points).label("avg_ppg"),
                func.avg(MatchStatistic.rebounds).label("avg_rpg"),
                func.avg(MatchStatistic.assists).label("avg_apg"),
            )
            .group_by(MatchStatistic.player_id)
            .subquery()
        )

        # Consulta principal uniendo jugadores, equipos y subconsulta de stats
        stmt = (
            select(
                Player.id,
                Player.name,
                Player.birth_date,
                Player.height,
                Player.weight,
                Player.position,
                Player.number,
                Team.full_name.label("team"),
                Player.url_pic,
                func.coalesce(stats_subq.c.avg_ppg, 0.0).label("avg_ppg"),
                func.coalesce(stats_subq.c.avg_rpg, 0.0).label("avg_rpg"),
                func.coalesce(stats_subq.c.avg_apg, 0.0).label("avg_apg"),
            )
            .join(Team, Team.id == Player.current_team_id, isouter=True)
            .join(stats_subq, stats_subq.c.player_id == Player.id, isouter=True)
            .order_by(desc("avg_ppg"))
            .offset(offset)
            .limit(limit)
        )

        response = await session.execute(stmt)
        results = response.all()

        # Mapear a tus Pydantic models PlayerRead / StatRead
        players = []
        for row in results:
            player = PlayerRead(
                id=row.id,
                name=row.name,
                birth_date=row.birth_date,
                height=row.height,
                weight=row.weight,
                position=row.position,
                number=row.number,
                team=TeamRead(full_name=row.team) if row.team else None,
                url_pic=row.url_pic,
                average_stats=StatRead(
                    points=round(row.avg_ppg, 1),
                    rebounds=round(row.avg_rpg, 1),
                    assists=round(row.avg_apg, 1),
                )
            )
            players.append(player)

        return players

    except Exception as e:
        print(f"Error in read_players: {e}")
        raise

@router.get("/{id}", response_model=PlayerRead)
async def read_players_by_id(id: int, session: AsyncSession = Depends(get_db)):
    try:
        # Query the player and use scalars() to get the actual model instance
        result = await session.execute(
            select(Player)
            .where(Player.id == id)
        )
        
        # Extract the Player object with scalars()
        player = result.scalars().first()  # Changed from result.first()

        if not player:
            return PlayerRead()
        
        team = None
        if player.current_team_id:
            team = await session.get(Team, player.current_team_id)

        # Get player statistics and use scalars() here too
        stats_query = select(MatchStatistic).where(MatchStatistic.player_id == player.id)
        result_stats = await session.execute(stats_query)
        stats = result_stats.scalars().all()  # Changed from result_stats.all()

        # Calcular promedios si hay estadísticas
        if stats:
            avg = StatRead(
                points=round(sum(s.points or 0 for s in stats) / len(stats), 1) if any(s.points for s in stats) else 0,
                rebounds=round(sum(s.rebounds or 0 for s in stats) / len(stats), 1) if any(s.rebounds for s in stats) else 0,
                assists=round(sum(s.assists or 0 for s in stats) / len(stats), 1) if any(s.assists for s in stats) else 0,
                steals=round(sum(s.steals or 0 for s in stats) / len(stats), 1) if any(s.steals for s in stats) else 0,
                blocks=round(sum(s.blocks or 0 for s in stats) / len(stats), 1) if any(s.blocks for s in stats) else 0,
                minutes_played=round(sum(s.minutes_played or 0 for s in stats) / len(stats), 1) if any(s.minutes_played for s in stats) else 0.0,
                field_goals_attempted=round(sum(s.field_goals_attempted or 0 for s in stats) / len(stats), 1) if any(s.field_goals_attempted for s in stats) else 0,
                field_goals_made=round(sum(s.field_goals_made or 0 for s in stats) / len(stats), 1) if any(s.field_goals_made for s in stats) else 0,
                three_points_made=round(sum(s.three_points_made or 0 for s in stats) / len(stats), 1) if any(s.three_points_made for s in stats) else 0,
                three_points_attempted=round(sum(s.three_points_attempted or 0 for s in stats) / len(stats), 1) if any(s.three_points_attempted for s in stats) else 0,
                free_throws_made=round(sum(s.free_throws_made or 0 for s in stats) / len(stats), 1) if any(s.free_throws_made for s in stats) else 0,
                free_throws_attempted=round(sum(s.free_throws_attempted or 0 for s in stats) / len(stats), 1) if any(s.free_throws_attempted for s in stats) else 0,
                fouls=round(sum(s.fouls or 0 for s in stats) / len(stats), 1) if any(s.fouls for s in stats) else 0,
                turnovers=round(sum(s.turnovers or 0 for s in stats) / len(stats), 1) if any(s.turnovers for s in stats) else 0,
            )
        else:
            avg = StatRead()
        
        # Crear modelo de respuesta para este jugador
        player_read = PlayerRead(
            id=player.id,
            name=player.name,
            birth_date=player.birth_date,
            height=player.height,
            weight=player.weight,
            position=player.position,
            number=player.number,
            team=TeamRead(full_name=team.full_name) if team else None,
            url_pic=player.url_pic,
            stats=[StatRead(
                points=s.points,
                rebounds=s.rebounds,
                assists=s.assists,
                steals=s.steals,
                blocks=s.blocks,
                minutes_played=s.minutes_played,
                field_goals_attempted=s.field_goals_attempted,
                field_goals_made=s.field_goals_made,
                three_points_made=s.three_points_made,
                three_points_attempted=s.three_points_attempted,
                free_throws_made=s.free_throws_made,
                free_throws_attempted=s.free_throws_attempted,
                fouls=s.fouls,
                turnovers=s.turnovers
            ) for s in stats],
            average_stats=avg
        )
        
        return player_read
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in read_players: {str(e)}")
        # Re-raise it so FastAPI can handle it appropriately
        raise

@router.get("/{id}/basicstats/pointsprogression", response_model=List[PointsProgression])
async def read_players_basic_stats(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve la progresión de puntos por partido para un jugador concreto.
    Formato: [{ "date": "2024-01-12", "points": 28 }, ...]
    """
    try:
        stmt = (
            select(Match.date, MatchStatistic.points)
            .join(Match, Match.id == MatchStatistic.match_id)
            .where(MatchStatistic.player_id == id)
            .order_by(Match.date)
        )
        result = await session.execute(stmt)
        rows = result.all()

        return [
            PointsProgression(date=date.isoformat(), points=points)
            for date, points in rows
        ]

    except Exception as e:
        print(f"Error in read_players_basic_stats: {str(e)}")
        raise

@router.get("/{id}/basicstats/pointstype", response_model=PointsTypeDistribution)
async def read_players_points_by_type(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve la distribución de puntos por tipo de tiro para un jugador concreto.
    Formato: { "two_points": 320, "three_points": 120, "free_throws": 80 }
    """
    try:
        stmt = (
            select(
                func.sum(
                    (func.coalesce(MatchStatistic.field_goals_made, 0) - func.coalesce(MatchStatistic.three_points_made, 0)) * 2
                ).label("two_points"),
                func.sum(
                    func.coalesce(MatchStatistic.three_points_made, 0) * 3
                ).label("three_points"),
                func.sum(
                    func.coalesce(MatchStatistic.free_throws_made, 0)
                ).label("free_throws")
            )
            .where(MatchStatistic.player_id == id)
        )
        result = await session.execute(stmt)
        row = result.first()
        return {
            "two_points": row.two_points or 0,
            "three_points": row.three_points or 0,
            "free_throws": row.free_throws or 0
        }
    except Exception as e:
        print(f"Error in read_players_points_by_type: {str(e)}")
        raise

@router.get("/{id}/basicstats/skillprofile", response_model=PlayerSkillProfile)
async def read_player_skill_profile(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve el perfil de habilidades del jugador para el radar chart.
    """
    try:
        # Obtener promedios de average_stats
        result = await session.execute(
            select(
                func.avg(MatchStatistic.points).label("points"),
                func.avg(MatchStatistic.rebounds).label("rebounds"),
                func.avg(MatchStatistic.assists).label("assists"),
                func.avg(MatchStatistic.steals).label("steals"),
                func.avg(MatchStatistic.blocks).label("blocks"),
            ).where(MatchStatistic.player_id == id)
        )
        row = result.first()
        return PlayerSkillProfile(
            points=round(row.points or 0, 1),
            rebounds=round(row.rebounds or 0, 1),
            assists=round(row.assists or 0, 1),
            steals=round(row.steals or 0, 1),
            blocks=round(row.blocks or 0, 1),
        )
    except Exception as e:
        print(f"Error in read_player_skill_profile: {str(e)}")
        raise

@router.get("/{id}/basicstats/barcompare", response_model=List[PlayerBarChartData])
async def read_player_bar_compare(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve estadísticas básicas diferentes al radar chart para el Bar Chart.
    Formato: [{ "name": "MIN", "value": 32.1 }, ...]
    """
    try:
        result = await session.execute(
            select(
                func.avg(MatchStatistic.minutes_played).label("min"),
                func.avg(MatchStatistic.field_goals_attempted).label("fga"),
                func.avg(MatchStatistic.field_goals_made).label("fgm"),
                func.avg(MatchStatistic.three_points_attempted).label("tpa"),
                func.avg(MatchStatistic.three_points_made).label("tpm"),
                func.avg(MatchStatistic.free_throws_attempted).label("fta"),
                func.avg(MatchStatistic.free_throws_made).label("ftm"),
                func.avg(MatchStatistic.turnovers).label("to"),
                func.avg(MatchStatistic.fouls).label("pf"),
            ).where(MatchStatistic.player_id == id)
        )
        row = result.first()
        return [
            {"name": "MIN", "value": round(row.min or 0, 1)},
            {"name": "FGA", "value": round(row.fga or 0, 1)},
            {"name": "FGM", "value": round(row.fgm or 0, 1)},
            {"name": "3PA", "value": round(row.tpa or 0, 1)},
            {"name": "3PM", "value": round(row.tpm or 0, 1)},
            {"name": "FTA", "value": round(row.fta or 0, 1)},
            {"name": "FTM", "value": round(row.ftm or 0, 1)},
            {"name": "TO", "value": round(row.to or 0, 1)},
            {"name": "PF", "value": round(row.pf or 0, 1)},
        ]
    except Exception as e:
        print(f"Error in read_player_bar_compare: {str(e)}")
        raise

@router.get("/{id}/basicstats/minutesprogression", response_model=List[MinutesProgression])
async def read_players_minutes_progression(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve la evolución de minutos jugados por partido para un jugador concreto.
    Formato: [{ "date": "2024-01-12", "minutes": 32 }, ...]
    """
    try:
        stmt = (
            select(Match.date, MatchStatistic.minutes_played)
            .join(Match, Match.id == MatchStatistic.match_id)
            .where(MatchStatistic.player_id == id)
            .order_by(Match.date)
        )
        result = await session.execute(stmt)
        rows = result.all()

        return [
            MinutesProgression(date=date.isoformat(), minutes=minutes or 0)
            for date, minutes in rows
        ]
    except Exception as e:
        print(f"Error in read_players_minutes_progression: {str(e)}")
        raise

@router.get("/{id}/basicstats/participationrates", response_model=List[ParticipationRate])
async def read_player_participation_rates(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve totales de participación en acciones básicas para un jugador.
    Los valores representan número de juegos, máximo 85.
    """
    try:
        # Partidos jugados por el jugador
        games_played_stmt = select(func.count()).select_from(MatchStatistic).where(
            MatchStatistic.player_id == id
        )
        games_played_result = await session.execute(games_played_stmt)
        games_played = games_played_result.scalar() or 0

        # Partidos con 20+ puntos
        games_20pts_stmt = select(func.count()).select_from(MatchStatistic).where(
            (MatchStatistic.player_id == id) & (MatchStatistic.points >= 20)
        )
        games_20pts_result = await session.execute(games_20pts_stmt)
        games_20pts = games_20pts_result.scalar() or 0

        # Partidos con doble-doble (al menos 10 en dos categorías)
        double_double_stmt = select(func.count()).select_from(MatchStatistic).where(
            (MatchStatistic.player_id == id) &
            (
                (cast(MatchStatistic.points >= 10, Integer) +
                 cast(MatchStatistic.rebounds >= 10, Integer) +
                 cast(MatchStatistic.assists >= 10, Integer) +
                 cast(MatchStatistic.steals >= 10, Integer) +
                 cast(MatchStatistic.blocks >= 10, Integer)
                ) >= 2
            )
        )
        double_double_result = await session.execute(double_double_stmt)
        double_doubles = double_double_result.scalar() or 0

        # Partidos con al menos 1 triple anotado
        games_3pt_stmt = select(func.count()).select_from(MatchStatistic).where(
            (MatchStatistic.player_id == id) & (MatchStatistic.three_points_made >= 1)
        )
        games_3pt_result = await session.execute(games_3pt_stmt)
        games_3pt = games_3pt_result.scalar() or 0

        # Devolver los valores totales (máximo 85 cada uno)
        return [
            {"label": "Games Played", "value": float(min(games_played, 85))},
            {"label": "20+ Points", "value": float(min(games_20pts, 85))},
            {"label": "Double-Doubles", "value": float(min(double_doubles, 85))},
            {"label": "3PT Made", "value": float(min(games_3pt, 85))},
        ]
    except Exception as e:
        print(f"Error in read_player_participation_rates: {str(e)}")
        raise