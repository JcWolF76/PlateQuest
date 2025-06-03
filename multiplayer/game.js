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

// Game state
let database = null;
let currentGameRef = null;
let currentPlayer = null;
let currentGameCode = null;
let gameData = null;
let playersData = null;
let connectionEstablished = false;
let connectionRetryCount = 0;
let maxRetries = 5;
let gameInitialized = false;

// DOM elements
const splash = document.getElementById('splash');
const game = document.getElementById('game');
const setupSection = document.getElementById('setupSection');
const gameActive = document.getElementById('gameActive');
const loadingOverlay = document.getElementById('loadingOverlay');
const gameCodeHeader = document.getElementById('gameCodeHeader');

// Initialize Firebase and start the app with improved error handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 PlateQuest Multiplayer starting...');
    
    // Add loading state immediately
    updateConnectionStatus('connecting');
    
    // Initialize Firebase with proper error handling
    initializeFirebaseWithRetry();
});

async function initializeFirebaseWithRetry() {
    try {
        showLoading('Initializing multiplayer connection...');
        
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded. Please check your internet connection.');
        }
        
        // Initialize Firebase if not already done
        if (!firebase.apps.length) {
            console.log('🔥 Initializing Firebase...');
            firebase.initializeApp(firebaseConfig);
        } else {
            console.log('🔥 Firebase already initialized');
        }
        
        // Get database instance
        database = firebase.database();
        
        // Test connection with timeout
        console.log('🔌 Testing database connection...');
        const connected = await testDatabaseConnection();
        
        if (connected) {
            connectionEstablished = true;
            updateConnectionStatus('online');
            setupEventListeners();
            hideLoading();
            showToast('🐺 Multiplayer ready! Create or join a pack.', 'success');
            console.log('✅ Multiplayer initialized successfully');
        } else {
            throw new Error('Database connection test failed');
        }
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        
        if (connectionRetryCount < maxRetries) {
            connectionRetryCount++;
            console.log(`🔄 Retrying connection (${connectionRetryCount}/${maxRetries})...`);
            
            showLoading(`Connection failed. Retrying... (${connectionRetryCount}/${maxRetries})`);
            
            setTimeout(() => {
                initializeFirebaseWithRetry();
            }, 2000 * connectionRetryCount); // Exponential backoff
        } else {
            handleConnectionFailure(error);
        }
    }
}

async function testDatabaseConnection() {
    return new Promise((resolve) => {
        try {
            // Set a timeout for the connection test
            const timeout = setTimeout(() => {
                resolve(false);
            }, 10000); // 10 second timeout
            
            // Try to read the connection state
            const connectedRef = database.ref('.info/connected');
            
            connectedRef.once('value', (snapshot) => {
                clearTimeout(timeout);
                const connected = snapshot.val() === true;
                console.log('🔌 Connection test result:', connected);
                resolve(connected);
            }, (error) => {
                clearTimeout(timeout);
                console.error('🔌 Connection test error:', error);
                resolve(false);
            });
            
        } catch (error) {
            console.error('🔌 Connection test exception:', error);
            resolve(false);
        }
    });
}

function handleConnectionFailure(error) {
    hideLoading();
    updateConnectionStatus('offline');
    
    const errorMessage = getErrorMessage(error);
    showToast(errorMessage, 'error');
    
    // Show retry option
    setTimeout(() => {
        if (!connectionEstablished) {
            showRetryOption();
        }
    }, 2000);
}

function getErrorMessage(error) {
    if (error.message.includes('Firebase SDK')) {
        return '❌ Internet connection required for multiplayer mode';
    } else if (error.message.includes('connection')) {
        return '❌ Unable to connect to multiplayer servers';
    } else if (error.code === 'permission-denied') {
        return '❌ Multiplayer access denied. Please try again.';
    } else {
        return '❌ Multiplayer temporarily unavailable';
    }
}

function showRetryOption() {
    const retryToast = document.createElement('div');
    retryToast.className = 'toast info';
    retryToast.innerHTML = `
        <div>Connection failed. Want to try again?</div>
        <button onclick="retryConnection()" style="margin-left: 10px; padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🔄 Retry
        </button>
    `;
    
    document.getElementById('toastContainer').appendChild(retryToast);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        if (retryToast.parentNode) {
            retryToast.remove();
        }
    }, 10000);
}

function retryConnection() {
    // Clear any existing toasts
    document.getElementById('toastContainer').innerHTML = '';
    
    connectionRetryCount = 0;
    connectionEstablished = false;
    initializeFirebaseWithRetry();
}

function setupEventListeners() {
    if (gameInitialized) {
        console.log('⚠️  Event listeners already initialized');
        return;
    }
    
    gameInitialized = true;
    console.log('🎮 Setting up game event listeners...');
    
    // Main navigation
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
    
    // Player setup
    const setNameBtn = document.getElementById('setNameBtn');
    const playerNameInput = document.getElementById('playerNameInput');
    
    if (setNameBtn) {
        setNameBtn.addEventListener('click', setPlayerName);
    }
    
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') setPlayerName();
        });
    }
    
    // Game creation/joining
    const createGameBtn = document.getElementById('createGameBtn');
    const joinGameBtn = document.getElementById('joinGameBtn');
    const newGameInput = document.getElementById('newGameInput');
    const joinCodeInput = document.getElementById('joinCodeInput');
    
    if (createGameBtn) {
        createGameBtn.addEventListener('click', createGame);
    }
    
    if (joinGameBtn) {
        joinGameBtn.addEventListener('click', joinGame);
    }
    
    if (newGameInput) {
        newGameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') createGame();
        });
    }
    
    if (joinCodeInput) {
        joinCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') joinGame();
        });
    }
    
    // Game controls
    const resetMyProgressBtn = document.getElementById('resetMyProgressBtn');
    const leaveGameBtn = document.getElementById('leaveGameBtn');
    const darkModeBtn = document.getElementById('darkModeBtn');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const shareCodeBtn = document.getElementById('shareCodeBtn');
    const inviteNewBtn = document.getElementById('inviteNewBtn');
    
    if (resetMyProgressBtn) {
        resetMyProgressBtn.addEventListener('click', resetMyProgress);
    }
    
    if (leaveGameBtn) {
        leaveGameBtn.addEventListener('click', leaveGame);
    }
    
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
    }
    
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', copyGameCode);
    }
    
    if (shareCodeBtn) {
        shareCodeBtn.addEventListener('click', shareGameCode);
    }
    
    if (inviteNewBtn) {
        inviteNewBtn.addEventListener('click', inviteNewPlayer);
    }
    
    // Check for saved player name
    const savedName = localStorage.getItem('platequest_player_name');
    if (savedName && playerNameInput) {
        playerNameInput.value = savedName;
    }
    
    // Initialize dark mode
    initializeDarkMode();
    
    console.log('✅ Event listeners set up successfully');
}

function startGame() {
    if (!connectionEstablished) {
        showToast('🔌 Connecting to multiplayer servers...', 'info');
        return;
    }
    
    splash.style.display = 'none';
    game.style.display = 'block';
    
    // Auto-focus on name input if empty
    const nameInput = document.getElementById('playerNameInput');
    if (nameInput && !nameInput.value.trim()) {
        nameInput.focus();
    }
}

function setPlayerName() {
    const nameInput = document.getElementById('playerNameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        showToast('Please enter your name! 🐺', 'error');
        nameInput.focus();
        return;
    }
    
    if (name.length > 20) {
        showToast('Name must be 20 characters or less! 📝', 'error');
        return;
    }
    
    currentPlayer = {
        id: generatePlayerId(),
        name: name,
        joinedAt: Date.now()
    };
    
    localStorage.setItem('platequest_player_name', name);
    showToast(`Welcome to the pack, ${name}! 🐺`, 'success');
    
    // Enable game mode cards
    enableGameModeCards();
}

function enableGameModeCards() {
    const createGameCard = document.getElementById('createGameCard');
    const joinGameCard = document.getElementById('joinGameCard');
    const newGameInput = document.getElementById('newGameInput');
    const joinCodeInput = document.getElementById('joinCodeInput');
    const createGameBtn = document.getElementById('createGameBtn');
    const joinGameBtn = document.getElementById('joinGameBtn');
    
    if (createGameCard) createGameCard.style.opacity = '1';
    if (joinGameCard) joinGameCard.style.opacity = '1';
    if (newGameInput) newGameInput.disabled = false;
    if (joinCodeInput) joinCodeInput.disabled = false;
    if (createGameBtn) createGameBtn.disabled = false;
    if (joinGameBtn) joinGameBtn.disabled = false;
}

async function createGame() {
    if (!currentPlayer) {
        showToast('Please set your name first! 👤', 'error');
        return;
    }
    
    if (!connectionEstablished) {
        showToast('No connection to multiplayer servers 🔌', 'error');
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
        currentGameCode = generateGameCode();
        currentGameRef = database.ref(`games/${currentGameCode}`);
        
        const gameData = {
            name: gameName,
            code: currentGameCode,
            host: currentPlayer.id,
            status: 'active',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            players: {
                [currentPlayer.id]: {
                    ...currentPlayer,
                    isHost: true,
                    states: []
                }
            }
        };
        
        await currentGameRef.set(gameData);
        
        setupGameListeners();
        showActiveGame();
        hideLoading();
        
        showToast(`Pack "${gameName}" created! Share code: ${currentGameCode} 🐺`, 'success');
        
    } catch (error) {
        console.error('Error creating game:', error);
        showToast('Failed to create pack. Please try again. ❌', 'error');
        hideLoading();
    }
}

async function joinGame() {
    if (!currentPlayer) {
        showToast('Please set your name first! 👤', 'error');
        return;
    }
    
    if (!connectionEstablished) {
        showToast('No connection to multiplayer servers 🔌', 'error');
        return;
    }
    
    const codeInput = document.getElementById('joinCodeInput');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) {
        showToast('Please enter a pack code! 🔗', 'error');
        codeInput.focus();
        return;
    }
    
    if (code.length !== 6) {
        showToast('Pack code must be 6 characters! 📝', 'error');
        return;
    }
    
    showLoading('Joining pack...');
    
    try {
        currentGameCode = code;
        currentGameRef = database.ref(`games/${currentGameCode}`);
        
        // Check if game exists
        const snapshot = await currentGameRef.once('value');
        if (!snapshot.exists()) {
            showToast('Pack not found! Please check the code. 🔍', 'error');
            hideLoading();
            return;
        }
        
        const game = snapshot.val();
        
        // Check if game is full (max 8 players)
        const playerCount = Object.keys(game.players || {}).length;
        if (playerCount >= 8) {
            showToast('Pack is full! Maximum 8 players allowed. 👥', 'error');
            hideLoading();
            return;
        }
        
        // Check if name is already taken
        const existingPlayers = Object.values(game.players || {});
        if (existingPlayers.some(p => p.name === currentPlayer.name)) {
            showToast('Name already taken in this pack! Please choose a different name. 🏷️', 'error');
            hideLoading();
            return;
        }
        
        // Add player to game
        await currentGameRef.child(`players/${currentPlayer.id}`).set({
            ...currentPlayer,
            isHost: false,
            states: []
        });
        
        setupGameListeners();
        showActiveGame();
        hideLoading();
        
        showToast(`Joined "${game.name}" pack! 🐺`, 'success');
        
    } catch (error) {
        console.error('Error joining game:', error);
        showToast('Failed to join pack. Please try again. ❌', 'error');
        hideLoading();
    }
}

function setupGameListeners() {
    if (!currentGameRef) return;
    
    console.log('🎮 Setting up game listeners...');
    
    // Listen to game data changes
    currentGameRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            showToast('Pack was deleted by the host. 🚪', 'error');
            returnToSetup();
            return;
        }
        
        gameData = snapshot.val();
        playersData = gameData.players || {};
        
        updateGameUI();
    });
    
    // Listen to connection status
    database.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val()) {
            if (!connectionEstablished) {
                connectionEstablished = true;
                updateConnectionStatus('online');
                showToast('🔌 Reconnected to multiplayer servers!', 'success');
            }
        } else {
            connectionEstablished = false;
            updateConnectionStatus('offline');
            showToast('🔌 Lost connection to servers...', 'error');
        }
    });
}

function updateGameUI() {
    if (!gameData) return;
    
    updateScores();
    updateStatesDisplay();
    updateGameCodeHeader();
}

function showActiveGame() {
    setupSection.style.display = 'none';
    gameActive.style.display = 'block';
    gameCodeHeader.style.display = 'flex';
    
    renderStates();
    updateGameUI();
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
    
    // Calculate scores and sort by count
    const scores = Object.values(playersData).map(player => ({
        ...player,
        count: (player.states || []).length,
        percentage: Math.round(((player.states || []).length / 50) * 100)
    })).sort((a, b) => b.count - a.count);
    
    scores.forEach((player, index) => {
        const scoreCard = document.createElement('div');
        scoreCard.className = `score-card ${index === 0 && player.count > 0 ? 'leader' : ''}`;
        
        const isMe = player.id === currentPlayer.id;
        const trophy = index === 0 && player.count > 0 ? '🏆' : '';
        const wolf = isMe ? '🐺' : '👤';
        
        scoreCard.innerHTML = `
            <div class="score-player-name">${wolf} ${isMe ? 'YOU' : player.name} ${trophy}</div>
            <div class="score-count">${player.count}</div>
            <div class="score-percentage">(${player.percentage}%)</div>
        `;
        
        scoresContainer.appendChild(scoreCard);
    });
}

function renderStates() {
    const statesGrid = document.getElementById('statesGrid');
    if (!statesGrid) return;
    
    statesGrid.innerHTML = '';
    
    statesData.forEach((state, index) => {
        const card = document.createElement('div');
        card.className = 'state-card';
        
        // Check who found this state
        const myStates = playersData[currentPlayer.id]?.states || [];
        const foundByMe = myStates.includes(state.name);
        
        let foundByOther = null;
        Object.values(playersData).forEach(player => {
            if (player.id !== currentPlayer.id && (player.states || []).includes(state.name)) {
                foundByOther = player.name;
            }
        });
        
        if (foundByMe) {
            card.classList.add('selected');
        } else if (foundByOther) {
            card.classList.add('selected-by-other');
        }
        
        card.innerHTML = `
            <div class="license-plate-header">LICENSE PLATE</div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; height: calc(100% - 40px);">
                <div style="flex: 1;">
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${state.name}</div>
                    <div style="font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">${state.abbr}</div>
                </div>
                <div style="width: 50px; height: 35px; border-radius: 8px; background: linear-gradient(145deg, #95a5a6, #7f8c8d); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #2c3e50; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2); border: 1px solid rgba(52, 152, 219, 0.2);">
                    ${state.abbr}
                </div>
            </div>
            ${foundByOther ? `<div style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: #f39c12; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${foundByOther.charAt(0)}</div>` : ''}
        `;
        
        card.addEventListener('click', () => toggleState(state.name, foundByMe));
        
        // Add animation delay
        card.style.animationDelay = `${index * 0.02}s`;
        
        statesGrid.appendChild(card);
    });
}

function updateStatesDisplay() {
    renderStates();
}

async function toggleState(stateName, currentlySelected) {
    if (!currentGameRef || !currentPlayer) return;
    
    if (!connectionEstablished) {
        showToast('🔌 No connection - changes not saved', 'error');
        return;
    }
    
    try {
        const myStatesRef = currentGameRef.child(`players/${currentPlayer.id}/states`);
        const currentStates = playersData[currentPlayer.id]?.states || [];
        
        let newStates;
        if (currentlySelected) {
            // Remove state
            newStates = currentStates.filter(s => s !== stateName);
            showToast(`Removed ${stateName} 📍`, 'info');
        } else {
            // Add state
            newStates = [...currentStates, stateName];
            showToast(`Found ${stateName}! 🎉`, 'success');
            
            // Check for completion
            if (newStates.length === 50) {
                showToast('🏆 AMAZING! You found all 50 states! Pack champion! 🐺', 'success');
            }
        }
        
        await myStatesRef.set(newStates);
        
    } catch (error) {
        console.error('Error updating state:', error);
        showToast('Failed to update progress. ❌', 'error');
    }
}

async function resetMyProgress() {
    if (!confirm('Reset all your spotted plates? This cannot be undone. 🔄')) return;
    
    if (!connectionEstablished) {
        showToast('🔌 No connection to servers', 'error');
        return;
    }
    
    try {
        await currentGameRef.child(`players/${currentPlayer.id}/states`).set([]);
        showToast('Your progress has been reset. 🔄', 'info');
        
    } catch (error) {
        console.error('Error resetting progress:', error);
        showToast('Failed to reset progress. ❌', 'error');
    }
}

async function leaveGame() {
    if (!confirm('Leave this pack? 🚪')) return;
    
    try {
        // Remove this player
        await currentGameRef.child(`players/${currentPlayer.id}`).remove();
        showToast('Left the pack. 🚪', 'info');
        returnToSetup();
        
    } catch (error) {
        console.error('Error leaving game:', error);
        showToast('Failed to leave pack. ❌', 'error');
    }
}

function returnToSetup() {
    // Clean up listeners
    if (currentGameRef) {
        currentGameRef.off();
        currentGameRef = null;
    }
    
    currentGameCode = null;
    gameData = null;
    playersData = null;
    
    // Hide game code header
    gameCodeHeader.style.display = 'none';
    
    // Show setup section
    setupSection.style.display = 'block';
    gameActive.style.display = 'none';
    
    // Clear inputs
    const newGameInput = document.getElementById('newGameInput');
    const joinCodeInput = document.getElementById('joinCodeInput');
    if (newGameInput) newGameInput.value = '';
    if (joinCodeInput) joinCodeInput.value = '';
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
    
    const shareData = {
        title: 'Join my PlateQuest Pack!',
        text: `Join my license plate hunting pack! Use code: ${currentGameCode}`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        copyGameCode();
    }
}

function inviteNewPlayer() {
    if (!currentGameCode) return;
    
    const message = `🐺 Join my PlateQuest Pack!\n\nPack Code: ${currentGameCode}\n\nGo to: ${window.location.href}\n\nLet's hunt license plates together!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join my PlateQuest Pack!',
            text: message
        }).catch(() => {
            copyToClipboard(message);
        });
    } else {
        copyToClipboard(message);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Invitation copied to clipboard! 📋', 'success');
    }).catch(() => {
        showToast('Pack code: ' + currentGameCode, 'info');
    });
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        btn.textContent = document.body.classList.contains('dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
    
    // Save preference
    localStorage.setItem('platequest_dark_mode', document.body.classList.contains('dark'));
}

function initializeDarkMode() {
    const darkMode = localStorage.getItem('platequest_dark_mode') === 'true';
    const btn = document.getElementById('darkModeBtn');
    
    if (darkMode) {
        document.body.classList.add('dark');
        if (btn) btn.textContent = '☀️ Light Mode';
    }
}

function updateConnectionStatus(status) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (statusDot) {
        statusDot.className = `status-dot ${status}`;
    }
    
    if (statusText) {
        switch (status) {
            case 'online':
                statusText.textContent = 'Pack Connected 🐺';
                break;
            case 'offline':
                statusText.textContent = 'Disconnected ❌';
                break;
            case 'connecting':
                statusText.textContent = 'Connecting... 🔌';
                break;
        }
    }
}

function showLoading(text = 'Loading...') {
    const overlay = loadingOverlay;
    const loadingText = overlay.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
    overlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer');
    if (container) {
        container.appendChild(toast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideInToast 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }
}

function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Global retry function for the retry button
window.retryConnection = retryConnection;