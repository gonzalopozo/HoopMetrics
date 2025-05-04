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
#     nba_only = [
#         team for team in all_teams
#         if team.get("nbaFranchise", False) is True
#     ]
#     return nba_only

# def insert_teams(teams):
#     with conn.cursor() as cur:
#         vals = [
#             (t["name"], t["code"], t["leagues"]["standard"]["conference"],
#              t["leagues"]["standard"]["division"], "", t["city"])
#             for t in teams
#         ]
#         sql = """
#         INSERT INTO teams(full_name, abbreviation, conference, division, stadium, city)
#         VALUES %s
#         ON CONFLICT (id) DO NOTHING
#         """
#         execute_values(cur, sql, vals)
#     conn.commit()

# teams = get_nba_franchises()
# print(teams)
# insert_teams(teams)
# print(f"Insertados {len(teams)} equipos.")

def fetch_players_for_team(season: int, team_id: int):
    """
    Devuelve la lista de jugadores de un equipo concreto para la temporada dada.
    """
    url = f"https://{API_HOST}/players"
    params = {
        "season": season,
        "team": team_id
    }
    resp = requests.get(url, headers=HEADERS, params=params)
    return resp.json().get("response", [])

DEFAULT_BIRTH = "1970-01-01"

def insert_players(players: list, team_id: int):
    with conn.cursor() as cur:
        vals = []
        for p in players:
            birth = p.get("birth", {}).get("date") or DEFAULT_BIRTH

            std      = p.get("leagues", {}).get("standard", {})
            position = std.get("pos") or ""
            jersey   = std.get("jersey") or None

            vals.append((
                f"{p['firstname']} {p['lastname']}",
                birth,
                float(p["height"]["meters"]) if p["height"]["meters"] else None,
                float(p["weight"]["kilograms"]) if p["weight"]["kilograms"] else None,
                position,
                jersey,
                team_id
            ))

        sql = """
        INSERT INTO players
          (name, birth_date, height, weight, position, number, current_team_id)
        VALUES %s
        ON CONFLICT (id) DO NOTHING
        """
        execute_values(cur, sql, vals)
    conn.commit()


season = 2024
team_ids = [[1, 1], [2, 2], [4, 3], [5, 4], [6, 5], [7, 6], [8, 7], [9, 8], [10, 9], [11, 10], [14, 11], [15, 12], [16, 13], [17, 14], [19, 15], [20, 16], [21, 17], [22, 18], [23, 19], [24, 20], [25, 21], [26, 22], [27, 23], [28, 24], [29, 25], [30, 26], [31, 27],  [38, 28], [40, 29], [41, 30]]
max_requests_per_day = 100
used_requests = 63

for team_id in team_ids:
    if used_requests >= max_requests_per_day:
        print("Límite de peticiones alcanzado. Deteniendo.")
        break

    players = fetch_players_for_team(season, team_id[0])
    print(players)
    print(f"Equipo {team_id[0]}: recuperados {len(players)} jugadores.")
    insert_players(players, team_id[1])

    used_requests += 1
    # Pausa breve para evitar ráfagas
    time.sleep(10)

print(f"Total de requests realizadas hoy: {used_requests}")
