# FaceCloud (FYP) — Claude Code project instructions

## Work log rule (mandatory)
`WORK_LOG.md` at the repo root is the single running record of everything done on this project.

After completing **any** task that changes code, config, assets, database schema or docs:
1. Add a dated entry at the **top of Section 2 (Change Log)** in `WORK_LOG.md`: date, short title, status
   (`uncommitted` / `committed <hash>`), what changed, files touched, how it was verified.
2. Refresh any affected status section (§1 snapshot, §4 feature inventory, §5 backend, §6 pending work, §7 known issues).
3. Bump the **Last updated** date at the top of the file.

Do this in the same turn as the work, before reporting completion. A Stop hook
(`.claude/hooks/check-work-log.sh`) blocks finishing a turn while any source/config/asset file is newer than
`WORK_LOG.md`. Pure questions and read-only investigation do not need an entry.

## Other conventions
- Feature and route documentation lives in `README.md`; the backend plan in `README_BACKEND_ROADMAP.md`.
  Keep them in sync when routes, features, schema or setup steps change.
- The owner's git workflow rules are in `.agents/AGENTS.md`.
- Run `npm run build` before declaring frontend work done. Backend: `cd backend && npx prisma validate`.
- Never commit `.env`, `node_modules/`, `backend/node_modules/`, or `dist/`.
