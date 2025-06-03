from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column
from sqlalchemy.types import Enum as PgEnum
from typing import List, Optional
from datetime import date, datetime
from enum import Enum  # <-- Añade esto
from typing_extensions import TypedDict
from pydantic import BaseModel



# Definición de modelos de datos utilizando SQLModel
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

class UserRole(str, Enum):
    free = "free"
    premium = "premium"
    ultimate = "ultimate"
    admin = "admin"

class UserBase(SQLModel):
    username: str
    email: str

class User(UserBase, table=True):
    __tablename__ = "users"  # <-- Añade esta línea
    
    id: int = Field(default=None, primary_key=True)
    password_hash: str
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    role: UserRole = Field(
        default=UserRole.free,
        sa_column=Column(
            PgEnum(UserRole, name="user_role", create_type=False)
        )
    )

class TeamRecord(TypedDict):
    wins: int
    losses: int

class TeamStats(TypedDict):
    ppg: float
    rpg: float
    apg: float
    spg: float
    bpg: float

class TeamInfo(SQLModel):
    id: int
    name: str
    # logo: LucideIcon
    # conference: str
    # division: str
    record: TeamRecord
    win_percentage: float
    standing: int
    stats: TeamStats

class TeamPlayerInfo(BaseModel):
    id: int
    name: str
    position: str | None
    number: int | None
    url_pic: str | None
    stats: Optional[dict] = None

class GameInfo(BaseModel):
    id: int
    date: date
    home_team_id: int
    away_team_id: int
    home_team_name: str
    away_team_name: str
    rival_team_abbreviation: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: str

class TeamDetailStats(BaseModel):  # Renombrado de TeamStats a TeamDetailStats
    wins: int
    losses: int
    # Añade más campos según necesites

class TeamDetail(BaseModel):
    id: int
    full_name: str
    abbreviation: str
    conference: Optional[str] = None
    division: Optional[str] = None
    stadium: Optional[str] = None
    city: Optional[str] = None
    stats: TeamDetailStats  # Cambiado de TeamStats a TeamDetailStats
    players: List[TeamPlayerInfo]
    recent_games: List[GameInfo]
    upcoming_games: List[GameInfo]
    
class PlayerReadTeams(SQLModel):
    id: int
    name: str
    birth_date: date
    height: Optional[float] = None
    weight: Optional[float] = None
    position: Optional[str] = None
    number: Optional[int] = None
    team: Optional[TeamRead] = None
    url_pic: Optional[str] = None
    average_stats: Optional[StatRead] = None

class PointsProgression(SQLModel):
    date: str  # ISO format
    points: Optional[float] = None

class PointsTypeDistribution(SQLModel):
    two_points: int
    three_points: int
    free_throws: int

class PlayerSkillProfile(SQLModel):
    points: float
    rebounds: float
    assists: float
    steals: float
    blocks: float

class PlayerBarChartData(SQLModel):
    name: str
    value: float
    
class PlayerBarChartData(SQLModel):
    name: str
    value: float

class MinutesProgression(SQLModel):
    date: str  
    minutes: float

class ParticipationRate(SQLModel):
    label: str
    value: float

class TeamPointsProgression(SQLModel):
    date: str  # ISO date string
    points: int

class TeamPointsVsOpponent(SQLModel):
    date: str  # ISO date string
    points_for: int
    points_against: int

class TeamPointsTypeDistribution(SQLModel):
    two_points: int
    three_points: int
    free_throws: int   

class TeamRadarProfile(SQLModel):
    points: float
    rebounds: float
    assists: float
    steals: float
    blocks: float

class TeamShootingVolume(SQLModel):
    name: str
    value: float

class PlayerContribution(SQLModel):
    player_name: str
    points: int
    percentage: float

class AdvancedImpactMatrix(SQLModel):
    win_shares: float
    vorp: float
    true_shooting_pct: float
    box_plus_minus: float
    games_played: int
    minutes_per_game: float

# En models.py
class PositionAverage(SQLModel):
    position: str
    offensive_rating: float
    defensive_rating: float
    minutes_per_game: float
    win_shares: float
    vorp: float
    box_plus_minus: float
    is_player_position: bool

# ...existing code...

class LebronImpactScore(SQLModel):
    lebron_score: float  # -10 to +10 scale
    box_component: float
    plus_minus_component: float
    luck_adjustment: float
    context_adjustment: float
    usage_adjustment: float
    percentile_rank: float
    games_played: int
    minutes_per_game: float

class PIPMImpact(SQLModel):
    total_pipm: float
    offensive_pimp: float
    defensive_pimp: float
    box_prior_weight: float
    plus_minus_weight: float
    stability_factor: float
    minutes_confidence: float
    games_played: int
    usage_rate: float

class RaptorWAR(SQLModel):
    total_war: float
    offensive_war: float
    defensive_war: float
    market_value_millions: float
    positional_versatility: float
    age_adjustment: float
    injury_risk_factor: float
    games_played: int
    win_shares_comparison: float