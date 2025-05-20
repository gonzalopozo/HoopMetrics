from fastapi import APIRouter, Depends
from sqlmodel import func, select
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import literal

from ..deps import get_db
from ..models import TeamInfo, Team, Match, MatchStatistic, Player, TeamRecord, TeamStats

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