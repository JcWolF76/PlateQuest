# PlateQuest QA Checklist

## Multiplayer rejoin and room durability

### Identity and room creation
- Create a player identity with name and tag.
- Create a new multiplayer room.
- Verify the room code appears in the sticky header.
- Verify the share action includes a `?game=CODE` link.
- Confirm the room exists in Firebase under `games/<CODE>`.

### Silent rejoin after refresh
- Join or create a room.
- Refresh the page.
- Confirm the app restores the same identity.
- Confirm the app reconnects to the same room automatically.
- Confirm the leaderboard and owned sightings are preserved.

### Rejoin from shared URL
- Open the shared multiplayer URL on a second device or private window.
- Enter a new identity.
- Confirm the room code field is prefilled.
- Join the room and verify both players appear in the leaderboard.

### Presence and disconnect state
- Join the same room from two devices.
- Turn off network on one device or close the tab.
- Confirm the disconnected player eventually shows as offline/sleeping.
- Reconnect and verify the same player identity resumes cleanly.

### Host handoff
- Create a room with Player A as host.
- Join with Player B.
- Have Player A leave the room.
- Confirm Player B remains in the room.
- Confirm the room still functions and a new host is assigned.

### Last player leaving
- Create a room and leave it as the only player.
- Confirm the room is removed from Firebase.
- Confirm future joins to that code fail.

### Room limits
- Attempt to fill a room up to the configured maximum.
- Confirm additional players are rejected with a clear message.

## Multiplayer gameplay integrity

### Personal ownership of states
- In a room with two players, have Player A mark a state.
- Confirm Player A sees it as their own state.
- Confirm Player B sees it as found by another player.
- Have Player B mark a different state and verify symmetry.

### Toggle behavior
- Mark a state.
- Unmark the same state.
- Confirm the leaderboard count increments and decrements correctly.
- Confirm the room data updates accordingly in Firebase.

### Completion milestone
- Simulate reaching 50 states for a player.
- Confirm the completion toast appears.

## Single-player storage and trip management

### Profile management
- Create multiple profiles.
- Switch between them.
- Confirm trips are scoped to the selected profile.
- Delete a profile.
- Confirm associated trips are removed.

### Trip creation and persistence
- Create a trip.
- Mark several states.
- Refresh the page.
- Confirm the trip and sightings persist.

### Mode switching
- Create one trip and switch among Solo, Family, and Challenge modes.
- Confirm the trip record remains intact.
- Confirm contributor UI appears only for Family mode.
- Confirm challenge stats appear only for Challenge mode.

### Family contributor flow
- Add contributors.
- Mark states using different contributor names.
- Confirm badges render correctly on state cards.

### Challenge timing
- Create a challenge-mode trip.
- Confirm a challenge start time is created.
- Confirm current time and states-per-day update.
- Reset the trip and confirm the challenge timer resets.

## Share, import, and export

### Single-player export
- Export a trip.
- Confirm the payload includes version, profile, trip, mode, contributors, states, and totalStates.

### Cloud share
- Share a trip online.
- Confirm a collision-safe code is generated.
- Confirm the payload is written under `sharedTrips/<CODE>`.
- Re-share the same trip and confirm the same share code can be updated.

### Import shared trip
- Open a `?share=CODE` link.
- Confirm the app imports the trip into a profile.
- Confirm imported states are normalized and render correctly.
- Confirm the imported trip gets a new local trip ID.

### Legacy state compatibility
- Test importing trips that contain:
  - a simple string array of state names
  - an array of state objects
  - an object keyed by state name
- Confirm all are normalized into the current state structure.

## Regression checks
- Confirm dark mode preference persists.
- Confirm keyboard shortcuts still work.
- Confirm the multiplayer and single-player links still navigate properly.
- Confirm state flag image fallbacks still show abbreviations when images are missing.

## Recommended follow-up instrumentation
- Add a lightweight in-app diagnostics panel for:
  - current identity
  - active room code
  - Firebase connection state
  - player count
  - last sync timestamp
- Add a migration banner when old local storage is detected and upgraded.
- Add smoke tests for state normalization and room rejoin flows.
