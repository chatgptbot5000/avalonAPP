#!/usr/bin/env bash
set -euo pipefail

load_node_environment() {
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

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "node/npm not found. Install Node.js 20+ on the VM (system-wide or via nvm), then rerun deploy."
    exit 1
  fi

  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$node_major" -lt 20 ]; then
    echo "Found Node $(node -v), but this app needs Node 20+. Install or activate Node 20 on the VM, then rerun deploy."
    exit 1
  fi
}

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
