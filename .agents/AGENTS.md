# FaceCloud Project Rules & Constraints

## Git Workflow Rule
For every task in this FaceCloud project, the agent must follow this Git Workflow Rule strictly:
1. Run required checks (e.g., `npm run build`, backend compiles, Prisma migrations/validations).
2. Fix all build, lint, and compilation errors before committing.
3. Ensure no `.env`, secrets, `node_modules/`, `backend/node_modules/`, `dist/`, or sensitive files are tracked.
4. Update `README.md` and/or `README_BACKEND_ROADMAP.md` if features, routes, database schemas, or setup steps change.
5. Stage changes: `git add .`
6. Commit changes with a descriptive, concise message.
7. Push immediately to the remote branch (`origin main` at `https://github.com/ali4347/facecloud-ai-platform.git`).
8. After pushing, run `git status` and `git log --oneline -3` to verify remote alignment and working tree state.
9. Do not prompt the user for permission to push unless there is a merge conflict, authentication issue, build failure, or secret file risk.
