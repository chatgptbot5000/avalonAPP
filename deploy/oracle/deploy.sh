#!/usr/bin/env bash
set -euo pipefail

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
