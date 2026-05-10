/* AnimalQuest — shared game data
 * Used by both single-player (animalquest/index.html) and multiplayer.
 * Created by JcWoLF76.
 */
(function (root) {
    'use strict';

    // Rarity tiers and base point values (live spot).
    // Roadkill earns base + ROADKILL_BONUS, tracked separately.
    const RARITY = {
        common:    { label: 'Common',    points: 5,   color: '#7fbf7f' },
        uncommon:  { label: 'Uncommon',  points: 10,  color: '#5da8a8' },
        rare:      { label: 'Rare',      points: 25,  color: '#3a92e0' },
        epic:      { label: 'Epic',      points: 50,  color: '#9b59b6' },
        legendary: { label: 'Legendary', points: 100, color: '#e67e22' },
        mythic:    { label: 'Mythic',    points: 250, color: '#e84393' }
    };

    const ROADKILL_BONUS = 5;          // flat bonus added on top of base
    const FIRST_FINDER_BONUS = 5;      // multiplayer: bonus to first finder

    // Regions used for spawn/rarity. Picking a region tailors the animal list:
    //  - "in-region" animals show normally
    //  - "out-of-region" animals are still listable but rarer / worth +50%
    const REGIONS = {
        northeast:         { label: 'Northeast & New England', emoji: '🍁' },
        southeast:         { label: 'Southeast & Gulf',         emoji: '🌴' },
        midwest:           { label: 'Midwest & Plains',         emoji: '🌾' },
        'mountain-west':   { label: 'Rocky Mountains',          emoji: '⛰️' },
        'pacific-northwest': { label: 'Pacific Northwest',      emoji: '🌲' },
        southwest:         { label: 'Desert Southwest',         emoji: '🌵' },
        alaska:            { label: 'Alaska & Arctic',          emoji: '❄️' },
        national:          { label: 'National (anywhere)',      emoji: '🇺🇸' }
    };

    // Special bonus groups. Spotting all members in a group (live OR roadkill)
    // earns the bonus once. "anyRoadkill" group counts unique roadkill spots.
    const GROUPS = {
        'wild-five':     { label: 'The Wild Five',        emoji: '🐺',
                           desc: 'Apex of the American wilderness',
                           members: ['gray-wolf','grizzly-bear','mountain-lion','bald-eagle','american-bison'],
                           bonus: 250 },
        'antlered':      { label: 'Antlered Royalty',     emoji: '🦌',
                           desc: 'Spot every member of the antler club',
                           members: ['white-tailed-deer','elk','moose','caribou','pronghorn'],
                           bonus: 100 },
        'backyard':      { label: 'Backyard Bandits',     emoji: '🦝',
                           desc: 'The trash-can patrol',
                           members: ['raccoon','striped-skunk','virginia-opossum','eastern-gray-squirrel','eastern-chipmunk'],
                           bonus: 50 },
        'sky-hunters':   { label: 'Sky Hunters',          emoji: '🦅',
                           desc: 'Things with wings and sharp eyes',
                           members: ['bald-eagle','red-tailed-hawk','great-horned-owl','osprey','turkey-vulture'],
                           bonus: 75 },
        'cold-blooded':  { label: 'Cold-Blooded Crew',    emoji: '🐊',
                           desc: 'Reptiles & friends',
                           members: ['american-alligator','snapping-turtle','garter-snake','horned-lizard','bullfrog'],
                           bonus: 75 },
        'waterfowl':     { label: 'Waterfowl Watch',      emoji: '🦆',
                           desc: 'Friends of the wetlands',
                           members: ['mallard','canada-goose','great-blue-heron','brown-pelican','trumpeter-swan'],
                           bonus: 60 },
        'farm-friends':  { label: 'Farm Friends',         emoji: '🐄',
                           desc: 'Spotted from the road, paddock or pasture',
                           members: ['cow','horse','pig','sheep','goat'],
                           bonus: 40 },
        'roadkill-bingo':{ label: 'Roadkill Bingo',       emoji: '🦴',
                           desc: 'A cursed achievement — five different roadkill spots',
                           special: 'anyRoadkill',
                           threshold: 5,
                           bonus: 75 },
        'cryptid-quest': { label: 'Cryptid Quest',        emoji: '👁️',
                           desc: 'You will be doubted. You will not care.',
                           members: ['sasquatch','chupacabra','jackalope'],
                           bonus: 500 }
    };

    // Animal list — id, name, emoji, rarity, regions[], groups[], roadkillable
    // `regions` lists all regions where the animal occurs naturally. If the
    // current trip region isn't in the list, the animal still appears but is
    // tagged "out-of-region" (worth 1.5x base).
    const ANIMALS = [
        // ──── COMMON (5 pts) ────────────────────────────────────────────────
        { id: 'eastern-gray-squirrel', name: 'Eastern Gray Squirrel', emoji: '🐿️',
          rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['backyard'] },
        { id: 'eastern-cottontail', name: 'Cottontail Rabbit', emoji: '🐇',
          rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','southwest','national'],
          groups: [] },
        { id: 'american-crow', name: 'American Crow', emoji: '🐦‍⬛',
          rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: [] },
        { id: 'rock-pigeon', name: 'Rock Pigeon', emoji: '🕊️',
          rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: [] },
        { id: 'mallard', name: 'Mallard Duck', emoji: '🦆',
          rarity: 'common', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['waterfowl'] },
        { id: 'canada-goose', name: 'Canada Goose', emoji: '🪿',
          rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['waterfowl'] },
        { id: 'white-tailed-deer', name: 'White-tailed Deer', emoji: '🦌',
          rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['antlered'] },
        { id: 'cow', name: 'Cow', emoji: '🐄',
          rarity: 'common', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['farm-friends'] },
        { id: 'horse', name: 'Horse', emoji: '🐴',
          rarity: 'common', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['farm-friends'] },
        { id: 'garter-snake', name: 'Garter Snake', emoji: '🐍',
          rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['cold-blooded'] },

        // ──── UNCOMMON (10 pts) ─────────────────────────────────────────────
        { id: 'raccoon', name: 'Raccoon', emoji: '🦝',
          rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['backyard'] },
        { id: 'virginia-opossum', name: 'Virginia Opossum', emoji: '🐀',
          rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','pacific-northwest','national'],
          groups: ['backyard'] },
        { id: 'striped-skunk', name: 'Striped Skunk', emoji: '🦨',
          rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['backyard'] },
        { id: 'eastern-chipmunk', name: 'Eastern Chipmunk', emoji: '🐿️',
          rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','midwest','mountain-west','national'],
          groups: ['backyard'] },
        { id: 'red-tailed-hawk', name: 'Red-tailed Hawk', emoji: '🦅',
          rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['sky-hunters'] },
        { id: 'wild-turkey', name: 'Wild Turkey', emoji: '🦃',
          rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: [] },
        { id: 'great-blue-heron', name: 'Great Blue Heron', emoji: '🪶',
          rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['waterfowl'] },
        { id: 'coyote', name: 'Coyote', emoji: '🐺',
          rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','alaska','national'],
          groups: [] },
        { id: 'groundhog', name: 'Groundhog', emoji: '🦦',
          rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','midwest','southeast'],
          groups: [] },
        { id: 'turkey-vulture', name: 'Turkey Vulture', emoji: '🦃',
          rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['sky-hunters'] },
        { id: 'pig', name: 'Pig', emoji: '🐖',
          rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['farm-friends'] },
        { id: 'sheep', name: 'Sheep', emoji: '🐑',
          rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['farm-friends'] },
        { id: 'goat', name: 'Goat', emoji: '🐐',
          rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['farm-friends'] },
        { id: 'bullfrog', name: 'American Bullfrog', emoji: '🐸',
          rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['cold-blooded'] },

        // ──── RARE (25 pts) ─────────────────────────────────────────────────
        { id: 'red-fox', name: 'Red Fox', emoji: '🦊',
          rarity: 'rare', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','alaska','national'],
          groups: [] },
        { id: 'black-bear', name: 'Black Bear', emoji: '🐻',
          rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','mountain-west','pacific-northwest','alaska'],
          groups: [] },
        { id: 'bald-eagle', name: 'Bald Eagle', emoji: '🦅',
          rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','alaska','national'],
          groups: ['wild-five','sky-hunters'] },
        { id: 'beaver', name: 'American Beaver', emoji: '🦫',
          rarity: 'rare', roadkillable: true,
          regions: ['northeast','midwest','mountain-west','pacific-northwest','alaska','national'],
          groups: [] },
        { id: 'river-otter', name: 'River Otter', emoji: '🦦',
          rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','alaska'],
          groups: [] },
        { id: 'armadillo', name: 'Nine-banded Armadillo', emoji: '🦡',
          rarity: 'rare', roadkillable: true,
          regions: ['southeast','southwest'],
          groups: [] },
        { id: 'wild-boar', name: 'Wild Boar', emoji: '🐗',
          rarity: 'rare', roadkillable: true,
          regions: ['southeast','southwest','pacific-northwest'],
          groups: [] },
        { id: 'snapping-turtle', name: 'Snapping Turtle', emoji: '🐢',
          rarity: 'rare', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['cold-blooded'] },
        { id: 'great-horned-owl', name: 'Great Horned Owl', emoji: '🦉',
          rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','alaska','national'],
          groups: ['sky-hunters'] },
        { id: 'brown-pelican', name: 'Brown Pelican', emoji: '🦤',
          rarity: 'rare', roadkillable: false,
          regions: ['southeast','pacific-northwest','southwest'],
          groups: ['waterfowl'] },
        { id: 'roadrunner', name: 'Greater Roadrunner', emoji: '🏃',
          rarity: 'rare', roadkillable: false,
          regions: ['southwest'],
          groups: [] },
        { id: 'trumpeter-swan', name: 'Trumpeter Swan', emoji: '🦢',
          rarity: 'rare', roadkillable: false,
          regions: ['midwest','mountain-west','pacific-northwest','alaska'],
          groups: ['waterfowl'] },
        { id: 'osprey', name: 'Osprey', emoji: '🪶',
          rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','pacific-northwest','mountain-west','national'],
          groups: ['sky-hunters'] },
        { id: 'horned-lizard', name: 'Horned Lizard', emoji: '🦎',
          rarity: 'rare', roadkillable: true,
          regions: ['southwest','mountain-west'],
          groups: ['cold-blooded'] },

        // ──── EPIC (50 pts) ─────────────────────────────────────────────────
        { id: 'moose', name: 'Moose', emoji: '🫎',
          rarity: 'epic', roadkillable: true,
          regions: ['northeast','mountain-west','pacific-northwest','alaska'],
          groups: ['antlered'] },
        { id: 'elk', name: 'Elk', emoji: '🦌',
          rarity: 'epic', roadkillable: true,
          regions: ['mountain-west','pacific-northwest','alaska'],
          groups: ['antlered'] },
        { id: 'bighorn-sheep', name: 'Bighorn Sheep', emoji: '🐏',
          rarity: 'epic', roadkillable: false,
          regions: ['mountain-west','southwest'],
          groups: [] },
        { id: 'mountain-goat', name: 'Mountain Goat', emoji: '🐐',
          rarity: 'epic', roadkillable: false,
          regions: ['mountain-west','pacific-northwest','alaska'],
          groups: [] },
        { id: 'mountain-lion', name: 'Mountain Lion', emoji: '🦁',
          rarity: 'epic', roadkillable: false,
          regions: ['mountain-west','pacific-northwest','southwest'],
          groups: ['wild-five'] },
        { id: 'american-alligator', name: 'American Alligator', emoji: '🐊',
          rarity: 'epic', roadkillable: false,
          regions: ['southeast'],
          groups: ['cold-blooded'] },
        { id: 'bobcat', name: 'Bobcat', emoji: '🐈',
          rarity: 'epic', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest'],
          groups: [] },
        { id: 'pronghorn', name: 'Pronghorn Antelope', emoji: '🦌',
          rarity: 'epic', roadkillable: true,
          regions: ['mountain-west','midwest','southwest'],
          groups: ['antlered'] },
        { id: 'manatee', name: 'Manatee', emoji: '🐋',
          rarity: 'epic', roadkillable: false,
          regions: ['southeast'],
          groups: [] },
        { id: 'snowy-owl', name: 'Snowy Owl', emoji: '🦉',
          rarity: 'epic', roadkillable: false,
          regions: ['alaska','northeast','midwest'],
          groups: [] },
        { id: 'orca', name: 'Orca', emoji: '🐋',
          rarity: 'epic', roadkillable: false,
          regions: ['pacific-northwest','alaska'],
          groups: [] },
        { id: 'javelina', name: 'Javelina', emoji: '🐗',
          rarity: 'epic', roadkillable: true,
          regions: ['southwest'],
          groups: [] },

        // ──── LEGENDARY (100 pts) ───────────────────────────────────────────
        { id: 'gray-wolf', name: 'Gray Wolf', emoji: '🐺',
          rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','pacific-northwest','alaska'],
          groups: ['wild-five'] },
        { id: 'grizzly-bear', name: 'Grizzly Bear', emoji: '🐻',
          rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','alaska'],
          groups: ['wild-five'] },
        { id: 'american-bison', name: 'American Bison', emoji: '🦬',
          rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','midwest'],
          groups: ['wild-five'] },
        { id: 'caribou', name: 'Caribou', emoji: '🦌',
          rarity: 'legendary', roadkillable: true,
          regions: ['alaska'],
          groups: ['antlered'] },
        { id: 'canada-lynx', name: 'Canada Lynx', emoji: '🐈',
          rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','alaska'],
          groups: [] },
        { id: 'wolverine', name: 'Wolverine', emoji: '🦡',
          rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','alaska'],
          groups: [] },
        { id: 'polar-bear', name: 'Polar Bear', emoji: '🐻‍❄️',
          rarity: 'legendary', roadkillable: false,
          regions: ['alaska'],
          groups: [] },
        { id: 'california-condor', name: 'California Condor', emoji: '🦅',
          rarity: 'legendary', roadkillable: false,
          regions: ['southwest','pacific-northwest'],
          groups: [] },

        // ──── MYTHIC (250 pts) — pure fun ───────────────────────────────────
        { id: 'sasquatch', name: 'Sasquatch (Bigfoot)', emoji: '🦶',
          rarity: 'mythic', roadkillable: false,
          regions: ['pacific-northwest','mountain-west'],
          groups: ['cryptid-quest'] },
        { id: 'chupacabra', name: 'Chupacabra', emoji: '👹',
          rarity: 'mythic', roadkillable: false,
          regions: ['southwest'],
          groups: ['cryptid-quest'] },
        { id: 'jackalope', name: 'Jackalope', emoji: '🐰',
          rarity: 'mythic', roadkillable: false,
          regions: ['mountain-west'],
          groups: ['cryptid-quest'] }
    ];

    // Helpers ───────────────────────────────────────────────────────────────

    function getAnimalById(id) {
        return ANIMALS.find(a => a.id === id) || null;
    }

    // Returns animals visible in a region. National includes everything.
    // Other regions include the region's natives + a small "wandering" set
    // (out-of-region) so the grid still feels alive.
    function animalsForRegion(region) {
        if (!region || region === 'national') return ANIMALS.slice();
        const inRegion = [];
        const outOfRegion = [];
        ANIMALS.forEach(a => {
            if (a.regions.includes(region) || a.regions.includes('national')) {
                inRegion.push(a);
            } else {
                outOfRegion.push(a);
            }
        });
        return inRegion.concat(outOfRegion);
    }

    function isOutOfRegion(animal, region) {
        if (!region || region === 'national') return false;
        return !animal.regions.includes(region) && !animal.regions.includes('national');
    }

    // Returns total points for a single spot.
    //   kind = 'live' | 'roadkill'
    //   region = current trip region
    function pointsForSpot(animal, kind, region) {
        const base = (RARITY[animal.rarity] || RARITY.common).points;
        const ofr = isOutOfRegion(animal, region);
        const multiplier = ofr ? 1.5 : 1;
        const roadkillExtra = (kind === 'roadkill') ? ROADKILL_BONUS : 0;
        return Math.round(base * multiplier) + roadkillExtra;
    }

    // Computes earned bonus group ids given a `spots` map: id -> {live, roadkill}
    // Returns array of group ids that are complete.
    function earnedGroups(spots) {
        const earned = [];
        Object.entries(GROUPS).forEach(([gid, g]) => {
            if (g.special === 'anyRoadkill') {
                const roadkillCount = Object.values(spots || {})
                    .filter(s => s && s.roadkill).length;
                if (roadkillCount >= (g.threshold || 5)) earned.push(gid);
                return;
            }
            const allFound = (g.members || []).every(mid => {
                const s = spots && spots[mid];
                return s && (s.live || s.roadkill);
            });
            if (allFound) earned.push(gid);
        });
        return earned;
    }

    // Total trip score: sum of spots + sum of earned group bonuses.
    function tripTotal(spots, region) {
        let total = 0;
        Object.entries(spots || {}).forEach(([id, s]) => {
            const a = getAnimalById(id);
            if (!a || !s) return;
            if (s.live) total += pointsForSpot(a, 'live', region);
            if (s.roadkill) total += pointsForSpot(a, 'roadkill', region);
        });
        earnedGroups(spots).forEach(gid => {
            total += GROUPS[gid].bonus || 0;
        });
        return total;
    }

    // Shared Firebase config (multiplayer only). Reuses PlateQuest's project
    // but writes to a separate top-level path: /animalquest/...
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyADgN2_6yMeIuWRZxsXdlUUjmZEd_Rn9qQ",
        authDomain: "platequest-multiplayer.firebaseapp.com",
        databaseURL: "https://platequest-multiplayer-default-rtdb.firebaseio.com/",
        projectId: "platequest-multiplayer",
        storageBucket: "platequest-multiplayer.firebasestorage.app",
        messagingSenderId: "109596979102",
        appId: "1:109596979102:web:586740c408daec71af708f"
    };

    const API = {
        RARITY,
        ROADKILL_BONUS,
        FIRST_FINDER_BONUS,
        REGIONS,
        GROUPS,
        ANIMALS,
        FIREBASE_CONFIG,
        getAnimalById,
        animalsForRegion,
        isOutOfRegion,
        pointsForSpot,
        earnedGroups,
        tripTotal
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = API;
    } else {
        root.AnimalQuestData = API;
    }
})(typeof window !== 'undefined' ? window : globalThis);
