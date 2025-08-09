import os, json
print("Jobs container is alive. Wire your script here.")
print("BUCKET_NAME:", os.environ.get("BUCKET_NAME"))
print("MARVEL_API_KEY set?", bool(os.environ.get("MARVEL_API_KEY")))
