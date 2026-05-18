/* AnimalQuest — shared game data
 * Used by both single-player (animalquest/index.html) and multiplayer.
 * Created by JcWolF.
 *
 * AnimalQuest © 2026 Jesse Bliss (JcWolF). All rights reserved.
 * Proprietary software — see LICENSE at repo root. Unauthorized copying,
 * modification, redistribution, or commercial use is prohibited.
 */
(function (root) {
    'use strict';

    // Rarity tiers and base point values (live spot).
    // Roadkill earns base + ROADKILL_BONUS, tracked separately.
    // Correct scientific name on the species quiz earns base again
    // (so common +5, legendary +100, mythic +250).
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
    const SPECIES_QUIZ_OPTION_COUNT = 5;

    const REGIONS = {
        northeast:           { label: 'Northeast & New England', emoji: '🍁' },
        southeast:           { label: 'Southeast & Gulf',         emoji: '🌴' },
        midwest:             { label: 'Midwest & Plains',         emoji: '🌾' },
        'mountain-west':     { label: 'Rocky Mountains',          emoji: '⛰️' },
        'pacific-northwest': { label: 'Pacific Northwest',        emoji: '🌲' },
        southwest:           { label: 'Desert Southwest',         emoji: '🌵' },
        alaska:              { label: 'Alaska & Arctic',          emoji: '❄️' },
        national:            { label: 'National (anywhere)',      emoji: '🇺🇸' }
    };

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

    // Animal list with scientific (binomial) names — used by the species quiz.
    // `roadkillable` defaults to true; explicitly false for animals that don't
    // realistically end up as roadkill (whales, eagles, alligators, cryptids…).
    const ANIMALS = [
        // ──── COMMON (5 pts) ────────────────────────────────────────────────
        { id: 'eastern-gray-squirrel', name: 'Eastern Gray Squirrel',
          scientific: 'Sciurus carolinensis',
          emoji: '🐿️', rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['backyard'] },
        { id: 'eastern-cottontail', name: 'Eastern Cottontail Rabbit',
          scientific: 'Sylvilagus floridanus',
          emoji: '🐇', rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','southwest','national'],
          groups: [] },
        { id: 'american-crow', name: 'American Crow',
          scientific: 'Corvus brachyrhynchos',
          emoji: '🐦‍⬛', rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: [] },
        { id: 'rock-pigeon', name: 'Rock Pigeon',
          scientific: 'Columba livia',
          emoji: '🕊️', rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: [] },
        { id: 'mallard', name: 'Mallard Duck',
          scientific: 'Anas platyrhynchos',
          emoji: '🦆', rarity: 'common', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['waterfowl'] },
        { id: 'canada-goose', name: 'Canada Goose',
          scientific: 'Branta canadensis',
          emoji: '🪿', rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['waterfowl'] },
        { id: 'white-tailed-deer', name: 'White-tailed Deer',
          scientific: 'Odocoileus virginianus',
          emoji: '🦌', rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['antlered'] },
        { id: 'cow', name: 'Cow (Domestic)',
          scientific: 'Bos taurus',
          emoji: '🐄', rarity: 'common', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['farm-friends'] },
        { id: 'horse', name: 'Horse (Domestic)',
          scientific: 'Equus caballus',
          emoji: '🐴', rarity: 'common', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['farm-friends'] },
        { id: 'garter-snake', name: 'Common Garter Snake',
          scientific: 'Thamnophis sirtalis',
          emoji: '🐍', rarity: 'common', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['cold-blooded'] },

        // ──── UNCOMMON (10 pts) ─────────────────────────────────────────────
        { id: 'raccoon', name: 'Raccoon',
          scientific: 'Procyon lotor',
          emoji: '🦝', rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['backyard'] },
        { id: 'virginia-opossum', name: 'Virginia Opossum',
          scientific: 'Didelphis virginiana',
          emoji: '🐀', rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','pacific-northwest','national'],
          groups: ['backyard'] },
        { id: 'striped-skunk', name: 'Striped Skunk',
          scientific: 'Mephitis mephitis',
          emoji: '🦨', rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['backyard'] },
        { id: 'eastern-chipmunk', name: 'Eastern Chipmunk',
          scientific: 'Tamias striatus',
          emoji: '🐿️', rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','midwest','mountain-west','national'],
          groups: ['backyard'] },
        { id: 'red-tailed-hawk', name: 'Red-tailed Hawk',
          scientific: 'Buteo jamaicensis',
          emoji: '🦅', rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['sky-hunters'] },
        { id: 'wild-turkey', name: 'Wild Turkey',
          scientific: 'Meleagris gallopavo',
          emoji: '🦃', rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: [] },
        { id: 'great-blue-heron', name: 'Great Blue Heron',
          scientific: 'Ardea herodias',
          emoji: '🪶', rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['waterfowl'] },
        { id: 'coyote', name: 'Coyote',
          scientific: 'Canis latrans',
          emoji: '🐺', rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','alaska','national'],
          groups: [] },
        { id: 'groundhog', name: 'Groundhog (Woodchuck)',
          scientific: 'Marmota monax',
          emoji: '🦦', rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','midwest','southeast'],
          groups: [] },
        { id: 'turkey-vulture', name: 'Turkey Vulture',
          scientific: 'Cathartes aura',
          emoji: '🦃', rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['sky-hunters'] },
        { id: 'pig', name: 'Pig (Domestic)',
          scientific: 'Sus scrofa domesticus',
          emoji: '🐖', rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['farm-friends'] },
        { id: 'sheep', name: 'Sheep (Domestic)',
          scientific: 'Ovis aries',
          emoji: '🐑', rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['farm-friends'] },
        { id: 'goat', name: 'Goat (Domestic)',
          scientific: 'Capra hircus',
          emoji: '🐐', rarity: 'uncommon', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','national'],
          groups: ['farm-friends'] },
        { id: 'bullfrog', name: 'American Bullfrog',
          scientific: 'Lithobates catesbeianus',
          emoji: '🐸', rarity: 'uncommon', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['cold-blooded'] },

        // ──── RARE (25 pts) ─────────────────────────────────────────────────
        { id: 'red-fox', name: 'Red Fox',
          scientific: 'Vulpes vulpes',
          emoji: '🦊', rarity: 'rare', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','alaska','national'],
          groups: [] },
        { id: 'black-bear', name: 'American Black Bear',
          scientific: 'Ursus americanus',
          emoji: '🐻', rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','mountain-west','pacific-northwest','alaska'],
          groups: [] },
        { id: 'bald-eagle', name: 'Bald Eagle',
          scientific: 'Haliaeetus leucocephalus',
          emoji: '🦅', rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','alaska','national'],
          groups: ['wild-five','sky-hunters'] },
        { id: 'beaver', name: 'American Beaver',
          scientific: 'Castor canadensis',
          emoji: '🦫', rarity: 'rare', roadkillable: true,
          regions: ['northeast','midwest','mountain-west','pacific-northwest','alaska','national'],
          groups: [] },
        { id: 'river-otter', name: 'North American River Otter',
          scientific: 'Lontra canadensis',
          emoji: '🦦', rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','alaska'],
          groups: [] },
        { id: 'armadillo', name: 'Nine-banded Armadillo',
          scientific: 'Dasypus novemcinctus',
          emoji: '🦡', rarity: 'rare', roadkillable: true,
          regions: ['southeast','southwest'],
          groups: [] },
        { id: 'wild-boar', name: 'Wild Boar',
          scientific: 'Sus scrofa',
          emoji: '🐗', rarity: 'rare', roadkillable: true,
          regions: ['southeast','southwest','pacific-northwest'],
          groups: [] },
        { id: 'snapping-turtle', name: 'Common Snapping Turtle',
          scientific: 'Chelydra serpentina',
          emoji: '🐢', rarity: 'rare', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','national'],
          groups: ['cold-blooded'] },
        { id: 'great-horned-owl', name: 'Great Horned Owl',
          scientific: 'Bubo virginianus',
          emoji: '🦉', rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest','alaska','national'],
          groups: ['sky-hunters'] },
        { id: 'brown-pelican', name: 'Brown Pelican',
          scientific: 'Pelecanus occidentalis',
          emoji: '🦤', rarity: 'rare', roadkillable: false,
          regions: ['southeast','pacific-northwest','southwest'],
          groups: ['waterfowl'] },
        { id: 'roadrunner', name: 'Greater Roadrunner',
          scientific: 'Geococcyx californianus',
          emoji: '🏃', rarity: 'rare', roadkillable: false,
          regions: ['southwest'],
          groups: [] },
        { id: 'trumpeter-swan', name: 'Trumpeter Swan',
          scientific: 'Cygnus buccinator',
          emoji: '🦢', rarity: 'rare', roadkillable: false,
          regions: ['midwest','mountain-west','pacific-northwest','alaska'],
          groups: ['waterfowl'] },
        { id: 'osprey', name: 'Osprey',
          scientific: 'Pandion haliaetus',
          emoji: '🪶', rarity: 'rare', roadkillable: false,
          regions: ['northeast','southeast','pacific-northwest','mountain-west','national'],
          groups: ['sky-hunters'] },
        { id: 'horned-lizard', name: 'Texas Horned Lizard',
          scientific: 'Phrynosoma cornutum',
          emoji: '🦎', rarity: 'rare', roadkillable: true,
          regions: ['southwest','mountain-west'],
          groups: ['cold-blooded'] },

        // ──── EPIC (50 pts) ─────────────────────────────────────────────────
        { id: 'moose', name: 'Moose',
          scientific: 'Alces alces',
          emoji: '🫎', rarity: 'epic', roadkillable: true,
          regions: ['northeast','mountain-west','pacific-northwest','alaska'],
          groups: ['antlered'] },
        { id: 'elk', name: 'Elk (Wapiti)',
          scientific: 'Cervus canadensis',
          emoji: '🦌', rarity: 'epic', roadkillable: true,
          regions: ['mountain-west','pacific-northwest','alaska'],
          groups: ['antlered'] },
        { id: 'bighorn-sheep', name: 'Bighorn Sheep',
          scientific: 'Ovis canadensis',
          emoji: '🐏', rarity: 'epic', roadkillable: false,
          regions: ['mountain-west','southwest'],
          groups: [] },
        { id: 'mountain-goat', name: 'Mountain Goat',
          scientific: 'Oreamnos americanus',
          emoji: '🐐', rarity: 'epic', roadkillable: false,
          regions: ['mountain-west','pacific-northwest','alaska'],
          groups: [] },
        { id: 'mountain-lion', name: 'Mountain Lion (Cougar)',
          scientific: 'Puma concolor',
          emoji: '🦁', rarity: 'epic', roadkillable: false,
          regions: ['mountain-west','pacific-northwest','southwest'],
          groups: ['wild-five'] },
        { id: 'american-alligator', name: 'American Alligator',
          scientific: 'Alligator mississippiensis',
          emoji: '🐊', rarity: 'epic', roadkillable: false,
          regions: ['southeast'],
          groups: ['cold-blooded'] },
        { id: 'bobcat', name: 'Bobcat',
          scientific: 'Lynx rufus',
          emoji: '🐈', rarity: 'epic', roadkillable: true,
          regions: ['northeast','southeast','midwest','mountain-west','pacific-northwest','southwest'],
          groups: [] },
        { id: 'pronghorn', name: 'Pronghorn',
          scientific: 'Antilocapra americana',
          emoji: '🦌', rarity: 'epic', roadkillable: true,
          regions: ['mountain-west','midwest','southwest'],
          groups: ['antlered'] },
        { id: 'manatee', name: 'West Indian Manatee',
          scientific: 'Trichechus manatus',
          emoji: '🐋', rarity: 'epic', roadkillable: false,
          regions: ['southeast'],
          groups: [] },
        { id: 'snowy-owl', name: 'Snowy Owl',
          scientific: 'Bubo scandiacus',
          emoji: '🦉', rarity: 'epic', roadkillable: false,
          regions: ['alaska','northeast','midwest'],
          groups: [] },
        { id: 'orca', name: 'Orca (Killer Whale)',
          scientific: 'Orcinus orca',
          emoji: '🐋', rarity: 'epic', roadkillable: false,
          regions: ['pacific-northwest','alaska'],
          groups: [] },
        { id: 'javelina', name: 'Collared Peccary (Javelina)',
          scientific: 'Pecari tajacu',
          emoji: '🐗', rarity: 'epic', roadkillable: true,
          regions: ['southwest'],
          groups: [] },

        // ──── LEGENDARY (100 pts) ───────────────────────────────────────────
        { id: 'gray-wolf', name: 'Gray Wolf',
          scientific: 'Canis lupus',
          emoji: '🐺', rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','pacific-northwest','alaska'],
          groups: ['wild-five'] },
        { id: 'grizzly-bear', name: 'Grizzly Bear',
          scientific: 'Ursus arctos horribilis',
          emoji: '🐻', rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','alaska'],
          groups: ['wild-five'] },
        { id: 'american-bison', name: 'American Bison',
          scientific: 'Bison bison',
          emoji: '🦬', rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','midwest'],
          groups: ['wild-five'] },
        { id: 'caribou', name: 'Caribou (Reindeer)',
          scientific: 'Rangifer tarandus',
          emoji: '🦌', rarity: 'legendary', roadkillable: true,
          regions: ['alaska'],
          groups: ['antlered'] },
        { id: 'canada-lynx', name: 'Canada Lynx',
          scientific: 'Lynx canadensis',
          emoji: '🐈', rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','alaska'],
          groups: [] },
        { id: 'wolverine', name: 'Wolverine',
          scientific: 'Gulo gulo',
          emoji: '🦡', rarity: 'legendary', roadkillable: false,
          regions: ['mountain-west','alaska'],
          groups: [] },
        { id: 'polar-bear', name: 'Polar Bear',
          scientific: 'Ursus maritimus',
          emoji: '🐻‍❄️', rarity: 'legendary', roadkillable: false,
          regions: ['alaska'],
          groups: [] },
        { id: 'california-condor', name: 'California Condor',
          scientific: 'Gymnogyps californianus',
          emoji: '🦅', rarity: 'legendary', roadkillable: false,
          regions: ['southwest','pacific-northwest'],
          groups: [] },

        // ──── MYTHIC (250 pts) — pure fun (cryptid Latin is jokes) ──────────
        { id: 'sasquatch', name: 'Sasquatch (Bigfoot)',
          scientific: 'Hominoides cryptidicus',
          emoji: '🦶', rarity: 'mythic', roadkillable: false,
          regions: ['pacific-northwest','mountain-west'],
          groups: ['cryptid-quest'] },
        { id: 'chupacabra', name: 'Chupacabra',
          scientific: 'Canis chupacabrensis',
          emoji: '👹', rarity: 'mythic', roadkillable: false,
          regions: ['southwest'],
          groups: ['cryptid-quest'] },
        { id: 'jackalope', name: 'Jackalope',
          scientific: 'Lepus cornutus',
          emoji: '🐰', rarity: 'mythic', roadkillable: false,
          regions: ['mountain-west'],
          groups: ['cryptid-quest'] }
    ];

    // Helpers ───────────────────────────────────────────────────────────────

    function getAnimalById(id) {
        return ANIMALS.find(a => a.id === id) || null;
    }

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

    // Total points for a single spot (live or roadkill).
    function pointsForSpot(animal, kind, region) {
        const base = (RARITY[animal.rarity] || RARITY.common).points;
        const ofr = isOutOfRegion(animal, region);
        const multiplier = ofr ? 1.5 : 1;
        const roadkillExtra = (kind === 'roadkill') ? ROADKILL_BONUS : 0;
        return Math.round(base * multiplier) + roadkillExtra;
    }

    // Bonus for getting the scientific name correct on the species quiz.
    // Equal to the rarity's base points (so common +5, legendary +100).
    function speciesBonusPoints(animal) {
        return (RARITY[animal.rarity] || RARITY.common).points;
    }

    // Build a 5-option multiple-choice quiz for an animal. The correct answer
    // is the animal's scientific name; distractors are pulled from animals at
    // the same rarity tier (or the full pool if the tier is too small).
    function quizOptions(animal, count) {
        const target = count || SPECIES_QUIZ_OPTION_COUNT;
        if (!animal || !animal.scientific) return [];
        const pool = ANIMALS.filter(a =>
            a.id !== animal.id &&
            a.scientific &&
            a.scientific !== animal.scientific
        );
        const sameTier = pool.filter(a => a.rarity === animal.rarity);
        const primary = sameTier.length >= (target - 1) ? sameTier : pool;
        const shuffled = primary.slice().sort(() => Math.random() - 0.5);
        const distractors = shuffled.slice(0, target - 1).map(a => a.scientific);
        const options = [animal.scientific, ...distractors];
        return options.sort(() => Math.random() - 0.5);
    }

    // Earned bonus group ids given a flat spots map: id -> { live, roadkill }.
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

    // Trip total: sum of spots + species bonuses + group bonuses.
    function tripTotal(spots, region) {
        let total = 0;
        Object.entries(spots || {}).forEach(([id, s]) => {
            const a = getAnimalById(id);
            if (!a || !s) return;
            if (s.live) total += pointsForSpot(a, 'live', region);
            if (s.roadkill) total += pointsForSpot(a, 'roadkill', region);
            if (s.species) total += speciesBonusPoints(a);
        });
        earnedGroups(spots).forEach(gid => {
            total += GROUPS[gid].bonus || 0;
        });
        return total;
    }

    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyCP7wJIufoS6_BVwlaBXtF0SOzqujN-uHo",
        authDomain: "sparkasia-studios.firebaseapp.com",
        databaseURL: "https://sparkasia-studios-default-rtdb.firebaseio.com/",
        projectId: "sparkasia-studios",
        storageBucket: "sparkasia-studios.firebasestorage.app",
        messagingSenderId: "1056103344185",
        appId: "1:1056103344185:web:7016bd6ad39b7a87cec5e8"
    };

    const API = {
        RARITY,
        ROADKILL_BONUS,
        FIRST_FINDER_BONUS,
        SPECIES_QUIZ_OPTION_COUNT,
        REGIONS,
        GROUPS,
        ANIMALS,
        FIREBASE_CONFIG,
        getAnimalById,
        animalsForRegion,
        isOutOfRegion,
        pointsForSpot,
        speciesBonusPoints,
        quizOptions,
        earnedGroups,
        tripTotal
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = API;
    } else {
        root.AnimalQuestData = API;
    }
})(typeof window !== 'undefined' ? window : globalThis);
