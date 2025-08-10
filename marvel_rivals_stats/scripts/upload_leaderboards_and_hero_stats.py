import os
import time
import json
import logging
import requests
import boto3
from botocore.exceptions import ClientError

# --------- Configuration ---------
BUCKET_NAME = os.environ.get('BUCKET_NAME')
if not BUCKET_NAME:
    raise EnvironmentError("Missing required environment variable: BUCKET_NAME")

S3_BASE_PATH = 'leaderboards'
CURRENT_SEASON = '3.5'
DEVICES = ['pc', 'psn', 'xbox']
PLAYER_LEADERBOARD_URL = 'https://marvelrivalsapi.com/api/v2/players/leaderboard'
HERO_STATS_URL = 'https://marvelrivalsapi.com/api/v1/heroes/hero/{hero_id}/stats'
HERO_LEADERBOARD_URL = 'https://marvelrivalsapi.com/api/v1/heroes/leaderboard/{hero_id}'
HERO_IDS_S3_PATH = 'data/heroes/heroes.json'
HEADERS = {
    'x-api-key': os.environ.get('API_KEY'),
    'Content-Type': 'application/json'
}
TIMEOUT = 30

s3 = boto3.client('s3')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# --------- Helpers ---------
def fetch_json(url, params=None):
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logging.error(f"❌ Error fetching {url}: {e}")
        return None


def s3_exists(key):
    try:
        s3.head_object(Bucket=BUCKET_NAME, Key=key)
        return True
    except ClientError:
        return False


def save_to_s3(data, key):
    try:
        s3.put_object(Body=json.dumps(data), Bucket=BUCKET_NAME, Key=key)
        logging.info(f"✅ Uploaded to S3: {key}")
    except Exception as e:
        logging.error(f"❌ Failed to upload {key} to S3: {e}")

def load_hero_ids():
    try:
        obj = s3.get_object(Bucket=BUCKET_NAME, Key=HERO_IDS_S3_PATH)
        content = json.load(obj["Body"])

        # ✅ Your file is a list, not a dict
        if isinstance(content, list):
            hero_ids = [hero["id"] for hero in content if "id" in hero]
            return hero_ids
        else:
            logging.error("❌ Unexpected heroes.json format (not a list)")
            return []

    except Exception as e:
        logging.error(f"❌ Failed to load hero metadata from S3: {e}")
        return []

# --------- Sync Logic ---------
def sync_player_leaderboard(season, is_current):
    limit = 50 if is_current else 100  # keeping your existing limits
    for device in DEVICES:
        key = f"{S3_BASE_PATH}/player/{'current' if is_current else 'past'}/season_{season}/{device}.json"
        if not is_current and s3_exists(key):
            logging.info(f"⏭️ Skipping existing past leaderboard: {key}")
            continue

        logging.info(f"📥 Fetching player leaderboard: season={season}, device={device}")
        params = {'device': device, 'limit': limit}
        if not is_current:
            params['season'] = season  # omit for current
        data = fetch_json(PLAYER_LEADERBOARD_URL, params=params)
        if data:
            save_to_s3(data, key)


def sync_hero_stats(season, is_current, hero_ids):
    for device in DEVICES:
        for hero_id in hero_ids:
            key = f"{S3_BASE_PATH}/heroes/stats/{'current' if is_current else 'past'}/season_{season}/{device}/hero_{hero_id}.json"
            if not is_current and s3_exists(key):
                logging.info(f"⏭️ Skipping existing past hero stats: {key}")
                continue

            url = HERO_STATS_URL.format(hero_id=hero_id)
            params = {'device': device}
            if not is_current:
                params['season'] = season  # omit for current
            logging.info(f"📥 Fetching hero stats: season={season}, device={device}, hero_id={hero_id}")
            data = fetch_json(url, params=params)
            if data:
                save_to_s3(data, key)
            time.sleep(1)
def sync_player_leaderboard(season, is_current):
    limit = 50 if is_current else 100  # keeping your existing limits
    for device in DEVICES:
        key = f"{S3_BASE_PATH}/player/{'current' if is_current else 'past'}/season_{season}/{device}.json"
        if not is_current and s3_exists(key):
            logging.info(f"⏭️ Skipping existing past leaderboard: {key}")
            continue

        logging.info(f"📥 Fetching player leaderboard: season={season}, device={device}")
        params = {'device': device, 'limit': limit}
        if not is_current:
            params['season'] = season  # omit for current
        data = fetch_json(PLAYER_LEADERBOARD_URL, params=params)
        if data:
            save_to_s3(data, key)


def sync_hero_stats(season, is_current, hero_ids):
    for device in DEVICES:
        for hero_id in hero_ids:
            key = f"{S3_BASE_PATH}/heroes/stats/{'current' if is_current else 'past'}/season_{season}/{device}/hero_{hero_id}.json"
            if not is_current and s3_exists(key):
                logging.info(f"⏭️ Skipping existing past hero stats: {key}")
                continue

            url = HERO_STATS_URL.format(hero_id=hero_id)
            params = {'device': device}
            if not is_current:
                params['season'] = season  # omit for current
            logging.info(f"📥 Fetching hero stats: season={season}, device={device}, hero_id={hero_id}")
            data = fetch_json(url, params=params)
            if data:
                save_to_s3(data, key)
            time.sleep(1)

def sync_player_leaderboard(season, is_current):
    limit = 50 if is_current else 100  # keeping your existing limits
    for device in DEVICES:
        key = f"{S3_BASE_PATH}/player/{'current' if is_current else 'past'}/season_{season}/{device}.json"
        if not is_current and s3_exists(key):
            logging.info(f"⏭️ Skipping existing past leaderboard: {key}")
            continue

        logging.info(f"📥 Fetching player leaderboard: season={season}, device={device}")
        params = {'device': device, 'limit': limit}
        if not is_current:
            params['season'] = season  # omit for current
        data = fetch_json(PLAYER_LEADERBOARD_URL, params=params)
        if data:
            save_to_s3(data, key)


def sync_hero_stats(season, is_current, hero_ids):
    for device in DEVICES:
        for hero_id in hero_ids:
            key = f"{S3_BASE_PATH}/heroes/stats/{'current' if is_current else 'past'}/season_{season}/{device}/hero_{hero_id}.json"
            if not is_current and s3_exists(key):
                logging.info(f"⏭️ Skipping existing past hero stats: {key}")
                continue

            url = HERO_STATS_URL.format(hero_id=hero_id)
            params = {'device': device}
            if not is_current:
                params['season'] = season  # omit for current
            logging.info(f"📥 Fetching hero stats: season={season}, device={device}, hero_id={hero_id}")
            data = fetch_json(url, params=params)
            if data:
                save_to_s3(data, key)
            time.sleep(1)

def sync_hero_leaderboard(season, is_current, hero_ids):
    for device in DEVICES:
        for hero_id in hero_ids:
            key = f"{S3_BASE_PATH}/heroes/leaderboard/{'current' if is_current else 'past'}/season_{season}/{device}/hero_{hero_id}.json"
            if not is_current and s3_exists(key):
                logging.info(f"⏭️ Skipping existing past hero leaderboard: {key}")
                continue

            url = HERO_LEADERBOARD_URL.format(hero_id=hero_id)
            params = {'device': device}
            if not is_current:
                params['season'] = season  # omit for current
            logging.info(f"📥 Fetching hero leaderboard: season={season}, device={device}, hero_id={hero_id}")
            data = fetch_json(url, params=params)
            if data:
                save_to_s3(data, key)
            time.sleep(1)

# --------- Entry Point ---------
def run_sync():
    logging.info(f"🚀 This sync assumes current season is {CURRENT_SEASON}. Update CURRENT_SEASON when new seasons release.")
    logging.info("🧠 Starting full seasonal sync...")

    hero_ids = load_hero_ids()
    if not hero_ids:
        logging.error("⚠️ Aborting: No hero IDs loaded.")
        return

    # Past Seasons
    for season in ['0', '1', '1.5', '2', '2.5', '3']:
        logging.info(f"🔁 Syncing past season {season} ...")
        sync_player_leaderboard(season, is_current=False)
        sync_hero_stats(season, is_current=False, hero_ids=hero_ids)
        sync_hero_leaderboard(season, is_current=False, hero_ids=hero_ids)

    # Current Season
    logging.info(f"🟢 Syncing current season {CURRENT_SEASON} ...")
    sync_player_leaderboard(CURRENT_SEASON, is_current=True)
    sync_hero_stats(CURRENT_SEASON, is_current=True, hero_ids=hero_ids)
    sync_hero_leaderboard(CURRENT_SEASON, is_current=True, hero_ids=hero_ids)


if __name__ == "__main__":
    run_sync()
