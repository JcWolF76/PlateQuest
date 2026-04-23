// PlateQuest Multiplayer v2
// Durable room membership, stable player identity, silent rejoin,
// first-finder tags, host-configured trip play area, and optional Canada support.

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
    { name: "Vermont", abbr: "VT", category: "us" }, { name: "Virginia", abbr: "VA", category: "us" }, { name: "Washington", abbr: "WA", category: "us" }, { name: "West Virginia", abbr: "WV", category: "us" },
    { name: "Wisconsin", abbr: "WI", category: "us" }, { name: "Wyoming", abbr: "WY", category: "us" }
];

const TERRITORY_PLATES = [
    { name: "Puerto Rico",              abbr: "PR",   category: "territory" },
    { name: "U.S. Virgin Islands",      abbr: "USVI", category: "territory" },
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
    // Broad regions
    eastern_us:        { label: 'Eastern US' },
    western_us:        { label: 'Western US' },
    // East
    northeast:         { label: 'Northeast' },
    mid_atlantic:      { label: 'Mid-Atlantic' },
    southeast:         { label: 'Southeast' },
    south:             { label: 'Southern States' },
    gulf_coast:        { label: 'Gulf Coast' },
    // Central
    midwest:           { label: 'Midwest' },
    great_plains:      { label: 'Great Plains' },
    // West
    mountain_west:     { label: 'Mountain West' },
    southwest:         { label: 'Southwest' },
    pacific_northwest: { label: 'Pacific Northwest' },
    west_coast:        { label: 'West Coast' },
    // National
    national:          { label: 'National / Balanced' },
    // Legacy keys (existing packs may use these)
    east_coast:        { label: 'East Coast' }
};

const SUB_REGIONS = {
    new_england:      { label: 'New England',       states: ['Maine','New Hampshire','Vermont','Massachusetts','Rhode Island','Connecticut'] },
    mid_atlantic:     { label: 'Mid-Atlantic',       states: ['New York','New Jersey','Pennsylvania','Delaware','Maryland'] },
    appalachian:      { label: 'Appalachian',        states: ['West Virginia','Virginia','Kentucky','Tennessee','North Carolina'] },
    eastern_seaboard: { label: 'Eastern Seaboard',  states: ['Maine','New Hampshire','Massachusetts','Rhode Island','Connecticut','New York','New Jersey','Pennsylvania','Delaware','Maryland','Virginia','North Carolina','South Carolina','Georgia','Florida'] },
    great_lakes:      { label: 'Great Lakes',        states: ['Michigan','Ohio','Indiana','Illinois','Wisconsin','Minnesota'] },
    midwest_plains:   { label: 'Midwest Plains',     states: ['Iowa','Missouri','North Dakota','South Dakota','Nebraska','Kansas'] },
    deep_south:       { label: 'Deep South',         states: ['Alabama','Mississippi','Georgia','South Carolina'] },
    gulf_coast:       { label: 'Gulf Coast',         states: ['Florida','Alabama','Mississippi','Louisiana','Texas'] },
    south_central:    { label: 'South Central',      states: ['Arkansas','Louisiana','Oklahoma','Texas'] },
    mountain_west:    { label: 'Mountain West',      states: ['Montana','Idaho','Wyoming','Colorado','Utah','Nevada'] },
    desert_southwest: { label: 'Desert Southwest',   states: ['Arizona','New Mexico','Nevada'] },
    pacific_northwest:{ label: 'Pacific Northwest',  states: ['Washington','Oregon'] },
    pacific_coast:    { label: 'Pacific Coast',      states: ['California','Oregon','Washington'] },
    non_contiguous:   { label: 'Non-Contiguous',     states: ['Alaska','Hawaii'] },
    canada_east:      { label: 'Eastern Canada',     states: ['Ontario','Quebec','New Brunswick','Nova Scotia','Prince Edward Island','Newfoundland and Labrador'] },
    canada_central:   { label: 'Central Canada',     states: ['Manitoba','Saskatchewan'] },
    canada_west:      { label: 'Western Canada',     states: ['Alberta','British Columbia'] },
    canada_territories:{ label: 'Canadian Territories', states: ['Yukon','Northwest Territories','Nunavut'] }
};

// Primary regions with state lists for completion tracking and badges.
// Keys match PRIMARY_REGIONS; state names match US_PLATES exactly.
const REGION_STATES = {
    northeast:         ['Maine','New Hampshire','Vermont','Massachusetts','Rhode Island','Connecticut','New York','New Jersey','Pennsylvania'],
    mid_atlantic:      ['New York','New Jersey','Pennsylvania','Delaware','Maryland','Virginia','West Virginia'],
    southeast:         ['Virginia','North Carolina','South Carolina','Georgia','Florida'],
    south:             ['Tennessee','Kentucky','Alabama','Mississippi','Arkansas','Louisiana'],
    gulf_coast:        ['Florida','Alabama','Mississippi','Louisiana','Texas'],
    midwest:           ['Ohio','Michigan','Indiana','Illinois','Wisconsin','Minnesota','Iowa','Missouri'],
    great_plains:      ['North Dakota','South Dakota','Nebraska','Kansas','Missouri','Iowa'],
    mountain_west:     ['Montana','Idaho','Wyoming','Colorado','Utah','Nevada'],
    southwest:         ['Arizona','New Mexico','Texas','Nevada'],
    pacific_northwest: ['Washington','Oregon'],
    west_coast:        ['Washington','Oregon','California'],
};

const PLAY_AREA_PRESETS = {
    northeast:         ['ME','NH','VT','MA','RI','CT','NY','NJ','PA'],
    mid_atlantic:      ['NY','NJ','PA','DE','MD','VA','WV'],
    southeast:         ['VA','NC','SC','GA','FL'],
    gulf_coast:        ['FL','AL','MS','LA','TX'],
    midwest:           ['OH','MI','IN','IL','WI','MN','IA','MO'],
    great_plains:      ['ND','SD','NE','KS','MO','IA'],
    mountain_west:     ['MT','ID','WY','CO','UT','NV'],
    southwest:         ['AZ','NM','TX','NV'],
    pacific_northwest: ['WA','OR'],
    west_coast:        ['WA','OR','CA'],
    eastern_us:        ['ME','NH','VT','MA','RI','CT','NY','NJ','PA','DE','MD','VA','WV','NC','SC','GA','FL','OH','MI','IN','IL','WI','MN','IA','MO','KY','TN','AL','MS','AR','LA'],
    western_us:        ['MT','ID','WY','CO','UT','NV','AZ','NM','WA','OR','CA','ND','SD','NE','KS','OK','TX','AK','HI'],
    west:              ['WA','OR','CA','ID','NV','UT','AZ','MT','WY','CO','NM','AK','HI']  // legacy
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
    'Delaware':       ['Maryland','New Jersey','Pennsylvania'],
    'Florida':        ['Alabama','Georgia'],
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
    'Maryland':       ['Delaware','Pennsylvania','Virginia','West Virginia'],
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
    'Virginia':       ['Kentucky','Maryland','North Carolina','Tennessee','West Virginia'],
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

const TERRITORY_NAMES    = new Set(['Puerto Rico','U.S. Virgin Islands','American Samoa','Guam','Northern Mariana Islands']);
const CANADIAN_TERRITORIES = new Set(['Yukon','Northwest Territories','Nunavut']);
const NON_CONTIGUOUS     = new Set(['Alaska','Hawaii']);

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
    { id:'found_usvi',        group:'elite',       icon:'🏝️',label:'Island Hopper',    desc:'Found U.S. Virgin Islands',      test:s=>s.foundSet.has('U.S. Virgin Islands') },
    { id:'found_as',          group:'elite',       icon:'🌏', label:'Pacific Isle',     desc:'Found American Samoa',           test:s=>s.foundSet.has('American Samoa') },
    { id:'found_guam',        group:'elite',       icon:'🌐', label:'Pacific Rim',      desc:'Found Guam',                     test:s=>s.foundSet.has('Guam') },
    { id:'found_cnmi',        group:'elite',       icon:'🗺️',label:'Marianas',         desc:'Found Northern Mariana Islands', test:s=>s.foundSet.has('Northern Mariana Islands') },
    { id:'territory_hunter',  group:'elite',       icon:'🎖️',label:'Territory Hunter', desc:'Found all 5 U.S. territories',  test:s=>['Puerto Rico','U.S. Virgin Islands','American Samoa','Guam','Northern Mariana Islands'].every(t=>s.foundSet.has(t)) },
    // Sub-region completions
    { id:'sub_new_england',   group:'region', icon:'🦞', label:'New England',       desc:'Completed New England',       test:s=>s.completedSubs.includes('new_england') },
    { id:'sub_mid_atlantic',  group:'region', icon:'🗽', label:'Mid-Atlantic',       desc:'Completed Mid-Atlantic',      test:s=>s.completedSubs.includes('mid_atlantic') },
    { id:'sub_appalachian',   group:'region', icon:'⛰️', label:'Appalachian',        desc:'Completed Appalachian',       test:s=>s.completedSubs.includes('appalachian') },
    { id:'sub_great_lakes',   group:'region', icon:'🚢', label:'Great Lakes',        desc:'Completed Great Lakes',       test:s=>s.completedSubs.includes('great_lakes') },
    { id:'sub_midwest_plains',group:'region', icon:'🌾', label:'Midwest Plains',     desc:'Completed Midwest Plains',    test:s=>s.completedSubs.includes('midwest_plains') },
    { id:'sub_deep_south',    group:'region', icon:'🌿', label:'Deep South',         desc:'Completed Deep South',        test:s=>s.completedSubs.includes('deep_south') },
    { id:'sub_gulf_coast',    group:'region', icon:'🦈', label:'Gulf Coast',         desc:'Completed Gulf Coast',        test:s=>s.completedSubs.includes('gulf_coast') },
    { id:'sub_south_central', group:'region', icon:'🤠', label:'South Central',      desc:'Completed South Central',     test:s=>s.completedSubs.includes('south_central') },
    { id:'sub_mountain_west', group:'region', icon:'🏔️', label:'Mountain West',      desc:'Completed Mountain West',     test:s=>s.completedSubs.includes('mountain_west') },
    { id:'sub_desert_sw',     group:'region', icon:'🌵', label:'Desert Southwest',   desc:'Completed Desert Southwest',  test:s=>s.completedSubs.includes('desert_southwest') },
    { id:'sub_pacific_nw',    group:'region', icon:'🌲', label:'Pacific NW',         desc:'Completed Pacific Northwest', test:s=>s.completedSubs.includes('pacific_northwest') },
    { id:'sub_pacific_coast', group:'region', icon:'🏄', label:'Pacific Coast',      desc:'Completed Pacific Coast',     test:s=>s.completedSubs.includes('pacific_coast') },
    { id:'sub_non_contiguous',group:'region', icon:'✈️', label:'Non-Contiguous',     desc:'Found Alaska & Hawaii',       test:s=>s.completedSubs.includes('non_contiguous') },
    // Canadian sub-region completions
    { id:'sub_canada_east',        group:'region', icon:'🍁', label:'Eastern Canada',    desc:'Completed Eastern Canada',           test:s=>s.completedSubs.includes('canada_east') },
    { id:'sub_canada_central',     group:'region', icon:'🦌', label:'Central Canada',    desc:'Completed Central Canada',           test:s=>s.completedSubs.includes('canada_central') },
    { id:'sub_canada_west',        group:'region', icon:'🦫', label:'Western Canada',    desc:'Completed Western Canada',           test:s=>s.completedSubs.includes('canada_west') },
    { id:'sub_canada_territories', group:'region', icon:'🌌', label:'Great White North', desc:'Completed the Canadian Territories', test:s=>s.completedSubs.includes('canada_territories') },
    // Primary region completions
    { id:'region_northeast',     group:'region', icon:'🗽', label:'The Northeast',   desc:'Completed the Northeast',         test:s=>s.completedRegions?.includes('northeast') },
    { id:'region_mid_atlantic',  group:'region', icon:'🦀', label:'Mid-Atlantic',    desc:'Completed the Mid-Atlantic',      test:s=>s.completedRegions?.includes('mid_atlantic') },
    { id:'region_southeast',     group:'region', icon:'🌴', label:'The Southeast',   desc:'Completed the Southeast',         test:s=>s.completedRegions?.includes('southeast') },
    { id:'region_south',         group:'region', icon:'🎸', label:'The South',       desc:'Completed the South',             test:s=>s.completedRegions?.includes('south') },
    { id:'region_gulf_coast',    group:'region', icon:'🦐', label:'Gulf Coast',      desc:'Completed the Gulf Coast',        test:s=>s.completedRegions?.includes('gulf_coast') },
    { id:'region_midwest',       group:'region', icon:'🌽', label:'The Midwest',     desc:'Completed the Midwest',           test:s=>s.completedRegions?.includes('midwest') },
    { id:'region_great_plains',  group:'region', icon:'🦬', label:'Great Plains',    desc:'Completed the Great Plains',      test:s=>s.completedRegions?.includes('great_plains') },
    { id:'region_mountain_west', group:'region', icon:'🏔️',label:'Mountain West',   desc:'Completed the Mountain West',     test:s=>s.completedRegions?.includes('mountain_west') },
    { id:'region_southwest',     group:'region', icon:'🌵', label:'The Southwest',   desc:'Completed the Southwest',         test:s=>s.completedRegions?.includes('southwest') },
    { id:'region_pacific_nw',    group:'region', icon:'🌲', label:'Pacific NW',      desc:'Completed the Pacific Northwest', test:s=>s.completedRegions?.includes('pacific_northwest') },
    { id:'region_west_coast',    group:'region', icon:'🏄', label:'West Coast',      desc:'Completed the West Coast',        test:s=>s.completedRegions?.includes('west_coast') },
    // Travel corridor
    { id:'corridor_complete', group:'corridor', icon:'🛣️',label:'Home Ground',       desc:'Found all corridor plates',   test:s=>s.corridorComplete },
];

const STORAGE_KEYS = {
    name: 'platequest_player_name',
    tag: 'platequest_player_tag',
    player: 'platequest_player_identity_v2',
    session: 'platequest_active_session_v2',
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
let gameListenerAttached = false;
let eventsBound = false;
let attemptedAutoResume = false;
let currentConnectionState = 'connecting';
let presenceCleanup = null;
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
function normalizeTagInput(value) { return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8); }
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
    document.getElementById('playerTagInput').value = tag;
    if (!name) { showToast('Please enter your name! 👤', 'error'); document.getElementById('playerNameInput').focus(); return null; }
    if (!tag) { showToast('Please enter a player tag! 🏷️', 'error'); document.getElementById('playerTagInput').focus(); return null; }
    if (name.length > 20) { showToast('Name must be 20 characters or less.', 'error'); return null; }
    if (!/^[A-Z0-9]+$/.test(tag)) { showToast('Tag can only contain letters and numbers.', 'error'); return null; }
    const playerKey = `${slugify(name)}__${slugify(tag)}`;
    return { playerKey, deviceId: getOrCreateDeviceId(), name, tag, displayName: `${name} (${tag})`, colorSeed: slugify(`${name}_${tag}`), updatedAtLocal: Date.now() };
}

function buildPlayerIdentity(name, tag, extras = {}) {
    const normalizedTag = normalizeTagInput(tag);
    return { playerKey: `${slugify(name)}__${slugify(normalizedTag)}`, deviceId: extras.deviceId || getOrCreateDeviceId(), name, tag: normalizedTag, displayName: `${name} (${normalizedTag})`, colorSeed: slugify(`${name}_${normalizedTag}`), updatedAtLocal: Date.now(), legacyPlayerId: extras.legacyPlayerId || null };
}

function persistIdentity(player) {
    localStorage.setItem(STORAGE_KEYS.name, player.name);
    localStorage.setItem(STORAGE_KEYS.tag, player.tag);
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
    return { playerKey: player.playerKey, deviceId: player.deviceId, name: player.name, tag: player.tag, displayName: player.displayName, isHost: Boolean(options.isHost), connected: true, joinedAt: options.joinedAt || now, lastSeen: now, states: options.states || {}, role: options.isHost ? 'host' : 'player' };
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
        renderPlayAreaSelector();
        restoreIdentity();
        initializeDarkMode();
        pendingGameCodeFromUrl = readGameCodeFromUrl() || getPendingJoinReload();
        updateDiagnosticsPanel();
        database.ref('.info/connected').on('value', async (snapshot) => {
            const isConnected = snapshot.val() === true;
            currentConnectionState = isConnected ? 'online' : 'offline';
            updateConnectionStatus(isConnected ? 'online' : 'offline');
            updateDiagnosticsPanel();
            if (isConnected) {
                if (!attemptedAutoResume) { attemptedAutoResume = true; await attemptAutoResume(); }
                if (currentGameCode && currentPlayer) setupPresence();
            }
        });
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        firebaseReady = false;
        updateConnectionStatus('offline');
        bindEventListeners();
        renderPlayAreaSelector();
        restoreIdentity();
        initializeDarkMode();
        pendingGameCodeFromUrl = readGameCodeFromUrl() || getPendingJoinReload();
        updateDiagnosticsPanel();
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
    document.getElementById('joinGameBtn').addEventListener('click', joinGame);
    newGameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') createGame(); });
    joinCodeInput.addEventListener('input', () => { joinCodeInput.value = normalizeCodeInput(joinCodeInput.value); });
    joinCodeInput.addEventListener('paste', (e) => { e.preventDefault(); joinCodeInput.value = normalizeCodeInput((e.clipboardData || window.clipboardData).getData('text')); });
    joinCodeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') joinGame(); });
    document.getElementById('resetMyProgressBtn').addEventListener('click', resetMyProgress);
    document.getElementById('leaveGameBtn').addEventListener('click', leaveGame);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('copyCodeBtn').addEventListener('click', copyGameCode);
    document.getElementById('shareCodeBtn').addEventListener('click', shareGameCode);
    document.getElementById('inviteNewBtn').addEventListener('click', inviteNewPlayer);
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveGameSession(); else if (currentGameCode && currentPlayer && currentConnectionState === 'online') { setupPresence(); updateDiagnosticsPanel(); } });
    window.addEventListener('pageshow', async (event) => { if (event.persisted && currentPlayer && !currentGameCode) await attemptAutoResume(); else if (event.persisted && currentGameCode && currentPlayer && currentConnectionState === 'online') { setupPresence(); updateDiagnosticsPanel(); } });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); setDiagnosticsVisible(); }
        if (e.key === 'Escape') { closePlayerDetail(); closeAnnounceModal(); }
    });
    const closeDetailBtn = document.getElementById('closePlayerDetailBtn');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closePlayerDetail);
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
    currentPlayer = player;
    persistIdentity(player);
    enableGameCards();
    showToast(`Welcome to the pack, ${player.displayName}! 🐺`, 'success');
    if (pendingGameCodeFromUrl && game.style.display === 'block') document.getElementById('joinCodeInput').value = pendingGameCodeFromUrl;
    updateDiagnosticsPanel();
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
            settings: { maxPlayers: MAX_PLAYERS, playRegion, plateScope, playAreaStates },
            hostPlayerKey: currentPlayer.playerKey,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            claimedStates: {},
            players: { [currentPlayer.playerKey]: buildPlayerRoomRecord(currentPlayer, { isHost: true }) }
        };
        await roomRef.set(roomData);
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
    const code = normalizeCodeInput(codeOverride || document.getElementById('joinCodeInput').value || '');
    document.getElementById('joinCodeInput').value = code;
    if (!code || code.length !== 6) { showToast('Pack code must be 6 characters.', 'error'); document.getElementById('joinCodeInput').focus(); return; }
    showLoading('Joining pack...');
    try { await connectToGame(code, { showJoinedToast: true }); clearPendingJoinReload(); }
    catch (error) {
        console.error('Error joining game:', error);
        const shouldReloadOnce = !getPendingJoinReload() && (/not found/i.test(error.message || '') || /permission_denied/i.test(error.message || '') || /network/i.test(error.message || ''));
        if (shouldReloadOnce) { showToast('Refreshing once to join the pack…', 'info'); reloadForJoin(code); return; }
        clearPendingJoinReload();
        showToast(error.message || 'Failed to join pack.', 'error');
    } finally { hideLoading(); }
}

async function connectToGame(code, options = {}) {
    const roomRef = database.ref(`games/${code}`);
    const snapshot = await roomRef.once('value');
    if (!snapshot.exists()) throw new Error('Pack not found. Please check the code.');
    const room = snapshot.val();
    const normalizedPlayers = normalizePlayers(room.players || {});
    const existingPlayer = normalizedPlayers[currentPlayer.playerKey];
    if (!existingPlayer && currentPlayer.legacyPlayerId && normalizedPlayers[currentPlayer.legacyPlayerId]) {
        const legacyPlayer = normalizedPlayers[currentPlayer.legacyPlayerId];
        await roomRef.child(`players/${currentPlayer.legacyPlayerId}`).remove().catch(() => {});
        normalizedPlayers[currentPlayer.playerKey] = { ...legacyPlayer, playerKey: currentPlayer.playerKey, name: currentPlayer.name, tag: currentPlayer.tag, displayName: currentPlayer.displayName, deviceId: currentPlayer.deviceId };
    }
    if (!normalizedPlayers[currentPlayer.playerKey] && Object.keys(normalizedPlayers).length >= (room.settings?.maxPlayers || MAX_PLAYERS)) throw new Error('Pack is full. Maximum 8 players allowed.');
    const existing = normalizedPlayers[currentPlayer.playerKey];
    const playerRecord = buildPlayerRoomRecord(currentPlayer, { isHost: existing?.isHost || room.hostPlayerKey === currentPlayer.playerKey, joinedAt: existing?.joinedAt, states: existing?.states || {} });
    await roomRef.child(`players/${currentPlayer.playerKey}`).update(playerRecord);
    await roomRef.update({ updatedAt: firebase.database.ServerValue.TIMESTAMP });
    currentGameCode = code;
    window.currentGameCode = code;
    currentGameRef = roomRef;
    window.pausedPack = null; // clear any paused state on successful connect
    saveGameSession();
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
    if (presenceCleanup) { presenceCleanup(); presenceCleanup = null; }
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
}

function setupGameListeners() {
    if (!currentGameRef) return;
    if (gameListenerAttached) { currentGameRef.off(); gameListenerAttached = false; }
    currentGameRef.on('value', (snapshot) => {
        if (!snapshot.exists()) { showToast('Pack no longer exists.', 'error'); returnToSetup(true); return; }
        gameData = snapshot.val();
        window.gameData = gameData; // expose for companion inline script
        playersData = normalizePlayers(gameData.players || {});
        if (!playersData[currentPlayer.playerKey]) { showToast('You are no longer in this pack.', 'info'); returnToSetup(true); return; }
        lastSyncAt = Date.now();
        updateGameUI();
    });
    gameListenerAttached = true;
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
        playerRef.update({ connected: true, lastSeen: firebase.database.ServerValue.TIMESTAMP, deviceId: currentPlayer.deviceId, name: currentPlayer.name, tag: currentPlayer.tag, displayName: currentPlayer.displayName }).then(() => { lastSyncAt = Date.now(); updateDiagnosticsPanel(); }).catch((error) => console.warn('Presence update failed:', error));
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
        catch (error) { console.warn('URL join failed:', error); showToast(error.message || 'Could not join the shared pack.', 'error'); clearPendingJoinReload(); }
    }
    if (!savedSession || !savedSession.gameCode || savedSession.playerKey !== currentPlayer.playerKey) { updateDiagnosticsPanel(); return; }
    const age = Date.now() - (savedSession.savedAt || 0);
    if (age > 7 * 24 * 60 * 60 * 1000) { clearGameSession(); return; }
    try { await connectToGame(savedSession.gameCode, { showJoinedToast: true, joinedMessage: `Welcome back to pack ${savedSession.gameCode}!` }); if (game.style.display !== 'block') startGame(); }
    catch (error) { console.warn('Auto resume failed:', error); clearGameSession(); }
}

function showActiveGame() { if (splash.style.display !== 'none') splash.style.display = 'none'; game.style.display = 'block'; setupSection.style.display = 'none'; gameActive.style.display = 'block'; gameCodeHeader.style.display = 'flex'; updateGameCodeHeader(); updateDiagnosticsPanel(); }
function updateGameCodeHeader() { const persistentGameCode = document.getElementById('persistentGameCode'); if (persistentGameCode && currentGameCode) persistentGameCode.textContent = currentGameCode; }

function updateGameUI() {
    if (!gameData || !currentPlayer) return;
    detectNewFinds();
    detectNewAnnouncements();
    const isHost = gameData?.hostPlayerKey === currentPlayer.playerKey;
    const announceBtn = document.getElementById('announceBtn');
    if (announceBtn) announceBtn.style.display = isHost ? '' : 'none';
    const signature = buildStateSignature();
    if (signature === lastRenderedStateSignature) { updateScores(); updateConnectionBadgeText(); updateSetupSubtitle(); updateDiagnosticsPanel(); return; }
    lastRenderedStateSignature = signature;
    updateScores();
    renderStates();
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
        const marker = isMe ? '🐺' : (player.connected ? '👤' : '💤');
        const badges = getPlayerBadges(player.playerKey);
        const badgeRow = badges.length
            ? `<div class="badge-row">${badges.slice(0, 6).map(b => `<span class="badge-mini" title="${b.label}">${b.icon}</span>`).join('')}</div>`
            : '';
        const scoreCard = document.createElement('div');
        scoreCard.className = `score-card${isLeader ? ' leader' : ''}`;
        scoreCard.style.cursor = 'pointer';
        scoreCard.innerHTML = `
            <div class="score-player-name">${marker} ${isMe ? 'YOU' : player.displayName}${isLeader ? ' 🏆' : ''}</div>
            <div class="score-pts">${player.score}<span class="score-pts-label"> pts</span></div>
            <div class="score-meta">${player.foundCount} plates&nbsp;&nbsp;·&nbsp;&nbsp;${player.firstCount} first finds</div>
            ${badgeRow}
        `;
        scoreCard.addEventListener('click', () => openPlayerDetail(player.playerKey));
        scoresContainer.appendChild(scoreCard);
    });
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
    const myStates = getMyStatesMap();
    const plateEntries = getActivePlateEntries(gameData?.settings?.plateScope);
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
        const rarityTier = computeRarityForState(state.name, corridor);
        const rarityCfg = RARITY_CONFIG[rarityTier];
        const rarityBadge = `<div class="rarity-badge rarity-${rarityTier}" title="${rarityCfg.label} · ${rarityCfg.points} pts first find">${rarityCfg.points}pt</div>`;
        const firstFinderBadge = claim ? `<div class="ff-tag" title="First found by ${claim.displayName}">${claim.tag}</div>` : '';

        card.innerHTML = `
            <div class="license-plate-header">${plateTypeLabel}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:15px;height:calc(100% - 40px);">
                <div style="flex:1;">
                    <div style="font-size:20px;font-weight:bold;margin-bottom:8px;">${state.name}</div>
                    <div style="font-size:14px;opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:600;">${state.abbr}</div>
                </div>
                <div class="state-flag" style="width:50px;height:35px;border-radius:8px;background:linear-gradient(145deg,#95a5a6,#7f8c8d);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;color:#2c3e50;box-shadow:0 3px 10px rgba(0,0,0,0.2);border:1px solid rgba(52,152,219,0.2);overflow:hidden;position:relative;">
                    <img src="${flagImg}" alt="${state.abbr}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display='none';this.parentNode.textContent='${state.abbr}';">
                </div>
            </div>
            ${rarityBadge}
            ${firstFinderBadge}
        `;
        card.addEventListener('click', () => toggleState(state.name, foundByMe));
        card.style.animationDelay = `${index * 0.02}s`;
        statesGrid.appendChild(card);
    });
}

async function toggleState(stateName, currentlySelected) {
    if (!currentGameRef || !currentPlayer) return;
    const playerStatesRef = currentGameRef.child(`players/${currentPlayer.playerKey}/states`);
    const stateClaimRef = currentGameRef.child(`claimedStates/${stateName}`);
    try {
        if (currentlySelected) {
            await playerStatesRef.child(stateName).remove();
        } else {
            await stateClaimRef.transaction((existingClaim) => existingClaim || ({ state: stateName, playerKey: currentPlayer.playerKey, name: currentPlayer.name, tag: currentPlayer.tag, displayName: currentPlayer.displayName, claimedAt: Date.now() }));
            await playerStatesRef.child(stateName).set({ state: stateName, foundAt: firebase.database.ServerValue.TIMESTAMP, foundBy: currentPlayer.displayName, foundByKey: currentPlayer.playerKey });
            showToast(`Found ${stateName}! 🎉`, 'success');
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
    if (!confirm('Reset all your spotted plates? This cannot be undone.')) return;
    try {
        await currentGameRef.child(`players/${currentPlayer.playerKey}/states`).set({});
        await currentGameRef.update({ updatedAt: firebase.database.ServerValue.TIMESTAMP });
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
        returnToSetup(true);
    } catch (error) {
        console.error('Error leaving game:', error);
        showToast('Failed to leave pack.', 'error');
    }
}

function returnToSetup(clearSessionToo = false) {
    // Capture pack state before teardown so the setup screen can offer
    // "update settings for your active pack" when clearSessionToo is false.
    if (!clearSessionToo && currentGameCode && gameData) {
        window.pausedPack = { code: currentGameCode, data: JSON.parse(JSON.stringify(gameData)) };
    } else {
        window.pausedPack = null;
    }
    teardownCurrentRoomListeners();
    currentGameRef = null; currentGameCode = null; window.currentGameCode = null;
    gameData = null; window.gameData = null;
    playersData = {}; prevPlayerStates = null; prevAnnouncementKeys = null; lastRenderedStateSignature = ''; lastSyncAt = null;
    if (clearSessionToo) { clearGameSession(); clearGameCodeFromUrl(); clearPendingJoinReload(); }
    gameCodeHeader.style.display = 'none'; setupSection.style.display = 'block'; gameActive.style.display = 'none';
    document.getElementById('newGameInput').value = ''; document.getElementById('joinCodeInput').value = pendingGameCodeFromUrl || '';
    document.getElementById('gameSubtitle').textContent = 'Live adventure with your pack!';
    if (currentPlayer) enableGameCards(); else disableGameCards();
    updateConnectionBadgeText(); updateDiagnosticsPanel();
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
    if (input && counter) counter.textContent = `${input.value.length}/140`;
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

// ── Scoring Engine ────────────────────────────────────────────────────────────

function computePlayerStats(playerKey) {
    const player = playersData[playerKey];
    if (!player) return null;

    const foundSet = new Set(Object.keys(player.states || {}));
    const foundCount = foundSet.size;
    const firstCount = Array.from(foundSet).filter(
        name => gameData?.claimedStates?.[name]?.playerKey === playerKey
    ).length;

    // Base plate score — rarity is route-aware (BFS from travel corridor)
    const corridor = gameData?.settings?.playAreaStates || [];
    let score = 0;
    foundSet.forEach(name => {
        const tier = computeRarityForState(name, corridor);
        const pts = RARITY_CONFIG[tier].points;
        const isFirst = gameData?.claimedStates?.[name]?.playerKey === playerKey;
        score += isFirst ? pts : pts / 2;
    });

    // Sub-region completions — +60 pts first in pack, +30 pts otherwise
    const completedSubs = Object.entries(SUB_REGIONS)
        .filter(([, region]) => region.states.every(s => foundSet.has(s)))
        .map(([key]) => key);

    completedSubs.forEach(key => {
        const anyOtherCompleted = Object.entries(playersData).some(([pKey, pData]) => {
            if (pKey === playerKey) return false;
            const pFound = new Set(Object.keys(pData?.states || {}));
            return SUB_REGIONS[key].states.every(s => pFound.has(s));
        });
        score += anyOtherCompleted ? 30 : 60;
    });

    // Primary region completions — +100 pts first in pack, +50 pts otherwise
    const completedRegions = Object.entries(REGION_STATES)
        .filter(([, states]) => states.every(s => foundSet.has(s)))
        .map(([key]) => key);

    completedRegions.forEach(key => {
        const anyOtherCompleted = Object.entries(playersData).some(([pKey, pData]) => {
            if (pKey === playerKey) return false;
            const pFound = new Set(Object.keys(pData?.states || {}));
            return REGION_STATES[key].every(s => pFound.has(s));
        });
        score += anyOtherCompleted ? 50 : 100;
    });

    // Travel corridor completion — +150 pts first in pack, +75 pts otherwise
    const corridorStates = gameData?.settings?.playAreaStates || [];
    const corridorComplete = corridorStates.length > 0 && corridorStates.every(s => foundSet.has(s));
    if (corridorComplete) {
        const anyOtherCompleted = Object.entries(playersData).some(([pKey, pData]) => {
            if (pKey === playerKey) return false;
            const pFound = new Set(Object.keys(pData?.states || {}));
            return corridorStates.every(s => pFound.has(s));
        });
        score += anyOtherCompleted ? 75 : 150;
    }

    return { foundSet, foundCount, firstCount, score, completedSubs, completedRegions, corridorComplete };
}

function getPlayerBadges(playerKey) {
    const stats = computePlayerStats(playerKey);
    if (!stats) return [];
    return BADGE_DEFS.filter(b => b.test(stats));
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
            ? badges.map(b => `<div class="badge-item"><div class="badge-item-icon">${b.icon}</div><div class="badge-item-label">${b.label}</div><div class="badge-item-desc">${b.desc}</div></div>`).join('')
            : '<div class="detail-empty">No badges yet — keep spotting!</div>';
    }

    // Score breakdown by rarity tier
    const detailCorridor = gameData?.settings?.playAreaStates || [];
    const breakdownEl = document.getElementById('detailBreakdownGrid');
    if (breakdownEl) {
        const byTier = {};
        stats.foundSet.forEach(name => {
            const tier = computeRarityForState(name, detailCorridor);
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
        if (stats.completedSubs.length) rows.push(`<div class="breakdown-row breakdown-bonus"><span class="breakdown-bonus-label">Sub-region bonuses</span><span class="breakdown-count">${stats.completedSubs.length} sub-region${stats.completedSubs.length !== 1 ? 's' : ''}</span><span class="breakdown-pts">+30–60 pts ea</span></div>`);
        if (stats.completedRegions?.length) rows.push(`<div class="breakdown-row breakdown-bonus"><span class="breakdown-bonus-label">Regional bonuses</span><span class="breakdown-count">${stats.completedRegions.length} region${stats.completedRegions.length !== 1 ? 's' : ''}</span><span class="breakdown-pts">+50–100 pts ea</span></div>`);
        if (stats.corridorComplete) rows.push(`<div class="breakdown-row breakdown-bonus"><span class="breakdown-bonus-label">Corridor complete</span><span class="breakdown-count"></span><span class="breakdown-pts">+75–150 pts</span></div>`);
        breakdownEl.innerHTML = rows.join('') || '<div class="detail-empty">No plates found yet.</div>';
    }

    // Found plates chips sorted rarity-first
    const foundGrid = document.getElementById('detailFoundGrid');
    if (foundGrid) {
        const tierRank = { ultra: 0, 'gold-elite': 1, 'silver-elite': 2, legendary: 3, epic: 4, 'mega-rare': 5, rare: 6, 'semi-rare': 7, scarce: 8, occasional: 9, common: 10 };
        const allPlates = [...US_PLATES, ...TERRITORY_PLATES, ...CANADA_PLATES];
        const sorted = Array.from(stats.foundSet).sort((a, b) => {
            const ta = tierRank[computeRarityForState(a, detailCorridor)] ?? 5;
            const tb = tierRank[computeRarityForState(b, detailCorridor)] ?? 5;
            return ta !== tb ? ta - tb : a.localeCompare(b);
        });
        foundGrid.innerHTML = sorted.map(name => {
            const tier = computeRarityForState(name, detailCorridor);
            const abbr = allPlates.find(p => p.name === name)?.abbr || name.slice(0, 2).toUpperCase();
            const isFirst = gameData?.claimedStates?.[name]?.playerKey === playerKey;
            return `<div class="found-chip rarity-chip-${tier}" title="${name}${isFirst ? ' — First Find!' : ''}">${abbr}${isFirst ? '⭐' : ''}</div>`;
        }).join('') || '<div class="detail-empty">No plates found yet.</div>';
    }

    modal.classList.add('visible');
}

function closePlayerDetail() {
    document.getElementById('playerDetailModal')?.classList.remove('visible');
}
