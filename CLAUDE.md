# CLAUDE.md — Conventions for Claude Code sessions

> Read this file at the start of every session before making changes. It
> captures rules that aren't obvious from the code alone and that the user
> has been burned by Claude missing.

---

## 1. Ship to `main`. Always.

**This is the rule most often missed and the one that costs the user the most time.**

GitHub Pages serves PlateQuest from `main` at the repo root:
**https://jcwolf76.github.io/PlateQuest/**

There is no Actions workflow — Pages is configured as
*Deploy from branch: `main` / (root)*. Any push to `main` triggers a
rebuild that completes in ~1 minute.

This means **code committed to a per-session feature branch is invisible
to the live site until it's merged into `main`.**

The Claude Code on the Web harness gives each session a per-session branch
like `claude/<task-slug>-<id>` and instructs me to commit there. That
branch exists so concurrent sessions don't collide on `main` — NOT because
`main` is off-limits. The default expectation for every shippable change:

1. Commit the work on the per-session branch (per harness instructions).
2. Fast-forward / merge that branch into `main`.
3. `git push origin main`.
4. Tell the user the deploy is live and rebuild takes ~1 min.

**Do not leave finished work stuck on a feature branch.** The user has
been bitten by this multiple times — admin panel passcodes, the Sparkasia
landing page, and other fixes all sat on branches that never deployed.

Skip the merge-to-main step **only** if the user has explicitly said the
work is WIP / not ready to ship, or has asked for a PR-review flow on
this specific task.

## 2. The "PR button is green" trap

The PR/Branch view in the GitHub UI shows **branch** state, not
**deployed** state. A green checkmark there does not mean the change is
live. If the user says "I don't see my change on the site," check
`git log origin/main` first — not the branch.

## 3. Project identity

- **Owner:** Jesse Bliss. GitHub handle is **`JcWolF76`** — capital `F`,
  lowercase everything else. Don't write `JcWolf76` or `JcWoLF76` in code,
  commits, or docs.
- **Game:** PlateQuest — license plate spotting game.
- **Umbrella:** **Sparkasia** — a multi-game publisher identity. The repo
  root `index.html` is the **Sparkasia landing page**, NOT the game itself.
  PlateQuest is one card on that landing.
- **Sister title:** AnimalQuest, currently under `/animalquest/`. Slated
  for split-out to `JcWolF76/AnimalQuest`. See
  `scripts/migrate-animalquest.sh`.

## 4. License

PlateQuest is **proprietary**, not open source. See `LICENSE` for terms.
When adding new source files, include the standard header:

```
© 2026 Jesse Bliss (JcWolF76). All rights reserved.
Proprietary software — see LICENSE.
```

Never relicense, never add an SPDX comment that doesn't match `LICENSE`,
never accept "this looks MIT-ish" framing.

## 5. Layout

```
index.html              # Sparkasia landing page (NOT the game)
solo/index.html         # PlateQuest solo (single-player)
multiplayer/index.html  # PlateQuest multiplayer (Firebase RTDB)
multiplayer/admin.html  # Admin panel — codepad-gated
multiplayer/game.js     # Multiplayer game logic
multiplayer/version.json
animalquest/            # Sister game, pending cross-repo split
docs/                   # Design docs, QA checklist
scripts/                # One-shot tools (migration scripts, etc.)
flags/, us.svg          # Map and flag assets
LICENSE                 # Proprietary license
README.md               # Public-facing repo intro
```

When linking between the Sparkasia landing and the games, use **relative
paths** (`solo/index.html`, `multiplayer/index.html`,
`animalquest/index.html`) so the site works both locally and on Pages.

## 6. Mobile-first audience

The user works primarily from a mobile phone and the deployed game is
opened almost exclusively on phones.

- Keep chat responses short. Lead with the answer.
- Use `AskUserQuestion` when there are discrete choices — easier to tap
  than to type on mobile.
- Batch tool calls so the user isn't watching a slow stream.
- UI changes must be sanity-checked at mobile viewport widths (~375–414px)
  before claiming "done."
- After deploys, remind the user to **hard-refresh** — PlateQuest's
  service worker caches aggressively.

## 7. Cross-repo session limitation

Claude Code on the Web is **one repo per session by harness design**.
There's no workaround from inside a session. If the user needs to work
across PlateQuest and AnimalQuest simultaneously, point them to:

- **Two web sessions**, one per repo source (works on mobile).
- **Local Claude Code CLI on a desktop**, started from a parent directory
  containing both clones (best for genuine cross-repo work).

Don't try to clone, fetch, or push the AnimalQuest repo from a PlateQuest
session — the harness blocks it and the user will see a denied-tool error.

## 8. Never broadcast secrets into the build or git history

Passcodes, API keys, admin gates, dev tokens, and similar values are
**never** to appear in any of:

- The user-visible update modal (`multiplayer/version.json` changelog text).
- README, docs, or any other markdown file in the repo.
- Commit messages (these are public on a public repo, and even on private
  repos they're forever — git history is not a draft).
- Diff bodies of "easy to grep" form (don't write `passcode = 'XXXXXXXX'`
  in a commit if you can avoid it — refer to the file by path instead).

A previous Claude session shipped an admin passcode in the update modal
AND in a commit subject line. The value was broadcast to every visitor of
the live site AND permanently logged in git history. The only true
remediation was rotating the value, since git history can't be un-leaked.

When the user asks for a gate / passcode feature:

1. Put the value in code only (the file the gate logic lives in).
2. **Describe the change normally in commit messages — what was added,
   what files were touched, why.** The only thing you withhold is the
   sensitive literal itself. Generic-everywhere is overcorrection and
   makes the history useless for the user.
   - Good: `feat: add codepad gate to admin panel (multiplayer/admin.html) with PIN-style auth and 3-strike lockout`
   - Bad: `feat: codepad auth on admin panel, passcode 12345678` ← names the value
   - Also bad: `fix: update admin` ← so vague the user can't tell what changed
3. In any user-visible changelog or release note, describe the
   *capability* added, not the *value*.
4. Remind the user that any client-side gate (the value in `admin.html`,
   for instance) is visible in browser View Source and is **not real
   security** — it's an obscurity barrier only. Real auth requires a
   server.

The above applies **only to changes that touch sensitive values**. For
all other work — features, bug fixes, refactors, docs — write detailed,
descriptive commit messages as you normally would. The "don't name the
literal" rule is narrow; the "be informative" rule is the default.

## 9. Don't add scope

PlateQuest is an indie weekend project, not enterprise software. Avoid:

- Adding frameworks, build steps, or package managers. The site is plain
  HTML/CSS/JS served statically. Keep it that way.
- Refactoring nearby code while fixing a bug. Fix the bug, ship the bug
  fix, leave the rest alone.
- Adding "future-proofing" abstractions for features that don't exist yet.
- Writing docs files (`*.md`) unless the user explicitly asks. `docs/`
  already exists for the user's own writing.

## 10. Dates — always use today's actual date

When creating any dated identifier — version strings in
`multiplayer/version.json`, changelog entries, dated filenames, anything
that references "today" — **check the actual current date and use it.**
Do NOT mechanically bump a letter suffix on whatever date string is
already in the file; that's how `20260430b` ended up shipping on
2026-05-17.

The session's current date is provided in the harness reminder at the
top of the session prompt as `Today's date is YYYY-MM-DD`. That is the
source of truth. (You can also run `date +%Y%m%d` if needed.)

**Version string format:** `YYYYMMDD<letter>` where `<letter>` is a
lowercase suffix. First release of a new day starts at `a`; same day
again increments to `b`, `c`, etc. Crossing a date boundary always
resets to `a` for the new date — never carry the suffix sequence
across days.

Examples (assuming today is 2026-05-17):
- First push today: `20260517a` ✓
- Second push today: `20260517b` ✓
- Reusing `20260430c` because the file already had `20260430b`: ✗

## 11. Bumping `version.json` is a THREE-FILE change

A version bump must touch **all three** of these in the same commit, all
set to the same value (e.g. `20260517a`):

1. **`multiplayer/version.json`** — `"version"` field at the top, plus a
   new changelog entry keyed by the same string.
2. **`multiplayer/game.js`** — `const APP_VERSION = '...'` at line ~9
   (search `APP_VERSION`). This is the value the client compares fresh
   `version.json` against to decide whether to show the update banner.
3. **`multiplayer/index.html`** — the `?v=...` cache-buster on the
   game.js script tag (`<script src="game.js?v=YYYYMMDDx"></script>`,
   search `game.js?v=`). Without bumping this, every browser keeps
   loading the cached old `game.js` (same URL = same cache entry), so
   even after the deploy lands the user still gets the stale
   `APP_VERSION` constant.

Missing **any** of the three creates an infinite update-banner loop:

- Skip `APP_VERSION`: client fetches new `version.json`, sees mismatch,
  reloads — same old `game.js` runs with same old `APP_VERSION` — same
  mismatch — loops forever.
- Skip the script-tag `?v=`: the browser keeps the cached `game.js`
  blob keyed on `?v=<old>`, so even though `APP_VERSION` is fixed in
  the file on disk, the user never receives that file — loops forever.
- Skip `version.json`: nothing visible happens (no update modal), but
  fallback `CHANGELOG` drifts out of sync with reality.

The loop has been shipped to production three times. Do not ship a
fourth. Search-and-verify: before committing a version bump, run
`grep -E '20260[0-9]{3}[a-z]|APP_VERSION|game\\.js\\?v=' multiplayer/`
and make sure all three references agree.

Also keep the `CHANGELOG` constant near the top of `game.js` in rough
sync — that's the fallback the modal uses when the `version.json` fetch
fails (offline, CDN hiccup, etc.). It doesn't need every historical
entry, but at minimum the latest entry should be there so a fallback
modal shows real notes instead of "Performance improvements and bug
fixes."
