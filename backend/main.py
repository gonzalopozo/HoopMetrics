from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Field, SQLModel, create_engine, Session, select, Relationship, desc, case
from datetime import date
from operator import attrgetter
from sqlalchemy import func

from functools import lru_cache
from config import Settings

from fastapi.middleware.cors import CORSMiddleware



# Database models
class Team(SQLModel, table=True):
    __tablename__ = "teams"

    id: Optional[int] = Field(default=None, primary_key=True)
    rapidapi_id: Optional[int] = Field(default=None, unique=True)
    full_name: str
    abbreviation: str
    conference: Optional[str] = None
    division: Optional[str] = None
    stadium: Optional[str] = None
    city: Optional[str] = None

    # Relaciones
    players: List["Player"] = Relationship(back_populates="team")
    home_matches: List["Match"] = Relationship(
        back_populates="home_team", 
        sa_relationship_kwargs={"foreign_keys": "Match.home_team_id"}
    )
    away_matches: List["Match"] = Relationship(
        back_populates="away_team", 
        sa_relationship_kwargs={"foreign_keys": "Match.away_team_id"}
    )


class Match(SQLModel, table=True):
    __tablename__ = "matches"

    id: Optional[int] = Field(default=None, primary_key=True)
    rapidapi_id: Optional[int] = Field(default=None, unique=True)
    date: date
    season: Optional[str] = None
    home_team_id: int = Field(foreign_key="teams.id")
    home_team_rapidapi_id: int = Field()
    away_team_id: int = Field(foreign_key="teams.id")
    away_team_rapidapi_id: int = Field()
    home_score: Optional[int] = None
    away_score: Optional[int] = None

    # Relaciones
    home_team: Team = Relationship(
        back_populates="home_matches", 
        sa_relationship_kwargs={"foreign_keys": "Match.home_team_id"}
    )
    away_team: Team = Relationship(
        back_populates="away_matches", 
        sa_relationship_kwargs={"foreign_keys": "Match.away_team_id"}
    )
    statistics: List["MatchStatistic"] = Relationship(back_populates="match")


class Player(SQLModel, table=True):
    __tablename__ = "players"

    id: Optional[int] = Field(default=None, primary_key=True)
    # Eliminamos rapidapi_id ya que no existe en la base de datos
    name: str
    birth_date: date
    height: Optional[float] = None
    weight: Optional[float] = None
    position: Optional[str] = None
    number: Optional[int] = None
    current_team_id: Optional[int] = Field(default=None, foreign_key="teams.id")
    # Eliminamos current_team_rapidapi_id si no existe
    url_pic: Optional[str] = None

    # Relaciones
    team: Optional[Team] = Relationship(back_populates="players")
    statistics: List["MatchStatistic"] = Relationship(back_populates="player")


class MatchStatistic(SQLModel, table=True):
    __tablename__ = "match_statistics"

    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="matches.id")
    match_rapidapi_id: int
    player_id: int = Field(foreign_key="players.id")
    player_rapidapi_id: int  # Mantenemos esto ya que parece estar en la tabla de estadísticas
    points: Optional[float] = None
    rebounds: Optional[float] = None
    assists: Optional[float] = None
    steals: Optional[float] = None
    blocks: Optional[float] = None
    minutes_played: Optional[float] = None
    field_goals_attempted: Optional[float] = None
    field_goals_made: Optional[float] = None
    three_points_made: Optional[float] = None
    three_points_attempted: Optional[float] = None
    free_throws_made: Optional[float] = None
    free_throws_attempted: Optional[float] = None
    fouls: Optional[float] = None
    turnovers: Optional[float] = None
    off_rebounds: Optional[float] = None
    def_rebounds: Optional[float] = None
    minutes: Optional[float] = None
    plusminus: Optional[float] = None

    # Relaciones
    match: Match = Relationship(back_populates="statistics")
    player: Player = Relationship(back_populates="statistics")


# Pydantic response models
class TeamRead(SQLModel):
    full_name: str


class StatRead(SQLModel):
    points: Optional[float] = None
    rebounds: Optional[float] = None
    assists: Optional[float] = None
    steals: Optional[float] = None
    blocks: Optional[float] = None
    minutes_played: Optional[float] = None
    field_goals_attempted: Optional[float] = None
    field_goals_made: Optional[float] = None
    three_points_made: Optional[float] = None
    three_points_attempted: Optional[float] = None
    free_throws_made: Optional[float] = None
    free_throws_attempted: Optional[float] = None
    fouls: Optional[float] = None
    turnovers: Optional[float] = None


class PlayerRead(SQLModel):
    id: int
    name: str
    birth_date: date
    height: Optional[float] = None
    weight: Optional[float] = None
    position: Optional[str] = None
    number: Optional[int] = None
    team: Optional[TeamRead] = None
    url_pic: Optional[str] = None
    stats: List[StatRead] = []
    average_stats: Optional[StatRead] = None

class TopPerformer(SQLModel):
    id: int = None
    name: str = None
    team: TeamRead = None
    url_pic: Optional[str] = None
    game_stats: StatRead = None
    isWinner: bool = None
    points: int = None
    rebounds: int = None
    assists: int = None

@lru_cache
def get_settings():
    return Settings()


conn_data = get_settings()

# Database setup
database_url = conn_data.DATABASE_URL
engine = create_engine(database_url, echo=True)  # echo=True para ver las consultas SQL

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Permite todas las fuentes
    allow_credentials=True,         # Permite envío de cookies y cabeceras de autenticación
    allow_methods=["*"],            # Permite todos los métodos HTTP
    allow_headers=["*"],            # Permite todas las cabeceras
)


# Dependency to get DB session
def get_session():
    with Session(engine) as session:
        yield session


@app.on_event("startup")
def on_startup():
    # No creamos tablas aquí porque ya están creadas en la base de datos
    # Pero vamos a verificar la conexión
    try:
        with Session(engine) as session:
            # Consulta simple para verificar la conexión
            session.exec(select(1)).one()
            print("Database connection successful!")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        # No lanzamos excepción aquí para permitir que la app inicie de todos modos


@app.get("/players/sortedbyppg/{page}", response_model=List[PlayerRead])
def read_players_sorted_by_ppg_paginated(page:int, session: Session = Depends(get_session)):
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

        results = session.exec(stmt).all()

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

@app.get("/players/{id}", response_model=PlayerRead)
def read_players_by_id(id: int, session: Session = Depends(get_session)):
    try:
        # Primero verificamos si hay jugadores en la base de datos
        # Obtenemos como máximo 20 jugadores de la base de datos
        player = session.exec(
            select(Player)
            .where(Player.id == id)
        ).first()  # <-- Notar los paréntesis en all()
        
        if not player:
            return PlayerRead()
        
        # Filtrar solo jugadores que tienen equipo asignado
        # players_with_team = [p for p in all_players if p.current_team_id is not None]
        
        # team = None
        # if player.current_team_id:
        #     team = session.exec(
        #         select(Team)
        #         .where(Team.id == player.current_team_id)
        #     ).all()
        
        team = None
        if player.current_team_id:
            team = session.get(Team, player.current_team_id)
        
        # Consulta específica para las estadísticas de este jugador
        stats_query = select(MatchStatistic).where(MatchStatistic.player_id == player.id)
        stats = session.exec(stats_query).all()
        
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
#, response_model=List[TopPerformer]
@app.get("/home/top-performers")
def read_top_performers(session: Session = Depends(get_session)):
    try:
        matchs = session.exec(
            select(Match)
            .where(Match.home_score != None)
            .where(Match.away_score != None)
            .order_by(desc(Match.date))
            .limit(2)
        )
        

        
        performers = []
        for matc in matchs:
            # matchss.append(match)
            # 1) Expresión para 'side'
            side_expr = case(
                (Player.current_team_id == matc.home_team_id,  'home'),
                (Player.current_team_id == matc.away_team_id, 'away'),
                else_='other'
            ).label("side")

            # 2) Expresión para 'total' = points + rebounds + assists
            total_expr = (
                func.coalesce(MatchStatistic.points,  0) +
                func.coalesce(MatchStatistic.rebounds,0) +
                func.coalesce(MatchStatistic.assists, 0)
            ).label("total")

            # 3) Statement con DISTINCT ON(side)
            stmt = (
                select(
                    MatchStatistic,
                    total_expr,
                    Player.name.label("player_name"),
                    side_expr,
                )
                .join(Player, MatchStatistic.player_id == Player.id)
                .where(MatchStatistic.match_id == matc.id)
                .distinct(side_expr)
                .order_by(side_expr, desc(total_expr))
            )

            # 4) Ejecutar y mapear resultados
            rows = session.exec(stmt).all()

            for stat, player_name, side in rows:
                # Carga lazy de match y team; o puedes hacer join si prefieres
                match = session.get(Match, stat.match_id)
                team  = session.get(Team, stat.player.current_team_id) if stat.player.current_team_id else None

                performers.append(
                    TopPerformer(
                        id         = stat.player_id,
                        name       = player_name,
                        team       = TeamRead(full_name=team.full_name) if team else None,
                        url_pic    = stat.player.url_pic,
                        game_stats = StatRead(
                            points=stat.points or 0,
                            rebounds=stat.rebounds or 0,
                            assists=stat.assists or 0,
                            steals=stat.steals or 0,
                            blocks=stat.blocks or 0,
                            minutes_played=stat.minutes_played or 0.0,
                            field_goals_attempted=stat.field_goals_attempted or 0,
                            field_goals_made=stat.field_goals_made or 0,
                            three_points_made=stat.three_points_made or 0,
                            three_points_attempted=stat.three_points_attempted or 0,
                            free_throws_made=stat.free_throws_made or 0,
                            free_throws_attempted=stat.free_throws_attempted or 0,
                            fouls=stat.fouls or 0,
                            turnovers=stat.turnovers or 0,
                        ),
                        isWinner = (
                            (side == 'home' and match.home_score > match.away_score)
                            or
                            (side == 'away' and match.away_score > match.home_score)
                        ),
                        points   = int(stat.points or 0),
                        rebounds = int(stat.rebounds or 0),
                        assists  = int(stat.assists or 0),
                    )
                )
            
            
        
        
        return performers
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in read_players: {str(e)}")
        # Re-raise it so FastAPI can handle it appropriately
        raise




# Endpoints adicionales para debugging
@app.get("/debug/players/count")
def get_player_count(session: Session = Depends(get_session)):
    try:
        count = session.exec(select(Player)).all()
        return {"count": len(count), "players": [p.name for p in count]}
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/teams/count")
def get_team_count(session: Session = Depends(get_session)):
    try:
        count = session.exec(select(Team)).all()
        return {"count": len(count), "teams": [t.full_name for t in count]}
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/tables")
def get_tables_info(session: Session = Depends(get_session)):
    """Endpoint para comprobar la estructura de tablas en la base de datos"""
    try:
        # Consulta para listar todas las tablas
        result = session.exec("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        tables = [row[0] for row in result]
        
        tables_info = {}
        for table in tables:
            # Consulta para obtener información de columnas
            result = session.exec(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
            columns = {row[0]: row[1] for row in result}
            tables_info[table] = columns
            
        return {"tables": tables_info}
    except Exception as e:
        return {"error": str(e)}