from operator import itemgetter
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import func, select
from typing import List, Dict, Any, Optional as OptionalType
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import literal, case
from datetime import datetime, date

from ..deps import get_current_user, get_db
from ..models import TeamInfo, Team, Match, MatchStatistic, Player, TeamRecord, TeamStats, TeamPointsProgression, TeamPointsVsOpponent, TeamPointsTypeDistribution, TeamRadarProfile, TeamShootingVolume, PlayerContribution, TeamAdvancedEfficiency, TeamLineupImpactMatrix, TeamMomentumResilience, TeamTacticalAdaptability, TeamClutchDNAProfile, TeamPredictivePerformance, User

router = APIRouter(
    prefix="/teams",
    tags=["teams"]
)

@router.get("/", response_model=List[TeamInfo])
async def read_teams(session: AsyncSession = Depends(get_db)):
    try:
        # Get all teams with a single query
        teams_query = select(Team)
        teams_result = await session.execute(teams_query)
        teams = teams_result.scalars().all()  # Changed from teams_result.all()
        
        # Create a dictionary to store each team's data
        team_ids = [team.id for team in teams]
        team_data = {team.id: {"name": team.full_name, "wins": 0, "losses": 0} for team in teams}
        
        # Calculate wins/losses with a single query for all home games
        home_games_query = select(
            Match.home_team_id,
            func.count(Match.id).filter(Match.home_score > Match.away_score).label("wins"),
            func.count(Match.id).filter(Match.home_score < Match.away_score).label("losses")
        ).where(
            Match.home_team_id.in_(team_ids),
            Match.home_score.is_not(None),
            Match.away_score.is_not(None)
        ).group_by(Match.home_team_id)
        
        home_results = await session.execute(home_games_query)
        for team_id, wins, losses in home_results:
            team_data[team_id]["wins"] += wins
            team_data[team_id]["losses"] += losses
        
        # Calculate wins/losses with a single query for all away games
        away_games_query = select(
            Match.away_team_id,
            func.count(Match.id).filter(Match.away_score > Match.home_score).label("wins"),
            func.count(Match.id).filter(Match.away_score < Match.home_score).label("losses")
        ).where(
            Match.away_team_id.in_(team_ids),
            Match.home_score.is_not(None),
            Match.away_score.is_not(None)
        ).group_by(Match.away_team_id)
        
        away_results = await session.execute(away_games_query)
        for team_id, wins, losses in away_results:
            team_data[team_id]["wins"] += wins
            team_data[team_id]["losses"] += losses
        
        # Replace the existing stats_query with this implementation
        # First, create subqueries that sum player stats by team and match
        home_stats_query = (
            select(
                Match.home_team_id.label("team_id"),
                Match.id.label("match_id"),
                func.sum(MatchStatistic.points).label("points"),
                func.sum(MatchStatistic.rebounds).label("rebounds"),
                func.sum(MatchStatistic.assists).label("assists"),
                func.sum(MatchStatistic.steals).label("steals"),
                func.sum(MatchStatistic.blocks).label("blocks")
            )
            .join(MatchStatistic, MatchStatistic.match_id == Match.id)
            .join(Player, MatchStatistic.player_id == Player.id)
            .where(Player.current_team_id == Match.home_team_id)
            .where(Match.home_team_id.in_(team_ids))
            .where(Match.home_score.is_not(None))
            .group_by(Match.home_team_id, Match.id)
            .subquery()
        )

        away_stats_query = (
            select(
                Match.away_team_id.label("team_id"),
                Match.id.label("match_id"),
                func.sum(MatchStatistic.points).label("points"),
                func.sum(MatchStatistic.rebounds).label("rebounds"),
                func.sum(MatchStatistic.assists).label("assists"),
                func.sum(MatchStatistic.steals).label("steals"),
                func.sum(MatchStatistic.blocks).label("blocks")
            )
            .join(MatchStatistic, MatchStatistic.match_id == Match.id)
            .join(Player, MatchStatistic.player_id == Player.id)
            .where(Player.current_team_id == Match.away_team_id)
            .where(Match.away_team_id.in_(team_ids))
            .where(Match.away_score.is_not(None))
            .group_by(Match.away_team_id, Match.id)
            .subquery()
        )

        # Combine both subqueries and calculate averages
        combined_stats = (
            select(
                func.coalesce(home_stats_query.c.team_id, away_stats_query.c.team_id).label("team_id"),
                home_stats_query.c.points,
                home_stats_query.c.rebounds,
                home_stats_query.c.assists,
                home_stats_query.c.steals,
                home_stats_query.c.blocks
            )
            .select_from(home_stats_query.outerjoin(away_stats_query, literal(False)))
            .union_all(
                select(
                    func.coalesce(away_stats_query.c.team_id, home_stats_query.c.team_id).label("team_id"),
                    away_stats_query.c.points,
                    away_stats_query.c.rebounds,
                    away_stats_query.c.assists,
                    away_stats_query.c.steals,
                    away_stats_query.c.blocks
                )
                .select_from(away_stats_query.outerjoin(home_stats_query, literal(False)))
            )
        ).subquery()

        # Final query to get team averages
        stats_query = (
            select(
                combined_stats.c.team_id,
                func.avg(combined_stats.c.points).label("ppg"),
                func.avg(combined_stats.c.rebounds).label("rpg"),
                func.avg(combined_stats.c.assists).label("apg"),
                func.avg(combined_stats.c.steals).label("spg"),
                func.avg(combined_stats.c.blocks).label("bpg")
            )
            .group_by(combined_stats.c.team_id)
        )
        
        stats_results = await session.execute(stats_query)
        
        # Create a dictionary to store stats for each team
        team_stats = {}
        for team_id, ppg, rpg, apg, spg, bpg in stats_results:
            team_stats[team_id] = {
                "ppg": round(ppg or 0, 1),
                "rpg": round(rpg or 0, 1),
                "apg": round(apg or 0, 1),
                "spg": round(spg or 0, 1),
                "bpg": round(bpg or 0, 1)
            }
        
        # Create TeamInfo objects
        returning_teams = []
        for team in teams:
            wins = team_data[team.id]["wins"]
            losses = team_data[team.id]["losses"]
            win_percentage = wins / (wins + losses) if (wins + losses) > 0 else 0
            
            # Use team stats if available, otherwise use default stats
            stats = team_stats.get(team.id, {"ppg": 0.0, "rpg": 0.0, "apg": 0.0, "spg": 0.0, "bpg": 0.0})
            
            team_info = TeamInfo(
                id=team.id,
                name=team.full_name,
                record=TeamRecord(wins=wins, losses=losses),
                win_percentage=round(win_percentage, 3),
                standing=0,  # We'll update this later
                stats=TeamStats(**stats)
            )
            
            returning_teams.append(team_info)
        
        # Sort teams by win percentage and assign standings
        returning_teams.sort(key=lambda t: t.win_percentage, reverse=True)
        for i, team in enumerate(returning_teams):
            team.standing = i + 1
            
        return returning_teams
        
    except Exception as e:
        print(f"Error in read_teams: {str(e)}")
        raise
    
    
@router.get("/{id}")
async def read_team(id: int, session: AsyncSession = Depends(get_db)):
    try:
        # 1. Get basic team information
        team_query = select(Team).where(Team.id == id)
        team_result = await session.execute(team_query)
        team = team_result.scalars().first()
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # 2. Get team stats (wins, losses, etc.)
        home_games_query = select(
            func.count(Match.id).filter(Match.home_score > Match.away_score).label("home_wins"),
            func.count(Match.id).filter(Match.home_score < Match.away_score).label("home_losses"),
            func.sum(Match.home_score).label("home_points_scored"),
            func.sum(Match.away_score).label("home_points_allowed")
        ).where(Match.home_team_id == id, Match.home_score.is_not(None))
        
        away_games_query = select(
            func.count(Match.id).filter(Match.away_score > Match.home_score).label("away_wins"),
            func.count(Match.id).filter(Match.away_score < Match.home_score).label("away_losses"),
            func.sum(Match.away_score).label("away_points_scored"),
            func.sum(Match.home_score).label("away_points_allowed")
        ).where(Match.away_team_id == id, Match.away_score.is_not(None))
        
        home_result = await session.execute(home_games_query)
        away_result = await session.execute(away_games_query)
        
        home_wins, home_losses, home_points_scored, home_points_allowed = home_result.one()
        away_wins, away_losses, away_points_scored, away_points_allowed = away_result.one()
        
        total_wins = home_wins + away_wins
        total_losses = home_losses + away_losses
        total_games = total_wins + total_losses
        
        # Calculate points per game and opponent points per game
        total_points_scored = (home_points_scored or 0) + (away_points_scored or 0)
        total_points_allowed = (home_points_allowed or 0) + (away_points_allowed or 0)
        ppg = round(total_points_scored / total_games, 1) if total_games > 0 else 0
        oppg = round(total_points_allowed / total_games, 1) if total_games > 0 else 0
        
        # 3. Calculate detailed team statistics
        # Get team match IDs to query match statistics
        team_match_query = select(Match.id).where(
            (Match.home_team_id == id) | (Match.away_team_id == id),
            Match.home_score.is_not(None)
        )
        team_match_result = await session.execute(team_match_query)
        team_match_ids = [match[0] for match in team_match_result.all()]
        
        # Get all players on the team
        players_query = select(Player).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        team_players = players_result.scalars().all()

        # Get player IDs for querying stats
        player_ids = [player.id for player in team_players]
        
        # Now your team_stats_query will work correctly
        team_stats_query = select(
            func.sum(MatchStatistic.rebounds).label("rebounds"),
            func.sum(MatchStatistic.assists).label("assists"),
            func.sum(MatchStatistic.steals).label("steals"),
            func.sum(MatchStatistic.blocks).label("blocks"),
            func.sum(MatchStatistic.turnovers).label("turnovers"),
            func.sum(MatchStatistic.field_goals_attempted).label("fga"),
            func.sum(MatchStatistic.field_goals_made).label("fgm"),
            func.sum(MatchStatistic.three_points_attempted).label("tpa"),
            func.sum(MatchStatistic.three_points_made).label("tpm"),
            func.sum(MatchStatistic.free_throws_attempted).label("fta"),
            func.sum(MatchStatistic.free_throws_made).label("ftm"),
        ).where(
            MatchStatistic.match_id.in_(team_match_ids),
            MatchStatistic.player_id.in_(player_ids)
        )
        
        team_stats_result = await session.execute(team_stats_query)
        team_stats = team_stats_result.one()
        
        # Calculate per game averages and percentages
        rpg = round((team_stats.rebounds or 0) / total_games, 1) if total_games > 0 else 0
        apg = round((team_stats.assists or 0) / total_games, 1) if total_games > 0 else 0
        spg = round((team_stats.steals or 0) / total_games, 1) if total_games > 0 else 0
        bpg = round((team_stats.blocks or 0) / total_games, 1) if total_games > 0 else 0
        topg = round((team_stats.turnovers or 0) / total_games, 1) if total_games > 0 else 0
        
        # Calculate shooting percentages
        fgp = round((team_stats.fgm or 0) / (team_stats.fga or 1) * 100, 1)
        tpp = round((team_stats.tpm or 0) / (team_stats.tpa or 1) * 100, 1)
        ftp = round((team_stats.ftm or 0) / (team_stats.fta or 1) * 100, 1)
        
        # 3. Get team players with stats matching frontend interface
        # players_query = select(Player).where(Player.current_team_id == id)
        # players_result = await session.execute(players_query)
        # team_players = players_result.scalars().all()  # Changed from players_result.all()
        
        # # Get player IDs for querying stats
        # player_ids = [player.id for player in team_players]
        
        # Get all stats for these players in a single query
        stats_query = select(MatchStatistic).where(MatchStatistic.player_id.in_(player_ids))
        stats_result = await session.execute(stats_query)
        all_stats = stats_result.scalars().all()  # Changed from stats_result.all()
        
        # Group stats by player ID
        stats_by_player = {}
        for stat in all_stats:
            if stat.player_id not in stats_by_player:
                stats_by_player[stat.player_id] = []
            stats_by_player[stat.player_id].append(stat)
        
        # Process players with their stats
        processed_players = []
        for player in team_players:
            player_stats = stats_by_player.get(player.id, [])
            
            # Calculate averages if there are stats
            if player_stats:
                stats_dict = {
                    "ppg": round(sum(s.points or 0 for s in player_stats) / len(player_stats), 1) 
                         if any(s.points for s in player_stats) else 0.0,
                    "rpg": round(sum(s.rebounds or 0 for s in player_stats) / len(player_stats), 1) 
                         if any(s.rebounds for s in player_stats) else 0.0,
                    "apg": round(sum(s.assists or 0 for s in player_stats) / len(player_stats), 1) 
                         if any(s.assists for s in player_stats) else 0.0,
                    "spg": round(sum(s.steals or 0 for s in player_stats) / len(player_stats), 1) 
                         if any(s.steals for s in player_stats) else 0.0,
                    "bpg": round(sum(s.blocks or 0 for s in player_stats) / len(player_stats), 1) 
                         if any(s.blocks for s in player_stats) else 0.0,
                    "mpg": round(sum(s.minutes_played or 0 for s in player_stats) / len(player_stats), 1) 
                         if any(s.minutes_played for s in player_stats) else 0.0
                }
            else:
                stats_dict = {
                    "ppg": 0.0,
                    "rpg": 0.0,
                    "apg": 0.0,
                    "spg": 0.0,
                    "bpg": 0.0,
                    "mpg": 0.0
                }
            
            # Create Player object matching frontend interface
            processed_player = {
                "id": player.id,
                "name": player.name,
                "position": player.position or "",
                "height": player.height or 0,
                "weight": player.weight or 0,
                "number": player.number or 0,
                "url_pic": player.url_pic or "",
                "stats": stats_dict
            }
            
            processed_players.append(processed_player)

        processed_players = sorted(processed_players, key=lambda d: d['stats']['ppg'], reverse=True)  # Sort players by PPG
        # 4. Get recent and upcoming games
        today = datetime.now().date()
        
        # Get all teams info for names
        teams_query = select(Team.id, Team.full_name, Team.abbreviation)
        teams_result = await session.execute(teams_query)
        team_info = {id_: {"name": name, "abbreviation": abbr} for id_, name, abbr in teams_result.all()}
        
        # Recent games (past)
        recent_games_query = (
            select(Match)
            .where((Match.home_team_id == id) | (Match.away_team_id == id))
            .where(Match.date < today)
            .where(Match.home_score.is_not(None))
            .order_by(Match.date.desc())
            .limit(10)
        )
        
        # Upcoming games (future)
        upcoming_games_query = (
            select(Match)
            .where((Match.home_team_id == id) | (Match.away_team_id == id))
            .where(Match.date >= today)
            .order_by(Match.date)
            .limit(5)
        )
        
        recent_games_result = await session.execute(recent_games_query)
        upcoming_games_result = await session.execute(upcoming_games_query)
        
        recent_games = recent_games_result.scalars().all()  # Changed from recent_games_result.all()
        upcoming_games = upcoming_games_result.scalars().all()  # Changed from upcoming_games_result.all()
        
        # Transform match objects to include required fields
        processed_recent_games = []
        for game in recent_games:
            # Determine if the queried team is home or away
            is_home = game.home_team_id == id
            rival_team_id = game.away_team_id if is_home else game.home_team_id
            
            processed_recent_games.append({
                "id": game.id,
                "date": str(game.date),  # Convert to string for frontend
                "season": game.season,
                "home_team_id": game.home_team_id,
                "away_team_id": game.away_team_id,
                "home_team_name": team_info.get(game.home_team_id, {"name": "Unknown Team"})["name"],
                "away_team_name": team_info.get(game.away_team_id, {"name": "Unknown Team"})["name"],
                "rival_team_abbreviation": team_info.get(rival_team_id, {"abbreviation": "UNK"})["abbreviation"],
                "home_score": game.home_score or 0,
                "away_score": game.away_score or 0,
                "status": "completed"  # Since these are past games with scores
            })
        
        processed_upcoming_games = []
        for game in upcoming_games:
            # Determine if the queried team is home or away
            is_home = game.home_team_id == id
            rival_team_id = game.away_team_id if is_home else game.home_team_id
            
            processed_upcoming_games.append({
                "id": game.id,
                "date": str(game.date),  # Convert to string for frontend
                "season": game.season,
                "home_team_id": game.home_team_id,
                "away_team_id": game.away_team_id,
                "home_team_name": team_info.get(game.home_team_id, {"name": "Unknown Team"})["name"],
                "away_team_name": team_info.get(game.away_team_id, {"name": "Unknown Team"})["name"],
                "rival_team_abbreviation": team_info.get(rival_team_id, {"abbreviation": "UNK"})["abbreviation"],
                "home_score": game.home_score or 0,
                "away_score": game.away_score or 0,
                "status": "scheduled"  # Since these are future games
            })
        
        # 5. Compile and return the data
        return {
            "id": team.id,
            "full_name": team.full_name,
            "abbreviation": team.abbreviation,
            "conference": team.conference or "",
            "division": team.division or "",
            "stadium": team.stadium or "",
            "city": team.city or "",
            "logo": "",  # No logo field in database, but frontend expects it
            "stats": {
                "wins": total_wins,
                "losses": total_losses,
                "conference_rank": None,  # Ignored as per instructions
                "ppg": ppg,
                "oppg": oppg,
                "rpg": rpg,
                "apg": apg,
                "spg": spg,
                "bpg": bpg,
                "topg": topg,
                "fgp": fgp,
                "tpp": tpp,
                "ftp": ftp
            },
            "players": processed_players,
            "recent_games": processed_recent_games,
            "upcoming_games": processed_upcoming_games,
            "championships": None,  # Ignored as per instructions
            "founded": None  # Ignored as per instructions
        }
        
    except Exception as e:
        print(f"Error in read_team: {str(e)}")
        raise

# Añadir este endpoint
@router.get("/{id}/favorite-status", response_model=dict)
async def get_team_favorite_status(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtiene el estado de favorito de un equipo para el usuario actual"""
    try:
        from ..crud_favorites import is_team_favorite
        is_favorite = await is_team_favorite(db, current_user.id, id)
        return {"is_favorite": is_favorite}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking favorite status: {str(e)}"
        )

@router.get("/{id}/basicstats/pointsprogression", response_model=List[TeamPointsProgression])
async def team_points_progression(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve la evolución de puntos anotados por partido para un equipo.
    Formato: [{ "date": "2024-01-12", "points": 102 }, ...]
    """
    stmt = (
        select(
            Match.date,
            case(
                (Match.home_team_id == id, Match.home_score),
                else_=Match.away_score
            ).label("points")
        )
        .where(((Match.home_team_id == id) | (Match.away_team_id == id)) & (Match.home_score.is_not(None)))
        .order_by(Match.date)
    )
    result = await session.execute(stmt)
    return [{"date": date.isoformat(), "points": points} for date, points in result.all()]

@router.get("/{id}/basicstats/points_vs_opponent", response_model=List[TeamPointsVsOpponent])
async def team_points_vs_opponent(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve para cada partido los puntos anotados y recibidos.
    Formato: [{ "date": "2024-01-12", "points_for": 102, "points_against": 98 }, ...]
    """
    stmt = (
        select(
            Match.date,
            case(
                (Match.home_team_id == id, Match.home_score),
                else_=Match.away_score
            ).label("points_for"),
            case(
                (Match.home_team_id == id, Match.away_score),
                else_=Match.home_score
            ).label("points_against"),
        )
        .where(((Match.home_team_id == id) | (Match.away_team_id == id)) & (Match.home_score.is_not(None)))
        .order_by(Match.date)
    )
    result = await session.execute(stmt)
    return [
        {"date": date.isoformat(), "points_for": pf, "points_against": pa}
        for date, pf, pa in result.all()
    ]

@router.get("/{id}/basicstats/pointstype", response_model=TeamPointsTypeDistribution)
async def team_points_by_type(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve la distribución de puntos por tipo de tiro para el equipo.
    Formato: { "two_points": 3200, "three_points": 1200, "free_throws": 800 }
    """
    # Buscar todos los jugadores actuales del equipo
    players_query = select(Player.id).where(Player.current_team_id == id)
    players_result = await session.execute(players_query)
    player_ids = [pid for (pid,) in players_result.all()]
    if not player_ids:
        return {"two_points": 0, "three_points": 0, "free_throws": 0}

    stmt = (
        select(
            func.sum((func.coalesce(MatchStatistic.field_goals_made, 0) - func.coalesce(MatchStatistic.three_points_made, 0)) * 2).label("two_points"),
            func.sum(func.coalesce(MatchStatistic.three_points_made, 0) * 3).label("three_points"),
            func.sum(func.coalesce(MatchStatistic.free_throws_made, 0)).label("free_throws"),
        )
        .where(MatchStatistic.player_id.in_(player_ids))
    )
    result = await session.execute(stmt)
    two_points, three_points, free_throws = result.one()
    return {
        "two_points": int(two_points or 0),
        "three_points": int(three_points or 0),
        "free_throws": int(free_throws or 0),
    }

@router.get("/{id}/basicstats/teamradar", response_model=TeamRadarProfile)
async def team_radar_profile(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve el perfil radar del equipo con promedios por partido.
    Formato: { "points": 112.5, "rebounds": 45.2, "assists": 25.8, "steals": 8.1, "blocks": 5.3 }
    """
    # Buscar todos los jugadores actuales del equipo
    players_query = select(Player.id).where(Player.current_team_id == id)
    players_result = await session.execute(players_query)
    player_ids = [pid for (pid,) in players_result.all()]
    if not player_ids:
        return {"points": 0, "rebounds": 0, "assists": 0, "steals": 0, "blocks": 0}

    # Obtener partidos del equipo para calcular promedios
    team_matches_query = select(Match.id).where(
        ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
        (Match.home_score.is_not(None))
    )
    team_matches_result = await session.execute(team_matches_query)
    match_ids = [mid for (mid,) in team_matches_result.all()]
    
    if not match_ids:
        return {"points": 0, "rebounds": 0, "assists": 0, "steals": 0, "blocks": 0}

    # Crear subconsulta que suma estadísticas por partido
    team_stats_per_match = (
        select(
            MatchStatistic.match_id,
            func.sum(MatchStatistic.points).label("match_points"),
            func.sum(MatchStatistic.rebounds).label("match_rebounds"),
            func.sum(MatchStatistic.assists).label("match_assists"),
            func.sum(MatchStatistic.steals).label("match_steals"),
            func.sum(MatchStatistic.blocks).label("match_blocks")
        )
        .where(MatchStatistic.player_id.in_(player_ids))
        .where(MatchStatistic.match_id.in_(match_ids))
        .group_by(MatchStatistic.match_id)
        .subquery()
    )
    
    # Calcular promedios de la subconsulta
    stmt = select(
        func.avg(team_stats_per_match.c.match_points).label("points"),
        func.avg(team_stats_per_match.c.match_rebounds).label("rebounds"),
        func.avg(team_stats_per_match.c.match_assists).label("assists"),
        func.avg(team_stats_per_match.c.match_steals).label("steals"),
        func.avg(team_stats_per_match.c.match_blocks).label("blocks")
    )
    
    result = await session.execute(stmt)
    points, rebounds, assists, steals, blocks = result.one()
    
    return {
        "points": round(float(points or 0), 1),
        "rebounds": round(float(rebounds or 0), 1),
        "assists": round(float(assists or 0), 1),
        "steals": round(float(steals or 0), 1),
        "blocks": round(float(blocks or 0), 1)
    }

@router.get("/{id}/basicstats/shootingvolume", response_model=List[TeamShootingVolume])
async def team_shooting_volume(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve el volumen de tiro promedio por partido del equipo.
    Formato: [{"name": "FGA", "value": 89.2}, {"name": "3PA", "value": 35.1}, {"name": "FTA", "value": 18.7}]
    """
    # Buscar todos los jugadores actuales del equipo
    players_query = select(Player.id).where(Player.current_team_id == id)
    players_result = await session.execute(players_query)
    player_ids = [pid for (pid,) in players_result.all()]
    if not player_ids:
        return [{"name": "FGA", "value": 0}, {"name": "3PA", "value": 0}, {"name": "FTA", "value": 0}]

    # Obtener partidos del equipo
    team_matches_query = select(Match.id).where(
        ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
        (Match.home_score.is_not(None))
    )
    team_matches_result = await session.execute(team_matches_query)
    match_ids = [mid for (mid,) in team_matches_result.all()]
    
    if not match_ids:
        return [{"name": "FGA", "value": 0}, {"name": "3PA", "value": 0}, {"name": "FTA", "value": 0}]

    # Crear subconsulta que suma volumen de tiro por partido
    team_shooting_per_match = (
        select(
            MatchStatistic.match_id,
            func.sum(MatchStatistic.field_goals_attempted).label("match_fga"),
            func.sum(MatchStatistic.three_points_attempted).label("match_tpa"),
            func.sum(MatchStatistic.free_throws_attempted).label("match_fta")
        )
        .where(MatchStatistic.player_id.in_(player_ids))
        .where(MatchStatistic.match_id.in_(match_ids))
        .group_by(MatchStatistic.match_id)
        .subquery()
    )
    
    # Calcular promedios de la subconsulta
    stmt = select(
        func.avg(team_shooting_per_match.c.match_fga).label("fga"),
        func.avg(team_shooting_per_match.c.match_tpa).label("tpa"),
        func.avg(team_shooting_per_match.c.match_fta).label("fta")
    )
    
    result = await session.execute(stmt)
    fga, tpa, fta = result.one()
    
    return [
        {"name": "FGA", "value": round(float(fga or 0), 1)},
        {"name": "3PA", "value": round(float(tpa or 0), 1)},
        {"name": "FTA", "value": round(float(fta or 0), 1)}
    ]

@router.get("/{id}/basicstats/playerscontribution", response_model=List[PlayerContribution])
async def team_players_contribution(id: int, session: AsyncSession = Depends(get_db)):
    """
    Devuelve la contribución de puntos de los jugadores del equipo.
    Formato: [{"player_name": "LeBron James", "points": 1247, "percentage": 28.5}, ...]
    """
    # Buscar todos los jugadores actuales del equipo
    players_query = select(Player.id, Player.name).where(Player.current_team_id == id)
    players_result = await session.execute(players_query)
    players_data = {pid: name for pid, name in players_result.all()}
    
    if not players_data:
        return []

    # Obtener partidos del equipo
    team_matches_query = select(Match.id).where(
        ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
        (Match.home_score.is_not(None))
    )
    team_matches_result = await session.execute(team_matches_query)
    match_ids = [mid for (mid,) in team_matches_result.all()]
    
    if not match_ids:
        return []

    # Calcular puntos totales por jugador
    stmt = (
        select(
            MatchStatistic.player_id,
            func.sum(MatchStatistic.points).label("total_points")
        )
        .where(MatchStatistic.player_id.in_(list(players_data.keys())))
        .where(MatchStatistic.match_id.in_(match_ids))
        .group_by(MatchStatistic.player_id)
        .order_by(func.sum(MatchStatistic.points).desc())
    )
    result = await session.execute(stmt)
    player_points = result.all()
    
    # Calcular puntos totales del equipo
    total_team_points = sum(points for _, points in player_points)
    
    # Crear respuesta con porcentajes
    contributions = []
    for player_id, points in player_points:
        player_name = players_data.get(player_id, "Unknown Player")
        percentage = (points / total_team_points * 100) if total_team_points > 0 else 0
        contributions.append({
            "player_name": player_name,
            "points": int(points or 0),
            "percentage": round(percentage, 1)
        })
    
    return contributions

@router.get("/{id}/advanced/efficiency-rating", response_model=TeamAdvancedEfficiency)
async def team_advanced_efficiency_rating(id: int, session: AsyncSession = Depends(get_db)):
    try:
        # 1. Obtener TODOS los equipos y sus estadísticas completas
        teams_query = select(Team.id)
        teams_result = await session.execute(teams_query)
        all_team_ids = [tid for (tid,) in teams_result.all()]

        # 2. Obtener TODOS los partidos de la liga
        matches_query = select(
            Match.id, Match.home_team_id, Match.away_team_id, Match.home_score, Match.away_score, Match.date
        ).where(Match.home_score.is_not(None))
        matches_result = await session.execute(matches_query)
        all_matches = matches_result.all()
        
        if not all_matches:
            raise HTTPException(status_code=404, detail="No matches found")

        # 3. Obtener TODAS las estadísticas de TODOS los jugadores
        stats_query = select(
            MatchStatistic.match_id,
            MatchStatistic.player_id,
            MatchStatistic.points,
            MatchStatistic.field_goals_attempted,
            MatchStatistic.field_goals_made,
            MatchStatistic.three_points_attempted,
            MatchStatistic.three_points_made,
            MatchStatistic.free_throws_attempted,
            MatchStatistic.free_throws_made,
            MatchStatistic.turnovers,
            MatchStatistic.rebounds,
            MatchStatistic.assists,
            MatchStatistic.steals,
            MatchStatistic.blocks
        )
        stats_result = await session.execute(stats_query)
        all_stats = stats_result.all()

        # 4. Mapear jugadores a equipos
        players_query = select(Player.id, Player.current_team_id)
        players_result = await session.execute(players_query)
        player_team_map = {pid: tid for pid, tid in players_result.all()}

        # 5. Calcular estadísticas por equipo y partido
        team_game_stats = {}
        for match_id, player_id, points, fga, fgm, tpa, tpm, fta, ftm, tov, reb, ast, stl, blk in all_stats:
            team_id = player_team_map.get(player_id)
            if not team_id:
                continue
                
            key = (team_id, match_id)
            if key not in team_game_stats:
                team_game_stats[key] = {
                    'points': 0, 'fga': 0, 'fgm': 0, 'tpa': 0, 'tpm': 0,
                    'fta': 0, 'ftm': 0, 'tov': 0, 'reb': 0, 'ast': 0, 'stl': 0, 'blk': 0
                }
            
            team_game_stats[key]['points'] += points or 0
            team_game_stats[key]['fga'] += fga or 0
            team_game_stats[key]['fgm'] += fgm or 0
            team_game_stats[key]['tpa'] += tpa or 0
            team_game_stats[key]['tpm'] += tpm or 0
            team_game_stats[key]['fta'] += fta or 0
            team_game_stats[key]['ftm'] += ftm or 0
            team_game_stats[key]['tov'] += tov or 0
            team_game_stats[key]['reb'] += reb or 0
            team_game_stats[key]['ast'] += ast or 0
            team_game_stats[key]['stl'] += stl or 0
            team_game_stats[key]['blk'] += blk or 0

        # 6. Calcular métricas avanzadas por equipo
        team_advanced_stats = {}
        
        for team_id in all_team_ids:
            team_games = []
            team_off_ratings = []
            team_def_ratings = []
            team_net_ratings = []
            team_pace_values = []
            team_ts_values = []
            team_efg_values = []
            team_tov_rates = []
            team_reb_rates = []
            
            wins = 0
            total_games = 0
            clutch_wins = 0
            clutch_games = 0
            blowout_wins = 0
            blowout_games = 0
            
            for match in all_matches:
                if match.home_team_id == team_id or match.away_team_id == team_id:
                    team_stats = team_game_stats.get((team_id, match.id), {})
                    opp_id = match.away_team_id if match.home_team_id == team_id else match.home_team_id
                    opp_stats = team_game_stats.get((opp_id, match.id), {})
                    
                    if not team_stats or not opp_stats:
                        continue
                    
                    # Calcular posesiones (fórmula estándar NBA)
                    team_poss = team_stats.get('fga', 0) + 0.44 * team_stats.get('fta', 0) + team_stats.get('tov', 0)
                    opp_poss = opp_stats.get('fga', 0) + 0.44 * opp_stats.get('fta', 0) + opp_stats.get('tov', 0)
                    
                    if team_poss > 0 and opp_poss > 0:
                        # Offensive/Defensive Rating (puntos por 100 posesiones)
                        off_rating = (team_stats.get('points', 0) / team_poss) * 100
                        def_rating = (opp_stats.get('points', 0) / opp_poss) * 100
                        net_rating = off_rating - def_rating
                        
                        # Pace (posesiones por 48 minutos)
                        pace = (team_poss + opp_poss) / 2
                        
                        # True Shooting %
                        tsa = team_stats.get('fga', 0) + 0.44 * team_stats.get('fta', 0)
                        ts_pct = team_stats.get('points', 0) / (2 * tsa) if tsa > 0 else 0
                        
                        # Effective FG%
                        efg_pct = (team_stats.get('fgm', 0) + 0.5 * team_stats.get('tpm', 0)) / team_stats.get('fga', 1)
                        
                        # Turnover Rate
                        tov_rate = team_stats.get('tov', 0) / team_poss if team_poss > 0 else 0
                        
                        # Rebound Rate (aproximado)
                        total_reb = team_stats.get('reb', 0) + opp_stats.get('reb', 0)
                        reb_rate = team_stats.get('reb', 0) / total_reb if total_reb > 0 else 0.5
                        
                        team_off_ratings.append(off_rating)
                        team_def_ratings.append(def_rating)
                        team_net_ratings.append(net_rating)
                        team_pace_values.append(pace)
                        team_ts_values.append(ts_pct)
                        team_efg_values.append(efg_pct)
                        team_tov_rates.append(tov_rate)
                        team_reb_rates.append(reb_rate)
                        
                        # Win/Loss tracking
                        is_home = match.home_team_id == team_id
                        team_score = match.home_score if is_home else match.away_score
                        opp_score = match.away_score if is_home else match.home_score
                        margin = team_score - opp_score
                        
                        total_games += 1
                        if margin > 0:
                            wins += 1
                        
                        # Clutch games (≤5 points)
                        if abs(margin) <= 5:
                            clutch_games += 1
                            if margin > 0:
                                clutch_wins += 1
                        
                        # Blowout games (≥15 points)
                        if abs(margin) >= 15:
                            blowout_games += 1
                            if margin > 0:
                                blowout_wins += 1
            
            # Calcular promedios del equipo
            if team_off_ratings:
                team_advanced_stats[team_id] = {
                    'off_rating': sum(team_off_ratings) / len(team_off_ratings),
                    'def_rating': sum(team_def_ratings) / len(team_def_ratings),
                    'net_rating': sum(team_net_ratings) / len(team_net_ratings),
                    'pace': sum(team_pace_values) / len(team_pace_values),
                    'ts_pct': sum(team_ts_values) / len(team_ts_values),
                    'efg_pct': sum(team_efg_values) / len(team_efg_values),
                    'tov_rate': sum(team_tov_rates) / len(team_tov_rates),
                    'reb_rate': sum(team_reb_rates) / len(team_reb_rates),
                    'win_pct': wins / total_games if total_games > 0 else 0,
                    'clutch_pct': clutch_wins / clutch_games if clutch_games > 0 else 0.5,
                    'blowout_pct': blowout_wins / blowout_games if blowout_games > 0 else 0.5,
                    'games': total_games,
                    'consistency': 1 - (sum((x - sum(team_net_ratings)/len(team_net_ratings))**2 for x in team_net_ratings) / len(team_net_ratings))**0.5 / 20
                }
            else:
                team_advanced_stats[team_id] = {
                    'off_rating': 100, 'def_rating': 100, 'net_rating': 0, 'pace': 100,
                    'ts_pct': 0.55, 'efg_pct': 0.5, 'tov_rate': 0.15, 'reb_rate': 0.5,
                    'win_pct': 0.5, 'clutch_pct': 0.5, 'blowout_pct': 0.5, 'games': 0, 'consistency': 0.5
                }

        # 7. Calcular strength of schedule
        team_sos = {}
        for team_id in all_team_ids:
            opp_win_pcts = []
            for match in all_matches:
                if match.home_team_id == team_id:
                    opp_id = match.away_team_id
                elif match.away_team_id == team_id:
                    opp_id = match.home_team_id
                else:
                    continue
                
                opp_win_pct = team_advanced_stats.get(opp_id, {}).get('win_pct', 0.5)
                opp_win_pcts.append(opp_win_pct)
            
            team_sos[team_id] = sum(opp_win_pcts) / len(opp_win_pcts) if opp_win_pcts else 0.5

        # 8. Calcular percentiles y z-scores REALES
        def calculate_percentile_rank(value, all_values):
            """Calcula el percentil real de un valor en una lista"""
            sorted_values = sorted(all_values)
            n = len(sorted_values)
            
            # Encontrar posición del valor
            count_below = sum(1 for v in sorted_values if v < value)
            count_equal = sum(1 for v in sorted_values if v == value)
            
            # Percentil = (count_below + 0.5 * count_equal) / n * 100
            percentile = (count_below + 0.5 * count_equal) / n * 100
            return percentile

        # Obtener todas las métricas de la liga
        all_off_ratings = [stats['off_rating'] for stats in team_advanced_stats.values()]
        all_def_ratings = [stats['def_rating'] for stats in team_advanced_stats.values()]
        all_net_ratings = [stats['net_rating'] for stats in team_advanced_stats.values()]
        all_ts_pcts = [stats['ts_pct'] for stats in team_advanced_stats.values()]
        all_tov_rates = [stats['tov_rate'] for stats in team_advanced_stats.values()]
        all_reb_rates = [stats['reb_rate'] for stats in team_advanced_stats.values()]
        all_sos = list(team_sos.values())

        # 9. Calcular TAER Score para el equipo solicitado
        team_stats = team_advanced_stats.get(id, {})
        
        if team_stats.get('games', 0) == 0:
            return TeamAdvancedEfficiency(
                offensive_efficiency=100.0, defensive_efficiency=100.0, pace_factor=1.0,
                strength_of_schedule=50.0, clutch_factor=0.5, consistency_index=0.5, taer_score=50.0
            )

        # Calcular percentiles para cada métrica
        off_percentile = calculate_percentile_rank(team_stats['off_rating'], all_off_ratings)
        def_percentile = calculate_percentile_rank(team_stats['def_rating'], all_def_ratings)  # Menor es mejor
        def_percentile = 100 - def_percentile  # Invertir para que menor sea mejor
        
        net_percentile = calculate_percentile_rank(team_stats['net_rating'], all_net_ratings)
        ts_percentile = calculate_percentile_rank(team_stats['ts_pct'], all_ts_pcts)
        tov_percentile = calculate_percentile_rank(team_stats['tov_rate'], all_tov_rates)
        tov_percentile = 100 - tov_percentile  # Invertir para que menor sea mejor
        
        reb_percentile = calculate_percentile_rank(team_stats['reb_rate'], all_reb_rates)
        sos_percentile = calculate_percentile_rank(team_sos.get(id, 0.5), all_sos)

        # 10. TAER Score final con pesos optimizados
        taer_score = (
            net_percentile * 0.35 +           # 35% - Net Rating (lo más importante)
            off_percentile * 0.20 +           # 20% - Offensive efficiency
            def_percentile * 0.20 +           # 20% - Defensive efficiency  
            ts_percentile * 0.10 +            # 10% - Shooting efficiency
            tov_percentile * 0.05 +           # 5% - Ball security
            reb_percentile * 0.05 +           # 5% - Rebounding
            sos_percentile * 0.05             # 5% - Strength of schedule
        )

        # Aplicar bonificaciones/penalizaciones por contexto
        clutch_bonus = (team_stats['clutch_pct'] - 0.5) * 10  # +/-5 puntos max
        consistency_bonus = (team_stats['consistency'] - 0.5) * 6  # +/-3 puntos max
        blowout_bonus = (team_stats['blowout_pct'] - 0.5) * 4  # +/-2 puntos max

        taer_score += clutch_bonus + consistency_bonus + blowout_bonus

        # Asegurar rango realista (15-95)
        taer_score = max(15.0, min(95.0, taer_score))

        return TeamAdvancedEfficiency(
            offensive_efficiency=round(team_stats['off_rating'], 1),
            defensive_efficiency=round(team_stats['def_rating'], 1),
            pace_factor=round(team_stats['pace'] / 100, 2),
            strength_of_schedule=round(team_sos.get(id, 0.5) * 100, 1),
            clutch_factor=round(team_stats['clutch_pct'], 2),
            consistency_index=round(team_stats['consistency'], 2),
            taer_score=round(taer_score, 1)
        )
        
    except Exception as e:
        print(f"Error in team_advanced_efficiency_rating: {str(e)}")
        raise

@router.get("/{id}/advanced/lineup-impact-matrix", response_model=TeamLineupImpactMatrix)
async def team_lineup_impact_matrix(id: int, session: AsyncSession = Depends(get_db)):
    """
    Team Lineup Impact Matrix: Análisis de combinaciones de jugadores y su impacto sinérgico.
    Identifica mejores/peores combinaciones y química del equipo.
    """
    try:
        # Obtener jugadores del equipo con sus estadísticas
        players_query = select(Player.id, Player.name, Player.position).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        players = players_result.all()
        
        if len(players) < 5:
            return TeamLineupImpactMatrix(
                best_lineup_plus_minus=0.0, worst_lineup_plus_minus=0.0, synergy_score=1.0,
                position_flexibility=50.0, chemistry_rating=1.0, load_balance_index=0.5,
                injury_risk_factor=0.5, top_lineup_minutes=0.0, depth_factor=0.5
            )

        player_ids = [p.id for p in players]
        
        # Obtener partidos del equipo
        team_matches_query = select(Match.id).where(
            ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
            (Match.home_score.is_not(None))
        )
        team_matches_result = await session.execute(team_matches_query)
        match_ids = [mid for (mid,) in team_matches_result.all()]
        
        if not match_ids:
            return TeamLineupImpactMatrix(
                best_lineup_plus_minus=0.0, worst_lineup_plus_minus=0.0, synergy_score=1.0,
                position_flexibility=50.0, chemistry_rating=1.0, load_balance_index=0.5,
                injury_risk_factor=0.5, top_lineup_minutes=0.0, depth_factor=0.5
            )

        # 1. PLUS/MINUS ANALYSIS
        plusminus_query = select(
            MatchStatistic.player_id,
            func.avg(MatchStatistic.plusminus).label("avg_plusminus"),
            func.avg(MatchStatistic.minutes_played).label("avg_minutes"),
            func.count(MatchStatistic.id).label("games_played")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids)
        ).group_by(MatchStatistic.player_id)
        
        plusminus_result = await session.execute(plusminus_query)
        player_stats = {}
        for pid, pm, min_p, games in plusminus_result.all():
            player_stats[pid] = {
                "pm": float(pm or 0),  # CONVERTIR A FLOAT
                "min": float(min_p or 0),  # CONVERTIR A FLOAT
                "games": int(games or 0)
            }
        
        # Simular mejores/peores combinaciones usando promedios individuales
        player_plusminus = [(pid, stats["pm"]) for pid, stats in player_stats.items()]
        player_plusminus.sort(key=lambda x: x[1], reverse=True)
        
        # Top 5 y Bottom 5 jugadores
        best_5_pm = sum(pm for _, pm in player_plusminus[:5]) / 5 if len(player_plusminus) >= 5 else 0.0
        worst_5_pm = sum(pm for _, pm in player_plusminus[-5:]) / 5 if len(player_plusminus) >= 5 else 0.0
        
        # 2. SYNERGY SCORE (correlación entre tiempo jugado y eficiencia)
        total_synergy = 0.0
        synergy_count = 0
        for pid, stats in player_stats.items():
            if stats["games"] > 10:  # Suficientes datos
                efficiency = stats["pm"] / max(stats["min"], 1) * 48  # USAR max() PARA EVITAR DIVISIÓN POR 0
                total_synergy += efficiency
                synergy_count += 1
        
        synergy_score = 1.0 + (total_synergy / max(synergy_count, 1) / 10) if synergy_count > 0 else 1.0
        synergy_score = max(0.5, min(2.0, synergy_score))
        
        # 3. POSITION FLEXIBILITY
        position_counts = {}
        for player in players:
            pos = player.position or "Unknown"
            position_counts[pos] = position_counts.get(pos, 0) + 1
        
        # Calcular diversidad posicional
        total_players = len(players)
        position_diversity = len(position_counts) / min(5, max(total_players, 1)) * 100
        position_flexibility = min(100.0, position_diversity)
        
        # 4. CHEMISTRY RATING (estabilidad de rendimiento)
        chemistry_factors = []
        for pid, stats in player_stats.items():
            if stats["games"] > 5:
                consistency = 1.0 / (abs(stats["pm"]) / 10.0 + 1.0)  # Más consistente = mejor química
                chemistry_factors.append(consistency)
        
        chemistry_rating = sum(chemistry_factors) / max(len(chemistry_factors), 1) if chemistry_factors else 1.0
        
        # 5. LOAD BALANCE INDEX
        minutes_distribution = [stats["min"] for stats in player_stats.values()]
        if minutes_distribution:
            mean_minutes = sum(minutes_distribution) / len(minutes_distribution)
            variance = sum((m - mean_minutes) ** 2 for m in minutes_distribution) / len(minutes_distribution)
            std_dev = variance ** 0.5
            load_balance_index = max(0.1, 1.0 - (std_dev / max(mean_minutes, 1))) if mean_minutes > 0 else 0.5
        else:
            load_balance_index = 0.5
        
        # 6. INJURY RISK FACTOR (dependencia de jugadores clave)
        top_3_minutes = sorted([stats["min"] for stats in player_stats.values()], reverse=True)[:3]
        total_top_3 = sum(top_3_minutes)
        team_total_minutes = sum(stats["min"] for stats in player_stats.values())
        
        dependency_ratio = total_top_3 / max(team_total_minutes, 1) if team_total_minutes > 0 else 0.6
        injury_risk_factor = dependency_ratio  # Mayor dependencia = mayor riesgo
        
        # 7. TOP LINEUP MINUTES Y DEPTH FACTOR
        top_lineup_minutes = sum(top_3_minutes) / max(len(top_3_minutes), 1) if top_3_minutes else 0.0
        
        # Depth factor: contribución del banquillo
        all_plusminus = sorted([stats["pm"] for stats in player_stats.values()])
        bench_stats = all_plusminus[5:] if len(all_plusminus) > 5 else []  # Jugadores 6+
        depth_factor = (sum(bench_stats) / len(bench_stats) + 5.0) / 10.0 if bench_stats else 0.5
        depth_factor = max(0.1, min(1.0, depth_factor))
        
        return TeamLineupImpactMatrix(
            best_lineup_plus_minus=round(best_5_pm, 1),
            worst_lineup_plus_minus=round(worst_5_pm, 1),
            synergy_score=round(synergy_score, 2),
            position_flexibility=round(position_flexibility, 1),
            chemistry_rating=round(chemistry_rating, 2),
            load_balance_index=round(load_balance_index, 2),
            injury_risk_factor=round(injury_risk_factor, 2),
            top_lineup_minutes=round(top_lineup_minutes, 1),
            depth_factor=round(depth_factor, 2)
        )
        
    except Exception as e:
        print(f"Error in team_lineup_impact_matrix: {str(e)}")
        raise

@router.get("/{id}/advanced/momentum-resilience-index", response_model=TeamMomentumResilience)
async def team_momentum_resilience_index(id: int, session: AsyncSession = Depends(get_db)):
    """
    Team Momentum & Psychological Resilience Index: Capacidad de mantener/recuperar ventajas
    y respuesta a situaciones adversas.
    """
    try:
        # Obtener partidos del equipo con detalles
        team_matches_query = select(
            Match.id, Match.home_team_id, Match.away_team_id, 
            Match.home_score, Match.away_score, Match.date
        ).where(
            ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
            (Match.home_score.is_not(None))
        ).order_by(Match.date)
        
        team_matches_result = await session.execute(team_matches_query)
        matches = team_matches_result.all()
        
        if not matches:
            return TeamMomentumResilience(
                lead_protection_rate=50.0, comeback_frequency=10.0, streak_resilience=50.0,
                pressure_performance=50.0, fourth_quarter_factor=0.0, psychological_edge=0.0,
                tmpri_score=50.0, close_game_record=50.0
            )

        # Obtener jugadores del equipo
        players_query = select(Player.id).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        player_ids = [pid for (pid,) in players_result.all()]
        
        # Estadísticas por partido del equipo
        match_ids = [m.id for m in matches]
        
        # 1. LEAD PROTECTION RATE
        # Simular usando puntos anotados vs puntos permitidos (proxy para ventajas)
        lead_protection_games = 0
        total_favorable_games = 0
        
        comeback_games = 0
        total_deficit_games = 0
        
        wins = 0
        close_games = 0
        close_wins = 0
        
        for match in matches:
            is_home = match.home_team_id == id
            # CONVERTIR A FLOAT PARA EVITAR ERROR DE TIPOS
            team_score = float(match.home_score if is_home else match.away_score)
            opponent_score = float(match.away_score if is_home else match.home_score)
            
            # Win/Loss
            is_win = team_score > opponent_score
            if is_win:
                wins += 1
            
            # Close games (≤5 puntos diferencia)
            margin = abs(team_score - opponent_score)
            if margin <= 5:
                close_games += 1
                if is_win:
                    close_wins += 1
            
            # Simular lead protection (si anotaron >110 puntos, asumimos que tuvieron ventaja)
            if team_score >= 110:
                total_favorable_games += 1
                if is_win:
                    lead_protection_games += 1
            
            # Simular comeback (si ganaron anotando <100 puntos, posible comeback)
            if team_score < 100:
                total_deficit_games += 1
                if is_win:
                    comeback_games += 1
        
        lead_protection_rate = (lead_protection_games / total_favorable_games * 100) if total_favorable_games > 0 else 50.0
        comeback_frequency = (comeback_games / total_deficit_games * 100) if total_deficit_games > 0 else 10.0
        close_game_record = (close_wins / close_games * 100) if close_games > 0 else 50.0
        
        # 2. STREAK RESILIENCE
        # Analizar rachas de derrotas y recuperación
        consecutive_losses = 0
        max_losing_streak = 0
        recovery_after_losses = 0
        loss_streaks = 0
        
        for i, match in enumerate(matches):
            is_home = match.home_team_id == id
            # CONVERTIR A FLOAT
            team_score = float(match.home_score if is_home else match.away_score)
            opponent_score = float(match.away_score if is_home else match.home_score)
            is_win = team_score > opponent_score
            
            if not is_win:
                consecutive_losses += 1
                max_losing_streak = max(max_losing_streak, consecutive_losses)
            else:
                if consecutive_losses >= 2:  # Recuperación tras 2+ derrotas
                    recovery_after_losses += 1
                    loss_streaks += 1
                consecutive_losses = 0
        
        streak_resilience = (recovery_after_losses / loss_streaks * 100) if loss_streaks > 0 else 75.0
        # Penalizar rachas largas
        streak_resilience = max(20.0, streak_resilience - (max_losing_streak * 5))
        
        # 3. PRESSURE PERFORMANCE
        # Usar win% general como proxy (en una implementación real se usarían partidos vs equipos similares en standings)
        total_games = len(matches)
        win_percentage = (wins / total_games * 100) if total_games > 0 else 50.0
        pressure_performance = win_percentage
        
        # 4. FOURTH QUARTER FACTOR
        # Aproximar usando plus/minus en partidos cerrados
        fourth_quarter_query = select(
            func.avg(MatchStatistic.plusminus).label("avg_pm_close")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids),
            MatchStatistic.minutes_played >= 8  # Jugadores que estuvieron en el final
        )
        
        fourth_quarter_result = await session.execute(fourth_quarter_query)
        avg_pm_close = fourth_quarter_result.scalar() or 0
        # CONVERTIR A FLOAT
        fourth_quarter_factor = float(avg_pm_close)
        
        # 5. PSYCHOLOGICAL EDGE (Home vs Away)
        home_wins = 0
        home_games = 0
        away_wins = 0
        away_games = 0
        
        for match in matches:
            if match.home_team_id == id:
                home_games += 1
                # CONVERTIR A FLOAT
                if float(match.home_score) > float(match.away_score):
                    home_wins += 1
            else:
                away_games += 1
                # CONVERTIR A FLOAT
                if float(match.away_score) > float(match.home_score):
                    away_wins += 1
        
        home_win_pct = (home_wins / home_games) if home_games > 0 else 0.5
        away_win_pct = (away_wins / away_games) if away_games > 0 else 0.5
        
        # Psychological edge = diferencia más allá de la ventaja de local típica (55%)
        expected_home_advantage = 0.55
        actual_home_advantage = home_win_pct
        psychological_edge = (actual_home_advantage - expected_home_advantage) * 100
        
        # 6. TMPRI SCORE FINAL
        resilience_component = ((lead_protection_rate * 0.25 + 
                              comeback_frequency * 0.20 + 
                              streak_resilience * 0.20 + 
                              pressure_performance * 0.15 + 
                              close_game_record * 0.20))
        
        # Ajustes por factores especiales
        fourth_quarter_bonus = max(-5, min(5, fourth_quarter_factor))
        psychological_bonus = max(-5, min(5, psychological_edge))
        
        tmpri_score = resilience_component + fourth_quarter_bonus + psychological_bonus
        tmpri_score = max(20, min(85, tmpri_score))
        
        return TeamMomentumResilience(
            lead_protection_rate=round(lead_protection_rate, 1),
            comeback_frequency=round(comeback_frequency, 1),
            streak_resilience=round(streak_resilience, 1),
            pressure_performance=round(pressure_performance, 1),
            fourth_quarter_factor=round(fourth_quarter_factor, 1),
            psychological_edge=round(psychological_edge, 1),
            tmpri_score=round(tmpri_score, 1),
            close_game_record=round(close_game_record, 1)
        )
        
    except Exception as e:
        print(f"Error in team_momentum_resilience_index: {str(e)}")
        raise

@router.get("/{id}/advanced/tactical-adaptability", response_model=TeamTacticalAdaptability)
async def team_tactical_adaptability_quotient(id: int, session: AsyncSession = Depends(get_db)):
    """
    Team Tactical Adaptability Quotient: Capacidad del equipo para adaptar su estilo 
    según el oponente y diferentes situaciones tácticas.
    """
    try:
        # Obtener jugadores y partidos del equipo
        players_query = select(Player.id).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        player_ids = [pid for (pid,) in players_result.all()]
        
        if not player_ids:
            return TeamTacticalAdaptability(
                pace_adaptability=50.0, size_adjustment=50.0, style_counter_effect=50.0,
                strategic_variety_index=50.0, anti_meta_performance=50.0, coaching_intelligence=50.0,
                ttaq_score=50.0, opponent_fg_influence=0.0
            )

        team_matches_query = select(
            Match.id, Match.home_team_id, Match.away_team_id, 
            Match.home_score, Match.away_score
        ).where(
            ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
            (Match.home_score.is_not(None))
        )
        team_matches_result = await session.execute(team_matches_query)
        matches = team_matches_result.all()
        
        if not matches:
            return TeamTacticalAdaptability(
                pace_adaptability=50.0, size_adjustment=50.0, style_counter_effect=50.0,
                strategic_variety_index=50.0, anti_meta_performance=50.0, coaching_intelligence=50.0,
                ttaq_score=50.0, opponent_fg_influence=0.0
            )

        match_ids = [m.id for m in matches]
        
        # 1. PACE ADAPTABILITY
        # Analizar variación en acciones por partido (proxy para pace)
        pace_query = select(
            MatchStatistic.match_id,
            func.sum(MatchStatistic.field_goals_attempted + 
                    func.coalesce(MatchStatistic.turnovers, 0)).label("team_pace")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids)
        ).group_by(MatchStatistic.match_id)
        
        pace_result = await session.execute(pace_query)
        pace_data = [float(p.team_pace or 0) for p in pace_result.all()]  # CONVERTIR A FLOAT
        
        if len(pace_data) > 1:
            pace_mean = sum(pace_data) / len(pace_data)
            pace_variance = sum((p - pace_mean) ** 2 for p in pace_data) / len(pace_data)
            pace_std = pace_variance ** 0.5
            # Más variación = mayor adaptabilidad
            pace_adaptability = min(100.0, (pace_std / pace_mean * 100.0 * 2.0)) if pace_mean > 0 else 50.0
        else:
            pace_adaptability = 50.0
        
        # 2. SIZE ADJUSTMENT
        # Analizar rendimiento basado en variación en rebotes (proxy para ajuste de tamaño)
        size_query = select(
            MatchStatistic.match_id,
            func.sum(MatchStatistic.rebounds).label("team_rebounds"),
            func.sum(MatchStatistic.blocks).label("team_blocks")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids)
        ).group_by(MatchStatistic.match_id)
        
        size_result = await session.execute(size_query)
        size_data = [(float(r.team_rebounds or 0), float(r.team_blocks or 0)) for r in size_result.all()]  # CONVERTIR A FLOAT
        
        if size_data:
            rebounds_data = [r for r, b in size_data]
            rebounds_mean = sum(rebounds_data) / len(rebounds_data)
            rebounds_variance = sum((r - rebounds_mean) ** 2 for r in rebounds_data) / len(rebounds_data)
            rebounds_std = rebounds_variance ** 0.5
            size_adjustment = min(100.0, (rebounds_std / rebounds_mean * 100.0 * 1.5)) if rebounds_mean > 0 else 50.0
        else:
            size_adjustment = 50.0
        
        # 3. STYLE COUNTER-EFFECT
        # Analizar eficiencia contra diferentes tipos de oponentes
        wins = 0
        total_games = len(matches)
        for match in matches:
            is_home = match.home_team_id == id
            team_score = float(match.home_score if is_home else match.away_score)  # CONVERTIR A FLOAT
            opponent_score = float(match.away_score if is_home else match.home_score)  # CONVERTIR A FLOAT
            if team_score > opponent_score:
                wins += 1
        
        win_percentage = (wins / total_games * 100.0) if total_games > 0 else 50.0
        style_counter_effect = win_percentage
        
        # 4. STRATEGIC VARIETY INDEX
        # Variación en distribución de tiros y asistencias
        variety_query = select(
            MatchStatistic.match_id,
            func.sum(MatchStatistic.three_points_attempted).label("team_3pa"),
            func.sum(MatchStatistic.field_goals_attempted).label("team_fga"),
            func.sum(MatchStatistic.assists).label("team_assists")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids)
        ).group_by(MatchStatistic.match_id)
        
        variety_result = await session.execute(variety_query)
        variety_data = variety_result.all()
        
        if variety_data:
            three_point_rates = []
            assist_rates = []
            
            for data in variety_data:
                team_fga = float(data.team_fga or 0)  # CONVERTIR A FLOAT
                team_3pa = float(data.team_3pa or 0)  # CONVERTIR A FLOAT
                team_assists = float(data.team_assists or 0)  # CONVERTIR A FLOAT
                
                if team_fga > 0:
                    three_point_rate = team_3pa / team_fga
                    three_point_rates.append(three_point_rate)
                
                assist_rates.append(team_assists)
            
            # Calcular variación en estrategias
            if len(three_point_rates) > 1:
                tp_mean = sum(three_point_rates) / len(three_point_rates)
                tp_variance = sum((r - tp_mean) ** 2 for r in three_point_rates) / len(three_point_rates)
                tp_std = tp_variance ** 0.5
                variety_score = min(100.0, (tp_std / tp_mean * 100.0 * 3.0)) if tp_mean > 0 else 30.0
            else:
                variety_score = 30.0
            
            strategic_variety_index = variety_score
        else:
            strategic_variety_index = 50.0
        
        # 5. ANTI-META PERFORMANCE
        # CORREGIR: Usar subconsulta para evitar funciones agregadas anidadas
        team_points_subquery = select(
            MatchStatistic.match_id,
            func.sum(MatchStatistic.points).label("match_points")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids)
        ).group_by(MatchStatistic.match_id).subquery()
        
        avg_points_query = select(
            func.avg(team_points_subquery.c.match_points).label("avg_team_points")
        )
        
        avg_points_result = await session.execute(avg_points_query)
        avg_team_points = avg_points_result.scalar()
        avg_team_points = float(avg_team_points or 100)  # CONVERTIR A FLOAT
        
        # Liga promedio ~110 puntos
        league_avg = 110.0
        anti_meta_performance = min(100.0, max(20.0, (avg_team_points / league_avg * 80.0)))
        
        # 6. COACHING INTELLIGENCE
        # Aproximar usando consistencia en adjustments (variación controlada)
        coaching_factors = [pace_adaptability, size_adjustment, strategic_variety_index]
        coaching_balance = 100.0 - abs(sum(coaching_factors) / 3.0 - 50.0)  # Balance en adaptaciones
        coaching_intelligence = max(30.0, min(80.0, coaching_balance))
        
        # 7. OPPONENT FG INFLUENCE
        # Impacto en porcentaje de tiro rival (aproximación)
        opp_fg_influence = max(-5.0, min(5.0, (50.0 - anti_meta_performance / 10.0)))  # Placeholder
        
        # 8. TTAQ SCORE FINAL
        adaptability_core = (pace_adaptability * 0.20 + 
                           size_adjustment * 0.20 + 
                           style_counter_effect * 0.20 + 
                           strategic_variety_index * 0.15 + 
                           anti_meta_performance * 0.15 + 
                           coaching_intelligence * 0.10)
        
        ttaq_score = adaptability_core
        ttaq_score = max(25.0, min(85.0, ttaq_score))
        
        return TeamTacticalAdaptability(
            pace_adaptability=round(pace_adaptability, 1),
            size_adjustment=round(size_adjustment, 1),
            style_counter_effect=round(style_counter_effect, 1),
            strategic_variety_index=round(strategic_variety_index, 1),
            anti_meta_performance=round(anti_meta_performance, 1),
            coaching_intelligence=round(coaching_intelligence, 1),
            ttaq_score=round(ttaq_score, 1),
            opponent_fg_influence=round(opp_fg_influence, 1)
        )
        
    except Exception as e:
        print(f"Error in team_tactical_adaptability_quotient: {str(e)}")
        raise

@router.get("/{id}/advanced/clutch-dna-profile", response_model=TeamClutchDNAProfile)
async def team_clutch_dna_profile(id: int, session: AsyncSession = Depends(get_db)):
    """
    Team Clutch DNA Profile: Análisis granular del ADN clutch en múltiples situaciones de presión.
    Va más allá de últimos 5 minutos.
    """
    try:
        # Obtener jugadores y partidos del equipo
        players_query = select(Player.id).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        player_ids = [pid for (pid,) in players_result.all()]
        
        if not player_ids:
            return TeamClutchDNAProfile(
                multi_scenario_clutch=50.0, pressure_shooting=0.0, decision_making_pressure=1.0,
                star_player_factor=50.0, collective_clutch_iq=50.0, pressure_defense=100.0,
                clutch_dna_score=50.0, overtime_performance=50.0
            )

        team_matches_query = select(
            Match.id, Match.home_team_id, Match.away_team_id, 
            Match.home_score, Match.away_score
        ).where(
            ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
            (Match.home_score.is_not(None))
        )
        team_matches_result = await session.execute(team_matches_query)
        matches = team_matches_result.all()
        
        if not matches:
            return TeamClutchDNAProfile(
                multi_scenario_clutch=50.0, pressure_shooting=0.0, decision_making_pressure=1.0,
                star_player_factor=50.0, collective_clutch_iq=50.0, pressure_defense=100.0,
                clutch_dna_score=50.0, overtime_performance=50.0
            )

        match_ids = [m.id for m in matches]
        
        # 1. MULTI-SCENARIO CLUTCH
        # 1. MULTI-SCENARIO CLUTCH - CORREGIDO
        close_games = 0  # ≤5 puntos
        very_close_games = 0  # ≤3 puntos
        overtime_games = 0
        late_lead_games = 0

        close_wins = 0
        very_close_wins = 0
        overtime_wins = 0
        late_lead_wins = 0

        for match in matches:
            is_home = match.home_team_id == id
            team_score = float(match.home_score if is_home else match.away_score)
            opponent_score = float(match.away_score if is_home else match.home_score)
            margin = abs(team_score - opponent_score)
            is_win = team_score > opponent_score
            
            # Escenarios clutch
            if margin <= 5:
                close_games += 1
                if is_win:
                    close_wins += 1
                    
                if margin <= 3:
                    very_close_games += 1
                    if is_win:
                        very_close_wins += 1
            
            # Partidos tipo overtime: diferencia ≤ 2 puntos (más realista)
            if margin <= 2:
                overtime_games += 1
                if is_win:
                    overtime_wins += 1
            
            # Late lead situations: scoring >110 as proxy
            if team_score >= 110:
                late_lead_games += 1
                if is_win:
                    late_lead_wins += 1

        # Calcular win% promedio en situaciones clutch
        clutch_scenarios = []
        if close_games > 0:
            clutch_scenarios.append(close_wins / close_games)
        if very_close_games > 0:
            clutch_scenarios.append(very_close_wins / very_close_games)
        if overtime_games > 0:
            clutch_scenarios.append(overtime_wins / overtime_games)
        if late_lead_games > 0:
            clutch_scenarios.append(late_lead_wins / late_lead_games)

        multi_scenario_clutch = (sum(clutch_scenarios) / len(clutch_scenarios) * 100.0) if clutch_scenarios else 50.0

        
        # 2. PRESSURE SHOOTING - CORREGIDO
        pressure_shooting_query = select(
            func.sum(MatchStatistic.field_goals_made).label("total_fgm"),
            func.sum(MatchStatistic.field_goals_attempted).label("total_fga")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids),
            MatchStatistic.field_goals_attempted > 5
        )
        
        pressure_result = await session.execute(pressure_shooting_query)
        total_fgm, total_fga = pressure_result.one()
        
        total_fgm = float(total_fgm or 0)
        total_fga = float(total_fga or 1)
        
        team_fg_pct = total_fgm / total_fga if total_fga > 0 else 0.45
        pressure_shooting = (team_fg_pct - 0.45) * 100.0  # Diferencia vs league average
        
        # 3. DECISION MAKING UNDER PRESSURE - CORREGIDO
        decision_query = select(
            func.sum(MatchStatistic.turnovers).label("total_to"),
            func.sum(MatchStatistic.assists).label("total_assists")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids),
            MatchStatistic.minutes_played >= 10
        )
        
        decision_result = await session.execute(decision_query)
        total_to, total_assists = decision_result.one()
        
        total_to = float(total_to or 1)
        total_assists = float(total_assists or 1)
        
        # Assist/TO ratio
        assist_to_ratio = total_assists / total_to if total_to > 0 else 1.0
        decision_making_pressure = min(3.0, max(0.5, assist_to_ratio))
        
        # 4. STAR PLAYER FACTOR - CORREGIDO COMPLETAMENTE
        star_query = select(
            MatchStatistic.player_id,
            func.avg(MatchStatistic.points).label("avg_points"),
            func.avg(MatchStatistic.minutes_played).label("avg_minutes"),
            func.count(MatchStatistic.id).label("games_played")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids),
            MatchStatistic.minutes_played >= 15  # Jugadores significativos
        ).group_by(MatchStatistic.player_id).order_by(func.avg(MatchStatistic.points).desc()).limit(5)

        star_result = await session.execute(star_query)
        star_players = star_result.all()

        if len(star_players) >= 1:
            # Calcular dependencia real basada en distribución de puntos
            player_points = [float(p.avg_points or 0) for p in star_players]
            total_team_points = sum(player_points)
            
            if total_team_points > 0:
                # Calcular concentración del top scorer
                top_scorer_pct = player_points[0] / total_team_points
                
                # Calcular distribución entre top 3
                top_3_points = player_points[:3] if len(player_points) >= 3 else player_points
                top_3_total = sum(top_3_points)
                top_3_concentration = top_3_total / total_team_points if total_team_points > 0 else 0
                
                # Star Player Factor: MENOR concentración = MAYOR factor (mejor balance)
                # Penalizar equipos que dependen mucho de 1 jugador
                if top_scorer_pct > 0.45:  # >45% de puntos en 1 jugador = muy dependiente
                    star_player_factor = 25.0
                elif top_scorer_pct > 0.35:  # >35% = dependiente
                    star_player_factor = 40.0
                elif top_scorer_pct > 0.28:  # >28% = normal NBA
                    star_player_factor = 60.0
                elif top_scorer_pct > 0.22:  # >22% = buen balance
                    star_player_factor = 75.0
                else:  # <=22% = balance perfecto
                    star_player_factor = 85.0
                    
                # Ajuste adicional por profundidad (top 3 vs resto)
                if top_3_concentration < 0.65:  # Top 3 con <65% = excelente profundidad
                    star_player_factor = min(85.0, star_player_factor + 10.0)
                elif top_3_concentration > 0.80:  # Top 3 con >80% = poca profundidad
                    star_player_factor = max(20.0, star_player_factor - 10.0)
            else:
                star_player_factor = 50.0
        else:
            star_player_factor = 30.0  # Sin jugadores significativos
        
        # Reemplaza la sección "5. COLLECTIVE CLUTCH IQ" con esto:

        # 5. COLLECTIVE CLUTCH IQ - CORREGIDO COMPLETAMENTE
        if len(star_players) >= 2:
            # Obtener estadísticas más detalladas de los jugadores clave
            collective_query = select(
                MatchStatistic.player_id,
                func.avg(MatchStatistic.points).label("avg_points"),
                func.avg(MatchStatistic.assists).label("avg_assists"),
                func.avg(MatchStatistic.turnovers).label("avg_turnovers"),
                func.avg(MatchStatistic.minutes_played).label("avg_minutes")
            ).where(
                MatchStatistic.player_id.in_([p.player_id for p in star_players[:5]]),
                MatchStatistic.match_id.in_(match_ids),
                MatchStatistic.minutes_played >= 10
            ).group_by(MatchStatistic.player_id)
            
            collective_result = await session.execute(collective_query)
            collective_data = collective_result.all()
            
            if len(collective_data) >= 2:
                # Factor 1: Balance en puntos (ya calculado arriba)
                player_points = [float(p.avg_points or 0) for p in collective_data]
                total_points = sum(player_points)
                
                # Calcular Gini coefficient para distribución de puntos
                if total_points > 0 and len(player_points) > 1:
                    sorted_points = sorted(player_points)
                    n = len(sorted_points)
                    cumsum = 0
                    for i, points in enumerate(sorted_points):
                        cumsum += (i + 1) * points
                    gini = (2 * cumsum) / (n * total_points) - (n + 1) / n
                    
                    # Convertir Gini a score (0 = perfecta igualdad, 1 = máxima desigualdad)
                    points_balance_score = (1 - gini) * 100
                else:
                    points_balance_score = 50.0
                
                # Factor 2: Balance en asistencias (chemistry)
                assists_data = [float(p.avg_assists or 0) for p in collective_data]
                total_assists = sum(assists_data)
                
                if total_assists > 0:
                    # Mejor química = asistencias más distribuidas
                    max_assists = max(assists_data)
                    assists_concentration = max_assists / total_assists
                    
                    if assists_concentration < 0.35:  # Muy distribuido
                        assists_balance_score = 85.0
                    elif assists_concentration < 0.45:  # Bien distribuido
                        assists_balance_score = 70.0
                    elif assists_concentration < 0.55:  # Regular
                        assists_balance_score = 55.0
                    else:  # Muy concentrado
                        assists_balance_score = 35.0
                else:
                    assists_balance_score = 50.0
                
                # Factor 3: Cuidado del balón (menos turnovers = mejor IQ)
                turnovers_data = [float(p.avg_turnovers or 0) for p in collective_data]
                points_data = [float(p.avg_points or 0) for p in collective_data]
                
                # Calcular TO rate promedio del grupo clave
                total_possessions = sum(turnovers_data) + sum(points_data) * 0.44  # Aproximación
                team_to_rate = sum(turnovers_data) / total_possessions if total_possessions > 0 else 0.15
                
                # NBA promedio ~14% TO rate
                if team_to_rate < 0.12:  # Excelente cuidado
                    ball_security_score = 85.0
                elif team_to_rate < 0.14:  # Bueno
                    ball_security_score = 70.0
                elif team_to_rate < 0.16:  # Regular
                    ball_security_score = 55.0
                else:  # Malo
                    ball_security_score = 35.0
                
                # Factor 4: Profundidad (minutos distribuidos)
                minutes_data = [float(p.avg_minutes or 0) for p in collective_data]
                if minutes_data:
                    max_minutes = max(minutes_data)
                    min_minutes = min(minutes_data)
                    minutes_range = max_minutes - min_minutes
                    
                    # Menor rango = mejor distribución de carga
                    if minutes_range < 8:  # Muy equilibrado
                        depth_score = 80.0
                    elif minutes_range < 12:  # Equilibrado
                        depth_score = 65.0
                    elif minutes_range < 16:  # Regular
                        depth_score = 50.0
                    else:  # Desbalanceado
                        depth_score = 35.0
                else:
                    depth_score = 50.0
                
                # Combinación final con pesos
                collective_clutch_iq = (
                    points_balance_score * 0.35 +    # 35% - Balance de puntos
                    assists_balance_score * 0.25 +   # 25% - Chemistry/distribución
                    ball_security_score * 0.25 +     # 25% - Cuidado del balón
                    depth_score * 0.15               # 15% - Profundidad
                )
                
                # Asegurar rango realista
                collective_clutch_iq = max(25.0, min(85.0, collective_clutch_iq))
            else:
                collective_clutch_iq = 40.0
        else:
            collective_clutch_iq = 35.0  # Pocos jugadores clave
        
        # 6. PRESSURE DEFENSE - CORREGIDO
        # 6. PRESSURE DEFENSE - CORREGIDO COMPLETAMENTE
        total_points_allowed = 0.0
        defensive_games = 0

        for match in matches:
            is_home = match.home_team_id == id
            opponent_score = float(match.away_score if is_home else match.home_score)
            total_points_allowed += opponent_score
            defensive_games += 1

        avg_points_allowed = total_points_allowed / defensive_games if defensive_games > 0 else 110.0

        # La NBA moderna tiene rangos de 108-118 típicamente
        if avg_points_allowed <= 108:  # Defensa élite
            pressure_defense = 90.0
        elif avg_points_allowed <= 111:  # Defensa muy buena  
            pressure_defense = 75.0
        elif avg_points_allowed <= 114:  # Defensa buena
            pressure_defense = 65.0
        elif avg_points_allowed <= 117:  # Defensa promedio
            pressure_defense = 50.0
        elif avg_points_allowed <= 120:  # Defensa mala
            pressure_defense = 35.0
        elif avg_points_allowed <= 123:  # Defensa muy mala
            pressure_defense = 25.0
        else:  # Defensa terrible
            pressure_defense = 15.0

        # Garantizar rango más alto
        pressure_defense = max(20.0, min(90.0, pressure_defense))

        # 7. OVERTIME PERFORMANCE - CORREGIDO COMPLETAMENTE
        if overtime_games > 0:
            overtime_win_rate = (overtime_wins / overtime_games)
            overtime_performance = overtime_win_rate * 100.0
            # Asegurar rango realista (ningún equipo tiene 0% o 100% perfecto)
            overtime_performance = max(15.0, min(85.0, overtime_performance))
        else:
            # Sin partidos clutch = rendimiento neutro-bajo
            overtime_performance = 40.0
        
        # 8. CLUTCH DNA SCORE FINAL - COMPLETAMENTE REDISEÑADO Y CORREGIDO

        # COMPONENTE 1: Core Clutch Performance (30% peso)
        core_clutch_raw = multi_scenario_clutch  # Ya está 0-100

        # COMPONENTE 2: Shooting Under Pressure (25% peso) - CORREGIDO
        # pressure_shooting viene como diferencia (-20 a +20), normalizar correctamente
        shooting_clutch = max(20.0, min(80.0, 50.0 + (pressure_shooting * 1.5)))

        # COMPONENTE 3: Decision Making (20% peso) - CORREGIDO
        # decision_making_pressure viene como ratio (0.5-3.0), normalizar a 0-100
        decision_clutch = max(20.0, min(80.0, (decision_making_pressure / 3.0) * 100))

        # COMPONENTE 4: Star Factor (15% peso) - Ya viene 0-100
        star_clutch = star_player_factor

        # COMPONENTE 5: Collective IQ (10% peso) - Ya viene 0-100  
        collective_clutch = collective_clutch_iq

        # CALCULAR SCORE BASE CON PESOS CORREGIDOS
        clutch_score_base = (
            core_clutch_raw * 0.30 +        # Situaciones clutch
            shooting_clutch * 0.25 +        # Shooting bajo presión
            decision_clutch * 0.20 +        # Toma de decisiones
            star_clutch * 0.15 +            # Factor estrella
            collective_clutch * 0.10        # IQ colectivo
        )

        # BONIFICACIONES/PENALIZACIONES MÁS SUAVES
        # Defense bonus/penalty - MÁS SUAVE
        defense_modifier = (pressure_defense - 50) / 50 * 8  # ±8 puntos (antes ±15)

        # Overtime bonus/penalty - MÁS SUAVE
        overtime_modifier = (overtime_performance - 50) / 50 * 5  # ±5 puntos (antes ±10)

        # ELIMINAR penalty por ser promedio (era demasiado duro)
        # consistency_penalty = 0  # ELIMINADO

        # SCORE FINAL CON RANGO MÁS GENEROSO
        clutch_dna_score = clutch_score_base + defense_modifier + overtime_modifier

        # RANGO FINAL: 15-85 (más generoso que 5-95)
        clutch_dna_score = max(15.0, min(85.0, clutch_dna_score))

        # CURVA MÁS SUAVE (eliminar amplificación agresiva)
        # Los equipos buenos suben un poco, los malos bajan un poco
        if clutch_dna_score >= 70:
            clutch_dna_score = min(85, clutch_dna_score * 1.05)  # Boost suave
        elif clutch_dna_score <= 35:
            clutch_dna_score = max(15, clutch_dna_score * 0.95)  # Penalty suave

        return TeamClutchDNAProfile(
            multi_scenario_clutch=round(multi_scenario_clutch, 1),
            pressure_shooting=round(pressure_shooting, 1),
            decision_making_pressure=round(decision_making_pressure, 2),
            star_player_factor=round(star_player_factor, 1),
            collective_clutch_iq=round(collective_clutch_iq, 1),
            pressure_defense=round(pressure_defense, 1),
            clutch_dna_score=round(clutch_dna_score, 1),
            overtime_performance=round(overtime_performance, 1)
        )
        
    except Exception as e:
        print(f"Error in team_clutch_dna_profile: {str(e)}")
        raise

@router.get("/{id}/advanced/predictive-performance", response_model=TeamPredictivePerformance)
async def team_predictive_performance_algorithm(id: int, session: AsyncSession = Depends(get_db)):
    """
    Team Predictive Performance Algorithm: Proyección de rendimiento futuro basada en
    múltiples factores como fatiga, momentum, matchups y regresión a la media.
    """
    try:
        # Obtener jugadores y partidos del equipo
        players_query = select(Player.id).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        player_ids = [pid for (pid,) in players_result.all()]
        
        if not player_ids:
            return TeamPredictivePerformance(
                regression_to_mean=50.0, fatigue_accumulation=50.0, injury_risk_projection=25.0,
                momentum_decay_rate=10.0, matchup_advantage_forecast=50.0, peak_performance_window=10,
                tppa_projected_winrate=50.0, schedule_difficulty_next=50.0
            )

        team_matches_query = select(
            Match.id, Match.date, Match.home_team_id, Match.away_team_id, 
            Match.home_score, Match.away_score
        ).where(
            ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
            (Match.home_score.is_not(None))
        ).order_by(Match.date.desc())
        
        team_matches_result = await session.execute(team_matches_query)
        matches = team_matches_result.all()
        
        if not matches:
            return TeamPredictivePerformance(
                regression_to_mean=50.0, fatigue_accumulation=50.0, injury_risk_projection=25.0,
                momentum_decay_rate=10.0, matchup_advantage_forecast=50.0, peak_performance_window=10,
                tppa_projected_winrate=50.0, schedule_difficulty_next=50.0
            )

        match_ids = [m.id for m in matches]
        
        # 1. REGRESSION TO MEAN FACTOR
        # Analizar sostenibilidad del rendimiento actual
        recent_matches = matches[:10]  # Últimos 10 partidos
        recent_wins = 0
        
        for match in recent_matches:
            is_home = match.home_team_id == id
            team_score = match.home_score if is_home else match.away_score
            opponent_score = match.away_score if is_home else match.home_score
            if team_score > opponent_score:
                recent_wins += 1
        
        recent_win_pct = recent_wins / len(recent_matches) if recent_matches else 0.5
        
        # Calcular win% histórico
        total_wins = 0
        for match in matches:
            is_home = match.home_team_id == id
            team_score = match.home_score if is_home else match.away_score
            opponent_score = match.away_score if is_home else match.home_score
            if team_score > opponent_score:
                total_wins += 1
        
        historical_win_pct = total_wins / len(matches) if matches else 0.5
        
        # Regression factor: qué tan lejos está del promedio histórico
        regression_distance = abs(recent_win_pct - historical_win_pct) * 100
        regression_to_mean = min(100, regression_distance)  # Mayor distancia = más regresión esperada
        
        # 2. FATIGUE ACCUMULATION INDEX
        # Analizar carga de trabajo y schedule density
        minutes_query = select(
            MatchStatistic.player_id,
            func.avg(MatchStatistic.minutes_played).label("avg_minutes"),
            func.count(MatchStatistic.id).label("games_played")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids)
        ).group_by(MatchStatistic.player_id)
        
        minutes_result = await session.execute(minutes_query)
        player_minutes = minutes_result.all()
        
        # Calcular fatigue basado en minutos promedio y frequency
        fatigue_factors = []
        for player_data in player_minutes:
            if player_data.games_played > 10:
                minute_load = player_data.avg_minutes / 36  # Normalizado a 36 min base
                game_frequency = player_data.games_played / len(matches) if matches else 1
                player_fatigue = minute_load * game_frequency
                fatigue_factors.append(player_fatigue)
        
        team_fatigue = sum(fatigue_factors) / len(fatigue_factors) if fatigue_factors else 0.8
        fatigue_accumulation = min(100, team_fatigue * 80)
        
        # 3. INJURY RISK PROJECTION
        # Basado en carga de trabajo de jugadores clave
        key_players = sorted(player_minutes, key=lambda x: x.avg_minutes, reverse=True)[:5]
        
        injury_risk_factors = []
        for player in key_players:
            if player.avg_minutes > 32:  # High minute load
                risk_factor = (player.avg_minutes - 32) / 16  # Risk increases exponentially
                injury_risk_factors.append(risk_factor)
        
        avg_injury_risk = sum(injury_risk_factors) / len(injury_risk_factors) if injury_risk_factors else 0.25
        injury_risk_projection = min(80, avg_injury_risk * 100)
        
        # 4. MOMENTUM DECAY RATE
        # Analizar cómo se desvanece el momentum actual
        if len(matches) >= 5:
            # Últimos 5 vs anteriores 5
            last_5_wins = 0
            prev_5_wins = 0
            
            for i, match in enumerate(matches[:10]):
                is_home = match.home_team_id == id
                team_score = match.home_score if is_home else match.away_score
                opponent_score = match.away_score if is_home else match.home_score
                is_win = team_score > opponent_score
                
                if i < 5:
                    if is_win:
                        last_5_wins += 1
                elif i < 10:
                    if is_win:
                        prev_5_wins += 1
            
            momentum_change = last_5_wins - prev_5_wins
            momentum_decay_rate = max(0, -momentum_change * 10)  # Negative change = decay
        else:
            momentum_decay_rate = 10.0
        
        # 5. MATCHUP ADVANTAGE FORECAST
        # Proyección vs tipos de oponentes (simplificado)
        avg_margin = 0
        margin_count = 0
        
        for match in matches:
            is_home = match.home_team_id == id
            team_score = match.home_score if is_home else match.away_score
            opponent_score = match.away_score if is_home else match.home_score
            margin = team_score - opponent_score
            avg_margin += margin
            margin_count += 1
        
        avg_point_differential = avg_margin / margin_count if margin_count > 0 else 0
        
        # Convert to forecast percentage
        matchup_advantage_forecast = max(20, min(80, 50 + avg_point_differential))
        
        # 6. PEAK PERFORMANCE WINDOW
        # Estimar cuándo estarán en su mejor momento
        # Basado en fatigue y momentum trends
        if fatigue_accumulation < 60 and recent_win_pct > historical_win_pct:
            peak_performance_window = 15  # Soon
        elif fatigue_accumulation > 80:
            peak_performance_window = 25  # Need rest first
        else:
            peak_performance_window = 20  # Normal timeline
        
        # 7. SCHEDULE DIFFICULTY NEXT
        # Simular dificultad de próximos partidos
        # En implementación real se analizarían oponentes específicos
        schedule_difficulty_next = 55.0  # Placeholder ligeramente por encima del promedio
        
        # 8. TPPA PROJECTED WIN RATE
        # Combinar todos los factores para proyección final
        base_projection = historical_win_pct * 100
        
        # Ajustes
        regression_adjustment = -regression_to_mean * 0.1  # Regresión hacia la media
        fatigue_adjustment = -fatigue_accumulation * 0.05  # Fatiga reduce rendimiento
        injury_adjustment = -injury_risk_projection * 0.03  # Riesgo de lesiones
        momentum_adjustment = -momentum_decay_rate * 0.1  # Momentum decay
        matchup_adjustment = (matchup_advantage_forecast - 50) * 0.1  # Ventaja/desventaja matchups
        
        projected_winrate = base_projection + regression_adjustment + fatigue_adjustment + injury_adjustment + momentum_adjustment + matchup_adjustment
        projected_winrate = max(15, min(85, projected_winrate))
        
        return TeamPredictivePerformance(
            regression_to_mean=round(regression_to_mean, 1),
            fatigue_accumulation=round(fatigue_accumulation, 1),
            injury_risk_projection=round(injury_risk_projection, 1),
            momentum_decay_rate=round(momentum_decay_rate, 1),
            matchup_advantage_forecast=round(matchup_advantage_forecast, 1),
            peak_performance_window=peak_performance_window,
            tppa_projected_winrate=round(projected_winrate, 1),
            schedule_difficulty_next=round(schedule_difficulty_next, 1)
        )
        
    except Exception as e:
        print(f"Error in team_predictive_performance_algorithm: {str(e)}")
        raise