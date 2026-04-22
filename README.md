# PlateQuest

A license plate spotting game for road trips, family travel, school travel, and group adventures.

Created by **Jess Bliss** · Player tag: **JcWoLF76**

---

## Play Styles

PlateQuest supports three ways to play:

| Mode | Description |
|---|---|
| **Solo** | One player, one device — no setup required |
| **Shared-device family** | Multiple contributors on one phone or tablet |
| **Live multiplayer** | Each player on their own device, joined into the same live pack |

---

## Single-Player and Shared-Device Play

### Solo

1. Open the game and create a trip.
2. Tap a plate entry whenever you spot that plate.
3. Your progress is saved automatically — close and reopen whenever you like.

### Family / Shared-Device

1. Create a trip and choose **Family** mode.
2. When a plate is spotted, select the contributor who found it from the picker.
3. The game records individual finds within the shared trip.

---

## Multiplayer

### Setup

1. Set your player identity — a name and short tag.
2. **Create a pack** or **join one** using a six-character code.

### Pack Creation Options

- **Pack name** — a label for your trip or game
- **Primary play region** — East Coast, Southeast, Midwest, Mountain West, West Coast, or National / Balanced
- **Plate coverage** — U.S. States Only or U.S. + Canada
- **Trip play area** — the U.S. states your trip will actually pass through

### Joining

Enter the six-character pack code. The app prefills the code automatically when opening a shared link.

### How It Works

- Every player marks plates from their own device.
- The pack board updates live for all members.
- The **first player** to claim a plate becomes the permanent **first finder** — their tag stays on that plate even if others find it later.
- Each player also keeps their own individual found count.
- The **leaderboard** shows everyone's progress and percentages.

### Session Safety

- Your identity and last active pack are saved — refresh the page and you reconnect automatically.
- **Back to Setup** returns to the create/join screen without leaving or deleting your current pack.

---

## Canada

When **U.S. + Canada** is selected at pack creation (or via Edit Pack), all Canadian provinces and territories are added to the playable board beneath the U.S. states.

Included: Alberta, British Columbia, Manitoba, New Brunswick, Newfoundland and Labrador, Northwest Territories, Nova Scotia, Nunavut, Ontario, Prince Edward Island, Quebec, Saskatchewan, Yukon.

---

## Creator Pack Library

If you create packs regularly, the creator library saves them for you — no need to remember codes manually. From the library you can reopen a pack, copy its code, or remove it from the list. The library is Firebase-backed with local cache for offline access.

---

## Edit Pack

Hosts can update pack settings after creation without losing any progress:

- Pack name, primary region, plate coverage, trip play area
- Found plates, individual scores, and first-finder tags are never affected by edits

---

## Hosting the Game

To run PlateQuest locally:

1. Clone or download this repository.
2. Open `index.html` in any browser — no build step required.
3. For multiplayer features, Firebase credentials must be configured in the app.

To host publicly, upload to GitHub Pages or any static file host.

---

## Documentation

- [`docs/GAME_OVERVIEW_AND_ROADMAP.md`](docs/GAME_OVERVIEW_AND_ROADMAP.md) — full game design overview, feature descriptions, and development roadmap
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — QA checklist for multiplayer, single-player, and share/import flows

---

Happy spotting!
