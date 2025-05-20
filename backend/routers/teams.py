from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import literal
from datetime import datetime

from ..deps import get_db
from ..models import TeamInfo, Team, Match, MatchStatistic, Player, TeamRecord, TeamStats, TeamDetail

router = APIRouter(
    prefix="/teams",
    tags=["teams"]
)

@router.get("/", response_model=List[TeamInfo])
async def read_teams(session: AsyncSession = Depends(get_db)):
    try:
        # Get all teams with a single query
        teams_query = select(Team)
        teams_result = await session.exec(teams_query)
        teams = teams_result.all()
        
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
        
        home_results = await session.exec(home_games_query)
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
        
        away_results = await session.exec(away_games_query)
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
        
        stats_results = await session.exec(stats_query)
        
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
    
@router.get("/{id}", response_model=TeamDetail)
async def read_team(id: int, session: AsyncSession = Depends(get_db)):
    try:
        # 1. Get basic team information
        team_query = select(Team).where(Team.id == id)
        team_result = await session.exec(team_query)
        team = team_result.first()
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # 2. Get team stats (wins, losses, etc.)
        home_games_query = select(
            func.count(Match.id).filter(Match.home_score > Match.away_score).label("home_wins"),
            func.count(Match.id).filter(Match.home_score < Match.away_score).label("home_losses")
        ).where(Match.home_team_id == id, Match.home_score.is_not(None))
        
        away_games_query = select(
            func.count(Match.id).filter(Match.away_score > Match.home_score).label("away_wins"),
            func.count(Match.id).filter(Match.away_score < Match.home_score).label("away_losses")
        ).where(Match.away_team_id == id, Match.away_score.is_not(None))
        
        home_result = await session.exec(home_games_query)
        away_result = await session.exec(away_games_query)
        
        home_wins, home_losses = home_result.one()
        away_wins, away_losses = away_result.one()
        
        total_wins = home_wins + away_wins
        total_losses = home_losses + away_losses
        
        # 3. Get team players
        players_query = select(Player).where(Player.current_team_id == id)
        players_result = await session.exec(players_query)
        team_players = players_result.all()
        
        # Get player IDs for querying stats
        player_ids = [player.id for player in team_players]
        
        # Get all stats for these players in a single query
        stats_query = select(MatchStatistic).where(MatchStatistic.player_id.in_(player_ids))
        stats_result = await session.exec(stats_query)
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
            
            # Create TeamPlayerInfo object
            processed_player = {
                "id": player.id,
                "name": player.name,
                "position": player.position,
                "number": player.number,
                "url_pic": player.url_pic,
                "stats": stats_dict
            }
            
            processed_players.append(processed_player)
        
        # 4. Get recent and upcoming games
        today = datetime.now().date()
        
        # Get all teams info for names
        teams_query = select(Team.id, Team.full_name)
        teams_result = await session.exec(teams_query)
        team_names = {team.id: team.full_name for team in teams_result}
        
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
        
        recent_games_result = await session.exec(recent_games_query)
        upcoming_games_result = await session.exec(upcoming_games_query)
        
        recent_games = recent_games_result.all()
        upcoming_games = upcoming_games_result.all()
        
        # Transform match objects to include required fields
        processed_recent_games = []
        for game in recent_games:
            processed_recent_games.append({
                "id": game.id,
                "date": game.date,
                "home_team_id": game.home_team_id,
                "away_team_id": game.away_team_id,
                "home_team_name": team_names.get(game.home_team_id, "Unknown Team"),
                "away_team_name": team_names.get(game.away_team_id, "Unknown Team"),
                "home_score": game.home_score,
                "away_score": game.away_score,
                "status": "completed"  # Since these are past games with scores
            })
        
        processed_upcoming_games = []
        for game in upcoming_games:
            processed_upcoming_games.append({
                "id": game.id,
                "date": game.date,
                "home_team_id": game.home_team_id,
                "away_team_id": game.away_team_id,
                "home_team_name": team_names.get(game.home_team_id, "Unknown Team"),
                "away_team_name": team_names.get(game.away_team_id, "Unknown Team"),
                "home_score": game.home_score,
                "away_score": game.away_score,
                "status": "scheduled"  # Since these are future games
            })
        
        # 5. Compile and return the data
        return {
            "id": team.id,
            "rapidapi_id": team.rapidapi_id,
            "full_name": team.full_name,
            "abbreviation": team.abbreviation,
            "conference": team.conference,
            "division": team.division,
            "stadium": team.stadium,
            "city": team.city,
            "stats": {
                "wins": total_wins,
                "losses": total_losses,
                # Add more stats here if needed
            },
            "players": processed_players,
            "recent_games": processed_recent_games,
            "upcoming_games": processed_upcoming_games
        }
        
    except Exception as e:
        print(f"Error in read_team: {str(e)}")
        raise