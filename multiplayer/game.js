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
    east_coast: { label: 'East Coast' },
    southeast: { label: 'Southeast' },
    midwest: { label: 'Midwest' },
    mountain_west: { label: 'Mountain West' },
    west_coast: { label: 'West Coast' },
    national: { label: 'National / Balanced' }
};

const PLAY_AREA_PRESETS = {
    northeast: ['ME','NH','VT','MA','RI','CT','NY','NJ','PA','DE','MD'],
    midwest: ['OH','MI','IN','IL','WI','MN','IA','MO','ND','SD','NE','KS'],
    west: ['WA','OR','CA','ID','NV','UT','AZ','MT','WY','CO','NM','AK','HI']
};

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
    return getPlateScope(scopeOverride) === 'us_canada' ? [...US_PLATES, ...CANADA_PLATES] : US_PLATES;
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
    ['newGameInput','joinCodeInput','createGameBtn','joinGameBtn','primaryRegionSelect','plateScopeSelect','presetNortheastBtn','presetMidwestBtn','presetWestBtn','clearPlayAreaBtn']
        .forEach((id) => { const el = document.getElementById(id); if (el) el.disabled = disabled; });
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
    document.getElementById('presetMidwestBtn')?.addEventListener('click', () => applyPlayAreaPreset('midwest'));
    document.getElementById('presetWestBtn')?.addEventListener('click', () => applyPlayAreaPreset('west'));
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
    document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); setDiagnosticsVisible(); } });
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
    currentGameRef = roomRef;
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
    const scores = Object.values(playersData).map((player) => ({ ...player, count: stateMapToCount(player.states), percentage: Math.round((stateMapToCount(player.states) / totalPlates) * 100) })).sort((a, b) => { if (b.count !== a.count) return b.count - a.count; return (a.joinedAt || 0) - (b.joinedAt || 0); });
    scores.forEach((player, index) => {
        const scoreCard = document.createElement('div');
        scoreCard.className = `score-card ${index === 0 && player.count > 0 ? 'leader' : ''}`;
        const isMe = player.playerKey === currentPlayer.playerKey;
        const marker = isMe ? '🐺' : (player.connected ? '👤' : '💤');
        const trophy = index === 0 && player.count > 0 ? '🏆' : '';
        scoreCard.innerHTML = `<div class="score-player-name">${marker} ${isMe ? 'YOU' : player.displayName} ${trophy}</div><div class="score-count">${player.count}</div><div class="score-percentage">(${player.percentage}%)</div>`;
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
    let canadaHeaderAdded = false;

    plateEntries.forEach((state, index) => {
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
        const plateType = state.category === 'canada' ? 'PROVINCE PLATE' : 'LICENSE PLATE';
        card.innerHTML = `<div class="license-plate-header">${plateType}</div><div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; height: calc(100% - 40px);"><div style="flex: 1;"><div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${state.name}</div><div style="font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">${state.abbr}</div></div><div class="state-flag" style="width: 50px; height: 35px; border-radius: 8px; background: linear-gradient(145deg, #95a5a6, #7f8c8d); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #2c3e50; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2); border: 1px solid rgba(52, 152, 219, 0.2); overflow: hidden; position: relative;"><img src="${flagImg}" alt="${state.abbr} flag" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" onerror="this.style.display='none'; this.parentNode.textContent='${state.abbr}';"></div></div>${claim ? `<div style="position: absolute; top: 8px; right: 8px; min-width: 24px; height: 24px; padding:0 6px; background: #f39c12; color: white; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" title="First found by ${claim.displayName}">${claim.tag}</div>` : ''}`;
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
    teardownCurrentRoomListeners();
    currentGameRef = null; currentGameCode = null; gameData = null; playersData = {}; lastRenderedStateSignature = ''; lastSyncAt = null;
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
function showToast(message, type = 'info') { const container = document.getElementById('toastContainer'); if (!container) return; const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.textContent = message; container.appendChild(toast); setTimeout(() => { if (toast.parentNode) { toast.style.animation = 'slideInToast 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); } }, 4000); }
