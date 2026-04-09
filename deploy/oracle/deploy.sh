#!/usr/bin/env bash
set -euo pipefail

load_node_environment() {
  if command -v npm >/dev/null 2>&1; then
    return
  fi

  export PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin:$PATH"

  shopt -s nullglob
  for bin_dir in "$HOME/.nvm/versions/node"/*/bin /usr/local/lib/nodejs/*/bin /opt/node/*/bin; do
    PATH="$bin_dir:$PATH"
  done
  shopt -u nullglob

  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    nvm use --lts >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found. Install Node.js 20+ or source the shell profile that provides it."
    exit 1
  fi
}

bootstrap_node_if_missing() {
  if command -v npm >/dev/null 2>&1; then
    return
  fi

  if ! command -v sudo >/dev/null 2>&1 || ! command -v apt-get >/dev/null 2>&1; then
    echo "npm not found and automatic Node install is unavailable. Install Node.js 20+ on the VM, then rerun deploy."
    exit 1
  fi

  echo "npm not found; installing Node.js 20 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get update
  sudo apt-get install -y nodejs
}

load_node_environment
bootstrap_node_if_missing
load_node_environment

if [ -f .avalon.pid ]; then
  old_pid="$(cat .avalon.pid)"
  kill "$old_pid" 2>/dev/null || true
  rm -f .avalon.pid
  sleep 2
fi

git fetch origin main
git reset --hard origin/main

npm install
npm run build

nohup npm start > avalon.log 2>&1 &
echo $! > .avalon.pid
