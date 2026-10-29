#!/usr/bin/env bash
# Backs up the LUPU-FIT database (users, workouts, food logs, phone-notification keys) to a dated .sql.gz file.
#
#   ./backup.sh                  make a backup now, keep the newest 14, print how to schedule and restore
#   ./backup.sh --install-cron   schedule a daily backup at 03:17 (server time) and exit; safe to repeat
#   ./backup.sh --dry-run        show what would happen
#
# Files go to ~/lupufit-backups (change with LUPUFIT_BACKUP_DIR or --dir) and are readable only by you.
# They are plain SQL, gzip-compressed. The backup lives on the same VM as the data: copy it somewhere else too
# (the guide shows how), because a lost VM takes its backups with it.
#
# Restore (replaces the current data with the backup; run in this folder):
#   docker compose stop app
#   gunzip -c ~/lupufit-backups/<file>.sql.gz | docker compose exec -T db psql -U fitai -d fitai -v ON_ERROR_STOP=1 --single-transaction -q -o /dev/null
#   docker compose start app
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

KEEP=14
BACKUP_DIR=${LUPUFIT_BACKUP_DIR:-$HOME/lupufit-backups}
INSTALL_CRON=0
CRON_MARK='# lupufit-backup'

usage() { sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }

cron_line() { printf '17 3 * * * %s/backup.sh >> %s/backup.log 2>&1 %s' "$DEPLOY_DIR" "$BACKUP_DIR" "$CRON_MARK"; }

cron_installed() {
  command -v crontab >/dev/null 2>&1 && crontab -l 2>/dev/null | grep -qF -- "$CRON_MARK"
}

install_cron() {
  command -v crontab >/dev/null 2>&1 || die "crontab is not installed (sudo apt-get install -y cron)"
  if cron_installed; then
    info "daily backup is already scheduled (crontab -l shows it)"
    return 0
  fi
  if [[ $DRY_RUN == 1 ]]; then
    info "[dry-run] would add to your crontab: $(cron_line)"
    return 0
  fi
  mkdir -p "$BACKUP_DIR"
  chmod 700 "$BACKUP_DIR"
  local existing
  existing=$(crontab -l 2>/dev/null || true)
  {
    [[ -z $existing ]] || printf '%s\n' "$existing"
    printf '%s\n' "$(cron_line)"
  } | crontab -
  info "scheduled a daily backup at 03:17 server time. Remove it any time with: crontab -e"
}

prune_old() {
  shopt -s nullglob
  local files=("$BACKUP_DIR"/lupufit-*.sql.gz) i
  shopt -u nullglob
  # File names contain the date, so the glob order (alphabetical) is oldest first.
  for ((i = 0; i < ${#files[@]} - KEEP; i++)); do
    rm -f -- "${files[$i]}"
    info "removed old backup ${files[$i]##*/}"
  done
}

do_backup() {
  local stamp file tmp
  stamp=$(date +%Y-%m-%d_%H%M%S)
  file="$BACKUP_DIR/lupufit-$stamp.sql.gz"
  tmp="$file.partial"
  say "Backing up the database"
  if [[ $DRY_RUN == 1 ]]; then
    info "[dry-run] docker compose exec -T db pg_dump -U fitai -d fitai --clean --if-exists --no-owner --no-privileges | gzip > $file"
    info "[dry-run] then check the file, and keep only the newest $KEEP backups in $BACKUP_DIR"
    return 0
  fi
  mkdir -p "$BACKUP_DIR"
  chmod 700 "$BACKUP_DIR"
  umask 077
  if ! dc exec -T db pg_dump -U fitai -d fitai --clean --if-exists --no-owner --no-privileges | gzip >"$tmp"; then
    rm -f "$tmp"
    die "pg_dump failed. Is the stack running? Check: cd \"$DEPLOY_DIR\" && docker compose ps"
  fi
  # A complete dump ends with this marker; a cut-off one does not.
  if ! gzip -t "$tmp" || ! gunzip -c "$tmp" | tail -n 5 | grep -q 'PostgreSQL database dump complete'; then
    rm -f "$tmp"
    die "the backup file is incomplete and was deleted; nothing was changed"
  fi
  mv "$tmp" "$file"
  info "saved $file ($(du -h "$file" | cut -f1))"
  prune_old
  printf '\n    %s backups kept in %s (newest %s).\n' "$(find "$BACKUP_DIR" -maxdepth 1 -name 'lupufit-*.sql.gz' | wc -l)" "$BACKUP_DIR" "$KEEP"
  if cron_installed; then
    info "A daily backup is scheduled."
  else
    info "To run this automatically every night, run: $DEPLOY_DIR/backup.sh --install-cron"
    info "(or add this line with 'crontab -e'):  $(cron_line)"
  fi
  info "Restore: see the header of this script or the guide (docs/deploy-oracle.md)."
  info "Copy the file off this VM too, for example with scp from your own computer."
}

main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --install-cron) INSTALL_CRON=1; shift ;;
      --keep) KEEP=${2:?--keep needs a number}; shift 2 ;;
      --dir) BACKUP_DIR=${2:?--dir needs a folder}; shift 2 ;;
      --dry-run) DRY_RUN=1; shift ;;
      -h | --help) usage; exit 0 ;;
      *) die "unknown option: $1 (try --help)" ;;
    esac
  done
  [[ $KEEP =~ ^[0-9]+$ && $KEEP -ge 1 ]] || die "--keep must be a number of at least 1"
  if [[ $INSTALL_CRON == 1 ]]; then
    install_cron
    return 0
  fi
  do_backup
}

main "$@"
