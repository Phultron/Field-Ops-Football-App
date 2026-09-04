@echo off
REM Runs the Snowflake -> Airtable sync non-interactively (Windows Task Scheduler).
REM Secrets come from .env.sync (gitignored, not committed) via Node's --env-file flag.
cd /d "%~dp0.."
node --env-file=.env.sync node_modules\tsx\dist\cli.mjs scripts\sync-gridiron-to-airtable.ts >> sync.log 2>&1
