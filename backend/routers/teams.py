from fastapi import APIRouter, Depends
from sqlmodel import func, select
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession

from ..deps import get_db
from ..models import TeamInfo, Team, Match, MatchStatistic, Player, TeamRecord, TeamStats

router = APIRouter(
    prefix="/teams",
    tags=["teams"]
)

@router.get("/teams", response_model=List[TeamInfo])
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
        
        # Get team stats with a single query for all teams
        stats_query = select(
            Player.current_team_id,
            func.avg(MatchStatistic.points).label("ppg"),
            func.avg(MatchStatistic.rebounds).label("rpg"),
            func.avg(MatchStatistic.assists).label("apg"),
            func.avg(MatchStatistic.steals).label("spg"),
            func.avg(MatchStatistic.blocks).label("bpg")
        ).join(
            MatchStatistic, MatchStatistic.player_id == Player.id
        ).where(
            Player.current_team_id.in_(team_ids)
        ).group_by(
            Player.current_team_id
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
                win_percentage=round(win_percentage, 1),
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