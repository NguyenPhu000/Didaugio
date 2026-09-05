#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path_to_backup_archive.tar.gz> [target_docker_volume]" >&2
  echo "Dry-run: $0 /var/backups/didaugio/sensitive/sensitive_YYYYMMDD_HHMMSS.tar.gz" >&2
  echo "Restore (replace): RESTORE_CONFIRM=YES RESTORE_REPLACE=YES $0 /var/backups/didaugio/sensitive/sensitive_YYYYMMDD_HHMMSS.tar.gz server_didaugio_sensitive_data" >&2
  exit 1
fi

if ! ARCHIVE_PATH="$(realpath -e -- "$1")"; then
  echo "[restore][FATAL] Archive file not found or cannot be resolved: $1" >&2
  exit 1
fi
TARGET_VOLUME="${2:-}"

# Validate the gzip/tar stream before touching a Docker volume.
if ! tar -tzf "${ARCHIVE_PATH}" >/dev/null; then
  echo "[restore][FATAL] Archive failed tar integrity validation: ${ARCHIVE_PATH}" >&2
  exit 1
fi
if tar -tzf "${ARCHIVE_PATH}" | grep -E '(^/|(^|/)\.\.(\/|$))' >/dev/null; then
  echo "[restore][FATAL] Archive contains an absolute or path-traversal entry." >&2
  exit 1
fi
ARCHIVE_ENCRYPTED_FILE_COUNT="$(tar -tzf "${ARCHIVE_PATH}" | awk '/\.enc$/ { count++ } END { print count + 0 }')"
if [ "${ARCHIVE_ENCRYPTED_FILE_COUNT}" -eq 0 ]; then
  echo "[restore][FATAL] Archive contains no .enc files; refusing to call an empty restore valid." >&2
  exit 1
fi

ARCHIVE_DIR="$(dirname "${ARCHIVE_PATH}")"
ARCHIVE_BASENAME="$(basename "${ARCHIVE_PATH}")"

if [ -n "${TARGET_VOLUME}" ]; then
  if [ "${RESTORE_CONFIRM:-}" != "YES" ]; then
    echo "[restore][FATAL] Restoring overwrites existing volume data. Set RESTORE_CONFIRM=YES to continue." >&2
    exit 1
  fi
  if ! docker volume inspect "${TARGET_VOLUME}" >/dev/null 2>&1; then
    echo "[restore][FATAL] Target Docker volume '${TARGET_VOLUME}' does not exist; refusing implicit volume creation." >&2
    exit 1
  fi
  if [ -n "$(docker ps -q --filter "volume=${TARGET_VOLUME}")" ]; then
    echo "[restore][FATAL] Target volume '${TARGET_VOLUME}' is mounted by a running container; stop the API first." >&2
    exit 1
  fi

  echo "[restore] Restoring '${ARCHIVE_PATH}' into Docker volume '${TARGET_VOLUME}'..."
  RESTORE_REPLACE="${RESTORE_REPLACE:-NO}"
  case "${RESTORE_REPLACE}" in
    YES|NO) ;;
    *)
      echo "[restore][FATAL] RESTORE_REPLACE must be YES or NO." >&2
      exit 1
      ;;
  esac
  docker run --rm \
    --mount "type=volume,source=${TARGET_VOLUME},destination=/target" \
    --mount "type=bind,source=${ARCHIVE_DIR},destination=/backup,readonly" \
    alpine:3.20 \
    sh -c 'if [ "$2" = YES ]; then for entry in /target/* /target/.[!.]* /target/..?*; do [ -e "$entry" ] || continue; rm -rf -- "$entry"; done; fi; tar -xzf "/backup/$1" -C /target' -- "${ARCHIVE_BASENAME}" "${RESTORE_REPLACE}"
  if [ "${RESTORE_REPLACE}" = YES ]; then
    echo "[restore] Existing target contents were replaced."
  else
    echo "[restore] Existing target contents were preserved; archive was overlaid. Set RESTORE_REPLACE=YES for a full replacement."
  fi
  echo "[restore] SUCCESS: Restored to volume '${TARGET_VOLUME}'."
else
  TEMP_RESTORE_DIR="$(mktemp -d /tmp/didaugio_restore_test.XXXXXX)"
  cleanup() {
    rm -rf -- "${TEMP_RESTORE_DIR}"
  }
  trap cleanup EXIT

  echo "[restore] Dry-run: extracting to temporary directory '${TEMP_RESTORE_DIR}'..."
  tar -xzf "${ARCHIVE_PATH}" -C "${TEMP_RESTORE_DIR}"
  ITEM_COUNT="$(find "${TEMP_RESTORE_DIR}" -type f | wc -l | tr -d ' ')"
  echo "[restore] Verification SUCCESS: extracted ${ITEM_COUNT} files (${ARCHIVE_ENCRYPTED_FILE_COUNT} encrypted files). Temporary files will be removed on exit."
fi
