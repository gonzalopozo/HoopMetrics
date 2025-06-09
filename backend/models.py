from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column
from sqlalchemy.types import Enum as PgEnum
from typing import Dict, List, Optional, Any
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
    
    profile_image_url: Optional[str] = Field(default=None)
    
    favorite_players: List["UserFavoritePlayer"] = Relationship(back_populates="user")
    favorite_teams: List["UserFavoriteTeam"] = Relationship(back_populates="user")

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

class PIPMPositionAverage(SQLModel):
    position: str
    total_pipm: float
    offensive_pimp: float
    defensive_pimp: float
    box_prior_weight: float
    plus_minus_weight: float
    stability_factor: float
    minutes_confidence: float
    usage_rate: float
    minutes_per_game: float
    is_player_position: bool

class PaceImpactAnalysis(SQLModel):
    pace_impact_rating: float       # -10 to +10
    possessions_per_48: float       # Estimated team pace with player
    efficiency_on_court: float      # Team efficiency when player plays
    tempo_control_factor: float     # Player's influence on game pace
    transition_efficiency: float    # Fast break vs half-court splits
    usage_pace_balance: float       # Balance between usage and pace
    fourth_quarter_pace: float      # Late game tempo impact
    pace_consistency: float         # Game-to-game pace variance
    games_played: int
    minutes_per_game: float

class FatiguePerformanceCurve(SQLModel):
    fatigue_resistance: float       # 0-100 scale
    peak_performance_minutes: float # Optimal minutes per game
    endurance_rating: float         # Performance in high-minute games
    back_to_back_efficiency: float  # B2B games vs regular
    fourth_quarter_dropoff: float   # Performance decline late game
    rest_day_boost: float           # Performance after rest
    load_threshold: float           # Minutes where performance drops
    recovery_factor: float          # How quickly bounces back
    games_played: int
    average_minutes: float

class TeamAdvancedEfficiency(SQLModel):
    offensive_efficiency: float      # Puntos por 100 posesiones
    defensive_efficiency: float      # Puntos permitidos por 100 posesiones
    pace_factor: float              # Velocidad de juego vs liga
    strength_of_schedule: float     # Dificultad promedio de oponentes
    clutch_factor: float            # Rendimiento en últimos 5 min
    consistency_index: float        # Desviación estándar del net rating
    taer_score: float              # Team Advanced Efficiency Rating (0-100)

class TeamLineupImpactMatrix(SQLModel):
    best_lineup_plus_minus: float
    worst_lineup_plus_minus: float
    synergy_score: float
    position_flexibility: float
    chemistry_rating: float
    load_balance_index: float
    injury_risk_factor: float
    top_lineup_minutes: float
    depth_factor: float
    player_synergies: Optional[List[dict]] = None
    position_flexibility_data: Optional[List[dict]] = None

class TeamMomentumResilience(SQLModel):
    lead_protection_rate: float       # % victorias cuando van ganando 10+
    comeback_frequency: float         # % victorias tras ir perdiendo 10+
    streak_resilience: float          # Respuesta tras rachas adversas 0-8+
    pressure_performance: float       # Rendimiento en partidos "must-win"
    fourth_quarter_factor: float      # Diferencial de rendimiento último cuarto
    psychological_edge: float         # Diferencia home/away más allá de ventaja local
    tmpri_score: float                # Team Momentum & Psychological Resilience (0-100)
    close_game_record: float          # Win% en partidos decididos por ≤5 puntos

class TeamTacticalAdaptability(SQLModel):
    pace_adaptability: float          # Variación de ritmo vs equipos rápidos/lentos
    size_adjustment: float            # Rendimiento vs equipos grandes/pequeños
    style_counter_effect: float       # Efectividad contra diferentes estilos
    strategic_variety_index: float    # Variedad en patrones de tiro/asistencias
    anti_meta_performance: float      # Rendimiento vs tendencias dominantes
    coaching_intelligence: float      # Ajustes detectables entre tiempos
    ttaq_score: float                 # Team Tactical Adaptability Quotient (0-100)
    opponent_fg_influence: float      # Impacto en % de tiro rival

class TeamClutchDNAProfile(SQLModel):
    multi_scenario_clutch: float      # Rendimiento en 8 situaciones diferentes
    pressure_shooting: float          # FG% bajo presión vs normal
    decision_making_pressure: float   # TO rate en clutch vs regular
    star_player_factor: float         # Dependencia de estrellas en clutch
    collective_clutch_iq: float       # Distribución de responsabilidades
    pressure_defense: float           # Defensive rating en situaciones clutch
    clutch_dna_score: float          # Métrica compuesta "gen clutch" (0-100)
    overtime_performance: float       # Rendimiento en tiempo extra

class TeamPredictivePerformance(SQLModel):
    regression_to_mean: float         # Sostenibilidad del rendimiento actual
    fatigue_accumulation: float       # Impacto de schedule density
    injury_risk_projection: float     # Probabilidad de lesiones clave
    momentum_decay_rate: float        # Cómo se desvanece momentum actual
    matchup_advantage_forecast: float # Proyección vs próximos 10 oponentes
    peak_performance_window: int      # Juegos hasta momento óptimo
    tppa_projected_winrate: float     # Proyección Win% próximos 20 partidos
    schedule_difficulty_next: float   # Dificultad próximos partidos (0-100)

# Modelos para favoritos
class UserFavoritePlayer(SQLModel, table=True):
    __tablename__ = "user_favorite_players"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    player_id: int = Field(foreign_key="players.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    user: Optional[User] = Relationship(back_populates="favorite_players")
    player: Optional[Player] = Relationship()

class UserFavoriteTeam(SQLModel, table=True):
    __tablename__ = "user_favorite_teams"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    team_id: int = Field(foreign_key="teams.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    user: Optional[User] = Relationship(back_populates="favorite_teams")
    team: Optional[Team] = Relationship()

# Modelos de respuesta para favoritos
class FavoritePlayerResponse(SQLModel):
    id: int
    name: str
    position: Optional[str] = None
    team: Optional[TeamRead] = None
    url_pic: Optional[str] = None
    average_stats: Optional[StatRead] = None

class FavoriteTeamResponse(SQLModel):
    id: int
    full_name: str
    abbreviation: str
    conference: Optional[str] = None
    division: Optional[str] = None
    stats: Optional[Dict] = None

class UserFavoritesResponse(SQLModel):
    players: List[FavoritePlayerResponse]
    teams: List[FavoriteTeamResponse]
    limits: Dict[str, int]  # Para indicar los límites según el rol

# Requests para añadir/quitar favoritos
class AddFavoriteRequest(SQLModel):
    item_id: int  # player_id o team_id

class FavoriteStatusResponse(SQLModel):
    is_favorite: bool
    message: str

class UserProfileUpdate(SQLModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    profile_image_url: Optional[str] = Field(default=None)

class UserProfileResponse(SQLModel):
    id: int
    username: str
    email: str
    profile_image_url: Optional[str] = None
    role: UserRole
    registration_date: datetime

# Admin Dashboard Models
class SystemHealthMetrics(SQLModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    response_time_avg: float
    uptime_seconds: int
    error_rate: float
    requests_per_minute: int

class DatabaseMetrics(SQLModel):
    connection_pool_size: int
    active_connections: int
    idle_connections: int
    total_queries_executed: int
    slow_queries_count: int
    database_size_mb: float
    tables_count: int
    avg_query_time_ms: float

class UserMetrics(SQLModel):
    total_users: int
    active_users_24h: int
    active_users_7d: int
    new_users_today: int
    new_users_this_week: int
    users_by_role: Dict[str, int]
    retention_rate_7d: float
    retention_rate_30d: float

class SubscriptionMetrics(SQLModel):
    total_subscriptions: int
    active_subscriptions: int
    revenue_this_month: float
    revenue_this_year: float
    churn_rate: float
    mrr: float
    arr: float
    subscriptions_by_plan: Dict[str, int]

class APIMetrics(SQLModel):
    total_requests_today: int
    total_requests_this_week: int
    avg_response_time: float
    error_rate: float
    most_used_endpoints: List[Dict[str, Any]]
    requests_by_hour: List[Dict[str, Any]]
    status_codes_distribution: Dict[str, int]
    daily_requests_trend: List[Dict[str, Any]]
    feature_usage_stats: List[Dict[str, Any]]

class AdminDashboardData(SQLModel):
    system_health: SystemHealthMetrics
    database_metrics: DatabaseMetrics
    user_metrics: UserMetrics
    subscription_metrics: SubscriptionMetrics
    api_metrics: APIMetrics
    last_updated: str

class AdminUserResponse(SQLModel):
    id: int
    username: str
    email: str
    role: str
    created_at: Optional[datetime] = None
    profile_image_url: Optional[str] = None

class AdminLogEntry(SQLModel):
    timestamp: str
    level: str
    message: str
    module: str

# Modelos para búsqueda
class SearchTeamResult(SQLModel):
    id: int
    full_name: str
    abbreviation: str
    conference: Optional[str] = None
    division: Optional[str] = None
    city: Optional[str] = None

class SearchPlayerResult(SQLModel):
    id: int
    name: str
    position: str
    number: Optional[int] = None
    team_name: Optional[str] = None
    url_pic: Optional[str] = None

class SearchSuggestions(SQLModel):
    teams: List[SearchTeamResult]
    players: List[SearchPlayerResult]
    total_teams: int
    total_players: int

class SearchResults(SQLModel):
    teams: List[SearchTeamResult]
    players: List[SearchPlayerResult]
    query: str
    total_teams: int
    total_players: int
    page: int
    limit: int
    has_next_page: bool