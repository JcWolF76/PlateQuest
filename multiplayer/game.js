
// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyADgN2_6yMeIuWRZxsXdlUUjmZEd_Rn9qQ",
    authDomain: "platequest-multiplayer.firebaseapp.com",
    databaseURL: "https://platequest-multiplayer-default-rtdb.firebaseio.com/",
    projectId: "platequest-multiplayer",
    storageBucket: "platequest-multiplayer.firebasestorage.app",
    messagingSenderId: "109596979102",
    appId: "1:109596979102:web:586740c408daec71af708f"
};

// State data with abbreviations for flag images
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
    PLAYER_PROFILE: 'platequest_player_profile',
    ACTIVE_SESSION: 'platequest_active_session',
    DARK_MODE: 'platequest_dark_mode'
};

let database = null;
let currentGameRef = null;
let currentPlayer = null;
let currentGameCode = null;
let gameData = null;
let playersData = {};
let connectionOnline = false;
let eventListenersBound = false;
let sessionRecoveryAttempted = false;
let presenceInitializedForGame = null;

// DOM elements
const splash = document.getElementById('splash');
const game = document.getElementById('game');
const setupSection = document.getElementById('setupSection');
const gameActive = document.getElementById('gameActive');
const loadingOverlay = document.getElementById('loadingOverlay');
const gameCodeHeader = document.getElementById('gameCodeHeader');

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    applySavedIdentityToInputs();
    applySavedDarkMode();
    prefillInviteCodeFromUrl();
    setupEventListeners();

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();

        updateConnectionStatus('connecting');

        database.ref('.info/connected').on('value', async (snapshot) => {
            connectionOnline = snapshot.val() === true;

            if (connectionOnline) {
                updateConnectionStatus('online');
                if (!sessionRecoveryAttempted) {
                    sessionRecoveryAttempted = true;
                    await attemptSessionRecovery();
                }
                if (currentGameCode && currentPlayer) {
                    maintainPresence();
                }
            } else {
                updateConnectionStatus(currentGameCode ? 'connecting' : 'offline');
            }
        });
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        updateConnectionStatus('offline');
        showToast('Cloud connection failed. Multiplayer may not work right now.', 'error');
    }
}

function setupEventListeners() {
    if (eventListenersBound) return;
    eventListenersBound = true;

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
        if (currentPlayer && currentGameCode) {
            saveGameSession();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (currentPlayer && currentGameCode) {
            saveGameSession();
        }
    });
}

function applySavedIdentityToInputs() {
    const profile = loadStoredProfile();
    const nameInput = document.getElementById('playerNameInput');
    const tagInput = document.getElementById('playerTagInput');

    if (profile?.name) nameInput.value = profile.name;
    if (profile?.tag) tagInput.value = profile.tag;
    if (profile?.id && profile?.name && profile?.tag) {
        currentPlayer = buildPlayerFromProfile(profile);
        enableGameSetupCards();
    }
}

function applySavedDarkMode() {
    if (localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true') {
        document.body.classList.add('dark');
        const btn = document.getElementById('darkModeBtn');
        if (btn) btn.textContent = '☀️ Light Mode';
    }
}

function prefillInviteCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const gameCode = (params.get('game') || params.get('code') || '').toUpperCase();
    if (gameCode) {
        const joinInput = document.getElementById('joinCodeInput');
        if (joinInput) {
            joinInput.value = gameCode;
        }
    }
}

function startGame() {
    splash.style.display = 'none';
    game.style.display = 'block';

    if (currentPlayer) {
        showToast(`Welcome back, ${currentPlayer.displayName}! 🐺`, 'info');
        enableGameSetupCards();
    } else {
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput && !nameInput.value.trim()) {
            nameInput.focus();
        }
    }
}

function loadStoredProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_PROFILE);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('Failed to read stored player profile:', error);
        return null;
    }
}

function saveStoredProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.PLAYER_PROFILE, JSON.stringify(profile));
}

function buildPlayerFromProfile(profile) {
    return {
        id: profile.id,
        name: profile.name,
        tag: profile.tag,
        displayName: `${profile.name} (${profile.tag})`,
        uniqueId: `${profile.name.toLowerCase()}_${profile.tag.toLowerCase()}`,
        joinedAt: profile.joinedAt || Date.now()
    };
}

function ensurePlayerFromInputs() {
    const name = document.getElementById('playerNameInput').value.trim();
    const tag = document.getElementById('playerTagInput').value.trim();

    if (!name) {
        showToast('Please enter your name! 👤', 'error');
        document.getElementById('playerNameInput').focus();
        return false;
    }

    if (!tag) {
        showToast('Please enter a player tag! 🏷️', 'error');
        document.getElementById('playerTagInput').focus();
        return false;
    }

    if (name.length > 20) {
        showToast('Name must be 20 characters or less.', 'error');
        return false;
    }

    if (tag.length > 8) {
        showToast('Tag must be 8 characters or less.', 'error');
        return false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(tag)) {
        showToast('Tag can only contain letters and numbers.', 'error');
        return false;
    }

    let profile = loadStoredProfile();
    if (!profile?.id) {
        profile = { id: generatePlayerId() };
    }

    profile = {
        ...profile,
        name,
        tag,
        joinedAt: profile.joinedAt || Date.now()
    };

    saveStoredProfile(profile);
    currentPlayer = buildPlayerFromProfile(profile);
    return true;
}

function setPlayerName() {
    if (!ensurePlayerFromInputs()) return;

    enableGameSetupCards();
    showToast(`Identity saved: ${currentPlayer.displayName} 🐺`, 'success');

    if (currentGameCode && currentGameRef) {
        currentGameRef.child(`players/${currentPlayer.id}`).update({
            name: currentPlayer.name,
            tag: currentPlayer.tag,
            displayName: currentPlayer.displayName,
            uniqueId: currentPlayer.uniqueId,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        }).catch((error) => {
            console.error('Failed to update identity:', error);
        });
    }
}

function enableGameSetupCards() {
    document.getElementById('createGameCard').style.opacity = '1';
    document.getElementById('joinGameCard').style.opacity = '1';
    document.getElementById('newGameInput').disabled = false;
    document.getElementById('joinCodeInput').disabled = false;
    document.getElementById('createGameBtn').disabled = false;
    document.getElementById('joinGameBtn').disabled = false;
}

async function createGame() {
    if (!ensurePlayerFromInputs()) return;
    if (!database) {
        showToast('Database is not ready yet. Try again in a moment.', 'error');
        return;
    }

    const gameNameInput = document.getElementById('newGameInput');
    const gameName = gameNameInput.value.trim();

    if (!gameName) {
        showToast('Please enter a pack name! 🎮', 'error');
        gameNameInput.focus();
        return;
    }

    showLoading('Creating pack...');

    try {
        const code = await findAvailableGameCode();
        const roomRef = database.ref(`games/${code}`);

        const payload = {
            name: gameName,
            code,
            status: 'active',
            hostId: currentPlayer.id,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            settings: {
                maxPlayers: 8,
                version: 2
            },
            players: {
                [currentPlayer.id]: buildPlayerRecord(currentPlayer, true)
            }
        };

        await roomRef.set(payload);

        currentGameCode = code;
        currentGameRef = roomRef;
        saveGameSession();
        subscribeToCurrentGame();
        showActiveGame();
        showToast(`Pack "${gameName}" created! 🐺`, 'success');
    } catch (error) {
        console.error('Error creating game:', error);
        showToast('Failed to create pack. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function findAvailableGameCode() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = generateGameCode();
        const snapshot = await database.ref(`games/${code}`).once('value');
        if (!snapshot.exists()) {
            return code;
        }
    }
    throw new Error('Unable to generate a unique game code.');
}

function buildPlayerRecord(player, isHost = false, existingStates = {}) {
    return {
        id: player.id,
        name: player.name,
        tag: player.tag,
        displayName: player.displayName,
        uniqueId: player.uniqueId,
        isHost,
        states: normalizeStatesRecord(existingStates),
        connected: connectionOnline,
        joinedAt: player.joinedAt || Date.now(),
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    };
}

async function joinGame() {
    if (!ensurePlayerFromInputs()) return;
    if (!database) {
        showToast('Database is not ready yet. Try again in a moment.', 'error');
        return;
    }

    const codeInput = document.getElementById('joinCodeInput');
    const code = codeInput.value.trim().toUpperCase();

    if (!code || code.length !== 6) {
        showToast('Pack code must be 6 characters.', 'error');
        codeInput.focus();
        return;
    }

    showLoading('Joining pack...');

    try {
        const roomRef = database.ref(`games/${code}`);
        const snapshot = await roomRef.once('value');

        if (!snapshot.exists()) {
            showToast('Pack not found. Please check the code.', 'error');
            return;
        }

        const room = normalizeGameData(snapshot.val());
        const playerList = Object.values(room.players || {});
        const maxPlayers = room.settings?.maxPlayers || 8;

        let playerRecord = room.players?.[currentPlayer.id] || null;

        if (!playerRecord) {
            const sameIdentity = playerList.find((player) => player.uniqueId === currentPlayer.uniqueId);
            if (sameIdentity) {
                playerRecord = sameIdentity;
                currentPlayer.id = sameIdentity.id;

                const stored = loadStoredProfile() || {};
                saveStoredProfile({
                    ...stored,
                    id: currentPlayer.id,
                    name: currentPlayer.name,
                    tag: currentPlayer.tag,
                    joinedAt: stored.joinedAt || Date.now()
                });
            }
        }

        if (!playerRecord && playerList.length >= maxPlayers) {
            showToast('Pack is full. Maximum 8 players allowed.', 'error');
            return;
        }

        if (playerRecord) {
            await roomRef.child(`players/${currentPlayer.id}`).update({
                name: currentPlayer.name,
                tag: currentPlayer.tag,
                displayName: currentPlayer.displayName,
                uniqueId: currentPlayer.uniqueId,
                connected: connectionOnline,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
        } else {
            await roomRef.child(`players/${currentPlayer.id}`).set(buildPlayerRecord(currentPlayer, false));
        }

        currentGameCode = code;
        currentGameRef = roomRef;
        saveGameSession();
        subscribeToCurrentGame();
        showActiveGame();
        showToast(`Joined "${room.name}" pack! 🐺`, 'success');
    } catch (error) {
        console.error('Error joining game:', error);
        showToast('Failed to join pack. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function subscribeToCurrentGame() {
    if (!currentGameCode || !database) return;

    if (currentGameRef) {
        currentGameRef.off();
    }

    currentGameRef = database.ref(`games/${currentGameCode}`);
    currentGameRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            showToast('This pack no longer exists.', 'error');
            returnToSetup();
            return;
        }

        const normalized = normalizeGameData(snapshot.val());
        gameData = normalized;
        playersData = normalized.players || {};

        if (!playersData[currentPlayer?.id]) {
            showToast('You are no longer in this pack.', 'info');
            returnToSetup();
            return;
        }

        updateGameUI();
        maintainPresence();
        saveGameSession();
    });
}

function normalizeGameData(rawGame) {
    const normalizedPlayers = {};
    Object.entries(rawGame?.players || {}).forEach(([playerId, player]) => {
        normalizedPlayers[playerId] = {
            ...player,
            id: player.id || playerId,
            displayName: player.displayName || `${player.name || 'Player'}${player.tag ? ` (${player.tag})` : ''}`,
            states: normalizeStatesRecord(player.states)
        };
    });

    return {
        ...rawGame,
        players: normalizedPlayers
    };
}

function normalizeStatesRecord(states) {
    if (!states) return {};

    if (Array.isArray(states)) {
        return states.reduce((accumulator, stateName) => {
            accumulator[stateName] = { foundAt: Date.now() };
            return accumulator;
        }, {});
    }

    if (typeof states === 'object') {
        const normalized = {};
        Object.entries(states).forEach(([stateName, value]) => {
            normalized[stateName] = typeof value === 'object' && value !== null
                ? value
                : { foundAt: Date.now() };
        });
        return normalized;
    }

    return {};
}

function getPlayerStateNames(player) {
    return Object.keys(normalizeStatesRecord(player?.states));
}

function getPlayerStateCount(player) {
    return getPlayerStateNames(player).length;
}

function maintainPresence() {
    if (!database || !currentGameCode || !currentPlayer?.id) return;
    if (!connectionOnline) return;

    const presenceKey = `${currentGameCode}:${currentPlayer.id}`;
    if (presenceInitializedForGame === presenceKey) {
        currentGameRef.child(`players/${currentPlayer.id}`).update({
            connected: true,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        }).catch(() => {});
        return;
    }

    presenceInitializedForGame = presenceKey;

    const playerRef = database.ref(`games/${currentGameCode}/players/${currentPlayer.id}`);
    playerRef.onDisconnect().update({
        connected: false,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    }).catch((error) => {
        console.warn('Failed to register disconnect handler:', error);
    });

    playerRef.update({
        connected: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    }).catch((error) => {
        console.warn('Failed to update presence:', error);
    });
}

function showActiveGame() {
    splash.style.display = 'none';
    game.style.display = 'block';
    setupSection.style.display = 'none';
    gameActive.style.display = 'block';
    gameCodeHeader.style.display = 'flex';
    renderStates();
    updateGameUI();
}

function updateGameUI() {
    if (!gameData || !currentPlayer) return;

    const gameTitle = document.getElementById('gameTitle');
    if (gameTitle) {
        gameTitle.textContent = `${gameData.name || 'PlateQuest Multiplayer Pack'} • ${currentGameCode}`;
    }

    updateGameCodeHeader();
    updateScores();
    renderStates();
}

function updateGameCodeHeader() {
    const persistentGameCode = document.getElementById('persistentGameCode');
    if (persistentGameCode && currentGameCode) {
        persistentGameCode.textContent = currentGameCode;
    }
}

function updateScores() {
    const scoresContainer = document.getElementById('scoresContainer');
    if (!scoresContainer) return;

    scoresContainer.innerHTML = '';

    const scoreRows = Object.values(playersData)
        .map((player) => {
            const count = getPlayerStateCount(player);
            return {
                ...player,
                count,
                percentage: Math.round((count / 50) * 100)
            };
        })
        .sort((left, right) => right.count - left.count || String(left.displayName).localeCompare(String(right.displayName)));

    scoreRows.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = `score-card ${index === 0 && player.count > 0 ? 'leader' : ''}`;

        const isMe = player.id === currentPlayer.id;
        const trophy = index === 0 && player.count > 0 ? '🏆' : '';
        const wolf = isMe ? '🐺' : '👤';
        const status = player.connected ? '🟢' : '⚪️';

        card.innerHTML = `
            <div class="score-player-name">${wolf} ${isMe ? 'YOU' : (player.displayName || player.name)} ${trophy}</div>
            <div class="score-count">${player.count}</div>
            <div class="score-percentage">(${player.percentage}%) ${status}</div>
        `;

        scoresContainer.appendChild(card);
    });
}

function renderStates() {
    const statesGrid = document.getElementById('statesGrid');
    if (!statesGrid || !currentPlayer) return;

    const myStateMap = normalizeStatesRecord(playersData[currentPlayer.id]?.states);

    statesGrid.innerHTML = '';

    statesData.forEach((state, index) => {
        const card = document.createElement('div');
        card.className = 'state-card';

        const foundByMe = Boolean(myStateMap[state.name]);
        let foundByOtherDisplay = null;
        let foundByOtherInitial = null;

        Object.values(playersData).some((player) => {
            if (player.id === currentPlayer.id) return false;
            const stateMap = normalizeStatesRecord(player.states);
            if (stateMap[state.name]) {
                foundByOtherDisplay = player.displayName || player.name || 'Player';
                foundByOtherInitial = (player.name || 'P').charAt(0).toUpperCase();
                return true;
            }
            return false;
        });

        if (foundByMe) {
            card.classList.add('selected');
        } else if (foundByOtherDisplay) {
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
            ${foundByOtherDisplay ? `<div style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: #f39c12; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" title="Found by ${foundByOtherDisplay}">${foundByOtherInitial}</div>` : ''}
        `;

        card.addEventListener('click', () => toggleState(state.name));
        card.style.animationDelay = `${index * 0.02}s`;
        statesGrid.appendChild(card);
    });
}

async function toggleState(stateName) {
    if (!currentGameRef || !currentPlayer) return;

    try {
        const playerStatesRef = currentGameRef.child(`players/${currentPlayer.id}/states`);
        const hadStateBefore = Boolean(normalizeStatesRecord(playersData[currentPlayer.id]?.states)[stateName]);
        let nextCount = 0;

        await playerStatesRef.transaction((currentValue) => {
            const normalized = normalizeStatesRecord(currentValue);

            if (normalized[stateName]) {
                delete normalized[stateName];
            } else {
                normalized[stateName] = {
                    foundAt: Date.now(),
                    foundBy: currentPlayer.displayName
                };
            }

            nextCount = Object.keys(normalized).length;
            return normalized;
        });

        currentGameRef.child(`players/${currentPlayer.id}`).update({
            connected: connectionOnline,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        }).catch(() => {});

        if (!hadStateBefore) {
            showToast(`Found ${stateName}! 🎉`, 'success');
        }

        if (nextCount === 50) {
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
        await currentGameRef.child(`players/${currentPlayer.id}/states`).set({});
        await currentGameRef.child(`players/${currentPlayer.id}`).update({
            connected: connectionOnline,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
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
        await currentGameRef.child(`players/${currentPlayer.id}`).remove();
        returnToSetup();
        showToast('Left the pack.', 'info');
    } catch (error) {
        console.error('Error leaving pack:', error);
        showToast('Failed to leave pack.', 'error');
    }
}

function returnToSetup() {
    if (currentGameRef) {
        currentGameRef.off();
    }

    currentGameRef = null;
    currentGameCode = null;
    gameData = null;
    playersData = {};
    presenceInitializedForGame = null;

    clearGameSession();

    gameCodeHeader.style.display = 'none';
    setupSection.style.display = 'block';
    gameActive.style.display = 'none';

    document.getElementById('newGameInput').value = '';
    prefillInviteCodeFromUrl();

    if (currentPlayer) {
        enableGameSetupCards();
    }
}

function saveGameSession() {
    if (!currentPlayer || !currentGameCode) return;

    const session = {
        gameCode: currentGameCode,
        playerId: currentPlayer.id,
        savedAt: Date.now()
    };

    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
}

function clearGameSession() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

async function attemptSessionRecovery() {
    if (!database || currentGameCode) return;

    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!raw) return;

    try {
        const session = JSON.parse(raw);
        if (!session?.gameCode || !session?.playerId) {
            clearGameSession();
            return;
        }

        const profile = loadStoredProfile();
        if (!profile?.id) {
            clearGameSession();
            return;
        }

        currentPlayer = buildPlayerFromProfile(profile);
        currentPlayer.id = session.playerId;

        const roomRef = database.ref(`games/${session.gameCode}`);
        const snapshot = await roomRef.once('value');

        if (!snapshot.exists()) {
            clearGameSession();
            return;
        }

        const room = normalizeGameData(snapshot.val());
        if (!room.players?.[session.playerId]) {
            clearGameSession();
            return;
        }

        currentGameCode = session.gameCode;
        currentGameRef = roomRef;

        splash.style.display = 'none';
        game.style.display = 'block';
        showActiveGame();
        subscribeToCurrentGame();
        maintainPresence();
        showToast(`Rejoined pack ${currentGameCode}! 🐺`, 'success');
    } catch (error) {
        console.error('Session recovery failed:', error);
        clearGameSession();
    }
}

function copyGameCode() {
    if (!currentGameCode) return;

    navigator.clipboard.writeText(currentGameCode).then(() => {
        showToast('Pack code copied! 📋', 'success');
    }).catch(() => {
        showToast(`Pack code: ${currentGameCode}`, 'info');
    });
}

function shareGameCode() {
    if (!currentGameCode) return;

    const joinUrl = `${window.location.origin}${window.location.pathname}?game=${currentGameCode}`;
    const shareData = {
        title: 'Join my PlateQuest Pack!',
        text: `Join my license plate hunting pack! Use code: ${currentGameCode}`,
        url: joinUrl
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {
            copyToClipboard(`${shareData.text}\n${joinUrl}`);
        });
    } else {
        copyToClipboard(`${shareData.text}\n${joinUrl}`);
    }
}

function inviteNewPlayer() {
    if (!currentGameCode) return;

    const joinUrl = `${window.location.origin}${window.location.pathname}?game=${currentGameCode}`;
    const message = `🐺 Join my PlateQuest Pack!\n\nPack Code: ${currentGameCode}\nJoin Link: ${joinUrl}\n\nLet's hunt license plates together!`;

    if (navigator.share) {
        navigator.share({
            title: 'Join my PlateQuest Pack!',
            text: message,
            url: joinUrl
        }).catch(() => {
            copyToClipboard(message);
        });
    } else {
        copyToClipboard(message);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard! 📋', 'success');
    }).catch(() => {
        showToast('Copy failed. Please try again.', 'error');
    });
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        btn.textContent = document.body.classList.contains('dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, document.body.classList.contains('dark'));
}

function updateConnectionStatus(status) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (statusDot) {
        statusDot.className = `status-dot ${status === 'online' ? 'online' : status === 'connecting' ? 'connecting' : 'offline'}`;
    }

    if (statusText) {
        if (status === 'online') {
            statusText.textContent = currentGameCode ? 'Pack Connected 🐺' : 'Online';
        } else if (status === 'connecting') {
            statusText.textContent = currentGameCode ? 'Reconnecting to pack…' : 'Connecting...';
        } else {
            statusText.textContent = 'Disconnected';
        }
    }
}

function showLoading(text = 'Loading...') {
    const loadingText = loadingOverlay.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
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
    }, 3500);
}

function generateGameCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let index = 0; index < 6; index += 1) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
