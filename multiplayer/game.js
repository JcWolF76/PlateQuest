// PlateQuest Multiplayer v2
// Rebuilt around durable room membership, stable player identity, and silent rejoin.

const firebaseConfig = {
    apiKey: "AIzaSyADgN2_6yMeIuWRZxsXdlUUjmZEd_Rn9qQ",
    authDomain: "platequest-multiplayer.firebaseapp.com",
    databaseURL: "https://platequest-multiplayer-default-rtdb.firebaseio.com/",
    projectId: "platequest-multiplayer",
    storageBucket: "platequest-multiplayer.firebasestorage.app",
    messagingSenderId: "109596979102",
    appId: "1:109596979102:web:586740c408daec71af708f"
};

const statesData = [
    { name: "Alabama", abbr: "AL" },
    { name: "Alaska", abbr: "AK" },
    { name: "Arizona", abbr: "AZ" },
    { name: "Arkansas", abbr: "AR" },
    { name: "California", abbr: "CA" },
    { name: "Colorado", abbr: "CO" },
    { name: "Connecticut", abbr: "CT" },
    { name: "Delaware", abbr: "DE" },
    { name: "Florida", abbr: "FL" },
    { name: "Georgia", abbr: "GA" },
    { name: "Hawaii", abbr: "HI" },
    { name: "Idaho", abbr: "ID" },
    { name: "Illinois", abbr: "IL" },
    { name: "Indiana", abbr: "IN" },
    { name: "Iowa", abbr: "IA" },
    { name: "Kansas", abbr: "KS" },
    { name: "Kentucky", abbr: "KY" },
    { name: "Louisiana", abbr: "LA" },
    { name: "Maine", abbr: "ME" },
    { name: "Maryland", abbr: "MD" },
    { name: "Massachusetts", abbr: "MA" },
    { name: "Michigan", abbr: "MI" },
    { name: "Minnesota", abbr: "MN" },
    { name: "Mississippi", abbr: "MS" },
    { name: "Missouri", abbr: "MO" },
    { name: "Montana", abbr: "MT" },
    { name: "Nebraska", abbr: "NE" },
    { name: "Nevada", abbr: "NV" },
    { name: "New Hampshire", abbr: "NH" },
    { name: "New Jersey", abbr: "NJ" },
    { name: "New Mexico", abbr: "NM" },
    { name: "New York", abbr: "NY" },
    { name: "North Carolina", abbr: "NC" },
    { name: "North Dakota", abbr: "ND" },
    { name: "Ohio", abbr: "OH" },
    { name: "Oklahoma", abbr: "OK" },
    { name: "Oregon", abbr: "OR" },
    { name: "Pennsylvania", abbr: "PA" },
    { name: "Rhode Island", abbr: "RI" },
    { name: "South Carolina", abbr: "SC" },
    { name: "South Dakota", abbr: "SD" },
    { name: "Tennessee", abbr: "TN" },
    { name: "Texas", abbr: "TX" },
    { name: "Utah", abbr: "UT" },
    { name: "Vermont", abbr: "VT" },
    { name: "Virginia", abbr: "VA" },
    { name: "Washington", abbr: "WA" },
    { name: "West Virginia", abbr: "WV" },
    { name: "Wisconsin", abbr: "WI" },
    { name: "Wyoming", abbr: "WY" }
];

const STORAGE_KEYS = {
    name: 'platequest_player_name',
    tag: 'platequest_player_tag',
    player: 'platequest_player_identity_v2',
    session: 'platequest_active_session_v2',
    darkMode: 'platequest_dark_mode'
};

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

const splash = document.getElementById('splash');
const game = document.getElementById('game');
const setupSection = document.getElementById('setupSection');
const gameActive = document.getElementById('gameActive');
const loadingOverlay = document.getElementById('loadingOverlay');
const gameCodeHeader = document.getElementById('gameCodeHeader');

function slugify(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40);
}

function getOrCreateDeviceId() {
    let identity = null;
    try {
        identity = JSON.parse(localStorage.getItem(STORAGE_KEYS.player) || 'null');
    } catch (error) {
        identity = null;
    }

    if (identity && identity.deviceId) {
        return identity.deviceId;
    }

    return `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildPlayerFromInputs() {
    const name = document.getElementById('playerNameInput').value.trim();
    const tag = document.getElementById('playerTagInput').value.trim();

    if (!name) {
        showToast('Please enter your name! 👤', 'error');
        document.getElementById('playerNameInput').focus();
        return null;
    }

    if (!tag) {
        showToast('Please enter a player tag! 🏷️', 'error');
        document.getElementById('playerTagInput').focus();
        return null;
    }

    if (name.length > 20) {
        showToast('Name must be 20 characters or less.', 'error');
        return null;
    }

    if (tag.length > 8) {
        showToast('Tag must be 8 characters or less.', 'error');
        return null;
    }

    if (!/^[a-zA-Z0-9]+$/.test(tag)) {
        showToast('Tag can only contain letters and numbers.', 'error');
        return null;
    }

    const playerKey = `${slugify(name)}__${slugify(tag)}`;
    const deviceId = getOrCreateDeviceId();

    return {
        playerKey,
        deviceId,
        name,
        tag,
        displayName: `${name} (${tag})`,
        colorSeed: slugify(`${name}_${tag}`),
        updatedAtLocal: Date.now()
    };
}

function persistIdentity(player) {
    localStorage.setItem(STORAGE_KEYS.name, player.name);
    localStorage.setItem(STORAGE_KEYS.tag, player.tag);
    localStorage.setItem(STORAGE_KEYS.player, JSON.stringify(player));
}

function restoreIdentity() {
    const savedName = localStorage.getItem(STORAGE_KEYS.name);
    const savedTag = localStorage.getItem(STORAGE_KEYS.tag);
    if (savedName) document.getElementById('playerNameInput').value = savedName;
    if (savedTag) document.getElementById('playerTagInput').value = savedTag;

    try {
        const savedPlayer = JSON.parse(localStorage.getItem(STORAGE_KEYS.player) || 'null');
        if (savedPlayer && savedPlayer.playerKey) {
            currentPlayer = savedPlayer;
            enableGameCards();
        }
    } catch (error) {
        console.warn('Could not restore player identity.', error);
    }
}

function saveGameSession() {
    if (!currentPlayer || !currentGameCode) return;
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
        gameCode: currentGameCode,
        playerKey: currentPlayer.playerKey,
        savedAt: Date.now()
    }));
}

function clearGameSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
}

function getSavedSession() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
    } catch (error) {
        return null;
    }
}

function enableGameCards() {
    document.getElementById('createGameCard').style.opacity = '1';
    document.getElementById('joinGameCard').style.opacity = '1';
    document.getElementById('newGameInput').disabled = false;
    document.getElementById('joinCodeInput').disabled = false;
    document.getElementById('createGameBtn').disabled = false;
    document.getElementById('joinGameBtn').disabled = false;
}

function disableGameCards() {
    document.getElementById('createGameCard').style.opacity = '0.5';
    document.getElementById('joinGameCard').style.opacity = '0.5';
    document.getElementById('newGameInput').disabled = true;
    document.getElementById('joinCodeInput').disabled = true;
    document.getElementById('createGameBtn').disabled = true;
    document.getElementById('joinGameBtn').disabled = true;
}

function stateMapToCount(statesMap) {
    return Object.keys(statesMap || {}).length;
}

function buildPlayerRoomRecord(player, options = {}) {
    const now = firebase.database.ServerValue.TIMESTAMP;
    return {
        playerKey: player.playerKey,
        deviceId: player.deviceId,
        name: player.name,
        tag: player.tag,
        displayName: player.displayName,
        isHost: Boolean(options.isHost),
        connected: true,
        joinedAt: options.joinedAt || now,
        lastSeen: now,
        states: options.states || {},
        role: options.isHost ? 'host' : 'player'
    };
}

function normalizePlayers(rawPlayers = {}) {
    const normalized = {};
    Object.entries(rawPlayers).forEach(([key, player]) => {
        if (!player) return;

        const playerKey = player.playerKey || key;
        let states = player.states || {};

        if (Array.isArray(states)) {
            const converted = {};
            states.forEach((stateName) => {
                converted[stateName] = {
                    state: stateName,
                    foundAt: player.joinedAt || Date.now(),
                    foundBy: player.displayName || player.name || playerKey,
                    foundByKey: playerKey
                };
            });
            states = converted;
        }

        normalized[playerKey] = {
            ...player,
            playerKey,
            displayName: player.displayName || (player.name && player.tag ? `${player.name} (${player.tag})` : (player.name || playerKey)),
            states
        };
    });
    return normalized;
}

function getMyStatesMap() {
    if (!currentPlayer) return {};
    return playersData[currentPlayer.playerKey]?.states || {};
}

function findStateOwner(stateName) {
    let owner = null;
    Object.values(playersData).forEach((player) => {
        if (!owner && player.states && player.states[stateName]) {
            owner = player;
        }
    });
    return owner;
}

function buildStateSignature() {
    const snapshot = Object.values(playersData).map((player) => ({
        key: player.playerKey,
        count: stateMapToCount(player.states),
        connected: Boolean(player.connected),
        states: Object.keys(player.states || {}).sort()
    }));
    return JSON.stringify(snapshot);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        bindEventListeners();
        restoreIdentity();
        initializeDarkMode();
        pendingGameCodeFromUrl = readGameCodeFromUrl();

        database.ref('.info/connected').on('value', async (snapshot) => {
            const isConnected = snapshot.val() === true;
            currentConnectionState = isConnected ? 'online' : 'offline';
            updateConnectionStatus(isConnected ? 'online' : 'offline');

            if (isConnected) {
                if (!attemptedAutoResume) {
                    attemptedAutoResume = true;
                    await attemptAutoResume();
                }
                if (currentGameCode && currentPlayer) {
                    setupPresence();
                }
            }
        });
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        updateConnectionStatus('offline');
        bindEventListeners();
        restoreIdentity();
        initializeDarkMode();
    }
}

function bindEventListeners() {
    if (eventsBound) return;
    eventsBound = true;

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('setNameBtn').addEventListener('click', setPlayerName);
    document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setPlayerName();
    });
    document.getElementById('playerTagInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setPlayerName();
    });

    document.getElementById('createGameBtn').addEventListener('click', createGame);
    document.getElementById('joinGameBtn').addEventListener('click', joinGame);
    document.getElementById('newGameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createGame();
    });
    document.getElementById('joinCodeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });

    document.getElementById('resetMyProgressBtn').addEventListener('click', resetMyProgress);
    document.getElementById('leaveGameBtn').addEventListener('click', leaveGame);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('copyCodeBtn').addEventListener('click', copyGameCode);
    document.getElementById('shareCodeBtn').addEventListener('click', shareGameCode);
    document.getElementById('inviteNewBtn').addEventListener('click', inviteNewPlayer);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveGameSession();
        } else if (currentGameCode && currentPlayer && currentConnectionState === 'online') {
            setupPresence();
        }
    });

    window.addEventListener('beforeunload', () => {
        saveGameSession();
    });
}

function initializeDarkMode() {
    if (localStorage.getItem(STORAGE_KEYS.darkMode) === 'true') {
        document.body.classList.add('dark');
        document.getElementById('darkModeBtn').textContent = '☀️ Light Mode';
    }
}

function readGameCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('game') || params.get('code');
    return code ? code.trim().toUpperCase() : null;
}

function writeGameCodeToUrl(code) {
    if (!window.history || !window.history.replaceState) return;
    const url = new URL(window.location.href);
    url.searchParams.set('game', code);
    window.history.replaceState({}, document.title, url.toString());
}

function clearGameCodeFromUrl() {
    if (!window.history || !window.history.replaceState) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    url.searchParams.delete('code');
    window.history.replaceState({}, document.title, url.pathname);
}

function startGame() {
    splash.style.display = 'none';
    game.style.display = 'block';

    if (!currentPlayer) {
        document.getElementById('playerNameInput').focus();
    }
}

function setPlayerName() {
    const player = buildPlayerFromInputs();
    if (!player) return;

    currentPlayer = player;
    persistIdentity(player);
    enableGameCards();
    showToast(`Welcome to the pack, ${player.displayName}! 🐺`, 'success');

    if (pendingGameCodeFromUrl && game.style.display === 'block') {
        document.getElementById('joinCodeInput').value = pendingGameCodeFromUrl;
    }
}

async function generateUniqueGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let attempt = 0; attempt < 12; attempt += 1) {
        let code = '';
        for (let i = 0; i < 6; i += 1) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const snapshot = await database.ref(`games/${code}`).once('value');
        if (!snapshot.exists()) {
            return code;
        }
    }

    throw new Error('Unable to generate a unique game code.');
}

async function createGame() {
    if (!currentPlayer) {
        showToast('Please set your name first! 👤', 'error');
        return;
    }

    const gameName = document.getElementById('newGameInput').value.trim();
    if (!gameName) {
        showToast('Please enter a pack name! 🎮', 'error');
        document.getElementById('newGameInput').focus();
        return;
    }

    showLoading('Creating pack...');

    try {
        const code = await generateUniqueGameCode();
        const roomRef = database.ref(`games/${code}`);
        const roomData = {
            version: ROOM_VERSION,
            name: gameName,
            code,
            status: 'active',
            settings: {
                maxPlayers: MAX_PLAYERS
            },
            hostPlayerKey: currentPlayer.playerKey,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            players: {
                [currentPlayer.playerKey]: buildPlayerRoomRecord(currentPlayer, { isHost: true })
            }
        };

        await roomRef.set(roomData);
        await connectToGame(code, { showJoinedToast: true, joinedMessage: `Pack "${gameName}" created! 🐺` });
    } catch (error) {
        console.error('Error creating game:', error);
        showToast('Failed to create pack. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function joinGame(codeOverride = null) {
    if (!currentPlayer) {
        showToast('Please set your name first! 👤', 'error');
        return;
    }

    const code = (codeOverride || document.getElementById('joinCodeInput').value || '').trim().toUpperCase();
    if (!code || code.length !== 6) {
        showToast('Pack code must be 6 characters.', 'error');
        document.getElementById('joinCodeInput').focus();
        return;
    }

    showLoading('Joining pack...');

    try {
        await connectToGame(code, { showJoinedToast: true });
    } catch (error) {
        console.error('Error joining game:', error);
        showToast(error.message || 'Failed to join pack.', 'error');
    } finally {
        hideLoading();
    }
}

async function connectToGame(code, options = {}) {
    const roomRef = database.ref(`games/${code}`);
    const snapshot = await roomRef.once('value');

    if (!snapshot.exists()) {
        throw new Error('Pack not found. Please check the code.');
    }

    const room = snapshot.val();
    const normalizedPlayers = normalizePlayers(room.players || {});
    const existingPlayer = normalizedPlayers[currentPlayer.playerKey];

    if (!existingPlayer && Object.keys(normalizedPlayers).length >= (room.settings?.maxPlayers || MAX_PLAYERS)) {
        throw new Error('Pack is full. Maximum 8 players allowed.');
    }

    const playerRecord = buildPlayerRoomRecord(currentPlayer, {
        isHost: existingPlayer?.isHost || room.hostPlayerKey === currentPlayer.playerKey,
        joinedAt: existingPlayer?.joinedAt,
        states: existingPlayer?.states || {}
    });

    await roomRef.child(`players/${currentPlayer.playerKey}`).update(playerRecord);
    await roomRef.update({
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    });

    currentGameCode = code;
    currentGameRef = roomRef;
    saveGameSession();
    writeGameCodeToUrl(code);

    setupGameListeners();
    setupPresence();
    showActiveGame();

    if (options.showJoinedToast) {
        showToast(options.joinedMessage || `Joined "${room.name}" pack! 🐺`, 'success');
    }
}

function teardownCurrentRoomListeners() {
    if (currentGameRef && gameListenerAttached) {
        currentGameRef.off();
    }
    gameListenerAttached = false;

    if (presenceCleanup) {
        presenceCleanup();
        presenceCleanup = null;
    }

    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

function setupGameListeners() {
    if (!currentGameRef) return;

    if (gameListenerAttached) {
        currentGameRef.off();
        gameListenerAttached = false;
    }

    currentGameRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            showToast('Pack no longer exists.', 'error');
            returnToSetup(true);
            return;
        }

        gameData = snapshot.val();
        playersData = normalizePlayers(gameData.players || {});

        if (!playersData[currentPlayer.playerKey]) {
            showToast('You are no longer in this pack.', 'info');
            returnToSetup(true);
            return;
        }

        updateGameUI();
    });

    gameListenerAttached = true;
}

function setupPresence() {
    if (!database || !currentGameCode || !currentPlayer || currentConnectionState !== 'online') return;

    if (presenceCleanup) {
        presenceCleanup();
        presenceCleanup = null;
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    const playerRef = database.ref(`games/${currentGameCode}/players/${currentPlayer.playerKey}`);
    const connectedRef = database.ref('.info/connected');

    const connectedListener = connectedRef.on('value', (snapshot) => {
        if (snapshot.val() !== true) return;

        playerRef.child('connected').onDisconnect().set(false);
        playerRef.child('lastSeen').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
        playerRef.update({
            connected: true,
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            deviceId: currentPlayer.deviceId,
            name: currentPlayer.name,
            tag: currentPlayer.tag,
            displayName: currentPlayer.displayName
        }).catch((error) => console.warn('Presence update failed:', error));
    });

    heartbeatInterval = setInterval(() => {
        playerRef.update({
            connected: true,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        }).catch(() => {});
    }, HEARTBEAT_MS);

    presenceCleanup = () => {
        connectedRef.off('value', connectedListener);
        playerRef.update({
            connected: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        }).catch(() => {});
    };
}

async function attemptAutoResume() {
    if (!database) return;

    const savedSession = getSavedSession();
    const urlCode = pendingGameCodeFromUrl;

    if (urlCode && game.style.display !== 'block') {
        startGame();
    }

    if (!currentPlayer) {
        if (urlCode) {
            document.getElementById('joinCodeInput').value = urlCode;
        }
        return;
    }

    if (urlCode) {
        document.getElementById('joinCodeInput').value = urlCode;
        try {
            await connectToGame(urlCode, { showJoinedToast: true, joinedMessage: `Rejoined pack ${urlCode}.` });
            pendingGameCodeFromUrl = null;
            return;
        } catch (error) {
            console.warn('URL join failed:', error);
            showToast(error.message || 'Could not join the shared pack.', 'error');
        }
    }

    if (!savedSession || !savedSession.gameCode || savedSession.playerKey !== currentPlayer.playerKey) {
        return;
    }

    const age = Date.now() - (savedSession.savedAt || 0);
    if (age > 7 * 24 * 60 * 60 * 1000) {
        clearGameSession();
        return;
    }

    try {
        await connectToGame(savedSession.gameCode, { showJoinedToast: true, joinedMessage: `Welcome back to pack ${savedSession.gameCode}!` });
        if (game.style.display !== 'block') {
            startGame();
        }
    } catch (error) {
        console.warn('Auto resume failed:', error);
        clearGameSession();
    }
}

function showActiveGame() {
    if (splash.style.display !== 'none') {
        splash.style.display = 'none';
    }
    game.style.display = 'block';
    setupSection.style.display = 'none';
    gameActive.style.display = 'block';
    gameCodeHeader.style.display = 'flex';
    updateGameCodeHeader();
}

function updateGameCodeHeader() {
    const persistentGameCode = document.getElementById('persistentGameCode');
    if (persistentGameCode && currentGameCode) {
        persistentGameCode.textContent = currentGameCode;
    }
}

function updateGameUI() {
    if (!gameData || !currentPlayer) return;

    const signature = buildStateSignature();
    if (signature === lastRenderedStateSignature) {
        updateScores();
        updateConnectionBadgeText();
        return;
    }

    lastRenderedStateSignature = signature;
    updateScores();
    renderStates();
    updateConnectionBadgeText();

    const title = document.getElementById('gameTitle');
    if (title) {
        title.textContent = `${gameData.name} Pack 🐺`;
    }
}

function updateConnectionBadgeText() {
    const statusText = document.getElementById('statusText');
    if (!statusText) return;

    if (!currentGameCode) {
        statusText.textContent = currentConnectionState === 'online' ? 'Ready' : 'Disconnected';
        return;
    }

    const me = playersData[currentPlayer.playerKey];
    if (currentConnectionState !== 'online') {
        statusText.textContent = 'Offline - reconnecting…';
    } else if (me && me.connected) {
        statusText.textContent = `Pack Connected • ${stateMapToCount(me.states)} plates`;
    } else {
        statusText.textContent = 'Rejoining pack…';
    }
}

function updateScores() {
    const scoresContainer = document.getElementById('scoresContainer');
    if (!scoresContainer) return;

    scoresContainer.innerHTML = '';

    const scores = Object.values(playersData)
        .map((player) => ({
            ...player,
            count: stateMapToCount(player.states),
            percentage: Math.round((stateMapToCount(player.states) / 50) * 100)
        }))
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return (a.joinedAt || 0) - (b.joinedAt || 0);
        });

    scores.forEach((player, index) => {
        const scoreCard = document.createElement('div');
        scoreCard.className = `score-card ${index === 0 && player.count > 0 ? 'leader' : ''}`;
        const isMe = player.playerKey === currentPlayer.playerKey;
        const marker = isMe ? '🐺' : (player.connected ? '👤' : '💤');
        const trophy = index === 0 && player.count > 0 ? '🏆' : '';

        scoreCard.innerHTML = `
            <div class="score-player-name">${marker} ${isMe ? 'YOU' : player.displayName} ${trophy}</div>
            <div class="score-count">${player.count}</div>
            <div class="score-percentage">(${player.percentage}%)</div>
        `;

        scoresContainer.appendChild(scoreCard);
    });
}

function renderStates() {
    const statesGrid = document.getElementById('statesGrid');
    if (!statesGrid || !currentPlayer) return;

    statesGrid.innerHTML = '';
    const myStates = getMyStatesMap();

    statesData.forEach((state, index) => {
        const card = document.createElement('div');
        card.className = 'state-card';

        const foundByMe = Boolean(myStates[state.name]);
        const owner = findStateOwner(state.name);
        const foundByOther = owner && owner.playerKey !== currentPlayer.playerKey ? owner : null;

        if (foundByMe) {
            card.classList.add('selected');
        } else if (foundByOther) {
            card.classList.add('selected-by-other');
        }

        const flagImg = `../flags/${state.abbr.toLowerCase()}.png`;

        card.innerHTML = `
            <div class="license-plate-header">LICENSE PLATE</div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; height: calc(100% - 40px);">
                <div style="flex: 1;">
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${state.name}</div>
                    <div style="font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">${state.abbr}</div>
                </div>
                <div class="state-flag" style="width: 50px; height: 35px; border-radius: 8px; background: linear-gradient(145deg, #95a5a6, #7f8c8d); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #2c3e50; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2); border: 1px solid rgba(52, 152, 219, 0.2); overflow: hidden; position: relative;">
                    <img src="${flagImg}" alt="${state.abbr} flag"
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;"
                         onerror="this.style.display='none'; this.parentNode.textContent='${state.abbr}';">
                </div>
            </div>
            ${foundByOther ? `<div style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: #f39c12; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" title="Found by ${foundByOther.displayName}">${foundByOther.name.charAt(0).toUpperCase()}</div>` : ''}
        `;

        card.addEventListener('click', () => toggleState(state.name, foundByMe));
        card.style.animationDelay = `${index * 0.02}s`;
        statesGrid.appendChild(card);
    });
}

async function toggleState(stateName, currentlySelected) {
    if (!currentGameRef || !currentPlayer) return;

    const playerStatesRef = currentGameRef.child(`players/${currentPlayer.playerKey}/states`);
    try {
        if (currentlySelected) {
            await playerStatesRef.child(stateName).remove();
        } else {
            await playerStatesRef.child(stateName).set({
                state: stateName,
                foundAt: firebase.database.ServerValue.TIMESTAMP,
                foundBy: currentPlayer.displayName,
                foundByKey: currentPlayer.playerKey
            });
            showToast(`Found ${stateName}! 🎉`, 'success');
        }

        await currentGameRef.update({ updatedAt: firebase.database.ServerValue.TIMESTAMP });

        const myCount = currentlySelected ? stateMapToCount(getMyStatesMap()) - 1 : stateMapToCount(getMyStatesMap()) + 1;
        if (!currentlySelected && myCount === 50) {
            showToast('🏆 AMAZING! You found all 50 states!', 'success');
        }
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
        showToast('Your progress has been reset.', 'info');
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
        if (!roomSnapshot.exists()) {
            returnToSetup(true);
            return;
        }

        const room = roomSnapshot.val();
        const roomPlayers = normalizePlayers(room.players || {});
        const isHost = room.hostPlayerKey === currentPlayer.playerKey;

        await currentGameRef.child(`players/${currentPlayer.playerKey}`).remove();

        const remainingKeys = Object.keys(roomPlayers).filter((key) => key !== currentPlayer.playerKey);
        if (remainingKeys.length === 0) {
            await currentGameRef.remove();
        } else if (isHost) {
            const nextHostKey = remainingKeys[0];
            await currentGameRef.update({
                hostPlayerKey: nextHostKey,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
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

    currentGameRef = null;
    currentGameCode = null;
    gameData = null;
    playersData = {};
    lastRenderedStateSignature = '';

    if (clearSessionToo) {
        clearGameSession();
        clearGameCodeFromUrl();
    }

    gameCodeHeader.style.display = 'none';
    setupSection.style.display = 'block';
    gameActive.style.display = 'none';

    document.getElementById('newGameInput').value = '';
    document.getElementById('joinCodeInput').value = pendingGameCodeFromUrl || '';

    if (currentPlayer) {
        enableGameCards();
    } else {
        disableGameCards();
    }

    updateConnectionBadgeText();
}

function copyGameCode() {
    if (!currentGameCode) return;
    copyToClipboard(currentGameCode, 'Pack code copied! 📋');
}

function getCanonicalJoinUrl() {
    const url = new URL(window.location.href);
    if (currentGameCode) {
        url.searchParams.set('game', currentGameCode);
    }
    return url.toString();
}

function shareGameCode() {
    if (!currentGameCode) return;

    const joinUrl = getCanonicalJoinUrl();
    const shareData = {
        title: 'Join my PlateQuest Pack!',
        text: `Join my license plate hunting pack! Use code: ${currentGameCode}`,
        url: joinUrl
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {
            copyToClipboard(`${shareData.text}\n${joinUrl}`, 'Join link copied! 📋');
        });
    } else {
        copyToClipboard(`${shareData.text}\n${joinUrl}`, 'Join link copied! 📋');
    }
}

function inviteNewPlayer() {
    if (!currentGameCode) return;
    const message = `🐺 Join my PlateQuest Pack!\n\nPack Code: ${currentGameCode}\nJoin here: ${getCanonicalJoinUrl()}\n\nLet's hunt license plates together!`;

    if (navigator.share) {
        navigator.share({ title: 'Join my PlateQuest Pack!', text: message }).catch(() => {
            copyToClipboard(message, 'Invitation copied to clipboard! 📋');
        });
    } else {
        copyToClipboard(message, 'Invitation copied to clipboard! 📋');
    }
}

function copyToClipboard(text, successMessage = 'Copied!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage, 'success');
        }).catch(() => fallbackCopy(text, successMessage));
    } else {
        fallbackCopy(text, successMessage);
    }
}

function fallbackCopy(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast(successMessage, 'success');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('darkModeBtn').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem(STORAGE_KEYS.darkMode, String(isDark));
}

function updateConnectionStatus(status) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (statusDot) {
        statusDot.className = `status-dot ${status}`;
    }

    if (statusText) {
        if (status === 'online') statusText.textContent = 'Connected';
        if (status === 'offline') statusText.textContent = 'Disconnected';
        if (status === 'connecting') statusText.textContent = 'Connecting...';
    }
}

function showLoading(text = 'Loading...') {
    const loadingText = loadingOverlay.querySelector('.loading-text');
    if (loadingText) loadingText.textContent = text;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideInToast 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}
