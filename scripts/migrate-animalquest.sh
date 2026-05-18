#!/usr/bin/env bash
#
# migrate-animalquest.sh
#
# One-time migration: copies /animalquest/ from the PlateQuest repo into a
# standalone AnimalQuest repo, rewriting cross-repo nav links to absolute URLs.
#
# Run this from a local clone of PlateQuest, on a desktop where you have
# push access to the AnimalQuest repo configured (SSH key or HTTPS token).
#
# Usage:
#     ./scripts/migrate-animalquest.sh
#
# Override any of these via environment variables if needed:
#     ANIMALQUEST_REPO        Default: git@github.com:JcWolF76/AnimalQuest.git
#     PLATEQUEST_PUBLIC_URL   Default: https://jcwolf76.github.io/PlateQuest/
#     BRANCH                  Default: main
#     WORK_DIR                Default: /tmp/animalquest-migration-<timestamp>
#
# Example with HTTPS instead of SSH:
#     ANIMALQUEST_REPO=https://github.com/JcWolF76/AnimalQuest.git \
#         ./scripts/migrate-animalquest.sh
#
# After this script runs successfully:
#   1. Enable GitHub Pages on the AnimalQuest repo (Settings → Pages → Deploy
#      from a branch → main / root).
#   2. Verify AnimalQuest loads at https://jcwolf76.github.io/AnimalQuest/.
#   3. In PlateQuest, update index.html's AnimalQuest TODO link to that URL,
#      then `git rm -r animalquest/` and commit. (Do this only after the new
#      site is confirmed live so the landing card never points to a 404.)
#
# This script does NOT preserve git history of /animalquest/. The migrated
# content lands as a single fresh commit on the AnimalQuest repo. If you
# need history preserved, see `git subtree split --prefix=animalquest`.

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────
ANIMALQUEST_REPO="${ANIMALQUEST_REPO:-git@github.com:JcWolF76/AnimalQuest.git}"
PLATEQUEST_PUBLIC_URL="${PLATEQUEST_PUBLIC_URL:-https://jcwolf76.github.io/PlateQuest/}"
BRANCH="${BRANCH:-main}"
WORK_DIR="${WORK_DIR:-/tmp/animalquest-migration-$(date +%Y%m%d-%H%M%S)}"

# ── Helpers ──────────────────────────────────────────────────────────────
say() { printf "\033[1;36m==>\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[!]\033[0m %s\n" "$*" >&2; }
die() { printf "\033[1;31m[x]\033[0m %s\n" "$*" >&2; exit 1; }

# ── Sanity checks ────────────────────────────────────────────────────────
command -v git >/dev/null || die "git not found in PATH"
command -v rsync >/dev/null || die "rsync not found in PATH"
command -v sed >/dev/null || die "sed not found in PATH"

# Anchor to the PlateQuest repo root regardless of where the script is invoked.
PQ_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" \
    || die "Not inside a git repo. Run this from your PlateQuest clone."

cd "$PQ_ROOT"

[[ -d animalquest ]] \
    || die "animalquest/ not found under $PQ_ROOT — wrong repo, or already removed?"
[[ -f animalquest/index.html ]] \
    || die "animalquest/index.html missing — repo state is incomplete."

# ── Plan summary + confirmation ──────────────────────────────────────────
cat <<EOF

AnimalQuest migration
─────────────────────
  Source repo:        $PQ_ROOT
  Source dir:         animalquest/
  Target repo:        $ANIMALQUEST_REPO
  Target branch:      $BRANCH
  PlateQuest URL:     $PLATEQUEST_PUBLIC_URL
  Work dir:           $WORK_DIR

What this does:
  1. Clones $ANIMALQUEST_REPO into the work dir.
  2. Copies animalquest/ contents into the clone root (preserving
     multiplayer/ subdir).
  3. Rewrites two "Back to PlateQuest" nav links from relative paths
     to $PLATEQUEST_PUBLIC_URL.
  4. Adds LICENSE (copied from PlateQuest), .gitignore, and a starter
     README.md if those don't already exist in the target.
  5. Commits and pushes to origin/$BRANCH.

This does NOT touch PlateQuest's /animalquest/ directory. You can run
cleanup as a follow-up commit once the new site is live.

EOF
read -r -p "Proceed? (y/N) " reply
[[ "$reply" =~ ^[Yy]$ ]] || { say "Aborted."; exit 0; }

# ── Clone target ─────────────────────────────────────────────────────────
say "Cloning $ANIMALQUEST_REPO into $WORK_DIR ..."
git clone "$ANIMALQUEST_REPO" "$WORK_DIR" \
    || die "Clone failed. Check the URL and your push credentials."

cd "$WORK_DIR"

# Resolve target branch — create if it doesn't exist yet (fresh repo).
if git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
    git checkout "$BRANCH"
else
    say "Branch $BRANCH doesn't exist on remote; creating it."
    git checkout -b "$BRANCH"
fi

# Detect non-empty target (anything beyond .git) — warn but continue, so
# initial-commit files (README, LICENSE) get overwritten cleanly below.
if [[ -n "$(ls -A . 2>/dev/null | grep -v '^\.git$' || true)" ]]; then
    warn "Target repo has existing files. They'll be overwritten if names collide."
fi

# ── Copy AnimalQuest content ─────────────────────────────────────────────
say "Copying animalquest/ contents into target repo root ..."
rsync -a --exclude='.git' "$PQ_ROOT/animalquest/" .

# ── Rewrite cross-repo nav links ─────────────────────────────────────────
say "Rewriting cross-repo nav links to $PLATEQUEST_PUBLIC_URL ..."

# Strip trailing slash for consistent sed output.
PQ_URL_CLEAN="${PLATEQUEST_PUBLIC_URL%/}"

# index.html line ~530: "Back to PlateQuest" link
sed -i.bak \
    "s|href=\"\\.\\./index\\.html\" class=\"version-link\">🚗 Back to PlateQuest|href=\"$PQ_URL_CLEAN/\" class=\"version-link\">🚗 Back to PlateQuest|g" \
    index.html
rm -f index.html.bak

# multiplayer/index.html line ~339: cross-link to PlateQuest
if [[ -f multiplayer/index.html ]]; then
    sed -i.bak \
        "s|href=\"\\.\\./\\.\\./index\\.html\">🪪 PlateQuest|href=\"$PQ_URL_CLEAN/\">🪪 PlateQuest|g" \
        multiplayer/index.html
    rm -f multiplayer/index.html.bak
fi

# Sanity: make sure rewrites took.
if grep -q "href=\"\\.\\./index\\.html\" class=\"version-link\">🚗 Back to PlateQuest" index.html 2>/dev/null; then
    die "Rewrite failed: index.html still has relative Back-to-PlateQuest link."
fi

# ── LICENSE ──────────────────────────────────────────────────────────────
if [[ ! -f LICENSE ]] && [[ -f "$PQ_ROOT/LICENSE" ]]; then
    say "Copying LICENSE from PlateQuest ..."
    cp "$PQ_ROOT/LICENSE" LICENSE
fi

# ── .gitignore ───────────────────────────────────────────────────────────
if [[ ! -f .gitignore ]]; then
    say "Creating .gitignore ..."
    cat > .gitignore <<'IGNORE_EOF'
.DS_Store
*.swp
*.bak
.idea/
.vscode/
node_modules/
IGNORE_EOF
fi

# ── README starter ───────────────────────────────────────────────────────
if [[ ! -f README.md ]]; then
    say "Creating starter README.md ..."
    cat > README.md <<'README_EOF'
# AnimalQuest

**Wildlife spotting on the open road — a Sparkasia title by JcWolF.**

Sister game to [PlateQuest](https://jcwolf76.github.io/PlateQuest/). Same engine
philosophy: open the page, start a trip, tap creatures as you spot them. Solo
or live multiplayer with the rest of the car.

---

## Run it

Open `index.html` in any browser. No build step, no install. Works offline
for single-player; multiplayer needs Firebase credentials configured.

For hosting, upload the repo contents to any static host (GitHub Pages, Netlify,
Cloudflare Pages). The canonical deploy is
https://jcwolf76.github.io/AnimalQuest/.

## Multiplayer

Live multiplayer uses Firebase Realtime Database. The host creates a pack,
shares a six-character code, and everyone on their own device sees the same
live leaderboard. See `multiplayer/index.html`.

## Sister title

PlateQuest — license plate spotting across all 50 states plus Canadian
provinces. https://jcwolf76.github.io/PlateQuest/

---

## License

**AnimalQuest is proprietary software — © 2026 Jesse Bliss (JcWolF).
All rights reserved.**

Source-available, not open source. You may not copy, modify, redistribute, or
use any part of this Software — including the name "AnimalQuest", the artwork,
or any of the game content — without prior written permission. See `LICENSE`
for the full terms.
README_EOF
fi

# ── Commit + push ────────────────────────────────────────────────────────
git add -A

if git diff --staged --quiet; then
    warn "Nothing to commit — the target already matches the source."
    say "Done (no changes pushed)."
    exit 0
fi

say "Committing ..."
git commit -m "feat: migrate AnimalQuest from PlateQuest monorepo

Initial standalone snapshot of AnimalQuest, split out from the PlateQuest
repo as part of the Sparkasia umbrella restructure. Cross-repo nav links
rewritten to absolute PlateQuest URL. No /animalquest/ history preserved;
see PlateQuest repo for prior commits."

say "Pushing to origin/$BRANCH ..."
git push -u origin "$BRANCH"

# ── Summary ──────────────────────────────────────────────────────────────
AQ_PUBLIC_URL="${PQ_URL_CLEAN/PlateQuest/AnimalQuest}/"

cat <<EOF

────────────────────────────────────────────────────────────────────
✅  AnimalQuest is now in its own repo.

Next steps (do these in this order):

  1.  Enable GitHub Pages on the AnimalQuest repo:
        Settings → Pages → Build & Deploy → Branch: $BRANCH / (root)

  2.  Wait ~1 minute, then verify it loads:
        $AQ_PUBLIC_URL

  3.  Back in the PlateQuest repo, update index.html's AnimalQuest card:
        - Swap the href from "animalquest/index.html" to:
            $AQ_PUBLIC_URL
        - Remove the "TODO" comment block above that anchor.

  4.  Once the new site is confirmed live, remove the local copy:
        git rm -r animalquest/
        git commit -m "chore: remove /animalquest/ (migrated to its own repo)"
        git push

────────────────────────────────────────────────────────────────────
EOF
