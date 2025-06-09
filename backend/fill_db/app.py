import os
import time
import requests
import psycopg2
from psycopg2.extras import execute_values
import re
import csv
import sys
from difflib import SequenceMatcher

# Usar dotenv directamente para el script de fill_db
from dotenv import load_dotenv, find_dotenv

# Cargar variables de entorno desde el archivo .env en el directorio backend
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

print(f"Cargando .env desde: {env_path}")

# Variables necesarias para el script
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Verificar que tenemos las variables esenciales
required_vars = {
    "DB_NAME": DB_NAME,
    "DB_USER": DB_USER,
    "DB_PASSWORD": DB_PASSWORD,
    "DB_HOST": DB_HOST,
    "DB_PORT": DB_PORT
}

missing_vars = [var for var, value in required_vars.items() if not value]
if missing_vars:
    print(f"❌ Faltan variables de entorno: {', '.join(missing_vars)}")
    print("Variables encontradas:")
    for var, value in required_vars.items():
        print(f"  {var}: {'✅' if value else '❌'}")
    sys.exit(1)

print("✅ Variables de entorno cargadas correctamente")

# Configuración de base de datos
DB_CONFIG = {
    'dbname': DB_NAME,
    'user': DB_USER,
    'password': DB_PASSWORD,
    'host': DB_HOST,
    'port': DB_PORT
}

# Conexión a PostgreSQL
conn = psycopg2.connect(**DB_CONFIG)

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

# SEASON = "2024"
# RATE_LIMIT_PAUSE = 12  # segundos entre llamadas

# # — Funciones de carga de mapeos —
# def load_mapping(table: str):
#     """
#     Devuelve dict { rapidapi_id: internal_id } para la tabla dada.
#     """
#     with conn.cursor() as cur:
#         cur.execute(f"SELECT id, rapidapi_id FROM {table};")
#         return { rapidapi_id: id_ for id_, rapidapi_id in cur.fetchall() }
    

# # — Función que llama a la API de estadísticas por equipo —
# def fetch_team_stats(external_team_id: int):
#     url = f"https://{API_HOST}/players/statistics"
#     params = {"team": external_team_id, "season": SEASON}
#     resp = requests.get(url, headers=HEADERS, params=params)
#     resp.raise_for_status()
#     return resp.json().get("response", [])

# # — Inserción en la tabla match_statistics —
# def insert_statistics(stats, match_map, player_map):
#     """
#     stats: lista de dicts de la API
#     team_map, match_map, player_map: mapeos { rapidapi → interno }
#     """
#     with conn.cursor() as cur:
#         vals = []
#         for s in stats:
#             api_match_id  = s["game"]["id"]
#             api_player_id = s["player"]["id"]

#             # Traducimos a IDs internos
#             internal_match_id  = match_map.get(api_match_id)
#             internal_player_id = player_map.get(api_player_id)
#             if internal_match_id is None or internal_player_id is None:
#                 print(f"⚠️ Sin mapeo para match {api_match_id} o player {api_player_id}, se omite.")
#                 continue

#             # Mapeo de campos
#             points    = s.get("points")
#             off_rebounds   = s.get("offReb")
#             def_rebounds   = s.get("defReb")
#             tot_reb   = s.get("totReb")  # puedes ignorar totReb si no lo guardas
#             assists   = s.get("assists")
#             steals    = s.get("steals")
#             blocks    = s.get("blocks")
#             turnovers = s.get("turnovers")
#             fouls     = s.get("pFouls")
#             minutes   = int(s.get("min") or 0)
#             mins_played = float(s.get("min")) if s.get("min") else None
#             fgm       = s.get("fgm")
#             fga       = s.get("fga")
#             tpm       = s.get("tpm")
#             tpa       = s.get("tpa")
#             ftm       = s.get("ftm")
#             fta       = s.get("fta")
#             plusminus = int(s.get("plusMinus") or 0)

#             vals.append((
#                 # id BIGINT (identity) -> omitimos, dejamos que se genere
#                 internal_match_id,
#                 api_match_id,
#                 internal_player_id,
#                 api_player_id,
#                 points,
#                 tot_reb,
#                 assists,
#                 steals,
#                 blocks,
#                 mins_played,
#                 fga,
#                 fgm,
#                 tpm,
#                 tpa,
#                 ftm,
#                 fta,
#                 fouls,
#                 turnovers,
#                 off_rebounds,
#                 def_rebounds,
#                 minutes,
#                 plusminus
#             ))

#         sql = """
#         INSERT INTO match_statistics
#           (match_id, match_rapidapi_id,
#            player_id, player_rapidapi_id,
#            points, rebounds, assists, steals, blocks,
#            minutes_played, field_goals_attempted, field_goals_made,
#            three_points_made, three_points_attempted,
#            free_throws_made, free_throws_attempted,
#            fouls, turnovers, off_rebounds, def_rebounds,
#            minutes, plusminus)
#         VALUES %s
#         ON CONFLICT (match_rapidapi_id, player_rapidapi_id, match_id, player_id) DO NOTHING
#         """
#         execute_values(cur, sql, vals)
#     conn.commit()

# # 1) Cargamos mapeos dinámicos desde la BBDD
# team_map   = load_mapping("teams")
# match_map  = load_mapping("matches")
# player_map = load_mapping("players")

# # 2) Para cada equipo en tu BBDD, recogemos estadísticas
# for external_team_id, internal_team_id in team_map.items():
#     stats = fetch_team_stats(external_team_id)
#     print(f"Equipo API {external_team_id} → interno {internal_team_id}: {len(stats)} registros")
#     insert_statistics(stats, match_map, player_map)
#     time.sleep(RATE_LIMIT_PAUSE)

# print("Carga de match_statistics completada.")

try:
    conn = psycopg2.connect(**DB_CONFIG)
    print("✅ Conexión a base de datos exitosa")
except Exception as e:
    print(f"❌ Error conectando a la base de datos: {e}")
    sys.exit(1)

def load_nba_players_dataset(csv_path):
    """
    Carga el dataset CSV y crea un mapeo de nombres a playerid
    """
    player_mapping = {}
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Crear nombre completo
                full_name = f"{row['fname']} {row['lname']}".strip()
                player_id = row['playerid']
                
                # Almacenar en el mapeo
                player_mapping[full_name.lower()] = player_id
                
                # También almacenar versiones alternativas del nombre
                # Sin sufijos (Jr., Sr., etc.)
                clean_name = re.sub(r'\s+(Jr\.?|Sr\.?|III|II|IV)$', '', full_name, flags=re.IGNORECASE)
                if clean_name.lower() != full_name.lower():
                    player_mapping[clean_name.lower()] = player_id
        
        print(f"✅ Cargados {len(player_mapping)} jugadores del dataset")
        return player_mapping
        
    except FileNotFoundError:
        print(f"❌ No se encontró el archivo CSV: {csv_path}")
        return {}
    except Exception as e:
        print(f"❌ Error leyendo el CSV: {e}")
        return {}

def normalize_name_for_matching(name):
    """
    Normaliza nombres para mejorar el matching
    """
    # Eliminar sufijos
    name = re.sub(r'\s+(Jr\.?|Sr\.?|III|II|IV)$', '', name, flags=re.IGNORECASE)
    
    # Limpiar caracteres especiales y convertir a minúsculas
    name = re.sub(r'[^\w\s]', '', name.lower())
    
    # Eliminar espacios extra
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name

def find_best_match(db_name, player_mapping, threshold=0.8):
    """
    Encuentra la mejor coincidencia para un nombre de la base de datos
    """
    normalized_db_name = normalize_name_for_matching(db_name)
    
    # Búsqueda exacta primero
    if normalized_db_name in player_mapping:
        return player_mapping[normalized_db_name]
    
    # Búsqueda por similitud
    best_match = None
    best_score = 0
    
    for csv_name, player_id in player_mapping.items():
        # Calcular similitud
        similarity = SequenceMatcher(None, normalized_db_name, csv_name).ratio()
        
        if similarity > best_score and similarity >= threshold:
            best_score = similarity
            best_match = player_id
    
    return best_match

def verify_nba_image_exists(player_id):
    """
    Verifica si existe la imagen de NBA.com para el ID dado
    """
    image_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"
    try:
        response = requests.head(image_url, timeout=5)
        return response.status_code == 200
    except:
        return False

def update_player_images_with_dataset():
    """
    Actualiza las URLs de imágenes usando el dataset CSV para mapear nombres a IDs de NBA.com
    """
    # Ruta al archivo CSV (ajustar según tu ubicación)
    csv_path = r"C:\Users\practicas\Downloads\archive (6)\players.csv"
    
    # Cargar el mapeo de jugadores
    player_mapping = load_nba_players_dataset(csv_path)
    
    if not player_mapping:
        print("❌ No se pudo cargar el dataset. Abortando.")
        return
    
    with conn.cursor() as cur:
        # Obtener jugadores sin imagen
        cur.execute("""
            SELECT id, name, rapidapi_id 
            FROM players 
            WHERE url_pic IS NULL OR url_pic = ''
            ORDER BY id
            LIMIT 500
        """)  # Procesar más jugadores ya que es más eficiente
        
        players = cur.fetchall()
        
        if not players:
            print("No hay jugadores sin imagen para procesar.")
            return
        
        print(f"Procesando {len(players)} jugadores...")
        
        updated_count = 0
        exact_matches = 0
        fuzzy_matches = 0
        failed_count = 0
        
        for player_id, name, rapidapi_id in players:
            print(f"🏀 Procesando: {name}")
            
            # Buscar coincidencia en el dataset
            nba_player_id = find_best_match(name, player_mapping)
            
            if nba_player_id:
                # Verificar si la imagen existe
                if verify_nba_image_exists(nba_player_id):
                    image_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{nba_player_id}.png"
                    print(f"  ✅ Imagen encontrada con ID {nba_player_id}: {image_url}")
                    
                    # Actualizar en base de datos
                    cur.execute("""
                        UPDATE players 
                        SET url_pic = %s 
                        WHERE id = %s
                    """, (image_url, player_id))
                    
                    updated_count += 1
                    
                    # Verificar tipo de coincidencia
                    normalized_name = normalize_name_for_matching(name)
                    if normalized_name in player_mapping:
                        exact_matches += 1
                    else:
                        fuzzy_matches += 1
                else:
                    print(f"  ⚠️ ID encontrado ({nba_player_id}) pero imagen no existe para: {name}")
                    failed_count += 1
            else:
                print(f"  ❌ No se encontró coincidencia para: {name}")
                failed_count += 1
            
            # Pausa breve para no sobrecargar
            time.sleep(0.5)
        
        # Actualizar jugadores que no encontramos con placeholder
        if failed_count > 0:
            print(f"\n🔄 Actualizando {failed_count} jugadores sin imagen con placeholder...")
            
            cur.execute("""
                SELECT id, name 
                FROM players 
                WHERE url_pic IS NULL OR url_pic = ''
                LIMIT %s
            """, (failed_count,))
            
            failed_players = cur.fetchall()
            
            for player_id, name in failed_players:
                placeholder_url = "https://cdn.nba.com/headshots/nba/latest/1040x760/logoman.png"
                cur.execute("""
                    UPDATE players 
                    SET url_pic = %s 
                    WHERE id = %s
                """, (placeholder_url, player_id))
    
    conn.commit()
    
    print(f"\n📊 Resumen:")
    print(f"  - Imágenes encontradas: {updated_count}")
    print(f"    • Coincidencias exactas: {exact_matches}")
    print(f"    • Coincidencias aproximadas: {fuzzy_matches}")
    print(f"  - No encontrados: {failed_count}")
    print(f"  - Total procesados: {len(players)}")
    print(f"  - Tasa de éxito: {(updated_count/len(players)*100):.1f}%")

def test_dataset_matching():
    """
    Función de prueba para verificar el matching del dataset
    """
    csv_path = r"C:\Users\practicas\Downloads\archive (6)\players.csv"
    player_mapping = load_nba_players_dataset(csv_path)
    
    # Algunos nombres de prueba
    test_names = [
        "LeBron James",
        "Stephen Curry", 
        "Buddy Hield",
        "Luka Doncic",
        "Giannis Antetokounmpo"
    ]
    
    print("\n🧪 Probando matching del dataset:")
    for name in test_names:
        player_id = find_best_match(name, player_mapping)
        if player_id:
            image_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"
            exists = verify_nba_image_exists(player_id)
            print(f"  {name} → ID: {player_id}, Imagen existe: {'✅' if exists else '❌'}")
        else:
            print(f"  {name} → ❌ No encontrado")

# Ejecutar la función automáticamente
if __name__ == "__main__":
    # Primero hacer una prueba
    test_dataset_matching()
    
    # Luego ejecutar la actualización completa
    print("\n" + "="*50)
    update_player_images_with_dataset()