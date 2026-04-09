#!/usr/bin/env bash
set -euo pipefail

load_node_environment() {
  if command -v npm >/dev/null 2>&1; then
    return
  fi

  for profile in "$HOME/.profile" "$HOME/.bash_profile" "$HOME/.bashrc" /etc/profile; do
    if [ -f "$profile" ]; then
      # shellcheck disable=SC1090
      . "$profile"
    fi
  done

  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    nvm use --lts >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
  fi

  export PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin:$PATH"

  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found. Install Node.js 20+ or source the shell profile that provides it."
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
