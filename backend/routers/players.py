from fastapi import APIRouter, Depends
from sqlmodel import desc, func, select
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession
from ..models import Match, PointsProgression, PointsTypeDistribution, PlayerBarChartData, PlayerBarChartData, MinutesProgression, ParticipationRate, PositionAverage
from typing import List
from sqlalchemy import func, cast, Integer, Float
import statistics
from collections import Counter

from ..deps import get_db
from ..models import MatchStatistic, Player, PlayerRead, StatRead, Team, TeamRead, PlayerSkillProfile, AdvancedImpactMatrix

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

@router.get("/{id}/advanced/impact-matrix", response_model=AdvancedImpactMatrix)
async def player_advanced_impact_matrix(id: int, session: AsyncSession = Depends(get_db)):
    """
    Métricas avanzadas: Win Shares y VORP estimados (más realistas)
    """
    try:
        stmt = select(
            func.avg(MatchStatistic.points).label("avg_points"),
            func.avg(MatchStatistic.rebounds).label("avg_rebounds"),
            func.avg(MatchStatistic.assists).label("avg_assists"),
            func.avg(MatchStatistic.steals).label("avg_steals"),
            func.avg(MatchStatistic.blocks).label("avg_blocks"),
            func.avg(MatchStatistic.turnovers).label("avg_turnovers"),
            func.avg(MatchStatistic.minutes_played).label("avg_minutes"),
            func.avg(MatchStatistic.field_goals_made).label("avg_fgm"),
            func.avg(MatchStatistic.field_goals_attempted).label("avg_fga"),
            func.avg(MatchStatistic.three_points_made).label("avg_3pm"),
            func.avg(MatchStatistic.three_points_attempted).label("avg_3pa"),
            func.avg(MatchStatistic.free_throws_made).label("avg_ftm"),
            func.avg(MatchStatistic.free_throws_attempted).label("avg_fta"),
            func.count(MatchStatistic.id).label("games_played")
        ).where(MatchStatistic.player_id == id)
        
        result = await session.execute(stmt)
        row = result.first()
        
        # Convert all values to float to avoid Decimal issues
        avg_points = float(row.avg_points or 0)
        avg_rebounds = float(row.avg_rebounds or 0)
        avg_assists = float(row.avg_assists or 0)
        avg_steals = float(row.avg_steals or 0)
        avg_blocks = float(row.avg_blocks or 0)
        avg_turnovers = float(row.avg_turnovers or 0)
        avg_minutes = float(row.avg_minutes or 0)
        avg_fgm = float(row.avg_fgm or 0)
        avg_fga = float(row.avg_fga or 0)
        avg_3pm = float(row.avg_3pm or 0)
        avg_3pa = float(row.avg_3pa or 0)
        avg_ftm = float(row.avg_ftm or 0)
        avg_fta = float(row.avg_fta or 0)
        games_played = int(row.games_played or 0)

        # Parámetros de referencia de liga (puedes ajustar según tu dataset)
        league_ppg = 110
        league_rpg = 44
        league_spg = 7
        league_bpg = 5
        team_games = 82
        team_minutes = 240  # 5 jugadores * 48 min

        # True Shooting %
        ts_pct = (avg_points) / (2 * (avg_fga + 0.44 * avg_fta)) * 100 if (avg_fga + 0.44 * avg_fta) > 0 else 0

        # Offensive Win Shares (OWS)
        ows = (avg_points + avg_assists * 1.5) / league_ppg

        # Defensive Win Shares (DWS)
        dws = (avg_rebounds + avg_steals + avg_blocks) / (league_rpg + league_spg + league_bpg)

        win_shares = (ows + dws) * (games_played / team_games)

        # BPM estimado
        bpm = (avg_points + avg_rebounds + avg_assists + avg_steals + avg_blocks - avg_turnovers) / avg_minutes * 48 - 15 if avg_minutes > 0 else 0

        # VORP estimado
        minutes_played_total = avg_minutes * games_played
        vorp = ((bpm - (-2.0)) * (minutes_played_total / (team_minutes * team_games))) if avg_minutes > 0 else 0

        return {
            "win_shares": round(win_shares, 2),
            "vorp": round(vorp, 2),
            "true_shooting_pct": round(ts_pct, 1),
            "box_plus_minus": round(bpm, 1),
            "games_played": games_played,
            "minutes_per_game": round(avg_minutes, 1)
        }
    except Exception as e:
        print(f"Error in player_advanced_impact_matrix: {str(e)}")
        raise

@router.get("/{id}/advanced/position-averages", response_model=List[PositionAverage])
async def player_position_averages(id: int, session: AsyncSession = Depends(get_db)):
    """
    Obtiene la media de los 10 valores más frecuentes de métricas avanzadas por posición
    (usando las mismas fórmulas que el endpoint individual)
    """
    try:
        # Obtener datos del jugador target
        player_stmt = select(Player.position).where(Player.id == id)
        player_result = await session.execute(player_stmt)
        player_position = player_result.scalar()
        
        position_mapping = {
            "PF": ["PF"],
            "F-G": ["SF", "SG", "PG"], 
            "C-F": ["C", "PF"],
            "SG": ["SG"],
            "C": ["C"],
            "G-F": ["PG", "SG", "SF"],
            "SF": ["SF"],
            "G": ["PG"],
            "F-C": ["PF", "C"],
            "F": ["PF", "SF"]
        }
        standard_positions = ['PG', 'SG', 'SF', 'PF', 'C']
        position_averages = []

        def top10_mean(values):
            if not values:
                return 0.0
            counter = Counter(values)
            most_common = counter.most_common(10)
            top_values = [v for v, count in most_common]
            return float(sum(top_values)) / len(top_values) if top_values else 0.0

        for standard_pos in standard_positions:
            db_positions_for_standard = []
            for db_pos, standard_list in position_mapping.items():
                if standard_pos in standard_list:
                    db_positions_for_standard.append(db_pos)
            if not db_positions_for_standard:
                continue

            # Obtener todos los valores de cada estadística para la posición
            stmt = select(
                MatchStatistic.points,
                MatchStatistic.rebounds,
                MatchStatistic.assists,
                MatchStatistic.steals,
                MatchStatistic.blocks,
                MatchStatistic.turnovers,
                MatchStatistic.minutes_played,
                MatchStatistic.field_goals_made,
                MatchStatistic.field_goals_attempted,
                MatchStatistic.three_points_made,
                MatchStatistic.three_points_attempted,
                MatchStatistic.free_throws_made,
                MatchStatistic.free_throws_attempted
            ).join(
                Player, MatchStatistic.player_id == Player.id
            ).where(
                Player.position.in_(db_positions_for_standard)
            )

            result = await session.execute(stmt)
            rows = result.fetchall()

            if not rows:
                continue

            # Extraer listas de cada estadística
            points = [float(r.points or 0) for r in rows]
            rebounds = [float(r.rebounds or 0) for r in rows]
            assists = [float(r.assists or 0) for r in rows]
            steals = [float(r.steals or 0) for r in rows]
            blocks = [float(r.blocks or 0) for r in rows]
            turnovers = [float(r.turnovers or 0) for r in rows]
            minutes = [float(r.minutes_played or 0) for r in rows]
            fgm = [float(r.field_goals_made or 0) for r in rows]
            fga = [float(r.field_goals_attempted or 0) for r in rows]
            tpm = [float(r.three_points_made or 0) for r in rows]
            tpa = [float(r.three_points_attempted or 0) for r in rows]
            ftm = [float(r.free_throws_made or 0) for r in rows]
            fta = [float(r.free_throws_attempted or 0) for r in rows]

            # AQUÍ ESTÁ EL PROBLEMA: games_played debe ser un valor estándar (82), no el total de registros
            games_played = 82  # Usar temporada estándar en vez de len(rows)

            # Calcular la media de los 10 valores más frecuentes
            avg_points = top10_mean(points)
            avg_rebounds = top10_mean(rebounds)
            avg_assists = top10_mean(assists)
            avg_steals = top10_mean(steals)
            avg_blocks = top10_mean(blocks)
            avg_turnovers = top10_mean(turnovers)
            avg_minutes = top10_mean(minutes)
            avg_fgm = top10_mean(fgm)
            avg_fga = top10_mean(fga)
            avg_3pm = top10_mean(tpm)
            avg_3pa = top10_mean(tpa)
            avg_ftm = top10_mean(ftm)
            avg_fta = top10_mean(fta)

            # Parámetros de referencia de liga
            league_ppg = 110
            league_rpg = 44
            league_spg = 7
            league_bpg = 5
            team_games = 82
            team_minutes = 240

            # True Shooting %
            ts_pct = (avg_points) / (2 * (avg_fga + 0.44 * avg_fta)) * 100 if (avg_fga + 0.44 * avg_fta) > 0 else 0

            # USAR LAS MISMAS FÓRMULAS QUE EL ENDPOINT INDIVIDUAL
            # Offensive Win Shares (OWS)
            ows = (avg_points + avg_assists * 1.5) / league_ppg

            # Defensive Win Shares (DWS)
            dws = (avg_rebounds + avg_steals + avg_blocks) / (league_rpg + league_spg + league_bpg)

            # Win Shares CON el mismo multiplicador que el endpoint individual
            win_shares = (ows + dws) * (games_played / team_games)

            # BPM estimado
            bmp = (avg_points + avg_rebounds + avg_assists + avg_steals + avg_blocks - avg_turnovers) / avg_minutes * 48 - 15 if avg_minutes > 0 else 0

            # VORP CON la misma fórmula que el endpoint individual
            minutes_played_total = avg_minutes * games_played
            vorp = ((bmp - (-2.0)) * (minutes_played_total / (team_minutes * team_games))) if avg_minutes > 0 else 0

            player_mapped_positions = []
            if player_position in position_mapping:
                player_mapped_positions = position_mapping[player_position]
            is_player_position = standard_pos in player_mapped_positions

            position_averages.append({
                "position": standard_pos,
                "offensive_rating": ts_pct,
                "defensive_rating": max(0, 100 - bmp),
                "minutes_per_game": avg_minutes,
                "win_shares": round(win_shares, 2),
                "vorp": round(vorp, 2),
                "box_plus_minus": round(bmp, 1),
                "is_player_position": is_player_position
            })

        return position_averages

    except Exception as e:
        print(f"Error in player_position_averages: {str(e)}")
        raise
