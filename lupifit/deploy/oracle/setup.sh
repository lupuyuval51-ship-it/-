#!/usr/bin/env bash
# LUPU-FIT one-step setup for a fresh Ubuntu (or Debian) VM, e.g. an Oracle Cloud Always Free instance.
#
#   ./setup.sh                       interactive: asks which address to use (Enter = the free one)
#   ./setup.sh --domain app.example.com   use your own domain (its A record must already point to this VM)
#   ./setup.sh --dry-run             print every step instead of doing it; changes nothing
#
# Run it as the normal login user (ubuntu), not with sudo: it asks for sudo where it needs it.
# Safe to run again: it never overwrites an existing .env, skips what is already installed, and
# `docker compose up` only recreates what changed.
#
# What it does, in order:
#   1. creates .env (random SESSION_SECRET and POSTGRES_PASSWORD; address from your domain, or from the
#      VM's public IP as <ip-with-dashes>.sslip.io, a free name that points at that IP)
#   2. adds a swap file when the VM has less than 2 GB of memory (Oracle's free AMD "micro" VM has 1 GB)
#   3. installs Docker Engine + the compose plugin from Docker's official apt repository
#   4. opens ports 80 and 443 in the VM's own firewall (Oracle's Ubuntu images block everything but SSH)
#   5. builds and starts the stack (database, app, HTTPS proxy), waits for it, and prints the address
#   6. schedules a daily database backup (backup.sh)
#
# Options:
#   --domain NAME    use your own domain instead of the free sslip.io name
#   --ip ADDRESS     use this public IPv4 address instead of asking an IP-echo service
#   --yes, -y        never ask questions (for scripts); uses the detected IP
#   --env-only       only create .env, then stop (no swap, Docker, firewall or start)
#   --no-swap  --no-firewall  --no-cron  --no-start    skip that step
#   --dry-run        show what would happen without changing anything
#   -h, --help       this text
#
# Environment: LUPUFIT_SWAP_MB (swap size, default 2048), LUPUFIT_RULES_V4 / LUPUFIT_RULES_V6 (iptables
# rules files, default /etc/iptables/rules.v4 and rules.v6).
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

DOMAIN=""
PUBLIC_IP=""
ASSUME_YES=0
ENV_ONLY=0
DO_SWAP=1
DO_FIREWALL=1
DO_CRON=1
DO_START=1
SWAP_MB=${LUPUFIT_SWAP_MB:-2048}
RULES_V4=${LUPUFIT_RULES_V4:-/etc/iptables/rules.v4}
RULES_V6=${LUPUFIT_RULES_V6:-/etc/iptables/rules.v6}

usage() { sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }

is_interactive() { [[ $ASSUME_YES == 0 && -t 0 && -t 1 ]]; }

# ---------------------------------------------------------------------------------------------- address
normalize_host() {
  local h=${1,,}
  h=${h#http://}
  h=${h#https://}
  printf '%s' "${h%%/*}"
}

is_hostname() {
  [[ $1 == localhost || $1 =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]
}

detect_public_ip() {
  local url ip
  for url in https://api.ipify.org https://ifconfig.me/ip https://icanhazip.com; do
    ip=$(curl -4 -fsS --max-time 8 "$url" 2>/dev/null | tr -d '[:space:]') || continue
    if is_ipv4 "$ip"; then
      printf '%s' "$ip"
      return 0
    fi
  done
  return 1
}

# Sets SITE_ADDRESS from --domain, --ip, the prompt, or the detected public IP.
choose_address() {
  local entered=""
  if [[ -n $DOMAIN ]]; then
    SITE_ADDRESS=$(normalize_host "$DOMAIN")
    if is_ipv4 "$SITE_ADDRESS"; then
      PUBLIC_IP=$SITE_ADDRESS
      DOMAIN=""
    else
      is_hostname "$SITE_ADDRESS" || die "'$DOMAIN' is not a valid host name (example: app.your-domain.com)"
      return 0
    fi
  fi
  if [[ -z $PUBLIC_IP ]]; then
    PUBLIC_IP=$(detect_public_ip) || PUBLIC_IP=""
  fi
  if is_interactive; then
    if [[ -n $PUBLIC_IP ]]; then
      printf '\nThis VM'\''s public IP address is %s.\n' "$PUBLIC_IP"
      printf 'Press Enter to use the free address %s.sslip.io,\n' "${PUBLIC_IP//./-}"
      printf 'or type your own domain name (or a different IP address): '
    else
      printf '\nCould not detect this VM'\''s public IP address.\nType your domain name or the public IP address: '
    fi
    read -r entered || entered=""
    entered=$(normalize_host "$entered")
    if [[ -n $entered ]]; then
      if is_ipv4 "$entered"; then
        PUBLIC_IP=$entered
      else
        is_hostname "$entered" || die "'$entered' is not a valid domain name or IP address"
        SITE_ADDRESS=$entered
        return 0
      fi
    fi
  fi
  if [[ -z $PUBLIC_IP ]]; then
    if [[ $DRY_RUN == 1 ]]; then
      PUBLIC_IP=203.0.113.10
      warn "could not detect the public IP; using the documentation address $PUBLIC_IP for this dry run"
    else
      die "could not detect this VM's public IP. Run again with --ip <public IP> or --domain <your domain>."
    fi
  fi
  is_ipv4 "$PUBLIC_IP" || die "'$PUBLIC_IP' is not a valid IPv4 address"
  SITE_ADDRESS="${PUBLIC_IP//./-}.sslip.io"
}

gen_secret() { # gen_secret BYTES -> hex string of 2*BYTES characters
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$1"
  else
    head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

# ---------------------------------------------------------------------------------------------- 1. .env
create_env() {
  say "1. Configuration (.env)"
  if [[ -f $ENV_FILE ]]; then
    info ".env already exists: leaving it exactly as it is (delete it yourself to start over)."
    local k
    for k in SITE_ADDRESS APP_URL POSTGRES_PASSWORD SESSION_SECRET; do
      [[ -n $(env_get "$k") ]] || warn "$k is empty in .env: fix it, then run ./setup.sh again"
    done
    return 0
  fi
  [[ -f $DEPLOY_DIR/.env.example ]] || die "$DEPLOY_DIR/.env.example is missing"
  choose_address
  local app_url="https://$SITE_ADDRESS" ai_key=""
  if is_interactive && [[ $DRY_RUN == 0 ]]; then
    printf '\nOptional: Anthropic API key for the AI coach and meal-photo analysis.\n'
    printf 'Press Enter to skip (the app works without it; you can add it later in .env): '
    read -r -s ai_key || ai_key=""
    printf '\n'
    ai_key=${ai_key//[[:space:]]/}
  fi
  if [[ $DRY_RUN == 1 ]]; then
    info "[dry-run] would create $ENV_FILE from .env.example with:"
    info "[dry-run]   SITE_ADDRESS=$SITE_ADDRESS"
    info "[dry-run]   APP_URL=$app_url"
    info "[dry-run]   POSTGRES_PASSWORD=<random>  SESSION_SECRET=<random>"
    return 0
  fi
  (
    umask 077
    cp "$DEPLOY_DIR/.env.example" "$ENV_FILE"
  )
  env_set "$ENV_FILE" SITE_ADDRESS "$SITE_ADDRESS"
  env_set "$ENV_FILE" APP_URL "$app_url"
  env_set "$ENV_FILE" POSTGRES_PASSWORD "$(gen_secret 24)"
  env_set "$ENV_FILE" SESSION_SECRET "$(gen_secret 32)"
  [[ -z $ai_key ]] || env_set "$ENV_FILE" AI_API_KEY "$ai_key"
  info "Created .env (only you can read it). Address: $app_url"
  if [[ $SITE_ADDRESS == *.sslip.io ]]; then
    info "This free name is tied to the public IP $PUBLIC_IP. If that IP ever changes, the address changes too."
  fi
}

# ---------------------------------------------------------------------------------------------- 2. swap
ensure_swap() {
  say "2. Swap file"
  if [[ $DO_SWAP == 0 ]]; then
    info "skipped (--no-swap)"
    return 0
  fi
  local mem_kb free_mb
  mem_kb=$(awk '/^MemTotal:/ {print $2}' /proc/meminfo)
  if [[ -n $(swapon --show=NAME --noheadings 2>/dev/null) ]]; then
    info "swap is already active: nothing to do"
    return 0
  fi
  if ((mem_kb >= 2000000)); then
    info "this VM has $((mem_kb / 1024)) MB of memory: no swap file needed"
    return 0
  fi
  free_mb=$(df -Pm / | awk 'NR == 2 {print $4}')
  if ((free_mb < SWAP_MB + 4096)); then
    warn "only $free_mb MB of disk space is free: not creating a ${SWAP_MB} MB swap file. Building the app may run out of memory."
    return 0
  fi
  info "this VM has only $((mem_kb / 1024)) MB of memory; building the app needs more, so a ${SWAP_MB} MB swap file is added."
  if [[ -e /swapfile ]]; then
    warn "/swapfile already exists but is not active; leaving it alone"
    return 0
  fi
  as_root fallocate -l "${SWAP_MB}M" /swapfile || as_root dd if=/dev/zero of=/swapfile bs=1M count="$SWAP_MB" status=none
  as_root chmod 600 /swapfile
  as_root mkswap /swapfile
  as_root swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab 2>/dev/null; then
    echo '/swapfile none swap sw 0 0' | as_root tee -a /etc/fstab
  fi
}

# ---------------------------------------------------------------------------------------------- 3. Docker
install_docker() {
  say "3. Docker Engine and the compose plugin"
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    info "Docker and the compose plugin are already installed: nothing to do"
    return 0
  fi
  [[ -r /etc/os-release ]] || die "cannot read /etc/os-release: this script supports Ubuntu and Debian"
  local distro codename arch
  # shellcheck disable=SC1091
  distro=$(. /etc/os-release && echo "$ID")
  # shellcheck disable=SC1091
  codename=$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
  case "$distro" in
    ubuntu | debian) ;;
    *) die "unsupported system '$distro': this script supports Ubuntu and Debian (install Docker yourself, then run it again)" ;;
  esac
  arch=$(dpkg --print-architecture 2>/dev/null || echo unknown)
  info "system: $distro $codename, CPU architecture: $arch (Docker's repository supports amd64 and arm64)"
  as_root env DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=300 update
  as_root env DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=300 install -y ca-certificates curl gnupg
  as_root install -m 0755 -d /etc/apt/keyrings
  as_root curl -fsSL "https://download.docker.com/linux/$distro/gpg" -o /etc/apt/keyrings/docker.asc
  as_root chmod a+r /etc/apt/keyrings/docker.asc
  write_root /etc/apt/sources.list.d/docker.list \
    "deb [arch=$arch signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$distro $codename stable"
  as_root env DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=300 update
  as_root env DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=300 install -y \
    docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  as_root systemctl enable --now docker
  if [[ $EUID -ne 0 ]]; then
    as_root usermod -aG docker "${USER:-$(id -un)}"
    info "added you to the 'docker' group (it applies from your next login; this script uses sudo until then)"
  fi
}

# ---------------------------------------------------------------------------------------------- 4. firewall
# Oracle's Ubuntu images ship iptables rules that accept SSH and REJECT everything else, saved in
# /etc/iptables/rules.v4 and restored at every boot. Two ACCEPT lines for ports 80 and 443 are added in front
# of that REJECT rule, both in the saved file (so they survive a reboot) and in the running firewall.
# The file is edited directly instead of running `netfilter-persistent save`, which would also save Docker's
# own temporary rules into it.
patch_rules_file() { # patch_rules_file FILE IPTABLES_COMMAND
  local file=$1 ipt=$2 tmp port need=()
  if [[ ! -e $file ]]; then
    return 0
  fi
  local current
  current=$(root_probe cat "$file") || {
    warn "cannot read $file"
    return 0
  }
  if ! grep -q '^-A INPUT -j REJECT' <<<"$current"; then
    info "$file has no catch-all REJECT rule for incoming traffic: nothing to change there"
  else
    for port in 80 443; do
      grep -Eq -- "--dport $port .*-j ACCEPT" <<<"$current" || need+=("$port")
    done
    if [[ ${#need[@]} -eq 0 ]]; then
      info "$file already accepts ports 80 and 443"
    else
      tmp=$(mktemp)
      printf '%s\n' "$current" | awk -v ports="${need[*]}" '
        BEGIN { n = split(ports, p, " ") }
        !done && /^-A INPUT -j REJECT/ {
          for (i = 1; i <= n; i++) print "-A INPUT -p tcp -m state --state NEW -m tcp --dport " p[i] " -j ACCEPT"
          done = 1
        }
        { print }' >"$tmp"
      info "adding to $file (before the REJECT rule): ports ${need[*]}"
      if [[ ! -e $file.lupufit-original ]]; then as_root cp "$file" "$file.lupufit-original"; fi
      as_root cp "$tmp" "$file"
      rm -f "$tmp"
    fi
  fi
  # The running firewall (needs no reboot).
  if [[ -n $ipt ]] && command -v "$ipt" >/dev/null 2>&1; then
    for port in 80 443; do
      if [[ $DRY_RUN == 0 ]] && root_probe "$ipt" -C INPUT -p tcp -m state --state NEW -m tcp --dport "$port" -j ACCEPT 2>/dev/null; then
        continue
      fi
      as_root "$ipt" -I INPUT 1 -p tcp -m state --state NEW -m tcp --dport "$port" -j ACCEPT
    done
  fi
  return 0
}

open_firewall() {
  say "4. Firewall on this VM (ports 80 and 443)"
  if [[ $DO_FIREWALL == 0 ]]; then
    info "skipped (--no-firewall)"
    return 0
  fi
  local did=0
  if [[ -e $RULES_V4 ]]; then
    patch_rules_file "$RULES_V4" iptables
    did=1
  fi
  if [[ -e $RULES_V6 ]]; then
    patch_rules_file "$RULES_V6" ip6tables
    did=1
  fi
  if [[ -r /etc/ufw/ufw.conf ]] && grep -qi '^ENABLED=yes' /etc/ufw/ufw.conf; then
    as_root ufw allow 80/tcp
    as_root ufw allow 443/tcp
    did=1
  fi
  [[ $did == 1 ]] || info "no blocking firewall rules found on this VM: nothing to open"
  info "Reminder: the cloud network (Oracle VCN security list) is a second, separate firewall: ports 80 and 443 must be opened there too (see the guide)."
}

# ---------------------------------------------------------------------------------------------- 5. start
start_stack() {
  say "5. Building and starting LUPU-FIT"
  info "The first build downloads and compiles everything: expect several minutes (much longer on the 1 GB micro VM)."
  dc up -d --build
  if [[ $DRY_RUN == 1 ]]; then return 0; fi
  local url
  url=$(env_get APP_URL)
  info "Waiting for $url/api/health (the first HTTPS certificate takes a short while) ..."
  if wait_for_site "$url" 300; then
    return 0
  fi
  warn "$url did not answer with a healthy response within 5 minutes."
  info "Container status:"
  dc ps || true
  info "Last lines of the app and the proxy:"
  dc logs --tail 15 app caddy || true
  info "Most common causes: (1) ports 80/443 not opened in the Oracle VCN security list, (2) the domain does not point"
  info "to this VM's public IP yet, (3) the app failed to start (see the app log above)."
  return 1
}

schedule_backup() {
  say "6. Daily backup"
  if [[ $DO_CRON == 0 ]]; then
    info "skipped (--no-cron)"
    return 0
  fi
  if ! command -v crontab >/dev/null 2>&1; then
    warn "crontab is not installed: schedule backup.sh yourself (see the guide)"
    return 0
  fi
  local args=(--install-cron)
  [[ $DRY_RUN == 1 ]] && args+=(--dry-run)
  "$DEPLOY_DIR/backup.sh" "${args[@]}"
}

print_summary() { # print_summary EXIT_CODE_OF_THE_START_STEP
  local url
  url=$(env_get APP_URL)
  if [[ $1 -eq 0 ]]; then
    say "Done"
  else
    say "Finished, but the site did not answer yet (see the messages above; fix the cause, then run ./setup.sh again)"
  fi
  cat <<EOF
    LUPU-FIT address:   $url
    Health check:       $url/api/health   (should show "status":"ok")
    Folder:             $DEPLOY_DIR

    See what is happening:
      cd "$DEPLOY_DIR"
      docker compose ps
      docker compose logs -f app        (Ctrl+C stops watching; the app keeps running)
    Update to the newest version:   $DEPLOY_DIR/update.sh
    Back up the database now:       $DEPLOY_DIR/backup.sh   (backups go to ~/lupufit-backups)
EOF
  if [[ ${_DOCKER[0]:-} == sudo ]]; then
    info "Note: until you log out and back in, put 'sudo' in front of docker commands."
  fi
  info "Keep a copy of $ENV_FILE somewhere safe (it holds your secrets)."
}

main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --domain) DOMAIN=${2:?--domain needs a value}; shift 2 ;;
      --ip) PUBLIC_IP=${2:?--ip needs a value}; shift 2 ;;
      --yes | -y) ASSUME_YES=1; shift ;;
      --env-only) ENV_ONLY=1; shift ;;
      --no-swap) DO_SWAP=0; shift ;;
      --no-firewall) DO_FIREWALL=0; shift ;;
      --no-cron) DO_CRON=0; shift ;;
      --no-start) DO_START=0; shift ;;
      --dry-run) DRY_RUN=1; shift ;;
      -h | --help) usage; exit 0 ;;
      *) die "unknown option: $1 (try --help)" ;;
    esac
  done
  [[ $EUID -ne 0 ]] || warn "running as root; it is cleaner to run this as the normal login user (ubuntu)"
  [[ -f $DEPLOY_DIR/docker-compose.yml ]] || die "docker-compose.yml not found next to setup.sh"
  [[ $DRY_RUN == 0 ]] || printf '*** DRY RUN: nothing below is executed or changed ***\n'

  create_env
  if [[ $ENV_ONLY == 1 ]]; then
    info "--env-only: stopping here."
    return 0
  fi
  ensure_swap
  install_docker
  open_firewall
  if [[ $DO_START == 0 ]]; then
    info "--no-start: not starting the stack. Start it with: cd \"$DEPLOY_DIR\" && docker compose up -d --build"
    return 0
  fi
  local rc=0
  start_stack || rc=$?
  schedule_backup
  if [[ $DRY_RUN == 0 ]]; then print_summary "$rc"; fi
  return "$rc"
}

main "$@"
