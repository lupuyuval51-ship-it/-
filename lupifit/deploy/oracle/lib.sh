#!/usr/bin/env bash
# Shared helpers for setup.sh, update.sh and backup.sh. Sourced by them; not meant to be run directly.
# shellcheck shell=bash

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DEPLOY_DIR/.env"
DRY_RUN=0

say() { printf '\n==> %s\n' "$*"; }
info() { printf '    %s\n' "$*"; }
warn() { printf 'WARNING: %s\n' "$*" >&2; }
die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

# run CMD...  Executes the command, or only prints it with --dry-run.
run() {
  if [[ $DRY_RUN == 1 ]]; then
    printf '    [dry-run] %s\n' "$*"
    return 0
  fi
  "$@"
}

# as_root CMD...  Like run, through sudo unless we already are root.
as_root() {
  if [[ $EUID -eq 0 ]]; then run "$@"; else run sudo "$@"; fi
}

# write_root FILE CONTENT  Writes one line of text to a root-owned file (or prints it with --dry-run).
write_root() {
  if [[ $DRY_RUN == 1 ]]; then
    printf '    [dry-run] write %s: %s\n' "$1" "$2"
    return 0
  fi
  if [[ $EUID -eq 0 ]]; then
    printf '%s\n' "$2" >"$1"
  else
    printf '%s\n' "$2" | sudo tee "$1" >/dev/null
  fi
}

# root_probe CMD...  Runs a read-only command as root (sudo unless we already are root). Not affected by --dry-run.
root_probe() {
  if [[ $EUID -eq 0 ]]; then "$@"; else sudo "$@"; fi
}

# docker_cmd ARGS...  Runs docker; through sudo when this login session cannot talk to the daemon yet
# (right after Docker was installed, the new "docker" group only applies to the next login).
# The choice is made in this shell (not in a subshell) so it is remembered.
_DOCKER=()
docker_pick() {
  if [[ ${#_DOCKER[@]} -eq 0 ]]; then
    if docker info >/dev/null 2>&1; then _DOCKER=(docker); else _DOCKER=(sudo docker); fi
  fi
}
docker_cmd() {
  docker_pick
  "${_DOCKER[@]}" "$@"
}

# dc ARGS...  docker compose, run in this folder (so it finds docker-compose.yml and .env).
dc() {
  if [[ $DRY_RUN == 1 ]]; then
    printf '    [dry-run] docker compose %s\n' "$*"
    return 0
  fi
  docker_pick
  (cd "$DEPLOY_DIR" && "${_DOCKER[@]}" compose "$@")
}

# env_get KEY  Prints the value of KEY from .env (empty when missing). Never sources the file.
env_get() {
  [[ -f $ENV_FILE ]] || return 0
  local line
  line=$(grep -E "^$1=" "$ENV_FILE" | tail -n 1) || true
  printf '%s' "${line#*=}"
}

# env_set FILE KEY VALUE  Sets KEY=VALUE in FILE (replaces the first KEY= line, or appends). Safe for any value.
env_set() {
  local file=$1 key=$2 value=$3 tmp
  tmp=$(mktemp "$file.XXXXXX")
  KEY="$key" VALUE="$value" awk '
    BEGIN { FS = OFS = "="; k = ENVIRON["KEY"]; v = ENVIRON["VALUE"]; done = 0 }
    $1 == k && !done { print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }' "$file" >"$tmp"
  mv "$tmp" "$file"
  chmod 600 "$file"
}

is_ipv4() {
  local ip=$1 o
  [[ $ip =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]] || return 1
  local IFS=.
  for o in $ip; do ((10#$o <= 255)) || return 1; done
}

# wait_for_site URL [SECONDS]  Polls URL/api/health until it answers 200 or SECONDS (default 240) have passed.
# Returns 1 when it never answered.
wait_for_site() {
  local url=${1%/} deadline code
  deadline=$((SECONDS + ${2:-240}))
  while ((SECONDS < deadline)); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url/api/health" || true)
    if [[ $code == 200 ]]; then return 0; fi
    sleep 5
  done
  return 1
}
