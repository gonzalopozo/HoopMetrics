from fastapi import APIRouter, Depends, Query
from sqlmodel import select, func, or_
from typing import List, Optional
from sqlmodel.ext.asyncio.session import AsyncSession

from ..deps import get_db
from ..models import (
    Team, Player, SearchTeamResult, SearchPlayerResult, 
    SearchSuggestions, SearchResults
)

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

@router.get("/suggestions", response_model=SearchSuggestions)
async def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    session: AsyncSession = Depends(get_db)
):
    """
    Obtiene sugerencias de búsqueda mientras el usuario escribe.
    Retorna máximo 5 equipos y 8 jugadores que coincidan con la consulta.
    """
    try:
        # Limpiar y preparar la query
        query = q.strip().lower()
        
        # Búsqueda de equipos (prioridad)
        teams_stmt = (
            select(
                Team.id,
                Team.full_name,
                Team.abbreviation,
                Team.conference,
                Team.division,
                Team.city
            )
            .where(
                or_(
                    func.lower(Team.full_name).contains(query),
                    func.lower(Team.abbreviation).contains(query),
                    func.lower(Team.city).contains(query)
                )
            )
            .order_by(
                # Priorizar coincidencias exactas en abbreviation
                func.lower(Team.abbreviation) == query,
                # Luego coincidencias que empiecen por la query
                func.lower(Team.full_name).startswith(query),
                # Finalmente por nombre completo
                Team.full_name
            )
            .limit(5)
        )
        
        teams_result = await session.execute(teams_stmt)
        teams_data = teams_result.all()
        
        # Búsqueda de jugadores
        players_stmt = (
            select(
                Player.id,
                Player.name,
                Player.position,
                Player.number,
                Player.url_pic,
                Team.full_name.label("team_name")
            )
            .join(Team, Player.current_team_id == Team.id, isouter=True)
            .where(
                func.lower(Player.name).contains(query)
            )
            .order_by(
                # Priorizar coincidencias que empiecen por la query
                func.lower(Player.name).startswith(query),
                # Luego por nombre
                Player.name
            )
            .limit(8)
        )
        
        players_result = await session.execute(players_stmt)
        players_data = players_result.all()
        
        # Contar totales para mostrar "Ver más resultados"
        total_teams_stmt = select(func.count(Team.id)).where(
            or_(
                func.lower(Team.full_name).contains(query),
                func.lower(Team.abbreviation).contains(query),
                func.lower(Team.city).contains(query)
            )
        )
        total_teams_result = await session.execute(total_teams_stmt)
        total_teams = total_teams_result.scalar() or 0
        
        total_players_stmt = select(func.count(Player.id)).where(
            func.lower(Player.name).contains(query)
        )
        total_players_result = await session.execute(total_players_stmt)
        total_players = total_players_result.scalar() or 0
        
        # Construir respuesta
        teams = [
            SearchTeamResult(
                id=team.id,
                full_name=team.full_name,
                abbreviation=team.abbreviation,
                conference=team.conference,
                division=team.division,
                city=team.city
            )
            for team in teams_data
        ]
        
        players = [
            SearchPlayerResult(
                id=player.id,
                name=player.name,
                position=player.position,
                number=player.number,
                team_name=player.team_name,
                url_pic=player.url_pic
            )
            for player in players_data
        ]
        
        return SearchSuggestions(
            teams=teams,
            players=players,
            total_teams=total_teams,
            total_players=total_players
        )
        
    except Exception as e:
        print(f"Error in search suggestions: {str(e)}")
        # Retornar respuesta vacía en caso de error
        return SearchSuggestions(
            teams=[],
            players=[],
            total_teams=0,
            total_players=0
        )

@router.get("/results", response_model=SearchResults)
async def get_search_results(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=50, description="Results per page"),
    session: AsyncSession = Depends(get_db)
):
    """
    Obtiene resultados completos de búsqueda para la página de resultados.
    Incluye paginación y más resultados que las sugerencias.
    """
    try:
        query = q.strip().lower()
        offset = (page - 1) * limit
        
        # Búsqueda de equipos (sin límite en esta vista)
        teams_stmt = (
            select(
                Team.id,
                Team.full_name,
                Team.abbreviation,
                Team.conference,
                Team.division,
                Team.city
            )
            .where(
                or_(
                    func.lower(Team.full_name).contains(query),
                    func.lower(Team.abbreviation).contains(query),
                    func.lower(Team.city).contains(query)
                )
            )
            .order_by(
                func.lower(Team.abbreviation) == query,
                func.lower(Team.full_name).startswith(query),
                Team.full_name
            )
        )
        
        teams_result = await session.execute(teams_stmt)
        teams_data = teams_result.all()
        
        # Búsqueda de jugadores con paginación
        players_stmt = (
            select(
                Player.id,
                Player.name,
                Player.position,
                Player.number,
                Player.url_pic,
                Team.full_name.label("team_name")
            )
            .join(Team, Player.current_team_id == Team.id, isouter=True)
            .where(
                func.lower(Player.name).contains(query)
            )
            .order_by(
                func.lower(Player.name).startswith(query),
                Player.name
            )
            .offset(offset)
            .limit(limit)
        )
        
        players_result = await session.execute(players_stmt)
        players_data = players_result.all()
        
        # Contar totales
        total_teams_stmt = select(func.count(Team.id)).where(
            or_(
                func.lower(Team.full_name).contains(query),
                func.lower(Team.abbreviation).contains(query),
                func.lower(Team.city).contains(query)
            )
        )
        total_teams_result = await session.execute(total_teams_stmt)
        total_teams = total_teams_result.scalar() or 0
        
        total_players_stmt = select(func.count(Player.id)).where(
            func.lower(Player.name).contains(query)
        )
        total_players_result = await session.execute(total_players_stmt)
        total_players = total_players_result.scalar() or 0
        
        # Verificar si hay más páginas
        has_next_page = (offset + limit) < total_players
        
        # Construir respuesta
        teams = [
            SearchTeamResult(
                id=team.id,
                full_name=team.full_name,
                abbreviation=team.abbreviation,
                conference=team.conference,
                division=team.division,
                city=team.city
            )
            for team in teams_data
        ]
        
        players = [
            SearchPlayerResult(
                id=player.id,
                name=player.name,
                position=player.position,
                number=player.number,
                team_name=player.team_name,
                url_pic=player.url_pic
            )
            for player in players_data
        ]
        
        return SearchResults(
            teams=teams,
            players=players,
            query=q,
            total_teams=total_teams,
            total_players=total_players,
            page=page,
            limit=limit,
            has_next_page=has_next_page
        )
        
    except Exception as e:
        print(f"Error in search results: {str(e)}")
        return SearchResults(
            teams=[],
            players=[],
            query=q,
            total_teams=0,
            total_players=0,
            page=page,
            limit=limit,
            has_next_page=False
        )