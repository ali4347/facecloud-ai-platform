#!/usr/bin/env bash
# Stop hook for Claude Code.
# Blocks the end of a turn while any source / config / asset file is newer than WORK_LOG.md,
# so the work log is always updated alongside the work itself.

input=$(cat)

# Loop guard: if Claude is already continuing because of this hook, let the turn end.
if printf '%s' "$input" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0
[ -f WORK_LOG.md ] || exit 0

changed=$(find src public index.html package.json tailwind.config.ts vite.config.ts \
              postcss.config.js .env.example tsconfig.json tsconfig.app.json tsconfig.node.json \
            \( -name node_modules -o -name dist -o -name .git \) -prune -o \
            -type f -newer WORK_LOG.md -print 2>/dev/null | head -8)

[ -z "$changed" ] && exit 0

jq -n --arg files "$changed" '{
  decision: "block",
  reason: ("These source/config/asset files were modified after WORK_LOG.md was last updated (showing up to 8):\n"
           + $files
           + "\n\nBefore finishing: add a dated entry at the top of Section 2 (Change Log) in WORK_LOG.md, refresh any affected status section, and bump the Last updated date. If the user made these changes themselves, summarise them from `git diff`. Answering a question only? Then the log still must be saved so its timestamp is current — touch WORK_LOG.md after confirming no entry is needed.")
}'
exit 0
