#!/usr/bin/env bash
# Local PostgreSQL helper for development and CI-less test runs.
# Usage: scripts/pg-local.sh start|stop|status|reset
#
# Prefer `docker compose up -d db` when Docker is available. This script exists for machines that
# only have PostgreSQL binaries installed (it runs an isolated cluster on port 54329; it never touches
# a system-wide PostgreSQL instance).
set -euo pipefail

PORT="${LEVELUP_PG_PORT:-54329}"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
if [ -z "${PG_BIN}" ] || [ ! -x "${PG_BIN}/initdb" ]; then
  if command -v initdb >/dev/null 2>&1; then PG_BIN="$(dirname "$(command -v initdb)")"; else
    echo "PostgreSQL binaries not found. Install PostgreSQL 14+ or use docker compose." >&2; exit 1; fi
fi

if [ "$(id -u)" = "0" ]; then
  # PostgreSQL refuses to run as root; drop to the postgres system user.
  DATA="${PGDATA_DIR:-/var/tmp/levelup-pgdata}"
  RUN=(runuser -u postgres --)
else
  DATA="${PGDATA_DIR:-$(cd "$(dirname "$0")/.." && pwd)/.pgdata}"
  RUN=()
fi

run() { "${RUN[@]}" "$@"; }

init_cluster() {
  if [ ! -f "${DATA}/PG_VERSION" ]; then
    mkdir -p "${DATA}"
    [ "$(id -u)" = "0" ] && chown postgres:postgres "${DATA}"
    run "${PG_BIN}/initdb" -D "${DATA}" -U postgres --auth=trust --encoding=UTF8 >/dev/null
    echo "initialised cluster in ${DATA}"
  fi
}

start() {
  init_cluster
  if run "${PG_BIN}/pg_isready" -h 127.0.0.1 -p "${PORT}" >/dev/null 2>&1; then echo "already running on ${PORT}"; else
    run "${PG_BIN}/pg_ctl" -D "${DATA}" -l "${DATA}/server.log" -w \
      -o "-p ${PORT} -c listen_addresses=127.0.0.1 -c unix_socket_directories=${DATA} -c fsync=off -c synchronous_commit=off -c full_page_writes=off -c max_connections=200" start >/dev/null
    echo "started on 127.0.0.1:${PORT}"
  fi
  local psql_cmd=("${PG_BIN}/psql" -h 127.0.0.1 -p "${PORT}" -U postgres -v ON_ERROR_STOP=1 -qtA)
  run "${psql_cmd[@]}" -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='levelup') THEN CREATE ROLE levelup LOGIN SUPERUSER PASSWORD 'levelup'; END IF; END \$\$;"
  for db in levelup levelup_test; do
    if [ "$(run "${psql_cmd[@]}" -d postgres -c "SELECT 1 FROM pg_database WHERE datname='${db}'")" != "1" ]; then
      run "${psql_cmd[@]}" -d postgres -c "CREATE DATABASE ${db} OWNER levelup"
    fi
  done
  echo "databases ready: postgresql://levelup:levelup@127.0.0.1:${PORT}/levelup  (and levelup_test)"
}

case "${1:-}" in
  start) start ;;
  stop) run "${PG_BIN}/pg_ctl" -D "${DATA}" -m fast stop ;;
  status) run "${PG_BIN}/pg_isready" -h 127.0.0.1 -p "${PORT}" ;;
  reset) run "${PG_BIN}/pg_ctl" -D "${DATA}" -m immediate stop 2>/dev/null || true; rm -rf "${DATA}"; start ;;
  *) echo "usage: $0 start|stop|status|reset" >&2; exit 2 ;;
esac
