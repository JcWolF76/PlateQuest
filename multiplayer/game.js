// Firebase Configuration
// You'll replace this with your actual Firebase config
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
const lobbySection = document.getElementById('lobbySection');
const gameActive = document.getElementById('gameActive');
const gameOver = document.getElementById('gameOver');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize Firebase and start the app
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        updateConnectionStatus('connecting');
        
        // Test connection
        await database.ref('.info/connected').once('value');
        updateConnectionStatus('online');
        
        setupEventListeners();
        
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        updateConnectionStatus('offline');
        showToast('Failed to connect to multiplayer servers. Please check your internet connection.', 'error');
        
        // Fallback to offline mode
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 3000);
    }
}

function setupEventListeners() {
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
    
    // Lobby controls
    document.getElementById('startGameBtn').addEventListener('click', startGameplay);
    document.getElementById('leaveLobbyBtn').addEventListener('click', leaveLobby);
    document.getElementById('copyGameCodeBtn').addEventListener('click', copyGameCode);
    
    // Game controls
    document.getElementById('resetMyProgressBtn').addEventListener('click', resetMyProgress);
    document.getElementById('leaveGameBtn').addEventListener('click', leaveGame);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('newGameBtn').addEventListener('click', newGame);
    
    // Check for saved player name
    const savedName = localStorage.getItem('platequest_player_name');
    if (savedName) {
        document.getElementById('playerNameInput').value = savedName;
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
        showToast('Please enter your name!', 'error');
        nameInput.focus();
        return;
    }
    
    if (name.length > 20) {
        showToast('Name must be 20 characters or less!', 'error');
        return;
    }
    
    currentPlayer = {
        id: generatePlayerId(),
        name: name,
        joinedAt: Date.now()
    };
    
    localStorage.setItem('platequest_player_name', name);
    showToast(`Welcome, ${name}!`, 'success');
    
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
        showToast('Please set your name first!', 'error');
        return;
    }
    
    const gameNameInput = document.getElementById('newGameInput');
    const gameName = gameNameInput.value.trim();
    
    if (!gameName) {
        showToast('Please enter a game name!', 'error');
        gameNameInput.focus();
        return;
    }
    
    showLoading('Creating game...');
    
    try {
        currentGameCode = generateGameCode();
        currentGameRef = database.ref(`games/${currentGameCode}`);
        
        const gameData = {
            name: gameName,
            code: currentGameCode,
            host: currentPlayer.id,
            status: 'lobby',
            createdAt: Date.now(),
            players: {
                [currentPlayer.id]: {
                    ...currentPlayer,
                    isHost: true,
                    states: []
                }
            },
            gameStates: {}
        };
        
        await currentGameRef.set(gameData);
        
        setupGameListeners();
        showLobby();
        hideLoading();
        
        showToast('Game created successfully!', 'success');
        
    } catch (error) {
        console.error('Error creating game:', error);
        showToast('Failed to create game. Please try again.', 'error');
        hideLoading();
    }
}

async function joinGame() {
    if (!currentPlayer) {
        showToast('Please set your name first!', 'error');
        return;
    }
    
    const codeInput = document.getElementById('joinCodeInput');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) {
        showToast('Please enter a game code!', 'error');
        codeInput.focus();
        return;
    }
    
    if (code.length !== 6) {
        showToast('Game code must be 6 characters!', 'error');
        return;
    }
    
    showLoading('Joining game...');
    
    try {
        currentGameCode = code;
        currentGameRef = database.ref(`games/${currentGameCode}`);
        
        // Check if game exists
        const snapshot = await currentGameRef.once('value');
        if (!snapshot.exists()) {
            showToast('Game not found! Please check the code.', 'error');
            hideLoading();
            return;
        }
        
        const game = snapshot.val();
        
        // Check if game is full (max 8 players)
        const playerCount = Object.keys(game.players || {}).length;
        if (playerCount >= 8) {
            showToast('Game is full! Maximum 8 players allowed.', 'error');
            hideLoading();
            return;
        }
        
        // Check if name is already taken
        const existingPlayers = Object.values(game.players || {});
        if (existingPlayers.some(p => p.name === currentPlayer.name)) {
            showToast('Name already taken in this game! Please choose a different name.', 'error');
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
        showLobby();
        hideLoading();
        
        showToast(`Joined "${game.name}"!`, 'success');
        
    } catch (error) {
        console.error('Error joining game:', error);
        showToast('Failed to join game. Please try again.', 'error');
        hideLoading();
    }
}

function setupGameListeners() {
    if (!currentGameRef) return;
    
    // Listen to game data changes
    currentGameRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            showToast('Game was deleted by the host.', 'error');
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
            updateConnectionStatus('online');
        } else {
            updateConnectionStatus('offline');
            showToast('Lost connection to server...', 'error');
        }
    });
}

function updateGameUI() {
    if (!gameData) return;
    
    // Update lobby if in lobby mode
    if (gameData.status === 'lobby') {
        updateLobbyDisplay();
    }
    
    // Update active game if playing
    if (gameData.status === 'playing') {
        updateGameDisplay();
    }
    
    // Check for game completion
    if (gameData.status === 'completed') {
        showGameOver();
    }
}

function showLobby() {
    setupSection.style.display = 'none';
    lobbySection.style.display = 'block';
    gameActive.style.display = 'none';
    gameOver.style.display = 'none';
    
    updateLobbyDisplay();
}

function updateLobbyDisplay() {
    if (!gameData) return;
    
    // Update game name and code
    document.getElementById('lobbyGameName').textContent = gameData.name;
    document.getElementById('gameCodeDisplay').textContent = currentGameCode;
    
    // Update players list
    const playersContainer = document.getElementById('playersContainer');
    playersContainer.innerHTML = '';
    
    Object.values(playersData).forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = `player-card ${player.isHost ? 'host' : ''}`;
        
        playerCard.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-status">${player.isHost ? '👑 Host' : '👤 Player'}</div>
        `;
        
        playersContainer.appendChild(playerCard);
    });
    
    // Show/hide start button based on host status
    const isHost = playersData[currentPlayer.id]?.isHost;
    document.getElementById('startGameBtn').style.display = isHost ? 'block' : 'none';
}

async function startGameplay() {
    if (!gameData || !playersData[currentPlayer.id]?.isHost) return;
    
    try {
        await currentGameRef.child('status').set('playing');
        showToast('Game started! Good luck everyone!', 'success');
        
    } catch (error) {
        console.error('Error starting game:', error);
        showToast('Failed to start game.', 'error');
    }
}

function showGameplay() {
    setupSection.style.display = 'none';
    lobbySection.style.display = 'none';
    gameActive.style.display = 'block';
    gameOver.style.display = 'none';
    
    renderStates();
    updateGameDisplay();
}

function updateGameDisplay() {
    if (gameData.status === 'playing' && gameActive.style.display === 'none') {
        showGameplay();
    }
    
    updateLiveScores();
    updateMyProgress();
    updateStatesDisplay();
}

function updateLiveScores() {
    const scoresContainer = document.getElementById('scoresContainer');
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
        
        scoreCard.innerHTML = `
            <div class="score-player-name">${isMe ? 'YOU' : player.name} ${index === 0 && player.count > 0 ? '👑' : ''}</div>
            <div class="score-count">${player.count}</div>
            <div class="score-percentage">(${player.percentage}%)</div>
        `;
        
        scoresContainer.appendChild(scoreCard);
    });
}

function updateMyProgress() {
    const myStates = playersData[currentPlayer.id]?.states || [];
    const count = myStates.length;
    const percentage = Math.round((count / 50) * 100);
    
    document.getElementById('scoreDisplay').textContent = `Your Progress: ${count} of 50 plates (${percentage}%)`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

function renderStates() {
    const statesGrid = document.getElementById('statesGrid');
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
            <div class="state-info">
                <div class="state-name">${state.name}</div>
                <div class="state-abbr">${state.abbr}</div>
            </div>
            <div class="state-flag">${state.abbr}</div>
            ${foundByOther ? `<div class="found-by-indicator">${foundByOther.charAt(0)}</div>` : ''}
        `;
        
        card.addEventListener('click', () => toggleState(state.name, foundByMe));
        
        // Add animation delay
        card.style.animationDelay = `${index * 0.02}s`;
        
        statesGrid.appendChild(card);
    });
}

function updateStatesDisplay() {
    // Re-render states to update who found what
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
        }
        
        await myStatesRef.set(newStates);
        
        // Add celebration effect for new finds
        if (!currentlySelected) {
            showToast(`Found ${stateName}! 🎉`, 'success');
            
            // Check for completion
            if (newStates.length === 50) {
                showToast('🏆 AMAZING! You found all 50 states!', 'success');
            }
        }
        
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

async function leaveLobby() {
    if (!confirm('Leave this game?')) return;
    
    try {
        // If host is leaving, delete the entire game
        if (playersData[currentPlayer.id]?.isHost) {
            await currentGameRef.remove();
            showToast('Game deleted.', 'info');
        } else {
            // Just remove this player
            await currentGameRef.child(`players/${currentPlayer.id}`).remove();
            showToast('Left the game.', 'info');
        }
        
        returnToSetup();
        
    } catch (error) {
        console.error('Error leaving game:', error);
        showToast('Failed to leave game.', 'error');
    }
}

async function leaveGame() {
    if (!confirm('Leave this game? Your progress will be saved.')) return;
    
    try {
        await currentGameRef.child(`players/${currentPlayer.id}`).remove();
        showToast('Left the game.', 'info');
        returnToSetup();
        
    } catch (error) {
        console.error('Error leaving game:', error);
        showToast('Failed to leave game.', 'error');
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
    
    // Show setup section
    setupSection.style.display = 'block';
    lobbySection.style.display = 'none';
    gameActive.style.display = 'none';
    gameOver.style.display = 'none';
    
    // Clear inputs
    document.getElementById('newGameInput').value = '';
    document.getElementById('joinCodeInput').value = '';
}

function showGameOver() {
    gameActive.style.display = 'none';
    gameOver.style.display = 'block';
    
    // Show final results
    const finalResults = document.getElementById('finalResults');
    const scores = Object.values(playersData).map(player => ({
        ...player,
        count: (player.states || []).length
    })).sort((a, b) => b.count - a.count);
    
    let resultsHTML = '<h3>Final Results:</h3>';
    scores.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        resultsHTML += `<p>${medal} ${player.name}: ${player.count} states</p>`;
    });
    
    finalResults.innerHTML = resultsHTML;
}

function newGame() {
    returnToSetup();
}

function copyGameCode() {
    navigator.clipboard.writeText(currentGameCode).then(() => {
        showToast('Game code copied!', 'success');
    }).catch(() => {
        showToast('Failed to copy code. Code: ' + currentGameCode, 'error');
    });
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const btn = document.getElementById('darkModeBtn');
    btn.textContent = document.body.classList.contains('dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
    
    // Save preference
    localStorage.setItem('platequest_dark_mode', document.body.classList.contains('dark'));
}

function updateConnectionStatus(status) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusDot.className = `status-dot ${status}`;
    
    switch (status) {
        case 'online':
            statusText.textContent = 'Connected';
            break;
        case 'offline':
            statusText.textContent = 'Offline';
            break;
        case 'connecting':
            statusText.textContent = 'Connecting...';
            break;
    }
}

function showLoading(text = 'Loading...') {
    loadingOverlay.style.display = 'flex';
    document.querySelector('.loading-text').textContent = text;
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInToast 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
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

// Initialize dark mode from saved preference
if (localStorage.getItem('platequest_dark_mode') === 'true') {
    document.body.classList.add('dark');
    setTimeout(() => {
        const btn = document.getElementById('darkModeBtn');
        if (btn) btn.textContent = '☀️ Light Mode';
    }, 100);
}