import os
import json
import requests
import boto3
import argparse
import logging
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

# === Configuration ===
API_KEY = "924831a22876f819a2a9088e938886d9cdb363ec250abbd2be7c8621a70785b8"
BASE_URL = "https://marvelrivalsapi.com/api/v1"
IMAGE_BASE_URL = "https://marvelrivalsapi.com"
BUCKET_NAME = "marvel-rivals-data"
LOG_DIR = "logs"
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_FILE = os.path.join(LOG_DIR, f"upload_log_{timestamp}.txt")
MAX_WORKERS = 10

# Initialize S3
s3 = boto3.client("s3")

ENDPOINTS = {
    "heroes": "data/heroes/heroes.json",
    "maps": "data/maps/maps.json",
    "patch-notes": "data/patch_notes/patch_notes.json"
}

# === Setup Logging ===
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(filename=LOG_FILE, filemode='w', level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")

def log(msg, level="info"):
    getattr(logging, level)(msg)

def print_status(msg, status="info"):
    icons = {
        "success": "✅",
        "error": "❌",
        "info": "ℹ️",
        "warn": "⚠️"
    }
    print(f"{icons.get(status, 'ℹ️')} {msg}")

def safe_basename(path):
    return os.path.basename(path) if isinstance(path, str) else ""

def download_and_upload_image(image_url, s3_path, force=False):
    if not image_url:
        return "skipped"

    full_url = image_url if image_url.startswith("http") else IMAGE_BASE_URL + image_url
    try:
        if not force:
            result = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=s3_path)
            if "Contents" in result:
                log(f"Skipped (exists): {s3_path}")
                return "skipped"

        response = requests.get(full_url, stream=True)
        response.raise_for_status()

        s3.upload_fileobj(
            response.raw,
            BUCKET_NAME,
            s3_path,
            ExtraArgs={
                "ContentType": response.headers.get("Content-Type", "image/webp"),
                "ServerSideEncryption": "AES256"
            }
        )
        log(f"Uploaded: {s3_path}")
        return "uploaded"

    except Exception as e:
        error_message = f"❌ Error uploading image\n  → URL: {full_url}\n  → S3 Path: {s3_path}\n  → Error: {str(e)}"
        print_status(error_message, "error")
        log(error_message, level="error")
        return "error"

def handle_images(data, force):
    upload_tasks = []

    def schedule(url, s3_path):
        if url:
            upload_tasks.append((url, s3_path))

    # === HEROES ===
    for hero in data.get("heroes", []):
        url = hero.get("imageUrl")
        schedule(url, f"images/heroes/card/{safe_basename(url)}")

        for t in hero.get("transformations", []):
            url = t.get("icon")
            schedule(url, f"images/heroes/transformations/{safe_basename(url)}")

        for c in hero.get("costumes", []):
            url = c.get("icon")
            schedule(url, f"images/heroes/costumes/{safe_basename(url)}")

        for a in hero.get("abilities", []):
            url = a.get("icon")
            schedule(url, f"images/heroes/abilities/{safe_basename(url)}")

    # === MAPS ===
    for map_ in data.get("maps", {}).get("maps", []):
        if isinstance(map_, dict):
            for img in map_.get("images", []):
                if img:
                    path = urlparse(img).path
                    if "/maps/" in path:
                        subpath = path.split("/maps/", 1)[-1]
                        s3_path = f"images/maps/{subpath}"
                        schedule(img, s3_path)
                    else:
                        print_status(f"⚠️ Unexpected map image path: {img}", "warn")
                        log(f"Skipped unrecognized map path format: {img}", level="warn")

    # === PATCH NOTES ===
    for note in data.get("patchNotes", []):
        path = note.get("imagePath")
        schedule(path, f"images/patch_notes/{safe_basename(path)}")

    # === EXECUTE PARALLEL UPLOADS ===
    uploaded = skipped = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        results = executor.map(lambda t: download_and_upload_image(*t, force=force), upload_tasks)
        for res in results:
            if res == "uploaded":
                uploaded += 1
            elif res == "skipped":
                skipped += 1

    return uploaded, skipped

def fetch_and_upload_metadata(force=False):
    print("📦 Marvel Rivals data sync started...")
    print(f"Force update: {'ENABLED' if force else 'DISABLED'} (use --force to override caching)\n")

    all_data = {}

    for endpoint, s3_path in ENDPOINTS.items():
        url = f"{BASE_URL}/{endpoint}"
        try:
            response = requests.get(url, headers={
                "x-api-key": API_KEY,
                "Content-Type": "application/json"
            })
            response.raise_for_status()
            json_data = response.json()

            key = endpoint.replace("-", "")
            if isinstance(json_data, dict) and "data" in json_data:
                all_data[key] = json_data["data"]
            else:
                all_data[key] = json_data

            # Upload JSON metadata
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_path,
                Body=json.dumps(json_data, indent=2).encode("utf-8"),
                ContentType="application/json",
                ServerSideEncryption="AES256"
            )
            print_status(f"{endpoint} metadata JSON upload successful", "success")
            log(f"Uploaded JSON metadata to {s3_path}")

        except Exception as e:
            error_msg = f"Error fetching or uploading metadata for {endpoint}:\n  → URL: {url}\n  → Error: {str(e)}"
            print_status(error_msg, "error")
            log(error_msg, level="error")

    # === Now handle images ===
    uploaded, skipped = handle_images(all_data, force=force)

    print("\nSummary:")
    print(f"🖼️  New images uploaded: {uploaded}")
    print(f"📁 Skipped existing images: {skipped}")
    print(f"📄 Log file saved at: {os.path.abspath(LOG_FILE)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync Marvel Rivals metadata and images to S3")
    parser.add_argument('--force', action='store_true', help='Force re-download and overwrite of all images')
    args = parser.parse_args()
    fetch_and_upload_metadata(force=args.force)
