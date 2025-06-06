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

// DOM elements
const splash = document.getElementById('splash');
const game = document.getElementById('game');
const setupSection = document.getElementById('setupSection');
const gameActive = document.getElementById('gameActive');
const loadingOverlay = document.getElementById('loadingOverlay');
const gameCodeHeader = document.getElementById('gameCodeHeader');

// Initialize Firebase and start the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    try {
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        
        updateConnectionStatus('connecting');
        
        // Simple connection test
        database.ref('.info/connected').on('value', function(snapshot) {
            if (snapshot.val() === true) {
                updateConnectionStatus('online');
                if (!document.querySelector('.events-setup')) {
                    setupEventListeners();
                }
            } else {
                updateConnectionStatus('offline');
            }
        });
        
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        updateConnectionStatus('offline');
        // Still setup event listeners for offline functionality
        setupEventListeners();
    }
}

function setupEventListeners() {
    // Mark as setup to prevent duplicate listeners
    document.body.classList.add('events-setup');
    
    // Main navigation
    document.getElementById('startBtn').addEventListener('click', startGame);
    
    // Player setup
    document.getElementById('setNameBtn').addEventListener('click', setPlayerName);
    document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setPlayerName();
    });
    
    // Game creation/joining
    document.getElementById('createGameBtn').addEventListener('click', createGame);
    document.getElementById('joinGameBtn').addEventListener('click', joinGame);
    document.getElementById('newGameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createGame();
    });
    document.getElementById('joinCodeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
    
    // Game controls
    document.getElementById('resetMyProgressBtn').addEventListener('click', resetMyProgress);
    document.getElementById('leaveGameBtn').addEventListener('click', leaveGame);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('copyCodeBtn').addEventListener('click', copyGameCode);
    document.getElementById('shareCodeBtn').addEventListener('click', shareGameCode);
    document.getElementById('inviteNewBtn').addEventListener('click', inviteNewPlayer);
    
    // Check for saved player name
    const savedName = localStorage.getItem('platequest_player_name');
    if (savedName) {
        document.getElementById('playerNameInput').value = savedName;
    }
    
    // Initialize dark mode
    if (localStorage.getItem('platequest_dark_mode') === 'true') {
        document.body.classList.add('dark');
        document.getElementById('darkModeBtn').textContent = '☀️ Light Mode';
    }
}

function startGame() {
    splash.style.display = 'none';
    game.style.display = 'block';
    
    // Auto-focus on name input if empty
    const nameInput = document.getElementById('playerNameInput');
    if (!nameInput.value.trim()) {
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
    document.getElementById('createGameCard').style.opacity = '1';
    document.getElementById('joinGameCard').style.opacity = '1';
    document.querySelector('#newGameInput').disabled = false;
    document.querySelector('#joinCodeInput').disabled = false;
    document.querySelector('#createGameBtn').disabled = false;
    document.querySelector('#joinGameBtn').disabled = false;
}

async function createGame() {
    if (!currentPlayer) {
        showToast('Please set your name first! 👤', 'error');
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
        
        showToast(`Pack "${gameName}" created! 🐺`, 'success');
        
    } catch (error) {
        console.error('Error creating game:', error);
        showToast('Failed to create pack. Please try again.', 'error');
        hideLoading();
    }
}

async function joinGame() {
    if (!currentPlayer) {
        showToast('Please set your name first! 👤', 'error');
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
        showToast('Pack code must be 6 characters!', 'error');
        return;
    }
    
    showLoading('Joining pack...');
    
    try {
        currentGameCode = code;
        currentGameRef = database.ref(`games/${currentGameCode}`);
        
        // Check if game exists
        const snapshot = await currentGameRef.once('value');
        if (!snapshot.exists()) {
            showToast('Pack not found! Please check the code.', 'error');
            hideLoading();
            return;
        }
        
        const game = snapshot.val();
        
        // Check if game is full (max 8 players)
        const playerCount = Object.keys(game.players || {}).length;
        if (playerCount >= 8) {
            showToast('Pack is full! Maximum 8 players allowed.', 'error');
            hideLoading();
            return;
        }
        
        // Check if name is already taken
        const existingPlayers = Object.values(game.players || {});
        if (existingPlayers.some(p => p.name === currentPlayer.name)) {
            showToast('Name already taken in this pack! Please choose a different name.', 'error');
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
        showToast('Failed to join pack. Please try again.', 'error');
        hideLoading();
    }
}

function setupGameListeners() {
    if (!currentGameRef) return;
    
    // Listen to game data changes
    currentGameRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            showToast('Pack was deleted by the host.', 'error');
            returnToSetup();
            return;
        }
        
        gameData = snapshot.val();
        playersData = gameData.players || {};
        
        updateGameUI();
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
        
        // Try to load flag image, fallback to abbreviation
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
    
    try {
        const myStatesRef = currentGameRef.child(`players/${currentPlayer.id}/states`);
        const currentStates = playersData[currentPlayer.id]?.states || [];
        
        let newStates;
        if (currentlySelected) {
            // Remove state
            newStates = currentStates.filter(s => s !== stateName);
        } else {
            // Add state
            newStates = [...currentStates, stateName];
            showToast(`Found ${stateName}! 🎉`, 'success');
            
            // Check for completion
            if (newStates.length === 50) {
                showToast('🏆 AMAZING! You found all 50 states!', 'success');
            }
        }
        
        await myStatesRef.set(newStates);
        
    } catch (error) {
        console.error('Error updating state:', error);
        showToast('Failed to update progress.', 'error');
    }
}

async function resetMyProgress() {
    if (!confirm('Reset all your spotted plates? This cannot be undone.')) return;
    
    try {
        await currentGameRef.child(`players/${currentPlayer.id}/states`).set([]);
        showToast('Your progress has been reset.', 'info');
        
    } catch (error) {
        console.error('Error resetting progress:', error);
        showToast('Failed to reset progress.', 'error');
    }
}

async function leaveGame() {
    if (!confirm('Leave this pack?')) return;
    
    try {
        await currentGameRef.child(`players/${currentPlayer.id}`).remove();
        showToast('Left the pack.', 'info');
        returnToSetup();
        
    } catch (error) {
        console.error('Error leaving game:', error);
        showToast('Failed to leave pack.', 'error');
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
    document.getElementById('newGameInput').value = '';
    document.getElementById('joinCodeInput').value = '';
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
                statusText.textContent = 'Disconnected';
                break;
            case 'connecting':
                statusText.textContent = 'Connecting...';
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