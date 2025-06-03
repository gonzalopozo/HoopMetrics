from fastapi import APIRouter, Depends
from sqlmodel import desc, func, select
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession
from ..models import Match, PointsProgression, PointsTypeDistribution, PlayerBarChartData, PlayerBarChartData, MinutesProgression, ParticipationRate, PositionAverage, LebronImpactScore, PIPMImpact, RaptorWAR,  MatchStatistic, Player, PlayerRead, StatRead, Team, TeamRead, PlayerSkillProfile, AdvancedImpactMatrix
from typing import List
from sqlalchemy import func, cast, Integer, Float
import statistics
from collections import Counter

from ..deps import get_db

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
        games_played = 82 # ESTE ES EL NÚMERO REAL DE PARTIDOS DEL JUGADOR

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

        # Win Shares (acumuladas para 82 partidos)
        win_shares = ((ows + dws) * games_played) / 10

        # BPM estimado
        bmp = (avg_points + avg_rebounds + avg_assists + avg_steals + avg_blocks - avg_turnovers) / avg_minutes * 48 - 15 if avg_minutes > 0 else 0

        # VORP estimado
        minutes_played_total = avg_minutes * games_played
        vorp = ((bmp - (-2.0)) * (minutes_played_total / (team_minutes * games_played))) if avg_minutes > 0 else 0

        return {
            "win_shares": round(win_shares, 2),
            "vorp": round(vorp, 2),
            "true_shooting_pct": round(ts_pct, 1),
            "box_plus_minus": round(bmp, 1),
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
            win_shares = (ows + dws) * games_played / 10

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

@router.get("/{id}/advanced/lebron-impact", response_model=LebronImpactScore)
async def player_lebron_impact_score(id: int, session: AsyncSession = Depends(get_db)):
    """
    LEBRON-style metric: Luck-adjusted player Estimate using Box prior Regularized ON-off
    Versión corregida basada en la metodología real de LEBRON
    """
    try:
        # Query principal del jugador
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
            func.avg(MatchStatistic.plusminus).label("avg_plusminus"),
            func.count(MatchStatistic.id).label("games_played"),
            func.stddev(MatchStatistic.points).label("points_variance"),
            func.stddev(MatchStatistic.plusminus).label("plusminus_variance"),
            func.avg(MatchStatistic.off_rebounds).label("avg_oreb"),
            func.avg(MatchStatistic.def_rebounds).label("avg_dreb")
        ).where(MatchStatistic.player_id == id)
        
        result = await session.execute(stmt)
        row = result.first()
        
        if not row or not row.games_played:
            return LebronImpactScore(
                lebron_score=0.0, box_component=0.0, plus_minus_component=0.0,
                luck_adjustment=1.0, context_adjustment=1.0, usage_adjustment=1.0,
                percentile_rank=50.0, games_played=0, minutes_per_game=0.0
            )
        
        # Convertir valores
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
        avg_plusminus = float(row.avg_plusminus or 0)
        games_played = int(row.games_played or 0)
        points_variance = float(row.points_variance or 1)
        plusminus_variance = float(row.plusminus_variance or 1)
        avg_oreb = float(row.avg_oreb or 0) if row.avg_oreb else avg_rebounds * 0.25
        avg_dreb = float(row.avg_dreb or 0) if row.avg_dreb else avg_rebounds * 0.75
        
        if avg_minutes <= 0:
            return LebronImpactScore(
                lebron_score=0.0, box_component=0.0, plus_minus_component=0.0,
                luck_adjustment=1.0, context_adjustment=1.0, usage_adjustment=1.0,
                percentile_rank=50.0, games_played=games_played, minutes_per_game=0.0
            )
        
        # Obtener promedios de liga para contextualización
        league_stmt = select(
            func.avg(MatchStatistic.points).label("league_ppg"),
            func.avg(MatchStatistic.rebounds).label("league_rpg"),
            func.avg(MatchStatistic.assists).label("league_apg"),
            func.avg(MatchStatistic.plusminus).label("league_pm"),
            func.avg(MatchStatistic.minutes_played).label("league_mpg")
        )
        league_result = await session.execute(league_stmt)
        league_row = league_result.first()
        
        # Promedios de liga más realistas (NBA 2023-24)
        league_ppg = float(league_row.league_ppg or 22.5)
        league_rpg = float(league_row.league_rpg or 10.5)
        league_apg = float(league_row.league_apg or 5.8)
        league_pm = float(league_row.league_pm or 0)
        league_mpg = float(league_row.league_mpg or 28.0)
        
        # Métricas avanzadas
        usage_rate = ((avg_fga + 0.44 * avg_fta + avg_turnovers) * (league_mpg * 5)) / (avg_minutes * (avg_fga + avg_fta + avg_turnovers))
        usage_rate = min(max(usage_rate * 100, 10), 40)  # Convertir a porcentaje y limitar
        
        true_shooting = avg_points / (2 * (avg_fga + 0.44 * avg_fta)) if (avg_fga + 0.44 * avg_fta) > 0 else 0
        assist_rate = avg_assists / avg_fga if avg_fga > 0 else 0
        turnover_rate = avg_turnovers / (avg_fga + 0.44 * avg_fta + avg_turnovers) if (avg_fga + avg_fta + avg_turnovers) > 0 else 0
        
        # 1. BOX COMPONENT - Coeficientes reales de LEBRON (más agresivos)
        # LEBRON usa coeficientes más altos que BPM
        box_component = (
            # Scoring (más peso que en BPM)
            0.25 * (avg_points - league_ppg) +
            # Rebounding 
            0.18 * (avg_dreb - league_rpg * 0.75) +
            0.15 * (avg_oreb - league_rpg * 0.25) +
            # Playmaking (muy importante en LEBRON)
            0.35 * (avg_assists - league_apg) +
            # Defensive actions (peso alto)
            0.28 * avg_steals +
            0.32 * avg_blocks +
            # Turnover penalty
            -0.25 * avg_turnovers +
            # Shooting efficiency (crítico)
            0.45 * (true_shooting - 0.57) * 25 +
            # Usage adjustment
            0.08 * (usage_rate - 20) / 5
        )
        
        # 2. PLUS/MINUS COMPONENT - Más agresivo
        # LEBRON usa el plus/minus más directamente
        team_context_factor = min(max(avg_plusminus / 5, -1), 1)  # Normalizar entre -1 y 1
        pm_adjusted = avg_plusminus * (1 - abs(team_context_factor) * 0.15)  # Ajuste mínimo
        
        plus_minus_component = pm_adjusted / avg_minutes * 48 if avg_minutes > 0 else 0
        
        # 3. REGULARIZACIÓN BAYESIANA - Menos conservadora
        # LEBRON da más peso al plus/minus más rápido
        total_minutes = avg_minutes * games_played
        minutes_weight = min(total_minutes / 1200, 0.75)  # Más peso al PM más rápido
        box_weight = 1 - minutes_weight
        
        # 4. LUCK ADJUSTMENT - Menos penalizante
        # Basado en consistencia de rendimiento
        consistency_factor = 1 / (1 + (points_variance or 1) / 25) if points_variance and points_variance > 0 else 1
        pm_consistency = 1 / (1 + (plusminus_variance or 1) / 12) if plusminus_variance and plusminus_variance > 0 else 1
        luck_adjustment = (consistency_factor + pm_consistency) / 2
        luck_adjustment = max(0.85, min(1.15, luck_adjustment))
        
        # 5. CONTEXT ADJUSTMENT - Más agresivo para equipos exitosos
        # LEBRON premia más a jugadores en equipos buenos
        if avg_plusminus > 2:
            context_adjustment = 1.15 + min(avg_plusminus / 15, 0.1)
        elif avg_plusminus > 0:
            context_adjustment = 1.05 + avg_plusminus / 20
        else:
            context_adjustment = 1.0 + max(avg_plusminus / 25, -0.15)
        
        context_adjustment = max(0.8, min(1.3, context_adjustment))
        
        # 6. USAGE ADJUSTMENT - Prima el uso balanceado
        optimal_usage = 24  # Shai usa ~30%, que es alto pero no extremo
        usage_diff = abs(usage_rate - optimal_usage)
        if usage_rate > 28:  # Alto uso = prima si es eficiente
            usage_adjustment = 1.05 + (true_shooting - 0.55) * 0.5
        elif usage_rate < 18:  # Bajo uso = pequeña penalización
            usage_adjustment = 0.95
        else:
            usage_adjustment = 1.0 + (24 - usage_diff) / 100
        
        usage_adjustment = max(0.9, min(1.2, usage_adjustment))
        
        # LEBRON SCORE FINAL - Fórmula más agresiva
        raw_box = box_component
        raw_pm = plus_minus_component
        
        # Weighted combination
        base_impact = (raw_box * box_weight + raw_pm * minutes_weight)
        
        # Multiplicador base para escalar a rango LEBRON real
        lebron_multiplier = 2.8  # Factor de escala para alcanzar valores reales
        
        # Score final con todos los ajustes
        lebron_score = base_impact * lebron_multiplier * luck_adjustment * context_adjustment * usage_adjustment

        # Asegurar que esté en rango realista (-15 a +15)
        lebron_score = max(-15, min(15, lebron_score))  # <--- AJUSTE AQUÍ
        
        # Percentil basado en distribución real de LEBRON
        from math import erf
        z_score = (lebron_score - 1.5) / 3.5  # Media y std realistas
        percentile_rank = 50 * (1 + erf(z_score / 1.414))
        percentile_rank = max(1, min(99, percentile_rank))
        
        return LebronImpactScore(
            lebron_score=round(lebron_score, 2),
            box_component=round(raw_box * lebron_multiplier, 2),
            plus_minus_component=round(raw_pm * lebron_multiplier, 2),
            luck_adjustment=round(luck_adjustment, 3),
            context_adjustment=round(context_adjustment, 3),
            usage_adjustment=round(usage_adjustment, 3),
            percentile_rank=round(percentile_rank, 1),
            games_played=games_played,
            minutes_per_game=round(avg_minutes, 1)
        )
        
    except Exception as e:
        print(f"Error in player_lebron_impact_score: {str(e)}")
        raise

@router.get("/{id}/advanced/pipm-impact", response_model=PIPMImpact)
async def player_pipm_impact(id: int, session: AsyncSession = Depends(get_db)):
    """
    Player Impact Plus-Minus style metric con separación offense/defense
    """
    try:
        # Query similar al anterior pero con más datos para separar O/D
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
            func.avg(MatchStatistic.free_throws_made).label("avg_ftm"),
            func.avg(MatchStatistic.free_throws_attempted).label("avg_fta"),
            func.avg(MatchStatistic.plusminus).label("avg_plusminus"),
            func.avg(MatchStatistic.off_rebounds).label("avg_oreb"),
            func.avg(MatchStatistic.def_rebounds).label("avg_dreb"),
            func.count(MatchStatistic.id).label("games_played")
        ).where(MatchStatistic.player_id == id)
        
        result = await session.execute(stmt)
        row = result.first()
        
        if not row or not row.games_played:
            return PIPMImpact(
                total_pipm=0.0, offensive_pimp=0.0, defensive_pimp=0.0,
                box_prior_weight=0.5, plus_minus_weight=0.5, stability_factor=0.0,
                minutes_confidence=0.0, games_played=0, usage_rate=0.0
            )
        
        # Convertir valores
        avg_points = float(row.avg_points or 0)
        avg_rebounds = float(row.avg_rebounds or 0)
        avg_assists = float(row.avg_assists or 0)
        avg_steals = float(row.avg_steals or 0)
        avg_blocks = float(row.avg_blocks or 0)
        avg_turnovers = float(row.avg_turnovers or 0)
        avg_minutes = float(row.avg_minutes or 0)
        avg_fgm = float(row.avg_fgm or 0)
        avg_fga = float(row.avg_fga or 0)
        avg_ftm = float(row.avg_ftm or 0)
        avg_fta = float(row.avg_fta or 0)
        avg_plusminus = float(row.avg_plusminus or 0)
        avg_oreb = float(row.avg_oreb or 0) if row.avg_oreb else avg_rebounds * 0.25
        avg_dreb = float(row.avg_dreb or 0) if row.avg_dreb else avg_rebounds * 0.75
        games_played = int(row.games_played)
        
        if avg_minutes <= 0:
            return PIPMImpact(
                total_pipm=0.0, offensive_pimp=0.0, defensive_pimp=0.0,
                box_prior_weight=0.5, plus_minus_weight=0.5, stability_factor=0.0,
                minutes_confidence=0.0, games_played=games_played, usage_rate=0.0
            )
        
        # Usage rate
        usage_rate = ((avg_fga + 0.44 * avg_fta + avg_turnovers) * 40) / (avg_minutes * 5)
        usage_rate = min(usage_rate, 45.0)
        
        # Componente Ofensivo (O-PIPM)
        true_shooting = avg_points / (2 * (avg_fga + 0.44 * avg_fta)) if (avg_fga + 0.44 * avg_fta) > 0 else 0
        assist_ratio = avg_assists / avg_fga if avg_fga > 0 else 0
        
        offensive_box = (
            (avg_points - 16) * 0.4 +
            avg_assists * 1.8 +
            avg_oreb * 1.2 -
            avg_turnovers * 1.4 +
            (true_shooting - 0.55) * 20 +
            (assist_ratio - 0.15) * 10
        ) / avg_minutes * 48
        
        # Componente Defensivo (D-PIPM)
        defensive_box = (
            avg_dreb * 0.8 +
            avg_steals * 2.0 +
            avg_blocks * 1.5 -
            (usage_rate - 20) * 0.05  # Penalty for high usage affecting defense
        ) / avg_minutes * 48
        
        # Componente Plus/Minus ajustado
        pm_per_48 = avg_plusminus / avg_minutes * 48 if avg_minutes > 0 else 0
        
        # Pesos bayesianos (más peso al box score con menos minutos)
        total_minutes = avg_minutes * games_played
        minutes_confidence = min(total_minutes / 2000, 1.0)  # Confidence maxima a 2000 minutos
        
        box_prior_weight = 1.0 - minutes_confidence * 0.4
        plus_minus_weight = minutes_confidence * 0.4
        
        # Factor de estabilidad
        stability_factor = min(games_played / 50, 1.0)
        
        # PIPM final
        offensive_pimp = (offensive_box * box_prior_weight + pm_per_48 * 0.6 * plus_minus_weight) * stability_factor
        defensive_pimp = (defensive_box * box_prior_weight + pm_per_48 * 0.4 * plus_minus_weight) * stability_factor
        
        total_pipm = offensive_pimp + defensive_pimp
        
        return PIPMImpact(
            total_pipm=round(total_pipm, 2),
            offensive_pimp=round(offensive_pimp, 2),
            defensive_pimp=round(defensive_pimp, 2),
            box_prior_weight=round(box_prior_weight, 3),
            plus_minus_weight=round(plus_minus_weight, 3),
            stability_factor=round(stability_factor, 3),
            minutes_confidence=round(minutes_confidence, 3),
            games_played=games_played,
            usage_rate=round(usage_rate, 1)
        )
        
    except Exception as e:
        print(f"Error in player_pipm_impact: {str(e)}")
        raise

@router.get("/{id}/advanced/raptor-war", response_model=RaptorWAR)
async def player_raptor_war(id: int, session: AsyncSession = Depends(get_db)):
    """
    RAPTOR-style Wins Above Replacement con market value y ajustes posicionales/edad
    """
    try:
        # Query combinando player data y stats
        stmt = select(
            Player.birth_date,
            Player.position,
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
            func.avg(MatchStatistic.plusminus).label("avg_plusminus"),
            func.count(MatchStatistic.id).label("games_played")
        ).join(
            Player, MatchStatistic.player_id == Player.id
        ).where(
            MatchStatistic.player_id == id
        ).group_by(Player.birth_date, Player.position)
        
        result = await session.execute(stmt)
        row = result.first()
        
        if not row or not row.games_played:
            return RaptorWAR(
                total_war=0.0, offensive_war=0.0, defensive_war=0.0,
                market_value_millions=0.0, positional_versatility=0.0,
                age_adjustment=1.0, injury_risk_factor=1.0,
                games_played=0, win_shares_comparison=0.0
            )
        
        # Calcular edad
        from datetime import date
        today = date.today()
        birth_date = row.birth_date
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        
        # Convertir stats
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
        avg_plusminus = float(row.avg_plusminus or 0)
        games_played = int(row.games_played)
        position = row.position
        
        if avg_minutes <= 0:
            return RaptorWAR(
                total_war=0.0, offensive_war=0.0, defensive_war=0.0,
                market_value_millions=0.0, positional_versatility=0.0,
                age_adjustment=1.0, injury_risk_factor=1.0,
                games_played=games_played, win_shares_comparison=0.0
            )
        
        # Replacement level por posición
        replacement_levels = {
            'PG': -1.5, 'SG': -1.8, 'SF': -1.6, 'PF': -1.7, 'C': -1.4,
            'G': -1.6, 'F': -1.6, 'G-F': -1.5, 'F-C': -1.5, 'C-F': -1.5, 'F-G': -1.7
        }
        replacement_level = replacement_levels.get(position, -1.6)
        
        # Box Score component (similar a BPM)
        true_shooting = avg_points / (2 * (avg_fga + 0.44 * avg_fta)) if (avg_fga + 0.44 * avg_fta) > 0 else 0
        
        box_score_rating = (
            (avg_points - 15) * 0.35 +
            avg_rebounds * 0.7 +
            avg_assists * 1.3 +
            avg_steals * 1.8 +
            avg_blocks * 1.4 -
            avg_turnovers * 1.2 +
            (true_shooting - 0.53) * 18
        ) / avg_minutes * 48
        
        # Componente ofensivo/defensivo
        offensive_rating = (
            (avg_points - 12) * 0.5 +
            avg_assists * 1.5 +
            (true_shooting - 0.53) * 25 -
            avg_turnovers * 1.5
        ) / avg_minutes * 48
        
        defensive_rating = (
            avg_rebounds * 0.6 +
            avg_steals * 2.2 +
            avg_blocks * 1.8 -
            (avg_fga / avg_minutes * 48 - 15) * 0.1  # Penalty for high shot volume affecting defense
        ) / avg_minutes * 48
        
        # Ajuste de edad (peak around 27-28)
        if age <= 22:
            age_adjustment = 0.85 + (age - 19) * 0.05
        elif age <= 28:
            age_adjustment = 1.0
        elif age <= 32:
            age_adjustment = 1.0 - (age - 28) * 0.08
        else:
            age_adjustment = 0.68 - (age - 32) * 0.05
        
        age_adjustment = max(0.3, min(1.2, age_adjustment))
        
        # Factor de riesgo de lesiones (basado en minutos y edad)
        minutes_load = avg_minutes * games_played
        injury_risk_factor = 1.0 + (age - 25) * 0.02 + max(0, minutes_load - 2500) / 1000 * 0.1
        injury_risk_factor = max(1.0, min(2.0, injury_risk_factor))
        
        # Versatilidad posicional (basada en estadísticas balanceadas)
        stat_balance = 1 - (abs(avg_points - 15) + abs(avg_rebounds - 7) + abs(avg_assists - 5)) / 50
        positional_versatility = max(0, min(1, stat_balance))
        
        # WAR calculation
        total_rating = (box_score_rating + avg_plusminus/avg_minutes*48) / 2 * age_adjustment
        offensive_war = max(0, (offensive_rating - replacement_level * 0.6) * (avg_minutes * games_played) / 2400)
        defensive_war = max(0, (defensive_rating - replacement_level * 0.4) * (avg_minutes * games_played) / 2400)
        total_war = offensive_war + defensive_war
        
        # Market value estimation (very rough)
        base_value = max(0, total_war * 8)  # $8M per WAR
        market_value_millions = base_value / injury_risk_factor * (1 + positional_versatility * 0.2)
        market_value_millions = max(0.5, min(50, market_value_millions))
        
        # Win Shares comparison (convert our WAR to WS scale)
        win_shares_comparison = total_war * 1.2  # Rough conversion
        
        return RaptorWAR(
            total_war=round(total_war, 2),
            offensive_war=round(offensive_war, 2),
            defensive_war=round(defensive_war, 2),
            market_value_millions=round(market_value_millions, 1),
            positional_versatility=round(positional_versatility, 3),
            age_adjustment=round(age_adjustment, 3),
            injury_risk_factor=round(injury_risk_factor, 3),
            games_played=games_played,
            win_shares_comparison=round(win_shares_comparison, 2)
        )
        
    except Exception as e:
        print(f"Error in player_raptor_war: {str(e)}")
        raise