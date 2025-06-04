from operator import itemgetter
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select
from typing import List, Dict, Any, Optional as OptionalType
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import literal, case
from datetime import datetime, date

from ..deps import get_db
from ..models import TeamInfo, Team, Match, MatchStatistic, Player, TeamRecord, TeamStats, TeamPointsProgression, TeamPointsVsOpponent, TeamPointsTypeDistribution, TeamRadarProfile, TeamShootingVolume, PlayerContribution, TeamAdvancedEfficiency, TeamLineupImpactMatrix, TeamMomentumResilience, TeamTacticalAdaptability, TeamClutchDNAProfile, TeamPredictivePerformance

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
    """
    Team Advanced Efficiency Rating: Métrica híbrida que combina eficiencia ofensiva/defensiva 
    con factores contextuales como pace, strength of schedule y clutch performance.
    """
    try:
        # Obtener jugadores del equipo
        players_query = select(Player.id).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        player_ids = [pid for (pid,) in players_result.all()]
        
        if not player_ids:
            return TeamAdvancedEfficiency(
                offensive_efficiency=100.0, defensive_efficiency=100.0, pace_factor=1.0,
                strength_of_schedule=50.0, clutch_factor=1.0, consistency_index=0.5, taer_score=50.0
            )

        # Obtener partidos del equipo
        team_matches_query = select(Match.id, Match.home_team_id, Match.away_team_id, 
                                   Match.home_score, Match.away_score, Match.date).where(
            ((Match.home_team_id == id) | (Match.away_team_id == id)) & 
            (Match.home_score.is_not(None))
        )
        team_matches_result = await session.execute(team_matches_query)
        matches = team_matches_result.all()
        
        if not matches:
            return TeamAdvancedEfficiency(
                offensive_efficiency=100.0, defensive_efficiency=100.0, pace_factor=1.0,
                strength_of_schedule=50.0, clutch_factor=1.0, consistency_index=0.5, taer_score=50.0
            )

        match_ids = [m.id for m in matches]
        
        # 1. OFFENSIVE/DEFENSIVE EFFICIENCY
        # Calcular posesiones estimadas por partido (usando FGA + 0.44*FTA + TO como proxy)
        possessions_query = select(
            MatchStatistic.match_id,
            func.sum(MatchStatistic.field_goals_attempted + 
                    0.44 * func.coalesce(MatchStatistic.free_throws_attempted, 0) + 
                    func.coalesce(MatchStatistic.turnovers, 0)).label("possessions"),
            func.sum(MatchStatistic.points).label("points_scored")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids)
        ).group_by(MatchStatistic.match_id)
        
        possessions_result = await session.execute(possessions_query)
        possessions_data = possessions_result.all()
        
        # Calcular puntos permitidos por partido
        points_allowed = []
        for match in matches:
            if match.home_team_id == id:
                points_allowed.append(float(match.away_score))
            else:
                points_allowed.append(float(match.home_score))
        
        # Promedios de eficiencia - CONVERTIR A FLOAT
        avg_possessions = float(sum(float(p.possessions or 0) for p in possessions_data) / len(possessions_data)) if possessions_data else 100.0
        avg_points_scored = float(sum(float(p.points_scored or 0) for p in possessions_data) / len(possessions_data)) if possessions_data else 100.0
        avg_points_allowed = float(sum(points_allowed) / len(points_allowed)) if points_allowed else 100.0
        
        offensive_efficiency = (avg_points_scored / avg_possessions) * 100.0 if avg_possessions > 0 else 100.0
        defensive_efficiency = (avg_points_allowed / avg_possessions) * 100.0 if avg_possessions > 0 else 100.0
        
        # 2. PACE FACTOR (estimado vs liga)
        league_avg_pace = 100.0  # Aproximación
        team_pace = avg_possessions
        pace_factor = team_pace / league_avg_pace
        
        # 3. STRENGTH OF SCHEDULE
        # Calcular win% de oponentes
        opponent_teams = []
        for match in matches:
            opponent_id = match.away_team_id if match.home_team_id == id else match.home_team_id
            opponent_teams.append(opponent_id)
        
        # Win% promedio de oponentes (simplificado)
        opponent_records_query = select(
            func.count(Match.id).filter(
                ((Match.home_team_id.in_(opponent_teams)) & (Match.home_score > Match.away_score)) |
                ((Match.away_team_id.in_(opponent_teams)) & (Match.away_score > Match.home_score))
            ).label("wins"),
            func.count(Match.id).filter(Match.home_score.is_not(None)).label("total_games")
        ).where(
            (Match.home_team_id.in_(opponent_teams)) | (Match.away_team_id.in_(opponent_teams))
        )
        
        opponent_result = await session.execute(opponent_records_query)
        opp_wins, opp_total = opponent_result.one()
        strength_of_schedule = float(opp_wins) / float(opp_total) * 100.0 if opp_total > 0 else 50.0
        
        # 4. CLUTCH FACTOR (últimos 5 minutos - aproximado usando plus/minus)
        clutch_query = select(
            func.avg(MatchStatistic.plusminus).label("avg_clutch_pm")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids),
            MatchStatistic.minutes_played >= 5  # Proxy para jugadores en momentos clutch
        )
        
        clutch_result = await session.execute(clutch_query)
        avg_clutch_pm = clutch_result.scalar()
        avg_clutch_pm = float(avg_clutch_pm) if avg_clutch_pm is not None else 0.0
        clutch_factor = 1.0 + (avg_clutch_pm / 10.0)  # Normalizar
        clutch_factor = max(0.5, min(1.5, clutch_factor))
        
        # 5. CONSISTENCY INDEX (varianza del net rating)
        net_ratings = []
        for i, match in enumerate(matches):
            if i < len(possessions_data):
                points_scored = float(possessions_data[i].points_scored or 0)
                points_allowed_game = points_allowed[i]
                net_rating = points_scored - points_allowed_game
                net_ratings.append(net_rating)
        
        if len(net_ratings) > 1:
            mean_net = sum(net_ratings) / len(net_ratings)
            variance = sum((x - mean_net) ** 2 for x in net_ratings) / len(net_ratings)
            std_dev = variance ** 0.5
            consistency_index = max(0.1, 1.0 - (std_dev / 20.0))  # Normalizar
        else:
            consistency_index = 0.5
        
        # 6. TAER SCORE FINAL
        # Combinar todos los factores en una métrica 0-100
        efficiency_component = ((120.0 - defensive_efficiency) / 120.0 * 30.0) + ((offensive_efficiency - 80.0) / 40.0 * 30.0)
        pace_component = abs(1.0 - pace_factor) * 10.0  # Penalizar extremos
        schedule_component = strength_of_schedule / 100.0 * 15.0
        clutch_component = (clutch_factor - 0.5) * 20.0
        consistency_component = consistency_index * 15.0
        
        taer_score = efficiency_component + (15.0 - pace_component) + schedule_component + clutch_component + consistency_component
        taer_score = max(10.0, min(90.0, taer_score))
        
        return TeamAdvancedEfficiency(
            offensive_efficiency=round(offensive_efficiency, 1),
            defensive_efficiency=round(defensive_efficiency, 1),
            pace_factor=round(pace_factor, 2),
            strength_of_schedule=round(strength_of_schedule, 1),
            clutch_factor=round(clutch_factor, 2),
            consistency_index=round(consistency_index, 2),
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
            team_score = match.home_score if is_home else match.away_score
            opponent_score = match.away_score if is_home else match.home_score
            
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
            team_score = match.home_score if is_home else match.away_score
            opponent_score = match.away_score if is_home else match.home_score
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
        fourth_quarter_factor = avg_pm_close
        
        # 5. PSYCHOLOGICAL EDGE (Home vs Away)
        home_wins = 0
        home_games = 0
        away_wins = 0
        away_games = 0
        
        for match in matches:
            if match.home_team_id == id:
                home_games += 1
                if match.home_score > match.away_score:
                    home_wins += 1
            else:
                away_games += 1
                if match.away_score > match.home_score:
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
        # Analizar rendimiento en diferentes tipos de partidos clutch
        close_games = 0  # ≤5 puntos
        very_close_games = 0  # ≤3 puntos
        overtime_games = 0
        late_lead_games = 0  # Ganando en el último momento
        
        close_wins = 0
        very_close_wins = 0
        overtime_wins = 0
        late_lead_wins = 0
        
        for match in matches:
            is_home = match.home_team_id == id
            team_score = float(match.home_score if is_home else match.away_score)  # CONVERTIR A FLOAT
            opponent_score = float(match.away_score if is_home else match.home_score)  # CONVERTIR A FLOAT
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
            
            # Simular overtime (partidos muy reñidos como proxy)
            if margin <= 1:
                overtime_games += 1
                if is_win:
                    overtime_wins += 1
            
            # Late lead situations (scoring >110 points as proxy for leading)
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
        
        # 2. PRESSURE SHOOTING
        # Analizar FG% en situaciones de presión (partidos cerrados)
        pressure_shooting_query = select(
            func.sum(MatchStatistic.field_goals_made).label("total_fgm"),
            func.sum(MatchStatistic.field_goals_attempted).label("total_fga")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids),
            MatchStatistic.field_goals_attempted > 5  # Suficientes intentos
        )
        
        pressure_result = await session.execute(pressure_shooting_query)
        total_fgm, total_fga = pressure_result.one()
        
        # CONVERTIR A FLOAT Y CALCULAR PORCENTAJE
        total_fgm = float(total_fgm or 0)
        total_fga = float(total_fga or 1)
        
        team_fg_pct = total_fgm / total_fga if total_fga > 0 else 0.45
        pressure_shooting = (team_fg_pct - 0.45) * 100.0  # Diferencia vs league average
        
        # 3. DECISION MAKING UNDER PRESSURE
        # TO rate y A/TO ratio
        decision_query = select(
            func.sum(MatchStatistic.turnovers).label("total_to"),
            func.sum(MatchStatistic.assists).label("total_assists"),
            func.sum(MatchStatistic.minutes_played).label("total_minutes")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids),
            MatchStatistic.minutes_played >= 10  # Jugadores significativos
        )
        
        decision_result = await session.execute(decision_query)
        total_to, total_assists, total_minutes = decision_result.one()
        
        # CONVERTIR A FLOAT
        total_to = float(total_to or 1)
        total_assists = float(total_assists or 1)
        total_minutes = float(total_minutes or 1)
        
        # Assist/TO ratio
        assist_to_ratio = total_assists / total_to if total_to > 0 else 1.0
        decision_making_pressure = min(3.0, max(0.5, assist_to_ratio))
        
        # 4. STAR PLAYER FACTOR
        # Dependencia de jugadores estrella en clutch
        star_query = select(
            MatchStatistic.player_id,
            func.avg(MatchStatistic.points).label("avg_points"),
            func.avg(MatchStatistic.plusminus).label("avg_pm")
        ).where(
            MatchStatistic.player_id.in_(player_ids),
            MatchStatistic.match_id.in_(match_ids),
            MatchStatistic.minutes_played >= 20  # Jugadores principales
        ).group_by(MatchStatistic.player_id).order_by(func.avg(MatchStatistic.points).desc()).limit(3)
        
        star_result = await session.execute(star_query)
        star_players = star_result.all()
        
        if star_players:
            top_star_points = float(star_players[0].avg_points or 20)  # CONVERTIR A FLOAT
            
            # CORREGIR: Calcular puntos promedio del equipo por partido usando dos queries separadas
            # Primera query: obtener puntos totales por partido
            team_points_per_match_query = select(
                MatchStatistic.match_id,
                func.sum(MatchStatistic.points).label("match_points")
            ).where(
                MatchStatistic.player_id.in_(player_ids),
                MatchStatistic.match_id.in_(match_ids)
            ).group_by(MatchStatistic.match_id)
            
            team_points_per_match_result = await session.execute(team_points_per_match_query)
            match_points_data = team_points_per_match_result.all()
            
            # Segunda query: calcular promedio manualmente
            if match_points_data:
                total_points_all_matches = sum(float(mp.match_points or 0) for mp in match_points_data)
                team_avg_points = total_points_all_matches / len(match_points_data)
            else:
                team_avg_points = 100.0
            
            star_dependency = (top_star_points / team_avg_points * 100.0) if team_avg_points > 0 else 25.0
            star_player_factor = max(20.0, min(80.0, 100.0 - star_dependency))  # Menos dependencia = mejor
        else:
            star_player_factor = 50.0
        
        # 5. COLLECTIVE CLUTCH IQ
        # Distribución de responsabilidades en clutch
        collective_factors = []
        if len(star_players) >= 2:
            # Analizar distribución entre top players
            points_distribution = [float(p.avg_points or 0) for p in star_players[:3]]  # CONVERTIR A FLOAT
            total_points = sum(points_distribution)
            if total_points > 0:
                # Más equilibrio = mejor IQ colectivo
                max_contribution = max(points_distribution)
                balance_score = 100.0 - (max_contribution / total_points * 100.0 - 33.3)  # Desviación del 33.3% ideal
                collective_factors.append(max(40.0, min(80.0, balance_score)))
        
        collective_clutch_iq = collective_factors[0] if collective_factors else 50.0
        
        # 6. PRESSURE DEFENSE
        # Defensive rating estimado en situaciones clutch
        # Usar puntos permitidos como proxy
        total_points_allowed = 0.0
        defensive_games = 0
        
        for match in matches:
            is_home = match.home_team_id == id
            opponent_score = float(match.away_score if is_home else match.home_score)  # CONVERTIR A FLOAT
            total_points_allowed += opponent_score
            defensive_games += 1
        
        avg_points_allowed = total_points_allowed / defensive_games if defensive_games > 0 else 110.0
        pressure_defense = max(90.0, min(120.0, 120.0 - (avg_points_allowed - 100.0)))  # Inverted scale
        
        # 7. OVERTIME PERFORMANCE
        overtime_performance = (overtime_wins / overtime_games * 100.0) if overtime_games > 0 else 50.0
        
        # 8. CLUTCH DNA SCORE FINAL
        clutch_core = (multi_scenario_clutch * 0.25 + 
                      (50.0 + pressure_shooting) * 0.15 +  # Normalize pressure shooting
                      decision_making_pressure * 10.0 +   # Scale to 0-30
                      star_player_factor * 0.15 + 
                      collective_clutch_iq * 0.15 + 
                      pressure_defense * 0.15 +
                      overtime_performance * 0.10)
        
        clutch_dna_score = max(25.0, min(85.0, clutch_core))
        
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