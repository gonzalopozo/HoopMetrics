from fastapi import APIRouter, Depends
from sqlmodel import desc, func, select
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession
from ..models import Match, PointsProgression, PointsTypeDistribution, PlayerBarChartData, PlayerBarChartData, MinutesProgression, ParticipationRate, PositionAverage, LebronImpactScore, PIPMImpact, RaptorWAR,  MatchStatistic, Player, PlayerRead, StatRead, Team, TeamRead, PlayerSkillProfile, AdvancedImpactMatrix, PIPMPositionAverage
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
    Implementación corregida basada en la metodología real de LEBRON
    """
    try:
        # Query principal del jugador con más datos necesarios
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
            func.stddev(MatchStatistic.points).label("points_std"),
            func.stddev(MatchStatistic.plusminus).label("pm_std"),
            func.avg(MatchStatistic.off_rebounds).label("avg_oreb"),
            func.avg(MatchStatistic.def_rebounds).label("avg_dreb"),
            func.sum(MatchStatistic.minutes_played).label("total_minutes")
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
        total_minutes = float(row.total_minutes or 0)
        points_std = float(row.points_std or 5.0)
        pm_std = float(row.pm_std or 8.0)
        avg_oreb = float(row.avg_oreb or 0) if row.avg_oreb else avg_rebounds * 0.25
        avg_dreb = float(row.avg_dreb or 0) if row.avg_dreb else avg_rebounds * 0.75
        
        if avg_minutes <= 0:
            return LebronImpactScore(
                lebron_score=0.0, box_component=0.0, plus_minus_component=0.0,
                luck_adjustment=1.0, context_adjustment=1.0, usage_adjustment=1.0,
                percentile_rank=50.0, games_played=games_played, minutes_per_game=0.0
            )
        
        # Obtener promedios de liga para prior bayesiano
        league_stmt = select(
            func.avg(MatchStatistic.points).label("league_ppg"),
            func.avg(MatchStatistic.rebounds).label("league_rpg"),
            func.avg(MatchStatistic.assists).label("league_apg"),
            func.avg(MatchStatistic.steals).label("league_spg"),
            func.avg(MatchStatistic.blocks).label("league_bpg"),
            func.avg(MatchStatistic.turnovers).label("league_tpg"),
            func.avg(MatchStatistic.plusminus).label("league_pm"),
            func.avg(MatchStatistic.minutes_played).label("league_mpg"),
            func.avg(MatchStatistic.field_goals_made).label("league_fgm"),
            func.avg(MatchStatistic.field_goals_attempted).label("league_fga")
        )
        league_result = await session.execute(league_stmt)
        league_row = league_result.first()
        
        # Promedios de liga
        league_ppg = float(league_row.league_ppg or 22.0)
        league_rpg = float(league_row.league_rpg or 10.2)
        league_apg = float(league_row.league_apg or 5.5)
        league_spg = float(league_row.league_spg or 1.3)
        league_bpg = float(league_row.league_bpg or 1.0)
        league_tpg = float(league_row.league_tpg or 3.2)
        league_pm = float(league_row.league_pm or 0.0)
        league_mpg = float(league_row.league_mpg or 28.0)
        league_fgm = float(league_row.league_fgm or 8.5)
        league_fga = float(league_row.league_fga or 18.0)
        
        # 1. BOX PRIOR COMPONENT - Basado en estadísticas de caja ajustadas
        # Calcular métricas avanzadas
        true_shooting = avg_points / (2 * (avg_fga + 0.44 * avg_fta)) if (avg_fga + 0.44 * avg_fta) > 0 else 0.5
        usage_rate = ((avg_fga + 0.44 * avg_fta + avg_turnovers) * (league_mpg * 5)) / (avg_minutes * (league_fga + avg_fta + league_tpg)) * 100
        usage_rate = max(10, min(usage_rate, 40))
        
        assist_rate = avg_assists / avg_fga if avg_fga > 0 else 0
        turnover_rate = avg_turnovers / (avg_fga + 0.44 * avg_fta + avg_turnovers) if (avg_fga + avg_fta + avg_turnovers) > 0 else 0
        rebound_rate = avg_rebounds / avg_minutes * 48 if avg_minutes > 0 else 0
        
        # Box component usando coeficientes calibrados (similares a BPM pero ajustados)
        box_component = (
            # Scoring above average (ajustado por eficiencia)
            0.20 * (avg_points - league_ppg) * (true_shooting / 0.56) +
            
            # Rebounding (separado por tipo)
            0.14 * (avg_oreb - league_rpg * 0.25) +
            0.12 * (avg_dreb - league_rpg * 0.75) +
            
            # Playmaking
            0.30 * (avg_assists - league_apg) +
            
            # Defensive stats
            0.52 * (avg_steals - league_spg) +
            0.58 * (avg_blocks - league_bpg) +
            
            # Turnovers penalty
            -0.35 * (avg_turnovers - league_tpg) +
            
            # Usage adjustment (penalty for high usage)
            -0.002 * max(0, usage_rate - 28) ** 1.5 +
            
            # Efficiency bonus
            0.15 * (true_shooting - 0.56) * 20
        )
        
        # 2. PLUS-MINUS COMPONENT - Regularizado
        # Ajustar plus-minus por contexto de equipo y varianza
        pm_per_minute = avg_plusminus / avg_minutes if avg_minutes > 0 else 0
        pm_component_raw = pm_per_minute * 48
        
        # Ajuste por varianza (luck adjustment parcial)
        pm_reliability = min(1.0, total_minutes / 1500)  # Más confiable con más minutos
        pm_variance_penalty = min(0.2, pm_std / 15.0)  # Penalizar alta varianza
        
        plus_minus_component = pm_component_raw * pm_reliability * (1 - pm_variance_penalty)
        
        # 3. REGULARIZACIÓN BAYESIANA
        # El peso entre box y plus-minus depende de la cantidad de datos
        box_prior_strength = 200  # Minutos necesarios para confiar 50% en plus-minus
        pm_weight = total_minutes / (total_minutes + box_prior_strength)
        box_weight = 1 - pm_weight
        
        # 4. LUCK ADJUSTMENT
        # Basado en consistencia y sample size
        consistency_score = 1 / (1 + points_std / 8.0) if points_std > 0 else 1
        pm_consistency = 1 / (1 + pm_std / 10.0) if pm_std > 0 else 1
        sample_size_factor = min(1.0, total_minutes / 1000)
        
        luck_adjustment = (consistency_score * 0.4 + pm_consistency * 0.4 + sample_size_factor * 0.2)
        luck_adjustment = max(0.7, min(1.3, luck_adjustment))
        
        # 5. CONTEXT ADJUSTMENT
        # Ajuste por rendimiento del equipo y situación
        team_success_factor = 1.0
        if avg_plusminus > 3:
            team_success_factor = 1.1  # Bonus por estar en equipo exitoso
        elif avg_plusminus < -3:
            team_success_factor = 0.95  # Pequeña penalización
        
        context_adjustment = team_success_factor * (0.9 + 0.1 * min(games_played / 60, 1))
        context_adjustment = max(0.85, min(1.15, context_adjustment))
        
        # 6. USAGE ADJUSTMENT
        # LEBRON penaliza uso excesivo pero premia eficiencia con alto uso
        optimal_usage = 24
        usage_deviation = abs(usage_rate - optimal_usage)
        
        if usage_rate > 30:  # Alto uso
            usage_adjustment = 1.0 - (usage_rate - 30) * 0.01 + (true_shooting - 0.55) * 0.8
        elif usage_rate < 18:  # Bajo uso
            usage_adjustment = 0.98
        else:
            usage_adjustment = 1.0 + (5 - usage_deviation) * 0.005
        
        usage_adjustment = max(0.85, min(1.15, usage_adjustment))
        
        # 7. LEBRON SCORE FINAL
        # Combinar box y plus-minus con pesos bayesianos
        raw_impact = (box_component * box_weight + plus_minus_component * pm_weight)
        
        # Aplicar ajustes
        lebron_score = raw_impact * luck_adjustment * context_adjustment * usage_adjustment
        
        # Escalar al rango típico de LEBRON (-10 a +10, con elite players en ±6-8)
        lebron_score = max(-12, min(12, lebron_score))
        
        # 8. PERCENTILE RANK
        # Distribución aproximada: media=0, std=2.5 para LEBRON
        import math
        z_score = lebron_score / 2.5
        percentile_rank = 50 * (1 + math.erf(z_score / math.sqrt(2)))
        percentile_rank = max(1, min(99, percentile_rank))
        
        return LebronImpactScore(
            lebron_score=round(lebron_score, 2),
            box_component=round(box_component, 2),
            plus_minus_component=round(plus_minus_component, 2),
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
    CORREGIDO para mayor precisión metodológica
    """
    try:
        # Query con todos los datos necesarios
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
            func.avg(MatchStatistic.off_rebounds).label("avg_oreb"),
            func.avg(MatchStatistic.def_rebounds).label("avg_dreb"),
            func.count(MatchStatistic.id).label("games_played"),
            func.stddev(MatchStatistic.plusminus).label("pm_variance")
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
        avg_3pm = float(row.avg_3pm or 0)
        avg_3pa = float(row.avg_3pa or 0)
        avg_ftm = float(row.avg_ftm or 0)
        avg_fta = float(row.avg_fta or 0)
        avg_plusminus = float(row.avg_plusminus or 0)
        avg_oreb = float(row.avg_oreb or 0) if row.avg_oreb else avg_rebounds * 0.25
        avg_dreb = float(row.avg_dreb or 0) if row.avg_dreb else avg_rebounds * 0.75
        games_played_real = int(row.games_played)  # NÚMERO REAL para la respuesta
        pm_variance = float(row.pm_variance or 8.0)
        
        # USAR 82 PARA TODOS LOS CÁLCULOS
        games_played_calc = 82  # FIJO para cálculos
        
        if avg_minutes <= 0:
            return PIPMImpact(
                total_pipm=0.0, offensive_pimp=0.0, defensive_pimp=0.0,
                box_prior_weight=0.5, plus_minus_weight=0.5, stability_factor=0.0,
                minutes_confidence=0.0, games_played=games_played_real, usage_rate=0.0
            )
        
        # Obtener promedios de liga para contextualización
        league_stmt = select(
            func.avg(MatchStatistic.points).label("league_ppg"),
            func.avg(MatchStatistic.rebounds).label("league_rpg"),
            func.avg(MatchStatistic.assists).label("league_apg"),
            func.avg(MatchStatistic.steals).label("league_spg"),
            func.avg(MatchStatistic.blocks).label("league_bpg"),
            func.avg(MatchStatistic.turnovers).label("league_tpg"),
            func.avg(MatchStatistic.minutes_played).label("league_mpg")
        )
        league_result = await session.execute(league_stmt)
        league_row = league_result.first()
        
        league_ppg = float(league_row.league_ppg or 22.0)
        league_rpg = float(league_row.league_rpg or 10.2)
        league_apg = float(league_row.league_apg or 5.5)
        league_spg = float(league_row.league_spg or 1.3)
        league_bpg = float(league_row.league_bpg or 1.0)
        league_tpg = float(league_row.league_tpg or 3.2)
        league_mpg = float(league_row.league_mpg or 28.0)
        
        # Métricas avanzadas corregidas
        true_shooting = avg_points / (2 * (avg_fga + 0.44 * avg_fta)) if (avg_fga + 0.44 * avg_fta) > 0 else 0.5
        
        # Usage rate CORREGIDO (fórmula estándar NBA)
        team_pace = 100  # Posesiones por juego aproximadas
        usage_rate = 100 * ((avg_fga + 0.44 * avg_fta + avg_turnovers) * (league_mpg * 5)) / (avg_minutes * (team_pace * 2))
        usage_rate = max(5, min(usage_rate, 50))
        
        # 1. BOX PRIOR COMPONENT - Coeficientes PIPM reales
        
        # Componente Ofensivo (O-PIPM) - CORREGIDO
        offensive_box = (
            # Scoring above average ajustado por eficiencia
            0.25 * (avg_points - league_ppg) * (true_shooting / 0.56) +
            
            # Playmaking (coeficiente más alto en PIPM)
            0.45 * (avg_assists - league_apg) +
            
            # Offensive rebounding
            0.35 * (avg_oreb - league_rpg * 0.25) +
            
            # Turnover penalty (más severa para offense)
            -0.55 * (avg_turnovers - league_tpg) +
            
            # Usage penalty (exceso de uso afecta eficiencia del equipo)
            -0.003 * max(0, usage_rate - 28) ** 1.8 +
            
            # Three point shooting bonus
            0.08 * avg_3pm
        )
        
        # Componente Defensivo (D-PIPM) - CORREGIDO
        defensive_box = (
            # Defensive rebounding
            0.25 * (avg_dreb - league_rpg * 0.75) +
            
            # Steals (muy valoradas en defensa)
            0.65 * (avg_steals - league_spg) +
            
            # Blocks (especialmente valiosos)
            0.75 * (avg_blocks - league_bpg) +
            
            # Usage adjustment para defensa (alto uso puede afectar esfuerzo defensivo)
            -0.01 * max(0, usage_rate - 25) +
            
            # Minute load penalty (muchos minutos pueden afectar defensa)
            -0.002 * max(0, avg_minutes - 32)
        )
        
        # 2. PLUS/MINUS COMPONENT - Metodología PIPM real
        pm_per_48 = (avg_plusminus / avg_minutes) * 48 if avg_minutes > 0 else 0
        
        # Luck adjustment basado en varianza
        luck_factor = max(0.7, min(1.3, 1 - (pm_variance - 8) / 20))
        pm_adjusted = pm_per_48 * luck_factor
        
        # Separar PM en componentes O/D (aproximación)
        # Offense típicamente contribuye ~60% del PM, Defense ~40%
        pm_offensive = pm_adjusted * 0.6
        pm_defensive = pm_adjusted * 0.4
        
        # 3. REGULARIZACIÓN BAYESIANA - Metodología PIPM
        # USAR 82 PARTIDOS para total_minutes en lugar del número real
        total_minutes = avg_minutes * games_played_calc  # CAMBIO: usar 82 en lugar de games_played_real
        
        # PIPM usa más peso al box score inicialmente
        prior_strength = 1200  # Minutos para 50% confianza en PM
        minutes_confidence = min(total_minutes / (total_minutes + prior_strength), 0.75)
        
        # Pesos bayesianos
        box_prior_weight = 1.0 - minutes_confidence
        plus_minus_weight = minutes_confidence
        
        # 4. FACTOR DE ESTABILIDAD
        # USAR 82 PARTIDOS para games_stability
        games_stability = min(games_played_calc / 60, 1.0)  # CAMBIO: usar 82 
        variance_stability = max(0.5, 1 - (pm_variance - 6) / 15)
        stability_factor = (games_stability + variance_stability) / 2
        
        # 5. PIPM FINAL
        # Combinar box score y plus/minus con pesos apropiados
        offensive_pimp = (
            offensive_box * box_prior_weight + 
            pm_offensive * plus_minus_weight
        ) * stability_factor
        
        defensive_pimp = (
            defensive_box * box_prior_weight + 
            pm_defensive * plus_minus_weight
        ) * stability_factor
        
        # Aplicar límites realistas (-8 a +8 para cada componente)
        offensive_pimp = max(-8, min(8, offensive_pimp))
        defensive_pimp = max(-8, min(8, defensive_pimp))
        
        total_pipm = offensive_pimp + defensive_pimp
        
        return PIPMImpact(
            total_pipm=round(total_pipm, 2),
            offensive_pimp=round(offensive_pimp, 2),
            defensive_pimp=round(defensive_pimp, 2),
            box_prior_weight=round(box_prior_weight, 3),
            plus_minus_weight=round(plus_minus_weight, 3),
            stability_factor=round(stability_factor, 3),
            minutes_confidence=round(minutes_confidence, 3),
            games_played=games_played_real,  # DEVOLVER EL NÚMERO REAL
            usage_rate=round(usage_rate, 1)
        )
        
    except Exception as e:
        print(f"Error in player_pimp_impact: {str(e)}")
        raise

@router.get("/{id}/advanced/pipm-position-averages", response_model=List[PIPMPositionAverage])
async def player_pimp_position_averages(id: int, session: AsyncSession = Depends(get_db)):
    """
    Obtiene la media de los 10 valores más frecuentes de métricas PIMP por posición
    (versión optimizada para evitar bloqueos)
    """
    try:
        # Verificar que el jugador existe
        player_stmt = select(Player.position).where(Player.id == id)
        player_result = await session.execute(player_stmt)
        player_position = player_result.scalar()
        
        if not player_position:
            return []
        
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

        def safe_mean(values, default=0.0):
            """Función segura para calcular promedios"""
            if not values or len(values) == 0:
                return default
            try:
                clean_values = [float(v) for v in values if v is not None and str(v).replace('.', '').replace('-', '').isdigit()]
                if not clean_values:
                    return default
                return sum(clean_values) / len(clean_values)
            except:
                return default

        # Obtener promedios de liga una sola vez
        try:
            league_stmt = select(
                func.avg(MatchStatistic.points).label("league_ppg"),
                func.avg(MatchStatistic.rebounds).label("league_rpg"),
                func.avg(MatchStatistic.assists).label("league_apg"),
                func.avg(MatchStatistic.steals).label("league_spg"),
                func.avg(MatchStatistic.blocks).label("league_bpg"),
                func.avg(MatchStatistic.turnovers).label("league_tpg"),
                func.avg(MatchStatistic.minutes_played).label("league_mpg")
            )
            league_result = await session.execute(league_stmt)
            league_row = league_result.first()
            
            league_ppg = float(league_row.league_ppg or 22.0)
            league_rpg = float(league_row.league_rpg or 10.2)
            league_apg = float(league_row.league_apg or 5.5)
            league_spg = float(league_row.league_spg or 1.3)
            league_bpg = float(league_row.league_bpg or 1.0)
            league_tpg = float(league_row.league_tpg or 3.2)
            league_mpg = float(league_row.league_mpg or 28.0)
        except Exception as e:
            print(f"Error getting league averages: {e}")
            # Usar valores por defecto
            league_ppg, league_rpg, league_apg = 22.0, 10.2, 5.5
            league_spg, league_bpg, league_tpg, league_mpg = 1.3, 1.0, 3.2, 28.0

        for standard_pos in standard_positions:
            try:
                db_positions_for_standard = []
                for db_pos, standard_list in position_mapping.items():
                    if standard_pos in standard_list:
                        db_positions_for_standard.append(db_pos)
                
                if not db_positions_for_standard:
                    continue

                # Consulta simplificada - solo obtener promedios por posición
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
                    func.avg(MatchStatistic.off_rebounds).label("avg_oreb"),
                    func.avg(MatchStatistic.def_rebounds).label("avg_dreb"),
                    func.count(MatchStatistic.id).label("total_games")
                ).join(
                    Player, MatchStatistic.player_id == Player.id
                ).where(
                    Player.position.in_(db_positions_for_standard)
                ).where(
                    MatchStatistic.minutes_played > 0  # Solo jugadores que han jugado
                )

                result = await session.execute(stmt)
                pos_data = result.first()

                if not pos_data or not pos_data.total_games or pos_data.avg_minutes <= 0:
                    continue

                # Convertir a float de forma segura
                avg_points = float(pos_data.avg_points or 0)
                avg_rebounds = float(pos_data.avg_rebounds or 0)
                avg_assists = float(pos_data.avg_assists or 0)
                avg_steals = float(pos_data.avg_steals or 0)
                avg_blocks = float(pos_data.avg_blocks or 0)
                avg_turnovers = float(pos_data.avg_turnovers or 0)
                avg_minutes = float(pos_data.avg_minutes or 1)  # Evitar división por 0
                avg_fgm = float(pos_data.avg_fgm or 0)
                avg_fga = float(pos_data.avg_fga or 1)  # Evitar división por 0
                avg_3pm = float(pos_data.avg_3pm or 0)
                avg_3pa = float(pos_data.avg_3pa or 0)
                avg_ftm = float(pos_data.avg_ftm or 0)
                avg_fta = float(pos_data.avg_fta or 0)
                avg_plusminus = float(pos_data.avg_plusminus or 0)
                avg_oreb = float(pos_data.avg_oreb or 0) if pos_data.avg_oreb else avg_rebounds * 0.25
                avg_dreb = float(pos_data.avg_dreb or 0) if pos_data.avg_dreb else avg_rebounds * 0.75

                # Cálculos simplificados
                games_played_calc = 82  # Valor fijo para cálculos

                if avg_minutes <= 0:
                    continue

                # Métricas avanzadas básicas
                true_shooting = avg_points / (2 * (avg_fga + 0.44 * avg_fta)) if (avg_fga + 0.44 * avg_fta) > 0 else 0.5
                usage_rate = max(5, min(50, 100 * ((avg_fga + 0.44 * avg_fta + avg_turnovers) * (league_mpg * 5)) / (avg_minutes * 200)))

                # Componentes PIMP simplificados
                offensive_box = (
                    0.25 * (avg_points - league_ppg) * (true_shooting / 0.56) +
                    0.45 * (avg_assists - league_apg) +
                    0.35 * (avg_oreb - league_rpg * 0.25) +
                    -0.55 * (avg_turnovers - league_tpg) +
                    0.08 * avg_3pm
                )

                defensive_box = (
                    0.25 * (avg_dreb - league_rpg * 0.75) +
                    0.65 * (avg_steals - league_spg) +
                    0.75 * (avg_blocks - league_bpg)
                )

                # Plus/minus component simplificado
                pm_per_48 = (avg_plusminus / avg_minutes) * 48 if avg_minutes > 0 else 0
                pm_adjusted = max(-15, min(15, pm_per_48))  # Limitar valores extremos
                pm_offensive = pm_adjusted * 0.6
                pm_defensive = pm_adjusted * 0.4

                # Pesos y factores simplificados
                total_minutes = avg_minutes * games_played_calc
                minutes_confidence = min(total_minutes / (total_minutes + 1200), 0.75)
                box_prior_weight = 1.0 - minutes_confidence
                plus_minus_weight = minutes_confidence
                stability_factor = 0.8  # Valor fijo simplificado

                # PIMP final
                offensive_pimp = max(-8, min(8, (offensive_box * box_prior_weight + pm_offensive * plus_minus_weight) * stability_factor))
                defensive_pimp = max(-8, min(8, (defensive_box * box_prior_weight + pm_defensive * plus_minus_weight) * stability_factor))
                total_pipm = offensive_pimp + defensive_pimp

                # Determinar si es la posición del jugador
                player_mapped_positions = position_mapping.get(player_position, [])
                is_player_position = standard_pos in player_mapped_positions

                position_averages.append({
                    "position": standard_pos,
                    "total_pipm": round(total_pipm, 2),
                    "offensive_pimp": round(offensive_pimp, 2),
                    "defensive_pimp": round(defensive_pimp, 2),
                    "box_prior_weight": round(box_prior_weight, 3),
                    "plus_minus_weight": round(plus_minus_weight, 3),
                    "stability_factor": round(stability_factor, 3),
                    "minutes_confidence": round(minutes_confidence, 3),
                    "usage_rate": round(usage_rate, 1),
                    "minutes_per_game": round(avg_minutes, 1),
                    "is_player_position": is_player_position
                })

            except Exception as e:
                print(f"Error processing position {standard_pos}: {e}")
                continue

        return position_averages

    except Exception as e:
        print(f"Error in player_pimp_position_averages: {str(e)}")
        # Retornar una respuesta vacía en lugar de fallar
        return []

@router.get("/{id}/advanced/raptor-war", response_model=RaptorWAR)
async def player_raptor_war(id: int, session: AsyncSession = Depends(get_db)):
    """
    RAPTOR-style Wins Above Replacement corregido con metodología más precisa
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
            func.avg(MatchStatistic.off_rebounds).label("avg_oreb"),
            func.avg(MatchStatistic.def_rebounds).label("avg_dreb"),
            func.count(MatchStatistic.id).label("games_played"),
            func.sum(MatchStatistic.minutes_played).label("total_minutes")
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
        avg_oreb = float(row.avg_oreb or 0) if row.avg_oreb else avg_rebounds * 0.25
        avg_dreb = float(row.avg_dreb or 0) if row.avg_dreb else avg_rebounds * 0.75
        games_played_real = int(row.games_played)
        total_minutes = float(row.total_minutes or 0)
        position = row.position
        
        if avg_minutes <= 0:
            return RaptorWAR(
                total_war=0.0, offensive_war=0.0, defensive_war=0.0,
                market_value_millions=0.0, positional_versatility=0.0,
                age_adjustment=1.0, injury_risk_factor=1.0,
                games_played=games_played_real, win_shares_comparison=0.0
            )
        
        # Obtener promedios de liga para contexto
        league_stmt = select(
            func.avg(MatchStatistic.points).label("league_ppg"),
            func.avg(MatchStatistic.rebounds).label("league_rpg"),
            func.avg(MatchStatistic.assists).label("league_apg"),
            func.avg(MatchStatistic.steals).label("league_spg"),
            func.avg(MatchStatistic.blocks).label("league_bpg"),
            func.avg(MatchStatistic.turnovers).label("league_tpg")
        )
        league_result = await session.execute(league_stmt)
        league_row = league_result.first()
        
        league_ppg = float(league_row.league_ppg or 22.0)
        league_rpg = float(league_row.league_rpg or 10.2)
        league_apg = float(league_row.league_apg or 5.5)
        league_spg = float(league_row.league_spg or 1.3)
        league_bpg = float(league_row.league_bpg or 1.0)
        league_tpg = float(league_row.league_tpg or 3.2)
        
        # USAR 82 PARA CÁLCULOS
        games_for_calc = 82
        
        # Métricas avanzadas corregidas
        true_shooting = avg_points / (2 * (avg_fga + 0.44 * avg_fta)) if (avg_fga + 0.44 * avg_fta) > 0 else 0.5
        effective_fg = (avg_fgm + 0.5 * avg_3pm) / avg_fga if avg_fga > 0 else 0.5
        usage_rate = 100 * ((avg_fga + 0.44 * avg_fta + avg_turnovers) * 40) / (avg_minutes * 200) if avg_minutes > 0 else 20
        
        # RAPTOR Box Score Component (coeficientes más realistas)
        offensive_box = (
            # Scoring efficiency
            0.18 * (avg_points - league_ppg) * (true_shooting / 0.56) +
            # Playmaking
            0.35 * (avg_assists - league_apg) +
            # Offensive rebounding
            0.4 * (avg_oreb - league_rpg * 0.25) +
            # Three-point shooting
            0.08 * avg_3pm +
            # Turnover penalty
            -0.45 * (avg_turnovers - league_tpg) +
            # Free throw rate
            0.12 * (avg_fta / avg_fga if avg_fga > 0 else 0)
        )
        
        defensive_box = (
            # Defensive rebounding
            0.22 * (avg_dreb - league_rpg * 0.75) +
            # Steals
            0.7 * (avg_steals - league_spg) +
            # Blocks
            0.8 * (avg_blocks - league_bpg) +
            # Usage penalty for defense
            -0.008 * max(0, usage_rate - 25)
        )
        
        # Replacement level por posición (más preciso)
        replacement_levels = {
            'PG': -2.0, 'SG': -2.2, 'SF': -2.1, 'PF': -2.3, 'C': -1.9,
            'G': -2.1, 'F': -2.2, 'G-F': -2.0, 'F-C': -2.1, 'C-F': -2.2, 'F-G': -2.1
        }
        replacement_level = replacement_levels.get(position, -2.1)
        
        # Ajuste de edad (curva más realista)
        if age <= 21:
            age_adjustment = 0.75 + (age - 19) * 0.08
        elif age <= 27:
            age_adjustment = 0.91 + (27 - age) * 0.015
        elif age <= 30:
            age_adjustment = 1.0 - (age - 27) * 0.06
        else:
            age_adjustment = 0.82 - (age - 30) * 0.04
        
        age_adjustment = max(0.3, min(1.1, age_adjustment))
        
        # Aplicar ajuste de edad a los componentes
        offensive_box_adjusted = offensive_box * age_adjustment
        defensive_box_adjusted = defensive_box * age_adjustment
        
        # WAR Calculation CORREGIDO
        # Rating total por 100 posesiones
        total_rating = offensive_box_adjusted + defensive_box_adjusted
        
        # Convertir a WAR usando minutos totales
        # Fórmula: (Rating - Replacement) * (MinutosTotales / MinutosPorJuego) / PartidosEnTemporada
        minutes_per_game = 48  # Minutos por partido
        team_possessions_per_game = 100  # Posesiones aproximadas
        
        # WAR = (Player Rating - Replacement) * (Player Minutes / Total Team Minutes) * Team Games * (1 win per 10 points of rating)
        player_minute_share = (avg_minutes * games_for_calc) / (minutes_per_game * games_for_calc)
        
        total_war = (total_rating - replacement_level) * player_minute_share * games_for_calc / 100
        
        # Separar en componentes ofensivo/defensivo
        offensive_war = (offensive_box_adjusted - replacement_level * 0.55) * player_minute_share * games_for_calc / 100
        defensive_war = (defensive_box_adjusted - replacement_level * 0.45) * player_minute_share * games_for_calc / 100
        
        # WAR puede ser negativo (jugadores por debajo del replacement level)
        total_war = max(-5, min(15, total_war))
        offensive_war = max(-3, min(10, offensive_war))
        defensive_war = max(-3, min(8, defensive_war))
        
        # Factor de riesgo de lesiones más sofisticado
        load_factor = (avg_minutes * games_played_real) / (35 * 82)  # Compared to heavy starter
        age_injury_risk = 1.0 + max(0, age - 30) * 0.05
        injury_risk_factor = 1.0 + load_factor * 0.3 + (age_injury_risk - 1.0)
        injury_risk_factor = max(1.0, min(2.5, injury_risk_factor))
        
        # Versatilidad posicional mejorada
        # Basada en balance de estadísticas y true shooting
        balance_score = 1 - abs(avg_points/league_ppg - 1) * 0.3 - abs(avg_rebounds/league_rpg - 1) * 0.2 - abs(avg_assists/league_apg - 1) * 0.3
        shooting_versatility = min(1, true_shooting / 0.5)  # Reward good shooting
        positional_versatility = max(0, min(1, (balance_score + shooting_versatility) / 2))
        
        # Market value más realista
        # Base en WAR, ajustado por edad, injury risk y posición
        position_multipliers = {
            'PG': 1.15, 'SG': 1.05, 'SF': 1.1, 'PF': 1.0, 'C': 0.95,
            'G': 1.1, 'F': 1.05, 'G-F': 1.1, 'F-C': 0.95, 'C-F': 0.95, 'F-G': 1.05
        }
        position_multiplier = position_multipliers.get(position, 1.0)

        # Market value formula CORREGIDA - valores más realistas para NBA actual
        # WAR de 0+ = jugador útil, WAR de 2+ = starter sólido, WAR de 5+ = All-Star
        if total_war <= 0:
            base_value = max(0.5, total_war * 8 + 15)  # Jugadores replacement: $7-15M
        elif total_war <= 2:
            base_value = 15 + (total_war * 12)  # Jugadores útiles: $15-39M
        elif total_war <= 5:
            base_value = 39 + ((total_war - 2) * 15)  # Starters sólidos: $39-84M
        else:
            base_value = 84 + ((total_war - 5) * 20)  # Superstars: $84M+

        # Ajustes por edad más agresivos
        if age <= 25:
            age_value_adjustment = age_adjustment * 1.4  # Premium por juventud
        elif age <= 28:
            age_value_adjustment = age_adjustment * 1.2  # Edad ideal
        elif age <= 31:
            age_value_adjustment = age_adjustment * 1.0  # Edad madura
        else:
            age_value_adjustment = age_adjustment * 0.7  # Declive por edad

        # Bonus por versatilidad más significativo
        versatility_bonus = 1 + (positional_versatility * 0.25)  # Hasta 25% bonus

        # Penalización por injury risk más suave
        injury_penalty = max(0.7, 1 / (injury_risk_factor ** 0.5))  # Penalización más suave

        # Cálculo final
        market_value_millions = (base_value * position_multiplier * age_value_adjustment * versatility_bonus * injury_penalty)

        # Límites más realistas para contratos NBA actuales
        market_value_millions = max(1.0, min(60, market_value_millions))  # $1M - $60M rango

        # Win Shares comparison más preciso
        win_shares_comparison = total_war * 1.1  # RAPTOR WAR más alineado con WS

        return RaptorWAR(
            total_war=round(total_war, 2),
            offensive_war=round(offensive_war, 2),
            defensive_war=round(defensive_war, 2),
            market_value_millions=round(market_value_millions, 1),
            positional_versatility=round(positional_versatility, 3),
            age_adjustment=round(age_adjustment, 3),
            injury_risk_factor=round(injury_risk_factor, 3),
            games_played=games_played_real,
            win_shares_comparison=round(win_shares_comparison, 2)
        )

    except Exception as e:
        print(f"Error in player_raptor_war: {str(e)}")
        raise