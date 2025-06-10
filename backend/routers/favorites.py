from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict

from deps import get_db, get_current_user
from models import User, AddFavoriteRequest, FavoriteStatusResponse, UserFavoritesResponse
from crud_favorites import (
    add_favorite_player, remove_favorite_player,
    add_favorite_team, remove_favorite_team,
    get_user_favorites, is_player_favorite, is_team_favorite
)

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"]
)

@router.get("/", response_model=UserFavoritesResponse)
async def get_my_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtiene todos los favoritos del usuario actual"""
    try:
        favorites = await get_user_favorites(db, current_user.id, current_user.role)
        return UserFavoritesResponse(**favorites)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving favorites: {str(e)}"
        )

@router.post("/players/{player_id}", response_model=FavoriteStatusResponse)
async def add_player_to_favorites(
    player_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Añade un jugador a favoritos"""
    try:
        success, message = await add_favorite_player(db, current_user.id, player_id, current_user.role)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        return FavoriteStatusResponse(is_favorite=True, message=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding player to favorites: {str(e)}"
        )

@router.delete("/players/{player_id}", response_model=FavoriteStatusResponse)
async def remove_player_from_favorites(
    player_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Elimina un jugador de favoritos"""
    try:
        success, message = await remove_favorite_player(db, current_user.id, player_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        return FavoriteStatusResponse(is_favorite=False, message=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing player from favorites: {str(e)}"
        )

@router.post("/teams/{team_id}", response_model=FavoriteStatusResponse)
async def add_team_to_favorites(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Añade un equipo a favoritos"""
    try:
        success, message = await add_favorite_team(db, current_user.id, team_id, current_user.role)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        return FavoriteStatusResponse(is_favorite=True, message=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding team to favorites: {str(e)}"
        )

@router.delete("/teams/{team_id}", response_model=FavoriteStatusResponse)
async def remove_team_from_favorites(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Elimina un equipo de favoritos"""
    try:
        success, message = await remove_favorite_team(db, current_user.id, team_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        return FavoriteStatusResponse(is_favorite=False, message=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing team from favorites: {str(e)}"
        )

@router.get("/players/{player_id}/status", response_model=FavoriteStatusResponse)
async def check_player_favorite_status(
    player_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verifica si un jugador está en favoritos"""
    try:
        is_favorite = await is_player_favorite(db, current_user.id, player_id)
        return FavoriteStatusResponse(
            is_favorite=is_favorite,
            message="Player is in favorites" if is_favorite else "Player is not in favorites"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking favorite status: {str(e)}"
        )

@router.get("/teams/{team_id}/status", response_model=FavoriteStatusResponse)
async def check_team_favorite_status(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verifica si un equipo está en favoritos"""
    try:
        is_favorite = await is_team_favorite(db, current_user.id, team_id)
        return FavoriteStatusResponse(
            is_favorite=is_favorite,
            message="Team is in favorites" if is_favorite else "Team is not in favorites"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking favorite status: {str(e)}"
        )