from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Tuple
from models import (
    User, Player, Team, UserFavoritePlayer, UserFavoriteTeam, 
    UserRole, FavoritePlayerResponse, FavoriteTeamResponse,
    TeamRead, StatRead, MatchStatistic
)

# Límites de favoritos por rol
FAVORITE_LIMITS = {
    UserRole.free: {"players": 1, "teams": 1},
    UserRole.premium: {"players": 3, "teams": 3},
    UserRole.ultimate: {"players": float('inf'), "teams": float('inf')}
}

async def get_user_favorite_limits(user_role: UserRole) -> Dict[str, int]:
    """Obtiene los límites de favoritos según el rol del usuario"""
    limits = FAVORITE_LIMITS.get(user_role, FAVORITE_LIMITS[UserRole.free])
    return {
        "players": int(limits["players"]) if limits["players"] != float('inf') else -1,
        "teams": int(limits["teams"]) if limits["teams"] != float('inf') else -1
    }

async def check_favorite_limits(db: AsyncSession, user_id: int, user_role: UserRole, item_type: str) -> Tuple[bool, str]:
    """
    Verifica si el usuario puede añadir más favoritos
    Returns: (can_add, message)
    """
    limits = FAVORITE_LIMITS.get(user_role, FAVORITE_LIMITS[UserRole.free])
    
    if item_type == "player":
        if limits["players"] == float('inf'):
            return True, "OK"
        
        current_count_result = await db.execute(
            select(func.count(UserFavoritePlayer.id)).where(UserFavoritePlayer.user_id == user_id)
        )
        current_count = current_count_result.scalar()
        
        if current_count >= limits["players"]:
            return False, f"Maximum {limits['players']} favorite players allowed for {user_role.value} users"
    
    elif item_type == "team":
        if limits["teams"] == float('inf'):
            return True, "OK"
            
        current_count_result = await db.execute(
            select(func.count(UserFavoriteTeam.id)).where(UserFavoriteTeam.user_id == user_id)
        )
        current_count = current_count_result.scalar()
        
        if current_count >= limits["teams"]:
            return False, f"Maximum {limits['teams']} favorite teams allowed for {user_role.value} users"
    
    return True, "OK"

async def add_favorite_player(db: AsyncSession, user_id: int, player_id: int, user_role: UserRole) -> Tuple[bool, str]:
    """Añade un jugador a favoritos"""
    
    # Verificar si ya existe
    existing = await db.execute(
        select(UserFavoritePlayer).where(
            UserFavoritePlayer.user_id == user_id,
            UserFavoritePlayer.player_id == player_id
        )
    )
    if existing.scalar_one_or_none():
        return False, "Player already in favorites"
    
    # Verificar límites
    can_add, message = await check_favorite_limits(db, user_id, user_role, "player")
    if not can_add:
        return False, message
    
    # Verificar que el jugador existe
    player = await db.get(Player, player_id)
    if not player:
        return False, "Player not found"
    
    # Añadir a favoritos
    favorite = UserFavoritePlayer(user_id=user_id, player_id=player_id)
    db.add(favorite)
    await db.commit()
    
    return True, "Player added to favorites"

async def remove_favorite_player(db: AsyncSession, user_id: int, player_id: int) -> Tuple[bool, str]:
    """Elimina un jugador de favoritos"""
    
    result = await db.execute(
        select(UserFavoritePlayer).where(
            UserFavoritePlayer.user_id == user_id,
            UserFavoritePlayer.player_id == player_id
        )
    )
    favorite = result.scalar_one_or_none()
    
    if not favorite:
        return False, "Player not in favorites"
    
    await db.delete(favorite)
    await db.commit()
    
    return True, "Player removed from favorites"

async def add_favorite_team(db: AsyncSession, user_id: int, team_id: int, user_role: UserRole) -> Tuple[bool, str]:
    """Añade un equipo a favoritos"""
    
    # Verificar si ya existe
    existing = await db.execute(
        select(UserFavoriteTeam).where(
            UserFavoriteTeam.user_id == user_id,
            UserFavoriteTeam.team_id == team_id
        )
    )
    if existing.scalar_one_or_none():
        return False, "Team already in favorites"
    
    # Verificar límites
    can_add, message = await check_favorite_limits(db, user_id, user_role, "team")
    if not can_add:
        return False, message
    
    # Verificar que el equipo existe
    team = await db.get(Team, team_id)
    if not team:
        return False, "Team not found"
    
    # Añadir a favoritos
    favorite = UserFavoriteTeam(user_id=user_id, team_id=team_id)
    db.add(favorite)
    await db.commit()
    
    return True, "Team added to favorites"

async def remove_favorite_team(db: AsyncSession, user_id: int, team_id: int) -> Tuple[bool, str]:
    """Elimina un equipo de favoritos"""
    
    result = await db.execute(
        select(UserFavoriteTeam).where(
            UserFavoriteTeam.user_id == user_id,
            UserFavoriteTeam.team_id == team_id
        )
    )
    favorite = result.scalar_one_or_none()
    
    if not favorite:
        return False, "Team not in favorites"
    
    await db.delete(favorite)
    await db.commit()
    
    return True, "Team removed from favorites"

async def get_user_favorites(db: AsyncSession, user_id: int, user_role: UserRole) -> Dict:
    """Obtiene todos los favoritos del usuario"""
    
    # Obtener jugadores favoritos con estadísticas
    favorite_players_query = select(
        Player.id,
        Player.name,
        Player.position,
        Player.url_pic,
        Team.full_name.label("team_name")
    ).select_from(
        UserFavoritePlayer
    ).join(
        Player, UserFavoritePlayer.player_id == Player.id
    ).outerjoin(
        Team, Player.current_team_id == Team.id
    ).where(
        UserFavoritePlayer.user_id == user_id
    )
    
    favorite_players_result = await db.execute(favorite_players_query)
    favorite_players_data = favorite_players_result.all()
    
    favorite_players = []
    for player_data in favorite_players_data:
        # Obtener estadísticas promedio del jugador
        stats_query = select(
            func.avg(MatchStatistic.points).label("avg_points"),
            func.avg(MatchStatistic.rebounds).label("avg_rebounds"),
            func.avg(MatchStatistic.assists).label("avg_assists"),
            func.avg(MatchStatistic.steals).label("avg_steals"),
            func.avg(MatchStatistic.blocks).label("avg_blocks"),
            func.avg(MatchStatistic.minutes_played).label("avg_minutes"),
        ).where(MatchStatistic.player_id == player_data.id)
        
        stats_result = await db.execute(stats_query)
        stats_data = stats_result.first()
        
        avg_stats = None
        if stats_data and stats_data.avg_points is not None:
            avg_stats = StatRead(
                points=round(float(stats_data.avg_points), 1),
                rebounds=round(float(stats_data.avg_rebounds or 0), 1),
                assists=round(float(stats_data.avg_assists or 0), 1),
                steals=round(float(stats_data.avg_steals or 0), 1),
                blocks=round(float(stats_data.avg_blocks or 0), 1),
                minutes_played=round(float(stats_data.avg_minutes or 0), 1)
            )
        
        favorite_players.append(FavoritePlayerResponse(
            id=player_data.id,
            name=player_data.name,
            position=player_data.position,
            team=TeamRead(full_name=player_data.team_name) if player_data.team_name else None,
            url_pic=player_data.url_pic,
            average_stats=avg_stats
        ))
    
    # Obtener equipos favoritos
    favorite_teams_query = select(
        Team.id,
        Team.full_name,
        Team.abbreviation,
        Team.conference,
        Team.division
    ).select_from(
        UserFavoriteTeam
    ).join(
        Team, UserFavoriteTeam.team_id == Team.id
    ).where(
        UserFavoriteTeam.user_id == user_id
    )
    
    favorite_teams_result = await db.execute(favorite_teams_query)
    favorite_teams_data = favorite_teams_result.all()
    
    favorite_teams = [
        FavoriteTeamResponse(
            id=team_data.id,
            full_name=team_data.full_name,
            abbreviation=team_data.abbreviation,
            conference=team_data.conference,
            division=team_data.division
        )
        for team_data in favorite_teams_data
    ]
    
    limits = await get_user_favorite_limits(user_role)
    
    return {
        "players": favorite_players,
        "teams": favorite_teams,
        "limits": limits
    }

async def is_player_favorite(db: AsyncSession, user_id: int, player_id: int) -> bool:
    """Verifica si un jugador está en favoritos"""
    result = await db.execute(
        select(UserFavoritePlayer).where(
            UserFavoritePlayer.user_id == user_id,
            UserFavoritePlayer.player_id == player_id
        )
    )
    return result.scalar_one_or_none() is not None

async def is_team_favorite(db: AsyncSession, user_id: int, team_id: int) -> bool:
    """Verifica si un equipo está en favoritos"""
    result = await db.execute(
        select(UserFavoriteTeam).where(
            UserFavoriteTeam.user_id == user_id,
            UserFavoriteTeam.team_id == team_id
        )
    )
    return result.scalar_one_or_none() is not None