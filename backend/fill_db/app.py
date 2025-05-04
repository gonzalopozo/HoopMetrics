import os
import time
import requests
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

API_HOST = "api-nba-v1.p.rapidapi.com"
API_KEY  = os.getenv("RAPIDAPI_KEY")
HEADERS  = {
    "X-RapidAPI-Host": API_HOST,
    "X-RapidAPI-Key": API_KEY
}

# Conexión a PostgreSQL
conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)

# def fetch_teams():
#     url = f"https://{API_HOST}/teams"
#     resp = requests.get(url, headers=HEADERS)
#     return resp.json()["response"]

# def get_nba_franchises():
#     all_teams = fetch_teams()
#     return [
#         team for team in all_teams
#         if team.get("nbaFranchise", False) is True
#         and "Stephen A" not in team.get("name", "")
#     ]


# def insert_teams(teams):
#     with conn.cursor() as cur:
#         vals = [
#             (t["id"], t["name"], t["code"], t["leagues"]["standard"]["conference"],
#              t["leagues"]["standard"]["division"], "", t["city"])
#             for t in teams
#         ]
#         sql = """
#         INSERT INTO teams(rapidapi_id, full_name, abbreviation, conference, division, stadium, city)
#         VALUES %s
#         ON CONFLICT (id) DO NOTHING
#         """
#         execute_values(cur, sql, vals)
#     conn.commit()

# teams = get_nba_franchises()
# print(teams)
# insert_teams(teams)
# print(f"Insertados {len(teams)} equipos.")

# def load_team_mapping():
#     """
#     Devuelve un dict { rapidapi_id: internal_id } leídos de la tabla teams.
#     """
#     with conn.cursor() as cur:
#         cur.execute("SELECT id, rapidapi_id FROM teams;")
#         return { rapidapi_id: id_ for id_, rapidapi_id in cur.fetchall() }

# def fetch_players_for_team(season: int, external_team_id: int):
#     """
#         Devuelve la lista de jugadores de un equipo concreto para la temporada dada.
#     """
#     url = f"https://{API_HOST}/players"
#     params = {"season": season, "team": external_team_id}
#     resp = requests.get(url, headers=HEADERS, params=params)
#     return resp.json().get("response", [])

# DEFAULT_BIRTH = "1970-01-01"

# def insert_players(players: list, internal_team_id: int, external_team_id: int):
#     """
#     Inserta jugadores indicando ambos IDs de equipo.
#     """
#     with conn.cursor() as cur:
#         vals = []
#         for p in players:
#             birth = p.get("birth", {}).get("date") or DEFAULT_BIRTH
#             std      = p.get("leagues", {}).get("standard", {})
#             position = std.get("pos") or ""
#             jersey   = std.get("jersey") or None

#             vals.append((
#                 p["id"],                                        # rapidapi_id del jugador
#                 f"{p['firstname']} {p['lastname']}",
#                 birth,
#                 float(p["height"]["meters"]) if p["height"]["meters"] else None,
#                 float(p["weight"]["kilograms"]) if p["weight"]["kilograms"] else None,
#                 position,
#                 jersey,
#                 internal_team_id,                               # current_team_id interno
#                 external_team_id                                # current_team_rapidapi_id
#             ))

#         sql = """
#         INSERT INTO players
#           (rapidapi_id, name, birth_date, height, weight, position, number,
#            current_team_id, current_team_rapidapi_id)
#         VALUES %s
#         ON CONFLICT (rapidapi_id) DO NOTHING
#         """
#         execute_values(cur, sql, vals)
#     conn.commit()


# season = 2024
# max_requests_per_day = 100
# used_requests = 51

# # 1) Cargamos mapeo de equipos
# team_map = load_team_mapping()

# # 2) Iteramos sobre los rapidapi_id de equipos
# for external_id, internal_id in team_map.items():
#     if used_requests >= max_requests_per_day:
#         print("Límite de peticiones alcanzado. Deteniendo.")
#         break

#     players = fetch_players_for_team(season, external_id)
#     print(f"Equipo externo {external_id} → interno {internal_id}: {len(players)} jugadores recuperados.")
#     insert_players(players, internal_id, external_id)

#     used_requests += 1
#     time.sleep(10)  # un segundo de pausa para no petar la API

# print(f"Total de requests realizadas hoy: {used_requests}")


# def fetch_matches(season=2024):
#     """
#     Llama a la API y devuelve la lista de partidos.
#     """
#     url = f"https://{API_HOST}/games"
#     params = {"season": season, "league": "standard"}
#     resp = requests.get(url, headers=HEADERS, params=params)
#     resp.raise_for_status()
#     return resp.json().get("response", [])

# def insert_matches(matches, team_map):
#     """
#     Inserta en la tabla matches todos los datos, rellenando tanto
#     los IDs internos (home_team_id, away_team_id) como los rapidapi
#     (home_team_rapidapi_id, away_team_rapidapi_id).
#     """
#     with conn.cursor() as cur:
#         vals = []
#         for m in matches:
#             api_home = m["teams"]["home"]["id"]
#             api_away = m["teams"]["visitors"]["id"]

#             # Mapeo dinámico
#             home_id = team_map.get(api_home)
#             away_id = team_map.get(api_away)
#             if home_id is None or away_id is None:
#                 print(f"⚠️  Sin mapeo para equipos {api_home}/{api_away} en partido {m['id']}")
#                 continue

#             date     = m["date"]["start"].split("T")[0]
#             season   = m["season"]
#             home_pts = m["scores"]["home"]["points"]
#             away_pts = m["scores"]["visitors"]["points"]

#             vals.append((
#                 m["id"],           # rapidapi_id del partido
#                 date,
#                 season,
#                 home_id,           # internal
#                 api_home,          # rapidapi
#                 away_id,           # internal
#                 api_away,          # rapidapi
#                 home_pts,
#                 away_pts
#             ))

#         sql = """
#         INSERT INTO matches
#           (rapidapi_id, date, season,
#            home_team_id, home_team_rapidapi_id,
#            away_team_id, away_team_rapidapi_id,
#            home_score, away_score)
#         VALUES %s
#         ON CONFLICT (rapidapi_id) DO NOTHING
#         """
#         execute_values(cur, sql, vals)
#     conn.commit()

# # 1) Cargamos el mapeo de equipos desde BBDD
# team_map = load_team_mapping()

# # 2) Traemos partidos desde la API
# all_matches = fetch_matches(season=2024)
# print(f"Recibidos {len(all_matches)} partidos de la API")

# # 3) Insertamos en BBDD
# insert_matches(all_matches, team_map)
# print("Inserción de partidos completada.")

SEASON = "2024"
RATE_LIMIT_PAUSE = 12  # segundos entre llamadas

# — Funciones de carga de mapeos —
def load_mapping(table: str):
    """
    Devuelve dict { rapidapi_id: internal_id } para la tabla dada.
    """
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, rapidapi_id FROM {table};")
        return { rapidapi_id: id_ for id_, rapidapi_id in cur.fetchall() }
    

# — Función que llama a la API de estadísticas por equipo —
def fetch_team_stats(external_team_id: int):
    url = f"https://{API_HOST}/players/statistics"
    params = {"team": external_team_id, "season": SEASON}
    resp = requests.get(url, headers=HEADERS, params=params)
    resp.raise_for_status()
    return resp.json().get("response", [])

# — Inserción en la tabla match_statistics —
def insert_statistics(stats, match_map, player_map):
    """
    stats: lista de dicts de la API
    team_map, match_map, player_map: mapeos { rapidapi → interno }
    """
    with conn.cursor() as cur:
        vals = []
        for s in stats:
            api_match_id  = s["game"]["id"]
            api_player_id = s["player"]["id"]

            # Traducimos a IDs internos
            internal_match_id  = match_map.get(api_match_id)
            internal_player_id = player_map.get(api_player_id)
            if internal_match_id is None or internal_player_id is None:
                print(f"⚠️ Sin mapeo para match {api_match_id} o player {api_player_id}, se omite.")
                continue

            # Mapeo de campos
            points    = s.get("points")
            off_rebounds   = s.get("offReb")
            def_rebounds   = s.get("defReb")
            tot_reb   = s.get("totReb")  # puedes ignorar totReb si no lo guardas
            assists   = s.get("assists")
            steals    = s.get("steals")
            blocks    = s.get("blocks")
            turnovers = s.get("turnovers")
            fouls     = s.get("pFouls")
            minutes   = int(s.get("min") or 0)
            mins_played = float(s.get("min")) if s.get("min") else None
            fgm       = s.get("fgm")
            fga       = s.get("fga")
            tpm       = s.get("tpm")
            tpa       = s.get("tpa")
            ftm       = s.get("ftm")
            fta       = s.get("fta")
            plusminus = int(s.get("plusMinus") or 0)

            vals.append((
                # id BIGINT (identity) -> omitimos, dejamos que se genere
                internal_match_id,
                api_match_id,
                internal_player_id,
                api_player_id,
                points,
                tot_reb,
                assists,
                steals,
                blocks,
                mins_played,
                fga,
                fgm,
                tpm,
                tpa,
                ftm,
                fta,
                fouls,
                turnovers,
                off_rebounds,
                def_rebounds,
                minutes,
                plusminus
            ))

        sql = """
        INSERT INTO match_statistics
          (match_id, match_rapidapi_id,
           player_id, player_rapidapi_id,
           points, rebounds, assists, steals, blocks,
           minutes_played, field_goals_attempted, field_goals_made,
           three_points_made, three_points_attempted,
           free_throws_made, free_throws_attempted,
           fouls, turnovers, off_rebounds, def_rebounds,
           minutes, plusminus)
        VALUES %s
        ON CONFLICT (match_rapidapi_id, player_rapidapi_id, match_id, player_id) DO NOTHING
        """
        execute_values(cur, sql, vals)
    conn.commit()

# 1) Cargamos mapeos dinámicos desde la BBDD
team_map   = load_mapping("teams")
match_map  = load_mapping("matches")
player_map = load_mapping("players")

# 2) Para cada equipo en tu BBDD, recogemos estadísticas
for external_team_id, internal_team_id in team_map.items():
    stats = fetch_team_stats(external_team_id)
    print(f"Equipo API {external_team_id} → interno {internal_team_id}: {len(stats)} registros")
    insert_statistics(stats, match_map, player_map)
    time.sleep(RATE_LIMIT_PAUSE)

print("Carga de match_statistics completada.")