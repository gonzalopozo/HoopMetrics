from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Field, SQLModel, create_engine, Session, select, Relationship, col
from datetime import date

from functools import lru_cache
from config import Settings

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
    points: Optional[int] = None
    rebounds: Optional[int] = None
    assists: Optional[int] = None
    steals: Optional[int] = None
    blocks: Optional[int] = None
    minutes_played: Optional[float] = None
    field_goals_attempted: Optional[int] = None
    field_goals_made: Optional[int] = None
    three_points_made: Optional[int] = None
    three_points_attempted: Optional[int] = None
    free_throws_made: Optional[int] = None
    free_throws_attempted: Optional[int] = None
    fouls: Optional[int] = None
    turnovers: Optional[int] = None
    off_rebounds: Optional[int] = None
    def_rebounds: Optional[int] = None
    minutes: Optional[int] = None
    plusminus: Optional[int] = None

    # Relaciones
    match: Match = Relationship(back_populates="statistics")
    player: Player = Relationship(back_populates="statistics")


# Pydantic response models
class TeamRead(SQLModel):
    full_name: str


class StatRead(SQLModel):
    points: Optional[int] = 0
    rebounds: Optional[int] = 0
    assists: Optional[int] = 0
    steals: Optional[int] = 0
    blocks: Optional[int] = 0
    minutes_played: Optional[float] = 0.0
    field_goals_attempted: Optional[int] = 0
    field_goals_made: Optional[int] = 0
    three_points_made: Optional[int] = 0
    three_points_attempted: Optional[int] = 0
    free_throws_made: Optional[int] = 0
    free_throws_attempted: Optional[int] = 0
    fouls: Optional[int] = 0
    turnovers: Optional[int] = 0


class PlayerRead(SQLModel):
    name: str
    birth_date: date
    height: Optional[float] = None
    weight: Optional[float] = None
    position: Optional[str] = None
    number: Optional[int] = None
    team: Optional[TeamRead] = None
    stats: List[StatRead] = []
    average_stats: Optional[StatRead] = None


@lru_cache
def get_settings():
    return Settings()


conn_data = get_settings()

# Database setup
database_url = conn_data.DATABASE_URL
engine = create_engine(database_url, echo=True)  # echo=True para ver las consultas SQL

app = FastAPI()


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


@app.get("/players", response_model=List[PlayerRead])
def read_players(session: Session = Depends(get_session)):
    try:
        # Primero verificamos si hay jugadores en la base de datos
        all_players = session.exec(select(Player)).all()
        
        if not all_players:
            return []
        
        # Filtrar solo jugadores que tienen equipo asignado
        players_with_team = [p for p in all_players if p.current_team_id is not None]
        
        results = []
        for player in all_players:
            # Cargar el equipo manualmente si existe
            team = None
            if player.current_team_id:
                team = session.get(Team, player.current_team_id)
            
            # Consulta específica para las estadísticas de este jugador
            stats_query = select(MatchStatistic).where(MatchStatistic.player_id == player.id)
            stats = session.exec(stats_query).all()
            
            # Calcular promedios si hay estadísticas
            if stats:
                avg = StatRead(
                    points=sum(s.points or 0 for s in stats) // len(stats) if any(s.points for s in stats) else 0,
                    rebounds=sum(s.rebounds or 0 for s in stats) // len(stats) if any(s.rebounds for s in stats) else 0,
                    assists=sum(s.assists or 0 for s in stats) // len(stats) if any(s.assists for s in stats) else 0,
                    steals=sum(s.steals or 0 for s in stats) // len(stats) if any(s.steals for s in stats) else 0,
                    blocks=sum(s.blocks or 0 for s in stats) // len(stats) if any(s.blocks for s in stats) else 0,
                    minutes_played=round(sum(s.minutes_played or 0 for s in stats) / len(stats), 1) if any(s.minutes_played for s in stats) else 0.0,
                    field_goals_attempted=sum(s.field_goals_attempted or 0 for s in stats) // len(stats) if any(s.field_goals_attempted for s in stats) else 0,
                    field_goals_made=sum(s.field_goals_made or 0 for s in stats) // len(stats) if any(s.field_goals_made for s in stats) else 0,
                    three_points_made=sum(s.three_points_made or 0 for s in stats) // len(stats) if any(s.three_points_made for s in stats) else 0,
                    three_points_attempted=sum(s.three_points_attempted or 0 for s in stats) // len(stats) if any(s.three_points_attempted for s in stats) else 0,
                    free_throws_made=sum(s.free_throws_made or 0 for s in stats) // len(stats) if any(s.free_throws_made for s in stats) else 0,
                    free_throws_attempted=sum(s.free_throws_attempted or 0 for s in stats) // len(stats) if any(s.free_throws_attempted for s in stats) else 0,
                    fouls=sum(s.fouls or 0 for s in stats) // len(stats) if any(s.fouls for s in stats) else 0,
                    turnovers=sum(s.turnovers or 0 for s in stats) // len(stats) if any(s.turnovers for s in stats) else 0,
                )
            else:
                avg = StatRead()
            
            # Crear modelo de respuesta para este jugador
            player_read = PlayerRead(
                name=player.name,
                birth_date=player.birth_date,
                height=player.height,
                weight=player.weight,
                position=player.position,
                number=player.number,
                team=TeamRead(full_name=team.full_name) if team else None,
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
            results.append(player_read)
        
        return results
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in read_players: {str(e)}")
        # Re-raise it so FastAPI can handle it appropriately
        raise
    
    return results


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