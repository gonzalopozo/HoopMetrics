from operator import itemgetter
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select
from typing import List, Dict, Any, Optional as OptionalType
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import literal
from datetime import datetime, date

from deps import get_db
from models import TeamInfo, Team, Match, MatchStatistic, Player, TeamRecord, TeamStats

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
        # Extract the actual integers from the Row objects
        team_match_ids = [match[0] for match in team_match_result.all()]
        
        # Get all players on the team
        players_query = select(Player.id).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        # Extract the actual integers from the Row objects
        player_ids = [player[0] for player in players_result.all()]
        
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
        players_query = select(Player).where(Player.current_team_id == id)
        players_result = await session.execute(players_query)
        team_players = players_result.all()
        
        # Get player IDs for querying stats
        player_ids = [player.id for player in team_players]
        
        # Get all stats for these players in a single query
        stats_query = select(MatchStatistic).where(MatchStatistic.player_id.in_(player_ids))
        stats_result = await session.execute(stats_query)
        all_stats = stats_result.all()
        
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
        team_info = {team.id: {"name": team.full_name, "abbreviation": team.abbreviation} 
                     for team in teams_result.scalars()}  # Add .scalars()
        
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
        
        recent_games = recent_games_result.all()
        upcoming_games = upcoming_games_result.all()
        
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