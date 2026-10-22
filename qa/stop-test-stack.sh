#!/usr/bin/env bash
# Stops the QA stack and deletes its copy. Only the QA ports are touched.
QA_DIR="${QA_DIR:-${TMPDIR:-/tmp}/facecloud-qa}"
for p in "${QA_API_PORT:-8840}" "${QA_WEB_PORT:-5240}" "${QA_CDP_PORT:-9410}"; do lsof -ti tcp:$p | xargs -r kill 2>/dev/null || true; done
pkill -f "$QA_DIR/chrome" 2>/dev/null || true
sleep 2; rm -rf "$QA_DIR"; echo "QA stack stopped."
