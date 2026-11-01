---
name: ship
description: End-to-end delivery for Chazara Charts - turn a request into a GitHub issue and branch, implement it, test it locally (unit tests, client build, smoke check against the running app), open and merge a PR, then release to the DigitalOcean Droplet and verify the live site. Use when the user types /ship, says "ship", "build and release", "take this to production", or asks for a feature or fix to be done and deployed. Argument - a description of the task, or "release" to only deploy what is already on master.
---

# Ship: task → code → tests → PR → production

One task per run. Keep the user's task list current throughout (one phase in progress at a time).

## Phase 0 - Preflight

1. `git status --short` must be empty and the branch must be `master`. If not, stop and tell the user what is in the way.
2. `git pull --ff-only origin master`.
3. `gh auth status` must succeed.
4. `deploy.env` must exist (copy `deploy.env.example` if missing and ask the user to fill it).
5. If the argument is `release`, skip to Phase 5.

## Phase 1 - Make the task

1. Turn the user's request into a title (under 70 chars), a one-paragraph scope, and 2–5 acceptance criteria written as checkable statements. If the request is too vague to write acceptance criteria, ask one question, then continue.
2. Create the issue:
   `gh issue create --title "<title>" --body "<scope>\n\n## Acceptance criteria\n- [ ] ..."`
   Record the issue number N.
3. Branch: `git checkout -b task/N-<slug>` where slug is lowercase, hyphenated, at most 5 words.

## Phase 2 - Accomplish the task

- Follow the layout in README "Project layout". Server logic lives in `app.js` and `lib/`, data in `data/`, UI in `client/src/components/`.
- Every behaviour change to the API gets a test in `test/` (Node's built-in runner, see existing files for the pattern). UI-only changes are verified in Phase 3 instead.
- Commit in small steps with messages that say why. Reference the issue (`Refs #N`) in at least one commit.

## Phase 3 - Test that it works

Run all of these; a failure means go back to Phase 2.

1. `npm test` - all green.
2. `npm run client-build` - the production build must succeed (CRA treats warnings as errors in CI, so fix warnings too).
3. Start the running app: launch config `api` (port 3001) and `client` (port 3000, or the port the app reports). Use `preview_start`, never a raw shell.
4. `bash scripts/smoke.sh http://localhost:<client-port>` - hits health, tractates, and generates an Excel and a PDF through the dev proxy.
5. For anything with a UI change: open the page in the browser pane, exercise the changed flow, take a screenshot, and check `read_console_messages` shows no errors.
6. Re-read the acceptance criteria from the issue and confirm each one against what you observed. Any that is not met → Phase 2.

## Phase 4 - Pull request

1. `git push -u origin HEAD`
2. `gh pr create --fill --body "Closes #N\n\n<what changed and how it was tested>"`
3. `gh pr checks --watch` - CI (`.github/workflows/ci.yml`) must pass.
4. Show the user: PR link, test results, the screenshot if any, and ask **once**: "Merge and release to production?" Stop here until they answer. This is the only pause in the workflow. Merging **is** releasing.
5. On yes: `gh pr merge --squash --delete-branch`, then `git checkout master && git pull --ff-only`.

## Phase 5 - Release to production

Releases are automatic: every push to `master` that passes `test` runs `build` (image pushed to ghcr.io tagged with the short SHA) then `deploy` (Droplet pulls that tag, restarts, smoke-checks `PROD_URL`). Expect a few minutes for build, seconds for deploy.

1. After the merge, watch it: `gh run watch $(gh run list --branch master --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status`.
2. Confirm independently: `npm run smoke -- https://chazaracharts.com <short-sha>`.
3. If the deploy job fails: read `gh run view --log-failed`, then roll back from here with `npm run release -- <previous-sha>` (pulls the image CI built for that commit) and report the failure with the container logs (`ssh $DEPLOY_HOST 'cd $DEPLOY_PATH && docker compose logs --tail 100 app'`).
4. Close the loop: `gh issue close N --comment "Released in <sha>, live at <PROD_URL>"` (squash-merge usually auto-closes it; closing again is harmless).

`/ship release` with nothing new to deploy means: re-run the last master workflow (`gh run rerun <id>`) or `npm run release` by hand.

## Report

End with: issue link, PR link, deployed short SHA, live URL, and anything left undone or unverified. Nothing else.

## Rules

- Never merge, push to master directly, or deploy without the Phase 4 answer.
- Never edit files on the Droplet by hand; production only ever runs what is on `origin/master`.
- Secrets stay in `deploy.env` (gitignored). Never commit it.
