#!/usr/bin/env bash
set -euo pipefail

umask 077

VOLUME_NAME="${SENSITIVE_VOLUME_NAME:-server_didaugio_sensitive_data}"
BACKUP_DIR="${BACKUP_DEST_DIR:-/var/backups/didaugio/sensitive}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

case "${RETENTION_DAYS}" in
  ''|*[!0-9]*)
    echo "[backup][FATAL] BACKUP_RETENTION_DAYS must be a non-negative integer." >&2
    exit 1
    ;;
esac
case "${BACKUP_DIR}" in
  /*) ;;
  *)
    echo "[backup][FATAL] BACKUP_DEST_DIR must be an absolute path." >&2
    exit 1
    ;;
esac

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TARGET_ARCHIVE="sensitive_${TIMESTAMP}.tar.gz"
TARGET_PATH="${BACKUP_DIR}/${TARGET_ARCHIVE}"
LATEST_LINK="${BACKUP_DIR}/sensitive_latest.tar.gz"
TEMP_PATH="${BACKUP_DIR}/.${TARGET_ARCHIVE}.partial"
TEMP_BASENAME="$(basename "${TEMP_PATH}")"

cleanup() {
  rm -f -- "${TEMP_PATH}"
}
trap cleanup EXIT

if ! docker volume inspect "${VOLUME_NAME}" >/dev/null 2>&1; then
  # One-time compatibility for deployments created before the Compose volume was pinned.
  if [ "${VOLUME_NAME}" = "server_didaugio_sensitive_data" ] && docker volume inspect "didaugio_sensitive_data" >/dev/null 2>&1; then
    VOLUME_NAME="didaugio_sensitive_data"
    echo "[backup][WARN] Using legacy volume name '${VOLUME_NAME}'. Pin/migrate it before the next deploy." >&2
  else
    echo "[backup][FATAL] Docker volume '${VOLUME_NAME}' not found; refusing to back up an unknown volume." >&2
    exit 1
  fi
fi

mkdir -p -- "${BACKUP_DIR}"
chmod 700 -- "${BACKUP_DIR}"

# Keep the lock inside the owner-only backup directory; /tmp is vulnerable to symlink pre-creation.
LOCK_FILE="${BACKUP_DIR}/.backup.lock"
exec 200>"${LOCK_FILE}"
if ! flock -n 200; then
  echo "[backup][ERROR] Backup already running. Exiting." >&2
  exit 1
fi

# Sensitive storage must contain encrypted payloads; a tar header alone is not a valid backup.
ENCRYPTED_FILE_COUNT="$(docker run --rm \
  -v "${VOLUME_NAME}:/source:ro" \
  alpine:3.20 \
  sh -c "find /source -type f -name '*.enc' -print | wc -l | tr -d ' '")"
if [ "${ENCRYPTED_FILE_COUNT}" -eq 0 ]; then
  echo "[backup][FATAL] Sensitive volume '${VOLUME_NAME}' contains no .enc files; refusing empty backup." >&2
  exit 1
fi

echo "[backup] Backing up volume '${VOLUME_NAME}' to '${TARGET_PATH}'..."

docker run --rm \
  -v "${VOLUME_NAME}:/source:ro" \
  -v "${BACKUP_DIR}:/backup" \
  alpine:3.20 \
  sh -c "tar -czf /backup/${TEMP_BASENAME} -C /source ."

# The archive is created atomically: a killed container can only leave the partial file.
chmod 600 -- "${TEMP_PATH}"
if [ ! -s "${TEMP_PATH}" ] || ! tar -tzf "${TEMP_PATH}" >/dev/null; then
  echo "[backup][FATAL] Backup archive failed integrity validation." >&2
  exit 1
fi
mv -f -- "${TEMP_PATH}" "${TARGET_PATH}"
ln -sfn -- "${TARGET_ARCHIVE}" "${LATEST_LINK}"

ARCHIVE_SIZE="$(du -h -- "${TARGET_PATH}" | cut -f1)"
ITEM_COUNT="$(tar -tzf "${TARGET_PATH}" | wc -l | tr -d ' ')"
echo "[backup] SUCCESS: ${TARGET_ARCHIVE} created (${ARCHIVE_SIZE}, ${ITEM_COUNT} items; ${ENCRYPTED_FILE_COUNT} encrypted files)."

find "${BACKUP_DIR}" -type f -name 'sensitive_*.tar.gz' -mtime "+${RETENTION_DAYS}" -delete
echo "[backup] Cleaned up archives older than ${RETENTION_DAYS} days."
