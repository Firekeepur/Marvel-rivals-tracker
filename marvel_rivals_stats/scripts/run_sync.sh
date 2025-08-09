#!/bin/bash

# === CONFIGURATION ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/upload_metadata.py"
LOG_DIR="$SCRIPT_DIR/logs"
FORCE_FILE="$SCRIPT_DIR/.force_once"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
S3_BUCKET="marvel-rivals-data"

# === CREATE LOG FOLDER IF NEEDED ===
mkdir -p "$LOG_DIR"

# === DETERMINE MODE ===
FORCE=false
TEST=false

# Detect interactive terminal (manual run)
if [ -t 1 ]; then
  FORCE=true
fi

# Process flags
if [[ "$1" == "--force" ]]; then
  FORCE=true
elif [[ "$1" == "--test" ]]; then
  TEST=true
  FORCE=false
fi

# Handle one-time force sync flag
if [ -f "$FORCE_FILE" ]; then
  FORCE=true
  rm -f "$FORCE_FILE"
  echo "🧨 One-time force sync triggered via .force_once"
fi

# === BUILD COMMAND ===
CMD="/usr/bin/python3 \"$PYTHON_SCRIPT\""
[ "$FORCE" = true ] && CMD="$CMD --force"

# === RUN PYTHON SCRIPT WITHOUT REDIRECT ===
eval "$CMD"

# === FIND & UPLOAD PYTHON LOG FILE ===
PY_LOG_FILE=$(ls -t "$LOG_DIR"/upload_log_*.txt | head -n 1)
S3_LOG_PATH="s3://$S3_BUCKET/logs/$(basename "$PY_LOG_FILE")"

aws s3 cp "$PY_LOG_FILE" "$S3_LOG_PATH" --sse AES256

if [ $? -eq 0 ]; then
  echo "☁️ Python log uploaded to $S3_LOG_PATH"
else
  echo "❌ Failed to upload Python log to S3"
fi

# === OPTIONAL: Upload latest log copy ===
aws s3 cp "$PY_LOG_FILE" "s3://$S3_BUCKET/logs/latest.log" --sse AES256

# === CLEANUP: Delete local logs older than 7 days ===
find "$LOG_DIR" -type f -name "*.txt" -mtime +7 -exec rm {} \;

echo "🧹 Local logs older than 7 days have been deleted."

# === FINAL STATUS ===
if [ "$TEST" = true ]; then
  echo "🧪 Test sync (non-force) complete."
elif [ "$FORCE" = true ]; then
  echo "✅ Forced sync complete."
else
  echo "ℹ️ Regular sync complete."
fi
