# PlateQuest — Game Overview & Development Plan

Created by Jess Bliss · Player tag: **JcWoLF76**

---

## What PlateQuest Is

PlateQuest is a license plate spotting game built for road trips, family travel, school travel, and group adventures. At its simplest it is a game about seeing plates from different places and marking them as found. At its fullest it becomes a configurable shared game system with individual progress, pack progress, first-finder ownership, trip-region logic, and rarity-based scoring.

The app supports three play styles:

- **Solo** — one player, one device, self-contained
- **Shared-device family** — one device, multiple contributors, collaborative or versus
- **Live multiplayer** — each player on their own device, joined into the same live pack

That layered flexibility is one of the strongest parts of the concept. It is not one game mode pretending to serve everyone — it is a family of connected play styles built around the same travel game idea.

---

## Single-Player and Shared-Device Mode

### Overview

The original PlateQuest experience is the foundation of the whole app. This version requires no Firebase connection, no room codes, and no network reliability. It is immediate, resilient, and ideal for:

- An individual traveler playing alone
- A parent and child sharing one phone
- A family using one tablet for the entire car

### Solo Play

The player creates or selects a trip, then taps plate entries as they are spotted. The trip stores what has been found and updates progress over time. The player is simultaneously the only participant and the entire team — the cleanest and simplest version of PlateQuest.

### Family / Shared-Device Play

In family mode, the same trip is shared by multiple people on one phone or tablet. When a new plate is found, the app records which contributor found it via a contributor picker — a mobile-friendly selection flow that avoids forcing users to type a name every time.

Within one trip on one device, the game can distinguish between different contributors, making it both a shared-device tracker and a lightweight within-device competition.

### Single-Device Trip Structure

Trips are the main container for gameplay. A trip stores:

- Selected plate entries
- Who found each entry (if contributor tracking is enabled)
- Date and time each entry was found
- The current play mode

This structure is the basis for persistence and progress in the original app.

---

## Multiplayer Mode

### Overview

The multiplayer version expands PlateQuest from a one-device trip tracker into a live shared game. Each participant uses their own device and joins the same **pack** via a six-character code. Firebase backs the live syncing so everyone sees the same evolving game state.

### Player Identity

Before creating or joining a pack, a player sets a persistent identity — a name and short tag. This identity enables:

- Stable pack membership across sessions
- Session continuity after refresh or re-entry
- First-finder tracking
- Saved creator pack lists

### Creating a Pack

When a host creates a pack they configure:

| Setting | Options |
|---|---|
| Pack name | Free text |
| Primary play region | East Coast, Southeast, Midwest, Mountain West, West Coast, National / Balanced |
| Plate coverage | U.S. States Only · U.S. + Canada |
| Trip play area | Selectable U.S. state corridor representing the actual travel route |

After creation the app generates a six-character pack code that others use to join.

### Joining a Pack

A player enters the six-character code. The app includes retry and refresh support to reduce join failures. Once connected the player joins the live room and begins seeing the shared board state.

### Gameplay Mechanics

Every player can mark a plate as found for their own individual progress. The game also separately tracks who found each plate first.

**Individual ownership** — A player can record that they personally found a plate even if someone else got there first.

**First-finder ownership** — The first player to claim a plate becomes the permanent first finder. Their tag is displayed on that plate and remains even if other players later claim the same entry.

### Pack-Wide Progress

Pack-wide progress counts the unique plates found by anyone in the pack. The leaderboard shows player-by-player progress and percentages. The board visually distinguishes between:

- Plates you found
- Plates another pack member found
- First-finder ownership tags

### Session Continuity

Player identity is stored. Prior active sessions are saved. The app attempts to reconnect to known packs on return. Shared links and game codes are supported.

**Back to Setup** — A dedicated button returns the player to the create/open screen without leaving or deleting the current live pack. This lets a host safely move around the app or prepare another game without destroying the one already in progress.

---

## Creator-Owned Pack Library

Hosts who create multiple packs can access their creator library — a Firebase-backed list tied to their saved identity, with local fallback cache.

For each saved pack the library shows:

- Pack name and code
- Created time and last opened time
- Primary region and trip-area state count

From the library a creator can reopen a pack, copy its code, or remove it from their list. The library supports cross-device visibility when the same creator identity is used on another device.

---

## Canada Support

Canada is available as an optional gameplay expansion at pack creation or via pack editing.

When **U.S. + Canada** is selected, Canadian provinces and territories are added to the playable board beneath the U.S. states, sorted alphabetically within the Canada section.

**Currently included provinces and territories:**

Alberta, British Columbia, Manitoba, New Brunswick, Newfoundland and Labrador, Northwest Territories, Nova Scotia, Nunavut, Ontario, Prince Edward Island, Quebec, Saskatchewan, Yukon

Canada is part of the playable board and progress structure. Trip play-area selection is currently U.S.-state based only. Canada-specific rarity and scoring logic is planned for a future phase.

---

## Edit Pack

Hosts can open an Edit Pack modal to safely update settings after a pack is created:

- Pack name
- Primary region
- Plate coverage
- Trip play-area states

**Design rules:**

- Edits never wipe found plates
- Edits never erase individual player progress
- Edits never reset first-finder tags
- If a pack already contains Canadian plate progress, plate coverage cannot be switched back to U.S. only — doing so would create inconsistent saved state

---

## Current Functionality Summary

| Category | Status |
|---|---|
| Single-player trips | ✅ |
| Shared-device family / collaborative trips | ✅ |
| Contributor-based find attribution (single device) | ✅ |
| Multiplayer live packs | ✅ |
| Stable multiplayer identities | ✅ |
| Pack creation and joining by code | ✅ |
| Live shared state updates | ✅ |
| Individual plate progress | ✅ |
| Pack-wide unique plate counts | ✅ |
| Permanent first-finder ownership tags | ✅ |
| Creator-owned pack library | ✅ |
| Safe Back to Setup (no pack deletion) | ✅ |
| Optional Canada support in multiplayer | ✅ |
| Host-only pack editing | ✅ |
| Persistent pack reopening flows | ✅ |

---

## What Is Not Yet Fully Built

- Advanced scoring engine
- Creator library management tools (search, filters, archive, completed states)
- Map-based trip play-area setup (currently a selection grid)
- Canada integration into rarity and scoring logic
- Formal pack lifecycle model (active → completed → archived)

---

## Development Roadmap

### 1. Full Scoring Engine

The agreed scoring model:

- First finder receives full plate point value
- Later finders receive 50% of that plate's value
- The pack counts each unique plate once
- Regional completion bonuses apply to individuals and to the pack
- The first person to complete a regional bonus receives a larger reward
- Later individual completions receive a smaller reward
- The pack receives its own one-time bonus for completing a region

The app needs to compute and display:

- Individual score and pack score
- Base plate values
- First-finder bonus impact and later-finder half-credit
- Regional and sub-regional bonus outcomes
- Pack bonus outcomes

### 2. Region and Sub-Region Logic

Broad regions selected at pack creation are only the top layer. The next layer is sub-regions, used for completion challenges and nuanced scoring.

**Planned sub-regions:** New England, Mid-Atlantic, Appalachia, Great Lakes, Midwest Plains, Southeast, Southwest, Pacific Northwest, Pacific Coast, Non-Contiguous, Territories

### 3. Route-Aware Rarity

The trip play-area selector was introduced specifically to support route-aware rarity. The planned behavior:

- Plates from states within the trip corridor are lower rarity
- Plates from distant states or territories are higher rarity
- Rarity is driven by the actual corridor saved into the pack, not a generic national baseline

This makes scoring feel truly trip-specific rather than generic.

### 4. Canada Phase 2

Canada is already on the board. The next phase is Canada-aware scoring and rarity.

**Planned model (northeastern trip example):**
- Quebec and Ontario → strong finds, moderate rarity
- Western provinces → higher rarity
- Yukon, Northwest Territories, Nunavut → elite tier

### 5. Creator Library Phase 2

Future additions to the creator library:

- Search by name or code
- Filters for active, completed, and archived packs
- Sorting improvements
- Cleanup of stale or broken entries
- Stronger cross-device confidence and QA
- Clearer lifecycle management

### 6. Pack Lifecycle Model

A formal pack state model beyond "active room exists":

- Active
- Completed
- Archived

This lets hosts preserve meaningful old trips without cluttering the default active list and ties into creator library filters.

### 7. Map-Based Trip Setup

Replace the current state selection grid with a tappable U.S. map. Canada could be integrated visually in a later phase. This improves clarity, game polish, and usability.

### 8. Expanded Settings Controls

Edit Pack can later be extended to include:

- Scoring options and bonus toggles
- Pack lifecycle state transitions
- Additional host controls

The key constraint remains: settings changes must not corrupt saved gameplay.

### 9. Backward Compatibility and Migration

Older packs may not contain newer settings fields or creator-library entries. Continued migration work is needed so older packs can be safely updated, re-indexed, or edited without loss.

---

## QA Priority Order

QA has been explicitly prioritized throughout development. The recommended testing sequence:

1. Creator library sync and reopen reliability
2. Back to Setup safety
3. Edit Pack safety
4. Canada support behavior
5. Scoring engine (once built)

**Recommended implementation sequence following QA-first order:**

1. Stabilize current persistence and pack editing flows
2. Build the scoring engine foundation
3. Add regional and sub-regional bonuses
4. Improve the setup UI into a real map
5. Expand creator library management

---

## Full Product Summary

PlateQuest is a flexible road-trip license plate spotting game that can be played solo, on one shared family device, or live across multiple devices in multiplayer. In solo or shared-device mode, players create or select trips and mark plates as they are seen, with optional contributor attribution for family-style play. In multiplayer mode, players join a shared pack using a game code, maintain their own persistent identity, and contribute to a live synchronized game. The app tracks individual discoveries, pack-wide progress, and permanent first-finder ownership. Hosts can define the play region, choose whether Canada is included, set the trip corridor, reopen past packs through a creator library, and edit pack settings safely without wiping progress. The long-term vision includes route-aware rarity, dynamic plate scoring, region and sub-region completion bonuses, creator library lifecycle tools, and a polished map-based setup experience.
