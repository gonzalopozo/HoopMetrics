from fastapi import APIRouter, Depends
from sqlmodel import desc, func, select
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession

from deps import get_db
from models import MatchStatistic, Player, PlayerRead, StatRead, Team, TeamRead

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

        response = await session.exec(stmt)
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
        # Primero verificamos si hay jugadores en la base de datos
        # Obtenemos como máximo 20 jugadores de la base de datos
        result = await session.exec(
            select(Player)
            .where(Player.id == id)
        )

        player = result.first()  # <-- Notar los paréntesis en all()

        if not player:
            return PlayerRead()
        
        team = None
        if player.current_team_id:
            team = await session.get(Team, player.current_team_id)
            # team = result2.first()  # <-- Notar los paréntesis en all()

        # Consulta específica para las estadísticas de este jugador
        stats_query = select(MatchStatistic).where(MatchStatistic.player_id == player.id)
        result_stats = await session.exec(stats_query)
        stats = result_stats.all()

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