#!/usr/bin/env bash
# One command: a throwaway copy of the backend (origin/main), test data, the backend, the website and a headless Chrome on their own ports.
# It never touches your own servers (5173/8000) or your own database.
#   bash qa/start-test-stack.sh            start
#   bash qa/stop-test-stack.sh             stop (and delete the copy)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"
BACKEND="${QA_BACKEND:-$HOME/Projects/FaceCloud_backend}"
QA_DIR="${QA_DIR:-${TMPDIR:-/tmp}/facecloud-qa}"
API_PORT="${QA_API_PORT:-8840}"; WEB_PORT="${QA_WEB_PORT:-5240}"; CDP_PORT="${QA_CDP_PORT:-9410}"
PY="$BACKEND/.venv/bin/python"
[ -x "$PY" ] || { echo "No virtualenv at $BACKEND/.venv. Set QA_BACKEND to your backend folder."; exit 1; }
for p in $API_PORT $WEB_PORT $CDP_PORT; do lsof -ti tcp:$p >/dev/null 2>&1 && { echo "Port $p is busy. Run qa/stop-test-stack.sh first."; exit 1; }; done
rm -rf "$QA_DIR"; mkdir -p "$QA_DIR/backend" "$QA_DIR/chrome" "$ROOT/qa/out"
git -C "$BACKEND" fetch -q origin
git -C "$BACKEND" archive "${QA_REF:-origin/main}" | tar -x -C "$QA_DIR/backend"
mkdir -p "$QA_DIR/backend/.runtime"; ln -s "$BACKEND/.runtime/models" "$QA_DIR/backend/.runtime/models"
cat > "$QA_DIR/env.sh" <<ENV
set -a; source "$BACKEND/.env"; set +a
export DJANGO_DEBUG=True DB_ENGINE=django.db.backends.sqlite3 DB_NAME="$QA_DIR/backend/db.sqlite3" MEDIA_ROOT="$QA_DIR/backend/media"
export PUBLIC_BACKEND_URL=http://127.0.0.1:$API_PORT EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
export CORS_ALLOWED_ORIGINS=http://localhost:$WEB_PORT THROTTLE_RATE_LOGIN=1000/hour
${QA_ORG_INVITE_RATE:+export THROTTLE_RATE_ORG_INVITE=$QA_ORG_INVITE_RATE}
export QA_API=http://127.0.0.1:$API_PORT QA_WEB=http://localhost:$WEB_PORT QA_CDP=http://127.0.0.1:$CDP_PORT
ENV
source "$QA_DIR/env.sh"
cd "$QA_DIR/backend"; "$PY" manage.py migrate -v0; "$PY" manage.py shell < "$HERE/seed.py" 2>&1 | grep -v "objects imported"
(nohup "$PY" manage.py runserver 127.0.0.1:$API_PORT --noreload > "$QA_DIR/backend.log" 2>&1 &)
cd "$ROOT"; (VITE_USE_API=true VITE_API_URL=http://127.0.0.1:$API_PORT nohup npx vite --port $WEB_PORT --strictPort > "$QA_DIR/web.log" 2>&1 &)
CHROME="${QA_CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
("$CHROME" --headless=new --remote-debugging-port=$CDP_PORT --user-data-dir="$QA_DIR/chrome" --no-first-run --disable-gpu about:blank > "$QA_DIR/chrome.log" 2>&1 &)
for i in $(seq 1 30); do curl -s -o /dev/null http://127.0.0.1:$API_PORT/api/schema/ && curl -s -o /dev/null http://localhost:$WEB_PORT/ && curl -s -o /dev/null $QA_CDP/json/version && break; sleep 1; done
echo "QA stack is up:  website $QA_WEB   api $QA_API   chrome $QA_CDP"
echo "Sign in with the emails in qa/seed.py (password Qa-Pass-Phrase-2026!). Logs: $QA_DIR/*.log"
echo "Run a test:  source $QA_DIR/env.sh && node qa/scripts/01-crawl.mjs"
