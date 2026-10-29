#!/usr/bin/env bash
# Updates LUPU-FIT to the newest version of the branch you cloned, keeping all data.
#
#   ./update.sh               backup, git pull, rebuild, restart, check
#   ./update.sh --no-backup   skip the backup (not recommended)
#   ./update.sh --dry-run     show the steps without doing them
#
# The database and the HTTPS certificate live in Docker volumes and are not touched by a rebuild.
# Database changes of a new version are applied automatically when the app starts (DB_AUTO_MIGRATE).
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

DO_BACKUP=1

usage() { sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }

main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-backup) DO_BACKUP=0; shift ;;
      --dry-run) DRY_RUN=1; shift ;;
      -h | --help) usage; exit 0 ;;
      *) die "unknown option: $1 (try --help)" ;;
    esac
  done
  [[ -f $ENV_FILE ]] || die "$ENV_FILE not found: run ./setup.sh first"
  command -v git >/dev/null 2>&1 || die "git is not installed (sudo apt-get install -y git)"
  local repo
  repo=$(git -C "$DEPLOY_DIR" rev-parse --show-toplevel) || die "this folder is not inside a git clone"
  [[ $DRY_RUN == 0 ]] || printf '*** DRY RUN: nothing below is executed or changed ***\n'

  if [[ $DO_BACKUP == 1 ]]; then
    say "1. Backup before updating"
    if [[ $DRY_RUN == 1 ]]; then
      info "[dry-run] $DEPLOY_DIR/backup.sh"
    else
      "$DEPLOY_DIR/backup.sh" || die "the backup failed, so nothing was updated. Fix that first (or use --no-backup)."
    fi
  fi

  say "2. Downloading the newest version"
  local before after
  before=$(git -C "$repo" rev-parse --short HEAD)
  run git -C "$repo" pull --ff-only || die "git pull failed (local edits in the clone, or the branch was rewritten). Nothing was rebuilt; the running site is unchanged. Ask for help with the message above."
  after=$(git -C "$repo" rev-parse --short HEAD)
  if [[ $DRY_RUN == 1 ]]; then
    info "[dry-run] would now be at the newest commit of this branch"
  elif [[ $before == "$after" ]]; then
    info "already up to date ($after); rebuilding anyway so the running containers match the files"
  else
    info "updated $before -> $after"
  fi

  say "3. Rebuilding and restarting"
  # Minor updates of the PostgreSQL and Caddy images (same tag, e.g. caddy:2.11). A failure here is not fatal.
  dc pull db caddy || warn "could not check for newer database/proxy images; continuing with the ones already downloaded"
  dc up -d --build --remove-orphans
  if [[ $DRY_RUN == 0 ]]; then docker_cmd image prune -f >/dev/null || true; fi

  if [[ $DRY_RUN == 1 ]]; then return 0; fi
  say "4. Checking"
  local url
  url=$(env_get APP_URL)
  if wait_for_site "$url" 180; then
    info "OK: $url/api/health answers. LUPU-FIT is running version $after."
  else
    warn "$url did not answer a healthy response within 3 minutes. Look at the log:"
    info "cd \"$DEPLOY_DIR\" && docker compose logs --tail 50 app"
    exit 1
  fi
}

# Everything runs inside main so bash has read the whole file before `git pull` can replace it.
main "$@"
exit $?
