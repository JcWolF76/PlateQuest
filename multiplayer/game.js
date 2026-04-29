// PlateQuest Multiplayer v2
// Durable room membership, stable player identity, silent rejoin,
// first-finder tags, host-configured trip play area, and optional Canada support.

const APP_VERSION = '20260429f';

const TAUNT_LIST = [
    "Watch out, [name] — I'm coming for that top spot! 🚗💨",
    "You snooze, you lose that first-finder bonus, [name]! 😴",
    "Nice score, [name]... if this were last round. 👀",
    "Better eyes next time, [name]! That plate was right there. 🙈",
    "I can see first place from here, [name]. Can you? 🏆",
    "Don't blink, [name] — rare plates don't wait! ⚡",
    "The scoreboard doesn't lie, [name]. Just saying. 📊",
    "Found it first, [name]. Maybe next highway! 🛣️",
    "Keep refreshing — the view from second place isn't getting better, [name]. 😂",
    "What's that sound? Oh, just me finding plates while you're napping, [name]! 🎉",
];

// Available player icons — 🐺 is reserved for the developer (JcWolF tag)
const PLAYER_ICONS = ['🦊','🐻','🐯','🦁','🦅','🐸','🦝','🦉','🦄','🐲','🦋','🚗','🦈','🐬','🦖','🦏','🦬','🐆','🦓','🐘','🦒','🦜','🐊','🦦'];

const SHOP_ITEMS = [
    { id: 'blender',  name: 'Blender',      icon: '🌀', cost: 40, effectKey: 'blender', duration: 3*60*1000,
      category: 'trick',   desc: 'Scrambles the plate order for all other players for 3 minutes.' },
    { id: 'freeze',   name: 'Time Freeze',  icon: '⏸️', cost: 75, effectKey: 'freeze',  duration: 2*60*1000,
      category: 'trick',   desc: 'Blocks other players from spotting new plates for 2 minutes.' },
    { id: 'fog',      name: 'Fog of War',   icon: '🌫️', cost: 50, effectKey: 'fog',     duration: 5*60*1000,
      category: 'trick',   desc: "Hides everyone else's scores and plate counts for 5 minutes." },
    { id: 'shield',   name: 'Shield',       icon: '🛡️', cost: 35, effectKey: 'shield',  duration: null,
      category: 'defense', desc: 'Blocks the next trick used against you. One use only.' },
];

const STREAK_WINDOW_MS = 10 * 60 * 1000; // plates found within this window count toward the streak

const STREAK_BONUSES = [
    { count: 3,  coins: 10 },
    { count: 5,  coins: 25 },
    { count: 10, coins: 50 },
];

// check(stats, player, totalPlates) — undefined check means manually awarded
const ACHIEVEMENTS = [
    { id: 'first_plate',  icon: '🥇', name: 'First Find',       desc: 'Spot your very first plate',
      check: s         => s.foundCount >= 1 },
    { id: 'plates_10',   icon: '🔟', name: 'Tenner',            desc: 'Find 10 plates',
      check: s         => s.foundCount >= 10 },
    { id: 'plates_25',   icon: '💪', name: 'Quarter Century',   desc: 'Find 25 plates',
      check: s         => s.foundCount >= 25 },
    { id: 'plates_50',   icon: '🏅', name: 'Half Century',      desc: 'Find 50 plates',
      check: s         => s.foundCount >= 50 },
    { id: 'plates_all',  icon: '🏆', name: 'Road Legend',       desc: 'Find every available plate',
      check: (s,_,t)   => t > 0 && s.foundCount >= t },
    { id: 'ff_1',        icon: '⭐', name: 'Eagle Eye',         desc: 'Be first finder on any plate',
      check: s         => s.firstCount >= 1 },
    { id: 'ff_5',        icon: '🌟', name: 'Sharp Spotter',     desc: 'First finder on 5 plates',
      check: s         => s.firstCount >= 5 },
    { id: 'ff_15',       icon: '💫', name: 'First Hunter',      desc: 'First finder on 15 plates',
      check: s         => s.firstCount >= 15 },
    { id: 'region_1',   icon: '🗺️', name: 'Regional Scout',   desc: 'Complete any region or sub-region',
      check: s         => (s.completedSubBonuses?.length||0) + (s.completedRegionBonuses?.length||0) >= 1 },
    { id: 'region_3',   icon: '🌎', name: 'Road Mapper',        desc: 'Complete 3 regions',
      check: s         => (s.completedSubBonuses?.length||0) + (s.completedRegionBonuses?.length||0) >= 3 },
    { id: 'corridor',   icon: '🛣️', name: 'The Corridor',       desc: 'Complete the full travel corridor',
      check: s         => s.corridorComplete },
    { id: 'streak_5',   icon: '🔥', name: 'On Fire',            desc: 'Build a 5-plate streak',
      check: (s,p)     => (p?.streak?.count||0) >= 5 },
    { id: 'streak_10',  icon: '🌋', name: 'Unstoppable',        desc: 'Build a 10-plate streak',
      check: (s,p)     => (p?.streak?.count||0) >= 10 },
    { id: 'coins_100',  icon: '💰', name: 'Coin Collector',     desc: 'Hold 100 coins at once',
      check: (s,p)     => (p?.coins||0) >= 100 },
    { id: 'coins_500',  icon: '💎', name: 'High Roller',        desc: 'Hold 500 coins at once',
      check: (s,p)     => (p?.coins||0) >= 500 },
    { id: 'alaska',     icon: '🧊', name: 'Frozen North',       desc: 'Spot Alaska',
      check: s         => s.foundSet?.has('Alaska') },
    { id: 'hawaii',     icon: '🌺', name: 'Aloha!',             desc: 'Spot Hawaii',
      check: s         => s.foundSet?.has('Hawaii') },
    { id: 'dc',         icon: '🏛️', name: 'Capital Spotter',   desc: 'Spot Washington DC',
      check: s         => s.foundSet?.has('Washington DC') },
    { id: 'lucky',      icon: '🍀', name: 'Lucky Break',        desc: 'Find the Lucky Plate',
      check: (s,p)     => gameData?.luckyPlateFound?.foundByKey === p?.playerKey },
    // manually awarded:
    { id: 'bounty_hunter', icon: '🎯', name: 'Bounty Hunter',   desc: 'Claim a bounty on any plate' },
    { id: 'speed_podium',  icon: '⚡', name: 'Road Sprinter',   desc: 'Finish top 3 in a Speed Round' },
];

const COIN_RATES = {
    plateFind:          2,   // any plate spotted
    plateFirst:         5,   // first finder bonus on top
    subRegionFirst:    15,   // first to complete a sub-region
    subRegionLater:     5,   // later completions
    primaryRegionFirst:25,   // first to complete a primary region
    primaryRegionLater:10,
    corridorFirst:     50,   // first to complete the corridor
    corridorLater:     20,
};

// Release notes shown to players when an update is detected
const CHANGELOG = {
    '20260424a': [
        '😈 Taunts — fire friendly trash talk at specific players or the whole pack',
    ],
    '20260424b': [
        '🔁 New Round — host can wipe all plates and start fresh without breaking up the pack',
        '🔄 Refresh button added to the header for web-app users (no browser bar = no problem)',
        '📍 GPS permission now fires at game join for GPS-rarity games, not on first swipe',
    ],
    '20260424c': [
        '⚑ Dispute a plate first-finder — tap the flag on any plate someone else claimed first',
        '🔧 Fixed: region dispute button was showing on badges YOU already held (now shows on others)',
    ],
    '20260424d': [
        '🔧 Fixed: player card icons were overlapping name text on the leaderboard',
    ],
    '20260424e': [
        '💬 Pack Chat — open group messaging for the whole pack with a community use policy',
        '🔴 Unread badge on the Chat button so you never miss a message',
    ],
    '20260424f': [
        '📦 My Packs — setup screen now remembers up to 8 games you\'ve previously joined',
        '▶️ Jump back into any remembered pack instantly without re-entering the code',
    ],
    '20260424g': [
        '🔧 Fixed: decorative icons were floating over the Pack Leaderboard title',
    ],
    '20260424h': [
        '🎨 Player icons — pick your emoji (fox, bear, tiger, owl, and more) shown large on your card',
        '🏷️ Player tags now support mixed case — your tag displays exactly as you typed it',
    ],
    '20260424i': [
        '🐺 Wolf icon is now developer-exclusive — reserved for the dev account only',
        '🛠️ Admin panel shortcut button now appears in-game for the developer account',
    ],
    '20260424j': [
        '📋 Update notes — you\'re reading one right now! New releases show a summary of what changed',
    ],
    '20260424k': [
        '🐛 Report a Bug — tap Feedback to tell JcWolF exactly what went wrong',
        '💡 Request a Feature — got an idea? Submit it and it goes straight to the dev queue',
        '🎟️ Feedback button lives in the game action bar and on the setup screen — always one tap away',
    ],
    '20260424l': [
        '🗂️ Action buttons reorganized into labeled sections: Host Controls, Social, Pack, My Game, and App',
        '🔲 All buttons now use a consistent 2-column grid — no more random sizes and orphaned buttons',
        '🚪 Leave Pack now has a distinct style so it\'s easy to spot but won\'t be tapped by accident',
    ],
    '20260424m': [
        '🐺 Admin Panel button now visible regardless of how tag case was stored — no more missing button',
        '🔧 Audit re-run now confirms with a toast so you know it actually ran',
    ],
    '20260424n': [
        '✏️ Edit Identity — change your name, tag, or icon anytime from the My Game section',
        '🔄 Identity updates sync live to the pack — no need to leave and rejoin',
    ],
    '20260424o': [
        '🎨 Icon picker expanded to 24 options — shark, dolphin, dino, leopard, otter, and more',
    ],
    '20260426a': [
        '🪙 Coin system — earn coins every time you spot a plate or complete a region',
        '⭐ First finders earn bonus coins — 5🪙 for claiming a plate first, 2🪙 for any find',
        '🗺️ Region bonuses — up to 50🪙 for completing the corridor first',
        '👛 Your coin balance shows live in the header and on every player card',
    ],
    '20260426b': [
        '🏪 Pack Shop — spend your coins on tricks to mess with the competition',
        '🌀 Blender (40🪙) — scrambles the plate order for everyone else for 3 minutes',
        '⏸️ Time Freeze (75🪙) — blocks other players from spotting plates for 2 minutes',
        '🌫️ Fog of War (50🪙) — hides all scores from other players for 5 minutes',
        '🛡️ Shield (35🪙) — blocks the next trick used against you',
    ],
    '20260426c': [
        '🍀 Lucky Plate — one secret plate is worth triple points. Find it to win big.',
        '🎁 Hidden Chests — scattered across plates, each holds coins, a trick, or a shield',
        'Chests appear as 🎁 on unclaimed plates — claim the plate to open the chest',
        'Host can re-roll prizes anytime with the new 🎲 Re-roll button in Host Controls',
    ],
    '20260427a': [
        '🔥 Quick Reactions — tap 🔥 😮 👏 💀 on anyone\'s score card to react in real time',
        'Reactions float up on the target\'s card so everyone sees the moment',
        '🔥 Streaks — spot plates in a row within 10 minutes to earn bonus coins',
        '3 plates: +10🪙 · 5 plates: +25🪙 · 10 plates: +50🪙',
        'Streak count shows on your score card when you\'re on a hot run',
    ],
    '20260427b': [
        '💰 Bounties — host can place a coin bounty on any plate; first finder wins the reward',
        'Bounty amount shows right on the plate card so everyone knows what\'s at stake',
        '⚡ Speed Round — host launches a timed sprint (3 / 5 / 10 min) for extra coin bonuses',
        'Top 3 plate-finders in the window earn 100🪙, 60🪙, and 30🪙 — the pack gets final results',
        '🏁 Blackout — first player to find ALL available plates wins a 500🪙 bonus',
    ],
    '20260427c': [
        '🏆 Achievements — 21 unlockable milestones tracked per player per game',
        'Eagle Eye, Road Legend, Unstoppable, Lucky Break, Bounty Hunter, and more',
        'Achievements show in your player profile with locked/unlocked status',
        'Your achievement count is visible on your score card for the whole pack to see',
    ],
    '20260427d': [
        '🎯 Secret Targets — host assigns each player a hidden target plate worth +200🪙 as first finder',
        'Your target shows as a private banner above the plate grid — only you can see it',
        '⚔️ Rivalries — challenge any player to a rivalry; head-to-head comparison shows in their profile',
        '🔔 Sudden Death — host announces a plate; first player to tap it wins 150🪙',
    ],
    '20260427e': [
        '🔍 Audit expanded — now checks and repairs coin balances and missing achievements for all players',
        '🔢 Developer PIN keypad fixed — digits now register correctly on all devices',
    ],
    '20260427f': [
        '🛡️ Update notifications no longer cause a silent reload — you now always see the banner and choose when to update',
    ],
    '20260427g': [
        '🏆 Winners Circle — tap "Winners Circle" on the End Game screen to generate a shareable graphic of the top 3 players with a custom description, shareable via text, email, or saved as a photo',
    ],
    '20260427h': [
        '📖 How to Play — a welcome guide now appears every time you join a game explaining swiping, scoring, and features. Tap ? next to License Plates to reopen it anytime',
        '👆 Swipe hint bar added at the top of the plate list as a permanent quick reference',
    ],
    '20260429a': [
        '🎯 Secret Targets — pressing the button now assigns a target plate to every player in the pack, including anyone temporarily offline. Each player sees their own target privately and it stays until they find it first.',
    ],
    '20260429b': [
        '🔄 Update notifications fixed — the banner no longer reappears after you update, and if you missed several updates you\'ll see all of them listed together in one go',
    ],
    '20260429c': [
        '📣 Announcements and taunts now reliably reach all players — previously a race condition could cause other pack members to miss them entirely',
    ],
    '20260429d': [
        '📱 Swiping on plates no longer causes the screen to bounce horizontally — left swipes and swipes on already-spotted plates are now fully absorbed by the card instead of the page',
    ],
    '20260429e': [
        '📖 How to Play instructions are now available anytime via the How2Play button in the top bar — they no longer pop up automatically on every join',
        '📵 Horizontal page bounce fully suppressed at the document level',
    ],
    '20260429f': [
        '💬 Chat now supports private messages — tap the recipient chips above the input to send to specific players or everyone. The host and pack leader always see all messages. Private messages show a 🔒 lock indicator.',
    ],
};

const firebaseConfig = {
    apiKey: "AIzaSyADgN2_6yMeIuWRZxsXdlUUjmZEd_Rn9qQ",
    authDomain: "platequest-multiplayer.firebaseapp.com",
    databaseURL: "https://platequest-multiplayer-default-rtdb.firebaseio.com/",
    projectId: "platequest-multiplayer",
    storageBucket: "platequest-multiplayer.firebasestorage.app",
    messagingSenderId: "109596979102",
    appId: "1:109596979102:web:586740c408daec71af708f"
};

const US_PLATES = [
    { name: "Alabama", abbr: "AL", category: "us" }, { name: "Alaska", abbr: "AK", category: "us" }, { name: "Arizona", abbr: "AZ", category: "us" }, { name: "Arkansas", abbr: "AR", category: "us" },
    { name: "California", abbr: "CA", category: "us" }, { name: "Colorado", abbr: "CO", category: "us" }, { name: "Connecticut", abbr: "CT", category: "us" }, { name: "Delaware", abbr: "DE", category: "us" },
    { name: "Florida", abbr: "FL", category: "us" }, { name: "Georgia", abbr: "GA", category: "us" }, { name: "Hawaii", abbr: "HI", category: "us" }, { name: "Idaho", abbr: "ID", category: "us" },
    { name: "Illinois", abbr: "IL", category: "us" }, { name: "Indiana", abbr: "IN", category: "us" }, { name: "Iowa", abbr: "IA", category: "us" }, { name: "Kansas", abbr: "KS", category: "us" },
    { name: "Kentucky", abbr: "KY", category: "us" }, { name: "Louisiana", abbr: "LA", category: "us" }, { name: "Maine", abbr: "ME", category: "us" }, { name: "Maryland", abbr: "MD", category: "us" },
    { name: "Massachusetts", abbr: "MA", category: "us" }, { name: "Michigan", abbr: "MI", category: "us" }, { name: "Minnesota", abbr: "MN", category: "us" }, { name: "Mississippi", abbr: "MS", category: "us" },
    { name: "Missouri", abbr: "MO", category: "us" }, { name: "Montana", abbr: "MT", category: "us" }, { name: "Nebraska", abbr: "NE", category: "us" }, { name: "Nevada", abbr: "NV", category: "us" },
    { name: "New Hampshire", abbr: "NH", category: "us" }, { name: "New Jersey", abbr: "NJ", category: "us" }, { name: "New Mexico", abbr: "NM", category: "us" }, { name: "New York", abbr: "NY", category: "us" },
    { name: "North Carolina", abbr: "NC", category: "us" }, { name: "North Dakota", abbr: "ND", category: "us" }, { name: "Ohio", abbr: "OH", category: "us" }, { name: "Oklahoma", abbr: "OK", category: "us" },
    { name: "Oregon", abbr: "OR", category: "us" }, { name: "Pennsylvania", abbr: "PA", category: "us" }, { name: "Rhode Island", abbr: "RI", category: "us" }, { name: "South Carolina", abbr: "SC", category: "us" },
    { name: "South Dakota", abbr: "SD", category: "us" }, { name: "Tennessee", abbr: "TN", category: "us" }, { name: "Texas", abbr: "TX", category: "us" }, { name: "Utah", abbr: "UT", category: "us" },
    { name: "Vermont", abbr: "VT", category: "us" }, { name: "Virginia", abbr: "VA", category: "us" }, { name: "Washington", abbr: "WA", category: "us" }, { name: "Washington DC", abbr: "DC", category: "us" },
    { name: "West Virginia", abbr: "WV", category: "us" }, { name: "Wisconsin", abbr: "WI", category: "us" }, { name: "Wyoming", abbr: "WY", category: "us" }
];

const TERRITORY_PLATES = [
    { name: "Puerto Rico",              abbr: "PR",   category: "territory" },
    { name: "US Virgin Islands",         abbr: "USVI", category: "territory" },
    { name: "American Samoa",           abbr: "AS",   category: "territory" },
    { name: "Guam",                     abbr: "GU",   category: "territory" },
    { name: "Northern Mariana Islands", abbr: "CNMI", category: "territory" }
];

const CANADA_PLATES = [
    { name: "Alberta", abbr: "AB", category: "canada" },
    { name: "British Columbia", abbr: "BC", category: "canada" },
    { name: "Manitoba", abbr: "MB", category: "canada" },
    { name: "New Brunswick", abbr: "NB", category: "canada" },
    { name: "Newfoundland and Labrador", abbr: "NL", category: "canada" },
    { name: "Northwest Territories", abbr: "NT", category: "canada" },
    { name: "Nova Scotia", abbr: "NS", category: "canada" },
    { name: "Nunavut", abbr: "NU", category: "canada" },
    { name: "Ontario", abbr: "ON", category: "canada" },
    { name: "Prince Edward Island", abbr: "PE", category: "canada" },
    { name: "Quebec", abbr: "QC", category: "canada" },
    { name: "Saskatchewan", abbr: "SK", category: "canada" },
    { name: "Yukon", abbr: "YT", category: "canada" }
];

const PRIMARY_REGIONS = {
    // Eight non-overlapping primary regions — all 50 US states, exactly once
    new_england:   { label: 'New England' },
    mid_atlantic:  { label: 'Mid-Atlantic' },
    southeast:     { label: 'Southeast' },
    gulf_south:    { label: 'Gulf South' },
    great_lakes:   { label: 'Great Lakes' },
    great_plains:  { label: 'Great Plains' },
    mountain_west: { label: 'Mountain West' },
    pacific:       { label: 'Pacific' },
    // Broad presets
    eastern_us:    { label: 'Eastern US' },
    western_us:    { label: 'Western US' },
    national:      { label: 'National / Balanced' },
    // Legacy keys — kept so existing packs continue to display correctly
    northeast:         { label: 'Northeast' },
    south:             { label: 'Southern States' },
    gulf_coast:        { label: 'Gulf Coast' },
    midwest:           { label: 'Midwest' },
    southwest:         { label: 'Southwest' },
    pacific_northwest: { label: 'Pacific Northwest' },
    west_coast:        { label: 'West Coast' },
    east_coast:        { label: 'East Coast' },
};

const SUB_REGIONS = {
    // US sub-regions — thematic groupings, distinct names from all primary regions
    appalachia:       { label: 'Appalachia',        states: ['West Virginia','Virginia','Kentucky','Tennessee','North Carolina'] },
    chesapeake_bay:   { label: 'Chesapeake Bay',    states: ['Maryland','Delaware','Virginia'] },
    the_carolinas:    { label: 'The Carolinas',     states: ['North Carolina','South Carolina'] },
    deep_south:       { label: 'Deep South',        states: ['Alabama','Mississippi','Georgia','South Carolina'] },
    gulf_coast:       { label: 'Gulf Coast',        states: ['Florida','Alabama','Mississippi','Louisiana','Texas'] },
    four_corners:     { label: 'Four Corners',      states: ['Utah','Colorado','Arizona','New Mexico'] },
    rocky_mountains:  { label: 'Rocky Mountains',   states: ['Montana','Idaho','Wyoming','Colorado'] },
    pacific_northwest:{ label: 'Pacific Northwest', states: ['Washington','Oregon'] },
    southwest_desert: { label: 'Southwest Desert',  states: ['Arizona','New Mexico','Nevada'] },
    corn_belt:        { label: 'Corn Belt',         states: ['Iowa','Illinois','Indiana','Ohio','Missouri'] },
    non_contiguous:   { label: 'Non-Contiguous',    states: ['Alaska','Hawaii'] },
    eastern_seaboard: { label: 'Eastern Seaboard',  states: ['Maine','New Hampshire','Massachusetts','Rhode Island','Connecticut','New York','New Jersey','Pennsylvania','Delaware','Maryland','Virginia','North Carolina','South Carolina','Georgia','Florida'] },
    // Canadian sub-regions
    canada_east:        { label: 'Eastern Canada',       states: ['Ontario','Quebec','New Brunswick','Nova Scotia','Prince Edward Island','Newfoundland and Labrador'] },
    canada_central:     { label: 'Central Canada',       states: ['Manitoba','Saskatchewan'] },
    canada_west:        { label: 'Western Canada',       states: ['Alberta','British Columbia'] },
    canada_territories: { label: 'Canadian Territories', states: ['Yukon','Northwest Territories','Nunavut'] },
};

// Primary regions with state lists for completion tracking and badges.
// Keys match PRIMARY_REGIONS; state names match US_PLATES exactly.
const REGION_STATES = {
    new_england:   ['Maine','New Hampshire','Vermont','Massachusetts','Rhode Island','Connecticut'],
    mid_atlantic:  ['New York','New Jersey','Pennsylvania','Delaware','Maryland','Virginia','West Virginia'],
    southeast:     ['North Carolina','South Carolina','Georgia','Florida','Tennessee','Kentucky'],
    gulf_south:    ['Alabama','Mississippi','Louisiana','Arkansas','Texas','Oklahoma'],
    great_lakes:   ['Ohio','Michigan','Indiana','Illinois','Wisconsin','Minnesota'],
    great_plains:  ['Iowa','Missouri','North Dakota','South Dakota','Nebraska','Kansas'],
    mountain_west: ['Montana','Idaho','Wyoming','Colorado','Utah','Nevada','Arizona','New Mexico'],
    pacific:       ['Washington','Oregon','California','Alaska','Hawaii'],
};

const PLAY_AREA_PRESETS = {
    // Primary region presets — match new 8-region structure
    new_england:   ['ME','NH','VT','MA','RI','CT'],
    mid_atlantic:  ['NY','NJ','PA','DE','MD','VA','WV'],
    southeast:     ['NC','SC','GA','FL','TN','KY'],
    gulf_south:    ['AL','MS','LA','AR','TX','OK'],
    great_lakes:   ['OH','MI','IN','IL','WI','MN'],
    great_plains:  ['IA','MO','ND','SD','NE','KS'],
    mountain_west: ['MT','ID','WY','CO','UT','NV','AZ','NM'],
    pacific:       ['WA','OR','CA','AK','HI'],
    // Broad presets
    eastern_us:    ['ME','NH','VT','MA','RI','CT','NY','NJ','PA','DE','MD','VA','WV','NC','SC','GA','FL','OH','MI','IN','IL','WI','MN','IA','MO','KY','TN','AL','MS','AR','LA'],
    western_us:    ['MT','ID','WY','CO','UT','NV','AZ','NM','WA','OR','CA','ND','SD','NE','KS','OK','TX','AK','HI'],
    national:      ['ME','NH','VT','MA','RI','CT','NY','NJ','PA','DE','MD','VA','WV','NC','SC','GA','FL','OH','MI','IN','IL','WI','MN','IA','MO','TN','KY','AL','MS','AR','LA','ND','SD','NE','KS','OK','TX','MT','ID','WY','CO','UT','NV','AZ','NM','WA','OR','CA'],
    // Legacy presets — backward compatibility
    northeast:         ['ME','NH','VT','MA','RI','CT','NY','NJ','PA'],
    gulf_coast:        ['FL','AL','MS','LA','TX'],
    midwest:           ['OH','MI','IN','IL','WI','MN','IA','MO'],
    southwest:         ['AZ','NM','TX','NV'],
    pacific_northwest: ['WA','OR'],
    west_coast:        ['WA','OR','CA'],
    west:              ['WA','OR','CA','ID','NV','UT','AZ','MT','WY','CO','NM','AK','HI'],
};

// Expose shared constants so the companion inline script can reference them
// without maintaining a duplicate copy.
window.PQ_PRIMARY_REGIONS = PRIMARY_REGIONS;
window.PQ_PLAY_AREA_PRESETS = PLAY_AREA_PRESETS;
window.PQ_US_PLATES = US_PLATES;

// ── Rarity & Scoring ──────────────────────────────────────────────────────────

// All point values are even so the 50%-later-finder share is always a whole number.
// State adjacency map for route-aware rarity.
// Rarity is computed at runtime by BFS hop-distance from the pack's travel corridor.
const STATE_NEIGHBORS = {
    'Alabama':        ['Florida','Georgia','Mississippi','Tennessee'],
    'Alaska':         [],
    'Arizona':        ['California','Colorado','Nevada','New Mexico','Utah'],
    'Arkansas':       ['Louisiana','Mississippi','Missouri','Oklahoma','Tennessee','Texas'],
    'California':     ['Arizona','Nevada','Oregon'],
    'Colorado':       ['Arizona','Kansas','Nebraska','New Mexico','Oklahoma','Utah','Wyoming'],
    'Connecticut':    ['Massachusetts','New York','Rhode Island'],
    'Delaware':          ['Maryland','New Jersey','Pennsylvania'],
    'Florida':           ['Alabama','Georgia'],
    'Washington DC':   ['Maryland','Virginia'],
    'Georgia':        ['Alabama','Florida','North Carolina','South Carolina','Tennessee'],
    'Hawaii':         [],
    'Idaho':          ['British Columbia','Montana','Nevada','Oregon','Utah','Washington','Wyoming'],
    'Illinois':       ['Indiana','Iowa','Kentucky','Missouri','Wisconsin'],
    'Indiana':        ['Illinois','Kentucky','Michigan','Ohio'],
    'Iowa':           ['Illinois','Minnesota','Missouri','Nebraska','South Dakota','Wisconsin'],
    'Kansas':         ['Colorado','Missouri','Nebraska','Oklahoma'],
    'Kentucky':       ['Illinois','Indiana','Missouri','Ohio','Tennessee','Virginia','West Virginia'],
    'Louisiana':      ['Arkansas','Mississippi','Texas'],
    'Maine':          ['New Brunswick','New Hampshire','Quebec'],
    'Maryland':       ['Delaware','Pennsylvania','Virginia','Washington DC','West Virginia'],
    'Massachusetts':  ['Connecticut','New Hampshire','New York','Rhode Island','Vermont'],
    'Michigan':       ['Indiana','Ohio','Ontario','Wisconsin'],
    'Minnesota':      ['Iowa','Manitoba','North Dakota','Ontario','South Dakota','Wisconsin'],
    'Mississippi':    ['Alabama','Arkansas','Louisiana','Tennessee'],
    'Missouri':       ['Arkansas','Illinois','Iowa','Kansas','Kentucky','Nebraska','Oklahoma','Tennessee'],
    'Montana':        ['Alberta','British Columbia','Idaho','North Dakota','Saskatchewan','South Dakota','Wyoming'],
    'Nebraska':       ['Colorado','Iowa','Kansas','Missouri','South Dakota','Wyoming'],
    'Nevada':         ['Arizona','California','Idaho','Oregon','Utah'],
    'New Hampshire':  ['Maine','Massachusetts','Quebec','Vermont'],
    'New Jersey':     ['Delaware','New York','Pennsylvania'],
    'New Mexico':     ['Arizona','Colorado','Oklahoma','Texas'],
    'New York':       ['Connecticut','Massachusetts','New Jersey','Ontario','Pennsylvania','Quebec','Vermont'],
    'North Carolina': ['Georgia','South Carolina','Tennessee','Virginia'],
    'North Dakota':   ['Manitoba','Minnesota','Montana','Saskatchewan','South Dakota'],
    'Ohio':           ['Indiana','Kentucky','Michigan','Pennsylvania','West Virginia'],
    'Oklahoma':       ['Arkansas','Colorado','Kansas','Missouri','New Mexico','Texas'],
    'Oregon':         ['California','Idaho','Nevada','Washington'],
    'Pennsylvania':   ['Delaware','Maryland','New Jersey','New York','Ohio','West Virginia'],
    'Rhode Island':   ['Connecticut','Massachusetts'],
    'South Carolina': ['Georgia','North Carolina'],
    'South Dakota':   ['Iowa','Minnesota','Montana','Nebraska','North Dakota','Wyoming'],
    'Tennessee':      ['Alabama','Arkansas','Georgia','Kentucky','Mississippi','Missouri','North Carolina','Virginia'],
    'Texas':          ['Arkansas','Louisiana','New Mexico','Oklahoma'],
    'Utah':           ['Arizona','Colorado','Idaho','Nevada','New Mexico','Wyoming'],
    'Vermont':        ['Massachusetts','New Hampshire','New York','Quebec'],
    'Virginia':       ['Kentucky','Maryland','North Carolina','Tennessee','Washington DC','West Virginia'],
    'Washington':     ['British Columbia','Idaho','Oregon'],
    'West Virginia':  ['Kentucky','Maryland','Ohio','Pennsylvania','Virginia'],
    'Wisconsin':      ['Illinois','Iowa','Michigan','Minnesota'],
    'Wyoming':        ['Colorado','Idaho','Montana','Nebraska','South Dakota','Utah'],
    // Canadian provinces (participate in BFS; territories are caught early as gold-elite)
    'Alberta':                   ['British Columbia','Saskatchewan','Montana','Northwest Territories'],
    'British Columbia':          ['Alberta','Washington','Idaho','Montana','Yukon'],
    'Manitoba':                  ['Saskatchewan','Ontario','North Dakota','Minnesota'],
    'New Brunswick':             ['Quebec','Nova Scotia','Maine'],
    'Newfoundland and Labrador': ['Quebec'],
    'Nova Scotia':               ['New Brunswick','Prince Edward Island'],
    'Northwest Territories':     ['Yukon','Alberta','Saskatchewan','Manitoba'],
    'Nunavut':                   ['Northwest Territories','Manitoba','Quebec'],
    'Ontario':                   ['Manitoba','Quebec','Minnesota','Michigan','New York'],
    'Prince Edward Island':      ['New Brunswick'],
    'Quebec':                    ['Ontario','New Brunswick','Newfoundland and Labrador','New York','Vermont','New Hampshire','Maine'],
    'Saskatchewan':              ['Alberta','Manitoba','Montana','North Dakota','Minnesota'],
    'Yukon':                     ['British Columbia','Northwest Territories']
};

const TERRITORY_NAMES    = new Set(['Puerto Rico','US Virgin Islands','American Samoa','Guam','Northern Mariana Islands']);
const CANADIAN_TERRITORIES = new Set(['Yukon','Northwest Territories','Nunavut']);
const NON_CONTIGUOUS     = new Set(['Alaska','Hawaii']);

// Approximate geographic centroids for GPS-based rarity (lat, lng).
const STATE_CENTROIDS = {
    'Alabama': [32.8, -86.8], 'Alaska': [64.2, -153.4], 'Arizona': [34.3, -111.1],
    'Arkansas': [35.0, -92.4], 'California': [36.8, -119.4], 'Colorado': [39.1, -105.4],
    'Connecticut': [41.6, -72.7], 'Delaware': [39.0, -75.5], 'Washington DC': [38.9, -77.0],
    'Florida': [28.7, -82.5], 'Georgia': [32.7, -83.4], 'Hawaii': [20.7, -156.3],
    'Idaho': [44.1, -114.5], 'Illinois': [40.1, -88.8], 'Indiana': [40.3, -86.1],
    'Iowa': [42.0, -93.2], 'Kansas': [38.5, -96.7], 'Kentucky': [37.5, -85.3],
    'Louisiana': [31.1, -91.9], 'Maine': [45.4, -69.0], 'Maryland': [39.1, -76.6],
    'Massachusetts': [42.2, -71.5], 'Michigan': [44.4, -85.4], 'Minnesota': [46.4, -93.1],
    'Mississippi': [32.7, -89.7], 'Missouri': [38.5, -92.5], 'Montana': [47.0, -110.0],
    'Nebraska': [41.5, -99.9], 'Nevada': [39.9, -116.4], 'New Hampshire': [43.7, -71.6],
    'New Jersey': [40.1, -74.4], 'New Mexico': [34.5, -106.0], 'New York': [42.9, -75.4],
    'North Carolina': [35.6, -79.4], 'North Dakota': [47.5, -100.5], 'Ohio': [40.4, -82.7],
    'Oklahoma': [35.6, -96.9], 'Oregon': [43.9, -120.6], 'Pennsylvania': [40.6, -77.2],
    'Rhode Island': [41.7, -71.5], 'South Carolina': [33.9, -80.9], 'South Dakota': [44.4, -100.2],
    'Tennessee': [35.8, -86.7], 'Texas': [31.5, -99.3], 'Utah': [39.4, -111.1],
    'Vermont': [44.1, -72.7], 'Virginia': [37.8, -78.2], 'Washington': [47.4, -120.4],
    'West Virginia': [38.6, -80.5], 'Wisconsin': [44.5, -90.0], 'Wyoming': [43.0, -107.6],
};

function getStateFromCoords(lat, lng) {
    let nearest = null, minDist = Infinity;
    for (const [name, [sLat, sLng]] of Object.entries(STATE_CENTROIDS)) {
        const d = Math.hypot(lat - sLat, lng - sLng);
        if (d < minDist) { minDist = d; nearest = name; }
    }
    return nearest;
}

async function getPlayerGpsState() {
    return new Promise(resolve => {
        if (!navigator.geolocation) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
            pos => resolve(getStateFromCoords(pos.coords.latitude, pos.coords.longitude)),
            () => resolve(null),
            { timeout: 5000, maximumAge: 120000 }
        );
    });
}

function formatFoundAt(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const h = d.getHours() % 12 || 12;
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'p' : 'a';
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay ? `${h}:${mins}${ampm}` : `${month} ${day} ${h}:${mins}${ampm}`;
}

// Returns the rarity tier for a plate given the pack's travel corridor.
// BFS hop-distance from the corridor determines tier for contiguous US and Canadian provinces.
// Special fixed tiers: AK/HI not in corridor → silver-elite; Canadian territories → gold-elite; US territories → ultra.
// No corridor set → flat occasional for all states (AK/HI still silver-elite).
function computeRarityForState(stateName, corridorStates) {
    if (TERRITORY_NAMES.has(stateName))    return 'ultra';
    if (CANADIAN_TERRITORIES.has(stateName)) return 'gold-elite';

    const corridorSet = new Set(corridorStates || []);

    if (corridorSet.size === 0) {
        return NON_CONTIGUOUS.has(stateName) ? 'silver-elite' : 'occasional';
    }

    if (corridorSet.has(stateName)) return 'common';
    if (NON_CONTIGUOUS.has(stateName)) return 'silver-elite'; // AK/HI unreachable by road unless in corridor

    // BFS from corridor states outward — up to 7 hops across contiguous US + Canadian provinces
    const visited = new Set(corridorSet);
    let frontier = new Set(corridorSet);
    for (let hop = 1; hop <= 7; hop++) {
        const next = new Set();
        for (const state of frontier) {
            for (const neighbor of (STATE_NEIGHBORS[state] || [])) {
                if (neighbor === stateName) {
                    if (hop === 1) return 'occasional';
                    if (hop === 2) return 'scarce';
                    if (hop === 3) return 'semi-rare';
                    if (hop === 4) return 'rare';
                    if (hop === 5) return 'mega-rare';
                    if (hop === 6) return 'epic';
                    return 'legendary'; // hop === 7
                }
                if (!visited.has(neighbor)) { visited.add(neighbor); next.add(neighbor); }
            }
        }
        frontier = next;
        if (!frontier.size) break;
    }
    return 'legendary'; // 7+ hops — extremely distant
}

const RARITY_CONFIG = {
    'common':       { label: 'Common',       points: 2,   color: '#7f8c8d' },
    'occasional':   { label: 'Occasional',   points: 4,   color: '#27ae60' },
    'scarce':       { label: 'Scarce',       points: 6,   color: '#16a085' },
    'semi-rare':    { label: 'Semi-Rare',    points: 10,  color: '#2980b9' },
    'rare':         { label: 'Rare',         points: 20,  color: '#3498db' },
    'mega-rare':    { label: 'Mega-Rare',    points: 30,  color: '#7d3c98' },
    'epic':         { label: 'Epic',         points: 40,  color: '#9b59b6' },
    'legendary':    { label: 'Legendary',    points: 50,  color: '#e67e22' },
    'silver-elite': { label: 'Silver Elite', points: 60,  color: '#a0aec0' },
    'gold-elite':   { label: 'Gold Elite',   points: 70,  color: '#d4ac0d' },
    'ultra':        { label: 'Ultra',        points: 100, color: '#e74c3c' }
};

// ── Badge Definitions ─────────────────────────────────────────────────────────

const BADGE_DEFS = [
    // Milestone — plates found
    { id:'milestone_5',       group:'milestone',   icon:'🚗', label:'Road Warrior',    desc:'Found 5 plates',                 test:s=>s.foundCount>=5 },
    { id:'milestone_10',      group:'milestone',   icon:'👀', label:'Spotter',          desc:'Found 10 plates',                test:s=>s.foundCount>=10 },
    { id:'milestone_20',      group:'milestone',   icon:'🐺', label:'Pack Hunter',      desc:'Found 20 plates',                test:s=>s.foundCount>=20 },
    { id:'milestone_40',      group:'milestone',   icon:'🏆', label:'Cross-Country',    desc:'Found 40 plates',                test:s=>s.foundCount>=40 },
    { id:'milestone_50',      group:'milestone',   icon:'⭐', label:'Full Set',         desc:'Found all 50 states',            test:s=>s.foundCount>=50 },
    // Milestone — first finds
    { id:'ff_5',              group:'firstfinder', icon:'🎯', label:'Sharp Eye',        desc:'5 first finds',                  test:s=>s.firstCount>=5 },
    { id:'ff_10',             group:'firstfinder', icon:'🔥', label:'On Fire',          desc:'10 first finds',                 test:s=>s.firstCount>=10 },
    { id:'ff_15',             group:'firstfinder', icon:'⚡', label:'Lightning',        desc:'15 first finds',                 test:s=>s.firstCount>=15 },
    { id:'ff_20',             group:'firstfinder', icon:'💎', label:'Diamond Eye',      desc:'20 first finds',                 test:s=>s.firstCount>=20 },
    { id:'ff_40',             group:'firstfinder', icon:'🏅', label:'Elite Finder',     desc:'40 first finds',                 test:s=>s.firstCount>=40 },
    { id:'ff_50',             group:'firstfinder', icon:'👑', label:'FF Legend',        desc:'50 first finds',                 test:s=>s.firstCount>=50 },
    // Elite finds
    { id:'found_ak',          group:'elite',       icon:'🗻', label:'Last Frontier',    desc:'Found Alaska',                   test:s=>s.foundSet.has('Alaska') },
    { id:'found_hi',          group:'elite',       icon:'🌺', label:'Aloha!',           desc:'Found Hawaii',                   test:s=>s.foundSet.has('Hawaii') },
    { id:'found_ak_hi',       group:'elite',       icon:'🌊', label:'Non-Contiguous',   desc:'Found Alaska & Hawaii',          test:s=>s.foundSet.has('Alaska')&&s.foundSet.has('Hawaii') },
    { id:'found_pr',          group:'elite',       icon:'🌴', label:'La Isla',          desc:'Found Puerto Rico',              test:s=>s.foundSet.has('Puerto Rico') },
    { id:'found_usvi',        group:'elite',       icon:'🏝️',label:'Island Hopper',    desc:'Found U.S. Virgin Islands',      test:s=>s.foundSet.has('US Virgin Islands') },
    { id:'found_as',          group:'elite',       icon:'🌏', label:'Pacific Isle',     desc:'Found American Samoa',           test:s=>s.foundSet.has('American Samoa') },
    { id:'found_guam',        group:'elite',       icon:'🌐', label:'Pacific Rim',      desc:'Found Guam',                     test:s=>s.foundSet.has('Guam') },
    { id:'found_cnmi',        group:'elite',       icon:'🗺️',label:'Marianas',         desc:'Found Northern Mariana Islands', test:s=>s.foundSet.has('Northern Mariana Islands') },
    { id:'territory_hunter',  group:'elite',       icon:'🎖️',label:'Territory Hunter', desc:'Found all 5 U.S. territories',  test:s=>['Puerto Rico','US Virgin Islands','American Samoa','Guam','Northern Mariana Islands'].every(t=>s.foundSet.has(t)) },
    // Sub-region completions (12 US + 4 Canada, distinct from primary region names)
    { id:'sub_appalachia',     group:'region', icon:'⛰️', label:'Appalachia',        desc:'Completed Appalachia',             test:s=>s.completedSubs.includes('appalachia') },
    { id:'sub_chesapeake',     group:'region', icon:'🦀', label:'Chesapeake Bay',    desc:'Completed the Chesapeake Bay',     test:s=>s.completedSubs.includes('chesapeake_bay') },
    { id:'sub_carolinas',      group:'region', icon:'🌿', label:'The Carolinas',     desc:'Completed the Carolinas',          test:s=>s.completedSubs.includes('the_carolinas') },
    { id:'sub_deep_south',     group:'region', icon:'🌴', label:'Deep South',        desc:'Completed the Deep South',         test:s=>s.completedSubs.includes('deep_south') },
    { id:'sub_gulf_coast',     group:'region', icon:'🦈', label:'Gulf Coast',        desc:'Completed the Gulf Coast',         test:s=>s.completedSubs.includes('gulf_coast') },
    { id:'sub_four_corners',   group:'region', icon:'🗿', label:'Four Corners',      desc:'Completed the Four Corners',       test:s=>s.completedSubs.includes('four_corners') },
    { id:'sub_rocky_mts',      group:'region', icon:'🏔️', label:'Rocky Mountains',  desc:'Completed the Rocky Mountains',    test:s=>s.completedSubs.includes('rocky_mountains') },
    { id:'sub_pacific_nw',     group:'region', icon:'🌲', label:'Pacific Northwest', desc:'Completed the Pacific Northwest',  test:s=>s.completedSubs.includes('pacific_northwest') },
    { id:'sub_sw_desert',      group:'region', icon:'🌵', label:'Southwest Desert',  desc:'Completed the Southwest Desert',   test:s=>s.completedSubs.includes('southwest_desert') },
    { id:'sub_corn_belt',      group:'region', icon:'🌾', label:'Corn Belt',         desc:'Completed the Corn Belt',          test:s=>s.completedSubs.includes('corn_belt') },
    { id:'sub_non_contiguous', group:'region', icon:'✈️', label:'Non-Contiguous',   desc:'Found Alaska & Hawaii',            test:s=>s.completedSubs.includes('non_contiguous') },
    { id:'sub_seaboard',       group:'region', icon:'🌊', label:'Eastern Seaboard', desc:'Completed the Eastern Seaboard',   test:s=>s.completedSubs.includes('eastern_seaboard') },
    // Canadian sub-region completions
    { id:'sub_canada_east',        group:'region', icon:'🍁', label:'Eastern Canada',    desc:'Completed Eastern Canada',           test:s=>s.completedSubs.includes('canada_east') },
    { id:'sub_canada_central',     group:'region', icon:'🦌', label:'Central Canada',    desc:'Completed Central Canada',           test:s=>s.completedSubs.includes('canada_central') },
    { id:'sub_canada_west',        group:'region', icon:'🦫', label:'Western Canada',    desc:'Completed Western Canada',           test:s=>s.completedSubs.includes('canada_west') },
    { id:'sub_canada_territories', group:'region', icon:'🌌', label:'Great White North', desc:'Completed the Canadian Territories', test:s=>s.completedSubs.includes('canada_territories') },
    // Primary region completions (8 non-overlapping regions covering all 50 states)
    { id:'region_new_england',   group:'region', icon:'🦞', label:'New England',   desc:'Completed New England',      test:s=>s.completedRegions?.includes('new_england') },
    { id:'region_mid_atlantic',  group:'region', icon:'🗽', label:'Mid-Atlantic',  desc:'Completed the Mid-Atlantic', test:s=>s.completedRegions?.includes('mid_atlantic') },
    { id:'region_southeast',     group:'region', icon:'🌴', label:'Southeast',     desc:'Completed the Southeast',    test:s=>s.completedRegions?.includes('southeast') },
    { id:'region_gulf_south',    group:'region', icon:'🤠', label:'Gulf South',    desc:'Completed the Gulf South',   test:s=>s.completedRegions?.includes('gulf_south') },
    { id:'region_great_lakes',   group:'region', icon:'🚢', label:'Great Lakes',   desc:'Completed the Great Lakes',  test:s=>s.completedRegions?.includes('great_lakes') },
    { id:'region_great_plains',  group:'region', icon:'🦬', label:'Great Plains',  desc:'Completed the Great Plains', test:s=>s.completedRegions?.includes('great_plains') },
    { id:'region_mountain_west', group:'region', icon:'🏔️',label:'Mountain West', desc:'Completed the Mountain West',test:s=>s.completedRegions?.includes('mountain_west') },
    { id:'region_pacific',       group:'region', icon:'🌊', label:'Pacific',       desc:'Completed the Pacific',      test:s=>s.completedRegions?.includes('pacific') },
    // Travel corridor
    { id:'corridor_complete', group:'corridor', icon:'🛣️',label:'Home Ground',       desc:'Found all corridor plates',   test:s=>s.corridorComplete },
];

const STORAGE_KEYS = {
    name: 'platequest_player_name',
    tag: 'platequest_player_tag',
    icon: 'platequest_player_icon',
    player: 'platequest_player_identity_v2',
    session: 'platequest_active_session_v2',
    myGames: 'platequest_my_games',
    darkMode: 'platequest_dark_mode',
    diagnostics: 'platequest_diagnostics_visible'
};

const SESSION_KEYS = { joinReloadCode: 'platequest_join_reload_code_v1' };
const LEGACY_STORAGE_KEYS = { playerProfile: 'platequest_player_profile', activeSession: 'platequest_active_session' };
const ROOM_VERSION = 2;
const MAX_PLAYERS = 8;
const HEARTBEAT_MS = 30000;

let database = null;
let currentGameRef = null;
let currentGameCode = null;
let currentPlayer = null;
let gameData = null;
let playersData = {};
let prevPlayerStates = null;    // null = not yet initialized; reset on game exit
let prevAnnouncementKeys = null; // null = not yet initialized; reset on game exit
let prevTauntKeys = null;        // null = not yet initialized; reset on game exit
let announcementsChildRef = null;
let tauntsChildRef = null;
let chatChildRef = null;
let prevClearRequestKeys = null; // null = not yet initialized; reset on game exit
let prevRegionClearRequestKeys = null; // same, for region completion disputes
let prevPlateDisputeKeys = null;         // same, for individual plate first-finder disputes
let prevChatKeys = null;                  // null = not yet initialized; reset on game exit
let prevReactionKeys = null;             // null = not yet initialized; reset on game exit
let chatUnreadCount = 0;
let lastKnownRound = null;       // tracks round number to detect new-round resets
let speedRoundInterval = null;  // setInterval handle for countdown ticker
let lastKnownSpeedRoundEnd = null; // dedup speed-round finalization
let pendingAchievements = new Set(); // IDs written this session — prevents double-toast
let lastAchievementCheck = 0;       // timestamp of last checkAchievements call
let lastKnownRivalry = undefined;   // undefined = not initialized; null = no rival; string = rival key
let lastKnownSuddenDeathWinner = null; // wonAt timestamp of last announced SD winner
let pendingClearState = null;   // stateName waiting for host-request confirm sheet
let pendingDeselect = null;     // stateName waiting for direct-deselect confirm
let regionMigrationDone = false; // one-time migration guard per session
let endGameScreenShown = false;  // shown at most once per game session
let gameListenerAttached = false;
let playerConfirmedInPack = false;
let eventsBound = false;
let attemptedAutoResume = false;
let currentConnectionState = 'connecting';
let presenceCleanup = null;
let pendingJcWolFPlayer = null;  // player object held while PIN modal is open
let wolfPinEntry = '';           // digits typed so far in the PIN modal
let heartbeatInterval = null;
let pendingGameCodeFromUrl = null;
let lastRenderedStateSignature = '';
let diagnosticsVisible = false;
let lastSyncAt = null;
let firebaseReady = false;
let selectedPlayAreaStates = new Set();

const splash = document.getElementById('splash');
const game = document.getElementById('game');
const setupSection = document.getElementById('setupSection');
const gameActive = document.getElementById('gameActive');
const loadingOverlay = document.getElementById('loadingOverlay');
const gameCodeHeader = document.getElementById('gameCodeHeader');
const diagnosticsPanel = document.getElementById('diagnosticsPanel');

function slugify(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40); }
function safeParseStorage(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function normalizeTagInput(value) { return String(value || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8); }
function normalizeCodeInput(value) { return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6); }
function setPendingJoinReload(code) { try { sessionStorage.setItem(SESSION_KEYS.joinReloadCode, code); } catch {} }
function getPendingJoinReload() { try { return normalizeCodeInput(sessionStorage.getItem(SESSION_KEYS.joinReloadCode) || ''); } catch { return ''; } }
function clearPendingJoinReload() { try { sessionStorage.removeItem(SESSION_KEYS.joinReloadCode); } catch {} }
function reloadForJoin(code) { setPendingJoinReload(code); const url = new URL(window.location.href); url.searchParams.set('game', code); url.searchParams.set('joinrefresh', '1'); window.location.replace(url.toString()); }

function getPlateScope(scopeOverride = null) {
    if (scopeOverride) return scopeOverride;
    return gameData?.settings?.plateScope || document.getElementById('plateScopeSelect')?.value || 'us_only';
}

function getActivePlateEntries(scopeOverride = null) {
    const base = [...US_PLATES, ...TERRITORY_PLATES];
    return getPlateScope(scopeOverride) === 'us_canada' ? [...base, ...CANADA_PLATES] : base;
}

function getUsStateEntries() {
    return US_PLATES;
}

async function ensureDatabaseReady(actionLabel = 'continue') {
    if (database) { firebaseReady = true; return true; }
    try {
        if (typeof firebase === 'undefined') throw new Error('Firebase SDK did not load.');
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        firebaseReady = true;
        currentConnectionState = 'connecting';
        updateConnectionStatus('connecting');
        updateDiagnosticsPanel();
        return true;
    } catch (error) {
        console.error(`Unable to ${actionLabel}: Firebase is not ready.`, error);
        firebaseReady = false;
        updateConnectionStatus('offline');
        showToast(`Could not ${actionLabel}. Connection is not ready yet.`, 'error');
        updateDiagnosticsPanel();
        return false;
    }
}

function getOrCreateDeviceId() {
    const identity = safeParseStorage(STORAGE_KEYS.player);
    return identity?.deviceId || `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildPlayerFromInputs() {
    const name = document.getElementById('playerNameInput').value.trim();
    const tag = normalizeTagInput(document.getElementById('playerTagInput').value);
    if (!name) { showToast('Please enter your name! 👤', 'error'); document.getElementById('playerNameInput').focus(); return null; }
    if (!tag) { showToast('Please enter a player tag! 🏷️', 'error'); document.getElementById('playerTagInput').focus(); return null; }
    if (name.length > 20) { showToast('Name must be 20 characters or less.', 'error'); return null; }
    if (!/^[a-zA-Z0-9]+$/.test(tag)) { showToast('Tag can only contain letters and numbers.', 'error'); return null; }
    const icon = getSelectedPlayerIcon();
    const playerKey = `${slugify(name)}__${slugify(tag)}`;
    return { playerKey, deviceId: getOrCreateDeviceId(), name, tag, icon, displayName: `${name} (${tag})`, colorSeed: slugify(`${name}_${tag}`), updatedAtLocal: Date.now() };
}

function buildPlayerIdentity(name, tag, extras = {}) {
    const normalizedTag = normalizeTagInput(tag);
    return { playerKey: `${slugify(name)}__${slugify(normalizedTag)}`, deviceId: extras.deviceId || getOrCreateDeviceId(), name, tag: normalizedTag, icon: extras.icon || null, displayName: `${name} (${normalizedTag})`, colorSeed: slugify(`${name}_${normalizedTag}`), updatedAtLocal: Date.now(), legacyPlayerId: extras.legacyPlayerId || null };
}

function persistIdentity(player) {
    localStorage.setItem(STORAGE_KEYS.name, player.name);
    localStorage.setItem(STORAGE_KEYS.tag, player.tag);
    if (player.icon) localStorage.setItem(STORAGE_KEYS.icon, player.icon);
    localStorage.setItem(STORAGE_KEYS.player, JSON.stringify(player));
    updateDiagnosticsPanel();
}

function migrateLegacyStorage() {
    const hasNewIdentity = Boolean(localStorage.getItem(STORAGE_KEYS.player));
    const hasNewSession = Boolean(localStorage.getItem(STORAGE_KEYS.session));
    const legacyProfile = safeParseStorage(LEGACY_STORAGE_KEYS.playerProfile);
    const legacySession = safeParseStorage(LEGACY_STORAGE_KEYS.activeSession);
    let migratedIdentity = safeParseStorage(STORAGE_KEYS.player);
    if (!hasNewIdentity && legacyProfile?.name && legacyProfile?.tag) {
        migratedIdentity = buildPlayerIdentity(legacyProfile.name, legacyProfile.tag, { legacyPlayerId: legacyProfile.id, deviceId: legacyProfile.deviceId || getOrCreateDeviceId() });
        persistIdentity(migratedIdentity);
        showToast('Upgraded your saved multiplayer identity.', 'info');
    }
    if (!hasNewSession && legacySession?.gameCode) {
        const player = migratedIdentity || safeParseStorage(STORAGE_KEYS.player);
        if (player?.playerKey) localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ gameCode: normalizeCodeInput(legacySession.gameCode), playerKey: player.playerKey, savedAt: legacySession.savedAt || Date.now() }));
    }
}

function restoreIdentity() {
    const savedName = localStorage.getItem(STORAGE_KEYS.name);
    const savedTag = localStorage.getItem(STORAGE_KEYS.tag);
    if (savedName) document.getElementById('playerNameInput').value = savedName;
    if (savedTag) document.getElementById('playerTagInput').value = normalizeTagInput(savedTag);
    const savedPlayer = safeParseStorage(STORAGE_KEYS.player);
    if (savedPlayer?.playerKey) { currentPlayer = { ...savedPlayer, tag: normalizeTagInput(savedPlayer.tag) }; enableGameCards(); }
    updateDiagnosticsPanel();
}

function saveGameSession() { if (!currentPlayer || !currentGameCode) return; localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ gameCode: currentGameCode, playerKey: currentPlayer.playerKey, savedAt: Date.now() })); updateDiagnosticsPanel(); }
function clearGameSession() { localStorage.removeItem(STORAGE_KEYS.session); updateDiagnosticsPanel(); }
function getSavedSession() { return safeParseStorage(STORAGE_KEYS.session); }

function getMyGames() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.myGames) || '[]'); } catch (e) { return []; }
}
function addToMyGames(code, name) {
    if (!code) return;
    const games = getMyGames().filter(g => g.code !== code);
    games.unshift({ code, name: name || code, joinedAt: Date.now() });
    if (games.length > 8) games.length = 8;
    try { localStorage.setItem(STORAGE_KEYS.myGames, JSON.stringify(games)); } catch (e) {}
}
function removeFromMyGames(code) {
    if (!code) return;
    const games = getMyGames().filter(g => g.code !== code);
    try { localStorage.setItem(STORAGE_KEYS.myGames, JSON.stringify(games)); } catch (e) {}
}
function forgetGame(code) { removeFromMyGames(code); renderMyGames(); }

function seededShuffle(arr, seed) {
    const out = [...arr];
    let s = Math.abs(seed % 2147483647) || 1;
    for (let i = out.length - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const j = s % (i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function getMyEffects() { return playersData[currentPlayer?.playerKey]?.effects || {}; }

function formatTimeLeft(expiry) {
    const ms = expiry - Date.now();
    if (ms <= 0) return '';
    const s = Math.ceil(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatRelativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function renderMyGames() {
    const section = document.getElementById('myGamesSection');
    if (!section) return;
    const games = getMyGames();
    const pausedCode = window.pausedPack?.code;
    const activeCode = currentGameCode;
    const filtered = games.filter(g => g.code !== pausedCode && g.code !== activeCode);
    if (filtered.length === 0) { section.style.display = 'none'; section.innerHTML = ''; return; }
    section.style.display = 'block';
    section.innerHTML = `
        <div class="my-games-label">🎮 My Packs</div>
        ${filtered.map(g => `
            <div class="my-game-row">
                <div class="my-game-info">
                    <div class="my-game-name">${escapeHtml(g.name)}</div>
                    <div class="my-game-meta"><span class="my-game-code">${escapeHtml(g.code)}</span><span class="my-game-time">${formatRelativeTime(g.joinedAt)}</span></div>
                </div>
                <div class="my-game-actions">
                    <button class="btn btn-primary my-game-rejoin" onclick="rejoinGame('${escapeHtml(g.code)}')">▶️ Return</button>
                    <button class="btn btn-secondary my-game-forget" onclick="forgetGame('${escapeHtml(g.code)}')">✕</button>
                </div>
            </div>
        `).join('')}
    `;
}

async function rejoinGame(code) {
    if (!currentPlayer) { showToast('Set your player name first.', 'error'); return; }
    if (!(await ensureDatabaseReady('rejoin a pack'))) return;
    showLoading('Rejoining pack…');
    try {
        await connectToGame(code, { showJoinedToast: true });
        clearPendingJoinReload();
    } catch (error) {
        console.error('Error rejoining game:', error);
        showToast(error.message || 'Could not rejoin pack.', 'error');
    } finally { hideLoading(); }
}

function resolvePlayerIcon(player) {
    if (player?.tag === 'JcWolF') return '🐺';
    return player?.icon || '🐾';
}

function getSelectedPlayerIcon() {
    const btn = document.querySelector('#iconPickerRow .icon-pick-btn.selected');
    return btn ? btn.textContent : PLAYER_ICONS[0];
}

function getIconFromRow(rowId) {
    const btn = document.querySelector(`#${rowId} .icon-pick-btn.selected`);
    return btn ? btn.textContent : PLAYER_ICONS[0];
}

function populateIconPickerRow(rowId, currentIcon, onPick) {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.innerHTML = '';
    PLAYER_ICONS.forEach(icon => {
        const btn = document.createElement('button');
        btn.className = 'icon-pick-btn';
        btn.textContent = icon;
        btn.type = 'button';
        btn.setAttribute('aria-label', icon);
        btn.addEventListener('click', () => {
            row.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            if (onPick) onPick(icon);
        });
        row.appendChild(btn);
    });
    let matched = false;
    row.querySelectorAll('.icon-pick-btn').forEach(b => {
        if (b.textContent === currentIcon) { b.classList.add('selected'); matched = true; }
    });
    if (!matched) row.querySelector('.icon-pick-btn')?.classList.add('selected');
}

function initIconPicker() {
    const savedIcon = localStorage.getItem(STORAGE_KEYS.icon);
    populateIconPickerRow('iconPickerRow', savedIcon, (icon) => {
        try { localStorage.setItem(STORAGE_KEYS.icon, icon); } catch (e) {}
    });
}

function setSetupControlsDisabled(disabled) {
    [
        'newGameInput','joinCodeInput','createGameBtn','joinGameBtn',
        'primaryRegionSelect','plateScopeSelect',
        'presetNortheastBtn','presetMidAtlanticBtn','presetSoutheastBtn',
        'presetGulfCoastBtn','presetMidwestBtn','presetGreatPlainsBtn',
        'presetMountainWestBtn','presetSouthwestBtn','presetPacificNwBtn',
        'presetWestCoastBtn','clearPlayAreaBtn'
    ].forEach((id) => { const el = document.getElementById(id); if (el) el.disabled = disabled; });
    document.querySelectorAll('.play-area-chip').forEach((chip) => { chip.disabled = disabled; });
}

function enableGameCards() {
    document.getElementById('createGameCard').style.opacity = '1';
    document.getElementById('joinGameCard').style.opacity = '1';
    setSetupControlsDisabled(false);
}

function disableGameCards() {
    document.getElementById('createGameCard').style.opacity = '0.5';
    document.getElementById('joinGameCard').style.opacity = '0.5';
    setSetupControlsDisabled(true);
}

function stateMapToCount(statesMap) { return Object.keys(statesMap || {}).length; }
function getPackUniqueStatesCount() { const uniqueStates = new Set(); Object.values(playersData || {}).forEach((player) => Object.keys(player?.states || {}).forEach((stateName) => uniqueStates.add(stateName))); return uniqueStates.size; }
function getStateClaim(stateName) { return gameData?.claimedStates?.[stateName] || null; }

function renderPlayAreaSelector() {
    const map = document.getElementById('playAreaMap');
    if (!map) return;
    map.innerHTML = '';
    getUsStateEntries().forEach((state) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'play-area-chip';
        btn.textContent = state.abbr;
        btn.title = state.name;
        if (selectedPlayAreaStates.has(state.name)) btn.classList.add('selected');
        btn.addEventListener('click', () => togglePlayAreaState(state.name));
        map.appendChild(btn);
    });
    updatePlayAreaSummary();
    setSetupControlsDisabled(!currentPlayer);
}

function togglePlayAreaState(stateName) {
    if (selectedPlayAreaStates.has(stateName)) selectedPlayAreaStates.delete(stateName);
    else selectedPlayAreaStates.add(stateName);
    renderPlayAreaSelector();
}

function applyPlayAreaPreset(presetKey) {
    (PLAY_AREA_PRESETS[presetKey] || []).forEach((abbr) => {
        const state = getUsStateEntries().find((item) => item.abbr === abbr);
        if (state) selectedPlayAreaStates.add(state.name);
    });
    renderPlayAreaSelector();
}

function clearPlayAreaSelection() { selectedPlayAreaStates = new Set(); renderPlayAreaSelector(); }
function getSelectedPlayAreaStates() { return Array.from(selectedPlayAreaStates).sort(); }

function updatePlayAreaSummary() {
    const summary = document.getElementById('playAreaSummary');
    if (!summary) return;
    const states = getSelectedPlayAreaStates();
    summary.textContent = states.length ? `${states.length} state${states.length === 1 ? '' : 's'} selected: ${states.join(', ')}` : 'Select the U.S. states included in this pack’s travel area.';
}

function buildPlayerRoomRecord(player, options = {}) {
    const now = firebase.database.ServerValue.TIMESTAMP;
    return { playerKey: player.playerKey, deviceId: player.deviceId, name: player.name, tag: player.tag, icon: player.icon || null, displayName: player.displayName, isHost: Boolean(options.isHost), connected: true, joinedAt: options.joinedAt || now, lastSeen: now, states: options.states || {}, role: options.isHost ? 'host' : 'player' };
}

function normalizePlayers(rawPlayers = {}) {
    const normalized = {};
    Object.entries(rawPlayers).forEach(([key, player]) => {
        if (!player) return;
        const playerKey = player.playerKey || key;
        let states = player.states || {};
        if (Array.isArray(states)) {
            const converted = {};
            states.forEach((stateName) => { converted[stateName] = { state: stateName, foundAt: player.joinedAt || Date.now(), foundBy: player.displayName || player.name || playerKey, foundByKey: playerKey }; });
            states = converted;
        }
        const normalizedTag = normalizeTagInput(player.tag || '');
        normalized[playerKey] = { ...player, playerKey, tag: normalizedTag, displayName: player.displayName || (player.name && normalizedTag ? `${player.name} (${normalizedTag})` : (player.name || playerKey)), states };
    });
    return normalized;
}

function getMyStatesMap() { return currentPlayer ? (playersData[currentPlayer.playerKey]?.states || {}) : {}; }
function findStateOwner(stateName) { let owner = null; Object.values(playersData).forEach((player) => { if (!owner && player.states && player.states[stateName]) owner = player; }); return owner; }
function buildStateSignature() { return JSON.stringify({ players: Object.values(playersData).map((player) => ({ key: player.playerKey, count: stateMapToCount(player.states), connected: Boolean(player.connected), states: Object.keys(player.states || {}).sort() })), claims: Object.keys(gameData?.claimedStates || {}).sort(), settings: gameData?.settings || {} }); }
function formatSyncTime(value) { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }); }

function updateDiagnosticsPanel() {
    if (!diagnosticsPanel) return;
    diagnosticsPanel.classList.toggle('visible', diagnosticsVisible);
    document.getElementById('diagIdentity').textContent = currentPlayer ? currentPlayer.displayName : 'Not set';
    document.getElementById('diagRoom').textContent = currentGameCode || 'None';
    document.getElementById('diagConnection').textContent = currentConnectionState;
    document.getElementById('diagPlayers').textContent = String(Object.keys(playersData || {}).length || 0);
    document.getElementById('diagLastSync').textContent = formatSyncTime(lastSyncAt);
    const session = getSavedSession();
    document.getElementById('diagSession').textContent = session?.gameCode ? `Saved ${session.gameCode}` : 'None';
    const diagVer = document.getElementById('diagVersion'); if (diagVer) diagVer.textContent = APP_VERSION;
}

function setDiagnosticsVisible(forceValue = null) { diagnosticsVisible = typeof forceValue === 'boolean' ? forceValue : !diagnosticsVisible; localStorage.setItem(STORAGE_KEYS.diagnostics, diagnosticsVisible ? 'true' : 'false'); updateDiagnosticsPanel(); }

document.addEventListener('DOMContentLoaded', () => initializeApp());

function initializeApp() {
    try {
        diagnosticsVisible = localStorage.getItem(STORAGE_KEYS.diagnostics) === 'true';
        migrateLegacyStorage();
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        firebaseReady = true;
        bindEventListeners();
        initIconPicker();
        renderPlayAreaSelector();
        restoreIdentity();
        initializeDarkMode();
        pendingGameCodeFromUrl = readGameCodeFromUrl() || getPendingJoinReload();
        updateDiagnosticsPanel();
        checkAppVersion(); // run immediately on load, before Firebase connects
        database.ref('.info/connected').on('value', async (snapshot) => {
            const isConnected = snapshot.val() === true;
            currentConnectionState = isConnected ? 'online' : 'offline';
            updateConnectionStatus(isConnected ? 'online' : 'offline');
            updateDiagnosticsPanel();
            if (isConnected) {
                checkAppVersion();
                if (!attemptedAutoResume) { attemptedAutoResume = true; await attemptAutoResume(); }
                if (currentGameCode && currentPlayer) setupPresence();
            }
        });
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        firebaseReady = false;
        updateConnectionStatus('offline');
        bindEventListeners();
        initIconPicker();
        renderPlayAreaSelector();
        restoreIdentity();
        initializeDarkMode();
        pendingGameCodeFromUrl = readGameCodeFromUrl() || getPendingJoinReload();
        updateDiagnosticsPanel();
    }
}

let versionIntervalId = null;
function checkAppVersion() {
    // Clean up _v cache-buster param left by a previous reload
    const urlNow = new URL(window.location.href);
    if (urlNow.searchParams.has('_v')) { urlNow.searchParams.delete('_v'); window.history.replaceState({}, document.title, urlNow.toString()); }
    // Promote our version in Firebase if we appear to be newest (best-effort)
    if (database) {
        const vRef = database.ref('config/latestVersion');
        vRef.transaction((current) => { if (!current || APP_VERSION > current) return APP_VERSION; return undefined; });
    }
    const doCheck = async () => {
        try {
            const res = await fetch(`version.json?_v=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            const latest = data.version;
            if (latest && latest !== APP_VERSION) handleVersionMismatch(latest, data.changelog);
        } catch (e) { /* network error, skip */ }
    };
    doCheck();
    if (!versionIntervalId) versionIntervalId = setInterval(doCheck, 60000);
}

function doAppReload() {
    document.getElementById('updateBanner')?.remove();
    document.getElementById('updateModal')?.remove();
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now());
    url.searchParams.delete('joinrefresh');
    window.location.replace(url.toString());
}

function handleVersionMismatch(latest, remoteChangelog) {
    if (document.getElementById('updateBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#1a73e8,#0d47a1);color:#fff;text-align:center;padding:13px 16px;font-size:15px;font-weight:600;cursor:pointer;letter-spacing:0.2px;-webkit-tap-highlight-color:rgba(0,0,0,0.1);box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    banner.textContent = '🔄 Update available — see what\'s new!';
    banner.addEventListener('click', () => showUpdateModal(latest, remoteChangelog));
    document.body.prepend(banner);
}

function showUpdateModal(latest, remoteChangelog) {
    if (document.getElementById('updateModal')) return;
    // Prefer fresh changelog from version.json — old cached JS won't have new entries
    const sourceChangelog = remoteChangelog || CHANGELOG;
    const missedVersions = Object.keys(sourceChangelog).sort().filter(v => v > APP_VERSION && v <= latest);
    const allNotes = missedVersions.flatMap(v => sourceChangelog[v]);
    const bullets = (allNotes.length ? allNotes : ['🚀 Performance improvements and bug fixes'])
        .map(n => `<li>${n}</li>`).join('');
    const overlay = document.createElement('div');
    overlay.id = 'updateModal';
    overlay.className = 'update-modal-overlay';
    overlay.innerHTML = `
        <div class="update-modal-card">
            <div class="update-modal-icon">🐺</div>
            <div class="update-modal-title">What's New in PlateQuest</div>
            <div class="update-modal-version">Version ${latest}</div>
            <ul class="update-modal-notes">${bullets}</ul>
            <div class="update-modal-footer">— Dev log: JcWolF is always on duty. Bugs squashed. Features incoming. 🐺🎮</div>
            <div class="update-modal-actions">
                <button class="btn btn-secondary update-modal-later">Maybe Later</button>
                <button class="btn btn-primary update-modal-now">🚀 Update Now</button>
            </div>
        </div>
    `;
    overlay.querySelector('.update-modal-now').addEventListener('click', doAppReload);
    overlay.querySelector('.update-modal-later').addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

let feedbackType = 'bug'; // 'bug' or 'feature'

// ── Pack Shop ─────────────────────────────────────────────────────────────────

function openShopModal() {
    const modal = document.getElementById('shopModal');
    if (!modal) return;
    renderShopModal();
    modal.style.display = 'flex';
}

function closeShopModal() {
    const modal = document.getElementById('shopModal');
    if (modal) modal.style.display = 'none';
}

function renderShopModal() {
    const list = document.getElementById('shopItemsList');
    const balEl = document.getElementById('shopCoinBalance');
    if (!list) return;
    const myCoins = playersData[currentPlayer?.playerKey]?.coins || 0;
    if (balEl) balEl.textContent = myCoins.toLocaleString();
    const myEffects = getMyEffects();
    const now = Date.now();
    list.innerHTML = '';

    const renderGroup = (label, items) => {
        const hdr = document.createElement('div');
        hdr.className = 'shop-category-label';
        hdr.textContent = label;
        list.appendChild(hdr);
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            const canAfford = myCoins >= item.cost;
            let statusHtml = '';
            if (item.id === 'shield') {
                if (myEffects.shield) statusHtml = '<span class="shop-status-pill">Active</span>';
            } else {
                const anyActive = Object.values(playersData).some(
                    p => p.playerKey !== currentPlayer?.playerKey && (p.effects?.[item.effectKey] || 0) > now
                );
                if (anyActive) statusHtml = '<span class="shop-status-pill">Active on pack</span>';
            }
            div.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-body">
                    <div class="shop-item-name">${item.name} ${statusHtml}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                </div>
                <button class="btn-shop-buy${canAfford ? '' : ' btn-shop-buy--off'}" data-iid="${item.id}" ${canAfford ? '' : 'disabled'}>
                    🪙${item.cost}
                </button>`;
            list.appendChild(div);
        });
    };

    renderGroup('⚔️ Tricks — affects all other players', SHOP_ITEMS.filter(i => i.category === 'trick'));
    renderGroup('🛡️ Defense — protects yourself', SHOP_ITEMS.filter(i => i.category === 'defense'));

    list.querySelectorAll('.btn-shop-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => buyShopItem(btn.dataset.iid));
    });
}

async function buyShopItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item || !currentGameRef || !currentPlayer) return;
    const myCoins = playersData[currentPlayer.playerKey]?.coins || 0;
    if (myCoins < item.cost) { showToast('Not enough coins! 🪙', 'error'); return; }

    if (item.id === 'shield') {
        await currentGameRef.update({
            [`players/${currentPlayer.playerKey}/coins`]: firebase.database.ServerValue.increment(-item.cost),
            [`players/${currentPlayer.playerKey}/effects/shield`]: true,
        });
        showToast('🛡️ Shield equipped! You\'re protected from the next trick.', 'success');
        closeShopModal();
        return;
    }

    const expiry = Date.now() + item.duration;
    const others = Object.values(playersData).filter(p => p.playerKey !== currentPlayer.playerKey);
    if (others.length === 0) { showToast('No other players in the pack!', 'info'); return; }

    await currentGameRef.child(`players/${currentPlayer.playerKey}/coins`).set(
        firebase.database.ServerValue.increment(-item.cost)
    );

    let blocked = 0;
    await Promise.all(others.map(target =>
        currentGameRef.child(`players/${target.playerKey}/effects`).transaction(existing => {
            if (existing?.shield) { blocked++; return { ...existing, shield: null }; }
            return { ...(existing || {}), [item.effectKey]: expiry };
        })
    ));

    if (blocked > 0) showToast(`${item.icon} ${item.name} — ${blocked} player${blocked !== 1 ? 's' : ''} blocked it with a Shield!`, 'info');
    else showToast(`${item.icon} ${item.name} activated on the pack!`, 'success');
    closeShopModal();
}

function updateActiveEffectsBar() {
    const bar = document.getElementById('activeEffectsBar');
    if (!bar || !currentPlayer) return;
    const fx = getMyEffects();
    const now = Date.now();
    const active = [];
    if ((fx.blender || 0) > now) active.push({ icon: '🌀', label: 'Plates scrambled', expiry: fx.blender });
    if ((fx.freeze  || 0) > now) active.push({ icon: '⏸️', label: 'You are frozen',   expiry: fx.freeze });
    if ((fx.fog     || 0) > now) active.push({ icon: '🌫️', label: 'Scores hidden',    expiry: fx.fog });
    if (fx.shield)               active.push({ icon: '🛡️', label: 'Shielded',          expiry: null });
    bar.style.display = active.length ? 'flex' : 'none';
    bar.innerHTML = active.map(e =>
        `<div class="effect-pill">${e.icon} ${e.label}${e.expiry ? ` <span class="effect-time">${formatTimeLeft(e.expiry)}</span>` : ''}</div>`
    ).join('');
}

function openFeedbackModal() {
    feedbackType = 'bug';
    document.getElementById('feedbackModal').style.display = 'flex';
    document.getElementById('feedbackText').value = '';
    document.getElementById('feedbackError').textContent = '';
    document.getElementById('feedbackCharCount').textContent = '0 / 500';
    updateFeedbackTypeUI();
    setTimeout(() => document.getElementById('feedbackText').focus(), 100);
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
}

function updateFeedbackTypeUI() {
    document.getElementById('feedbackTypeBug').classList.toggle('selected', feedbackType === 'bug');
    document.getElementById('feedbackTypeFeature').classList.toggle('selected', feedbackType === 'feature');
    const ta = document.getElementById('feedbackText');
    if (ta) ta.placeholder = feedbackType === 'bug'
        ? 'Describe what happened and what you expected to happen...'
        : 'Describe your idea or the gameplay improvement you\'d like to see...';
}

async function submitFeedback() {
    const text = document.getElementById('feedbackText').value.trim();
    if (!text) { document.getElementById('feedbackError').textContent = 'Please describe your feedback before submitting.'; return; }
    if (text.length > 500) { document.getElementById('feedbackError').textContent = 'Please keep it under 500 characters.'; return; }
    if (!database) { document.getElementById('feedbackError').textContent = 'Not connected. Please try again.'; return; }
    const btn = document.getElementById('feedbackSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
        await database.ref('feedback').push({
            type: feedbackType,
            description: text,
            playerName: currentPlayer?.name || 'Anonymous',
            playerTag: currentPlayer?.tag || '',
            playerKey: currentPlayer?.playerKey || '',
            gameCode: currentGameCode || null,
            status: 'open',
            submittedAt: firebase.database.ServerValue.TIMESTAMP,
        });
        closeFeedbackModal();
        showToast(feedbackType === 'bug' ? 'Bug reported! JcWolF is on the case. 🐛' : 'Feature request sent! Love the idea. 💡', 'success');
    } catch (err) {
        document.getElementById('feedbackError').textContent = 'Failed to submit. Please try again.';
    } finally {
        btn.disabled = false;
        btn.textContent = '📨 Submit';
    }
}

function bindEventListeners() {
    if (eventsBound) return;
    eventsBound = true;
    const playerNameInput = document.getElementById('playerNameInput');
    const playerTagInput = document.getElementById('playerTagInput');
    const newGameInput = document.getElementById('newGameInput');
    const joinCodeInput = document.getElementById('joinCodeInput');
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('setNameBtn').addEventListener('click', setPlayerName);
    document.getElementById('presetNortheastBtn')?.addEventListener('click', () => applyPlayAreaPreset('northeast'));
    document.getElementById('presetMidAtlanticBtn')?.addEventListener('click', () => applyPlayAreaPreset('mid_atlantic'));
    document.getElementById('presetSoutheastBtn')?.addEventListener('click', () => applyPlayAreaPreset('southeast'));
    document.getElementById('presetGulfCoastBtn')?.addEventListener('click', () => applyPlayAreaPreset('gulf_coast'));
    document.getElementById('presetMidwestBtn')?.addEventListener('click', () => applyPlayAreaPreset('midwest'));
    document.getElementById('presetGreatPlainsBtn')?.addEventListener('click', () => applyPlayAreaPreset('great_plains'));
    document.getElementById('presetMountainWestBtn')?.addEventListener('click', () => applyPlayAreaPreset('mountain_west'));
    document.getElementById('presetSouthwestBtn')?.addEventListener('click', () => applyPlayAreaPreset('southwest'));
    document.getElementById('presetPacificNwBtn')?.addEventListener('click', () => applyPlayAreaPreset('pacific_northwest'));
    document.getElementById('presetWestCoastBtn')?.addEventListener('click', () => applyPlayAreaPreset('west_coast'));
    document.getElementById('clearPlayAreaBtn')?.addEventListener('click', clearPlayAreaSelection);
    playerNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { if (!playerTagInput.value.trim()) playerTagInput.focus(); else setPlayerName(); } });
    playerTagInput.addEventListener('input', () => { playerTagInput.value = normalizeTagInput(playerTagInput.value); });
    playerTagInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') setPlayerName(); });
    document.getElementById('createGameBtn').addEventListener('click', createGame);
    document.getElementById('joinGameBtn').addEventListener('click', () => joinGame());
    newGameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') createGame(); });
    joinCodeInput.addEventListener('input', () => { joinCodeInput.value = normalizeCodeInput(joinCodeInput.value); });
    joinCodeInput.addEventListener('paste', (e) => { e.preventDefault(); joinCodeInput.value = normalizeCodeInput((e.clipboardData || window.clipboardData).getData('text')); });
    joinCodeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') joinGame(); });
    document.getElementById('refreshBtn')?.addEventListener('click', () => window.location.reload());
    document.getElementById('chatBtn')?.addEventListener('click', openChat);
    document.getElementById('closeChatBtn')?.addEventListener('click', closeChatSheet);
    document.getElementById('chatSendBtn')?.addEventListener('click', sendChatMessage);
    document.getElementById('chatInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });
    document.getElementById('chatPolicyAgreeBtn')?.addEventListener('click', () => {
        try { localStorage.setItem('platequest_chat_agreed', '1'); } catch(e) {}
        document.getElementById('chatPolicyModal')?.classList.remove('visible');
        _openChatSheet();
    });
    document.getElementById('chatPolicyCancelBtn')?.addEventListener('click', () => {
        document.getElementById('chatPolicyModal')?.classList.remove('visible');
    });
    const chatPolicyModal = document.getElementById('chatPolicyModal');
    if (chatPolicyModal) chatPolicyModal.addEventListener('click', e => { if (e.target === chatPolicyModal) chatPolicyModal.classList.remove('visible'); });
    document.getElementById('newRoundBtn')?.addEventListener('click', startNewRound);
    document.getElementById('rerollPrizesBtn')?.addEventListener('click', rerollPrizes);
    document.getElementById('placeBountyBtn')?.addEventListener('click', openBountyModal);
    document.getElementById('speedRoundBtn')?.addEventListener('click', openSpeedRoundModal);
    document.getElementById('assignSecretTargetsBtn')?.addEventListener('click', assignSecretTargets);
    document.getElementById('suddenDeathBtn')?.addEventListener('click', openSuddenDeathModal);
    const suddenDeathModal = document.getElementById('suddenDeathModal');
    if (suddenDeathModal) suddenDeathModal.addEventListener('click', e => { if (e.target === suddenDeathModal) closeSuddenDeathModal(); });
    const bountyModal = document.getElementById('bountyModal');
    if (bountyModal) bountyModal.addEventListener('click', e => { if (e.target === bountyModal) closeBountyModal(); });
    const speedRoundModal = document.getElementById('speedRoundModal');
    if (speedRoundModal) speedRoundModal.addEventListener('click', e => { if (e.target === speedRoundModal) closeSpeedRoundModal(); });
    document.getElementById('shopBtn')?.addEventListener('click', openShopModal);
    document.getElementById('closeShopBtn')?.addEventListener('click', closeShopModal);
    const shopModal = document.getElementById('shopModal');
    if (shopModal) shopModal.addEventListener('click', e => { if (e.target === shopModal) closeShopModal(); });
    document.getElementById('tauntBtn')?.addEventListener('click', openTauntModal);
    document.getElementById('closeTauntBtn')?.addEventListener('click', closeTauntModal);
    document.getElementById('cancelTauntBtn')?.addEventListener('click', closeTauntModal);
    document.getElementById('sendTauntBtn')?.addEventListener('click', sendTaunt);
    const tauntModal = document.getElementById('tauntModal');
    if (tauntModal) tauntModal.addEventListener('click', e => { if (e.target === tauntModal) closeTauntModal(); });
    document.getElementById('editIdentityBtn').addEventListener('click', openEditIdentityModal);
    document.getElementById('cancelEditIdentityBtn').addEventListener('click', closeEditIdentityModal);
    document.getElementById('saveEditIdentityBtn').addEventListener('click', saveEditIdentity);
    document.getElementById('editTagInput')?.addEventListener('input', e => { e.target.value = normalizeTagInput(e.target.value); });
    const editIdentityModal = document.getElementById('editIdentityModal');
    if (editIdentityModal) editIdentityModal.addEventListener('click', e => { if (e.target === editIdentityModal) closeEditIdentityModal(); });
    document.getElementById('resetMyProgressBtn').addEventListener('click', resetMyProgress);
    document.getElementById('leaveGameBtn').addEventListener('click', leaveGame);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('copyCodeBtn').addEventListener('click', copyGameCode);
    document.getElementById('shareCodeBtn').addEventListener('click', shareGameCode);
    document.getElementById('inviteNewBtn').addEventListener('click', inviteNewPlayer);
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveGameSession(); else if (currentGameCode && currentPlayer && currentConnectionState === 'online') { setupPresence(); updateDiagnosticsPanel(); } });
    window.addEventListener('pageshow', async (event) => {
        if (!event.persisted) return;
        if (currentPlayer && !currentGameCode) { await attemptAutoResume(); return; }
        if (currentGameCode && currentPlayer) {
            // Restore from bfcache: re-attach listener and presence regardless of connection state
            if (!gameListenerAttached && currentGameRef) setupGameListeners();
            setupPresence();
            updateDiagnosticsPanel();
        }
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); setDiagnosticsVisible(); }
        if (e.key === 'Escape') { closePlayerDetail(); closeAnnounceModal(); closeTauntModal(); closeChatSheet(); closeAuditModal(); closeQRModal(); closeActivityFeed(); closeEndGameScreen(); closeHowToPlay(); }
    });
    // Delegated listener on stable element — survives scoresContainer innerHTML rebuilds
    const liveScores = document.getElementById('liveScores');
    if (liveScores) {
        let _scTouchX = 0, _scTouchY = 0, _scTouchFired = 0;
        liveScores.addEventListener('touchstart', e => { _scTouchX = e.touches[0].clientX; _scTouchY = e.touches[0].clientY; }, { passive: true });
        liveScores.addEventListener('touchend', e => {
            const card = e.target.closest('[data-playerkey]');
            if (!card) return;
            const dx = Math.abs(e.changedTouches[0].clientX - _scTouchX);
            const dy = Math.abs(e.changedTouches[0].clientY - _scTouchY);
            if (dx < 10 && dy < 10) { _scTouchFired = Date.now(); openPlayerDetail(card.dataset.playerkey); }
        }, { passive: true });
        liveScores.addEventListener('click', e => {
            const card = e.target.closest('[data-playerkey]');
            if (card && Date.now() - _scTouchFired > 350) openPlayerDetail(card.dataset.playerkey);
        });
    }
    const closeDetailBtn = document.getElementById('closePlayerDetailBtn');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closePlayerDetail);
    document.getElementById('closeBadgeDetailBtn')?.addEventListener('click', closeBadgeDetail);
    const detailModal = document.getElementById('playerDetailModal');
    if (detailModal) detailModal.addEventListener('click', e => { if (e.target === detailModal) closePlayerDetail(); });
    document.getElementById('announceBtn')?.addEventListener('click', openAnnounceModal);
    document.getElementById('cancelAnnounceBtn')?.addEventListener('click', closeAnnounceModal);
    document.getElementById('cancelAnnounceBtn2')?.addEventListener('click', closeAnnounceModal);
    document.getElementById('announceSendBtn')?.addEventListener('click', sendAnnouncement);
    document.getElementById('announceInput')?.addEventListener('input', updateAnnounceCounter);
    document.getElementById('announceInput')?.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendAnnouncement(); });
    const announceModal = document.getElementById('announceModal');
    if (announceModal) announceModal.addEventListener('click', e => { if (e.target === announceModal) closeAnnounceModal(); });
    document.getElementById('auditBtn')?.addEventListener('click', () => openAuditModal());
    document.getElementById('cancelAuditBtn')?.addEventListener('click', closeAuditModal);
    document.getElementById('cancelAuditBtn2')?.addEventListener('click', closeAuditModal);
    document.getElementById('rerunAuditBtn')?.addEventListener('click', () => runAuditCorrections());
    const auditModal = document.getElementById('auditModal');
    if (auditModal) auditModal.addEventListener('click', e => { if (e.target === auditModal) closeAuditModal(); });
    document.getElementById('clearConfirmCancel')?.addEventListener('click', hideClearConfirmSheet);
    document.getElementById('clearConfirmOk')?.addEventListener('click', submitClearRequest);
    document.getElementById('endGameBtn')?.addEventListener('click', endGame);
    document.getElementById('viewResultsBtn')?.addEventListener('click', showEndGameScreen);
    document.getElementById('closeEndGameBtn')?.addEventListener('click', closeEndGameScreen);
    document.getElementById('shareResultsBtn')?.addEventListener('click', shareEndGameResults);
    document.getElementById('winnersCircleBtn')?.addEventListener('click', shareWinnersCircle);
    document.getElementById('howToPlayOkBtn')?.addEventListener('click', closeHowToPlay);
    document.getElementById('howToPlayHelpBtn')?.addEventListener('click', showHowToPlay);
    document.getElementById('how2PlayBtn')?.addEventListener('click', showHowToPlay);
    document.getElementById('howToPlayModal')?.addEventListener('click', e => { if (e.target === document.getElementById('howToPlayModal')) closeHowToPlay(); });
    document.getElementById('qrCodeBtn')?.addEventListener('click', showQRModal);
    document.getElementById('closeQRBtn')?.addEventListener('click', closeQRModal);
    document.getElementById('qrModal')?.addEventListener('click', e => { if (e.target === document.getElementById('qrModal')) closeQRModal(); });
    document.getElementById('activityBtn')?.addEventListener('click', toggleActivityFeed);
    document.getElementById('closeActivityBtn')?.addEventListener('click', closeActivityFeed);
    document.getElementById('wolfAdminBtn')?.addEventListener('click', () => window.open('admin.html', '_blank'));
    // Wolf PIN modal — use delegation so clicks on inner <span> still resolve to the button
    document.getElementById('wolfPinCancelBtn')?.addEventListener('click', closeWolfPinModal);
    document.getElementById('wolfPinBackBtn')?.addEventListener('click', wolfPinBackspace);
    document.getElementById('wolfPinModal')?.addEventListener('click', e => {
        const btn = e.target.closest('.wolf-pin-key[data-digit]');
        if (btn) wolfPinDigit(btn.dataset.digit);
    });
    // Feedback modal
    document.querySelectorAll('.open-feedback-btn').forEach(btn => btn.addEventListener('click', openFeedbackModal));
    document.getElementById('feedbackCancelBtn')?.addEventListener('click', closeFeedbackModal);
    document.getElementById('feedbackSubmitBtn')?.addEventListener('click', submitFeedback);
    document.getElementById('feedbackTypeBug')?.addEventListener('click', () => { feedbackType = 'bug'; updateFeedbackTypeUI(); });
    document.getElementById('feedbackTypeFeature')?.addEventListener('click', () => { feedbackType = 'feature'; updateFeedbackTypeUI(); });
    document.getElementById('feedbackText')?.addEventListener('input', () => {
        const len = document.getElementById('feedbackText').value.length;
        document.getElementById('feedbackCharCount').textContent = `${len} / 500`;
        document.getElementById('feedbackError').textContent = '';
    });
    document.getElementById('feedbackModal')?.addEventListener('click', e => { if (e.target === document.getElementById('feedbackModal')) closeFeedbackModal(); });
    window.addEventListener('beforeunload', () => saveGameSession());
}

function initializeDarkMode() { if (localStorage.getItem(STORAGE_KEYS.darkMode) === 'true') { document.body.classList.add('dark'); document.getElementById('darkModeBtn').textContent = '☀️ Light Mode'; } }
function readGameCodeFromUrl() { const params = new URLSearchParams(window.location.search); const code = params.get('game') || params.get('code'); return code ? normalizeCodeInput(code) : null; }
function writeGameCodeToUrl(code) { if (!window.history || !window.history.replaceState) return; const url = new URL(window.location.href); url.searchParams.set('game', code); url.searchParams.delete('joinrefresh'); window.history.replaceState({}, document.title, url.toString()); }
function clearGameCodeFromUrl() { if (!window.history || !window.history.replaceState) return; const url = new URL(window.location.href); url.searchParams.delete('game'); url.searchParams.delete('code'); url.searchParams.delete('joinrefresh'); window.history.replaceState({}, document.title, url.pathname); }

function startGame() { splash.style.display = 'none'; game.style.display = 'block'; if (!currentPlayer) document.getElementById('playerNameInput').focus(); updateDiagnosticsPanel(); }

function setPlayerName() {
    const player = buildPlayerFromInputs();
    if (!player) return;
    if (player.tag === 'JcWolF') {
        pendingJcWolFPlayer = player;
        wolfPinEntry = '';
        updateWolfPinDots();
        document.getElementById('wolfPinError').textContent = '';
        document.getElementById('wolfPinModal').style.display = 'flex';
        return;
    }
    completeSetPlayerName(player);
}

function completeSetPlayerName(player) {
    currentPlayer = player;
    persistIdentity(player);
    enableGameCards();
    showToast(`Identity saved: ${player.displayName} ${resolvePlayerIcon(player)}`, 'success');
    if (pendingGameCodeFromUrl && game.style.display === 'block') document.getElementById('joinCodeInput').value = pendingGameCodeFromUrl;
    updateDiagnosticsPanel();
    if (currentGameCode && currentGameRef) {
        currentGameRef.child(`players/${player.playerKey}`).update({
            name: player.name, tag: player.tag, icon: player.icon || null, displayName: player.displayName
        }).catch(() => {});
        setupPresence();
    }
}

function closeWolfPinModal() {
    document.getElementById('wolfPinModal').style.display = 'none';
    wolfPinEntry = '';
    pendingJcWolFPlayer = null;
}

function updateWolfPinDots() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`wolfPinD${i}`);
        if (dot) dot.classList.toggle('filled', i <= wolfPinEntry.length);
    }
}

function wolfPinDigit(d) {
    if (wolfPinEntry.length >= 4) return;
    wolfPinEntry += d;
    updateWolfPinDots();
    document.getElementById('wolfPinError').textContent = '';
    if (wolfPinEntry.length === 4) wolfPinConfirm();
}

function wolfPinBackspace() {
    wolfPinEntry = wolfPinEntry.slice(0, -1);
    updateWolfPinDots();
    document.getElementById('wolfPinError').textContent = '';
}

function wolfPinConfirm() {
    if (wolfPinEntry !== '9653') {
        document.getElementById('wolfPinError').textContent = 'Incorrect PIN. Try again.';
        wolfPinEntry = '';
        updateWolfPinDots();
        return;
    }
    closeWolfPinModal();
    if (pendingJcWolFPlayer) { completeSetPlayerName(pendingJcWolFPlayer); pendingJcWolFPlayer = null; }
}

function openEditIdentityModal() {
    const modal = document.getElementById('editIdentityModal');
    if (!modal) return;
    document.getElementById('editNameInput').value = currentPlayer?.name || '';
    document.getElementById('editTagInput').value = currentPlayer?.tag || '';
    populateIconPickerRow('editIconPickerRow', currentPlayer?.icon || null);
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('editNameInput').focus(), 120);
}

function closeEditIdentityModal() {
    const modal = document.getElementById('editIdentityModal');
    if (modal) modal.style.display = 'none';
}

function saveEditIdentity() {
    const name = document.getElementById('editNameInput').value.trim();
    const tag = normalizeTagInput(document.getElementById('editTagInput').value);
    const icon = getIconFromRow('editIconPickerRow');
    if (!name) { showToast('Please enter your name! 👤', 'error'); document.getElementById('editNameInput').focus(); return; }
    if (!tag) { showToast('Please enter a player tag! 🏷️', 'error'); document.getElementById('editTagInput').focus(); return; }
    if (name.length > 20) { showToast('Name must be 20 characters or less.', 'error'); return; }
    if (!/^[a-zA-Z0-9]+$/.test(tag)) { showToast('Tag can only contain letters and numbers.', 'error'); return; }
    const playerKey = `${slugify(name)}__${slugify(tag)}`;
    const player = { playerKey, deviceId: getOrCreateDeviceId(), name, tag, icon, displayName: `${name} (${tag})`, colorSeed: slugify(`${name}_${tag}`), updatedAtLocal: Date.now() };
    closeEditIdentityModal();
    if (tag === 'JcWolF') {
        pendingJcWolFPlayer = player;
        wolfPinEntry = '';
        updateWolfPinDots();
        document.getElementById('wolfPinError').textContent = '';
        document.getElementById('wolfPinModal').style.display = 'flex';
        return;
    }
    completeSetPlayerName(player);
}

async function generateUniqueGameCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 12; attempt += 1) {
        let code = '';
        for (let i = 0; i < 6; i += 1) code += chars.charAt(Math.floor(Math.random() * chars.length));
        const snapshot = await database.ref(`games/${code}`).once('value');
        if (!snapshot.exists()) return code;
    }
    throw new Error('Unable to generate a unique game code.');
}

async function createGame() {
    if (!currentPlayer) { showToast('Please set your name first! 👤', 'error'); return; }
    if (!(await ensureDatabaseReady('create a pack'))) return;
    const gameName = document.getElementById('newGameInput').value.trim();
    const playRegion = document.getElementById('primaryRegionSelect')?.value || '';
    const plateScope = document.getElementById('plateScopeSelect')?.value || 'us_only';
    const gpsRarity = document.getElementById('gpsRarityToggle')?.checked || false;
    const playAreaStates = getSelectedPlayAreaStates();
    if (!gameName) { showToast('Please enter a pack name! 🎮', 'error'); document.getElementById('newGameInput').focus(); return; }
    if (!playRegion) { showToast('Please choose a primary play region. 🧭', 'error'); document.getElementById('primaryRegionSelect')?.focus(); return; }
    if (!playAreaStates.length) { showToast('Select at least one trip-area state. 🗺️', 'error'); return; }
    showLoading('Creating pack...');
    try {
        const code = await generateUniqueGameCode();
        const roomRef = database.ref(`games/${code}`);
        const roomData = {
            version: ROOM_VERSION,
            name: gameName,
            code,
            status: 'active',
            settings: { maxPlayers: MAX_PLAYERS, playRegion, plateScope, playAreaStates, gpsRarity },
            hostPlayerKey: currentPlayer.playerKey,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            claimedStates: {},
            players: { [currentPlayer.playerKey]: buildPlayerRoomRecord(currentPlayer, { isHost: true }) }
        };
        await roomRef.set(roomData);
        await assignGamePrizes(code, plateScope);
        clearPendingJoinReload();
        await connectToGame(code, { showJoinedToast: true, joinedMessage: `Pack "${gameName}" created! 🐺` });
    } catch (error) {
        console.error('Error creating game:', error);
        showToast(error?.message || 'Failed to create pack. Please try again.', 'error');
    } finally { hideLoading(); }
}

async function joinGame(codeOverride = null) {
    if (!currentPlayer) { showToast('Please set your name first! 👤', 'error'); return; }
    if (!(await ensureDatabaseReady('join a pack'))) return;
    const code = normalizeCodeInput((typeof codeOverride === 'string' ? codeOverride : null) || document.getElementById('joinCodeInput').value || '');
    document.getElementById('joinCodeInput').value = code;
    if (!code || code.length !== 6) { showToast('Pack code must be 6 characters.', 'error'); document.getElementById('joinCodeInput').focus(); return; }
    showLoading('Joining pack...');
    try { await connectToGame(code, { showJoinedToast: true }); clearPendingJoinReload(); }
    catch (error) {
        console.error('Error joining game:', error);
        // Only reload for network/permission issues — reloading cannot fix a genuinely missing pack
        const shouldReloadOnce = !getPendingJoinReload() && (/permission_denied/i.test(error.message || '') || /network/i.test(error.message || ''));
        if (shouldReloadOnce) { showToast('Refreshing once to join the pack…', 'info'); reloadForJoin(code); return; }
        clearPendingJoinReload();
        showToast(error.message || 'Failed to join pack.', 'error');
    } finally { hideLoading(); }
}

async function connectToGame(code, options = {}) {
    const roomRef = database.ref(`games/${code}`);
    const snapshot = await roomRef.once('value');
    if (!snapshot.exists()) throw new Error('Pack not found. Check the code, or reload the app if this pack is active.');
    const room = snapshot.val();
    const normalizedPlayers = normalizePlayers(room.players || {});
    const existingPlayer = normalizedPlayers[currentPlayer.playerKey];
    if (!existingPlayer && currentPlayer.legacyPlayerId && normalizedPlayers[currentPlayer.legacyPlayerId]) {
        const legacyPlayer = normalizedPlayers[currentPlayer.legacyPlayerId];
        await roomRef.child(`players/${currentPlayer.legacyPlayerId}`).remove().catch(() => {});
        normalizedPlayers[currentPlayer.playerKey] = { ...legacyPlayer, playerKey: currentPlayer.playerKey, name: currentPlayer.name, tag: currentPlayer.tag, displayName: currentPlayer.displayName, deviceId: currentPlayer.deviceId };
    }
    if (!normalizedPlayers[currentPlayer.playerKey] && Object.keys(normalizedPlayers).length >= (room.settings?.maxPlayers || MAX_PLAYERS)) throw new Error('Pack is full. Maximum 8 players allowed.');
    warmUpGpsIfNeeded(room);
    const existing = normalizedPlayers[currentPlayer.playerKey];
    const playerRecord = buildPlayerRoomRecord(currentPlayer, { isHost: existing?.isHost || room.hostPlayerKey === currentPlayer.playerKey, joinedAt: existing?.joinedAt, states: existing?.states || {} });
    await roomRef.child(`players/${currentPlayer.playerKey}`).update(playerRecord);
    await roomRef.update({ updatedAt: firebase.database.ServerValue.TIMESTAMP });
    currentGameCode = code;
    window.currentGameCode = code;
    currentGameRef = roomRef;
    window.pausedPack = null; // clear any paused state on successful connect
    saveGameSession();
    addToMyGames(code, room.name);
    writeGameCodeToUrl(code);
    lastSyncAt = Date.now();
    setupGameListeners();
    setupPresence();
    showActiveGame();
    if (options.showJoinedToast) showToast(options.joinedMessage || `Joined "${room.name}" pack! 🐺`, 'success');
    updateDiagnosticsPanel();
}

function teardownCurrentRoomListeners() {
    if (currentGameRef && gameListenerAttached) currentGameRef.off();
    gameListenerAttached = false;
    if (announcementsChildRef) { announcementsChildRef.off(); announcementsChildRef = null; }
    if (tauntsChildRef) { tauntsChildRef.off(); tauntsChildRef = null; }
    if (chatChildRef) { chatChildRef.off(); chatChildRef = null; }
    if (presenceCleanup) { presenceCleanup(); presenceCleanup = null; }
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
}

function setupGameListeners() {
    if (!currentGameRef) return;
    if (gameListenerAttached) { currentGameRef.off(); gameListenerAttached = false; }
    if (announcementsChildRef) { announcementsChildRef.off(); announcementsChildRef = null; }
    if (tauntsChildRef) { tauntsChildRef.off(); tauntsChildRef = null; }
    if (chatChildRef) { chatChildRef.off(); chatChildRef = null; }
    currentGameRef.on('value', (snapshot) => {
        if (!snapshot.exists()) { showToast('Pack no longer exists.', 'error'); returnToSetup(true); return; }
        gameData = snapshot.val();
        window.gameData = gameData; // expose for companion inline script
        playersData = normalizePlayers(gameData.players || {});
        if (!playersData[currentPlayer.playerKey]) {
            if (!playerConfirmedInPack) { return; } // grace period: first snapshot may arrive before write propagates
            showToast('You are no longer in this pack.', 'info'); returnToSetup(true); return;
        }
        playerConfirmedInPack = true;
        lastSyncAt = Date.now();
        updateGameUI();
    });
    gameListenerAttached = true;

    // Dedicated child_added listeners for announcements and taunts.
    // child_added fires for ALL existing children first, then new ones.
    // We use a readiness flag (set after the initial batch via once('value'))
    // so only genuinely new items trigger notifications.
    let annReady = false;
    announcementsChildRef = currentGameRef.child('announcements');
    announcementsChildRef.on('child_added', snap => {
        if (!annReady || !currentPlayer) return;
        const ann = snap.val();
        if (!ann) return;
        showToast(`📣 ${ann.sentBy}: ${ann.text}`, 'announcement');
        playAnnouncementChime();
    });
    // once('value') fires AFTER all initial child_added callbacks — mark ready here
    currentGameRef.child('announcements').once('value', () => { annReady = true; });

    let tauntReady = false;
    tauntsChildRef = currentGameRef.child('taunts');
    tauntsChildRef.on('child_added', snap => {
        if (!tauntReady || !currentPlayer) return;
        showTauntNotification(snap.val());
    });
    currentGameRef.child('taunts').once('value', () => { tauntReady = true; });

    let chatReady = false;
    chatChildRef = currentGameRef.child('chat');
    chatChildRef.on('child_added', snap => {
        if (!chatReady || !currentPlayer) return;
        const msg = snap.val();
        if (!msg) return;
        const sheet = document.getElementById('chatSheet');
        const isOpen = sheet?.classList.contains('open');
        if (isOpen) {
            renderChatMessages();
        } else if (canSeeChatMessage(msg) && msg.playerKey !== currentPlayer.playerKey) {
            chatUnreadCount++;
            showToast(`💬 ${escapeHtml(msg.displayName || '?')}: ${escapeHtml((msg.message || '').slice(0, 60))}`, 'info');
            updateChatBadge();
        }
    });
    currentGameRef.child('chat').once('value', () => { chatReady = true; });
}

function setupPresence() {
    if (!database || !currentGameCode || !currentPlayer || currentConnectionState !== 'online') return;
    if (presenceCleanup) { presenceCleanup(); presenceCleanup = null; }
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
    const playerRef = database.ref(`games/${currentGameCode}/players/${currentPlayer.playerKey}`);
    const connectedRef = database.ref('.info/connected');
    const connectedListener = connectedRef.on('value', (snapshot) => {
        if (snapshot.val() !== true) return;
        playerRef.child('connected').onDisconnect().set(false);
        playerRef.child('lastSeen').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
        playerRef.update({ connected: true, lastSeen: firebase.database.ServerValue.TIMESTAMP, deviceId: currentPlayer.deviceId, name: currentPlayer.name, tag: currentPlayer.tag, icon: currentPlayer.icon || null, displayName: currentPlayer.displayName }).then(() => { lastSyncAt = Date.now(); updateDiagnosticsPanel(); }).catch((error) => console.warn('Presence update failed:', error));
    });
    heartbeatInterval = setInterval(() => { playerRef.update({ connected: true, lastSeen: firebase.database.ServerValue.TIMESTAMP }).then(() => { lastSyncAt = Date.now(); updateDiagnosticsPanel(); }).catch(() => {}); }, HEARTBEAT_MS);
    presenceCleanup = () => { connectedRef.off('value', connectedListener); playerRef.update({ connected: false, lastSeen: firebase.database.ServerValue.TIMESTAMP }).catch(() => {}); };
}

async function attemptAutoResume() {
    if (!database) return;
    const savedSession = getSavedSession();
    const urlCode = pendingGameCodeFromUrl;
    if (urlCode && game.style.display !== 'block') startGame();
    if (!currentPlayer) { if (urlCode) document.getElementById('joinCodeInput').value = urlCode; updateDiagnosticsPanel(); return; }
    if (urlCode) {
        document.getElementById('joinCodeInput').value = urlCode;
        try { await connectToGame(urlCode, { showJoinedToast: true, joinedMessage: `Rejoined pack ${urlCode}.` }); pendingGameCodeFromUrl = null; clearPendingJoinReload(); return; }
        catch (error) { console.warn('URL join failed:', error); showToast(error.message || 'Could not join the shared pack.', 'error'); clearPendingJoinReload(); clearGameCodeFromUrl(); }
    }
    if (!savedSession || !savedSession.gameCode || savedSession.playerKey !== currentPlayer.playerKey) { updateDiagnosticsPanel(); return; }
    const age = Date.now() - (savedSession.savedAt || 0);
    if (age > 7 * 24 * 60 * 60 * 1000) { clearGameSession(); return; }
    try { await connectToGame(savedSession.gameCode, { showJoinedToast: true, joinedMessage: `Welcome back to pack ${savedSession.gameCode}!` }); if (game.style.display !== 'block') startGame(); }
    catch (error) { console.warn('Auto resume failed:', error); if (/not found|no longer exists|does not exist/i.test(error.message || '')) clearGameSession(); }
}

function showActiveGame() { if (splash.style.display !== 'none') splash.style.display = 'none'; game.style.display = 'block'; setupSection.style.display = 'none'; gameActive.style.display = 'block'; gameCodeHeader.style.display = 'flex'; updateGameCodeHeader(); updateDiagnosticsPanel(); }
function updateGameCodeHeader() { const persistentGameCode = document.getElementById('persistentGameCode'); if (persistentGameCode && currentGameCode) persistentGameCode.textContent = currentGameCode; }

function updateGameUI() {
    if (!gameData || !currentPlayer) return;
    // Detect round reset by host — reinitialize per-round local state
    const currentRound = gameData.roundNumber || 1;
    if (lastKnownRound !== null && currentRound !== lastKnownRound) {
        prevPlayerStates = null; prevAnnouncementKeys = null; prevTauntKeys = null;
        prevClearRequestKeys = null; prevRegionClearRequestKeys = null; prevPlateDisputeKeys = null;
        prevChatKeys = null; prevReactionKeys = null; chatUnreadCount = 0;
        lastKnownSpeedRoundEnd = null; blackoutWon = false; pendingAchievements = new Set(); lastAchievementCheck = 0; lastKnownRivalry = undefined; lastKnownSuddenDeathWinner = null;
        if (speedRoundInterval) { clearInterval(speedRoundInterval); speedRoundInterval = null; }
        endGameScreenShown = false; lastRenderedStateSignature = '';
        closeEndGameScreen();
        showToast('New round started! 🏁 Plates cleared.', 'success');
    }
    lastKnownRound = currentRound;
    detectNewFinds();
    detectClearRequests();
    detectRegionClearRequests();
    detectPlateDisputeRequests();
    detectNewReactions();
    detectSpeedRound();
    detectBlackout();
    detectSuddenDeath();
    updateSecretTargetDisplay();
    detectRivalryChallenges();
    if (Date.now() - lastAchievementCheck > 4000) {
        lastAchievementCheck = Date.now();
        checkAchievements(currentPlayer.playerKey).catch(() => {});
    }
    autoCleanRegionBackups();
    autoCleanPlateBackups();
    updateAuditBadge();
    detectLuckyPlateReveal();
    maybeRunRegionMigration();
    const isHost = gameData?.hostPlayerKey === currentPlayer.playerKey;
    const isEnded = gameData?.status === 'ended';
    // Host section — show/hide entire block; End Game hidden when game already ended
    const hostSection = document.getElementById('hostSection');
    if (hostSection) hostSection.style.display = isHost ? '' : 'none';
    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) endGameBtn.style.display = isEnded ? 'none' : '';
    // View Results shown when game ended (spans full width in Pack section)
    const viewResultsBtn = document.getElementById('viewResultsBtn');
    if (viewResultsBtn) viewResultsBtn.style.display = isEnded ? '' : 'none';
    // Wolf admin button (JcWolF only)
    const wolfAdminBtn = document.getElementById('wolfAdminBtn');
    if (wolfAdminBtn) wolfAdminBtn.style.display = currentPlayer.tag?.toLowerCase() === 'jcwolf' ? '' : 'none';
    if (isEnded && !endGameScreenShown) { endGameScreenShown = true; showEndGameScreen(); }
    if (document.getElementById('activitySheet')?.classList.contains('open')) renderActivityFeed();
    const signature = buildStateSignature();
    if (signature === lastRenderedStateSignature) { updateScores(); updateActiveEffectsBar(); updateConnectionBadgeText(); updateSetupSubtitle(); updateDiagnosticsPanel(); return; }
    lastRenderedStateSignature = signature;
    updateScores();
    renderStates();
    updateActiveEffectsBar();
    updateConnectionBadgeText();
    document.getElementById('gameTitle').textContent = `${gameData.name} Pack 🐺`;
    updateSetupSubtitle();
    updateDiagnosticsPanel();
}

function updateSetupSubtitle() {
    const subtitle = document.getElementById('gameSubtitle');
    if (!subtitle) return;
    const regionLabel = PRIMARY_REGIONS[gameData?.settings?.playRegion]?.label;
    const playAreaCount = gameData?.settings?.playAreaStates?.length || 0;
    const scopeLabel = gameData?.settings?.plateScope === 'us_canada' ? 'US + Canada' : 'US only';
    subtitle.textContent = regionLabel ? `${regionLabel} • ${scopeLabel} • ${playAreaCount} trip-area states` : 'Live adventure with your pack!';
}

function updateConnectionBadgeText() {
    const statusText = document.getElementById('statusText');
    if (!statusText) return;
    if (!currentGameCode) { statusText.textContent = currentConnectionState === 'online' ? 'Ready' : 'Disconnected'; return; }
    const me = playersData[currentPlayer.playerKey];
    const packCount = getPackUniqueStatesCount();
    if (currentConnectionState !== 'online') statusText.textContent = 'Offline - reconnecting…';
    else if (me && me.connected) statusText.textContent = `Pack Connected • ${packCount} plates`;
    else statusText.textContent = 'Rejoining pack…';
}

function updateScores() {
    const scoresContainer = document.getElementById('scoresContainer');
    if (!scoresContainer) return;
    scoresContainer.innerHTML = '';
    const totalPlates = getActivePlateEntries(gameData?.settings?.plateScope).length;

    const rows = Object.values(playersData).map((player) => {
        const stats = computePlayerStats(player.playerKey) || { score: 0, foundCount: 0, firstCount: 0 };
        return { ...player, ...stats, percentage: Math.round((stats.foundCount / totalPlates) * 100) };
    }).sort((a, b) => b.score - a.score || b.foundCount - a.foundCount || (a.joinedAt || 0) - (b.joinedAt || 0));

    rows.forEach((player, index) => {
        const isLeader = index === 0 && player.score > 0;
        const isMe = player.playerKey === currentPlayer.playerKey;
        const playerIcon = resolvePlayerIcon(player);
        const offlineMark = !player.connected ? ' 💤' : '';
        const badges = getPlayerBadges(player.playerKey);
        const badgeRow = badges.length
            ? `<div class="badge-row">${badges.map(b => `<span class="badge-mini" title="${b.label}">${b.icon}</span>`).join('')}</div>`
            : '';
        const coins = player.coins || 0;
        const fogged = !isMe && (getMyEffects().fog || 0) > Date.now();
        const streak = player.streak || { count: 0, lastFoundAt: 0 };
        const streakActive = streak.count >= 3 && (Date.now() - (streak.lastFoundAt || 0)) <= STREAK_WINDOW_MS;
        const streakBadge = streakActive ? `<div class="streak-badge">🔥×${streak.count}</div>` : '';
        const achCount = Object.keys(player.achievements || {}).length;
        const achLine = achCount > 0 ? `<div class="score-ach-count">🏆 ${achCount} achievement${achCount !== 1 ? 's' : ''}</div>` : '';
        const myRivalKey = gameData?.rivalries?.[currentPlayer.playerKey];
        const isMyRival = !isMe && myRivalKey === player.playerKey;
        const rivalBadge = isMyRival ? '<div class="rival-badge">⚔️ Rival</div>' : '';
        const challengeLabel = isMyRival ? '⚔️ Drop' : '⚔️ Challenge';
        const challengeBtn = !isMe ? `<button class="challenge-btn" data-tokey="${player.playerKey}" data-toname="${escapeHtml(player.displayName || player.name || '')}">${challengeLabel}</button>` : '';
        const reactionRow = !isMe ? `<div class="reaction-row">${REACTION_EMOJIS.map(e => `<button class="reaction-btn" data-emoji="${e}" data-tokey="${player.playerKey}" data-toname="${escapeHtml(player.displayName || player.name || '')}">${e}</button>`).join('')}${challengeBtn}</div>` : '';
        const scoreCard = document.createElement('div');
        scoreCard.className = `score-card${isLeader ? ' leader' : ''}${isMyRival ? ' rival' : ''}`;
        scoreCard.dataset.playerkey = player.playerKey;
        scoreCard.setAttribute('role', 'button');
        scoreCard.setAttribute('tabindex', '0');
        scoreCard.innerHTML = `
            <div class="score-card-header">
                <span class="score-player-icon">${playerIcon}</span>
                <div class="score-player-name">${isMe ? 'YOU' : player.displayName}${isLeader ? ' 🏆' : ''}${offlineMark}</div>
                ${streakBadge}${rivalBadge}
            </div>
            <div class="score-pts">${fogged ? '🌫️' : player.score}<span class="score-pts-label">${fogged ? '' : ' pts'}</span></div>
            <div class="score-meta">${fogged ? '— hidden in fog —' : `${player.foundCount} plates&nbsp;&nbsp;·&nbsp;&nbsp;${player.firstCount} first finds`}</div>
            <div class="score-coins">${fogged ? '' : `🪙 ${coins.toLocaleString()} coins`}</div>
            ${fogged ? '' : achLine}
            ${badgeRow}
            ${reactionRow}
        `;
        // Direct listeners added fresh each render — most reliable on mobile
        const _pk = player.playerKey;
        let _tx = 0, _ty = 0, _tfire = 0;
        scoreCard.addEventListener('touchstart', e => { _tx = e.touches[0].clientX; _ty = e.touches[0].clientY; }, { passive: true });
        scoreCard.addEventListener('touchend', e => {
            const dx = Math.abs(e.changedTouches[0].clientX - _tx);
            const dy = Math.abs(e.changedTouches[0].clientY - _ty);
            if (dx < 12 && dy < 12) { _tfire = Date.now(); openPlayerDetail(_pk); }
        }, { passive: true });
        scoreCard.addEventListener('click', e => {
            if (e.target.closest('.reaction-btn') || e.target.closest('.challenge-btn')) return;
            if (Date.now() - _tfire > 350) openPlayerDetail(_pk);
        });
        scoreCard.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                sendReaction(btn.dataset.tokey, btn.dataset.toname, btn.dataset.emoji);
                showReactionPop(btn.dataset.tokey, btn.dataset.emoji, null);
            });
        });
        const chalBtn = scoreCard.querySelector('.challenge-btn');
        if (chalBtn) {
            chalBtn.addEventListener('click', e => {
                e.stopPropagation();
                setRivalry(chalBtn.dataset.tokey, chalBtn.dataset.toname);
            });
        }
        scoresContainer.appendChild(scoreCard);
    });

    // Pack combined progress
    const wrap = document.getElementById('packProgressWrap');
    const stat = document.getElementById('packProgressStat');
    const fill = document.getElementById('packProgressFill');
    if (wrap && stat && fill && totalPlates > 0) {
        const packSet = new Set();
        Object.values(playersData).forEach(p => Object.keys(p.states || {}).forEach(s => packSet.add(s)));
        const packFound = packSet.size;
        const pct = Math.round((packFound / totalPlates) * 100);
        stat.textContent = `${packFound} / ${totalPlates} plates · ${pct}%`;
        fill.style.width = `${pct}%`;
        wrap.style.display = packFound > 0 ? '' : 'none';
    }
    updateCoinWallet();
}

function updateCoinWallet() {
    const wallet = document.getElementById('coinWallet');
    const balanceEl = document.getElementById('coinBalance');
    if (!wallet || !balanceEl || !currentPlayer) return;
    const coins = playersData[currentPlayer.playerKey]?.coins || 0;
    balanceEl.textContent = coins.toLocaleString();
    wallet.style.display = '';
}

function createSectionHeader(title) {
    const header = document.createElement('div');
    header.style.gridColumn = '1 / -1';
    header.style.padding = '8px 4px 2px';
    header.style.fontSize = '18px';
    header.style.fontWeight = '800';
    header.style.color = '#5dade2';
    header.style.letterSpacing = '0.5px';
    header.textContent = title;
    return header;
}

function renderStates() {
    const statesGrid = document.getElementById('statesGrid');
    if (!statesGrid || !currentPlayer) return;
    statesGrid.innerHTML = '';

    // Swipe instruction — always at the top of the plate list
    const hint = document.createElement('div');
    hint.className = 'swipe-hint-bar';
    hint.innerHTML = '<b>👆 Swipe right</b> to mark a plate spotted <span class="swipe-hint-sep">·</span> <b>Long-press</b> to remove <span class="swipe-hint-sep">·</span> <span class="h-you">🐺 you found it</span> <span class="swipe-hint-sep">·</span> <span class="h-pack">👤 pack found it first</span>';
    statesGrid.appendChild(hint);

    const myStates = getMyStatesMap();
    const fx = getMyEffects();
    let plateEntries = getActivePlateEntries(gameData?.settings?.plateScope);
    if ((fx.blender || 0) > Date.now()) plateEntries = seededShuffle(plateEntries, fx.blender);
    let territoryHeaderAdded = false;
    let canadaHeaderAdded = false;

    plateEntries.forEach((state, index) => {
        if (state.category === 'territory' && !territoryHeaderAdded) {
            statesGrid.appendChild(createSectionHeader('🇺🇸 U.S. Territories'));
            territoryHeaderAdded = true;
        }
        if (state.category === 'canada' && !canadaHeaderAdded) {
            statesGrid.appendChild(createSectionHeader('🇨🇦 Canadian Provinces & Territories'));
            canadaHeaderAdded = true;
        }

        const card = document.createElement('div');
        card.className = 'state-card';
        const foundByMe = Boolean(myStates[state.name]);
        const owner = findStateOwner(state.name);
        const foundByOther = owner && owner.playerKey !== currentPlayer.playerKey ? owner : null;
        const claim = getStateClaim(state.name);
        if (foundByMe) card.classList.add('selected'); else if (foundByOther) card.classList.add('selected-by-other');

        const flagImg = `../flags/${state.abbr.toLowerCase()}.png`;
        const plateTypeLabel = state.category === 'canada' ? 'PROVINCE PLATE' : state.category === 'territory' ? 'TERRITORY PLATE' : 'LICENSE PLATE';
        const corridor = gameData?.settings?.playAreaStates || [];
        const myStateData = getMyStatesMap()[state.name];
        const cardCorridor = (gameData?.settings?.gpsRarity && myStateData?.foundNearState) ? [myStateData.foundNearState] : corridor;
        const rarityTier = computeRarityForState(state.name, cardCorridor);
        const rarityCfg = RARITY_CONFIG[rarityTier];
        const rarityBadge = `<div class="rarity-badge rarity-${rarityTier}" title="${rarityCfg.label} · ${rarityCfg.points} pts first find">${rarityCfg.points}pt</div>`;
        const firstFinderBadge = claim ? `<div class="ff-tag" title="First found by ${claim.displayName}">${claim.tag}</div>` : '';
        const hasChest = Boolean(gameData?.chests?.[state.name]);
        const isLucky = gameData?.luckyPlateFound?.stateName === state.name;
        const bountyData = gameData?.bounties?.[state.name];
        const chestBadge = hasChest ? '<div class="chest-badge">🎁</div>' : '';
        const luckyBadge = isLucky ? '<div class="lucky-badge">🍀 Lucky Plate!</div>' : '';
        const bountyBadge = bountyData ? `<div class="bounty-badge">💰${bountyData.reward}</div>` : '';

        card.innerHTML = `
            <div class="license-plate-header">${plateTypeLabel}</div>
            <div class="plate-body">
                <div class="plate-info">
                    <div class="plate-name">${state.name}</div>
                    <div class="plate-abbr">${state.abbr}</div>
                </div>
                <div class="state-flag">
                    <img src="${flagImg}" alt="${state.abbr}" onerror="this.style.display='none';this.parentNode.textContent='${state.abbr}';">
                </div>
            </div>
            ${rarityBadge}
            ${firstFinderBadge}
            ${chestBadge}
            ${luckyBadge}
            ${bountyBadge}
            ${foundByMe ? '<button class="clear-req-btn" aria-label="Request host to remove plate">✕</button>' : ''}
        `;
        if (foundByMe) {
            const clearBtn = card.querySelector('.clear-req-btn');
            clearBtn?.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
            clearBtn?.addEventListener('click', (e) => { e.stopPropagation(); showClearConfirmSheet(state.name); });
        }
        addSwipeToSelect(card, state.name, foundByMe);
        card.style.animationDelay = `${index * 0.02}s`;
        statesGrid.appendChild(card);
    });
}

function addSwipeToSelect(card, stateName, foundByMe) {
    let startX = 0, startY = 0, swiping = false;
    let longPressTimer = null, longPressTriggered = false;
    const THRESHOLD = 70;
    const LONG_PRESS_MS = 600;

    function cancelLongPress() {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        card.classList.remove('long-press-active');
    }

    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        swiping = false;
        longPressTriggered = false;
        card.style.transition = 'none';
        if (foundByMe) {
            card.classList.add('long-press-active');
            longPressTimer = setTimeout(() => {
                longPressTimer = null;
                longPressTriggered = true;
                card.classList.remove('long-press-active');
                if (navigator.vibrate) navigator.vibrate(50);
                showDeselectConfirm(stateName);
            }, LONG_PRESS_MS);
        }
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) cancelLongPress();
        if (!swiping && Math.abs(dy) > Math.abs(dx)) return;
        if (Math.abs(dx) > 6) {
            swiping = true;
            e.preventDefault(); // prevent horizontal page bounce for all horizontal swipes
        }
        if (swiping && dx > 0 && !foundByMe) {
            card.style.transform = `translateX(${Math.min(dx * 0.65, 90)}px)`;
            card.classList.toggle('swipe-active', dx >= THRESHOLD);
        }
    }, { passive: false });

    card.addEventListener('touchend', (e) => {
        cancelLongPress();
        const dx = e.changedTouches[0].clientX - startX;
        card.style.transition = 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease';
        card.style.transform = '';
        card.classList.remove('swipe-active');
        if (longPressTriggered) return;
        if (swiping && dx >= THRESHOLD && !foundByMe) toggleState(stateName, false);
    });
}

function showClearConfirmSheet(stateName) {
    pendingDeselect = null;
    pendingClearState = stateName;
    document.getElementById('clearConfirmTitle').textContent = `Remove ${stateName}?`;
    document.getElementById('clearConfirmMsg').textContent = `This sends a request to the host. If approved, you'll permanently lose all points, badges, and first-finder credit for ${stateName}.`;
    document.getElementById('clearConfirmOk').textContent = 'Request Remove';
    document.getElementById('clearConfirmSheet').classList.add('visible');
}

function showDeselectConfirm(stateName) {
    pendingClearState = null;
    pendingDeselect = stateName;
    const stats = computePlayerStats(currentPlayer?.playerKey);
    const corridor = gameData?.settings?.playAreaStates || [];
    const useGps = gameData?.settings?.gpsRarity;
    const sd = playersData[currentPlayer?.playerKey]?.states?.[stateName];
    const ec = (useGps && sd?.foundNearState) ? [sd.foundNearState] : corridor;
    const tier = computeRarityForState(stateName, ec);
    const pts = RARITY_CONFIG[tier]?.points || 0;
    const isFirst = gameData?.claimedStates?.[stateName]?.playerKey === currentPlayer?.playerKey;
    const ptsLost = isFirst ? pts : Math.ceil(pts / 2);
    document.getElementById('clearConfirmTitle').textContent = `Remove ${stateName}?`;
    document.getElementById('clearConfirmMsg').textContent = `You'll lose ${ptsLost} pts${isFirst ? ' including your First Find bonus' : ''}. This cannot be undone.`;
    document.getElementById('clearConfirmOk').textContent = '🗑️ Remove Find';
    document.getElementById('clearConfirmSheet').classList.add('visible');
}

function hideClearConfirmSheet() {
    document.getElementById('clearConfirmSheet')?.classList.remove('visible');
    pendingClearState = null;
    pendingDeselect = null;
}

async function submitClearRequest() {
    if (!pendingClearState && !pendingDeselect) return;
    if (pendingDeselect) {
        const stateName = pendingDeselect;
        hideClearConfirmSheet();
        await deselectWithBackup(stateName);
        return;
    }
    if (!pendingClearState || !currentGameRef || !currentPlayer) return;
    const stateName = pendingClearState;
    hideClearConfirmSheet();
    try {
        await currentGameRef.child(`clearRequests/${stateName}`).set({
            stateName,
            playerKey: currentPlayer.playerKey,
            displayName: currentPlayer.displayName,
            requestedAt: firebase.database.ServerValue.TIMESTAMP,
        });
        showToast(`Clear request sent to host for ${stateName}.`, 'info');
    } catch (err) {
        console.error('Clear request failed:', err);
        showToast('Could not send clear request.', 'error');
    }
}

function detectClearRequests() {
    const isHost = gameData?.hostPlayerKey === currentPlayer?.playerKey;
    if (!isHost) return;
    const currentRequests = gameData?.clearRequests || {};
    const currentKeys = Object.keys(currentRequests).filter(k => currentRequests[k]).sort().join(',');
    if (prevClearRequestKeys === null) { prevClearRequestKeys = currentKeys; return; }
    if (currentKeys === prevClearRequestKeys) return;
    const prevSet = new Set(prevClearRequestKeys.split(',').filter(Boolean));
    Object.entries(currentRequests).forEach(([stateName, req]) => {
        if (req && !prevSet.has(stateName)) showClearRequestToast(req, stateName);
    });
    prevClearRequestKeys = currentKeys;
}

function showClearRequestToast(req, stateName) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast pack';
    toast.innerHTML = `
        <div style="font-weight:700;margin-bottom:4px;">Clear Request</div>
        <div style="font-size:13px;">${req.displayName} wants to remove <strong>${stateName}</strong>.<br><span style="opacity:0.8;">They'll lose all credit permanently.</span></div>
        <div class="clear-toast-btns">
            <button class="clear-toast-approve">✓ Approve</button>
            <button class="clear-toast-deny">✕ Deny</button>
        </div>`;
    container.appendChild(toast);
    toast.querySelector('.clear-toast-approve').addEventListener('click', () => { approveClearRequest(stateName, req); toast.remove(); });
    toast.querySelector('.clear-toast-deny').addEventListener('click', () => { denyClearRequest(stateName); toast.remove(); });
}

async function approveClearRequest(stateName, req) {
    try {
        const updates = {};
        updates[`clearRequests/${stateName}`] = null;
        updates[`claimedStates/${stateName}`] = null;
        updates[`players/${req.playerKey}/states/${stateName}`] = null;
        await currentGameRef.update(updates);
        showToast(`Cleared ${stateName} for ${req.displayName}.`, 'info');
    } catch (err) {
        showToast('Failed to apply clear.', 'error');
    }
}

async function denyClearRequest(stateName) {
    try {
        await currentGameRef.child(`clearRequests/${stateName}`).remove();
    } catch (err) {
        showToast('Failed to deny request.', 'error');
    }
}

async function toggleState(stateName, currentlySelected) {
    if (!currentGameRef || !currentPlayer) return;
    if (gameData?.status === 'ended') { showToast('The game has ended — no more spotting!', 'info'); return; }
    if (!currentlySelected && (getMyEffects().freeze || 0) > Date.now()) { showToast('⏸️ You\'re frozen! Can\'t spot plates right now.', 'error'); return; }
    const playerStatesRef = currentGameRef.child(`players/${currentPlayer.playerKey}/states`);
    const stateClaimRef = currentGameRef.child(`claimedStates/${stateName}`);
    try {
        if (currentlySelected) {
            await playerStatesRef.child(stateName).remove();
        } else {
            const txResult = await stateClaimRef.transaction((existingClaim) => existingClaim || ({ state: stateName, playerKey: currentPlayer.playerKey, name: currentPlayer.name, tag: currentPlayer.tag, displayName: currentPlayer.displayName, claimedAt: Date.now() }));
            const isFirstFinder = txResult.snapshot.val()?.playerKey === currentPlayer.playerKey;
            const coinsEarned = COIN_RATES.plateFind + (isFirstFinder ? COIN_RATES.plateFirst : 0);
            const foundNearState = gameData?.settings?.gpsRarity ? (await getPlayerGpsState()) : null;
            const stateRecord = { state: stateName, foundAt: firebase.database.ServerValue.TIMESTAMP, foundBy: currentPlayer.displayName, foundByKey: currentPlayer.playerKey };
            if (foundNearState) stateRecord.foundNearState = foundNearState;
            await playerStatesRef.child(stateName).set(stateRecord);
            currentGameRef.child(`players/${currentPlayer.playerKey}`).update({ coins: firebase.database.ServerValue.increment(coinsEarned) }).catch(() => {});
            updateStreak(currentPlayer.playerKey).catch(() => {});
            showToast(`Found ${stateName}! +${coinsEarned}🪙${isFirstFinder ? ' First finder!' : ''}`, 'success');
            writeRegionCompletions();
            if (gameData?.chests?.[stateName]) claimChest(stateName);
            if (gameData?.bounties?.[stateName]) claimBounty(stateName);
            if (isFirstFinder && gameData?.luckyPlate === stateName && !gameData?.luckyPlateFound) revealLuckyPlate(stateName);
            if (isFirstFinder && gameData?.secretTargets?.[currentPlayer.playerKey] === stateName) claimSecretTarget(stateName);
            if (isFirstFinder && gameData?.suddenDeath?.active && gameData?.suddenDeath?.plate === stateName) winSuddenDeath(stateName);
        }
        await currentGameRef.update({ updatedAt: firebase.database.ServerValue.TIMESTAMP });
        lastSyncAt = Date.now();
        const myCount = currentlySelected ? stateMapToCount(getMyStatesMap()) - 1 : stateMapToCount(getMyStatesMap()) + 1;
        if (!currentlySelected && myCount === getActivePlateEntries(gameData?.settings?.plateScope).length) showToast('🏆 AMAZING! You found every available plate!', 'success');
        updateDiagnosticsPanel();
    } catch (error) {
        console.error('Error updating state:', error);
        showToast('Failed to update progress.', 'error');
    }
}

async function resetMyProgress() {
    if (!currentGameRef || !currentPlayer) return;
    if (!confirm('Reset all your spotted plates? This cannot be undone.\n\nFirst-finder records you hold will be reassigned to the next-earliest player.')) return;
    try {
        const myKey = currentPlayer.playerKey;
        const snap = await currentGameRef.once('value');
        const room = snap.val();
        if (!room) return;

        const players = normalizePlayers(room.players || {});
        const claims  = room.claimedStates || {};
        const updates = {};

        // Clear this player's plates
        updates[`players/${myKey}/states`] = {};

        // For every first-finder claim this player holds, remove or reassign
        Object.entries(claims).forEach(([stateName, claim]) => {
            if (claim.playerKey !== myKey) return;
            // Find earliest holder among other players
            let next = null;
            Object.entries(players).forEach(([pKey, pData]) => {
                if (pKey === myKey) return;
                const sd = pData.states?.[stateName];
                if (!sd) return;
                const t = typeof sd.foundAt === 'number' ? sd.foundAt : 0;
                if (!next || t < next.t) next = { t, playerKey: pKey, playerData: pData };
            });
            if (!next) {
                updates[`claimedStates/${stateName}`] = null;
            } else {
                updates[`claimedStates/${stateName}`] = {
                    state: stateName, playerKey: next.playerKey,
                    name: next.playerData.name, tag: next.playerData.tag,
                    displayName: next.playerData.displayName, claimedAt: next.t,
                };
            }
        });

        updates.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        await currentGameRef.update(updates);
        lastSyncAt = Date.now();
        showToast('Your progress has been reset.', 'info');
        updateDiagnosticsPanel();
    } catch (error) {
        console.error('Error resetting progress:', error);
        showToast('Failed to reset progress.', 'error');
    }
}

async function leaveGame() {
    if (!currentGameRef || !currentPlayer) return;
    if (!confirm('Leave this pack?')) return;
    try {
        const roomSnapshot = await currentGameRef.once('value');
        if (!roomSnapshot.exists()) { returnToSetup(true); return; }
        const room = roomSnapshot.val();
        const roomPlayers = normalizePlayers(room.players || {});
        const isHost = room.hostPlayerKey === currentPlayer.playerKey;
        await currentGameRef.child(`players/${currentPlayer.playerKey}`).remove();
        const remainingKeys = Object.keys(roomPlayers).filter((key) => key !== currentPlayer.playerKey);
        if (remainingKeys.length === 0) await currentGameRef.remove();
        else if (isHost) {
            const nextHostKey = remainingKeys[0];
            await currentGameRef.update({ hostPlayerKey: nextHostKey, updatedAt: firebase.database.ServerValue.TIMESTAMP });
            await currentGameRef.child(`players/${nextHostKey}/isHost`).set(true);
            await currentGameRef.child(`players/${nextHostKey}/role`).set('host');
        }
        showToast('Left the pack.', 'info');
        removeFromMyGames(currentGameCode);
        returnToSetup(true);
    } catch (error) {
        console.error('Error leaving game:', error);
        showToast('Failed to leave pack.', 'error');
    }
}

function returnToSetup(clearSessionToo = false) {
    // Capture code before any teardown so we can pre-fill the join input
    const codeForInput = currentGameCode || pendingGameCodeFromUrl || getSavedSession()?.gameCode || '';
    // Capture pack state before teardown so the setup screen can offer
    // "update settings for your active pack" when clearSessionToo is false.
    if (!clearSessionToo && currentGameCode && gameData) {
        window.pausedPack = { code: currentGameCode, data: JSON.parse(JSON.stringify(gameData)) };
    } else {
        window.pausedPack = null;
    }
    // If an update is waiting, reload now that we're leaving the game
    if (document.getElementById('updateBanner')) {
        const url = new URL(window.location.href);
        url.searchParams.set('_v', Date.now());
        url.searchParams.delete('joinrefresh');
        window.location.replace(url.toString());
        return;
    }
    teardownCurrentRoomListeners();
    currentGameRef = null; currentGameCode = null; window.currentGameCode = null;
    gameData = null; window.gameData = null;
    playersData = {}; prevPlayerStates = null; prevAnnouncementKeys = null; prevTauntKeys = null; prevChatKeys = null; prevReactionKeys = null; chatUnreadCount = 0; prevClearRequestKeys = null; prevRegionClearRequestKeys = null; prevPlateDisputeKeys = null; lastKnownRound = null; lastKnownLuckyFound = null; lastKnownSpeedRoundEnd = null; blackoutWon = false; pendingAchievements = new Set(); lastAchievementCheck = 0; lastKnownRivalry = undefined; lastKnownSuddenDeathWinner = null; lastRenderedStateSignature = ''; lastSyncAt = null; playerConfirmedInPack = false; regionMigrationDone = false; endGameScreenShown = false; pendingDeselect = null; if (speedRoundInterval) { clearInterval(speedRoundInterval); speedRoundInterval = null; } hideClearConfirmSheet(); closeEndGameScreen(); closeActivityFeed(); closeChatSheet(); closeQRModal(); closeTauntModal();
    if (clearSessionToo) { clearGameSession(); clearGameCodeFromUrl(); clearPendingJoinReload(); }
    gameCodeHeader.style.display = 'none'; setupSection.style.display = 'block'; gameActive.style.display = 'none';
    document.getElementById('newGameInput').value = ''; document.getElementById('joinCodeInput').value = clearSessionToo ? codeForInput : (pendingGameCodeFromUrl || '');
    document.getElementById('gameSubtitle').textContent = 'Live adventure with your pack!';
    if (currentPlayer) enableGameCards(); else disableGameCards();
    updateConnectionBadgeText(); updateDiagnosticsPanel();
    renderMyGames();
}

function copyGameCode() { if (currentGameCode) copyToClipboard(currentGameCode, 'Pack code copied! 📋'); }
function getCanonicalJoinUrl() { const url = new URL(window.location.href); if (currentGameCode) url.searchParams.set('game', currentGameCode); url.searchParams.delete('joinrefresh'); return url.toString(); }
function shareGameCode() { if (!currentGameCode) return; const joinUrl = getCanonicalJoinUrl(); const shareData = { title: 'Join my PlateQuest Pack!', text: `Join my license plate hunting pack! Use code: ${currentGameCode}`, url: joinUrl }; if (navigator.share) navigator.share(shareData).catch(() => copyToClipboard(`${shareData.text}\n${joinUrl}`, 'Join link copied! 📋')); else copyToClipboard(`${shareData.text}\n${joinUrl}`, 'Join link copied! 📋'); }
function inviteNewPlayer() { if (!currentGameCode) return; const message = `🐺 Join my PlateQuest Pack!\n\nPack Code: ${currentGameCode}\nJoin here: ${getCanonicalJoinUrl()}\n\nLet's hunt license plates together!`; if (navigator.share) navigator.share({ title: 'Join my PlateQuest Pack!', text: message }).catch(() => copyToClipboard(message, 'Invitation copied to clipboard! 📋')); else copyToClipboard(message, 'Invitation copied to clipboard! 📋'); }
function copyToClipboard(text, successMessage = 'Copied!') { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => showToast(successMessage, 'success')).catch(() => fallbackCopy(text, successMessage)); else fallbackCopy(text, successMessage); }
function fallbackCopy(text, successMessage) { const textArea = document.createElement('textarea'); textArea.value = text; document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea); showToast(successMessage, 'success'); }
function toggleDarkMode() { document.body.classList.toggle('dark'); const isDark = document.body.classList.contains('dark'); document.getElementById('darkModeBtn').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode'; localStorage.setItem(STORAGE_KEYS.darkMode, String(isDark)); }
function updateConnectionStatus(status) { const statusDot = document.getElementById('statusDot'); const statusText = document.getElementById('statusText'); if (statusDot) statusDot.className = `status-dot ${status}`; if (statusText) { if (status === 'online') statusText.textContent = 'Connected'; if (status === 'offline') statusText.textContent = 'Disconnected'; if (status === 'connecting') statusText.textContent = 'Connecting...'; } }
function showLoading(text = 'Loading...') { const loadingText = loadingOverlay.querySelector('.loading-text'); if (loadingText) loadingText.textContent = text; loadingOverlay.style.display = 'flex'; }
function hideLoading() { loadingOverlay.style.display = 'none'; }
function playChime(isFirstFind = false) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // First find: bright 4-note arpeggio C5-E5-G5-C6; regular find: gentle 2-note E5-G5
        const notes = isFirstFind ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 783.99];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.13;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
            osc.start(t);
            osc.stop(t + 0.6);
        });
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 2000);
    } catch(e) { /* AudioContext unavailable — silent fail */ }
}

// Compares current player states against the previous snapshot.
// On first call: silently absorbs existing data (no notifications).
// On subsequent calls: toasts + chimes for any newly found plates.
function detectNewFinds() {
    if (!gameData || !currentPlayer) return;
    const initOnly = prevPlayerStates === null;
    if (initOnly) prevPlayerStates = {};

    for (const [playerKey, player] of Object.entries(playersData)) {
        const currentStates = new Set(Object.keys(player.states || {}));
        const previousStates = prevPlayerStates[playerKey] || new Set();

        if (!initOnly) {
            for (const stateName of currentStates) {
                if (!previousStates.has(stateName)) {
                    const isMe = playerKey === currentPlayer.playerKey;
                    const isFirst = gameData?.claimedStates?.[stateName]?.playerKey === playerKey;
                    if (isMe) {
                        playChime(isFirst);
                    } else {
                        const msg = isFirst
                            ? `⭐ ${player.displayName} was first to find ${stateName}!`
                            : `🐾 ${player.displayName} found ${stateName}!`;
                        showToast(msg, 'pack');
                        playChime(isFirst);
                    }
                }
            }
        }

        prevPlayerStates[playerKey] = currentStates;
    }
}

function playAnnouncementChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Two-tone fanfare: G4 → D5 (ascending perfect fifth, triangle wave for richness)
        [[392, 0], [587.33, 0.22]].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const t = ctx.currentTime + delay;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
            osc.start(t);
            osc.stop(t + 0.8);
        });
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 2500);
    } catch(e) { /* AudioContext unavailable — silent fail */ }
}

function detectNewAnnouncements() {
    if (!gameData || !currentPlayer) return;
    const announcements = gameData.announcements || {};
    const currentKeys = Object.keys(announcements);
    if (prevAnnouncementKeys === null) { prevAnnouncementKeys = new Set(currentKeys); return; }
    for (const key of currentKeys) {
        if (!prevAnnouncementKeys.has(key)) {
            prevAnnouncementKeys.add(key);
            const ann = announcements[key];
            showToast(`📣 ${ann.sentBy}: ${ann.text}`, 'announcement');
            playAnnouncementChime();
        }
    }
}

function openAnnounceModal() {
    const modal = document.getElementById('announceModal');
    if (!modal) return;
    const input = document.getElementById('announceInput');
    if (input) { input.value = ''; updateAnnounceCounter(); }
    modal.classList.add('visible');
    setTimeout(() => input?.focus(), 100);
}

function closeAnnounceModal() {
    document.getElementById('announceModal')?.classList.remove('visible');
}

function updateAnnounceCounter() {
    const input = document.getElementById('announceInput');
    const counter = document.getElementById('announceCounter');
    if (input && counter) counter.textContent = `${input.value.length}/1000`;
}

async function sendAnnouncement() {
    if (!currentGameRef || !currentPlayer) return;
    const input = document.getElementById('announceInput');
    const text = input?.value.trim();
    if (!text) { input?.focus(); return; }
    const sendBtn = document.getElementById('announceSendBtn');
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; }
    try {
        await currentGameRef.child('announcements').push({
            text,
            sentBy: currentPlayer.displayName,
            sentAt: firebase.database.ServerValue.TIMESTAMP
        });
        closeAnnounceModal();
    } catch(e) {
        showToast('Failed to send announcement.', 'error');
    } finally {
        if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '📣 Send'; }
    }
}

function showToast(message, type = 'info') { const container = document.getElementById('toastContainer'); if (!container) return; const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.textContent = message; container.appendChild(toast); setTimeout(() => { if (toast.parentNode) { toast.style.animation = 'slideInToast 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); } }, 4000); }

// ── Taunts ────────────────────────────────────────────────────────────────────

function resolveTauntText(template, nameLabel) {
    if (!nameLabel) {
        return template
            .replace(/,\s*\[name\]/g, '')
            .replace(/\[name\],?\s*/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    return template.replace(/\[name\]/g, nameLabel);
}

function openTauntModal() {
    if (!currentPlayer || !playersData) return;
    const modal = document.getElementById('tauntModal');
    if (!modal) return;

    const playerList = document.getElementById('tauntPlayerList');
    const otherPlayers = Object.values(playersData).filter(p => p.playerKey !== currentPlayer.playerKey);
    playerList.innerHTML = '';

    const allChip = document.createElement('div');
    allChip.className = 'taunt-player-chip taunt-all-chip';
    allChip.dataset.key = 'all';
    allChip.innerHTML = `<input type="checkbox"><span class="taunt-player-chip-label">🐺 All Players</span>`;
    playerList.appendChild(allChip);

    otherPlayers.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'taunt-player-chip';
        chip.dataset.key = p.playerKey;
        chip.innerHTML = `<input type="checkbox"><span class="taunt-player-chip-label">${p.displayName || p.name || 'Player'}</span>`;
        playerList.appendChild(chip);
    });

    playerList.querySelectorAll('.taunt-player-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cb = chip.querySelector('input[type=checkbox]');
            if (chip.dataset.key === 'all') {
                const nowChecked = !cb.checked;
                playerList.querySelectorAll('.taunt-player-chip').forEach(c => {
                    const cCb = c.querySelector('input[type=checkbox]');
                    if (c.dataset.key === 'all') { cCb.checked = nowChecked; c.classList.toggle('selected', nowChecked); }
                    else { cCb.checked = false; c.classList.remove('selected'); }
                });
            } else {
                const allChipEl = playerList.querySelector('[data-key="all"]');
                if (allChipEl) { allChipEl.querySelector('input').checked = false; allChipEl.classList.remove('selected'); }
                cb.checked = !cb.checked;
                chip.classList.toggle('selected', cb.checked);
            }
            updateTauntSendBtn();
        });
    });

    const msgList = document.getElementById('tauntMessageList');
    msgList.innerHTML = '';
    TAUNT_LIST.forEach((taunt, i) => {
        const btn = document.createElement('button');
        btn.className = 'taunt-msg-btn';
        btn.textContent = taunt.replace(/\[name\]/g, '…');
        btn.dataset.index = i;
        btn.addEventListener('click', () => {
            msgList.querySelectorAll('.taunt-msg-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            updateTauntSendBtn();
        });
        msgList.appendChild(btn);
    });

    updateTauntSendBtn();
    modal.classList.add('visible');
}

function closeTauntModal() {
    document.getElementById('tauntModal')?.classList.remove('visible');
}

function updateTauntSendBtn() {
    const btn = document.getElementById('sendTauntBtn');
    if (!btn) return;
    const hasTarget = !!document.querySelector('#tauntPlayerList .taunt-player-chip.selected');
    const hasMsg = !!document.querySelector('#tauntMessageList .taunt-msg-btn.selected');
    btn.disabled = !(hasTarget && hasMsg);
}

async function sendTaunt() {
    if (!currentGameRef || !currentPlayer) return;
    const sendBtn = document.getElementById('sendTauntBtn');
    const selectedChips = [...document.querySelectorAll('#tauntPlayerList .taunt-player-chip.selected')];
    const isAll = selectedChips.some(c => c.dataset.key === 'all');
    const targetKeys = isAll ? ['all'] : selectedChips.map(c => c.dataset.key);
    const targetNames = isAll ? [] : selectedChips.map(c => c.querySelector('.taunt-player-chip-label')?.textContent || '?');
    const selectedMsg = document.querySelector('#tauntMessageList .taunt-msg-btn.selected');
    if (!selectedMsg || !targetKeys.length) return;
    const nameLabel = isAll ? null : targetNames.join(' & ');
    const resolvedMsg = resolveTauntText(TAUNT_LIST[parseInt(selectedMsg.dataset.index)], nameLabel);
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; }
    try {
        await currentGameRef.child('taunts').push({
            senderKey: currentPlayer.playerKey,
            senderName: currentPlayer.displayName,
            targetKeys,
            targetNames,
            message: resolvedMsg,
            sentAt: firebase.database.ServerValue.TIMESTAMP,
        });
        closeTauntModal();
        showToast('Taunt sent! 😈', 'success');
    } catch (e) {
        showToast('Failed to send taunt.', 'error');
    } finally {
        if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '😈 Send Taunt'; }
    }
}

function detectNewTaunts() {
    if (!gameData) return;
    const taunts = gameData.taunts || {};
    const currentKeys = Object.keys(taunts);
    if (prevTauntKeys === null) { prevTauntKeys = new Set(currentKeys); return; }
    currentKeys.forEach(key => {
        if (!prevTauntKeys.has(key)) {
            prevTauntKeys.add(key);
            showTauntNotification(taunts[key]);
        }
    });
}

function showTauntNotification(taunt) {
    if (!taunt) return;
    const isAll = taunt.targetKeys?.includes('all');
    const isTargeted = taunt.targetKeys?.includes(currentPlayer?.playerKey);
    const isSender = taunt.senderKey === currentPlayer?.playerKey;
    if (!isAll && !isTargeted && !isSender) return;
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast taunt';
    toast.innerHTML = `<div class="taunt-toast-from">😈 ${taunt.senderName || '?'}</div><div class="taunt-toast-msg">${taunt.message || ''}</div><button class="taunt-toast-dismiss">✕</button>`;
    toast.querySelector('.taunt-toast-dismiss').addEventListener('click', () => toast.remove());
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) { toast.style.animation = 'slideInToast 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }
    }, 8000);
}

// ── Pack Chat ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function canSeeChatMessage(msg) {
    if (!msg.targetKeys) return true; // backward compat: old messages visible to all
    if (msg.targetKeys.includes('all')) return true;
    if (msg.playerKey === currentPlayer?.playerKey) return true; // sender always sees own
    if (msg.targetKeys.includes(currentPlayer?.playerKey)) return true;
    if (gameData?.hostPlayerKey === currentPlayer?.playerKey) return true; // host sees all
    if (currentPlayer?.tag?.toLowerCase() === 'jcwolf') return true; // developer sees all
    return false;
}

function renderChatRecipients() {
    const container = document.getElementById('chatRecipients');
    if (!container || !currentPlayer || !playersData) return;
    container.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'chat-to-label';
    label.textContent = 'To:';
    container.appendChild(label);
    const otherPlayers = Object.values(playersData).filter(p => p.playerKey !== currentPlayer.playerKey);
    const allChip = document.createElement('div');
    allChip.className = 'chat-to-chip selected';
    allChip.dataset.key = 'all';
    allChip.textContent = '🐺 Everyone';
    container.appendChild(allChip);
    otherPlayers.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'chat-to-chip';
        chip.dataset.key = p.playerKey;
        chip.textContent = p.displayName || p.name || 'Player';
        container.appendChild(chip);
    });
    container.querySelectorAll('.chat-to-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            if (chip.dataset.key === 'all') {
                container.querySelectorAll('.chat-to-chip').forEach(c => c.classList.toggle('selected', c.dataset.key === 'all'));
            } else {
                container.querySelector('[data-key="all"]')?.classList.remove('selected');
                chip.classList.toggle('selected');
                if (!container.querySelector('.chat-to-chip.selected')) {
                    container.querySelector('[data-key="all"]')?.classList.add('selected');
                }
            }
        });
    });
}

function openChat() {
    try {
        if (!localStorage.getItem('platequest_chat_agreed')) {
            document.getElementById('chatPolicyModal')?.classList.add('visible');
            return;
        }
    } catch(e) {}
    _openChatSheet();
}

function _openChatSheet() {
    const sheet = document.getElementById('chatSheet');
    if (!sheet) return;
    sheet.classList.add('open');
    chatUnreadCount = 0;
    updateChatBadge();
    renderChatRecipients();
    renderChatMessages();
    setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
}

function closeChatSheet() {
    document.getElementById('chatSheet')?.classList.remove('open');
}

function updateChatBadge() {
    const badge = document.getElementById('chatUnreadBadge');
    if (!badge) return;
    if (chatUnreadCount > 0) {
        badge.textContent = chatUnreadCount > 9 ? '9+' : String(chatUnreadCount);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const entries = Object.values(gameData?.chat || {})
        .filter(msg => canSeeChatMessage(msg))
        .sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0))
        .slice(-100);
    if (!entries.length) {
        container.innerHTML = '<div class="chat-empty">No messages yet — say hi! 👋</div>';
        return;
    }
    container.innerHTML = entries.map(msg => {
        const isMe = msg.playerKey === currentPlayer?.playerKey;
        const ts = formatFoundAt(msg.sentAt) || '';
        const isPrivate = msg.targetKeys && !msg.targetKeys.includes('all');
        const sender = isMe ? '' : `<div class="chat-msg-sender">${escapeHtml(msg.displayName || '?')}</div>`;
        const time = ts ? `<div class="chat-msg-time">${isPrivate ? '🔒 private · ' : ''}${ts}</div>` : (isPrivate ? '<div class="chat-msg-time">🔒 private</div>' : '');
        return `<div class="chat-msg${isMe ? ' mine' : ''}">${sender}<div class="chat-msg-bubble">${escapeHtml(msg.message || '')}</div>${time}</div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    if (!currentGameRef || !currentPlayer) return;
    const input = document.getElementById('chatInput');
    const message = input?.value.trim();
    if (!message) return;
    // Build targetKeys from recipient chips
    const selectedChips = [...document.querySelectorAll('#chatRecipients .chat-to-chip.selected')];
    const isAll = selectedChips.some(c => c.dataset.key === 'all') || !selectedChips.length;
    let targetKeys = isAll ? ['all'] : selectedChips.map(c => c.dataset.key);
    // Always include host and developer so they see every message
    if (!isAll) {
        const hostKey = gameData?.hostPlayerKey;
        if (hostKey && !targetKeys.includes(hostKey)) targetKeys.push(hostKey);
        const devKey = Object.values(playersData).find(p => p.tag?.toLowerCase() === 'jcwolf')?.playerKey;
        if (devKey && !targetKeys.includes(devKey)) targetKeys.push(devKey);
    }
    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;
    try {
        await currentGameRef.child('chat').push({
            playerKey: currentPlayer.playerKey,
            displayName: currentPlayer.displayName,
            targetKeys,
            message,
            sentAt: firebase.database.ServerValue.TIMESTAMP,
        });
        if (input) input.value = '';
    } catch (e) {
        showToast('Failed to send message.', 'error');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        input?.focus();
    }
}

function detectNewChatMessages() {
    if (!gameData) return;
    const chat = gameData.chat || {};
    const currentKeys = Object.keys(chat);
    if (prevChatKeys === null) { prevChatKeys = new Set(currentKeys); return; }
    const newKeys = currentKeys.filter(k => !prevChatKeys.has(k));
    newKeys.forEach(k => prevChatKeys.add(k));
    if (!newKeys.length) return;
    const sheet = document.getElementById('chatSheet');
    const isOpen = sheet?.classList.contains('open');
    if (isOpen) {
        renderChatMessages();
    } else {
        newKeys.forEach(k => {
            const msg = chat[k];
            if (msg?.playerKey !== currentPlayer?.playerKey) {
                chatUnreadCount++;
                showToast(`💬 ${escapeHtml(msg.displayName || '?')}: ${escapeHtml((msg.message || '').slice(0, 60))}`, 'info');
            }
        });
        updateChatBadge();
    }
}

// ── Score Audit ───────────────────────────────────────────────────────────────

let pendingAuditResults = null;

async function openAuditModal() {
    const modal = document.getElementById('auditModal');
    if (!modal) return;
    renderRegionRecords();
    modal.classList.add('open');
    await runAuditCorrections();
}

async function runAuditCorrections() {
    const body = document.getElementById('auditBody');
    if (!body) return;
    pendingAuditResults = null;
    body.innerHTML = '<div class="audit-loading">🔍 Analyzing…</div>';

    const results = await computeAuditCorrections();
    pendingAuditResults = results;

    if (!results) {
        body.innerHTML = '<div class="audit-error">⚠️ Could not read game data. Check your connection and try again.</div>';
        return;
    }

    const { corrections, regionCorrections, coinCorrections, achievementCorrections } = results;
    const totalFixes = corrections.length + regionCorrections.length + coinCorrections.length + achievementCorrections.length;

    if (!totalFixes) {
        body.innerHTML = '<div class="audit-ok">✅ All records are accurate — no changes needed.</div>';
        showToast('✅ Audit complete — all records accurate', 'success');
        return;
    }

    body.innerHTML = '<div class="audit-loading">⚙️ Applying corrections…</div>';
    try {
        const updates = {};

        // Plate first-finder fixes
        corrections.forEach(c => {
            if (c.type === 'remove') {
                updates[`claimedStates/${c.stateName}`] = null;
            } else {
                updates[`claimedStates/${c.stateName}`] = {
                    state: c.stateName, playerKey: c.newPlayerKey,
                    name: c.newPlayerData.name, tag: c.newPlayerData.tag,
                    displayName: c.newPlayerData.displayName, claimedAt: c.foundAt,
                };
            }
        });

        // Region / corridor completion fixes
        regionCorrections.forEach(c => { updates[c.path] = c.value; });

        // Coin top-ups (only ever increase, never decrease)
        coinCorrections.forEach(c => {
            updates[`players/${c.playerKey}/coins`] = firebase.database.ServerValue.increment(c.delta);
        });

        // Achievement awards
        const now = Date.now();
        achievementCorrections.forEach(c => {
            updates[`players/${c.playerKey}/achievements/${c.achId}`] = now;
        });

        updates.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        await currentGameRef.update(updates);

        const MAX_SHOWN = 25;
        const plateItems = corrections.slice(0, MAX_SHOWN).map(c => {
            if (c.type === 'remove') return `<div class="audit-item audit-item-remove">🗑️ <strong>${c.stateName}</strong> — removed orphaned claim</div>`;
            const arrow = c.oldPlayerName ? `${c.oldPlayerName} → <strong>${c.newPlayerData.displayName}</strong>` : `<strong>${c.newPlayerData.displayName}</strong> set as first finder`;
            return `<div class="audit-item">🔖 <strong>${c.stateName}</strong>: ${arrow}</div>`;
        }).join('');
        const regionItems = regionCorrections.map(c => {
            if (c.type === 'remove') return `<div class="audit-item audit-item-remove">🗑️ <strong>${c.label}</strong> — removed invalid completion record</div>`;
            const arrow = c.oldName ? `${c.oldName} → <strong>${c.newName}</strong>` : `<strong>${c.newName}</strong> set as first completer`;
            return `<div class="audit-item">🗺️ <strong>${c.label}</strong>: ${arrow}</div>`;
        }).join('');
        const coinItems = coinCorrections.map(c =>
            `<div class="audit-item">🪙 <strong>${c.playerName}</strong>: ${c.currentCoins} → ${c.expectedCoins} coins (+${c.delta})</div>`
        ).join('');
        const achItems = achievementCorrections.map(c =>
            `<div class="audit-item">🏆 <strong>${c.playerName}</strong>: ${c.achIcon} ${c.achName} awarded</div>`
        ).join('');
        const overflow = corrections.length > MAX_SHOWN ? `<div class="audit-more">…and ${corrections.length - MAX_SHOWN} more plate fixes</div>` : '';

        const parts = [];
        if (corrections.length) parts.push(`${corrections.length} plate record${corrections.length === 1 ? '' : 's'}`);
        if (regionCorrections.length) parts.push(`${regionCorrections.length} region record${regionCorrections.length === 1 ? '' : 's'}`);
        if (coinCorrections.length) parts.push(`${coinCorrections.length} coin balance${coinCorrections.length === 1 ? '' : 's'}`);
        if (achievementCorrections.length) parts.push(`${achievementCorrections.length} achievement${achievementCorrections.length === 1 ? '' : 's'}`);
        const summary = parts.join(' · ');

        body.innerHTML = `
            <div class="audit-ok">✅ Fixed ${summary}.</div>
            <div class="audit-list" style="margin-top:10px">${plateItems}${overflow}${regionItems}${coinItems}${achItems}</div>`;
        showToast(`✅ Audit fixed ${summary}`, 'success');
        renderRegionRecords();
    } catch (err) {
        console.error('Audit auto-apply failed:', err);
        body.innerHTML = '<div class="audit-error">⚠️ Could not apply corrections. Check your connection and try again.</div>';
    }
}

// ── Region Completion Dispute Flow ────────────────────────────────────────────

async function requestRegionClear(type, key, label) {
    if (!currentGameRef || !currentPlayer) return;
    const reqPath = type === 'corridor' ? 'regionClearRequests/corridor' : `regionClearRequests/${type}/${key}`;
    const existing = type === 'corridor'
        ? gameData?.regionClearRequests?.corridor
        : gameData?.regionClearRequests?.[type]?.[key];
    if (existing) { showToast('Dispute already pending — waiting for host.', 'info'); return; }
    const firstRecord = type === 'corridor' ? gameData?.completedCorridor
        : type === 'regions' ? gameData?.completedRegions?.[key]
        : gameData?.completedSubRegions?.[key];
    const currentFirstName = firstRecord?.displayName || firstRecord?.name || 'another player';
    if (!confirm(`Dispute "${label}"?\n\nCurrently credited to ${currentFirstName}. If the host approves, the record is cleared and re-evaluated — they have 7 days to undo.`)) return;
    try {
        await currentGameRef.child(reqPath).set({ playerKey: currentPlayer.playerKey, displayName: currentPlayer.displayName, label, currentFirstName, requestedAt: Date.now() });
        showToast('Dispute sent to host.', 'info');
    } catch (err) { showToast('Could not send dispute.', 'error'); }
}

function detectRegionClearRequests() {
    const isHost = gameData?.hostPlayerKey === currentPlayer?.playerKey;
    if (!isHost) return;
    const reqs = gameData?.regionClearRequests || {};
    const allFlat = {};
    Object.entries(reqs.regions || {}).forEach(([k, r]) => { allFlat[`regions/${k}`] = r; });
    Object.entries(reqs.subRegions || {}).forEach(([k, r]) => { allFlat[`subRegions/${k}`] = r; });
    if (reqs.corridor && typeof reqs.corridor === 'object') allFlat['corridor'] = reqs.corridor;
    const currentKeys = Object.keys(allFlat).sort().join(',');
    if (prevRegionClearRequestKeys === null) { prevRegionClearRequestKeys = currentKeys; return; }
    if (currentKeys === prevRegionClearRequestKeys) return;
    const prevSet = new Set(prevRegionClearRequestKeys.split(',').filter(Boolean));
    Object.keys(allFlat).filter(k => !prevSet.has(k)).forEach(flatKey => showRegionClearRequestToast(flatKey, allFlat[flatKey]));
    prevRegionClearRequestKeys = currentKeys;
}

function showRegionClearRequestToast(flatKey, req) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    const parts = flatKey.split('/');
    const type = parts[0], key = parts[1] || '';
    const toast = document.createElement('div');
    toast.className = 'toast pack';
    toast.innerHTML = `
        <div style="font-weight:700;margin-bottom:4px;">Region Dispute</div>
        <div style="font-size:13px;"><strong>${req.displayName}</strong> claims first-finder for <strong>${req.label}</strong>.<br>Currently credited to <strong>${req.currentFirstName || '?'}</strong>.<br><span style="opacity:0.75;">Approve to clear — 7-day undo.</span></div>
        <div class="clear-toast-btns">
            <button class="clear-toast-approve">✓ Approve</button>
            <button class="clear-toast-deny">✕ Deny</button>
        </div>`;
    container.appendChild(toast);
    toast.querySelector('.clear-toast-approve').addEventListener('click', () => { approveRegionClearRequest(type, key, req); toast.remove(); });
    toast.querySelector('.clear-toast-deny').addEventListener('click', () => { denyRegionClearRequest(type, key); toast.remove(); });
}

async function _clearRegionRecordWithBackup(type, key, label) {
    const livePath = type === 'corridor' ? 'completedCorridor'
        : type === 'regions' ? `completedRegions/${key}` : `completedSubRegions/${key}`;
    const backupPath = type === 'corridor' ? 'regionCompletionBackups/corridor'
        : `regionCompletionBackups/${type}/${key}`;
    const liveSnap = await currentGameRef.child(livePath).once('value');
    const liveRecord = liveSnap.val();
    const now = Date.now();
    const updates = {};
    if (liveRecord) updates[backupPath] = { ...liveRecord, label, clearedAt: now, expiresAt: now + 7 * 24 * 60 * 60 * 1000 };
    updates[livePath] = null;
    updates.updatedAt = firebase.database.ServerValue.TIMESTAMP;
    await currentGameRef.update(updates);
}

async function approveRegionClearRequest(type, key, req) {
    if (!currentGameRef) return;
    const reqPath = type === 'corridor' ? 'regionClearRequests/corridor' : `regionClearRequests/${type}/${key}`;
    try {
        await _clearRegionRecordWithBackup(type, key, req.label);
        await currentGameRef.child(reqPath).set(null);
        showToast(`${req.label} cleared. 7 days to undo.`, 'info');
    } catch (err) { console.error('approveRegionClearRequest failed:', err); showToast('Failed to approve dispute.', 'error'); }
}

async function denyRegionClearRequest(type, key) {
    if (!currentGameRef) return;
    const reqPath = type === 'corridor' ? 'regionClearRequests/corridor' : `regionClearRequests/${type}/${key}`;
    try { await currentGameRef.child(reqPath).set(null); }
    catch (err) { showToast('Failed to deny request.', 'error'); }
}

// ── Plate First-Finder Dispute Flow ──────────────────────────────────────────

async function requestPlateDispute(stateName) {
    if (!currentGameRef || !currentPlayer) return;
    const existing = gameData?.plateDisputeRequests?.[stateName];
    if (existing) { showToast('Dispute already pending — waiting for host.', 'info'); return; }
    const currentFirst = gameData?.claimedStates?.[stateName];
    if (!currentFirst) { showToast('No first-finder record for this plate.', 'info'); return; }
    const myFoundAt = playersData[currentPlayer.playerKey]?.states?.[stateName]?.foundAt || 0;
    const myTime = formatFoundAt(myFoundAt) || 'unknown';
    const theirName = currentFirst.displayName || currentFirst.name || 'Unknown';
    const theirTime = formatFoundAt(currentFirst.claimedAt) || 'unknown';
    if (!confirm(`Dispute first-finder for ${stateName}?\n\nYour time: ${myTime}\nCurrently credited to: ${theirName} at ${theirTime}\n\nThe host will review and can reassign.`)) return;
    try {
        await currentGameRef.child(`plateDisputeRequests/${stateName}`).set({
            stateName,
            playerKey: currentPlayer.playerKey,
            displayName: currentPlayer.displayName,
            playerFoundAt: myFoundAt,
            currentFirstKey: currentFirst.playerKey,
            currentFirstName: theirName,
            currentFirstTime: currentFirst.claimedAt || 0,
            requestedAt: Date.now(),
        });
        showToast('Dispute sent to host.', 'info');
    } catch (err) { showToast('Could not send dispute.', 'error'); }
}

function detectPlateDisputeRequests() {
    const isHost = gameData?.hostPlayerKey === currentPlayer?.playerKey;
    if (!isHost) return;
    const reqs = gameData?.plateDisputeRequests || {};
    const currentKeys = Object.keys(reqs).sort().join(',');
    if (prevPlateDisputeKeys === null) { prevPlateDisputeKeys = currentKeys; return; }
    if (currentKeys === prevPlateDisputeKeys) return;
    const prevSet = new Set(prevPlateDisputeKeys.split(',').filter(Boolean));
    Object.keys(reqs).filter(k => !prevSet.has(k)).forEach(stateName => showPlateDisputeToast(stateName, reqs[stateName]));
    prevPlateDisputeKeys = currentKeys;
}

function showPlateDisputeToast(stateName, req) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    const myTime = formatFoundAt(req.playerFoundAt) || '?';
    const theirTime = formatFoundAt(req.currentFirstTime) || '?';
    const toast = document.createElement('div');
    toast.className = 'toast pack';
    toast.innerHTML = `
        <div style="font-weight:700;margin-bottom:4px;">Plate Dispute — ${stateName}</div>
        <div style="font-size:13px;"><strong>${req.displayName}</strong>: ${myTime}<br>vs <strong>${req.currentFirstName}</strong>: ${theirTime}</div>
        <div class="clear-toast-btns">
            <button class="clear-toast-approve">✓ Reassign to ${req.displayName.split(' ')[0]}</button>
            <button class="clear-toast-deny">✕ Deny</button>
        </div>`;
    container.appendChild(toast);
    toast.querySelector('.clear-toast-approve').addEventListener('click', () => { approvePlateDispute(stateName, req); toast.remove(); });
    toast.querySelector('.clear-toast-deny').addEventListener('click', () => { denyPlateDispute(stateName); toast.remove(); });
}

async function approvePlateDispute(stateName, req) {
    if (!currentGameRef) return;
    try {
        const playerData = playersData[req.playerKey];
        const updates = {};
        updates[`claimedStates/${stateName}`] = {
            state: stateName,
            playerKey: req.playerKey,
            name: playerData?.name || req.displayName,
            tag: playerData?.tag || '',
            displayName: req.displayName,
            claimedAt: req.playerFoundAt || Date.now(),
        };
        updates[`plateDisputeRequests/${stateName}`] = null;
        updates.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        await currentGameRef.update(updates);
        showToast(`${stateName} first-finder reassigned to ${req.displayName}.`, 'success');
    } catch (err) { console.error('approvePlateDispute failed:', err); showToast('Failed to approve dispute.', 'error'); }
}

async function denyPlateDispute(stateName) {
    if (!currentGameRef) return;
    try { await currentGameRef.child(`plateDisputeRequests/${stateName}`).set(null); }
    catch (err) { showToast('Failed to deny dispute.', 'error'); }
}

async function undoRegionClear(type, key) {
    if (!currentGameRef) return;
    const backupPath = type === 'corridor' ? 'regionCompletionBackups/corridor' : `regionCompletionBackups/${type}/${key}`;
    const livePath = type === 'corridor' ? 'completedCorridor'
        : type === 'regions' ? `completedRegions/${key}` : `completedSubRegions/${key}`;
    try {
        const snap = await currentGameRef.child(backupPath).once('value');
        const backup = snap.val();
        if (!backup) { showToast('Backup not found.', 'error'); renderRegionRecords(); return; }
        const updates = {};
        updates[livePath] = { playerKey: backup.playerKey, displayName: backup.displayName, completedAt: backup.completedAt };
        updates[backupPath] = null;
        updates.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        await currentGameRef.update(updates);
        showToast(`${backup.label || key} restored.`, 'success');
    } catch (err) { console.error('undoRegionClear failed:', err); showToast('Failed to undo.', 'error'); }
}

async function purgeAllRegionBackups() {
    if (!currentGameRef) return;
    if (!confirm('Permanently delete all undo records? This cannot be reversed.')) return;
    try {
        await currentGameRef.child('regionCompletionBackups').set(null);
        showToast('All undo records purged.', 'info');
    } catch (err) { showToast('Failed to purge records.', 'error'); }
}

function autoCleanRegionBackups() {
    if (!currentGameRef || !gameData?.regionCompletionBackups) return;
    const now = Date.now();
    const backups = gameData.regionCompletionBackups;
    const updates = {};
    ['regions', 'subRegions'].forEach(type => {
        Object.entries(backups[type] || {}).forEach(([key, rec]) => {
            if (rec?.expiresAt && now > rec.expiresAt) updates[`regionCompletionBackups/${type}/${key}`] = null;
        });
    });
    if (backups.corridor?.expiresAt && now > backups.corridor.expiresAt) updates['regionCompletionBackups/corridor'] = null;
    if (Object.keys(updates).length) currentGameRef.update(updates).catch(err => console.error('autoCleanRegionBackups failed:', err));
}

async function deselectWithBackup(stateName) {
    if (!currentGameRef || !currentPlayer) return;
    try {
        const stateData = playersData[currentPlayer.playerKey]?.states?.[stateName];
        const isFirst = gameData?.claimedStates?.[stateName]?.playerKey === currentPlayer.playerKey;
        const now = Date.now();
        const safeKey = stateName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const backup = {
            stateName,
            foundAt: stateData?.foundAt || now,
            foundBy: currentPlayer.displayName,
            foundByKey: currentPlayer.playerKey,
            wasFirst: isFirst,
            clearedAt: now,
            expiresAt: now + 7 * 24 * 60 * 60 * 1000,
        };
        if (stateData?.foundNearState) backup.foundNearState = stateData.foundNearState;
        const updates = {};
        updates[`plateBackups/${currentPlayer.playerKey}/${safeKey}`] = backup;
        updates[`players/${currentPlayer.playerKey}/states/${stateName}`] = null;
        updates.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        await currentGameRef.update(updates);
        showToast(`Removed ${stateName}.`, 'info');
        writeRegionCompletions();
        lastSyncAt = Date.now();
        updateDiagnosticsPanel();
    } catch (err) {
        console.error('deselectWithBackup failed:', err);
        showToast('Failed to remove plate.', 'error');
    }
}

function autoCleanPlateBackups() {
    if (!currentGameRef || !gameData?.plateBackups) return;
    const now = Date.now();
    const updates = {};
    Object.entries(gameData.plateBackups).forEach(([playerKey, states]) => {
        Object.entries(states || {}).forEach(([safeKey, rec]) => {
            if (rec?.expiresAt && now > rec.expiresAt) updates[`plateBackups/${playerKey}/${safeKey}`] = null;
        });
    });
    if (Object.keys(updates).length) currentGameRef.update(updates).catch(() => {});
}

function updateAuditBadge() {
    const badge = document.getElementById('auditBadge');
    if (!badge) return;
    const b = gameData?.regionCompletionBackups;
    const hasBackups = b && (Object.keys(b.regions || {}).length || Object.keys(b.subRegions || {}).length || b.corridor);
    badge.style.display = hasBackups ? 'block' : 'none';
}

function renderRegionRecords() {
    const container = document.getElementById('regionRecordsBody');
    if (!container) return;

    const subRecs = gameData?.completedSubRegions || {};
    const regRecs = gameData?.completedRegions || {};
    const corRec  = gameData?.completedCorridor;
    const bk      = gameData?.regionCompletionBackups || {};

    const liveItems = [];
    Object.entries(subRecs).forEach(([key, rec]) => {
        liveItems.push({ type: 'subRegions', key, icon: '🗺️', label: SUB_REGIONS[key]?.label || key, winner: rec.displayName });
    });
    Object.entries(regRecs).forEach(([key, rec]) => {
        liveItems.push({ type: 'regions', key, icon: '🏛️', label: PRIMARY_REGIONS[key]?.label || key, winner: rec.displayName });
    });
    if (corRec) liveItems.push({ type: 'corridor', key: '', icon: '🚗', label: 'Travel Corridor', winner: corRec.displayName });

    const backupItems = [];
    const now = Date.now();
    ['regions', 'subRegions'].forEach(type => {
        Object.entries(bk[type] || {}).forEach(([key, rec]) => {
            if (!rec?.expiresAt || now <= rec.expiresAt) {
                const daysLeft = rec?.expiresAt ? Math.max(1, Math.ceil((rec.expiresAt - now) / 86400000)) : '?';
                backupItems.push({ type, key, label: rec.label || key, winner: rec.displayName, daysLeft });
            }
        });
    });
    if (bk.corridor && (!bk.corridor.expiresAt || now <= bk.corridor.expiresAt)) {
        const daysLeft = bk.corridor.expiresAt ? Math.max(1, Math.ceil((bk.corridor.expiresAt - now) / 86400000)) : '?';
        backupItems.push({ type: 'corridor', key: '', label: bk.corridor.label || 'Travel Corridor', winner: bk.corridor.displayName, daysLeft });
    }

    if (!liveItems.length && !backupItems.length) {
        container.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:13px;padding:8px 0">No completion records yet.</div>';
        return;
    }

    let html = '<div class="region-records-section">';

    if (liveItems.length) {
        html += `<div class="region-records-title">Active Records</div>`;
        html += liveItems.map(({ type, key, icon, label, winner }) =>
            `<div class="region-record-item">
                <span>${icon} ${label} <span class="region-record-winner">• ${winner}</span></span>
                <button class="btn-clear-record" onclick="clearRegionRecord('${type}','${key}','${label.replace(/'/g, "\\'")}')">Clear</button>
            </div>`
        ).join('');
    }

    if (backupItems.length) {
        html += `<div class="region-records-title" style="margin-top:12px">Pending Undos</div>`;
        html += backupItems.map(({ type, key, label, winner, daysLeft }) =>
            `<div class="region-record-item">
                <span>↩️ ${label} <span class="region-record-winner">• ${winner} • ${daysLeft}d left</span></span>
                <button class="btn-undo-record" onclick="undoRegionClear('${type}','${key}')">Undo</button>
            </div>`
        ).join('');
        html += `<div style="margin-top:8px;text-align:right"><button class="btn-clear-record" onclick="purgeAllRegionBackups()">Purge All Undos</button></div>`;
    }

    html += `<div class="audit-note" style="margin-top:8px">Clearing creates a 7-day undo window. Players can dispute their own first-completer records from their score panel.</div>`;
    html += '</div>';
    container.innerHTML = html;
}

async function clearRegionRecord(type, key, label) {
    if (!currentGameRef) return;
    if (!confirm(`Clear "${label}" record? A 7-day undo window will be saved in case this was a mistake.`)) return;
    try {
        await _clearRegionRecordWithBackup(type, key, label);
        showToast(`${label} cleared. 7-day undo available in Score Audit.`, 'info');
        renderRegionRecords();
        updateAuditBadge();
    } catch (err) {
        console.error('clearRegionRecord failed:', err);
        showToast('Failed to clear record.', 'error');
    }
}

function closeAuditModal() {
    document.getElementById('auditModal')?.classList.remove('open');
    pendingAuditResults = null;
}

async function computeAuditCorrections() {
    if (!currentGameRef) return null;
    try {
        const snapshot = await currentGameRef.once('value');
        const room = snapshot.val();
        if (!room) return null;
        const players = normalizePlayers(room.players || {});
        const currentClaims = room.claimedStates || {};

        // ── Plate first-finder corrections ───────────────────────────────────────
        const earliestByState = {};

        // Seed with current claimers using their original claimedAt timestamp
        Object.entries(currentClaims).forEach(([stateName, claimData]) => {
            const playerKey = claimData.playerKey;
            const playerData = players[playerKey];
            if (!playerData) return;
            if (!playerData.states?.[stateName]) return; // player reset — don't seed from them
            const t = typeof claimData.claimedAt === 'number' ? claimData.claimedAt : 0;
            earliestByState[stateName] = { playerKey, playerData, foundAt: t };
        });

        // Override only if another player's foundAt is strictly earlier
        Object.entries(players).forEach(([playerKey, playerData]) => {
            Object.entries(playerData.states || {}).forEach(([stateName, stateData]) => {
                const t = typeof stateData.foundAt === 'number' ? stateData.foundAt : 0;
                if (!earliestByState[stateName]) {
                    earliestByState[stateName] = { playerKey, playerData, foundAt: t };
                } else if (playerKey !== earliestByState[stateName].playerKey && t < earliestByState[stateName].foundAt) {
                    earliestByState[stateName] = { playerKey, playerData, foundAt: t };
                }
            });
        });

        const corrections = [];
        Object.entries(earliestByState).forEach(([stateName, { playerKey, playerData, foundAt }]) => {
            const existing = currentClaims[stateName];
            if (!existing || existing.playerKey !== playerKey) {
                corrections.push({ type: 'correct', stateName, newPlayerKey: playerKey, newPlayerData: playerData, foundAt,
                    oldPlayerName: existing ? (players[existing.playerKey]?.displayName || existing.displayName || existing.playerKey) : null });
            }
        });
        Object.keys(currentClaims).forEach(stateName => {
            if (!earliestByState[stateName]) {
                corrections.push({ type: 'remove', stateName,
                    oldPlayerName: players[currentClaims[stateName]?.playerKey]?.displayName || currentClaims[stateName]?.displayName || '?' });
            }
        });

        // ── Region completion corrections ─────────────────────────────────────────
        // Find the player who completed a set of states first (by max foundAt across those states).
        const findEarliestCompleter = (stateNames) => {
            let best = null;
            Object.entries(players).forEach(([playerKey, playerData]) => {
                const pStates = playerData.states || {};
                if (!stateNames.every(s => pStates[s])) return;
                const t = getCompletionTime(pStates, stateNames);
                if (t !== null && (best === null || t < best.t)) {
                    best = { playerKey, displayName: playerData.displayName, t };
                }
            });
            return best;
        };

        const regionCorrections = [];

        Object.entries(SUB_REGIONS).forEach(([key, region]) => {
            const best = findEarliestCompleter(region.states);
            const existing = room.completedSubRegions?.[key];
            if (!best && existing) {
                regionCorrections.push({ path: `completedSubRegions/${key}`, value: null, label: region.label, type: 'remove' });
            } else if (best && (!existing || existing.playerKey !== best.playerKey)) {
                regionCorrections.push({ path: `completedSubRegions/${key}`, label: region.label, type: 'correct',
                    oldName: existing ? (players[existing.playerKey]?.displayName || existing.displayName) : null,
                    newName: best.displayName,
                    value: { playerKey: best.playerKey, displayName: best.displayName, completedAt: best.t } });
            }
        });

        Object.entries(REGION_STATES).forEach(([key, states]) => {
            const best = findEarliestCompleter(states);
            const existing = room.completedRegions?.[key];
            const label = PRIMARY_REGIONS[key]?.label || key;
            if (!best && existing) {
                regionCorrections.push({ path: `completedRegions/${key}`, value: null, label, type: 'remove' });
            } else if (best && (!existing || existing.playerKey !== best.playerKey)) {
                regionCorrections.push({ path: `completedRegions/${key}`, label, type: 'correct',
                    oldName: existing ? (players[existing.playerKey]?.displayName || existing.displayName) : null,
                    newName: best.displayName,
                    value: { playerKey: best.playerKey, displayName: best.displayName, completedAt: best.t } });
            }
        });

        const corridorStates = room.settings?.playAreaStates || [];
        if (corridorStates.length > 0) {
            const best = findEarliestCompleter(corridorStates);
            const existing = room.completedCorridor;
            if (!best && existing) {
                regionCorrections.push({ path: 'completedCorridor', value: null, label: 'Corridor', type: 'remove' });
            } else if (best && (!existing || existing.playerKey !== best.playerKey)) {
                regionCorrections.push({ path: 'completedCorridor', label: 'Corridor', type: 'correct',
                    oldName: existing ? (players[existing.playerKey]?.displayName || existing.displayName) : null,
                    newName: best.displayName,
                    value: { playerKey: best.playerKey, displayName: best.displayName, completedAt: best.t } });
            }
        }

        // ── Coin corrections ─────────────────────────────────────────────────────
        const coinCorrections = [];
        Object.entries(players).forEach(([playerKey, playerData]) => {
            const foundSet = new Set(Object.keys(playerData.states || {}));
            const foundCount = foundSet.size;
            const firstCount = Array.from(foundSet).filter(name => currentClaims[name]?.playerKey === playerKey).length;

            let expected = foundCount * COIN_RATES.plateFind + firstCount * COIN_RATES.plateFirst;
            Object.keys(room.completedSubRegions || {}).forEach(key => {
                if (room.completedSubRegions[key]?.playerKey === playerKey) expected += COIN_RATES.subRegionFirst;
            });
            Object.keys(room.completedRegions || {}).forEach(key => {
                if (room.completedRegions[key]?.playerKey === playerKey) expected += COIN_RATES.primaryRegionFirst;
            });
            if (room.completedCorridor?.playerKey === playerKey) expected += COIN_RATES.corridorFirst;

            const actual = playerData.coins || 0;
            if (actual < expected) {
                coinCorrections.push({ playerKey, playerName: playerData.displayName || playerKey, currentCoins: actual, expectedCoins: expected, delta: expected - actual });
            }
        });

        // ── Achievement corrections ───────────────────────────────────────────────
        const achievementCorrections = [];
        const totalPlatesForAudit = getActivePlateEntries(room.settings?.plateScope).length;
        Object.entries(players).forEach(([playerKey, playerData]) => {
            const existing = playerData.achievements || {};
            const foundSet = new Set(Object.keys(playerData.states || {}));
            const foundCount = foundSet.size;
            const firstCount = Array.from(foundSet).filter(name => currentClaims[name]?.playerKey === playerKey).length;
            const completedRegions = Object.entries(REGION_STATES)
                .filter(([, states]) => states.every(s => foundSet.has(s))).map(([key]) => key);
            const corridorStates = room.settings?.playAreaStates || [];
            const corridorComplete = corridorStates.length > 0 && corridorStates.every(s => foundSet.has(s));
            const stats = { foundSet, foundCount, firstCount, completedRegions, corridorComplete };

            ACHIEVEMENTS.forEach(ach => {
                if (!ach.check || existing[ach.id]) return;
                try {
                    const passes = ach.id === 'lucky'
                        ? room.luckyPlateFound?.foundByKey === playerKey
                        : ach.check(stats, playerData, totalPlatesForAudit);
                    if (passes) achievementCorrections.push({ playerKey, playerName: playerData.displayName || playerKey, achId: ach.id, achName: ach.name, achIcon: ach.icon });
                } catch (e) {}
            });
        });

        return { corrections, regionCorrections, coinCorrections, achievementCorrections, players };
    } catch (err) {
        console.error('Audit failed:', err);
        return null;
    }
}

// ── Region Completion Records ─────────────────────────────────────────────────

async function writeRegionCompletions() {
    if (!currentGameRef || !currentPlayer) return;
    const player = playersData[currentPlayer.playerKey];
    if (!player) return;
    const foundSet = new Set(Object.keys(player.states || {}));
    const now = Date.now();
    let coinsEarned = 0;

    const subWrites = [];
    Object.entries(SUB_REGIONS).forEach(([key, region]) => {
        if (!region.states.every(s => foundSet.has(s))) return;
        subWrites.push(currentGameRef.child(`completedSubRegions/${key}`).transaction(existing => {
            if (existing) return undefined;
            return { playerKey: currentPlayer.playerKey, displayName: currentPlayer.displayName, completedAt: now };
        }));
    });

    const regWrites = [];
    Object.entries(REGION_STATES).forEach(([key, states]) => {
        if (!states.every(s => foundSet.has(s))) return;
        regWrites.push(currentGameRef.child(`completedRegions/${key}`).transaction(existing => {
            if (existing) return undefined;
            return { playerKey: currentPlayer.playerKey, displayName: currentPlayer.displayName, completedAt: now };
        }));
    });

    const corridorStates = gameData?.settings?.playAreaStates || [];
    let corridorWrite = null;
    if (corridorStates.length > 0 && corridorStates.every(s => foundSet.has(s))) {
        corridorWrite = currentGameRef.child('completedCorridor').transaction(existing => {
            if (existing) return undefined;
            return { playerKey: currentPlayer.playerKey, displayName: currentPlayer.displayName, completedAt: now };
        });
    }

    try {
        const [subResults, regResults, corridorResult] = await Promise.all([
            Promise.all(subWrites),
            Promise.all(regWrites),
            corridorWrite || Promise.resolve(null),
        ]);
        subResults.forEach(r => { if (r?.committed) coinsEarned += COIN_RATES.subRegionFirst; });
        regResults.forEach(r => { if (r?.committed) coinsEarned += COIN_RATES.primaryRegionFirst; });
        if (corridorResult?.committed) coinsEarned += COIN_RATES.corridorFirst;
        if (coinsEarned > 0) {
            currentGameRef.child(`players/${currentPlayer.playerKey}`).update({ coins: firebase.database.ServerValue.increment(coinsEarned) }).catch(() => {});
            showToast(`Region bonus! +${coinsEarned}🪙`, 'success');
        }
    } catch (err) { console.error('writeRegionCompletions failed:', err); }
}

async function maybeRunRegionMigration() {
    if (regionMigrationDone || !currentGameRef || !currentPlayer) return;
    regionMigrationDone = true;
    await migrateRegionCompletions();
}

async function migrateRegionCompletions() {
    try {
        const snapshot = await currentGameRef.once('value');
        const room = snapshot.val();
        if (!room) return;
        const players = normalizePlayers(room.players || {});
        const writes = [];

        const findEarliest = (stateNames, existing) => {
            if (existing) return null; // already recorded — skip
            let best = null;
            Object.entries(players).forEach(([playerKey, playerData]) => {
                const pStates = playerData.states || {};
                if (!stateNames.every(s => pStates[s])) return;
                const t = getCompletionTime(pStates, stateNames);
                if (t !== null && (best === null || t < best.t)) {
                    best = { playerKey, displayName: playerData.displayName, t };
                }
            });
            return best;
        };

        Object.entries(SUB_REGIONS).forEach(([key, region]) => {
            const best = findEarliest(region.states, room.completedSubRegions?.[key]);
            if (!best) return;
            writes.push(currentGameRef.child(`completedSubRegions/${key}`).transaction(existing => {
                if (existing) return undefined;
                return { playerKey: best.playerKey, displayName: best.displayName, completedAt: best.t };
            }));
        });

        Object.entries(REGION_STATES).forEach(([key, states]) => {
            const best = findEarliest(states, room.completedRegions?.[key]);
            if (!best) return;
            writes.push(currentGameRef.child(`completedRegions/${key}`).transaction(existing => {
                if (existing) return undefined;
                return { playerKey: best.playerKey, displayName: best.displayName, completedAt: best.t };
            }));
        });

        const corridorStates = room.settings?.playAreaStates || [];
        if (corridorStates.length > 0) {
            const best = findEarliest(corridorStates, room.completedCorridor);
            if (best) {
                writes.push(currentGameRef.child('completedCorridor').transaction(existing => {
                    if (existing) return undefined;
                    return { playerKey: best.playerKey, displayName: best.displayName, completedAt: best.t };
                }));
            }
        }

        await Promise.all(writes);
    } catch (err) {
        console.error('migrateRegionCompletions failed:', err);
    }
}

// ── Scoring Engine ────────────────────────────────────────────────────────────

function getCompletionTime(playerStates, stateNames) {
    // Returns the unix timestamp when this player completed all states in the group,
    // or null if any state is missing. Used to determine who finished first.
    for (const s of stateNames) { if (!playerStates[s]) return null; }
    return Math.max(...stateNames.map(s => playerStates[s]?.foundAt || 0));
}

function computeRegionBonus(stateNames, corridor, multiplier, floor) {
    const raritySum = stateNames.reduce((total, name) => {
        return total + RARITY_CONFIG[computeRarityForState(name, corridor)].points;
    }, 0);
    return Math.round(Math.max(floor, raritySum * multiplier) / 5) * 5;
}

function computePlayerStats(playerKey) {
    const player = playersData[playerKey];
    if (!player) return null;

    const foundSet = new Set(Object.keys(player.states || {}));
    const foundCount = foundSet.size;
    const firstCount = Array.from(foundSet).filter(
        name => gameData?.claimedStates?.[name]?.playerKey === playerKey
    ).length;

    // Base plate score — rarity is route-aware (BFS from corridor, or GPS-based per-plate)
    const corridor = gameData?.settings?.playAreaStates || [];
    const useGps = gameData?.settings?.gpsRarity;
    let score = 0;
    const luckyStateName = gameData?.luckyPlateFound?.stateName;
    foundSet.forEach(name => {
        const stateData = player.states?.[name];
        const effectiveCorridor = (useGps && stateData?.foundNearState) ? [stateData.foundNearState] : corridor;
        const tier = computeRarityForState(name, effectiveCorridor);
        const pts = RARITY_CONFIG[tier].points;
        const isFirst = gameData?.claimedStates?.[name]?.playerKey === playerKey;
        const multiplier = (isFirst && name === luckyStateName) ? 3 : 1;
        score += isFirst ? pts * multiplier : pts / 2;
    });

    // Sub-region completions — rarity-weighted: max(60, raritySum × 1.5), first/later split
    const completedSubs = Object.entries(SUB_REGIONS)
        .filter(([, region]) => region.states.every(s => foundSet.has(s)))
        .map(([key]) => key);

    const completedSubBonuses = [];
    completedSubs.forEach(key => {
        const record = gameData?.completedSubRegions?.[key];
        const isFirst = record ? record.playerKey === playerKey : true;
        const firstBonus = computeRegionBonus(SUB_REGIONS[key].states, corridor, 1.5, 60);
        const awarded = isFirst ? firstBonus : Math.ceil(firstBonus / 2);
        score += awarded;
        completedSubBonuses.push({ key, label: SUB_REGIONS[key].label, bonus: awarded, isFirst, firstBonus });
    });

    // Primary region completions — rarity-weighted: max(100, raritySum × 1.5), first/later split
    const completedRegions = Object.entries(REGION_STATES)
        .filter(([, states]) => states.every(s => foundSet.has(s)))
        .map(([key]) => key);

    const completedRegionBonuses = [];
    completedRegions.forEach(key => {
        const record = gameData?.completedRegions?.[key];
        const isFirst = record ? record.playerKey === playerKey : true;
        const firstBonus = computeRegionBonus(REGION_STATES[key], corridor, 1.5, 100);
        const awarded = isFirst ? firstBonus : Math.ceil(firstBonus / 2);
        score += awarded;
        completedRegionBonuses.push({ key, label: PRIMARY_REGIONS[key]?.label || key, bonus: awarded, isFirst, firstBonus });
    });

    // Travel corridor completion — flat 150/75 (corridor states are always Common by definition)
    const corridorStates = gameData?.settings?.playAreaStates || [];
    const corridorComplete = corridorStates.length > 0 && corridorStates.every(s => foundSet.has(s));
    let corridorBonus = 0;
    if (corridorComplete) {
        const record = gameData?.completedCorridor;
        const isFirst = record ? record.playerKey === playerKey : true;
        corridorBonus = isFirst ? 150 : 75;
        score += corridorBonus;
    }

    return { foundSet, foundCount, firstCount, score, completedSubs, completedRegions, corridorComplete, completedSubBonuses, completedRegionBonuses, corridorBonus };
}

function getPlayerBadges(playerKey) {
    const stats = computePlayerStats(playerKey);
    if (!stats) return [];
    return BADGE_DEFS.filter(b => b.test(stats));
}

const SUB_BADGE_TO_KEY = {
    'sub_appalachia': 'appalachia', 'sub_chesapeake': 'chesapeake_bay', 'sub_carolinas': 'the_carolinas',
    'sub_deep_south': 'deep_south', 'sub_gulf_coast': 'gulf_coast', 'sub_four_corners': 'four_corners',
    'sub_rocky_mts': 'rocky_mountains', 'sub_pacific_nw': 'pacific_northwest', 'sub_sw_desert': 'southwest_desert',
    'sub_corn_belt': 'corn_belt', 'sub_non_contiguous': 'non_contiguous', 'sub_seaboard': 'eastern_seaboard',
    'sub_canada_east': 'canada_east', 'sub_canada_central': 'canada_central',
    'sub_canada_west': 'canada_west', 'sub_canada_territories': 'canada_territories',
};

const ELITE_BADGE_STATES = {
    'found_ak': ['Alaska'], 'found_hi': ['Hawaii'], 'found_ak_hi': ['Alaska', 'Hawaii'],
    'found_pr': ['Puerto Rico'], 'found_usvi': ['US Virgin Islands'],
    'found_as': ['American Samoa'], 'found_guam': ['Guam'], 'found_cnmi': ['Northern Mariana Islands'],
    'territory_hunter': ['Puerto Rico', 'US Virgin Islands', 'American Samoa', 'Guam', 'Northern Mariana Islands'],
};

function getBadgeDetailItems(badgeId, playerStates, claimedStates, corridorStates, playerKey) {
    const ps = playerStates || {};
    const toItem = name => ps[name] ? { name, foundAt: ps[name].foundAt, isFirst: claimedStates?.[name]?.playerKey === playerKey } : null;
    const sortByTime = items => [...items].sort((a, b) => (a.foundAt || 0) - (b.foundAt || 0));

    if (badgeId.startsWith('region_')) {
        const key = badgeId.replace('region_', '');
        return sortByTime((REGION_STATES[key] || []).map(toItem).filter(Boolean));
    }
    if (SUB_BADGE_TO_KEY[badgeId]) {
        return sortByTime((SUB_REGIONS[SUB_BADGE_TO_KEY[badgeId]]?.states || []).map(toItem).filter(Boolean));
    }
    if (badgeId === 'corridor_complete') {
        return sortByTime(corridorStates.map(toItem).filter(Boolean));
    }
    if (ELITE_BADGE_STATES[badgeId]) {
        return sortByTime(ELITE_BADGE_STATES[badgeId].map(toItem).filter(Boolean));
    }
    if (badgeId.startsWith('milestone_')) {
        return sortByTime(Object.entries(ps).map(([name, d]) => ({ name, foundAt: d.foundAt, isFirst: claimedStates?.[name]?.playerKey === playerKey })));
    }
    if (badgeId.startsWith('ff_')) {
        return sortByTime(Object.entries(ps)
            .filter(([name]) => claimedStates?.[name]?.playerKey === playerKey)
            .map(([name, d]) => ({ name, foundAt: d.foundAt, isFirst: true })));
    }
    return [];
}

function openBadgeDetail(badgeId, playerKey) {
    const badge = BADGE_DEFS.find(b => b.id === badgeId);
    const player = playersData[playerKey];
    if (!badge || !player) return;
    const overlay = document.getElementById('badgeDetailOverlay');
    if (!overlay) return;
    document.getElementById('badgeDetailTitle').textContent = `${badge.icon} ${badge.label}`;
    document.getElementById('badgeDetailDesc').textContent = badge.desc;
    const items = getBadgeDetailItems(badgeId, player.states, gameData?.claimedStates, gameData?.settings?.playAreaStates || [], playerKey);
    const list = document.getElementById('badgeDetailList');
    list.innerHTML = items.length
        ? items.map(({ name, foundAt, isFirst }) =>
            `<div class="badge-detail-item"><span class="badge-detail-state">${isFirst ? '⭐ ' : ''}${name}</span><span class="badge-detail-time">${formatFoundAt(foundAt)}</span></div>`
          ).join('')
        : '<div class="detail-empty">No detail available for this badge.</div>';
    overlay.style.display = 'flex';
}

function closeBadgeDetail() {
    const overlay = document.getElementById('badgeDetailOverlay');
    if (overlay) overlay.style.display = 'none';
}

// ── Player Detail Modal ───────────────────────────────────────────────────────

function openPlayerDetail(playerKey) {
    const player = playersData[playerKey];
    if (!player) return;
    const modal = document.getElementById('playerDetailModal');
    if (!modal) return;

    const stats = computePlayerStats(playerKey) || { score: 0, foundCount: 0, firstCount: 0, foundSet: new Set(), completedSubs: [], corridorComplete: false };
    const badges = getPlayerBadges(playerKey);
    const isMe = playerKey === currentPlayer?.playerKey;

    document.getElementById('detailPlayerName').textContent = player.displayName + (isMe ? ' (You)' : '');
    document.getElementById('detailStatus').textContent = player.connected ? '🟢 Online' : '💤 Offline';
    document.getElementById('detailScore').textContent = stats.score;
    document.getElementById('detailFoundCount').textContent = stats.foundCount;
    document.getElementById('detailFirstCount').textContent = stats.firstCount;

    // Badges
    const badgeGrid = document.getElementById('detailBadgeGrid');
    if (badgeGrid) {
        badgeGrid.innerHTML = badges.length
            ? badges.map(b => `<div class="badge-item badge-item-clickable" onclick="openBadgeDetail('${b.id}','${playerKey}')"><div class="badge-item-icon">${b.icon}</div><div class="badge-item-label">${b.label}</div><div class="badge-item-desc">${b.desc}</div></div>`).join('')
            : '<div class="detail-empty">No badges yet — keep spotting!</div>';
    }

    // Score breakdown by rarity tier
    const detailCorridor = gameData?.settings?.playAreaStates || [];
    const detailUseGps = gameData?.settings?.gpsRarity;
    const breakdownEl = document.getElementById('detailBreakdownGrid');
    if (breakdownEl) {
        const byTier = {};
        stats.foundSet.forEach(name => {
            const sd = player.states?.[name];
            const effectiveCorridor = (detailUseGps && sd?.foundNearState) ? [sd.foundNearState] : detailCorridor;
            const tier = computeRarityForState(name, effectiveCorridor);
            if (!byTier[tier]) byTier[tier] = { count: 0, pts: 0 };
            const pts = RARITY_CONFIG[tier].points;
            const isFirst = gameData?.claimedStates?.[name]?.playerKey === playerKey;
            byTier[tier].count++;
            byTier[tier].pts += isFirst ? pts : pts / 2;
        });
        const tierOrder = ['ultra','gold-elite','silver-elite','legendary','epic','mega-rare','rare','semi-rare','scarce','occasional','common'];
        const rows = tierOrder.filter(t => byTier[t]).map(t => {
            const cfg = RARITY_CONFIG[t];
            const d = byTier[t];
            return `<div class="breakdown-row"><span class="rarity-badge rarity-${t}">${cfg.label}</span><span class="breakdown-count">${d.count} plate${d.count !== 1 ? 's' : ''}</span><span class="breakdown-pts">${d.pts} pts</span></div>`;
        });
        (stats.completedSubBonuses || []).forEach(({ key, label, bonus, isFirst }) => {
            const firstHolder = gameData?.completedSubRegions?.[key];
            const canDispute = isMe && !isFirst && firstHolder;
            const pending = gameData?.regionClearRequests?.subRegions?.[key];
            const disputeBtn = canDispute
                ? (pending ? `<button class="btn-dispute-region" disabled>Pending…</button>` : `<button class="btn-dispute-region" onclick="requestRegionClear('subRegions','${key}','${label.replace(/'/g, "\\'")}')">Dispute</button>`)
                : '';
            rows.push(`<div class="breakdown-row breakdown-bonus"><span class="breakdown-bonus-label">🗺️ ${label}</span><span class="breakdown-count">${isFirst ? '1st' : 'later'}</span><span class="breakdown-pts">+${bonus} pts</span>${disputeBtn}</div>`);
        });
        (stats.completedRegionBonuses || []).forEach(({ key, label, bonus, isFirst }) => {
            const firstHolder = gameData?.completedRegions?.[key];
            const canDispute = isMe && !isFirst && firstHolder;
            const pending = gameData?.regionClearRequests?.regions?.[key];
            const disputeBtn = canDispute
                ? (pending ? `<button class="btn-dispute-region" disabled>Pending…</button>` : `<button class="btn-dispute-region" onclick="requestRegionClear('regions','${key}','${label.replace(/'/g, "\\'")}')">Dispute</button>`)
                : '';
            rows.push(`<div class="breakdown-row breakdown-bonus"><span class="breakdown-bonus-label">🏛️ ${label}</span><span class="breakdown-count">${isFirst ? '1st' : 'later'}</span><span class="breakdown-pts">+${bonus} pts</span>${disputeBtn}</div>`);
        });
        if (stats.corridorComplete) {
            const corridorFirstHolder = gameData?.completedCorridor;
            const canDisputeCorridor = isMe && stats.corridorBonus !== 150 && corridorFirstHolder;
            const corridorPending = gameData?.regionClearRequests?.corridor;
            const disputeBtn = canDisputeCorridor
                ? (corridorPending ? `<button class="btn-dispute-region" disabled>Pending…</button>` : `<button class="btn-dispute-region" onclick="requestRegionClear('corridor','','Corridor Complete')">Dispute</button>`)
                : '';
            rows.push(`<div class="breakdown-row breakdown-bonus"><span class="breakdown-bonus-label">🛣️ Corridor Complete</span><span class="breakdown-count">${stats.corridorBonus === 150 ? '1st' : 'later'}</span><span class="breakdown-pts">+${stats.corridorBonus || 75} pts</span>${disputeBtn}</div>`);
        }
        breakdownEl.innerHTML = rows.join('') || '<div class="detail-empty">No plates found yet.</div>';
    }

    // Found plates chips sorted rarity-first
    const foundGrid = document.getElementById('detailFoundGrid');
    if (foundGrid) {
        const tierRank = { ultra: 0, 'gold-elite': 1, 'silver-elite': 2, legendary: 3, epic: 4, 'mega-rare': 5, rare: 6, 'semi-rare': 7, scarce: 8, occasional: 9, common: 10 };
        const allPlates = [...US_PLATES, ...TERRITORY_PLATES, ...CANADA_PLATES];
        const sorted = Array.from(stats.foundSet).sort((a, b) => {
            const sdA = player.states?.[a]; const sdB = player.states?.[b];
            const ca = (detailUseGps && sdA?.foundNearState) ? [sdA.foundNearState] : detailCorridor;
            const cb = (detailUseGps && sdB?.foundNearState) ? [sdB.foundNearState] : detailCorridor;
            const ta = tierRank[computeRarityForState(a, ca)] ?? 5;
            const tb = tierRank[computeRarityForState(b, cb)] ?? 5;
            return ta !== tb ? ta - tb : a.localeCompare(b);
        });
        foundGrid.innerHTML = sorted.map(name => {
            const sd = player.states?.[name];
            const ec = (detailUseGps && sd?.foundNearState) ? [sd.foundNearState] : detailCorridor;
            const tier = computeRarityForState(name, ec);
            const abbr = allPlates.find(p => p.name === name)?.abbr || name.slice(0, 2).toUpperCase();
            const isFirst = gameData?.claimedStates?.[name]?.playerKey === playerKey;
            const ts = formatFoundAt(sd?.foundAt);
            const canDispute = isMe && !isFirst && gameData?.claimedStates?.[name];
            const pendingDispute = gameData?.plateDisputeRequests?.[name];
            const safeState = name.replace(/'/g, "\\'");
            const disputeEl = canDispute
                ? `<div class="found-chip-dispute" onclick="event.stopPropagation();requestPlateDispute('${safeState}')">${pendingDispute ? '⏳' : '⚑'}</div>`
                : '';
            return `<div class="found-chip rarity-chip-${tier}" title="${name}${isFirst ? ' — First Find!' : ''}${canDispute ? ' — Tap ⚑ to dispute' : ''}"><div class="found-chip-abbr">${abbr}${isFirst ? '⭐' : ''}</div>${ts ? `<div class="found-chip-time">${ts}</div>` : ''}${disputeEl}</div>`;
        }).join('') || '<div class="detail-empty">No plates found yet.</div>';
    }

    // Achievements
    const achGrid = document.getElementById('detailAchievementGrid');
    if (achGrid) {
        const earnedMap = player.achievements || {};
        achGrid.innerHTML = ACHIEVEMENTS.map(ach => {
            const earned = earnedMap[ach.id];
            const earnedDate = earned ? new Date(earned).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            return `<div class="ach-chip${earned ? ' earned' : ' locked'}" title="${ach.desc}${earnedDate ? ' · ' + earnedDate : ''}">
                <div class="ach-chip-icon">${ach.icon}</div>
                <div class="ach-chip-name">${ach.name}</div>
                ${earned ? `<div class="ach-chip-date">${earnedDate}</div>` : ''}
            </div>`;
        }).join('');
    }

    // Rivalry head-to-head (shown when viewing your rival)
    const myRivalKey = gameData?.rivalries?.[currentPlayer?.playerKey];
    const h2hSection = document.getElementById('detailH2H');
    if (h2hSection) {
        if (!isMe && myRivalKey === playerKey) {
            const myStats = computePlayerStats(currentPlayer.playerKey) || { score: 0, foundCount: 0, firstCount: 0 };
            const ahead = stats.score - myStats.score;
            const aheadLabel = ahead > 0 ? `▲ ${ahead} pts ahead` : ahead < 0 ? `▼ ${Math.abs(ahead)} pts behind` : 'Tied';
            h2hSection.innerHTML = `
                <div class="detail-section-title">⚔️ Head to Head</div>
                <div class="h2h-row">
                    <div class="h2h-stat"><div class="h2h-val">${myStats.score}</div><div class="h2h-lbl">Your score</div></div>
                    <div class="h2h-vs">${aheadLabel}</div>
                    <div class="h2h-stat"><div class="h2h-val">${stats.score}</div><div class="h2h-lbl">${player.displayName}</div></div>
                </div>
                <div class="h2h-row">
                    <div class="h2h-stat"><div class="h2h-val">${myStats.foundCount}</div><div class="h2h-lbl">Your plates</div></div>
                    <div class="h2h-vs">vs</div>
                    <div class="h2h-stat"><div class="h2h-val">${stats.foundCount}</div><div class="h2h-lbl">plates</div></div>
                </div>`;
            h2hSection.style.display = '';
        } else {
            h2hSection.style.display = 'none';
        }
    }

    modal.classList.add('visible');
    modal.style.display = 'flex';
}

function closePlayerDetail() {
    closeBadgeDetail();
    const m = document.getElementById('playerDetailModal');
    if (m) { m.classList.remove('visible'); m.style.display = ''; }
}

// ── End Game ──────────────────────────────────────────────────────────────────

async function endGame() {
    if (!currentGameRef || !currentPlayer) return;
    if (gameData?.hostPlayerKey !== currentPlayer.playerKey) return;
    if (gameData?.status === 'ended') { showEndGameScreen(); return; }
    if (!confirm('End the game for everyone? All players will see the final results.')) return;
    try {
        await currentGameRef.update({ status: 'ended', endedAt: firebase.database.ServerValue.TIMESTAMP, updatedAt: firebase.database.ServerValue.TIMESTAMP });
    } catch (err) {
        console.error('Error ending game:', err);
        showToast('Failed to end game.', 'error');
    }
}

// ── Lucky Plate + Hidden Chests ───────────────────────────────────────────────

const CHEST_PRIZES = [
    { prize: 'coins', amount: 30 },
    { prize: 'coins', amount: 50 },
    { prize: 'coins', amount: 75 },
    { prize: 'trick', effectKey: 'blender', name: 'Blender', icon: '🌀' },
    { prize: 'trick', effectKey: 'freeze',  name: 'Time Freeze', icon: '⏸️' },
    { prize: 'trick', effectKey: 'fog',     name: 'Fog of War', icon: '🌫️' },
    { prize: 'shield', name: 'Shield', icon: '🛡️' },
];

async function assignGamePrizes(gameCode, plateScope) {
    if (!gameCode) return;
    const entries = getActivePlateEntries(plateScope);
    if (entries.length < 3) return;
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const luckyPlate = shuffled[0].name;
    const chestCount = Math.max(3, Math.min(10, Math.floor(entries.length * 0.06)));
    const chests = {};
    shuffled.slice(1, chestCount + 1).forEach(e => {
        chests[e.name] = CHEST_PRIZES[Math.floor(Math.random() * CHEST_PRIZES.length)];
    });
    await database.ref(`games/${gameCode}`).update({ luckyPlate, chests });
}

let lastKnownLuckyFound = null;

function detectLuckyPlateReveal() {
    const found = gameData?.luckyPlateFound;
    if (!found || found.foundAt === lastKnownLuckyFound) return;
    lastKnownLuckyFound = found.foundAt;
    if (found.foundByKey === currentPlayer?.playerKey) return; // showed in toggleState
    showToast(`🍀 ${found.foundBy} found the Lucky Plate — ${found.stateName}! Triple points!`, 'success');
}

// ── Streaks ───────────────────────────────────────────────────────────────────

async function updateStreak(playerKey) {
    if (!currentGameRef) return;
    const streakRef = currentGameRef.child(`players/${playerKey}/streak`);
    let bonusCoins = 0;
    let newCount = 0;

    await streakRef.transaction(current => {
        const now = Date.now();
        const prev = current || { count: 0, lastFoundAt: 0 };
        const withinWindow = now - prev.lastFoundAt <= STREAK_WINDOW_MS;
        newCount = withinWindow ? prev.count + 1 : 1;
        return { count: newCount, lastFoundAt: now };
    });

    const bonus = STREAK_BONUSES.find(b => b.count === newCount);
    if (bonus) {
        bonusCoins = bonus.coins;
        currentGameRef.child(`players/${playerKey}/coins`).transaction(c => (c || 0) + bonusCoins).catch(() => {});
        showToast(`🔥 ${newCount}-plate streak! +${bonusCoins}🪙 bonus!`, 'success');
    }
}

// ── Quick Reactions ───────────────────────────────────────────────────────────

const REACTION_EMOJIS = ['🔥', '😮', '👏', '💀'];

function sendReaction(toKey, toName, emoji) {
    if (!currentGameRef || !currentPlayer) return;
    currentGameRef.child('reactions').push({
        fromKey: currentPlayer.playerKey,
        fromName: currentPlayer.displayName,
        toKey,
        toName,
        emoji,
        sentAt: firebase.database.ServerValue.TIMESTAMP,
    }).catch(() => {});
}

function detectNewReactions() {
    if (!gameData) return;
    const reactions = gameData.reactions || {};
    const currentKeys = Object.keys(reactions);
    if (prevReactionKeys === null) { prevReactionKeys = new Set(currentKeys); return; }
    currentKeys.forEach(key => {
        if (!prevReactionKeys.has(key)) {
            prevReactionKeys.add(key);
            const r = reactions[key];
            if (r.toKey === currentPlayer?.playerKey) {
                showReactionPop(r.toKey, r.emoji, r.fromName);
            } else {
                showReactionPop(r.toKey, r.emoji, null);
            }
        }
    });
}

function showReactionPop(playerKey, emoji, fromName) {
    const card = document.querySelector(`.score-card[data-playerkey="${playerKey}"]`);
    if (!card) return;
    const pop = document.createElement('div');
    pop.className = 'reaction-pop';
    pop.textContent = emoji;
    card.style.position = 'relative';
    card.appendChild(pop);
    if (fromName && playerKey === currentPlayer?.playerKey) {
        showToast(`${emoji} ${fromName} reacted to your score!`, 'info');
    }
    setTimeout(() => pop.remove(), 1200);
}

// ── Bounties ──────────────────────────────────────────────────────────────────

function openBountyModal() {
    if (!currentGameRef || !currentPlayer) return;
    const modal = document.getElementById('bountyModal');
    if (!modal) return;
    const myCoins = playersData[currentPlayer.playerKey]?.coins || 0;
    document.getElementById('bountyHostBalance').textContent = myCoins.toLocaleString();
    const select = document.getElementById('bountyStateSelect');
    select.innerHTML = '';
    const entries = getActivePlateEntries(gameData?.settings?.plateScope);
    entries.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.name;
        const existing = gameData?.bounties?.[e.name];
        opt.textContent = existing ? `${e.name} (bounty: ${existing.reward}🪙)` : e.name;
        select.appendChild(opt);
    });
    document.getElementById('bountyRewardInput').value = '30';
    modal.style.display = 'flex';
}

function closeBountyModal() {
    const modal = document.getElementById('bountyModal');
    if (modal) modal.style.display = 'none';
}

async function confirmPlaceBounty() {
    const stateName = document.getElementById('bountyStateSelect').value;
    const reward = parseInt(document.getElementById('bountyRewardInput').value, 10);
    if (!stateName || !reward || reward < 5) { showToast('Enter a reward of at least 5🪙', 'error'); return; }
    const myCoins = playersData[currentPlayer.playerKey]?.coins || 0;
    if (reward > myCoins) { showToast('Not enough coins!', 'error'); return; }
    closeBountyModal();
    await currentGameRef.update({
        [`bounties/${stateName}`]: { reward, placedBy: currentPlayer.displayName, placedByKey: currentPlayer.playerKey, placedAt: Date.now() },
        [`players/${currentPlayer.playerKey}/coins`]: firebase.database.ServerValue.increment(-reward),
    });
    showToast(`💰 Bounty placed on ${stateName}: ${reward}🪙!`, 'success');
}

async function claimBounty(stateName) {
    const bounty = gameData?.bounties?.[stateName];
    if (!bounty || !currentGameRef || !currentPlayer) return;
    await currentGameRef.update({
        [`bounties/${stateName}`]: null,
        [`players/${currentPlayer.playerKey}/coins`]: firebase.database.ServerValue.increment(bounty.reward),
    });
    showToast(`💰 Bounty claimed! +${bounty.reward}🪙`, 'success');
    awardManualAchievement('bounty_hunter');
}

// ── Speed Round ───────────────────────────────────────────────────────────────

function openSpeedRoundModal() {
    if (gameData?.speedRound?.active) { showToast('A speed round is already running!', 'info'); return; }
    const modal = document.getElementById('speedRoundModal');
    if (modal) modal.style.display = 'flex';
}

function closeSpeedRoundModal() {
    const modal = document.getElementById('speedRoundModal');
    if (modal) modal.style.display = 'none';
}

async function startSpeedRound(durationMs) {
    closeSpeedRoundModal();
    if (!currentGameRef || gameData?.hostPlayerKey !== currentPlayer?.playerKey) return;
    const startedAt = Date.now();
    await currentGameRef.update({ speedRound: { active: true, startedAt, durationMs } });
    showToast(`⚡ Speed Round started! ${durationMs / 60000} minutes — go!`, 'success');
}

function detectSpeedRound() {
    const sr = gameData?.speedRound;
    const banner = document.getElementById('speedRoundBanner');
    if (!banner) return;

    if (!sr?.active) {
        banner.style.display = 'none';
        if (speedRoundInterval) { clearInterval(speedRoundInterval); speedRoundInterval = null; }
        return;
    }

    banner.style.display = '';

    const endsAt = sr.startedAt + sr.durationMs;
    const isHost = gameData?.hostPlayerKey === currentPlayer?.playerKey;

    function tick() {
        const remaining = endsAt - Date.now();
        if (remaining <= 0) {
            clearInterval(speedRoundInterval);
            speedRoundInterval = null;
            banner.style.display = 'none';
            if (isHost && lastKnownSpeedRoundEnd !== sr.startedAt) {
                lastKnownSpeedRoundEnd = sr.startedAt;
                finalizeSpeedRound(sr);
            }
            return;
        }
        const m = Math.floor(remaining / 60000);
        const s = Math.ceil((remaining % 60000) / 1000);
        const el = document.getElementById('speedRoundCountdown');
        if (el) el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }

    if (!speedRoundInterval) {
        tick();
        speedRoundInterval = setInterval(tick, 500);
    }
}

async function finalizeSpeedRound(sr) {
    if (!currentGameRef) return;
    const { startedAt, durationMs } = sr;
    const endedAt = startedAt + durationMs;

    const results = Object.values(playersData).map(p => {
        const duringRound = Object.values(p.states || {}).filter(s => {
            const t = typeof s.foundAt === 'number' ? s.foundAt : 0;
            return t >= startedAt && t <= endedAt;
        }).length;
        return { playerKey: p.playerKey, displayName: p.displayName, count: duringRound };
    }).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

    const SPEED_PRIZES = [100, 60, 30];
    const updates = { 'speedRound/active': false };
    results.slice(0, 3).forEach((r, i) => {
        updates[`players/${r.playerKey}/coins`] = firebase.database.ServerValue.increment(SPEED_PRIZES[i]);
    });
    await currentGameRef.update(updates).catch(() => {});

    const lines = results.slice(0, 3).map((r, i) => `${['🥇','🥈','🥉'][i]} ${r.displayName}: ${r.count} plates (+${SPEED_PRIZES[i]}🪙)`).join('\n');
    const summary = results.length ? `⚡ Speed Round over!\n${lines}` : '⚡ Speed Round over — no plates found!';
    showToast(summary, 'success');
    const myRank = results.findIndex(r => r.playerKey === currentPlayer?.playerKey);
    if (myRank >= 0 && myRank <= 2) awardManualAchievement('speed_podium');
}

// ── Achievements ──────────────────────────────────────────────────────────────

async function checkAchievements(playerKey) {
    if (!currentGameRef || !playerKey) return;
    const player = playersData[playerKey];
    if (!player) return;
    const stats = computePlayerStats(playerKey);
    if (!stats) return;
    const existing = player.achievements || {};
    const totalPlates = getActivePlateEntries(gameData?.settings?.plateScope).length;

    const updates = {};
    const newOnes = [];
    for (const ach of ACHIEVEMENTS) {
        if (!ach.check) continue;
        if (existing[ach.id] || pendingAchievements.has(ach.id)) continue;
        if (ach.check(stats, player, totalPlates)) {
            pendingAchievements.add(ach.id);
            updates[`players/${playerKey}/achievements/${ach.id}`] = Date.now();
            newOnes.push(ach);
        }
    }
    if (Object.keys(updates).length === 0) return;
    await currentGameRef.update(updates);
    newOnes.forEach(ach => showToast(`🏆 ${ach.icon} ${ach.name} unlocked!`, 'success'));
}

function awardManualAchievement(achievementId) {
    if (!currentGameRef || !currentPlayer) return;
    const existing = playersData[currentPlayer.playerKey]?.achievements || {};
    if (existing[achievementId] || pendingAchievements.has(achievementId)) return;
    const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!ach) return;
    pendingAchievements.add(achievementId);
    currentGameRef.update({ [`players/${currentPlayer.playerKey}/achievements/${achievementId}`]: Date.now() }).catch(() => {});
    showToast(`🏆 ${ach.icon} ${ach.name} unlocked!`, 'success');
}

// ── Blackout ──────────────────────────────────────────────────────────────────

const BLACKOUT_BONUS = 500;
let blackoutWon = false;

function detectBlackout() {
    if (blackoutWon || !gameData || !currentPlayer) return;
    const totalPlates = getActivePlateEntries(gameData?.settings?.plateScope).length;
    if (totalPlates === 0) return;
    const myStates = getMyStatesMap();
    const myCount = Object.keys(myStates).length;
    if (myCount < totalPlates) return;
    blackoutWon = true;
    currentGameRef?.child(`players/${currentPlayer.playerKey}/coins`)
        .transaction(c => (c || 0) + BLACKOUT_BONUS).catch(() => {});
    showToast(`🏁 BLACKOUT! You found every plate! +${BLACKOUT_BONUS}🪙`, 'success');
}

// ── Secret Target ─────────────────────────────────────────────────────────────

async function assignSecretTargets() {
    if (!currentGameRef || gameData?.hostPlayerKey !== currentPlayer?.playerKey) return;
    const entries = getActivePlateEntries(gameData?.settings?.plateScope);
    const players = Object.values(playersData);
    if (players.length === 0) { showToast('No players to assign!', 'error'); return; }

    const used = new Set();
    const secretTargets = {};
    for (const player of players) {
        const found = new Set(Object.keys(player.states || {}));
        const candidates = entries.filter(e => !found.has(e.name) && !used.has(e.name));
        if (candidates.length === 0) continue;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        used.add(pick.name);
        secretTargets[player.playerKey] = pick.name;
    }
    await currentGameRef.update({ secretTargets });
    showToast(`🎯 Secret Targets assigned to ${Object.keys(secretTargets).length} player${Object.keys(secretTargets).length !== 1 ? 's' : ''}!`, 'success');
}

function updateSecretTargetDisplay() {
    const banner = document.getElementById('secretTargetBanner');
    if (!banner || !currentPlayer) return;
    const myTarget = gameData?.secretTargets?.[currentPlayer.playerKey];
    const nameEl = document.getElementById('secretTargetName');
    if (myTarget) {
        if (nameEl) nameEl.textContent = myTarget;
        banner.style.display = '';
    } else {
        banner.style.display = 'none';
    }
}

async function claimSecretTarget(stateName) {
    if (!currentGameRef || !currentPlayer) return;
    await currentGameRef.update({
        [`secretTargets/${currentPlayer.playerKey}`]: null,
        [`players/${currentPlayer.playerKey}/coins`]: firebase.database.ServerValue.increment(200),
    });
    showToast(`🎯 SECRET TARGET CLAIMED! ${stateName} — +200🪙!`, 'success');
}

// ── Rivalries ─────────────────────────────────────────────────────────────────

function setRivalry(toKey, toName) {
    if (!currentGameRef || !currentPlayer) return;
    const myKey = currentPlayer.playerKey;
    const currentRival = gameData?.rivalries?.[myKey];
    const updates = {};
    if (currentRival) updates[`rivalries/${currentRival}`] = null; // clear their side
    if (currentRival === toKey) {
        updates[`rivalries/${myKey}`] = null;
        currentGameRef.update(updates).catch(() => {});
        showToast('⚔️ Rivalry ended.', 'info');
        return;
    }
    updates[`rivalries/${myKey}`] = toKey;
    updates[`rivalries/${toKey}`] = myKey;
    currentGameRef.update(updates).catch(() => {});
    showToast(`⚔️ You challenged ${toName} to a rivalry!`, 'success');
}

function detectRivalryChallenges() {
    if (!gameData || !currentPlayer) return;
    const myRivalKey = gameData?.rivalries?.[currentPlayer.playerKey] || null;
    if (myRivalKey === lastKnownRivalry) return;
    const prev = lastKnownRivalry;
    lastKnownRivalry = myRivalKey;
    if (lastKnownRivalry === undefined) return; // first run — don't toast
    if (myRivalKey && prev !== myRivalKey) {
        const rival = playersData[myRivalKey];
        if (rival?.playerKey !== currentPlayer.playerKey) {
            showToast(`⚔️ ${rival?.displayName || '?'} challenged you to a rivalry!`, 'info');
        }
    }
}

// ── Sudden Death ──────────────────────────────────────────────────────────────

function openSuddenDeathModal() {
    if (gameData?.suddenDeath?.active) { showToast('A Sudden Death is already active!', 'info'); return; }
    const modal = document.getElementById('suddenDeathModal');
    if (!modal) return;
    const select = document.getElementById('suddenDeathPlateSelect');
    if (select) {
        select.innerHTML = '';
        const entries = getActivePlateEntries(gameData?.settings?.plateScope);
        const unclaimed = entries.filter(e => !gameData?.claimedStates?.[e.name]);
        (unclaimed.length ? unclaimed : entries).forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.name;
            opt.textContent = e.name;
            select.appendChild(opt);
        });
    }
    modal.style.display = 'flex';
}

function closeSuddenDeathModal() {
    const modal = document.getElementById('suddenDeathModal');
    if (modal) modal.style.display = 'none';
}

async function startSuddenDeath() {
    const plate = document.getElementById('suddenDeathPlateSelect')?.value;
    if (!plate || !currentGameRef) return;
    closeSuddenDeathModal();
    await currentGameRef.update({ suddenDeath: { plate, active: true, startedAt: Date.now(), announcedBy: currentPlayer.displayName } });
    showToast(`🔔 SUDDEN DEATH: Find ${plate} first!`, 'success');
}

async function winSuddenDeath(stateName) {
    if (!currentGameRef || !currentPlayer) return;
    await currentGameRef.update({
        'suddenDeath/active': false,
        'suddenDeath/winnerKey': currentPlayer.playerKey,
        'suddenDeath/winnerName': currentPlayer.displayName,
        'suddenDeath/wonAt': Date.now(),
        [`players/${currentPlayer.playerKey}/coins`]: firebase.database.ServerValue.increment(150),
    });
    showToast(`🔔 SUDDEN DEATH WIN! You found ${stateName} first! +150🪙!`, 'success');
}

function detectSuddenDeath() {
    const sd = gameData?.suddenDeath;
    const banner = document.getElementById('suddenDeathBanner');
    if (!banner) return;
    if (sd?.active) {
        banner.style.display = '';
        const plateEl = document.getElementById('suddenDeathBannerPlate');
        if (plateEl) plateEl.textContent = sd.plate;
    } else {
        banner.style.display = 'none';
        if (sd?.winnerKey && sd.wonAt !== lastKnownSuddenDeathWinner) {
            lastKnownSuddenDeathWinner = sd.wonAt;
            if (sd.winnerKey !== currentPlayer?.playerKey) {
                showToast(`🔔 ${sd.winnerName} won Sudden Death — found ${sd.plate}! +150🪙`, 'info');
            }
        }
    }
}

async function claimChest(stateName) {
    const chest = gameData?.chests?.[stateName];
    if (!chest || !currentGameRef || !currentPlayer) return;
    const updates = { [`chests/${stateName}`]: null };

    if (chest.prize === 'coins') {
        updates[`players/${currentPlayer.playerKey}/coins`] = firebase.database.ServerValue.increment(chest.amount);
        showToast(`🎁 Chest! +${chest.amount}🪙`, 'success');
    } else if (chest.prize === 'trick') {
        const shopItem = SHOP_ITEMS.find(i => i.effectKey === chest.effectKey);
        const expiry = Date.now() + (shopItem?.duration || 3 * 60 * 1000);
        const others = Object.values(playersData).filter(p => p.playerKey !== currentPlayer.playerKey);
        await Promise.all(others.map(t =>
            currentGameRef.child(`players/${t.playerKey}/effects`).transaction(ex => {
                if (ex?.shield) { updates[`players/${t.playerKey}/effects/shield`] = null; return { ...ex, shield: null }; }
                return { ...(ex || {}), [chest.effectKey]: expiry };
            })
        ));
        showToast(`🎁 Chest! ${chest.icon} ${chest.name} activated on the pack!`, 'success');
    } else if (chest.prize === 'shield') {
        updates[`players/${currentPlayer.playerKey}/effects/shield`] = true;
        showToast('🎁 Chest! 🛡️ Shield equipped!', 'success');
    }

    await currentGameRef.update(updates);
}

async function revealLuckyPlate(stateName) {
    const bonusCoins = 75;
    await currentGameRef.update({
        luckyPlateFound: { stateName, foundBy: currentPlayer.displayName, foundByKey: currentPlayer.playerKey, foundAt: Date.now() },
        [`players/${currentPlayer.playerKey}/coins`]: firebase.database.ServerValue.increment(bonusCoins),
    });
    showToast(`🍀 YOU found the Lucky Plate — ${stateName}! Triple points + ${bonusCoins}🪙!`, 'success');
}

async function rerollPrizes() {
    if (!currentGameRef || gameData?.hostPlayerKey !== currentPlayer?.playerKey) return;
    await currentGameRef.update({ luckyPlate: null, luckyPlateFound: null, chests: null });
    await assignGamePrizes(currentGameCode, gameData?.settings?.plateScope);
    showToast('🎲 Prizes re-rolled!', 'success');
}

async function startNewRound() {
    if (!currentGameRef || !currentPlayer) return;
    if (gameData?.hostPlayerKey !== currentPlayer.playerKey) return;
    if (!confirm('Start a new round? This wipes all plates, first-finders, and region completions for everyone. Pack stays together.')) return;
    try {
        const snap = await currentGameRef.once('value');
        const room = snap.val();
        if (!room) return;
        const updates = {};
        Object.keys(room.players || {}).forEach(pKey => { updates[`players/${pKey}/states`] = {}; });
        updates.claimedStates = null;
        updates.completedSubRegions = null;
        updates.completedRegions = null;
        updates.completedCorridor = null;
        updates.taunts = null;
        updates.announcements = null;
        updates.reactions = null;
        updates.bounties = null;
        updates.speedRound = null;
        updates.secretTargets = null;
        updates.rivalries = null;
        updates.suddenDeath = null;
        updates.luckyPlate = null;
        updates.luckyPlateFound = null;
        updates.chests = null;
        updates.status = 'active';
        updates.endedAt = null;
        updates.roundNumber = (room.roundNumber || 1) + 1;
        updates.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        await currentGameRef.update(updates);
        await assignGamePrizes(currentGameCode, room.settings?.plateScope);
    } catch (err) {
        console.error('Error starting new round:', err);
        showToast('Failed to start new round.', 'error');
    }
}

function warmUpGpsIfNeeded(room) {
    if (!room?.settings?.gpsRarity) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 10000, maximumAge: 300000 });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function ordinalSuffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function generatePlayerSummary(playerKey, rank, sortedKeys) {
    const stats = computePlayerStats(playerKey);
    if (!stats) return 'A true road warrior in their own right.';

    const player = playersData[playerKey];
    const firstName = (player?.name || player?.displayName || 'This player').split(' ')[0];
    const total = sortedKeys.length;
    const { score, foundCount: found, firstCount: firsts } = stats;
    const firstRatio = found > 0 ? firsts / found : 0;
    const isWinner = rank === 1;
    const isLast = rank === total;

    const foundAK = stats.foundSet.has('Alaska');
    const foundHI = stats.foundSet.has('Hawaii');
    const foundDC = stats.foundSet.has('Washington DC');
    const TERRITORIES = ['Puerto Rico', 'US Virgin Islands', 'American Samoa', 'Guam', 'Northern Mariana Islands'];
    const territoryCount = TERRITORIES.filter(t => stats.foundSet.has(t)).length;
    const completedCount = (stats.completedRegionBonuses?.length || 0) + (stats.completedSubBonuses?.length || 0);
    const corridorDone = stats.corridorComplete;

    let main;
    if (found === 0) {
        main = pick([
            `${firstName} was deeply immersed in the journey — just not the plate-spotting part. Zero plates, but reportedly excellent company.`,
            `Did ${firstName} see any plates? The data says no. But we choose to believe they were keeping watch for hazards. Important work.`,
            `${firstName} finished with a spotless record — and by spotless we mean zero plates spotted. There's always next mile.`,
        ]);
    } else if (isWinner) {
        main = pick([
            `Absolute road royalty. ${score} points, ${found} plates, and the undeniable confidence of someone who's been doing this since birth. Nobody came close.`,
            `The pack's MVP — ${found} plates and ${firsts} first-finds isn't just good, it's suspiciously good. We're not saying ${firstName} has a deal with the highway gods, but...`,
            `Finished first with ${score} points and left the competition so far behind they needed binoculars just to see the scoreboard. Dominant. Decisive. Done.`,
            `Champion of the road, ruler of the rearview, collector of ${found} plates. ${score} points. The crown fits perfectly.`,
        ]);
    } else if (isLast && total >= 3) {
        main = pick([
            `Dead last? Sure. But ${found} plates and ${score} points means ${firstName} was genuinely playing — just at a more relaxed pace. Very scenic.`,
            `Last place in a field of ${total} is still top ${Math.round((rank / total) * 100)}%. That's how stats work sometimes. ${found} plates, ${score} points — no shame here.`,
            `${firstName} brought up the rear with ${score} points, which honestly takes courage. The view from the back of the pack is great — less pressure, more snacks.`,
            `The caboose of the pack, but cabooses are iconic. ${score} points, ${found} plates, and a spirit that carried everyone through. At least ${firstName} personally.`,
        ]);
    } else if (rank === 2) {
        const winnerName = (playersData[sortedKeys[0]]?.name || 'first place').split(' ')[0];
        main = pick([
            `Silver. ${score} points, ${found} plates, and genuine dignity about it. Just a few unlucky seconds away from the top all game.`,
            `Runner-up with ${score} points — behind ${winnerName} technically, but have you seen ${winnerName}'s stats? That's a monster. Second is perfectly respectable.`,
            `So close to first it stings a little. ${score} points and ${found} plates says this was no accident — ${firstName} was absolutely here to compete.`,
        ]);
    } else if (rank === 3 && total >= 4) {
        main = pick([
            `Bronze is a medal. Bronze is ALWAYS a medal. ${score} points, ${found} plates, and the determination to keep spotting until the very end.`,
            `Top three out of ${total} — ${firstName} beat ${total - 3} people. Let that sink in. ${score} points and ${found} plates. That's a podium finish.`,
            `Third place! ${score} points and ${found} plates locked in the final medal position. Not bad for someone riding in a car.`,
        ]);
    } else {
        main = pick([
            `A solid ${ordinalSuffix(rank)}-place finish with ${score} points and ${found} plates found. Consistent, reliable, and genuinely fun to play with.`,
            `${ordinalSuffix(rank)} out of ${total} with ${score} points. ${firstName} held their own — ${found} plates don't find themselves.`,
            `Finished ${ordinalSuffix(rank)} with ${score} points and ${found} plates, proving you don't need first place to have an excellent adventure.`,
        ]);
    }

    const bonuses = [];
    if (corridorDone) bonuses.push(pick([
        'Also completed the full travel corridor — an achievement that even cartographers would applaud.',
        'Knocked out the entire corridor, which requires a level of plate-spotting intensity normally reserved for professionals.',
    ]));
    if (foundAK && foundHI) bonuses.push(pick([
        'Snagged BOTH Alaska AND Hawaii — those don\'t just drive by. That\'s elite-tier spotting right there.',
        'Alaska AND Hawaii on the same trip? The odds are staggering. The achievement is absolutely real.',
    ]));
    else if (foundAK) bonuses.push('Also somehow spotted Alaska, which is either incredibly lucky or incredibly focused.');
    else if (foundHI) bonuses.push('Hawaii made an appearance too — statistically improbable and deeply satisfying.');
    if (territoryCount >= 3) bonuses.push(pick([
        `Racked up ${territoryCount} US territory plates — international explorer vibes on a domestic road trip.`,
        `Found ${territoryCount} territories, which means those plates were ranging far and wide. Or ${firstName} has very sharp eyes.`,
    ]));
    if (completedCount >= 3) bonuses.push(pick([
        `Completed ${completedCount} regional bonus goals — the kind of strategic play that changes scoreboards.`,
        `${completedCount} region completions. That's not just spotting plates, that's executing a geographic masterplan.`,
    ]));
    if (firstRatio > 0.7 && firsts >= 5) bonuses.push(pick([
        `With ${firsts} first-finds out of ${found} plates, ${firstName} was clearly on a mission to get there before everyone else.`,
        `First-find ratio of ${Math.round(firstRatio * 100)}% — technically aggressive, officially impressive.`,
    ]));
    if (foundDC && !foundAK && !foundHI) bonuses.push('Even grabbed Washington DC, which a surprising number of players just completely miss.');

    return bonuses.length > 0 ? `${main} ${bonuses[0]}` : main;
}

function showEndGameScreen() {
    const modal = document.getElementById('endGameModal');
    if (!modal) return;

    const totalPlates = getActivePlateEntries(gameData?.settings?.plateScope).length;
    const sorted = Object.values(playersData).map(p => {
        const stats = computePlayerStats(p.playerKey) || { score: 0, foundCount: 0, firstCount: 0 };
        return { ...p, ...stats, pct: totalPlates > 0 ? Math.round((stats.foundCount / totalPlates) * 100) : 0 };
    }).sort((a, b) => b.score - a.score || b.foundCount - a.foundCount || (a.joinedAt || 0) - (b.joinedAt || 0));

    const sortedKeys = sorted.map(p => p.playerKey);
    const MEDALS = ['🥇', '🥈', '🥉'];

    const titleEl = document.getElementById('endGameTitle');
    if (titleEl) titleEl.textContent = '🏁 Game Over!';
    const subtitleEl = document.getElementById('endGameSubtitle');
    if (subtitleEl) subtitleEl.textContent = `${gameData?.name || 'PlateQuest'} Pack · Final Results`;

    const body = document.getElementById('endGameBody');
    if (body) {
        body.innerHTML = sorted.map((player, i) => {
            const rank = i + 1;
            const medal = MEDALS[i] || `#${rank}`;
            const rankCls = rank <= 3 ? `rank-${rank}` : '';
            const isMe = player.playerKey === currentPlayer?.playerKey;
            const summary = generatePlayerSummary(player.playerKey, rank, sortedKeys);
            return `<div class="end-player-card ${rankCls}">
                <div class="end-player-top">
                    <div class="end-player-medal">${medal}</div>
                    <div>
                        <div class="end-player-name">${player.displayName || player.name || 'Player'}${isMe ? ' 🐺' : ''}</div>
                        <div class="end-player-score">${player.score} pts · ${player.foundCount} plates · ${player.firstCount} first-finds</div>
                    </div>
                </div>
                <div class="end-player-summary">${summary}</div>
            </div>`;
        }).join('');
    }

    modal.style.display = 'flex';
}

function closeEndGameScreen() {
    const modal = document.getElementById('endGameModal');
    if (modal) modal.style.display = 'none';
}

function showHowToPlay() {
    const modal = document.getElementById('howToPlayModal');
    if (modal) modal.style.display = 'flex';
}

function closeHowToPlay() {
    const modal = document.getElementById('howToPlayModal');
    if (modal) modal.style.display = 'none';
}

function shareEndGameResults() {
    if (!gameData) return;
    const totalPlates = getActivePlateEntries(gameData?.settings?.plateScope).length;
    const sorted = Object.values(playersData).map(p => {
        const s = computePlayerStats(p.playerKey) || { score: 0, foundCount: 0, firstCount: 0 };
        return { ...p, ...s };
    }).sort((a, b) => b.score - a.score || b.foundCount - a.foundCount);
    const medals = ['🥇', '🥈', '🥉'];
    const lines = [
        `🏁 PlateQuest — ${gameData.name || 'Pack'} Final Results`,
        '',
        ...sorted.map((p, i) => `${medals[i] || `#${i + 1}`} ${p.displayName || p.name} — ${p.score} pts · ${p.foundCount}/${totalPlates} plates · ${p.firstCount} first-finds`),
        '',
        `Play at: ${window.location.origin}${window.location.pathname}`,
    ];
    copyToClipboard(lines.join('\n'), '📋 Results copied!');
}

// ── Winners Circle ────────────────────────────────────────────────────────────

function buildPithyDescription(sorted, totalPlates) {
    if (!sorted.length) return 'The road goes ever on. 🐺';
    const winner = sorted[0];
    const winnerName = (winner.name || winner.displayName || 'Winner').split(' ')[0];
    const margin = sorted.length >= 2 ? winner.score - sorted[1].score : null;
    const totalFound = sorted.reduce((sum, p) => sum + (p.foundCount || 0), 0);
    const n = sorted.length;
    const anyAlaska = sorted.some(p => p.foundSet?.has('Alaska'));
    const anyHawaii = sorted.some(p => p.foundSet?.has('Hawaii'));

    if (anyAlaska && anyHawaii) return pick([
        'Alaska AND Hawaii spotted in the same game. This pack is elite.',
        'Two mythical plates in one trip. The highway surrendered.',
    ]);
    if (anyAlaska) return `Alaska appeared and ${winnerName} still dominated. Pure efficiency.`;
    if (anyHawaii) return `Hawaii showed up. ${winnerName} remained unfazed. True road royalty.`;

    if (n === 1) return pick([
        `Solo run. ${winner.foundCount} plates, ${winner.score} pts. ${winnerName} doesn't need competition — just a highway.`,
        `One player, ${winner.foundCount} plates, zero chill. ${winnerName} plays for keeps.`,
    ]);

    if (margin === 0) return pick([
        `A PERFECT TIE at ${winner.score} points. The highway refused to pick a side.`,
        `Tied at ${winner.score} pts. Rematch requested. Road pending.`,
    ]);

    if (margin !== null && margin > 80) return pick([
        `${winnerName} won by ${margin} points. The rest of the pack sends their regards.`,
        `A ${margin}-point lead. ${winnerName} wasn't racing the pack — ${winnerName} was racing history.`,
        `The gap was ${margin} points. ${winnerName} did not leave crumbs.`,
    ]);

    if (margin !== null && margin <= 15 && margin > 0) return pick([
        `Final margin: ${margin} points. One more plate would have changed everything.`,
        `${winnerName} by just ${margin} pts. The back seat saw that coming a mile away.`,
        `${margin} points separated legend from runner-up. ${winnerName} holds the crown.`,
    ]);

    if (totalFound > 60) return pick([
        `A combined ${totalFound} plates spotted. The interstate has been fully reviewed.`,
        `${totalFound} plates across ${n} road warriors. The highway had nowhere to hide.`,
    ]);

    return pick([
        `${n} players. ${totalFound} plates. ${winnerName} took the crown. Road trip complete.`,
        `Pack closed. ${winnerName}: victorious. ${totalFound} plates documented. No notes.`,
        `${winnerName} wins with ${winner.score} pts. The road knew it before we did.`,
        `Miles driven. Plates spotted. ${winnerName} emerged. Life is good.`,
    ]);
}

function _canvasWrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    words.forEach(word => {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxWidth && line.length) {
            ctx.fillText(line.trim(), x, curY);
            line = word + ' ';
            curY += lineHeight;
        } else {
            line = test;
        }
    });
    if (line.trim()) ctx.fillText(line.trim(), x, curY);
    return curY;
}

function renderWinnersCanvas(sorted, pithyDesc) {
    const topN = Math.min(sorted.length, 3);
    const W = 600;
    const HEADER_H = 72;
    const ROW_H = 72, ROW_GAP = 8;
    const DESC_H = 80;
    const FOOTER_H = 30;
    const H = HEADER_H + 10 + topN * (ROW_H + ROW_GAP) + 14 + DESC_H + FOOTER_H;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d1f35');
    bg.addColorStop(1, '#162840');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 18);
    ctx.fill();

    // Gold border
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1, 1, W - 2, H - 2, 18);
    ctx.stroke();

    // Header shimmer
    const hdrGrad = ctx.createLinearGradient(0, 0, W, 0);
    hdrGrad.addColorStop(0, 'rgba(255,215,0,0.04)');
    hdrGrad.addColorStop(0.5, 'rgba(255,215,0,0.12)');
    hdrGrad.addColorStop(1, 'rgba(255,215,0,0.04)');
    ctx.fillStyle = hdrGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, HEADER_H, [18, 18, 0, 0]);
    ctx.fill();

    // Header text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
    ctx.fillText('🏁  WINNERS CIRCLE', W / 2, 31);

    const packLabel = (gameData?.name || 'PlateQuest Pack') + '  ·  ' +
        new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText(packLabel, W / 2, 53);

    // Header divider
    ctx.strokeStyle = 'rgba(255,215,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, HEADER_H - 1);
    ctx.lineTo(W - 20, HEADER_H - 1);
    ctx.stroke();

    // Player rows
    const MEDALS = ['🥇', '🥈', '🥉'];
    const NAME_COLORS = ['#FFD700', '#D8D8D8', '#E08840'];
    const CARD_BG    = ['rgba(255,215,0,0.08)', 'rgba(200,200,200,0.05)', 'rgba(180,100,40,0.07)'];
    const CARD_EDGE  = ['rgba(255,215,0,0.3)',  'rgba(200,200,200,0.18)', 'rgba(200,120,50,0.22)'];

    sorted.slice(0, 3).forEach((p, i) => {
        const cardY = HEADER_H + 10 + i * (ROW_H + ROW_GAP);
        const PL = 18;

        ctx.fillStyle = CARD_BG[i];
        ctx.beginPath();
        ctx.roundRect(PL, cardY, W - PL * 2, ROW_H, 10);
        ctx.fill();
        ctx.strokeStyle = CARD_EDGE[i];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(PL, cardY, W - PL * 2, ROW_H, 10);
        ctx.stroke();

        // Medal
        ctx.textAlign = 'left';
        ctx.font = '28px serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(MEDALS[i], PL + 12, cardY + ROW_H / 2 + 10);

        // Name (max 22 chars)
        const name = (p.displayName || p.name || 'Player').slice(0, 22);
        ctx.font = `bold 17px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = NAME_COLORS[i];
        ctx.fillText(name, PL + 56, cardY + ROW_H / 2 - 5);

        // Stats
        ctx.font = '13px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.48)';
        ctx.fillText(`${p.score} pts  ·  ${p.foundCount} plates  ·  ${p.firstCount} first-finds`, PL + 56, cardY + ROW_H / 2 + 16);

        // Rank coins if present
        if ((p.coins || 0) > 0) {
            ctx.textAlign = 'right';
            ctx.font = '12px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = 'rgba(255,215,0,0.6)';
            ctx.fillText(`${p.coins}🪙`, W - PL - 14, cardY + ROW_H / 2 + 6);
        }
    });

    // Description section
    const descY = HEADER_H + 10 + topN * (ROW_H + ROW_GAP) + 14;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, descY);
    ctx.lineTo(W - 20, descY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.font = 'italic 14px system-ui, -apple-system, sans-serif';
    _canvasWrapText(ctx, pithyDesc, W / 2, descY + 24, W - 60, 22);

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText('🐺  PlateQuest', W / 2, H - 10);

    return canvas;
}

async function shareWinnersCircle() {
    if (!gameData) return;
    const totalPlates = getActivePlateEntries(gameData?.settings?.plateScope).length;
    const sorted = Object.values(playersData).map(p => {
        const s = computePlayerStats(p.playerKey) || { score: 0, foundCount: 0, firstCount: 0, foundSet: new Set() };
        return { ...p, ...s };
    }).sort((a, b) => b.score - a.score || b.foundCount - a.foundCount);

    const pithyDesc = buildPithyDescription(sorted, totalPlates);
    const canvas = renderWinnersCanvas(sorted, pithyDesc);

    const medals = ['🥇', '🥈', '🥉'];
    const shareText = [
        `🏆 PlateQuest — ${gameData.name || 'Pack'} Winners Circle`,
        '',
        ...sorted.slice(0, 3).map((p, i) => `${medals[i]} ${p.displayName || p.name} — ${p.score} pts · ${p.foundCount}/${totalPlates} plates`),
        '',
        pithyDesc,
        '',
        '🐺 PlateQuest',
    ].join('\n');

    const btn = document.getElementById('winnersCircleBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating…'; }

    canvas.toBlob(async blob => {
        if (btn) { btn.disabled = false; btn.textContent = '🏆 Winners Circle'; }
        if (!blob) { copyToClipboard(shareText, '📋 Results copied!'); return; }

        const file = new File([blob], 'platequest-winners.png', { type: 'image/png' });

        // Try image share
        try {
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({ title: `PlateQuest — ${gameData.name || 'Pack'} Results`, text: shareText, files: [file] });
                return;
            }
        } catch (e) {
            if (e.name === 'AbortError') return;
        }

        // Try text-only share
        try {
            if (navigator.share) {
                await navigator.share({ title: 'PlateQuest Results', text: shareText });
                return;
            }
        } catch (e) {
            if (e.name === 'AbortError') return;
        }

        // Fallback: download image
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'platequest-winners.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        showToast('📥 Winners Circle saved!', 'success');
    }, 'image/png');
}

// ── QR Code ───────────────────────────────────────────────────────────────────

function showQRModal() {
    const modal = document.getElementById('qrModal');
    if (!modal || !currentGameCode) return;
    const url = getCanonicalJoinUrl();
    const img = document.getElementById('qrCodeImg');
    if (img) img.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&margin=2`;
    const urlEl = document.getElementById('qrJoinUrl');
    if (urlEl) urlEl.textContent = url;
    modal.classList.add('visible');
}

function closeQRModal() {
    document.getElementById('qrModal')?.classList.remove('visible');
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

const TIER_ICON = { ultra:'💎', 'gold-elite':'🥇', 'silver-elite':'🥈', legendary:'🌟', epic:'✨', 'mega-rare':'💥', rare:'🔵', 'semi-rare':'🟢', scarce:'🟡', occasional:'⬜', common:'⬜' };

function buildActivityEvents() {
    const events = [];
    const allPlates = [...US_PLATES, ...TERRITORY_PLATES, ...CANADA_PLATES];
    const corridor = gameData?.settings?.playAreaStates || [];
    const useGps = gameData?.settings?.gpsRarity;

    Object.values(playersData).forEach(player => {
        Object.entries(player.states || {}).forEach(([stateName, sd]) => {
            const isFirst = gameData?.claimedStates?.[stateName]?.playerKey === player.playerKey;
            const ec = (useGps && sd?.foundNearState) ? [sd.foundNearState] : corridor;
            const tier = computeRarityForState(stateName, ec);
            const abbr = allPlates.find(p => p.name === stateName)?.abbr || stateName.slice(0, 2).toUpperCase();
            events.push({ type: 'find', ts: sd.foundAt || 0, playerName: player.displayName || player.name || 'Player', state: stateName, abbr, tier, isFirst });
        });
    });

    Object.values(gameData?.announcements || {}).forEach(ann => {
        events.push({ type: 'announcement', ts: ann.sentAt || 0, playerName: ann.sentBy || 'Host', message: ann.text });
    });

    Object.values(gameData?.taunts || {}).forEach(t => {
        const targetLabel = t.targetKeys?.includes('all') ? 'everyone' : (t.targetNames || []).join(' & ');
        events.push({ type: 'taunt', ts: t.sentAt || 0, playerName: t.senderName || '?', targetLabel, message: t.message });
    });

    if (gameData?.endedAt) events.push({ type: 'ended', ts: gameData.endedAt });

    return events.sort((a, b) => b.ts - a.ts);
}

function renderActivityFeed() {
    const body = document.getElementById('activityBody');
    if (!body) return;
    const events = buildActivityEvents();
    if (!events.length) {
        body.innerHTML = '<div class="activity-empty">No activity yet — start spotting plates!</div>';
        return;
    }
    body.innerHTML = events.map(ev => {
        const time = ev.ts ? formatFoundAt(ev.ts) : '';
        if (ev.type === 'find') {
            const icon = TIER_ICON[ev.tier] || '⬜';
            const firstBadge = ev.isFirst ? `<span class="activity-first">⭐ First!</span>` : '';
            return `<div class="activity-event"><div class="activity-icon">${icon}</div><div class="activity-text"><strong>${ev.playerName}</strong> found <strong>${ev.state}</strong> (${ev.abbr})${firstBadge}</div><div class="activity-time">${time}</div></div>`;
        }
        if (ev.type === 'announcement') {
            return `<div class="activity-event"><div class="activity-icon">📣</div><div class="activity-text"><strong>${ev.playerName}:</strong> ${ev.message}</div><div class="activity-time">${time}</div></div>`;
        }
        if (ev.type === 'taunt') {
            return `<div class="activity-event"><div class="activity-icon">😈</div><div class="activity-text"><strong>${ev.playerName}</strong> → <em>${ev.targetLabel}</em>: ${ev.message}</div><div class="activity-time">${time}</div></div>`;
        }
        if (ev.type === 'ended') {
            return `<div class="activity-event"><div class="activity-icon">🏁</div><div class="activity-text"><strong>Game ended</strong></div><div class="activity-time">${time}</div></div>`;
        }
        return '';
    }).join('');
}

function toggleActivityFeed() {
    const sheet = document.getElementById('activitySheet');
    if (!sheet) return;
    if (sheet.classList.contains('open')) {
        sheet.classList.remove('open');
    } else {
        sheet.classList.add('open');
        renderActivityFeed();
    }
}

function closeActivityFeed() {
    document.getElementById('activitySheet')?.classList.remove('open');
}
